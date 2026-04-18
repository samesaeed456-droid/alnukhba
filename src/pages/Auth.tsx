import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Zap, ChevronDown, ShieldCheck, Loader2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { parseSmartError } from '../lib/errorUtils';
import { 
  auth, db, doc, getDoc, setDoc, serverTimestamp, loginWithEmail, signupWithEmail
} from '../lib/firebase';
import FloatingInput from '../components/FloatingInput';

import Logo from '../components/Logo';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'form' | 'verification' | 'forgot_password' | 'reset_password'>('form');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [isResending, setIsResending] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, showToast } = useStore();

  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/profile';
  const mode = queryParams.get('mode');

  React.useEffect(() => {
    if (location.pathname === '/signup' || mode === 'signup') {
      setIsLogin(false);
    }
    const stepParam = queryParams.get('step');
    if (stepParam === 'forgot_password') {
      setStep('forgot_password');
      setIsLogin(true);
    }
  }, [location.pathname, mode, location.search]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+967',
    password: ''
  });

  // Timer logic for resend
  React.useEffect(() => {
    let interval: any;
    if (step === 'verification' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Web OTP API implementation
  React.useEffect(() => {
    if (step !== 'verification' || !('OTPCredential' in window)) return;

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
            setOtp(digits);
            // Small delay before auto-submit for better UX
            setTimeout(() => {
              const verifyButton = document.getElementById('verify-submit-btn');
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
  }, [step]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;
    if (value.length > 1) return;
    
    setOtp(prev => {
      const newOtp = [...prev];
      newOtp[index] = value;
      return newOtp;
    });

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }, [otp]);

  const handleResendCode = useCallback(async () => {
    setIsResending(true);
    setError('');
    
    try {
      const fullPhone = formData.countryCode + formData.phone;
      
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setVerificationToken(data.token);
        setTimer(59);
        showToast('تم إعادة إرسال كود التحقق بنجاح');
      } else {
        setError(data.error || 'تعذر إرسال الكود. يرجى المحاولة لاحقاً');
        // Fallback for demo environment if SMS is not configured or returns 405
        setTimer(59);
        showToast('تم إرسال كود التحقق (وضع ديمو مفعل)');
      }
    } catch (err) {
      showToast('حدث خطأ أثناء إرسال الكود');
    } finally {
      setIsResending(false);
    }
  }, [formData, showToast]);

  const getDummyEmail = useCallback((countryCode: string, phone: string) => {
    return `${countryCode.replace('+', '')}${phone}@elite-store.local`;
  }, []);

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4) {
      setError('يرجى إدخال كود التحقق كاملاً');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const fullPhone = formData.countryCode + formData.phone;
      
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: fullPhone, 
          otp: code, 
          token: verificationToken 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const prevStep = (window as any)._authPrevStep;
        if (prevStep === 'forgot_password') {
          setStep('reset_password');
          delete (window as any)._authPrevStep;
          setIsLoading(false);
          return;
        }

        // Proceed with Signup
        const email = getDummyEmail(formData.countryCode, formData.phone);
        const userCred = await signupWithEmail(email, formData.password);
        
        try {
          // Update Firebase Auth profile
          await import('firebase/auth').then(({ updateProfile }) => {
            updateProfile(userCred.user, { displayName: formData.name }).catch(console.error);
          });
        } catch (e) {}
        
        // Save to Firestore (must include uid and email to quickly satisfy firestore.rules)
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: email,
          name: formData.name,
          phone: formData.phone,
          countryCode: formData.countryCode,
          role: 'user',
          walletBalance: 0,
          createdAt: serverTimestamp()
        }, { merge: true });

        showToast('تم إنشاء الحساب بنجاح');
        navigate(redirectPath);
      } else {
        setError(data.error || 'كود التحقق غير صحيح');
      }
    } catch (err: any) {
      console.error('Verification Error:', err);
      const smartError = parseSmartError(err);
      setError(smartError.message);
    } finally {
      setIsLoading(false);
    }
  }, [otp, showToast, formData, getDummyEmail, navigate, redirectPath]);

  const validatePhone = useCallback((phone: string) => {
    if (formData.countryCode === '+967') {
      const yemenPhoneRegex = /^7\d{8}$/;
      return yemenPhoneRegex.test(phone);
    }
    return /^\d{7,15}$/.test(phone);
  }, [formData.countryCode]);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  const getLockoutData = useCallback((phone: string) => {
    const lockouts = JSON.parse(localStorage.getItem('login_lockouts') || '{}');
    return lockouts[phone] || { attempts: 0, lockedUntil: 0 };
  }, []);

  const updateLockoutData = useCallback((phone: string, data: { attempts: number; lockedUntil: number }) => {
    const lockouts = JSON.parse(localStorage.getItem('login_lockouts') || '{}');
    lockouts[phone] = data;
    localStorage.setItem('login_lockouts', JSON.stringify(lockouts));
  }, []);

  const clearLockoutData = useCallback((phone: string) => {
    const lockouts = JSON.parse(localStorage.getItem('login_lockouts') || '{}');
    delete lockouts[phone];
    localStorage.setItem('login_lockouts', JSON.stringify(lockouts));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!isLogin) {
      const nameParts = formData.name.trim().split(/\s+/);
      if (nameParts.length < 4) {
        setError('يرجى إدخال الاسم الرباعي كاملاً (مثال: حسين عبد الكريم هزاع)');
        return;
      }
    }

    if (!formData.phone) {
      setError('يرجى إدخال رقم الجوال');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('رقم الجوال غير صحيح. يجب أن يبدأ بـ 7 ويتكون من 9 أرقام');
      return;
    }

    if (!isLogin && !agreedToTerms) {
      setError('يجب الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Direct login
        const email = getDummyEmail(formData.countryCode, formData.phone);
        await loginWithEmail(email, formData.password);
        showToast('تم تسجيل الدخول بنجاح');
        navigate(redirectPath);
      } else {
        // Signup requires OTP via backend
        const fullPhone = formData.countryCode + formData.phone;

        try {
          const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: fullPhone }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setVerificationToken(data.token);
            setStep('verification');
            showToast('تم إرسال كود التحقق إلى هاتفك');
          } else {
            setError(data.error || 'تعذر إرسال كود التحقق');
          }
        } catch (smsError) {
          console.error("SMS API not available:", smsError);
          setError('حدث خطأ أثناء الاتصال بخادم الرسائل');
        }
      }
    } catch (err: any) {
      console.error("Full Auth Error Object:", err);
      const smartError = parseSmartError(err);
      setError(smartError.message);
      
      if (smartError.isConfigError || smartError.message === 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً') {
        console.error("Technical Details:", smartError.technicalDetails || err.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLogin, formData, agreedToTerms, validatePhone, showToast, getDummyEmail, navigate, redirectPath]);

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.phone) {
      setError('يرجى إدخال رقم الجوال');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('رقم الجوال غير صحيح');
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = formData.countryCode + formData.phone;
      
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationToken(data.token);
        (window as any)._authPrevStep = 'forgot_password';
        setStep('verification');
        showToast('تم إرسال كود التحقق لاستعادة كلمة المرور');
      } else {
        setError(data.error || 'تعذر إرسال كود التحقق');
      }
    } catch (err) {
      console.error("Error in handleForgotPassword:", err);
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  }, [formData.phone, formData.countryCode, validatePhone, showToast]);

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          countryCode: formData.countryCode,
          phone: formData.phone,
          newPassword: newPassword 
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('تم بنجاح! يرجى تسجيل الدخول بكلمة المرور الجديدة');
        setStep('form');
        setIsLogin(true);
        // Clear passwords
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Show specific error from server if admin SDK is not setup
        setError(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
        if (data.error === "إعدادات Firebase Admin غير متوفرة في السيرفر") {
           showToast('عذراً، الخادم غير مهيأ لاستعادة كلمات المرور حالياً. تواصل مع الدعم الفني.', 'error');
        }
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError('فشل الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  }, [newPassword, confirmPassword, formData, showToast]);

  const getTitle = useCallback(() => {
    if (step === 'verification') return 'كود التحقق';
    if (step === 'forgot_password') return 'استعادة كلمة المرور';
    if (step === 'reset_password') return 'تعيين كلمة مرور جديدة';
    return isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
  }, [step, isLogin]);

  const getSubtitle = useCallback(() => {
    if (step === 'verification') return `تم إرسال كود التحقق إلى الرقم ${formData.phone}`;
    if (step === 'forgot_password') return 'أدخل رقم جوالك لتلقي كود استعادة الحساب';
    if (step === 'reset_password') return 'يرجى اختيار كلمة مرور قوية وسهلة التذكر';
    return isLogin ? 'أهلاً بك مجدداً في متجرنا' : 'انضم إلينا واستمتع بأفضل العروض والخدمات الحصرية';
  }, [step, isLogin, formData.phone]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-solar/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-carbon/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-7xl flex flex-col md:flex-row bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10"
      >
        {/* Left Side: Image/Branding (Visible on Desktop) */}
        <div className="hidden md:flex md:w-1/2 bg-carbon relative overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2070" 
              alt="Shopping Experience" 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/50 to-transparent" />
          </div>
          
          <div className="relative z-10 p-12 flex flex-col justify-between h-full text-white">
            <div>
              <Logo variant="light" className="h-12" />
            </div>
            
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-4xl font-black leading-tight mb-4">
                  {isLogin ? 'مرحباً بك مجدداً في عالم التسوق الذكي' : 'ابدأ رحلتك معنا اليوم واستمتع بمزايا حصرية'}
                </h2>
                <p className="text-slate-300 text-lg font-medium leading-relaxed">
                  {isLogin 
                    ? 'سجل دخولك للوصول إلى سلة تسوقك، طلباتك السابقة، وعروضك المخصصة.' 
                    : 'أنشئ حسابك الآن لتحصل على خصومات فورية، تتبع طلباتك بكل سهولة، وتجربة تسوق لا مثيل لها.'}
                </p>
              </motion.div>
              
              <div className="flex items-center gap-6 pt-8 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">+50k</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">عميل سعيد</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">+10k</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">منتج أصلي</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-emerald-400">24/7</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">دعم فني</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-5 sm:p-10 lg:p-14 flex flex-col justify-center min-h-[500px] sm:min-h-[600px] relative">
          {step !== 'form' && (
            <button 
              onClick={() => {
                setStep('form');
                setError('');
                setSuccess('');
              }}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 text-slate-400 hover:text-carbon hover:bg-slate-100 rounded-full transition-all z-20"
              title="العودة"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          )}

          <div className="md:hidden flex justify-center mb-6">
            <div>
              <Logo variant="dark" className="h-10" />
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <motion.h1 
              key={step + (isLogin ? 'login-title' : 'signup-title')}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-black text-carbon mb-2 tracking-tight"
            >
              {getTitle()}
            </motion.h1>
            <motion.p 
              key={step + (isLogin ? 'login-sub' : 'signup-sub')}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 font-medium text-sm sm:text-base leading-relaxed"
            >
              {getSubtitle()}
            </motion.p>
          </div>

          {step === 'form' && (
            <div className="relative flex p-1 bg-slate-100 rounded-2xl mb-8 w-full max-w-[320px] mx-auto md:mx-0">
              <motion.div
                className="absolute inset-y-1 bg-white rounded-xl shadow-sm z-0"
                initial={false}
                animate={{
                  x: isLogin ? '-100%' : '0%',
                  width: '50%'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setSuccess('');
                }}
                className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors ${!isLogin ? 'text-carbon' : 'text-slate-400'}`}
              >
                إنشاء حساب
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setSuccess('');
                }}
                className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors ${isLogin ? 'text-carbon' : 'text-slate-400'}`}
              >
                تسجيل الدخول
              </button>
            </div>
          )}

          <div className="relative">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-600 text-sm font-bold overflow-hidden"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center gap-3 text-emerald-600 text-sm font-bold overflow-hidden"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {step === 'form' ? (
                  <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
                    <AnimatePresence mode="popLayout">
                      {!isLogin && (
                        <motion.div 
                          key="name-field"
                          initial={{ opacity: 0, height: 0, scale: 0.95 }}
                          animate={{ opacity: 1, height: 'auto', scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                        >
                          <FloatingInput
                            label="الاسم الرباعي كاملاً"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            icon={<User className="w-5 h-5" />}
                            iconPosition="end"
                            autoComplete="name"
                            error={!!error}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <FloatingInput
                        label="رقم الجوال"
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={9}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="77x xxx xxx"
                        dir="ltr"
                        className="tracking-widest text-left"
                        error={!!error}
                        startElement={
                          <div className="flex items-center justify-center h-full text-slate-400 font-bold px-4 relative group/select border-r border-slate-200">
                            <select 
                              value={formData.countryCode}
                              onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                              className="bg-transparent border-none outline-none text-xs cursor-pointer appearance-none text-center pr-5 pl-1"
                            >
                              <option value="+967">🇾🇪 +967</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 text-slate-300 pointer-events-none group-hover/select:text-carbon transition-colors" />
                          </div>
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between px-1 mb-2">
                        {isLogin && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setStep('forgot_password');
                              setError('');
                              setSuccess('');
                            }}
                            className="text-[10px] font-bold text-slate-400 hover:text-solar transition-colors mr-auto"
                          >
                            نسيت كلمة المرور؟
                          </button>
                        )}
                      </div>
                      <FloatingInput
                        label="كلمة المرور"
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        icon={<Lock className="w-5 h-5" />}
                        iconPosition="start"
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        dir="ltr"
                        className="text-left"
                        error={!!error}
                        endElement={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`px-4 transition-colors h-full flex items-center justify-center ${formData.password ? 'text-slate-400 hover:text-solar' : 'text-slate-200'}`}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        }
                      />
                    </div>

                    {!isLogin && (
                      <div className="flex items-start gap-3 px-1 py-1">
                        <div className="relative flex items-center h-5 pt-0.5">
                          <input
                            id="terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="w-4 h-4 text-solar border-slate-300 rounded focus:ring-solar cursor-pointer transition-all accent-solar"
                          />
                        </div>
                        <label htmlFor="terms" className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed cursor-pointer select-none">
                          أوافق على <Link to="/terms" className="text-slate-600 font-bold hover:text-carbon underline">شروط الخدمة</Link> و <Link to="/privacy" className="text-slate-600 font-bold hover:text-carbon underline">سياسة الخصوصية</Link>.
                        </label>
                      </div>
                    )}

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 sm:h-14 bg-gold-gradient hover:bg-gold-shimmer disabled:opacity-50 text-black font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 mt-6 sm:mt-8 shadow-sm hover:shadow-md text-base sm:text-lg"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Zap className="w-6 h-6 fill-white" />
                        </motion.div>
                      ) : (
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={isLogin ? 'login-btn' : 'signup-btn'}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2"
                          >
                            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                            <ArrowRight className="w-5 h-5" />
                          </motion.span>
                        </AnimatePresence>
                      )}
                    </motion.button>
                  </form>
                ) : step === 'forgot_password' ? (
                  <form onSubmit={handleForgotPassword} className="space-y-6 sm:space-y-7">
                    <div>
                      <FloatingInput
                        label="رقم الجوال"
                        id="forgot-phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={9}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="77x xxx xxx"
                        dir="ltr"
                        className="tracking-widest text-left"
                        error={!!error}
                        startElement={
                          <div className="flex items-center justify-center h-full text-slate-400 font-bold px-4 relative group/select border-r border-slate-200">
                            <select 
                              value={formData.countryCode}
                              onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                              className="bg-transparent border-none outline-none text-xs cursor-pointer appearance-none text-center pr-5 pl-1"
                            >
                              <option value="+967">🇾🇪 +967</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 text-slate-300 pointer-events-none group-hover/select:text-carbon transition-colors" />
                          </div>
                        }
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 sm:h-14 bg-gold-gradient hover:bg-gold-shimmer text-black font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-base sm:text-lg mt-2"
                    >
                      {isLoading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
                      {!isLoading && <ArrowRight className="w-5 h-5" />}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setError('');
                        setSuccess('');
                      }}
                      className="w-full text-center text-sm font-bold text-slate-400 hover:text-solar transition-colors pt-2"
                    >
                      العودة لتسجيل الدخول
                    </button>
                  </form>
                ) : step === 'reset_password' ? (
                  <form onSubmit={handleResetPassword} className="space-y-6 sm:space-y-7">
                    <div>
                      <FloatingInput
                        label="كلمة المرور الجديدة"
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        icon={<Lock className="w-5 h-5" />}
                        iconPosition="start"
                        dir="ltr"
                        className="text-left"
                        error={!!error}
                        endElement={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`px-4 transition-colors h-full flex items-center justify-center ${newPassword ? 'text-slate-400 hover:text-solar' : 'text-slate-200'}`}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        }
                      />
                    </div>

                    <div>
                      <FloatingInput
                        label="تأكيد كلمة المرور الجديدة"
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<ShieldCheck className="w-5 h-5" />}
                        iconPosition="start"
                        dir="ltr"
                        className="text-left"
                        error={!!error}
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 sm:h-14 bg-gold-gradient hover:bg-gold-shimmer text-black font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-base sm:text-lg mt-2"
                    >
                      {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                      {!isLoading && <CheckCircle2 className="w-5 h-5" />}
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={handleVerify} className="space-y-6 sm:space-y-8">
                    <div className="flex justify-center gap-3 sm:gap-4" dir="ltr">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          className={`w-12 h-14 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-white rounded-xl focus:ring-1 outline-none transition-all text-carbon shadow-sm border ${error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-solar focus:border-solar'}`}
                        />
                      ))}
                    </div>

                    <div className="text-center space-y-4">
                      <p className="text-sm font-bold text-slate-500">
                        لم يصلك الرمز؟ {' '}
                        {timer > 0 ? (
                          <span className="text-slate-500">إعادة الإرسال خلال {timer} ثانية</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isResending}
                            className="text-carbon font-bold hover:underline disabled:opacity-50"
                          >
                            {isResending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
                          </button>
                        )}
                      </p>

                      <motion.button 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        id="verify-submit-btn"
                        disabled={isLoading}
                        className="w-full h-12 sm:h-14 bg-gold-gradient hover:bg-gold-shimmer disabled:opacity-50 text-black font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-base sm:text-lg"
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Loader2 className="w-6 h-6 text-black" />
                          </motion.div>
                        ) : (
                          <>
                            تأكيد الرمز
                            <CheckCircle2 className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => setStep('form')}
                        className="text-sm font-bold text-slate-400 hover:text-carbon transition-colors"
                      >
                        تغيير رقم الهاتف
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>

            <motion.div 
              variants={itemVariants}
              className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-4 sm:gap-10"
            >
              <div className="flex items-center gap-1.5 text-slate-400/80">
                <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500/70" />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">تشفير آمن</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400/80">
                <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">حماية البيانات</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400/80">
                <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-carbon/60" />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">موثوق</span>
              </div>
            </motion.div>
          </div>
        </div>
        </motion.div>
      </div>
    );
  }

