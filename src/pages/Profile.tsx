import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Phone, MapPin, Package, Heart, LogOut, 
  ChevronLeft, Edit2, Check, Key, Globe, DollarSign, 
  MessageCircle, FileText, Shield, Trash2, Settings, Award, Camera, BadgeCheck, Plus, ChevronDown, CreditCard, ArrowDownToLine, Clock, ArrowUpRight, ArrowDownLeft,
  Eye, EyeOff, AlertCircle, CheckCircle2, Search, Truck, UserPlus, HelpCircle, Smartphone,
  ShieldAlert, Wallet, ChevronRight, Zap, MessageSquare, History, Lock, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { Address } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import PriceDisplay from '../components/PriceDisplay';
import FloatingInput from '../components/FloatingInput';

export default function Profile() {
  const { user, updateUser, logout, showToast, language, setLanguage, formatPrice, shippingZones } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<'menu' | 'edit' | 'addresses' | 'wallet' | 'delete-account'>('menu');

  useEffect(() => {
    if (location.state && (location.state as any).view) {
      setCurrentView((location.state as any).view);
    }
  }, [location.state]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddressDeleteConfirm, setShowAddressDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpRef, setTopUpRef] = useState('');
  const [topUpError, setTopUpError] = useState(false);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [deletionStep, setDeletionStep] = useState<'confirm' | 'reason'>('confirm');
  const [deletionReason, setDeletionReason] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const allCities = useMemo(() => {
    const zoneCities = shippingZones.filter(z => z.isActive).flatMap(z => z.cities);
    if (zoneCities.length > 0) {
      return Array.from(new Set(zoneCities)).sort();
    }
    // Fallback if no shipping zones are defined
    return ['صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'المكلا', 'حجة', 'صعدة', 'البيضاء', 'مأرب', 'عمران', 'الجوف', 'المهرة', 'سقطرى', 'شبوة', 'أبين', 'لحج', 'الضالع', 'ريمة', 'المحويت'].sort();
  }, [shippingZones]);

  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    firstName: '',
    lastName: '',
    address: '',
    city: allCities[0] || 'صنعاء',
    phone: '',
    countryCode: '+967'
  });
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    avatar: user?.photoURL || '',
    phone: user?.phone || '',
    countryCode: user?.countryCode || '+967',
    address: user?.address || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordModalStep, setPasswordModalStep] = useState<'change' | 'otp' | 'reset'>('change');
  const [recoveryOtp, setRecoveryOtp] = useState(['', '', '', '']);
  const [recoveryTimer, setRecoveryTimer] = useState(59);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteModalStep, setDeleteModalStep] = useState<'reason' | 'otp'>('reason');
  const [deleteOtp, setDeleteOtp] = useState(['', '', '', '']);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.displayName || '',
        avatar: user.avatar || user.photoURL || '',
        phone: user.phone || '',
        countryCode: user.countryCode || '+967',
        address: user.address || ''
      });
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentView]);

  // Timer logic for recovery
  useEffect(() => {
    let interval: any;
    if (passwordModalStep === 'otp' && recoveryTimer > 0) {
      interval = setInterval(() => {
        setRecoveryTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [passwordModalStep, recoveryTimer]);

  // Web OTP API implementation for recovery
  useEffect(() => {
    if (passwordModalStep !== 'otp' || !('OTPCredential' in window)) return;

    const ac = new AbortController();
    
    const listenForOTP = async () => {
      try {
        const otpResult = await navigator.credentials.get({
          otp: { transport: ['sms'] },
          signal: ac.signal
        } as any);
        
        if (otpResult && 'code' in otpResult) {
          const code = (otpResult as any).code;
          if (code && code.length === 4) {
            const digits = code.split('');
            setRecoveryOtp(digits);
            // Small delay before auto-submit
            setTimeout(() => {
              const verifyButton = document.getElementById('verify-recovery-btn');
              verifyButton?.click();
            }, 500);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Only log if it's not a permission error (common in iframes)
          if (!err.message?.includes('otp-credentials')) {
            console.error('Web OTP Error:', err);
          }
        }
      }
    };

    listenForOTP();
    return () => ac.abort();
  }, [passwordModalStep]);

  const handleRecoveryOtpChange = useCallback((index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    if (value.length > 1) return;
    
    const newOtp = [...recoveryOtp];
    newOtp[index] = value;
    setRecoveryOtp(newOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(`recovery-otp-${index + 1}`);
      nextInput?.focus();
    }
  }, [recoveryOtp]);

  const handleRecoveryOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !recoveryOtp[index] && index > 0) {
      const prevInput = document.getElementById(`recovery-otp-${index - 1}`);
      prevInput?.focus();
    }
  }, [recoveryOtp]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
        return;
      }
      try {
        const { uploadToCloudinary } = await import('../lib/cloudinary');
        showToast('جاري رفع الصورة...', 'info');
        const secureUrl = await uploadToCloudinary(file);
        
        const updatedData = { ...formData, avatar: secureUrl };
        setFormData(updatedData);
        
        // Automatically save the avatar update
        if (user) {
          updateUser({ 
            ...user, 
            ...updatedData,
            name: updatedData.name || user.name || user.displayName || '',
            avatar: secureUrl 
          } as any);
        }
        showToast('تم تحديث الصورة الشخصية بنجاح');
      } catch (error: any) {
        showToast(error.message || 'فشل في رفع الصورة', 'error');
      }
    }
  }, [user, formData, updateUser, showToast]);

  const handleSave = useCallback(() => {
    if (user) {
      updateUser({ ...user, ...formData } as any);
    }
    window.scrollTo(0, 0);
    setCurrentView('menu');
  }, [user, formData, updateUser]);

  const handleNotImplemented = useCallback(() => {
    showToast('سيتم توفير هذه الميزة قريباً');
  }, [showToast]);

  const handleInitiateDelete = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // In a real app with Firebase, we might use a Cloud Function to send SMS
      // For now, we'll keep the logic but move away from localStorage for the OTP
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const fullPhone = user.countryCode + user.phone;
      
      // Store OTP in a temporary session state or a secure way
      // For this demo, we'll just use a state variable
      (window as any)._tempDeletionOtp = generatedOtp;

      const domain = window.location.hostname;
      const message = `تطبيق النخبة: كود التحقق الخاص بك هو ${generatedOtp}. يرجى عدم مشاركة هذا الكود مع أي شخص لضمان أمان حسابك.\n\n@${domain} #${generatedOtp}`;

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, message })
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to send SMS');

      setDeleteModalStep('otp');
      setDeleteOtp(['', '', '', '']);
      showToast('تم إرسال كود التحقق لحذف الحساب');
    } catch (err) {
      showToast('فشل إرسال كود التحقق. يرجى المحاولة لاحقاً', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  const handleDeleteOtpChange = useCallback((index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    if (value.length > 1) return;
    
    const newOtp = [...deleteOtp];
    newOtp[index] = value;
    setDeleteOtp(newOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(`delete-otp-${index + 1}`);
      nextInput?.focus();
    }
  }, [deleteOtp]);

  const handleDeleteOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !deleteOtp[index] && index > 0) {
      const prevInput = document.getElementById(`delete-otp-${index - 1}`);
      prevInput?.focus();
    }
  }, [deleteOtp]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    const code = deleteOtp.join('');
    if (code.length < 4) {
      showToast('يرجى إدخال الكود كاملاً', 'error');
      return;
    }

    const storedOtp = (window as any)._tempDeletionOtp;

    if (code !== storedOtp) {
      showToast('كود التحقق غير صحيح', 'error');
      return;
    }

    try {
      setIsLoading(true);
      // In Firebase, we should delete the user's data and then the auth account
      // This requires re-authentication usually, but for this demo:
      const { db, doc, deleteDoc, auth } = await import('../lib/firebase');
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Attempt to delete auth account (might fail if not recently logged in)
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }

      logout();
      navigate('/');
      showToast('تم حذف الحساب بنجاح. نأسف لرحيلك.');
      setShowDeleteAccountModal(false);
      setDeletionStep('confirm');
      setDeletionReason('');
      setDeleteModalStep('reason');
      delete (window as any)._tempDeletionOtp;
    } catch (error) {
      console.error('Account deletion failed:', error);
      showToast('حدث خطأ أثناء حذف الحساب. قد تحتاج لتسجيل الخروج والدخول مرة أخرى.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, deleteOtp, deletionReason, logout, navigate, showToast]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('كلمة المرور الجديدة غير متطابقة', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { reauthenticate, changePassword } = await import('../lib/firebase');
      
      // Re-authenticate first
      await reauthenticate(passwordData.currentPassword);
      
      // Update password
      await changePassword(passwordData.newPassword);
      
      showToast('تم تغيير كلمة المرور بنجاح');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password change failed:', error);
      let message = 'فشل تغيير كلمة المرور';
      if (error.code === 'auth/wrong-password') message = 'كلمة المرور الحالية غير صحيحة';
      if (error.code === 'auth/requires-recent-login') message = 'يرجى تسجيل الخروج والدخول مرة أخرى لإتمام هذه العملية';
      
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [passwordData, showToast]);

  const handleForgotPasswordFromProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const fullPhone = user.countryCode + user.phone;
      localStorage.setItem(`otp_recovery_${fullPhone}`, generatedOtp);

      const domain = window.location.hostname;
      const message = `كود استعادة كلمة المرور الخاص بك هو: ${generatedOtp}\n\n@${domain} #${generatedOtp}`;

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, message })
      });

      if (!response.ok) throw new Error('Failed to send SMS');

      setPasswordModalStep('otp');
      setRecoveryTimer(59);
      setRecoveryOtp(['', '', '', '']);
      showToast('تم إرسال كود التحقق لاستعادة كلمة المرور');
    } catch (err) {
      showToast('فشل إرسال كود التحقق. يرجى المحاولة لاحقاً', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  const handleResendRecoveryCode = useCallback(async () => {
    if (!user) return;
    setIsResending(true);
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const fullPhone = user.countryCode + user.phone;
      localStorage.setItem(`otp_recovery_${fullPhone}`, generatedOtp);

      const domain = window.location.hostname;
      const message = `كود استعادة كلمة المرور الجديد الخاص بك هو: ${generatedOtp}\n\n@${domain} #${generatedOtp}`;

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, message })
      });

      if (!response.ok) throw new Error('Failed to send SMS');

      setRecoveryTimer(59);
      setRecoveryOtp(['', '', '', '']);
      showToast('تم إعادة إرسال كود التحقق بنجاح');
    } catch (err) {
      showToast('فشل إعادة إرسال الكود', 'error');
    } finally {
      setIsResending(false);
    }
  }, [user, showToast]);

  const handleVerifyRecoveryOtp = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const code = recoveryOtp.join('');
    if (code.length < 4) {
      setError('يرجى إدخال كود التحقق كاملاً');
      return;
    }

    const fullPhone = user.countryCode + user.phone;
    const storedOtp = localStorage.getItem(`otp_recovery_${fullPhone}`);

    if (code !== storedOtp) {
      setError('كود التحقق غير صحيح');
      return;
    }

    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setIsLoading(false);
      setPasswordModalStep('reset');
      localStorage.removeItem(`otp_recovery_${fullPhone}`);
    }, 800);
  }, [recoveryOtp, user]);

  const handleResetRecoveryPassword = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordData.newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const users = JSON.parse(localStorage.getItem('app_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.phone === user?.phone);

      if (userIndex !== -1) {
        users[userIndex].password = passwordData.newPassword;
        localStorage.setItem('app_users', JSON.stringify(users));
      } else {
        const newUser = {
          name: user?.name || 'مستخدم',
          phone: user?.phone || '',
          password: passwordData.newPassword,
          avatar: user?.avatar || '',
          countryCode: user?.countryCode || '+967'
        };
        users.push(newUser);
        localStorage.setItem('app_users', JSON.stringify(users));
      }
      
      showToast('تم تحديث كلمة المرور بنجاح');
      setShowPasswordModal(false);
      setPasswordModalStep('change');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setRecoveryOtp(['', '', '', '']);
    }, 1000);
  }, [passwordData, user, showToast]);

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[60vh] flex flex-col items-center justify-center px-4"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-slate-100 p-6 rounded-full mb-6"
        >
          <User className="w-12 h-12 text-slate-400" />
        </motion.div>
        <h2 className="text-xl font-bold text-carbon mb-2 text-center">يرجى تسجيل الدخول</h2>
        <p className="text-titanium/60 mb-8 text-center max-w-sm">يجب عليك تسجيل الدخول للوصول إلى ملفك الشخصي وطلباتك.</p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-carbon to-solar hover:opacity-90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-solar/20"
        >
          تسجيل الدخول
        </motion.button>
      </motion.div>
    );
  }

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col">
      <h3 className="text-xs font-bold text-titanium/50 mb-3 px-2 uppercase tracking-wider">{title}</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const MenuItem = ({ icon: Icon, label, onClick, color = "text-carbon", bg = "bg-slate-50", iconColor = "text-titanium/60", isDestructive = false, rightElement }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-0`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${isDestructive ? 'bg-red-50' : bg}`}>
          <Icon className={`w-5 h-5 ${isDestructive ? 'text-red-500' : iconColor}`} />
        </div>
        <span className={`font-bold text-sm sm:text-base text-right ${isDestructive ? 'text-red-600' : color}`}>{label}</span>
      </div>
      {rightElement ? rightElement : <ChevronLeft className="w-5 h-5 shrink-0 text-slate-300 group-hover:-translate-x-1 transition-transform" />}
    </button>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const menuVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, x: -20 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
    >
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-carbon">
                  {passwordModalStep === 'change' ? 'تغيير كلمة المرور' : 
                   passwordModalStep === 'otp' ? 'كود التحقق' : 'تعيين كلمة مرور جديدة'}
                </h3>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordModalStep('change');
                    setError('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 mb-4 text-sm font-bold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {passwordModalStep === 'change' ? (
                  <motion.form 
                    key="change"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleChangePassword} 
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <button 
                          type="button"
                          onClick={handleForgotPasswordFromProfile}
                          className="text-xs font-bold text-carbon hover:underline mr-auto"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>
                      <FloatingInput
                        required
                        label="كلمة المرور الحالية"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div className="space-y-2">
                      <FloatingInput
                        required
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div className="space-y-2">
                      <FloatingInput
                        required
                        label="تأكيد كلمة المرور الجديدة"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-carbon text-white h-14 rounded-2xl font-bold transition-all hover:bg-carbon mt-4 shadow-lg shadow-carbon/10 flex items-center justify-center"
                    >
                      {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                    </button>
                  </motion.form>
                ) : passwordModalStep === 'otp' ? (
                  <motion.form 
                    key="otp"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleVerifyRecoveryOtp} 
                    className="space-y-6"
                  >
                    <p className="text-center text-sm text-titanium/60">
                      تم إرسال كود التحقق إلى الرقم <span dir="ltr">{user.countryCode} {user.phone}</span>
                    </p>
                    <div className="flex justify-center gap-3" dir="ltr">
                      {recoveryOtp.map((digit, index) => (
                        <input
                          key={index}
                          id={`recovery-otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleRecoveryOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleRecoveryOtpKeyDown(index, e)}
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          className="w-14 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-carbon focus:ring-4 focus:ring-carbon/10 outline-none transition-all"
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      {recoveryTimer > 0 ? (
                        <p className="text-sm text-titanium/60">
                          إعادة الإرسال خلال <span className="font-bold text-carbon">{recoveryTimer}</span> ثانية
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendRecoveryCode}
                          disabled={isResending}
                          className="text-sm font-bold text-carbon hover:underline disabled:opacity-50"
                        >
                          {isResending ? 'جاري الإرسال...' : 'إعادة إرسال الكود'}
                        </button>
                      )}
                    </div>
                    <button 
                      type="submit" 
                      id="verify-recovery-btn"
                      disabled={isLoading}
                      className="w-full bg-carbon text-white h-14 rounded-2xl font-bold transition-all hover:bg-carbon shadow-lg shadow-carbon/10 flex items-center justify-center"
                    >
                      {isLoading ? 'جاري التحقق...' : 'تحقق الآن'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPasswordModalStep('change')}
                      className="w-full text-sm font-bold text-titanium/60 hover:text-carbon transition-colors"
                    >
                      العودة لتغيير كلمة المرور
                    </button>
                  </motion.form>
                ) : (
                  <motion.form 
                    key="reset"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleResetRecoveryPassword} 
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <FloatingInput
                        label="كلمة المرور الجديدة"
                        required 
                        type={showPassword ? "text" : "password"} 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        dir="ltr"
                        className="text-left"
                        endElement={
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="px-3 text-slate-400 hover:text-carbon h-full flex items-center justify-center z-10"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <FloatingInput
                        label="تأكيد كلمة المرور الجديدة"
                        required 
                        type={showPassword ? "text" : "password"} 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-carbon text-white h-14 rounded-2xl font-bold transition-all hover:bg-carbon mt-4 shadow-lg shadow-carbon/10 flex items-center justify-center"
                    >
                      {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          navigate('/');
          setShowLogoutConfirm(false);
        }}
        title="تسجيل الخروج"
        message="هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟"
        confirmText="خروج"
        cancelText="إلغاء"
        type="danger"
      />

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
      <AnimatePresence mode="wait">
        {currentView === 'menu' ? (
          <motion.div 
            key="menu"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-7xl mx-auto"
          >
            <motion.h1 variants={itemVariants} className="text-xl sm:text-2xl font-bold text-carbon mb-6 px-2">حسابي</motion.h1>
            
            {/* Minimal Profile Header */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
              <div className="relative group/avatar shrink-0">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar || undefined} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h2 className="text-base font-bold text-carbon truncate">{user.displayName || user.name || 'مستخدم جديد'}</h2>
                  <BadgeCheck className="w-4 h-4 text-carbon shrink-0" />
                </div>
                <p className="text-xs text-titanium/80 truncate" dir="ltr">{user.countryCode || '+967'} {user.phone}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-6">
                {/* Digital Wallet Section */}
                <Section title="المحفظة الرقمية">
                  <div className="p-5 bg-gradient-to-br from-slate-900 to-carbon relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium mb-0.5">الرصيد الحالي</p>
                          <div className="flex items-baseline gap-1">
                            <PriceDisplay 
                              price={user.walletBalance || 0} 
                              numberClassName="text-xl font-black text-white tracking-tight"
                              currencyClassName="text-sm text-emerald-400 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        window.scrollTo(0, 0);
                        setCurrentView('wallet');
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm"
                    >
                      <DollarSign className="w-4 h-4" />
                      إيداع رصيد في محفظتك
                    </button>
                  </div>
                </Section>

                <Section title="النشاط">
                  <MenuItem icon={Package} label="طلباتي" bg="bg-carbon/10" iconColor="text-carbon" onClick={() => navigate('/orders')} />
                  <MenuItem icon={Clock} label="سجل العمليات" bg="bg-orange-50" iconColor="text-solar" onClick={() => {
                    window.scrollTo(0, 0);
                    setCurrentView('wallet');
                  }} />
                  <MenuItem icon={Heart} label="المفضلة" bg="bg-red-50" iconColor="text-red-500" onClick={() => navigate('/wishlist')} />
                </Section>
              </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <Section title="المعلومات الشخصية">
                  <MenuItem icon={Edit2} label="تعديل الحساب" bg="bg-slate-100" iconColor="text-carbon" onClick={() => {
                    window.scrollTo(0, 0);
                    setCurrentView('edit');
                  }} />
                  <MenuItem icon={Key} label="تغيير كلمة المرور" bg="bg-slate-100" iconColor="text-carbon" onClick={() => setShowPasswordModal(true)} />
                </Section>

                <Section title="الإعدادات">
                  <MenuItem 
                    icon={MapPin} 
                    label="عناوين التوصيل" 
                    bg="bg-carbon/10" 
                    iconColor="text-carbon" 
                    onClick={() => {
                      window.scrollTo(0, 0);
                      setCurrentView('addresses');
                    }} 
                  />
                  <div className="p-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <BadgeCheck className="w-5 h-5 text-titanium/60" />
                        </div>
                        <span className="font-bold text-sm sm:text-base text-carbon">التنبيهات</span>
                      </div>
                      <button 
                        onClick={() => {
                          const newPrefs = { ...user.preferences, notifications: !user.preferences?.notifications };
                          updateUser({ ...user, preferences: newPrefs });
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${user.preferences?.notifications ? 'bg-carbon' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.preferences?.notifications ? 'left-1' : 'left-7'}`} />
                      </button>
                    </div>
                  </div>
                </Section>
              </div>

              {/* Column 3 */}
              <div className="space-y-6">
                <Section title="الإدارة">
                  <MenuItem icon={Settings} label="لوحة تحكم الإدارة" bg="bg-carbon/10" iconColor="text-carbon" onClick={() => navigate('/admin')} />
                </Section>

                <Section title="الدعم والقانونية">
                  <MenuItem icon={MessageCircle} label="تواصل معنا" bg="bg-teal-50" iconColor="text-teal-600" onClick={() => navigate('/contact')} />
                  <MenuItem icon={FileText} label="الشروط والأحكام" bg="bg-slate-50" iconColor="text-titanium/80" onClick={() => navigate('/terms')} />
                  <MenuItem icon={Shield} label="سياسة الخصوصية" bg="bg-slate-50" iconColor="text-titanium/80" onClick={() => navigate('/privacy')} />
                </Section>

                <Section title="إدارة الحساب">
                  <MenuItem icon={LogOut} label="تسجيل الخروج" isDestructive={true} onClick={() => setShowLogoutConfirm(true)} />
                  <MenuItem icon={Trash2} label="حذف الحساب" isDestructive={true} onClick={() => {
                    setDeletionReason('');
                    setShowDeleteAccountModal(true);
                  }} />
                </Section>
              </div>
            </motion.div>
          </motion.div>
        ) : currentView === 'wallet' ? (
          <motion.div 
            key="wallet"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button 
                onClick={() => {
                  window.scrollTo(0, 0);
                  setCurrentView('menu');
                  setTopUpAmount('');
                }}
                className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-carbon" />
              </button>
              <h1 className="text-xl font-bold text-carbon">المحفظة الرقمية</h1>
            </div>

            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-slate-900 to-carbon rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium mb-0.5 sm:mb-1">الرصيد الحالي</p>
                      <div className="flex items-baseline gap-2">
                        <PriceDisplay 
                          price={user.walletBalance || 0} 
                          numberClassName="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight"
                          currencyClassName="text-lg sm:text-xl text-emerald-400 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Up Form */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-carbon mb-5 sm:mb-6 flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-carbon" />
                  إيداع رصيد
                </h2>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                  {[5000, 10000, 20000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount.toString())}
                      className={`h-12 sm:h-16 rounded-xl font-bold text-base sm:text-xl transition-all border-2 ${
                        topUpAmount === amount.toString()
                          ? 'border-carbon bg-carbon/5 text-carbon'
                          : 'border-slate-100 bg-slate-50 text-carbon hover:border-slate-200'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  <FloatingInput 
                    label="مبلغ مخصص"
                    type="tel" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value.replace(/\D/g, ''))}
                    bgClass="bg-slate-50"
                    className="font-black text-lg sm:text-2xl text-left"
                    dir="ltr"
                    endElement={
                      <div className="font-bold text-sm sm:text-base text-titanium/60 px-4">
                        ر.ي
                      </div>
                    }
                  />
                </div>

                {/* Kuraimi Payment Instructions */}
                <div className="bg-[#0056b3]/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#0056b3]/20 space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center font-bold text-lg sm:text-xl overflow-hidden shrink-0">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSijsePxWivnhnEwZs8l0IU_JB9dNkgrIn7aHGPZvV9GjeeQKt7sqcm7eA&s=10" alt="الكريمي" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-carbon">الدفع إلى نقطة حاسب</h3>
                      <p className="text-[10px] sm:text-xs text-titanium/60">يرجى تحويل المبلغ وإرفاق رقم المرجع</p>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-titanium/40 font-bold mb-0.5 sm:mb-1">رقم نقطة حاسب</div>
                      <div className="text-base sm:text-lg font-mono font-bold text-[#0056b3] tracking-wider">877107</div>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0056b3]/10 flex items-center justify-center">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#0056b3]" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-carbon">
                      <span className="w-6 h-6 rounded-full bg-[#0056b3] text-white flex items-center justify-center text-xs shrink-0">1</span>
                      أولاً: قم بالدفع عبر تطبيق الكريمي
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-carbon">
                      <span className="w-6 h-6 rounded-full bg-[#0056b3] text-white flex items-center justify-center text-xs shrink-0">2</span>
                      ثانياً: أدخل رقم المرجع الموجود في الإشعار
                    </div>
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 relative group">
                      <img 
                        src="https://19vojde6sh.ucarecd.net/0c55446b-c036-4701-bedf-30bddabf07c8/noroot.jpg" 
                        alt="مثال لرقم المرجع" 
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-bold">رقم المرجع يكون كما هو موضح في الصورة</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <FloatingInput 
                      label="رقم المرجع"
                      type="tel" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={topUpRef}
                      onChange={(e) => {
                        setTopUpRef(e.target.value.replace(/\D/g, ''));
                        setTopUpError(false);
                      }}
                      bgClass="bg-white"
                      className={`text-left font-mono text-sm sm:text-base ${topUpError ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} 
                      dir="ltr" 
                    />
                    {topUpError && <p className="text-[10px] sm:text-xs text-red-500 font-bold mt-1">يرجى إدخال رقم مرجع صحيح (أرقام فقط)</p>}
                  </div>
                </div>

                <button 
                  disabled={!topUpAmount || Number(topUpAmount) <= 0 || isProcessingTopUp}
                  onClick={() => {
                    const amountInBaseCurrency = Number(topUpAmount);
                    const cleanRef = topUpRef.trim();
                    
                    if (!cleanRef || !/^\d{6,15}$/.test(cleanRef)) {
                      setTopUpError(true);
                      showToast('يرجى إدخال رقم مرجع صحيح', 'error');
                      return;
                    }

                    if (amountInBaseCurrency > 0) {
                      setIsProcessingTopUp(true);
                      setTimeout(() => {
                        const newTransaction = {
                          id: crypto.randomUUID(),
                          amount: amountInBaseCurrency,
                          type: 'deposit' as const,
                          date: new Date().toISOString(),
                          status: 'completed' as const,
                          description: `إيداع رصيد (مرجع: ${cleanRef})`
                        };
                        updateUser({
                          ...user,
                          walletBalance: (user.walletBalance || 0) + amountInBaseCurrency,
                          transactions: [newTransaction, ...(user.transactions || [])]
                        } as any);
                        setIsProcessingTopUp(false);
                        setTopUpAmount('');
                        setTopUpRef('');
                        showToast('تم إرسال طلب الإيداع للإدارة (تم إضافة الرصيد فوراً لغرض التجربة)');
                      }, 1500);
                    }
                  }}
                  className={`w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
                    !topUpAmount || Number(topUpAmount) <= 0 || isProcessingTopUp
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-carbon text-white hover:bg-carbon shadow-lg shadow-carbon/10'
                  }`}
                >
                  {isProcessingTopUp ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 sm:border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                      تأكيد الدفع
                    </>
                  )}
                </button>
              </div>

              {/* Transactions History */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-100 shadow-sm">
                <h2 className="text-base sm:text-lg font-bold text-carbon mb-4 sm:mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-solar" />
                  سجل العمليات
                </h2>
                
                <div className="space-y-3 sm:space-y-4">
                  {user.transactions && user.transactions.length > 0 ? (
                    user.transactions.map(tx => (
                      <div key={tx.id} className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/50 gap-2 sm:gap-4">
                        <div className="flex items-start sm:items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                            tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                          }`}>
                            {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4 sm:w-6 sm:h-6" /> : <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-base text-carbon mb-0.5 sm:mb-1 leading-snug line-clamp-2">{tx.description}</p>
                            <p className="text-[9px] sm:text-xs text-titanium/60" dir="ltr">
                              {new Date(tx.date).toLocaleString('ar-u-nu-latn')}
                            </p>
                          </div>
                        </div>
                        <div className="text-left shrink-0 flex flex-col items-end">
                          <div className={`font-bold text-sm sm:text-lg flex items-center gap-1 ${
                            tx.type === 'deposit' ? 'text-emerald-500' : 'text-carbon'
                          }`} dir="ltr">
                            <span>{tx.type === 'deposit' ? '+' : '-'}</span>
                            <PriceDisplay 
                              price={tx.amount} 
                              numberClassName={tx.type === 'deposit' ? 'text-emerald-500' : 'text-slate-900'}
                              currencyClassName={tx.type === 'deposit' ? 'text-emerald-500/70' : 'text-slate-900/70'}
                            />
                          </div>
                          <p className="text-[9px] sm:text-xs font-medium text-emerald-500 mt-0.5">مكتمل</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                      </div>
                      <p className="text-sm sm:text-base text-titanium/60 font-medium">لا توجد عمليات سابقة</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : currentView === 'addresses' ? (
          <motion.div 
            key="addresses"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button 
                onClick={() => {
                  window.scrollTo(0, 0);
                  setCurrentView('menu');
                  setShowAddAddress(false);
                }}
                className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-carbon" />
              </button>
              <h1 className="text-xl font-bold text-carbon">عناوين التوصيل</h1>
            </div>

            <AnimatePresence mode="wait">
              {showAddAddress ? (
                <motion.div
                  key="add-address"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100"
                >
                  <h3 className="font-bold text-carbon mb-4">إضافة عنوان جديد</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <FloatingInput 
                        label="الاسم الأول"
                        type="text" 
                        value={newAddress.firstName} 
                        onChange={e => setNewAddress({...newAddress, firstName: e.target.value})} 
                        bgClass="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <FloatingInput 
                        label="الاسم الأخير"
                        type="text" 
                        value={newAddress.lastName} 
                        onChange={e => setNewAddress({...newAddress, lastName: e.target.value})} 
                        bgClass="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <FloatingInput 
                        label="العنوان بالتفصيل"
                        type="text" 
                        value={newAddress.address} 
                        onChange={e => setNewAddress({...newAddress, address: e.target.value})} 
                        bgClass="bg-slate-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-titanium/80">المدينة</label>
                      <select 
                        value={newAddress.city} 
                        onChange={e => setNewAddress({...newAddress, city: e.target.value})} 
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-carbon outline-none appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1rem center', backgroundSize: '1.5rem' }}
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
                        dir="ltr" 
                        value={newAddress.phone} 
                        onChange={e => setNewAddress({...newAddress, phone: e.target.value.replace(/\D/g, '')})} 
                        bgClass="bg-slate-50"
                        startElement={
                          <div className="flex items-center justify-center bg-slate-100 border-r border-slate-200 h-full text-slate-700 font-bold px-2 relative group/select">
                            <select 
                              value={newAddress.countryCode}
                              onChange={(e) => setNewAddress({...newAddress, countryCode: e.target.value})}
                              className="bg-transparent border-none outline-none text-xs sm:text-sm cursor-pointer appearance-none text-center pr-6 pl-2 h-full"
                              dir="ltr"
                            >
                              <option value="+967">🇾🇪 +967</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1 text-slate-400 pointer-events-none group-hover/select:text-carbon transition-colors" />
                          </div>
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (!newAddress.firstName || !newAddress.lastName || !newAddress.address || !newAddress.phone) {
                          showToast('يرجى تعبئة جميع الحقول', 'error');
                          return;
                        }
                        const addr: Address = {
                          id: crypto.randomUUID(),
                          firstName: newAddress.firstName!,
                          lastName: newAddress.lastName!,
                          address: newAddress.address!,
                          city: newAddress.city || 'صنعاء',
                          phone: newAddress.phone!,
                          countryCode: newAddress.countryCode || '+967'
                        };
                        updateUser({
                          ...user,
                          addresses: [...(user?.addresses || []), addr]
                        } as any);
                        setShowAddAddress(false);
                        setNewAddress({ firstName: '', lastName: '', address: '', city: allCities[0] || 'صنعاء', phone: '', countryCode: '+967' });
                        showToast('تم إضافة العنوان بنجاح');
                      }}
                      className="flex-1 bg-carbon text-white h-12 rounded-xl font-bold hover:bg-carbon transition-colors"
                    >
                      حفظ العنوان
                    </button>
                    <button 
                      onClick={() => setShowAddAddress(false)}
                      className="flex-1 bg-slate-100 text-carbon h-12 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="address-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {user?.addresses && user.addresses.length > 0 ? (
                    user.addresses.map(addr => (
                      <div key={addr.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4 justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-carbon mb-1 truncate">{addr.firstName} {addr.lastName}</h3>
                          <p className="text-xs sm:text-sm text-titanium/80 mb-1 truncate">{addr.address}, {addr.city}</p>
                          <p className="text-xs sm:text-sm text-titanium/80" dir="ltr">{addr.countryCode || '+967'} {addr.phone}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setAddressToDelete(addr.id);
                            setShowAddressDeleteConfirm(true);
                          }}
                          className="w-8 h-8 shrink-0 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100 text-center">
                      <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-titanium/60 font-medium">لا توجد عناوين محفوظة حالياً</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setShowAddAddress(true)}
                    className="w-full bg-carbon/10 text-carbon hover:bg-carbon/20 h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-carbon/20"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة عنوان جديد
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button 
                onClick={() => {
                  window.scrollTo(0, 0);
                  setCurrentView('menu');
                }}
                className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-carbon" />
              </button>
              <h1 className="text-xl font-bold text-carbon">تعديل الحساب</h1>
            </div>

            <div className="bg-white rounded-[2rem] p-5 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-carbon via-purple-500 to-solar"></div>
              
              <div className="space-y-8 mt-4">
                {/* Avatar Edit Section */}
                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-carbon to-solar rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden z-10">
                      {formData.avatar ? (
                        <img src={formData.avatar || undefined} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <User className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 w-11 h-11 bg-carbon text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-carbon transition-colors border-4 border-white z-20 hover:scale-110 transform duration-200">
                      <Camera className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <span className="text-sm text-slate-500 font-medium mt-4">الحد الأقصى للصورة 5 ميجابايت</span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <FloatingInput 
                      label="الاسم الكامل"
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      bgClass="bg-slate-50"
                      icon={<User className="w-5 h-5" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <FloatingInput 
                      label="رقم الجوال"
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                      bgClass="bg-slate-50"
                      dir="ltr"
                      startElement={
                        <div className="flex items-center justify-center bg-slate-100 border-r border-slate-200 h-full text-slate-700 font-bold px-2 relative group/select">
                          <select 
                            value={formData.countryCode}
                            onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                            className="bg-transparent border-none outline-none text-sm cursor-pointer appearance-none text-center font-bold text-titanium/60 pr-6 pl-2 h-full"
                            dir="ltr"
                          >
                            <option value="+967">🇾🇪 +967</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-1 text-slate-400 pointer-events-none group-hover/select:text-carbon transition-colors" />
                        </div>
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <FloatingInput 
                      label="العنوان الوطني"
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      bgClass="bg-slate-50"
                      icon={<MapPin className="w-5 h-5" />}
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <motion.button 
                    whileHover={{ scale: 1.01, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-carbon to-slate-800 hover:from-black hover:to-carbon text-white h-14 rounded-2xl font-bold transition-all shadow-xl shadow-carbon/20 flex items-center justify-center gap-3 text-lg"
                  >
                    <Check className="w-6 h-6" />
                    حفظ التغييرات
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteAccountModal(false)}
              className="fixed inset-0 bg-carbon/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 z-[101] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20"></div>
              
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
              
              <AnimatePresence mode="wait">
                {deleteModalStep === 'reason' ? (
                  <motion.div
                    key="reason"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="flex flex-col items-center text-center mb-5">
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner rotate-3">
                        <Trash2 className="w-7 h-7 text-red-500" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-carbon mb-2">حذف الحساب نهائياً</h2>
                      <p className="text-titanium/70 leading-relaxed text-xs sm:text-sm px-4">
                        نأسف لرحيلك. يرجى إخبارنا بالسبب لمساعدتنا على التحسين.
                      </p>
                    </div>
                    
                    <div className="mb-5 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="flex flex-col gap-2">
                        {[
                          'الأسعار مرتفعة جداً',
                          'لم أجد ما أبحث عنه',
                          'تجربة التطبيق صعبة',
                          'تأخر في التوصيل',
                          'أريد إنشاء حساب جديد',
                          'أسباب أخرى'
                        ].map((reason) => {
                          const isSelected = deletionReason === reason || (reason === 'أسباب أخرى' && !['الأسعار مرتفعة جداً', 'لم أجد ما أبحث عنه', 'تجربة التطبيق صعبة', 'تأخر في التوصيل', 'أريد إنشاء حساب جديد', ''].includes(deletionReason));
                          return (
                            <label
                              key={reason}
                              onClick={() => setDeletionReason(reason === 'أسباب أخرى' ? ' ' : reason)}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-red-500 bg-red-50/50'
                                  : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
                              }`}
                            >
                              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                isSelected ? 'border-red-500' : 'border-slate-300'
                              }`}>
                                {isSelected && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500" />}
                              </div>
                              <span className={`font-bold text-xs sm:text-sm ${
                                isSelected ? 'text-red-600' : 'text-carbon'
                              }`}>
                                {reason}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {!['الأسعار مرتفعة جداً', 'لم أجد ما أبحث عنه', 'تجربة التطبيق صعبة', 'تأخر في التوصيل', 'أريد إنشاء حساب جديد', ''].includes(deletionReason) && (
                        <motion.textarea 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          value={deletionReason.trim()}
                          onChange={(e) => setDeletionReason(e.target.value || ' ')}
                          placeholder="يرجى كتابة السبب هنا..."
                          className="w-full p-3 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all min-h-[80px] text-carbon font-medium mt-2 text-xs sm:text-sm"
                        />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <button 
                        onClick={handleInitiateDelete}
                        disabled={isLoading}
                        className={`w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base ${
                          isLoading 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            متابعة الحذف
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setShowDeleteAccountModal(false)}
                        disabled={isLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-carbon h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black transition-all text-sm sm:text-base disabled:opacity-50"
                      >
                        تراجع
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <ShieldAlert className="w-7 h-7 text-red-500" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-carbon mb-2">تأكيد الهوية</h2>
                      <p className="text-titanium/70 leading-relaxed text-xs sm:text-sm px-4">
                        لحماية بياناتك، أرسلنا كود تحقق إلى رقمك المنتهي بـ <span className="font-bold text-carbon" dir="ltr">{user?.phone?.slice(-4) || '****'}</span>
                      </p>
                    </div>

                    <div className="flex justify-center gap-3 mb-8" dir="ltr">
                      {deleteOtp.map((digit, index) => (
                        <input
                          key={index}
                          id={`delete-otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDeleteOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleDeleteOtpKeyDown(index, e)}
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3">
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={deleteOtp.join('').length < 4 || isLoading}
                        className={`w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base ${
                          deleteOtp.join('').length === 4 && !isLoading
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            تأكيد الحذف النهائي
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => {
                          setDeleteModalStep('reason');
                          setDeleteOtp(['', '', '', '']);
                        }}
                        disabled={isLoading}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-carbon h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black transition-all text-sm sm:text-base disabled:opacity-50"
                      >
                        رجوع
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
