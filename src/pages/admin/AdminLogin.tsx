import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, ShieldCheck, Eye, EyeOff, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { FloatingInput } from '../../components/FloatingInput';
import { Toaster, toast } from 'sonner';
import { useStore } from '../../context/StoreContext';
import { 
  auth, db, doc, getDoc, loginWithEmail, signupWithEmail,
  query, collection, where, getDocs
} from '../../lib/firebase';
import { getAdminDummyEmail } from '../../lib/adminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminUsers, logActivity } = useStore();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+967');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Check if already logged in with authorized phone/email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        const authorizedEmails = [
          'samesaeed456@gmail.com', 
          'samisaeed2027@gmail.com', 
          '967776668370@elite-store.local'
        ];
        
        // Also check if the user exists in our admin_users collection
        let isAuthorized = authorizedEmails.includes(user.email);
        let currentAdminRole = 'editor';
        let currentAdminName = 'المدير العام';

        if (!isAuthorized) {
          const adminQuery = query(collection(db, 'admin_users'), where('email', '==', user.email));
          const adminSnap = await getDocs(adminQuery);
          if (adminSnap && !adminSnap.empty && adminSnap.docs && adminSnap.docs.length > 0) {
            isAuthorized = true;
            currentAdminRole = adminSnap.docs[0].data().role || 'editor';
            currentAdminName = adminSnap.docs[0].data().name || 'مشرف';
          }
        }
        
        if (isAuthorized) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.role !== 'admin') {
            const { updateDoc, setDoc } = await import('../../lib/firebase');
            await updateDoc(doc(db, 'users', user.uid), { 
              role: 'admin',
              adminName: userData?.adminName || userData?.displayName || userData?.name || user.displayName || currentAdminName
            });
            
            if (authorizedEmails.includes(user.email)) {
              await setDoc(doc(db, 'admin_users', user.uid), {
                id: user.uid,
                name: user.displayName || userData?.name || 'المدير العام',
                email: user.email,
                role: 'super_admin',
                isActive: true,
                permissions: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security', 'view_logs', 'manage_logistics', 'manage_messages']
              }, { merge: true });
              currentAdminRole = 'super_admin';
            }
          }

          localStorage.setItem('admin_auth', 'true');
          localStorage.setItem('admin_email', user.email);
          localStorage.setItem('admin_name', userData?.adminName || userData?.displayName || userData?.name || user.displayName || currentAdminName);
          localStorage.setItem('admin_role', currentAdminRole);
          navigate('/admin');
        }
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginEmail = getAdminDummyEmail(phone, countryCode);
      let result;
      
      try {
        result = await loginWithEmail(loginEmail, password);
      } catch (authError: any) {
        // RADICAL SOLUTION: If user doesn't exist in Auth, check if they were pre-registered by Super Admin
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          const { collection, getDocs, query, where } = await import('../../lib/firebase');
          const adminsRef = collection(db, 'admin_users');
          
          // Get normalized phone for query
          const cleanPhone = phone.replace(/\D/g, '');
          const cleanCountry = countryCode.replace(/\D/g, '');
          let phoneOnly = cleanPhone;
          if (cleanPhone.startsWith(cleanCountry)) {
            phoneOnly = cleanPhone.substring(cleanCountry.length);
          }
          const normalizedPhone = phoneOnly.startsWith('0') ? phoneOnly.substring(1) : phoneOnly;

          // Search by email (legacy/consistent) or by raw phone/country combo
          const q = query(
            adminsRef, 
            where('phone', '==', normalizedPhone),
            where('countryCode', '==', countryCode)
          );
          
          let querySnapshot = await getDocs(q);
          
          // If phone search fails, try searching by the computed dummy email
          if (querySnapshot.empty) {
            const emailQuery = query(adminsRef, where('email', '==', loginEmail));
            querySnapshot = await getDocs(emailQuery);
          }
          
          if (querySnapshot && !querySnapshot.empty && querySnapshot.docs && querySnapshot.docs.length > 0) {
            const adminDoc = querySnapshot.docs[0].data();
            // Verify password matches the one set by Admin
            if (adminDoc.password === password) {
              toast.info('جاري تفعيل حسابك الإداري لأول مرة...');
              // Create the Auth account on the fly!
              result = await signupWithEmail(loginEmail, password);
            } else {
              toast.error('كلمة المرور غير مطابقة للسجل الإداري');
              setIsLoading(false);
              return;
            }
          } else {
            toast.error('هذا الرقم غير مسجل في قائمة المسؤولين');
            setIsLoading(false);
            return;
          }
        } else {
          throw authError;
        }
      }

      const user = result.user;
      
      // Forcefully check if this user is in the admin_users collection
      const { collection, getDocs, query, where, doc, getDoc, updateDoc, setDoc } = await import('../../lib/firebase');
      const adminsRef = collection(db, 'admin_users');
      
      // Try by dummy email, or by phone
      const forceLoginEmail = getAdminDummyEmail(phone, countryCode);
      const forceEmailQuery = query(adminsRef, where('email', '==', forceLoginEmail));
      let forceAdminSnapshot = await getDocs(forceEmailQuery);
      
      if (forceAdminSnapshot.empty) {
        const cleanPhoneRaw = phone.replace(/\D/g, '');
        const cleanCountryRaw = countryCode.replace(/\D/g, '');
        let phoneOnlyRaw = cleanPhoneRaw;
        if (cleanPhoneRaw.startsWith(cleanCountryRaw)) {
          phoneOnlyRaw = cleanPhoneRaw.substring(cleanCountryRaw.length);
        }
        const forceNormalizedPhone = phoneOnlyRaw.startsWith('0') ? phoneOnlyRaw.substring(1) : phoneOnlyRaw;

        const forcePhoneQuery = query(
            adminsRef, 
            where('phone', '==', forceNormalizedPhone),
            where('countryCode', '==', countryCode)
        );
        forceAdminSnapshot = await getDocs(forcePhoneQuery);
      }
      
      if (forceAdminSnapshot && !forceAdminSnapshot.empty && forceAdminSnapshot.docs && forceAdminSnapshot.docs.length > 0) {
         // This IS a registered admin. Force sync their profile.
         const adminData = forceAdminSnapshot.docs[0].data();
         const userRef = doc(db, 'users', user.uid);
         const userDoc = await getDoc(userRef);
         
         if (!userDoc.exists()) {
           await setDoc(userRef, {
              uid: user.uid,
              email: user.email || forceLoginEmail,
              name: adminData.name,
              displayName: adminData.name,
              adminName: adminData.name,
              role: 'admin',
              adminRole: adminData.role || 'admin',
              createdAt: new Date().toISOString()
           });
         } else {
           await updateDoc(userRef, { 
             role: 'admin', 
             adminRole: adminData.role || 'admin',
             adminName: adminData.name
           });
         }
      }

      // Re-fetch user profile after potential forced sync
      const finalUserDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = finalUserDoc.data();
      
      const isAuthorizedAdmin = userData?.role === 'admin';

      if (isAuthorizedAdmin) {
        localStorage.setItem('admin_auth', 'true');
        localStorage.setItem('admin_email', user.email || '');
        localStorage.setItem('admin_name', userData?.adminName || userData?.displayName || userData?.name || user.displayName || 'المدير');
        localStorage.setItem('admin_role', userData?.adminRole || 'super_admin');
        
        if (rememberMe) {
          localStorage.setItem('admin_remember', 'true');
        }
        
        logActivity('تسجيل دخول مشرف', `تم تسجيل دخول المشرف: ${userData?.displayName || userData?.name || user.displayName || 'المدير'}`);
        toast.success(`مرحباً بك مجدداً، ${userData?.displayName || userData?.name || user.displayName || 'المدير'}`);
        navigate('/admin');
      } else {
        await auth.signOut();
        toast.error('ليس لديك صلاحية الوصول للوحة التحكم');
        logActivity('محاولة دخول فاشلة', `محاولة دخول غير مصرح بها للرقم: ${countryCode + phone}`);
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
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                  {/* Phone Only Login */}
                  <div className="space-y-6">
                    <FloatingInput
                      label="رقم الهاتف المسجل"
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
                          </select>
                        </div>
                      }
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
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-slate-400">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
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
