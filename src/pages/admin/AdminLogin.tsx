import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Check, KeyRound, ArrowLeft, Loader2, Smartphone, ChevronDown } from 'lucide-react';
import { FloatingInput } from '../../components/FloatingInput';
import { Toaster, toast } from 'sonner';
import { useStore } from '../../context/StoreContext';
import { 
  auth, db, doc, getDoc, loginWithEmail, resetPassword 
} from '../../lib/firebase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminUsers, logActivity } = useStore();
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+967');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Check if already logged in with authorized email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        const authorizedEmails = ['samesaeed456@gmail.com', 'samisaeed2027@gmail.com', '967776668370@elite-store.local'];
        // Also check for dummy emails if they follow the pattern
        const isAuthorized = authorizedEmails.includes(user.email);
        
        if (isAuthorized) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.role !== 'admin') {
            const { updateDoc, setDoc, serverTimestamp } = await import('../../lib/firebase');
            await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
            
            await setDoc(doc(db, 'admin_users', user.uid), {
              id: user.uid,
              name: user.displayName || userData?.name || 'المدير العام',
              email: user.email,
              role: 'super_admin',
              isActive: true,
              permissions: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security', 'view_logs', 'manage_logistics', 'manage_messages']
            }, { merge: true });
          }

          localStorage.setItem('admin_auth', 'true');
          localStorage.setItem('admin_email', user.email);
          localStorage.setItem('admin_name', userData?.displayName || userData?.name || user.displayName || 'المدير العام');
          localStorage.setItem('admin_role', 'super_admin');
          navigate('/admin');
        }
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const getDummyEmail = (p: string, c: string) => {
    // Remove leading zero if exists (e.g., 077 becomes 77)
    const cleanPhone = p.startsWith('0') ? p.substring(1) : p;
    return `${c.replace('+', '')}${cleanPhone}@elite-store.local`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginEmail = loginMode === 'phone' ? getDummyEmail(phone, countryCode) : email;
      const result = await loginWithEmail(loginEmail, password);
      const user = result.user;
      
      // Check if user is an admin in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // RESTRICTED BYPASS: Only allow specific emails to become admin on first login
      const authorizedEmails = ['samesaeed456@gmail.com', 'samisaeed2027@gmail.com'];
      const isAuthorized = (user.email && authorizedEmails.includes(user.email));

      if (userData?.role === 'admin' || isAuthorized) {
        
        // If they used the bypass or just logged in via phone but are admin, ensure they are in admin_users
        if (isAuthorized || userData?.role === 'admin') {
           const { updateDoc, setDoc } = await import('../../lib/firebase');
           if (userData?.role !== 'admin') {
             await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
           }
           
           await setDoc(doc(db, 'admin_users', user.uid), {
             id: user.uid,
             name: userData?.name || user.displayName || 'المدير العام',
             email: user.email,
             role: 'super_admin',
             isActive: true,
             permissions: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security', 'view_logs', 'manage_logistics', 'manage_messages']
           }, { merge: true });
        }

        localStorage.setItem('admin_auth', 'true');
        localStorage.setItem('admin_email', user.email || '');
        localStorage.setItem('admin_name', userData?.displayName || userData?.name || user.displayName || 'المدير');
        localStorage.setItem('admin_role', userData?.adminRole || 'super_admin');
        
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
        logActivity('محاولة دخول فاشلة', `محاولة دخول غير مصرح بها للبريد/الرقم: ${loginMode === 'phone' ? (countryCode + phone) : email}`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'البيانات غير صحيحة';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') message = 'المستخدم غير موجود أو البيانات خاطئة';
      if (error.code === 'auth/wrong-password') message = 'كلمة المرور خاطئة';
      if (error.code === 'auth/too-many-requests') message = 'تم حظر المحاولات مؤقتاً، حاول لاحقاً';
      
      toast.error(message);
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
      toast.error('فشل إرسال رابط الاستعادة، تأكد من البيانات');
    } finally {
      setIsResetting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 bg-solar rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gold/20 animate-bounce">
            <Zap className="w-8 h-8 text-carbon fill-current" />
          </div>
          <p className="text-slate-500 font-bold animate-pulse">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" dir="rtl">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-carbon via-solar to-solar" />
            
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-solar rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gold/20 -rotate-3 hover:rotate-0 transition-transform duration-300">
                {isForgotPassword ? (
                  <KeyRound className="w-8 h-8 text-carbon" />
                ) : (
                  <Zap className="w-8 h-8 text-carbon fill-current" />
                )}
              </div>
              <h1 className="text-2xl font-black text-carbon mb-2 tracking-tight">
                {isForgotPassword ? 'استعادة كلمة المرور' : 'لوحة تحكم النخبة'}
              </h1>
              <p className="text-sm text-slate-500 font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                دخول آمن للمدراء
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
                    أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                  </p>
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
                  <button 
                    type="submit"
                    disabled={isResetting}
                    className="w-full h-14 bg-carbon text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                  >
                    {isResetting ? <Loader2 className="animate-spin" /> : 'إرسال الرابط'}
                  </button>
                  <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-center text-sm font-bold text-slate-500">العودة</button>
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
                  {/* Login Mode Toggle */}
                  <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => setLoginMode('phone')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'phone' ? 'bg-white shadow-sm text-carbon' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Smartphone className="w-4 h-4" />
                      رقم الهاتف
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMode('email')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'email' ? 'bg-white shadow-sm text-carbon' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني
                    </button>
                  </div>

                  {loginMode === 'phone' ? (
                    <FloatingInput
                      label="رقم الجوال"
                      id="adminPhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="77x xxx xxx"
                      dir="ltr"
                      className="tracking-widest text-left"
                      startElement={
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold px-4 border-r border-slate-200">
                          <select 
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs cursor-pointer appearance-none text-center"
                          >
                            <option value="+967">🇾🇪 +967</option>
                            <option value="+966">🇸🇦 +966</option>
                          </select>
                        </div>
                      }
                    />
                  ) : (
                    <FloatingInput 
                      id="adminEmail"
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
                  )}

                  <FloatingInput 
                    id="adminPassword"
                    label="كلمة المرور"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-5 h-5" />}
                    iconPosition="start"
                    endElement={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-slate-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                    dir="ltr"
                    className="text-left"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${rememberMe ? 'bg-carbon border-carbon text-white' : 'border-slate-300'}`}>
                        {rememberMe && <Check className="w-3 h-3" />}
                      </div>
                      <span className="font-bold text-slate-500">تذكرني</span>
                      <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    </label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="font-bold text-solar">نسيت كلمة المرور؟</button>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-carbon text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>الدخول للإدارة <ArrowLeft className="w-5 h-5" /></>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="mt-8 text-center text-sm font-bold text-slate-400">متجر النخبة © {new Date().getFullYear()}</div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-carbon">
        <div className="absolute inset-0 bg-gradient-to-br from-carbon via-slate-900 to-black opacity-90 z-10" />
        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-white p-12 text-center">
          <div className="w-20 h-20 bg-solar/20 backdrop-blur-md rounded-3xl border border-solar/30 flex items-center justify-center mb-8">
            <Zap className="w-10 h-10 text-solar fill-solar" />
          </div>
          <h2 className="text-3xl font-black mb-4">نظام الإدارة المتطور</h2>
          <p className="text-slate-400 max-w-sm">تحكم كامل بمتجرك، منتجاتك، وعملائك في منصة واحدة ذكية وسريعة.</p>
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
