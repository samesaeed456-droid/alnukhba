import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Search, ChevronLeft, Trash2, Plus, Minus, Zap, Tag, Sparkles, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, useStoreState, useStoreActions, useStoreUI } from '../../context/StoreContext';
import ConfirmationModal from '../ConfirmationModal';
import RecommendedProducts from '../RecommendedProducts';
import PriceDisplay from '../PriceDisplay';

interface CartDrawerProps {}

export default React.memo(function CartDrawer({}: CartDrawerProps) {
  const navigate = useNavigate();
  const { cart, discount, user, language } = useStoreState();
  const { updateCartQuantity, removeFromCart, formatPrice, applyDiscountCode, removeDiscount } = useStoreActions();
  const { isCartOpen, setIsCartOpen, showToast } = useStoreUI();
  
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);
  
  const calculateDiscount = useCallback(() => {
    if (!discount.code) return 0;
    if (discount.type === 'percentage') {
      return subtotal * (discount.amount / 100);
    }
    return discount.amount;
  }, [discount, subtotal]);

  const discountAmount = useMemo(() => calculateDiscount(), [calculateDiscount]);
  const cartTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const handleApplyCoupon = useCallback(() => {
    if (!couponInput.trim()) {
      showToast('يرجى إدخال كود الخصم');
      return;
    }
    setIsApplyingCoupon(true);
    const success = applyDiscountCode(couponInput);
    setIsApplyingCoupon(false);
    if (success) {
      setCouponInput('');
    }
  }, [couponInput, applyDiscountCode, showToast]);

  const handleUpdateQuantity = useCallback(async (id: string, delta: number) => {
    setUpdatingItemId(id);
    updateCartQuantity(id, delta);
    setUpdatingItemId(null);
  }, [updateCartQuantity]);

  const handleCheckout = useCallback(() => {
    setIsCartOpen(false);
    if (user) {
      navigate('/checkout');
    } else {
      showToast('يرجى تسجيل الدخول أولاً لإتمام عملية الشراء');
      navigate('/auth?redirect=/checkout');
    }
  }, [user, navigate, setIsCartOpen, showToast]);

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            key="overlay"
            initial={{opacity: 0}} 
            animate={{opacity: 0.6}} 
            exit={{opacity: 0}} 
            className="fixed inset-0 bg-slate-900 z-50 backdrop-blur-sm" 
            onClick={() => setIsCartOpen(false)} 
          />
        )}
        {isCartOpen && (
          <motion.div 
            key="drawer"
            initial={{x: '-100%'}} 
            animate={{x: 0}} 
            exit={{x: '-100%'}} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[85%] sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col rounded-r-2xl overflow-hidden"
          >
              <div className="p-4 sm:p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-solar" />
                    سلة المشتريات
                  </h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 sm:space-y-4 hide-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center mb-6 sm:mb-8 relative border border-slate-100"
                      >
                        <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute -top-2 -right-2 bg-blue-100 text-blue-600 p-2 rounded-full"
                        >
                          <Search className="w-4 h-4" />
                        </motion.div>
                      </motion.div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2">سلتك فارغة</h3>
                      <p className="text-sm sm:text-base text-center max-w-[250px] text-slate-500 mb-8">
                        يبدو أنك لم تضف أي منتجات إلى سلتك حتى الآن. اكتشف أحدث العروض والمنتجات المميزة!
                      </p>
                      <button 
                        onClick={() => {
                          setIsCartOpen(false);
                          navigate('/search');
                        }} 
                        className="bg-solar hover:bg-solar/90 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all shadow-lg shadow-solar/30 hover:shadow-solar/50 hover:-translate-y-1 flex items-center gap-2"
                      >
                        تصفح المنتجات
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    cart.map(item => (
                      <motion.div 
                        layout 
                        key={item.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="flex gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 relative"
                      >
                        {updatingItemId === item.id && (
                          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Zap className="w-5 h-5 text-solar fill-solar" />
                            </motion.div>
                          </div>
                        )}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-white p-2 shrink-0 border border-slate-100">
                          <img src={item.product?.image || undefined} alt={item.product?.name || 'محذوف'} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5 sm:py-1">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-slate-800 line-clamp-2 text-xs sm:text-sm leading-tight">{item.product?.name || 'منتج محذوف غير متوفر'}</h4>
                              <button onClick={() => setItemToDelete(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            {(item.selectedColor || item.selectedSize) && (
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                {item.selectedColor && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full border border-slate-300" style={{ backgroundColor: item.selectedColor }} />
                                  </div>
                                )}
                                {item.selectedSize && <span>المقاس: {item.selectedSize}</span>}
                              </div>
                            )}
                            <div className="text-slate-900 font-bold mt-1 sm:mt-2 text-sm sm:text-base">{formatPrice(item.product?.price || 0)}</div>
                          </div>
                          <div className="flex items-center justify-between mt-2 sm:mt-3">
                            <div className="flex items-center gap-2 sm:gap-3 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1">
                              <button onClick={() => handleUpdateQuantity(item.id, 1)} className="text-slate-600 hover:text-blue-600 p-1"><Plus className="w-3 h-3" /></button>
                              <span className="font-bold text-xs sm:text-sm w-4 text-center">{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item.id, -1)} className="text-slate-600 hover:text-red-500 p-1"><Minus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {cart.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <RecommendedProducts compact limit={3} title="منتجات مكملة لسلتك" />
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-200 bg-white">
                    {/* Coupon Section */}
                    {user && (
                      <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-wider">رصيد المحفظة</p>
                            <PriceDisplay 
                              price={user.walletBalance || 0} 
                              numberClassName="text-sm font-black text-emerald-700"
                              currencyClassName="text-[10px] text-emerald-600 font-bold"
                            />
                          </div>
                        </div>
                        <Link 
                          to="/profile" 
                          state={{ view: 'wallet' }}
                          onClick={() => setIsCartOpen(false)}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          إيداع
                        </Link>
                      </div>
                    )}

                    {!discount.code ? (
                      <div className="mb-4">
                        <button 
                          onClick={() => setShowCouponInput(!showCouponInput)}
                          className="text-[10px] font-black text-carbon/60 hover:text-solar mb-2 flex items-center gap-2 uppercase tracking-wider transition-colors"
                        >
                          <Tag className="w-3.5 h-3.5" />
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
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value)}
                                    placeholder="كود الخصم"
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-solar/20 transition-all min-w-0"
                                  />
                                  <button 
                                    onClick={handleApplyCoupon}
                                    disabled={isApplyingCoupon}
                                    className="bg-carbon text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-carbon/90 transition-all disabled:opacity-50 shrink-0"
                                  >
                                    {isApplyingCoupon ? '...' : 'تطبيق'}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="mb-4 flex justify-between items-center text-xs text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span className="font-bold">خصم ({discount.code})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black">-{formatPrice(discountAmount)}</span>
                          <button onClick={removeDiscount} className="text-[10px] bg-white text-red-500 px-2 py-1 rounded-md shadow-sm hover:bg-red-50 transition-colors">إزالة</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      <div className="flex justify-between text-slate-500 text-xs sm:text-sm font-medium">
                        <span>المجموع الفرعي</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {discount.code && (
                        <div className="flex justify-between text-emerald-600 text-xs sm:text-sm font-medium">
                          <span>الخصم</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500 text-xs sm:text-sm font-medium">
                        <span>التوصيل</span>
                        <span className="text-slate-800">
                          يتم حسابه لاحقاً
                        </span>
                      </div>
                      <div className="flex flex-col items-end pt-2 sm:pt-3 border-t border-slate-100">
                        <div className="flex justify-between w-full items-center mb-1">
                          <span className="text-slate-800 font-bold text-base sm:text-lg">الإجمالي</span>
                          <div className="text-right">
                            <div className="text-xl sm:text-2xl font-black text-solar">
                              {formatPrice(cartTotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleCheckout} className="w-full bg-solar hover:bg-solar/90 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-colors flex items-center justify-center gap-2">
                      إتمام الطلب
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            removeFromCart(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="حذف المنتج"
        message="هل أنت متأكد من رغبتك في حذف هذا المنتج من سلة المشتريات؟"
        confirmText="حذف"
        cancelText="تراجع"
      />
    </>
  );
});
