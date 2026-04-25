import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, ShieldCheck, Eye, EyeOff, Check, ArrowLeft, Loader2, Fingerprint, Home } from 'lucide-react';
import { FloatingInput } from '../../components/FloatingInput';
import { Toaster, toast } from 'sonner';
import { useStore } from '@/context/StoreContext';
import { startAuthentication } from '@simplewebauthn/browser';
import { signInWithCustomToken } from 'firebase/auth';
import { 
  auth, db, doc, getDoc, loginWithEmail, signupWithEmail, signInWithGoogle,
  query, collection, where, getDocs
} from '../../lib/firebase';
import { getAdminDummyEmail } from '../../lib/adminAuth';

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
          'samisaeed2027@gmail.com'
        ];
        
        let isAuthorized = superAdmins.includes(user.email);
        let currentAdminRole = isAuthorized ? 'super_admin' : 'editor';
        let currentAdminName = isAuthorized ? 'المدير العام' : 'مشرف';

        // Check if the user exists in our admin_users collection
        const adminQuery = query(collection(db, 'admin_users'), where('email', '==', user.email));
        const adminSnap = await getDocs(adminQuery);
        
        if (adminSnap && !adminSnap.empty && adminSnap.docs && adminSnap.docs.length > 0) {
          isAuthorized = true;
          const adminData = adminSnap.docs[0].data();
          currentAdminRole = adminData.role || 'editor';
          currentAdminName = adminData.name || 'مشرف';
        }
        
        if (isAuthorized) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          // Ensure the user record in 'users' collection has the admin flag and name
          if (userData?.role !== 'admin' || userData?.adminName !== currentAdminName) {
            const { updateDoc, setDoc } = await import('../../lib/firebase');
            await setDoc(doc(db, 'users', user.uid), { 
              role: 'admin',
              adminName: currentAdminName,
              email: user.email,
              name: currentAdminName, 
              lastActive: new Date().toISOString()
            }, { merge: true });
            
            // If they are a super admin but don't have a record in admin_users, create one
            if (superAdmins.includes(user.email) && adminSnap.empty) {
              await setDoc(doc(db, 'admin_users', user.uid), {
                id: user.uid,
                name: currentAdminName,
                email: user.email,
                role: 'super_admin',
                isActive: true,
                permissions: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security', 'view_logs', 'manage_logistics', 'manage_messages'],
                createdAt: new Date().toISOString()
              }, { merge: true });
            }
          }

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
        // If user not found in Auth, check if they exist in admin_users (pre-registered by super admin)
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          const adminsRef = collection(db, 'admin_users');
          const emailQuery = query(adminsRef, where('email', '==', email));
          const querySnapshot = await getDocs(emailQuery);
          
          if (!querySnapshot.empty) {
            const adminDoc = querySnapshot.docs[0].data();
            // Verify password matches (This is a bridge for pre-registered admins)
            if (adminDoc.password === password) {
              toast.info('جاري تفعيل الحساب الإداري...');
              result = await signupWithEmail(email, password);
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
    <div className="min-h-screen bg-slate-50 flex font-sans" dir="rtl">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-carbon via-solar to-solar" />
            
            <button 
              onClick={() => navigate('/')}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-carbon hover:bg-slate-50 rounded-xl transition-all group flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter"
            >
              <Home className="w-3.5 h-3.5" />
              <span>الرجوع للمتجر</span>
            </button>
            
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-solar rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gold/20 -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Zap className="w-8 h-8 text-carbon fill-current" />
              </div>
              <h1 className="text-2xl font-black text-carbon mb-2 tracking-tight">
                لوحة تحكم النخبة
              </h1>
              <p className="text-sm text-slate-500 font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                دخول آمن للمدراء
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key="social-login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.setItem('admin_attempt', 'true');
                    try {
                      await signInWithGoogle();
                    } catch (e: any) {
                      toast.error('فشل تسجيل الدخول عبر جوجل');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  <span>الدخول عبر حساب جوجل</span>
                </button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-white px-4 text-slate-400">أو عبر البريد الإداري</span>
                  </div>
                </div>
              </motion.div>

              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                  <div className="space-y-6">
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

                    <FloatingInput 
                      id="adminPassword"
                      label="كلمة المرور"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="w-5 h-5" />}
                      iconPosition="start"
                      endElement={
                        <div className="h-full flex items-center pr-1">
                          {!password ? (
                            <button 
                              type="button" 
                              onClick={handlePasskeyLogin} 
                              disabled={isLoading}
                              className="px-4 h-full flex items-center justify-center text-orange-500 hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
                              title="دخول سريع بالبصمة"
                            >
                              <Fingerprint className="w-5 h-5" />
                            </button>
                          ) : (
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-4 h-full flex items-center justify-center text-slate-400 hover:text-carbon">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      }
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${rememberMe ? 'bg-carbon border-carbon text-white' : 'border-slate-300'}`}>
                        {rememberMe && <Check className="w-3 h-3" />}
                      </div>
                      <span className="font-bold text-slate-500">تذكرني</span>
                      <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-carbon text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>الدخول للإدارة <ArrowLeft className="w-5 h-5" /></>}
                  </button>
                </motion.form>
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
