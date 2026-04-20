import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck, MapPin, ArrowRight, ShieldCheck, Tag, Plus, Copy, Zap, ChevronDown, Trash2, Clock, HelpCircle, X, Wallet } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { copyToClipboard } from '../lib/clipboard';
import { Address } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import PriceDisplay from '../components/PriceDisplay';
import { FloatingInput } from '../components/FloatingInput';

export default function Checkout() {
  const { cart, placeOrder, discount, applyDiscountCode, formatPrice, removeDiscount, showToast, user, updateUser, language, settings, shippingZones } = useStore();
  const navigate = useNavigate();

  const allCities = useMemo(() => {
    const zoneCities = shippingZones.filter(z => z.isActive).flatMap(z => z.cities);
    if (zoneCities.length > 0) {
      return Array.from(new Set(zoneCities)).sort();
    }
    // Fallback if no shipping zones are defined
    return ['صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'المكلا', 'حجة', 'صعدة', 'البيضاء', 'مأرب', 'عمران', 'الجوف', 'المهرة', 'سقطرى', 'شبوة', 'أبين', 'لحج', 'الضالع', 'ريمة', 'المحويت'].sort();
  }, [shippingZones]);

  useEffect(() => {
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً لإتمام عملية الشراء', 'error');
      navigate('/auth?redirect=/checkout');
    }
  }, [user, navigate, showToast]);

  const stepContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [formErrors, setFormErrors] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [showAddressDeleteConfirm, setShowAddressDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showExampleImage, setShowExampleImage] = useState(false);
  const [bnplProvider, setBnplProvider] = useState<'tabby' | 'tamara'>('tabby');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: 'صنعاء',
    phone: '',
    countryCode: '+967',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    paymentReference: '',
    paymentProof: '',
    deliveryInstructions: ''
  });

  useEffect(() => {
    if (!hasInitialized.current && user) {
      let initialPhone = user.phone || '';
      if (initialPhone.startsWith('+967')) initialPhone = initialPhone.substring(4);
      
      const accountName = user.displayName || user.name || '';
      
      if (user.addresses && user.addresses.length > 0) {
        const firstAddress = user.addresses[0];
        setSelectedAddressId(firstAddress.id);
        
        let firstAddrPhone = firstAddress.phone || '';
        if (firstAddrPhone.startsWith('+967')) firstAddrPhone = firstAddrPhone.substring(4);

        setFormData(prev => ({
          ...prev,
          firstName: accountName || `${firstAddress.firstName} ${firstAddress.lastName || ''}`.trim(),
          lastName: '',
          address: firstAddress.address,
          city: firstAddress.city,
          phone: firstAddrPhone,
          countryCode: firstAddress.countryCode || '+967'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          firstName: accountName,
          lastName: '',
          phone: initialPhone,
          countryCode: user.countryCode || '+967',
          address: user.address || ''
        }));
      }
      hasInitialized.current = true;
    }
  }, [user]);

  const handleAddressSelect = useCallback((addr: Address) => {
    setSelectedAddressId(addr.id);
    const accountName = user?.displayName || user?.name || '';
    setFormData(prev => ({
      ...prev,
      firstName: accountName || `${addr.firstName} ${addr.lastName || ''}`.trim(),
      lastName: '',
      address: addr.address,
      city: addr.city,
      phone: addr.phone,
      countryCode: addr.countryCode || '+967'
    }));
    setFieldErrors([]);
  }, []);

  const handleNewAddressSelect = useCallback(() => {
    setSelectedAddressId('new');
    const accountName = user?.displayName || user?.name || '';
    setFormData(prev => ({
      ...prev,
      firstName: accountName,
      lastName: '',
      address: '',
      city: allCities[0] || 'صنعاء',
      phone: '',
      countryCode: '+967'
    }));
    setFieldErrors([]);
  }, [user, allCities]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors.includes(name)) {
      setFieldErrors(prev => prev.filter(f => f !== name));
    }
  }, [fieldErrors]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0), [cart]);

  const activePaymentMethods = useMemo(() => {
    return (settings.paymentMethods || []).filter(m => m.isActive);
  }, [settings.paymentMethods]);

  const selectedPaymentMethod = useMemo(() => {
    return activePaymentMethods.find(m => m.id === paymentMethod);
  }, [activePaymentMethods, paymentMethod]);

  useEffect(() => {
    if (activePaymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(activePaymentMethods[0].id);
    }
  }, [activePaymentMethods, paymentMethod]);
  const shipping = useMemo(() => {
    if (subtotal === 0 || shippingMethod !== 'delivery') return 0;
    
    // Find if the selected city is in any shipping zone
    const zone = shippingZones.find(z => z.isActive && z.cities.includes(formData.city));
    
    if (zone) {
      // Check for free shipping threshold in the zone
      if (zone.freeThreshold && subtotal >= zone.freeThreshold) return 0;
      return zone.rate;
    }
    
    // Default to global shipping settings if no zone matches
    if (settings.freeShippingThreshold && subtotal >= settings.freeShippingThreshold) return 0;
    return settings.shippingFee;
  }, [subtotal, shippingMethod, formData.city, shippingZones, settings]);
  
  const calculateDiscount = useCallback(() => {
    if (!discount.code) return 0;
    if (discount.type === 'percentage') {
      return subtotal * (discount.amount / 100);
    }
    return Math.min(discount.amount, subtotal);
  }, [discount, subtotal]);

  const discountAmount = useMemo(() => calculateDiscount(), [calculateDiscount]);
  const total = useMemo(() => Math.max(0, subtotal + shipping - discountAmount), [subtotal, shipping, discountAmount]);

  useEffect(() => {
    if (allCities.length > 0 && !allCities.includes(formData.city)) {
      setFormData(prev => ({ ...prev, city: allCities[0] }));
    }
  }, [allCities, formData.city]);

  const validateStep = useCallback((currentStep: number) => {
    const errors: string[] = [];
    if (currentStep === 1) {
      const isAccountNameLocked = !!user && !!(user.displayName || user.name);
      if (!isAccountNameLocked) {
        const nameParts = formData.firstName.trim().split(/\s+/);
        if (nameParts.length < 2) errors.push('firstName');
      } else {
        if (!formData.firstName.trim()) errors.push('firstName');
      }
      if (!formData.address.trim()) errors.push('address');
      const cleanPhone = formData.phone.replace(/\s+/g, '');
      if (!cleanPhone || !/^\d{9}$/.test(cleanPhone)) errors.push('phone');
    } else if (currentStep === 3) {
      if (!paymentMethod) {
        errors.push('paymentMethod');
      } else if (selectedPaymentMethod && selectedPaymentMethod.type !== 'wallet') {
        const cleanRef = formData.paymentReference.trim();
        if (!cleanRef || !/^\d{6,15}$/.test(cleanRef)) errors.push('paymentReference');
        
        if (selectedPaymentMethod.requiresProof && !formData.paymentProof) {
          errors.push('paymentProof');
        }
      } else if (paymentMethod === 'wallet' || (selectedPaymentMethod && selectedPaymentMethod.type === 'wallet')) {
        if (!user || (user.walletBalance || 0) < total) {
          errors.push('insufficientBalance');
        }
      }
    }
    
    setFieldErrors(errors);
    return errors.length === 0;
  }, [formData, paymentMethod, user, total, selectedPaymentMethod]);

  const handleNextStep = useCallback((currentStep: number) => {
    if (validateStep(currentStep)) {
      if (currentStep === 1 && selectedAddressId === 'new' && saveAddress && user) {
        const nameParts = formData.firstName.trim().split(/\s+/);
        const newAddress: Address = {
          id: crypto.randomUUID(),
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' '),
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          countryCode: formData.countryCode
        };
        updateUser({
          ...user,
          addresses: [...(user.addresses || []), newAddress]
        });
        setSelectedAddressId(newAddress.id);
      }
      setStep(currentStep + 1);
      setFormErrors(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormErrors(true);
      setTimeout(() => setFormErrors(false), 500);
      showToast('يرجى التأكد من تعبئة جميع الحقول بشكل صحيح', 'error');
    }
  }, [validateStep, selectedAddressId, saveAddress, user, formData, updateUser, showToast]);

  const handlePlaceOrder = useCallback(async () => {
    if (!validateStep(3)) {
      setFormErrors(true);
      setTimeout(() => setFormErrors(false), 500);
      if (!paymentMethod) {
        showToast('يرجى اختيار طريقة الدفع', 'error');
      } else if (selectedPaymentMethod && selectedPaymentMethod.type !== 'wallet') {
        if (selectedPaymentMethod.requiresProof && !formData.paymentProof) {
          showToast('يرجى إرفاق صورة إثبات الدفع', 'error');
        } else {
          showToast('يرجى إدخال رقم مرجع صحيح (أرقام فقط)', 'error');
        }
      } else if (paymentMethod === 'wallet') {
        showToast('رصيد المحفظة غير كافٍ لإتمام الطلب', 'error', {
          action: {
            label: 'إيداع',
            onClick: () => navigate('/profile', { state: { view: 'wallet' } })
          }
        });
      }
      return;
    }

    setIsProcessing(true);
    
    // Process order instantly
    setIsProcessing(false);
    
    let methodLabel = selectedPaymentMethod?.name || (paymentMethod === 'wallet' ? 'المحفظة الرقمية' : 'وسيلة دفع');

    const paymentRef = selectedPaymentMethod ? formData.paymentReference : undefined;
    const paymentProof = selectedPaymentMethod?.requiresProof ? formData.paymentProof : undefined;
    
    const newOrderId = await placeOrder(
      methodLabel, 
      shippingMethod, 
      paymentRef,
      formData.firstName.trim(),
      `${formData.countryCode}${formData.phone}`,
      `${formData.address}, ${formData.city}`,
      formData.city,
      formData.deliveryInstructions,
      paymentProof
    );
    
    if (!newOrderId) return;

    setLastOrderId(newOrderId);
    setOrderComplete(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 1000
    });
  }, [validateStep, paymentMethod, formData, placeOrder, shippingMethod, showToast, navigate]);

  const handleApplyCoupon = useCallback(() => {
    if (!couponInput.trim()) {
      showToast('يرجى إدخال كود الخصم', 'error');
      return;
    }
    setIsApplyingCoupon(true);
    
    const success = applyDiscountCode(couponInput);
    setIsApplyingCoupon(false);
    if (success) {
      setCouponInput('');
    }
  }, [couponInput, applyDiscountCode, showToast]);

  const handleToggleSummary = useCallback(() => setIsSummaryOpen(prev => !prev), []);
  const handleToggleCouponInput = useCallback(() => setShowCouponInput(prev => !prev), []);
  const handleTogglePaymentDetails = useCallback(() => setShowPaymentDetails(prev => !prev), []);
  const handleSetShippingMethod = useCallback((method: 'delivery' | 'pickup') => setShippingMethod(method), []);
  const handleSetPaymentMethod = useCallback((method: typeof paymentMethod) => setPaymentMethod(method), []);
  const handleSetBnplProvider = useCallback((provider: 'tabby' | 'tamara') => setBnplProvider(provider), []);

  const handleOpenAddressDeleteConfirm = useCallback((id: string) => {
    setAddressToDelete(id);
    setShowAddressDeleteConfirm(true);
  }, []);

  const handleCloseAddressDeleteConfirm = useCallback(() => {
    setShowAddressDeleteConfirm(false);
    setAddressToDelete(null);
  }, []);

  const handleConfirmAddressDelete = useCallback(() => {
    if (addressToDelete && user) {
      const newAddresses = user.addresses?.filter(a => a.id !== addressToDelete);
      updateUser({ ...user, addresses: newAddresses } as any);
      if (selectedAddressId === addressToDelete) {
        handleNewAddressSelect();
      }
      showToast('تم حذف العنوان بنجاح');
    }
    setShowAddressDeleteConfirm(false);
    setAddressToDelete(null);
  }, [addressToDelete, user, updateUser, selectedAddressId, handleNewAddressSelect, showToast]);

  const handlePrevStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  }, [step, navigate]);

  const handleCopyOrderId = useCallback(async () => {
    const success = await copyToClipboard(lastOrderId);
    if (success) showToast('تم نسخ رقم الطلب');
  }, [lastOrderId, showToast]);

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }), []);

  if (cart.length === 0 && !orderComplete) {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]"
      >
        <motion.h2 variants={itemVariants} className="text-xl font-bold text-carbon mb-4">سلة التسوق فارغة</motion.h2>
        <motion.div variants={itemVariants}>
          <Link to="/" className="text-solar hover:underline flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            العودة للتسوق
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  if (orderComplete) {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-3xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center text-center"
      >
        <motion.div 
          variants={itemVariants}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-solar rounded-full flex items-center justify-center mb-6 shadow-xl shadow-solar/20"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-white"
          >
            <motion.circle 
              cx="12" cy="12" r="10" 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.path 
              d="M8 12l3 3 5-5" 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
            />
          </motion.svg>
        </motion.div>
        <motion.h1 
          variants={itemVariants}
          className="text-2xl font-black text-carbon mb-4"
        >
          تم تأكيد طلبك بنجاح!
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-titanium/60 mb-6 text-lg max-w-md"
        >
          سيتم إرسال تفاصيل الطلب والتواصل معك عبر واتساب لتأكيد الطلب وترتيب طريقة الاستلام أو التوصيل.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 mb-8 w-full max-w-sm"
        >
          <div className="text-right">
            <div className="text-[10px] text-titanium/40 font-bold mb-1">رقم الطلب</div>
            <div className="font-mono font-bold text-carbon text-lg tracking-wider">{lastOrderId}</div>
          </div>
          <button 
            onClick={async () => {
              const success = await copyToClipboard(lastOrderId);
              if (success) showToast('تم نسخ رقم الطلب');
            }}
            className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-slate-900 hover:text-slate-900 transition-colors flex items-center justify-center text-titanium/60"
            title="نسخ رقم الطلب"
          >
            <Copy className="w-5 h-5" />
          </button>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              to={`/track-order?id=${lastOrderId}`} 
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
            >
              تتبع الطلب
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              to="/" 
              className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-8 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              العودة للرئيسية
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#F8F9FB] max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-32 lg:pb-12"
    >
      {/* Mobile Collapsible Summary */}
      <div className="lg:hidden mb-6">
        <button 
          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-titanium/60" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-titanium/40 font-bold">ملخص الطلب</p>
              <div className="text-sm font-bold flex items-center gap-1 justify-end">
                <span className="text-carbon">{cart.length} منتجات • </span>
                <PriceDisplay price={total} />
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isSummaryOpen ? 180 : 0 }}
          >
            <ChevronDown className="w-5 h-5 text-titanium/40" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isSummaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/50 backdrop-blur-sm border-x border-b border-slate-100 rounded-b-2xl p-4 space-y-4">
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.product?.image || undefined} alt={item.product?.name || 'محذوف'} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-carbon truncate">{item.product?.name || 'منتج محذوف'}</p>
                        <div className="text-[10px] text-titanium/40 flex items-center gap-1">
                          الكمية: {item.quantity} • <PriceDisplay price={(item.product?.price || 0) * item.quantity} numberClassName="text-slate-900/60" currencyClassName="text-slate-900/40" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-titanium/60">المجموع الفرعي</span>
                    <span className="font-bold"><PriceDisplay price={subtotal} /></span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-titanium/60">التوصيل</span>
                    <span className="font-bold">
                      {shipping === 0 ? 'مجاني' : <PriceDisplay price={shipping} />}
                    </span>
                  </div>
                  {discount.code && (
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>خصم ({discount.code})</span>
                      <span className="font-bold flex items-center gap-1">
                        - <PriceDisplay price={discountAmount} numberClassName="text-emerald-600" currencyClassName="text-emerald-600/70" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
        <ConfirmationModal
          isOpen={showAddressDeleteConfirm}
          onClose={() => {
            setShowAddressDeleteConfirm(false);
            setAddressToDelete(null);
          }}
          onConfirm={() => {
            if (addressToDelete && user) {
              const newAddresses = user.addresses?.filter(a => a.id !== addressToDelete);
              updateUser({ ...user, addresses: newAddresses } as any);
              if (selectedAddressId === addressToDelete) {
                handleNewAddressSelect();
              }
              showToast('تم حذف العنوان بنجاح');
            }
            setShowAddressDeleteConfirm(false);
            setAddressToDelete(null);
          }}
          title="حذف العنوان"
          message="هل أنت متأكد أنك تريد حذف هذا العنوان؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
        />
        {/* Main Checkout Flow */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between">
            <motion.h1 
              variants={itemVariants}
              className="text-xl sm:text-2xl font-black text-carbon"
            >
              إتمام الطلب
            </motion.h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className="text-xs font-bold text-titanium/60 bg-white border border-slate-100 hover:border-slate-200 px-4 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-2 shadow-sm"
              >
                <ArrowRight className="w-4 h-4" />
                {step > 1 ? 'رجوع' : 'إلغاء'}
              </button>
              <div className="hidden sm:flex items-center gap-2 text-titanium/40 text-sm font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>تسوق آمن 100%</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <motion.div variants={itemVariants} className="relative flex items-center justify-between max-w-md mx-auto lg:mx-0 mb-8 sm:mb-12">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
            <motion.div 
              className="absolute right-0 top-1/2 h-1 bg-slate-900 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
              initial={{ width: 0 }}
              animate={{ width: `${((step - 1) / 3) * 100}%` }}
            ></motion.div>
            
            {[
              { num: 1, label: 'العنوان', icon: MapPin },
              { num: 2, label: 'التوصيل', icon: Truck },
              { num: 3, label: 'الدفع', icon: CreditCard },
              { num: 4, label: 'المراجعة', icon: CheckCircle }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-1.5 sm:gap-2 bg-[#F8F9FB] px-2 sm:px-3">
                <motion.div 
                  animate={{ 
                    backgroundColor: step >= s.num ? '#0F172A' : '#ffffff',
                    color: step >= s.num ? '#ffffff' : '#94a3b8',
                    borderColor: step >= s.num ? '#0F172A' : '#e2e8f0',
                    scale: step === s.num ? 1.1 : 1
                  }}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                    step >= s.num ? 'shadow-lg shadow-slate-900/20' : ''
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </motion.div>
                <span className={`text-[10px] sm:text-xs font-bold transition-colors ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Step Content */}
          <motion.div 
            ref={stepContainerRef}
            variants={itemVariants} 
            className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-10 shadow-2xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-carbon">معلومات التوصيل</h2>
                      <p className="text-xs text-titanium/60">أدخل تفاصيل العنوان بدقة لضمان سرعة التوصيل</p>
                    </div>
                  </div>

                  {user?.addresses && user.addresses.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-carbon">العناوين المحفوظة</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {user.addresses.map(addr => (
                          <div 
                            key={addr.id}
                            onClick={() => handleAddressSelect(addr)}
                            className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all relative group/addr ${selectedAddressId === addr.id ? 'border-slate-900 bg-slate-900/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-carbon">{addr.firstName} {addr.lastName}</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddressToDelete(addr.id);
                                    setShowAddressDeleteConfirm(true);
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center sm:opacity-0 sm:group-hover/addr:opacity-100 transition-opacity hover:bg-red-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {selectedAddressId === addr.id && <CheckCircle className="w-5 h-5 text-slate-900" />}
                              </div>
                            </div>
                            <p className="text-xs text-titanium/60 mb-1">{addr.address}, {addr.city}</p>
                            <p className="text-xs text-titanium/60" dir="ltr">{addr.phone}</p>
                          </div>
                        ))}
                        <div 
                          onClick={handleNewAddressSelect}
                          className={`p-3 sm:p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[100px] ${selectedAddressId === 'new' ? 'border-slate-900 bg-slate-900/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}
                        >
                          <Plus className={`w-6 h-6 ${selectedAddressId === 'new' ? 'text-slate-900' : 'text-slate-400'}`} />
                          <span className={`text-sm font-bold ${selectedAddressId === 'new' ? 'text-slate-900' : 'text-slate-500'}`}>إضافة عنوان جديد</span>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-sm font-bold text-slate-700">تعليمات التوصيل (اختياري)</label>
                          <textarea 
                            name="deliveryInstructions"
                            value={formData.deliveryInstructions}
                            onChange={handleInputChange}
                            placeholder="مثلاً: بجوار المسجد، أو الاتصال قبل الوصول..."
                            className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-slate-900/10 focus:bg-white focus:border-slate-900 outline-none transition-all duration-300 min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {selectedAddressId === 'new' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${formErrors ? 'animate-shake' : ''}`}
                      >
                        <div className="space-y-2 sm:col-span-2">
                          <FloatingInput 
                            label={!!user && !!(user.displayName || user.name) ? "الاسم (يطابق حسابك)" : "الاسم الكامل (اسمين على الأقل)"}
                            type="text" 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={!!user && !!(user.displayName || user.name)}
                            bgClass={!!user && !!(user.displayName || user.name) ? "bg-slate-100" : "bg-slate-50"}
                            className={fieldErrors.includes('firstName') ? 'border-red-500 ring-4 ring-red-500/10' : (!!user && !!(user.displayName || user.name) ? 'cursor-not-allowed opacity-80' : '')} 
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <FloatingInput 
                            label="العنوان بالتفصيل"
                            type="text" 
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            bgClass="bg-slate-50"
                            className={fieldErrors.includes('address') ? 'border-red-500 ring-4 ring-red-500/10' : ''} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-titanium/80 mr-1">المدينة</label>
                          <select 
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-slate-900/10 focus:bg-white focus:border-slate-900 outline-none transition-all duration-300 appearance-none"
                          >
                            {allCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <FloatingInput 
                            label="رقم الجوال"
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            bgClass="bg-slate-50"
                            className={`tracking-widest ${fieldErrors.includes('phone') ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} 
                            dir="ltr" 
                            startElement={
                              <div className="flex items-center justify-center bg-slate-100 border-r border-slate-200 h-full text-slate-700 font-bold px-2 relative group/select">
                                <select 
                                  name="countryCode"
                                  value={formData.countryCode}
                                  onChange={handleInputChange}
                                  className="bg-transparent border-none outline-none text-titanium/60 font-bold text-sm cursor-pointer appearance-none pr-6 pl-2 h-full"
                                  dir="ltr"
                                >
                                  <option value="+967">🇾🇪 +967</option>
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-1 text-slate-400 pointer-events-none group-hover/select:text-slate-900 transition-colors" />
                              </div>
                            }
                          />
                        </div>
                        {user && (
                          <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                            <input 
                              type="checkbox" 
                              id="saveAddress" 
                              checked={saveAddress}
                              onChange={(e) => setSaveAddress(e.target.checked)}
                              className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                            />
                            <label htmlFor="saveAddress" className="text-sm text-titanium/80 cursor-pointer">
                              حفظ هذا العنوان لاستخدامه في الطلبات القادمة
                            </label>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <FloatingInput
                      id="deliveryInstructions"
                      label="تعليمات التوصيل (اختياري)"
                      isTextArea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      placeholder="مثلاً: بجوار المسجد، أو الاتصال قبل الوصول..."
                      bgClass="bg-slate-50/50"
                    />
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNextStep(1)}
                      className="w-full sm:w-auto bg-carbon text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all shadow-xl shadow-carbon/20 flex items-center justify-center gap-2 sm:gap-3 group"
                    >
                      المتابعة للتوصيل
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-[-4px] transition-transform" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-solar/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-solar" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-carbon">خيارات التوصيل</h2>
                      <p className="text-xs text-titanium/60">اختر الطريقة التي تناسبك لاستلام طلبك</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <motion.label 
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setShippingMethod('delivery')}
                      className={`relative flex items-center gap-3 sm:gap-4 p-4 sm:p-6 border-2 rounded-2xl sm:rounded-3xl cursor-pointer group transition-all ${shippingMethod === 'delivery' ? 'border-slate-900 bg-slate-900/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'}`}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${shippingMethod === 'delivery' ? 'border-slate-900' : 'border-slate-300'}`}>
                        {shippingMethod === 'delivery' && <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-900"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-carbon text-base sm:text-lg">التوصيل الى العنوان</span>
                          <span className="font-black text-sm sm:text-base">
                            {shipping === 0 ? (
                              <span className="text-emerald-600">مجاني</span>
                            ) : (
                              <PriceDisplay price={shipping} />
                            )}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-titanium/60">توصيل سريع إلى عنوانك</p>
                        {shippingZones.find(z => z.cities.includes(formData.city))?.estimatedDays && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-xs font-bold text-slate-400">
                            <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            مدة التوصيل: {shippingZones.find(z => z.cities.includes(formData.city))?.estimatedDays}
                          </div>
                        )}
                      </div>
                    </motion.label>

                    <motion.label 
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setShippingMethod('pickup')}
                      className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 border-2 rounded-2xl sm:rounded-3xl cursor-pointer transition-all ${shippingMethod === 'pickup' ? 'border-slate-900 bg-slate-900/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'}`}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${shippingMethod === 'pickup' ? 'border-slate-900' : 'border-slate-300'}`}>
                        {shippingMethod === 'pickup' && <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-900"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-carbon text-base sm:text-lg">الاستلام من المحل</span>
                          <span className="font-bold text-emerald-600 text-sm sm:text-base">مجاناً</span>
                        </div>
                        <p className="text-xs sm:text-sm text-titanium/60">استلم طلبك بنفسك من فرعنا</p>
                      </div>
                    </motion.label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(3)}
                      className="flex-1 bg-carbon text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all shadow-xl shadow-carbon/20 flex items-center justify-center gap-2 sm:gap-3 group order-1 sm:order-2"
                    >
                      المتابعة للدفع
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-[-4px] transition-transform" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(1)}
                      className="px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-titanium/60 bg-slate-100 hover:bg-slate-200 transition-all order-2 sm:order-1 text-sm sm:text-base"
                    >
                      رجوع
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-carbon">طريقة الدفع</h2>
                      <p className="text-xs text-titanium/60">اختر وسيلة الدفع المناسبة لك</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    <AnimatePresence mode="wait">
                      {!showPaymentDetails ? (
                        <motion.div 
                          key="payment-list"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.05 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                        >
                          {(settings.paymentMethods?.filter(m => m.isActive) || []).map((method) => (
                            <motion.button
                              key={method.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setPaymentMethod(method.id as any);
                                setShowPaymentDetails(true);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col items-center gap-2 sm:gap-3 text-center group ${
                                paymentMethod === method.id 
                                  ? `border-solar bg-solar/5 shadow-lg shadow-solar/10` 
                                  : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                              }`}
                            >
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                {method.logo ? (
                                  <img 
                                    src={method.logo} 
                                    alt={method.name} 
                                    className="w-full h-full object-cover filter saturate-[1.6] brightness-110" 
                                    referrerPolicy="no-referrer" 
                                  />
                                ) : (
                                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                )}
                              </div>
                              <div className="flex-1 text-right">
                                <h3 className="text-xs sm:text-sm font-bold text-carbon">{method.name}</h3>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="payment-details"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ type: "spring", damping: 25, stiffness: 200 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <motion.button
                              whileHover={{ x: -2 }}
                              onClick={() => setShowPaymentDetails(false)}
                              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-carbon hover:bg-slate-200 transition-colors"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                            <h3 className="text-lg font-black text-carbon">تفاصيل الدفع</h3>
                          </div>

                          {selectedPaymentMethod && (
                            <div className="space-y-4 sm:space-y-6">
                              {/* Account Info & QR Side-by-Side on Desktop */}
                              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                                <div className="flex-1 p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row gap-4 bg-solar/5 border-solar/10">
                                  {selectedPaymentMethod.accountNumber && (
                                    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                                      <div>
                                        <div className="text-[10px] text-titanium/40 font-bold mb-1 uppercase tracking-widest">
                                          {selectedPaymentMethod.type === 'bank' ? 'رقم الحساب' : 'رقم المحفظة'}
                                        </div>
                                        <div className="text-lg sm:text-xl font-mono font-black tracking-widest text-solar">
                                          {selectedPaymentMethod.accountNumber}
                                        </div>
                                        {selectedPaymentMethod.accountName && (
                                          <div className="text-[10px] text-titanium/60 font-bold mt-1">
                                            باسم: {selectedPaymentMethod.accountName}
                                          </div>
                                        )}
                                      </div>
                                      <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={async () => {
                                          const success = await copyToClipboard(selectedPaymentMethod.accountNumber || '');
                                          if (success) {
                                            setIsCopied(true);
                                            setTimeout(() => setIsCopied(false), 2000);
                                            showToast('تم نسخ الرقم بنجاح');
                                          }
                                        }}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 mr-3 ${isCopied ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}
                                      >
                                        {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-carbon" />}
                                      </motion.button>
                                    </div>
                                  )}

                                  <div className="sm:w-1/3 bg-solar/10 p-4 rounded-xl border border-solar/20 shadow-sm flex flex-col justify-center items-start sm:items-center">
                                    <div className="text-[10px] text-carbon/60 font-bold mb-1 uppercase tracking-widest">المبلغ المطلوب</div>
                                    <div className="text-xl font-black"><PriceDisplay price={total} numberClassName="text-carbon" currencyClassName="text-carbon/70" /></div>
                                  </div>
                                </div>

                                <div className="hidden md:flex w-64 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 flex-col items-center justify-center gap-4 shadow-sm shrink-0">
                                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50">
                                    <QRCodeSVG 
                                      value={`${paymentMethod}:${selectedPaymentMethod.accountNumber || ''};Amount:${total}`}
                                      size={120}
                                      level="H"
                                      includeMargin={true}
                                      imageSettings={selectedPaymentMethod.logo ? {
                                        src: selectedPaymentMethod.logo,
                                        x: undefined,
                                        y: undefined,
                                        height: 28,
                                        width: 28,
                                        excavate: true,
                                      } : undefined}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <h4 className="text-sm font-black text-carbon">امسح الكود للدفع</h4>
                                    <p className="text-[10px] text-titanium/40 mt-1">افتح تطبيق المحفظة وامسح الكود</p>
                                  </div>
                                </div>
                              </div>

                              {/* Custom Instructions */}
                              {selectedPaymentMethod.instructions && (
                                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                  <h4 className="text-sm font-black text-carbon mb-2">تعليمات الدفع:</h4>
                                  <p className="text-xs text-titanium/70 leading-relaxed">
                                    {selectedPaymentMethod.instructions}
                                  </p>
                                </div>
                              )}

                              {/* Reference Input Section */}
                              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-4 sm:space-y-5">
                                <div className="space-y-3">
                                  <div className="relative">
                                    <FloatingInput 
                                      label="رقم المرجع (مطلوب)"
                                      type="tel" 
                                      name="paymentReference"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={formData.paymentReference}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setFormData(prev => ({ ...prev, paymentReference: val }));
                                        if (fieldErrors.includes('paymentReference')) {
                                          setFieldErrors(prev => prev.filter(f => f !== 'paymentReference'));
                                        }
                                      }}
                                      className={`text-left font-mono text-xl font-bold tracking-widest ${fieldErrors.includes('paymentReference') ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} 
                                      dir="ltr" 
                                      bgClass="bg-white"
                                      endElement={formData.paymentReference ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : null}
                                    />
                                  </div>
                                  <p className="text-[10px] text-titanium/40 mr-1 font-bold">أدخل الرقم المرجعي للعملية المكون من أرقام فقط</p>
                                </div>

                                {selectedPaymentMethod.requiresProof && (
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-titanium/60 block px-4">إرفاق صورة الإشعار (مطلوب)</label>
                                    <div className="relative group">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const processUpload = async () => {
                                              try {
                                                const { uploadToCloudinary } = await import('../lib/cloudinary');
                                                showToast("جاري رفع الإشعار...", 'info');
                                                const secureUrl = await uploadToCloudinary(file);
                                                setFormData(prev => ({ ...prev, paymentProof: secureUrl }));
                                                showToast("تم رفع الإشعار بنجاح", 'success');
                                              } catch (err: any) {
                                                showToast(err.message || 'فشل رفع الإشعار', 'error');
                                              }
                                            };
                                            processUpload();
                                          }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      />
                                      <div className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${
                                        formData.paymentProof ? 'border-emerald-500 bg-emerald-50 p-2 sm:p-2' : 'border-slate-200 bg-slate-50 group-hover:border-solar/30'
                                      }`}>
                                        {formData.paymentProof ? (
                                          <div className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden group/preview">
                                            <img src={formData.paymentProof || undefined} alt="الإيصال" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-carbon/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setFormData(prev => ({ ...prev, paymentProof: undefined }));
                                                }}
                                                className="bg-white text-red-500 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-50 transition-colors"
                                              >
                                                <X className="w-4 h-4" /> حذف الصورة
                                              </button>
                                            </div>
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                              <CheckCircle className="w-3 h-3 text-white" />
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                              <Plus className="w-6 h-6 text-titanium/40" />
                                            </div>
                                            <div className="text-center">
                                              <span className="text-xs font-bold text-titanium/60">اضغط هنا لرفع صورة الإشعار</span>
                                              <p className="text-[10px] text-titanium/40 mt-1">PNG, JPG حتى 5MB</p>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-2 text-center">
                                  <button 
                                    onClick={() => setShowExampleImage(!showExampleImage)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-solar hover:text-solar/80 transition-colors"
                                  >
                                    <HelpCircle className="w-4 h-4" />
                                    كيف أجد رقم المرجع؟
                                  </button>
                                  <AnimatePresence>
                                    {showExampleImage && (
                                      <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mt-3"
                                      >
                                        <div className="rounded-2xl overflow-hidden border border-slate-200 relative group cursor-zoom-in max-w-md mx-auto">
                                          <img 
                                            src="https://19vojde6sh.ucarecd.net/0c55446b-c036-4701-bedf-30bddabf07c8/noroot.jpg" 
                                            alt="مثال لرقم المرجع" 
                                            className="w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            referrerPolicy="no-referrer" 
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-carbon/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <span className="text-white text-[10px] font-bold leading-relaxed">رقم المرجع يكون كما هو موضح في الصورة أعلاه (مثال توضيحي)</span>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'wallet' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="bg-emerald-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-200 space-y-3 sm:space-y-4 overflow-hidden"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-bold text-carbon">رصيد المحفظة</h3>
                                  <p className="text-xs text-titanium/60">سيتم خصم المبلغ من رصيدك المتاح</p>
                                </div>
                                <div className="text-left">
                                  <div className="text-xl font-black"><PriceDisplay price={user?.walletBalance || 0} numberClassName="text-emerald-600" currencyClassName="text-emerald-600/70" /></div>
                                  <div className="text-xs font-bold text-titanium/60">الرصيد المتاح</div>
                                </div>
                              </div>
                              
                              {(!user || (user.walletBalance || 0) < total) && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                      <Zap className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-red-600">رصيدك غير كافي</p>
                                      <p className="text-xs font-bold text-red-500/80 flex items-center gap-1 justify-end">
                                        تحتاج <PriceDisplay price={total - (user?.walletBalance || 0)} numberClassName="text-red-500" currencyClassName="text-red-500/70" />
                                      </p>
                                    </div>
                                  </div>
                                  <Link 
                                    to="/profile"
                                    state={{ view: 'wallet' }}
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap text-center"
                                  >
                                    إيداع الآن
                                  </Link>
                                </div>
                              )}
                            </motion.div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                            <motion.button 
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (validateStep(3)) {
                                  setStep(4);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                } else {
                                  setFormErrors(true);
                                  setTimeout(() => setFormErrors(false), 500);
                                  showToast('يرجى إكمال بيانات الدفع بشكل صحيح', 'error');
                                }
                              }}
                              disabled={isProcessing || (paymentMethod === 'wallet' && (!user || (user.walletBalance || 0) < total))}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 order-1 sm:order-2"
                            >
                              المراجعة النهائية
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowPaymentDetails(false)}
                              className="px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-titanium/60 bg-slate-100 hover:bg-slate-200 transition-all order-2 sm:order-1 text-sm sm:text-base"
                              disabled={isProcessing}
                            >
                              رجوع
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!showPaymentDetails && (
                      <div className="pt-4 sm:pt-6">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setStep(2)}
                          className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-titanium/60 bg-slate-100 hover:bg-slate-200 transition-all text-sm sm:text-base"
                          disabled={isProcessing}
                        >
                          رجوع للخطوة السابقة
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-carbon text-right mb-2">مراجعة الطلب</h2>

                  {/* Address Review Card */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 text-right">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <h3 className="text-sm font-bold text-carbon">عنوان التوصيل</h3>
                      <MapPin className="w-4 h-4 text-solar" />
                    </div>
                    <p className="text-xs sm:text-sm text-titanium/80 mb-1">
                      {formData.firstName} {formData.lastName} • <span dir="ltr">{formData.phone}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-titanium/80">
                      {formData.city} • {formData.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Payment Review Card */}
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 text-right">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <h3 className="text-sm font-bold text-carbon">الدفع</h3>
                        <CreditCard className="w-4 h-4 text-solar" />
                      </div>
                      <p className="text-xs sm:text-sm text-titanium/80 leading-relaxed">
                        {selectedPaymentMethod?.name || (paymentMethod === 'wallet' ? 'المحفظة الرقمية' : 'وسيلة دفع')}
                      </p>
                    </div>

                    {/* Shipping Review Card */}
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 text-right">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <h3 className="text-sm font-bold text-carbon">الشحن</h3>
                        <Truck className="w-4 h-4 text-solar" />
                      </div>
                      <p className="text-xs sm:text-sm text-titanium/80 leading-relaxed">
                        {shippingMethod === 'delivery' ? 'توصيل سريع' : 'استلام من المحل'}
                      </p>
                    </div>
                  </div>

                  {/* Items Review Card */}
                  <div className="space-y-3 sm:space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-bold text-carbon mb-1">{item.product?.name || 'منتج محذوف غير متوفر'}</p>
                          <p className="text-xs sm:text-sm text-titanium/80">
                            الكمية: {item.quantity}
                          </p>
                        </div>
                        <div className="text-left shrink-0">
                          <PriceDisplay price={(item.product?.price || 0) * item.quantity} numberClassName="text-sm sm:text-base font-bold text-carbon" currencyClassName="text-xs sm:text-sm text-carbon/80" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Highlight */}
                  <div className="bg-solar/10 p-4 sm:p-5 rounded-2xl border border-solar/20 flex items-center justify-between mt-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-carbon">الإجمالي النهائي</p>
                      <p className="text-[10px] sm:text-xs text-titanium/80">شامل الضريبة والتوصيل</p>
                    </div>
                    <div className="text-left">
                      <PriceDisplay price={total} numberClassName="text-lg sm:text-xl font-black text-carbon" currencyClassName="text-sm text-carbon/80" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 sm:pt-6">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className="bg-solar hover:bg-solar/90 text-carbon px-6 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg shadow-solar/20 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isProcessing ? 'جاري...' : 'تأكيد الطلب ✓'}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(3)}
                      className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-carbon border-2 border-slate-200 hover:bg-slate-50 transition-all text-sm sm:text-base"
                      disabled={isProcessing}
                    >
                      السابق
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Sidebar: Order Summary */}
        <div className="hidden lg:block w-full lg:w-[400px] shrink-0">
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24"
          >
            <h2 className="text-xl font-bold text-carbon mb-6 flex items-center justify-between">
              ملخص الطلب
              <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-titanium/60">{cart.length} منتجات</span>
            </h2>

            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl p-2 shrink-0 border border-slate-100 group-hover:border-slate-900/30 transition-colors">
                    <img src={item.product?.image || undefined} alt={item.product?.name || 'محذوف'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-carbon truncate group-hover:text-slate-900 transition-colors">{item.product?.name || 'منتج محذوف غير متوفر'}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-titanium/40 font-bold">الكمية: {item.quantity}</span>
                      <span className="text-sm font-bold"><PriceDisplay price={(item.product?.price || 0) * item.quantity} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            {!discount.code && (
              <div className="mb-8">
                <button 
                  onClick={() => setShowCouponInput(!showCouponInput)}
                  className="text-xs font-bold text-carbon/60 hover:text-solar mb-3 flex items-center gap-2 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  هل لديك كود خصم؟
                </button>
                
                <AnimatePresence>
                  {showCouponInput && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-1">
                        <div className="flex gap-2">
                          <FloatingInput 
                            label="كود الخصم"
                            type="text" 
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="text-sm font-medium"
                            bgClass="bg-white"
                            containerClassName="flex-1"
                          />
                          <button 
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon}
                            className="bg-carbon text-white px-5 rounded-xl text-sm font-bold hover:bg-carbon/90 transition-all disabled:opacity-50 h-12 sm:h-14"
                          >
                            {isApplyingCoupon ? 'جاري...' : 'تطبيق'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-titanium/60 font-medium">المجموع الفرعي</span>
                <span className="font-bold"><PriceDisplay price={subtotal} /></span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-titanium/60 font-medium">تكلفة التوصيل</span>
                <span className="font-bold">
                  {shipping === 0 ? <span className="text-emerald-600">مجاناً</span> : <PriceDisplay price={shipping} />}
                </span>
              </div>
              
              <AnimatePresence>
                {discount.code && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex justify-between items-center text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span className="font-bold">خصم ({discount.code})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black flex items-center gap-1">
                        - <PriceDisplay price={discountAmount} numberClassName="text-emerald-600" currencyClassName="text-emerald-600/70" />
                      </span>
                      <button onClick={removeDiscount} className="text-[10px] bg-white text-red-500 px-2 py-1 rounded-md shadow-sm hover:bg-red-50 transition-colors">إزالة</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold text-carbon text-lg">الإجمالي</span>
                  <div className="text-right">
                    <div className="text-2xl font-black">
                      <PriceDisplay price={total} numberClassName="text-slate-900" currencyClassName="text-slate-900/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Sticky Total (Visible only on small screens) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-lg border-t border-white/50 p-4 z-40 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pb-safe">
            <div>
              <p className="text-[10px] text-titanium/40 font-bold uppercase tracking-wider">الإجمالي المستحق</p>
              <div className="flex flex-col">
                <PriceDisplay price={total} className="text-xl font-black flex items-center gap-1" numberClassName="text-slate-900" currencyClassName="text-slate-900/70" />
              </div>
            </div>
            <button 
              onClick={() => {
                if (step < 4) handleNextStep(step);
                else handlePlaceOrder();
              }}
              disabled={isProcessing || (step === 3 && paymentMethod === 'wallet' && (!user || (user.walletBalance || 0) < total))}
              className="bg-carbon text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-carbon/20 flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {isProcessing ? 'جاري...' : step === 4 ? 'تأكيد الشراء' : 'المتابعة'}
              {!isProcessing && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
