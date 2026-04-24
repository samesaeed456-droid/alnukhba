import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Lock, ShieldCheck, Eye, EyeOff, Check, ArrowLeft, Loader2, Fingerprint, Home } from 'lucide-react';
import { FloatingInput } from '../../components/FloatingInput';
import { Toaster, toast } from 'sonner';
import { useStore } from '@/context/StoreContext';
import { startAuthentication } from '@simplewebauthn/browser';
import { signInWithCustomToken } from 'firebase/auth';
import { 
  auth, db, doc, getDoc, loginWithEmail, signupWithEmail,
  query, collection, where, getDocs
} from '../../lib/firebase';
import { getAdminDummyEmail } from '../../lib/adminAuth';
import Logo from '../../components/Logo';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminUsers, logActivity } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    localStorage.setItem('admin_attempt', 'true');
    try {
      const currentSessionId = localStorage.getItem('local_session_id') || 'anon';
      
      const res = await fetch('/api/webauthn/login/generate', {
        method: 'POST',
        headers: { 'x-session-id': currentSessionId }
      });
      
      const resText = await res.text();
      if (!res.ok) throw new Error(`Server returned ${res.status}: ${resText}`);
      const options = JSON.parse(resText);
      if (options.error) throw new Error(options.error);

      const sessionToken = options.sessionToken;
      const expectedChallenge = options.challenge;

      let response;
      try {
        response = await startAuthentication({ optionsJSON: options });
      } catch (authErr: any) {
         if (authErr.name === 'NotAllowedError') {
           setIsLoading(false);
           return; 
         }
         throw authErr;
      }

      const verifyRes = await fetch('/api/webauthn/login/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': currentSessionId
        },
        body: JSON.stringify({ response, challenge: expectedChallenge, sessionToken })
      });
      
      const verifyText = await verifyRes.text();
      if (!verifyRes.ok) throw new Error(`Server returned ${verifyRes.status}: ${verifyText}`);
      const verifyData = JSON.parse(verifyText);
      
      if (verifyData.success) {
        await signInWithCustomToken(auth, verifyData.customToken);
        toast.success('تم تسجيل الدخول بالبصمة بنجاح!');
        // Navigation will be handled by useEffect auth listener
      } else {
        throw new Error(verifyData.error || 'فشل التحقق');
      }
    } catch (err: any) {
      console.error("[Admin Passkey Login Error]:", err);
      if (err.name === 'NotAllowedError') {
        toast.error('تم إلغاء العملية');
      } else if (err.name === 'NotSupportedError') {
        toast.error('المتصفح لا يدعم البصمة هنا. يرجى فتح المتصفح بشكل كامل.');
      } else {
        toast.error(`خطأ في البصمة: ${err.message || 'يرجى المحاولة بالطريقة التقليدية'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if already logged in with authorized email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        // Super Admins hardcoded list
        const superAdmins = [
          'samesaeed456@gmail.com', 
          'samisaeed2027@gmail.com',
          'samesaeed@gmail.com'
        ];
        
        const userEmail = user.email.toLowerCase();
        let isAuthorized = superAdmins.includes(userEmail);
        let currentAdminRole = isAuthorized ? 'super_admin' : 'editor';
        let currentAdminName = isAuthorized ? 'المدير العام' : 'مشرف';

        // Check if the user is authorized in the admin_users collection
        // Since we now use UID as document ID in admin_users, we check directly for maximum speed and security
        const adminDoc = await getDoc(doc(db, 'admin_users', user.uid));
        
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          if (adminData.isActive === false) {
             toast.error('هذا الحساب تم تعطيله من قبل المدير العام');
             await auth.signOut();
             return;
          }
          isAuthorized = true;
          currentAdminRole = adminData.role || 'editor';
          currentAdminName = adminData.name || 'مشرف';
        } else {
          // Fallback check for emails (to handle the very first login after manual addition)
          const adminQuery = query(collection(db, 'admin_users'), where('email', '==', user.email));
          const adminSnap = await getDocs(adminQuery);
          
          if (adminSnap && !adminSnap.empty && adminSnap.docs && adminSnap.docs.length > 0) {
            isAuthorized = true;
            const legacyDoc = adminSnap.docs[0];
            const adminData = legacyDoc.data();
            currentAdminRole = adminData.role || 'editor';
            currentAdminName = adminData.name || 'مشرف';

            // Radical Sync: Record exists by email but not by UID (document ID mismatch).
            // We migrate it NOW so future logins are instant and rules work perfectly.
            const { setDoc, deleteDoc } = await import('../../lib/firebase');
            await setDoc(doc(db, 'admin_users', user.uid), {
              ...adminData,
              id: user.uid,
              lastLogin: new Date().toISOString()
            }, { merge: true });
            
            // Cleanup the legacy random ID record if it's different
            if (legacyDoc.id !== user.uid) {
              await deleteDoc(doc(db, 'admin_users', legacyDoc.id));
            }
          }
        }
        
        if (isAuthorized) {
          localStorage.setItem('admin_auth', 'true');
          localStorage.setItem('admin_email', user.email);
          localStorage.setItem('admin_name', currentAdminName);
          localStorage.setItem('admin_role', currentAdminRole);
          navigate('/admin');
        } else {
          if (localStorage.getItem('admin_attempt') === 'true') {
            toast.error('هذا الحساب ليس لديه صلاحيات إدارية');
            localStorage.removeItem('admin_attempt');
            await auth.signOut();
          }
        }
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    localStorage.setItem('admin_attempt', 'true');

    try {
      let result;
      try {
        result = await loginWithEmail(email, password);
      } catch (authError: any) {
        const isCredentialError = 
          authError.code === 'auth/user-not-found' || 
          authError.code === 'auth/invalid-credential' ||
          authError.code === 'auth/invalid-email';

        if (isCredentialError) {
          const adminsRef = collection(db, 'admin_users');
          const allAdmins = await getDocs(adminsRef);
          const adminDoc = allAdmins.docs.find(d => d.data()?.email?.toLowerCase() === email.toLowerCase())?.data();
          
          if (adminDoc) {
            if (adminDoc.password === password) {
              toast.info('جاري تفعيل الحساب الإداري لأول مرة...');
              try {
                result = await signupWithEmail(email, password);
              } catch (signUpErr: any) {
                if (signUpErr.code === 'auth/email-already-in-use') {
                   // Possible password sync failure, try force sync via server
                   const syncRes = await fetch('/api/admin/update-password', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ email, newPassword: password })
                   });
                   const syncData = await syncRes.json();
                   if (syncData.success) {
                      result = await loginWithEmail(email, password);
                   } else {
                      throw new Error(syncData.error || 'فشل تحديث البيانات التوثيقية');
                   }
                } else {
                  throw signUpErr;
                }
              }
            } else {
              toast.error('كلمة المرور غير صحيحة');
              setIsLoading(false);
              return;
            }
          } else {
            toast.error('هذا البريد غير مسجل في قائمة المشرفين');
            setIsLoading(false);
            return;
          }
        } else {
          throw authError;
        }
      }

      // If login successful, the useEffect Auth listener will handle the redirection logic
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'حدث خطأ أثناء تسجيل الدخول';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') message = 'البيانات غير صحيحة';
      if (error.code === 'auth/wrong-password') message = 'كلمة المرور خاطئة';
      if (error.code === 'auth/too-many-requests') message = 'تم حظر المحاولات مؤقتاً، حاول لاحقاً';
      if (error.message && !error.code) message = error.message;
      
      toast.error(message);
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 sm:p-6 font-sans relative overflow-hidden" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-solar/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-carbon/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl flex flex-col md:flex-row bg-white rounded-none sm:rounded-[40px] shadow-2xl shadow-slate-200/50 border-0 sm:border border-slate-100 overflow-hidden relative z-10 min-h-screen sm:min-h-0"
      >
        {/* Left Side: Branding & Info */}
        <div className="hidden md:flex md:w-1/2 bg-carbon relative overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
              alt="Admin Experience" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
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
                <div className="w-16 h-16 bg-solar/20 backdrop-blur-md rounded-2xl border border-solar/30 flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-solar fill-solar" />
                </div>
                <h2 className="text-4xl font-black leading-tight mb-4 tracking-tight">
                  نظام الإدارة المتطور<br /> لمتجر النخبة
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  تحكم كامل بمتجرك، منتجاتك، وعملائك في منصة واحدة ذكية وسريعة.
                </p>
              </motion.div>
              
              <div className="flex items-center gap-8 pt-8 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">100%</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">تحكم آمن</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">Live</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">مراقبة فورية</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
              إدارة النخبة الذكية • الإصدار 4.2.0
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
          <button 
            onClick={() => navigate('/')}
            className="absolute top-8 right-8 p-2.5 text-slate-400 hover:text-carbon hover:bg-slate-50 rounded-2xl transition-all border border-slate-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter"
          >
            <Home className="w-4 h-4" />
            <span>الرجوع للمتجر</span>
          </button>

          <div className="md:hidden flex justify-center mb-10">
            <Logo variant="dark" className="h-12" />
          </div>

          <div className="mb-10 text-center md:text-right">
            <h1 className="text-3xl font-black text-carbon mb-2 tracking-tight">
              تسجيل دخول الإدارة
            </h1>
            <p className="text-slate-500 font-bold text-sm leading-relaxed flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              يرجى إدخال بياناتك للوصول للوحة التحكم
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleLogin} 
              className="space-y-6"
            >
              <div className="space-y-5">
                <FloatingInput
                  label="البريد الإلكتروني للإدارة"
                  id="adminEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@elite.com"
                  dir="ltr"
                  className="text-left"
                  required
                />

                <div className="relative">
                  <FloatingInput 
                    id="adminPassword"
                    label="كلمة المرور"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-5 h-5" />}
                    iconPosition="start"
                    required
                    dir="ltr"
                    className="text-left"
                  />
                  <div className="absolute left-1 top-1 bottom-1 flex items-center gap-1">
                    {!password && (
                      <button 
                        type="button" 
                        onClick={handlePasskeyLogin} 
                        disabled={isLoading}
                        className="px-3 h-full flex items-center justify-center text-orange-500 hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
                        title="دخول سريع بالبصمة"
                      >
                        <Fingerprint className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="px-3 h-full flex items-center justify-center text-slate-400 hover:text-carbon transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-carbon border-carbon text-white shadow-lg shadow-carbon/20' : 'border-slate-200 group-hover:border-slate-300'}`}>
                    {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="font-bold text-xs text-slate-500 select-none">تذكر حذائي الإداري</span>
                  <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                </label>

                <button 
                  type="button"
                  onClick={async () => {
                    if (!email) return toast.error('يرجى إدخال البريد أولاً');
                    try {
                      const { sendPasswordResetEmail } = await import('firebase/auth');
                      await sendPasswordResetEmail(auth, email);
                      toast.success('تم إرسال رابط استعادة كلمة المرور لبريدك');
                    } catch (e: any) {
                      toast.error('فشل إرسال الرابط: ' + (e.message || 'خطأ غير معروف'));
                    }
                  }}
                  className="text-xs font-black text-solar hover:text-solar/80 transition-colors"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-carbon text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-carbon/30 active:scale-[0.98] disabled:opacity-70 group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <span>تسجيل الدخول للنظام</span>
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </>
                )}
              </button>

              <div className="pt-6 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  هذا النظام محمي بطبقات أمان النخبة. أي محاولة دخول غير مصرح بها يتم تسجيلها فورياً.
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
