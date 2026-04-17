import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Check, KeyRound, ArrowLeft } from 'lucide-react';
import { FloatingInput } from '../../components/FloatingInput';
import { Toaster, toast } from 'sonner';
import { useStore } from '../../context/StoreContext';
import { 
  auth, db, doc, getDoc, loginWithEmail, resetPassword 
} from '../../lib/firebase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminUsers, logActivity } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const getDummyEmail = (input: string) => {
    if (input.includes('@')) return input; // It's an email
    
    // It's a phone number, clean it and convert
    const cleanPhone = input.replace(/\D/g, '');
    let countryCode = '967'; // Default to Yemen
    let phone = cleanPhone;
    
    // If it starts with 967 or 966, extract it
    if (cleanPhone.startsWith('967')) {
      countryCode = '967';
      phone = cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('966')) {
      countryCode = '966';
      phone = cleanPhone.substring(3);
    }
    
    return `${countryCode}${phone}@elite-store.local`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginEmail = getDummyEmail(email);
      const result = await loginWithEmail(loginEmail, password);
      const user = result.user;
      
      // Check if user is an admin in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // RESTRICTED BYPASS: Only allow specific emails to become admin on first login
      const authorizedEmails = ['samesaeed456@gmail.com', 'samisaeed2027@gmail.com'];
      const isTemporaryAdmin = user.email && authorizedEmails.includes(user.email);

      if (userData?.role === 'admin' || isTemporaryAdmin) {
        
        // If they used the bypass, upgrade them in the database
        if (userData?.role !== 'admin' && isTemporaryAdmin) {
           const { updateDoc } = await import('../../lib/firebase');
           await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
        }

        localStorage.setItem('admin_auth', 'true');
        localStorage.setItem('admin_email', user.email || '');
        localStorage.setItem('admin_name', userData?.displayName || userData?.name || user.displayName || 'المدير');
        localStorage.setItem('admin_role', userData?.adminRole || 'admin');
        
        if (rememberMe) {
          localStorage.setItem('admin_remember', 'true');
        }
        
        logActivity('تسجيل دخول مشرف', `تم تسجيل دخول المشرف: ${userData?.displayName || userData?.name || user.displayName || 'المدير'}`);
        toast.success(`مرحباً بك مجدداً، ${userData?.displayName || userData?.name || user.displayName || 'المدير'}`);
        navigate('/admin');
      } else {
        // Not an admin
        await auth.signOut();
        toast.error('ليس لديك صلاحية الوصول للوحة التحكم');
        logActivity('محاولة دخول فاشلة', `محاولة دخول غير مصرح بها للبريد/الرقم: ${email}`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'البريد الإلكتروني/رقم الجوال أو كلمة المرور غير صحيحة';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') message = 'المستخدم غير موجود';
      if (error.code === 'auth/wrong-password') message = 'كلمة المرور خاطئة';
      if (error.code === 'auth/too-many-requests') message = 'تم حظر المحاولات مؤقتاً، حاول لاحقاً';
      
      toast.error(message);
      logActivity('محاولة دخول فاشلة', `خطأ في تسجيل الدخول للبريد/الرقم: ${email} - ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      await resetPassword(resetEmail);
      toast.success('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
      setIsForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error('فشل إرسال رابط الاستعادة، تأكد من البريد الإلكتروني');
    } finally {
      setIsResetting(false);
    }
  };

  const fillDemoData = () => {
    const defaultAdmin = adminUsers[0];
    if (defaultAdmin) {
      setEmail(defaultAdmin.email);
      setPassword('admin123');
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" dir="rtl">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
          >
            {/* Decorative Top Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-carbon via-solar to-solar" />
            
            {/* Logo & Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-solar rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gold/20 -rotate-3 hover:rotate-0 transition-transform duration-300">
                {isForgotPassword ? (
                  <KeyRound className="w-8 h-8 text-carbon" />
                ) : (
                  <Zap className="w-8 h-8 text-carbon fill-current" />
                )}
              </div>
              <h1 className="text-2xl font-black text-carbon mb-2 tracking-tight">
                {isForgotPassword ? 'استعادة كلمة المرور' : 'تسجيل الدخول للإدارة'}
              </h1>
              <p className="text-sm text-slate-500 font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                منطقة آمنة ومحمية
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isForgotPassword ? (
                <motion.form 
                  key="forgot-password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleResetPassword} 
                  className="space-y-6"
                >
                  <p className="text-sm text-slate-500 font-medium text-center mb-6 leading-relaxed">
                    أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً لإعادة تعيين كلمة المرور الخاصة بك.
                  </p>

                  <div>
                    <FloatingInput 
                      id="resetEmail"
                      label="البريد الإلكتروني"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      icon={<Mail className="w-5 h-5" />}
                      iconPosition="start"
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isResetting}
                    className="w-full h-14 bg-carbon text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 group"
                  >
                    {isResetting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'إرسال رابط الاستعادة'
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="text-sm font-bold text-slate-500 hover:text-carbon transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <ArrowRight className="w-4 h-4" />
                      العودة لتسجيل الدخول
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleLogin} 
                  className="space-y-6"
                >
                  <div>
                    <FloatingInput 
                      id="email"
                      label="البريد الإلكتروني"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={<Mail className="w-5 h-5" />}
                      iconPosition="start"
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div>
                    <FloatingInput 
                      id="password"
                      label="كلمة المرور"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="w-5 h-5" />}
                      iconPosition="start"
                      endElement={
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 text-slate-400 hover:text-carbon transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      }
                      required
                      dir="ltr"
                      className="text-left pr-12"
                    />
                  </div>

                  {/* Options Row */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-carbon border-carbon text-white' : 'border-slate-300 group-hover:border-carbon'}`}>
                        {rememberMe && <Check className="w-3 h-3" />}
                      </div>
                      <span className="font-bold text-slate-600 select-none">تذكرني</span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                    </label>

                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(true)}
                      className="font-bold text-solar hover:text-carbon transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-carbon text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 group"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        الدخول للوحة التحكم
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>



                  {/* Demo Credentials Hint */}
                  <div className="mt-8 text-center">
                    <button 
                      type="button"
                      onClick={fillDemoData}
                      className="text-[11px] font-bold text-slate-400 hover:text-solar transition-colors underline underline-offset-4"
                    >
                      تعبئة بيانات الدخول التجريبية
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Back to Store Link */}
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-sm font-bold text-slate-500 hover:text-carbon transition-colors"
            >
              العودة للمتجر
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-carbon">
        <div className="absolute inset-0 bg-gradient-to-br from-carbon via-slate-900 to-black opacity-90 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
          alt="Dashboard Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        
        {/* Abstract Shapes */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-solar rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-20 h-full flex flex-col items-center justify-center text-white p-12 text-center">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <Zap className="w-12 h-12 text-solar fill-solar" />
          </div>
          <h2 className="text-4xl font-black mb-6 leading-tight">
            مرحباً بك في <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar to-amber-200">
              لوحة تحكم النخبة
            </span>
          </h2>
          <p className="text-lg text-slate-300 font-medium max-w-md leading-relaxed">
            قم بإدارة متجرك، تتبع مبيعاتك، وتواصل مع عملائك من مكان واحد بكل سهولة وأمان.
          </p>
        </div>
      </div>
    </div>
  );
}
