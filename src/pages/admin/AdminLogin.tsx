import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  Loader2,
  Fingerprint,
  Home,
} from "lucide-react";
import { FloatingInput } from "../../components/FloatingInput";
import { Toaster, toast } from "sonner";
import { useStore } from "@/context/StoreContext";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  auth,
  adminAuth,
  db,
  adminDb,
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  limit,
} from "../../lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
} from "firebase/auth";
import { getAdminDummyEmail } from "../../lib/adminAuth";
import { parseSmartError } from "../../lib/errorUtils";
import Logo from "../../components/Logo";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminUsers, logActivity } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    localStorage.setItem("admin_attempt", "true");
    try {
      const currentSessionId =
        localStorage.getItem("local_session_id") || "anon";

      const res = await fetch("/api/webauthn/login/generate", {
        method: "POST",
        headers: { "x-session-id": currentSessionId },
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
        if (authErr.name === "NotAllowedError") {
          setIsLoading(false);
          return;
        }
        throw authErr;
      }

      const verifyRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": currentSessionId,
        },
        body: JSON.stringify({
          response,
          challenge: expectedChallenge,
          sessionToken,
        }),
      });

      const verifyText = await verifyRes.text();
      if (!verifyRes.ok)
        throw new Error(`Server returned ${verifyRes.status}: ${verifyText}`);
      const verifyData = JSON.parse(verifyText);

      if (verifyData.success) {
        await signInWithCustomToken(adminAuth, verifyData.customToken);
        toast.success("تم تسجيل الدخول بالبصمة بنجاح!");
        // Navigation will be handled by useEffect auth listener
      } else {
        throw new Error(verifyData.error || "فشل التحقق");
      }
    } catch (err: any) {
      console.error("[Admin Passkey Login Error]:", err);
      if (err.name === "NotAllowedError") {
        toast.error("تم إلغاء العملية");
      } else if (err.name === "NotSupportedError") {
        toast.error("المتصفح لا يدعم البصمة هنا. يرجى فتح المتصفح بشكل كامل.");
      } else {
        toast.error(
          `خطأ في البصمة: ${err.message || "يرجى المحاولة بالطريقة التقليدية"}`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if already logged in with authorized email
  useEffect(() => {
    // Instant check if we already have a valid session in local storage
    const hasAdminAuth = localStorage.getItem("admin_auth") === "true";
    const savedUser = localStorage.getItem("store_user");

    if (hasAdminAuth && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.role === "admin") {
          navigate("/admin");
          setIsCheckingAuth(false);
          return;
        }
      } catch (e) {}
    }

    const unsubscribe = adminAuth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        let isAuthorized = false;
        let adminData: any = null;

        // Optimized check via Firestore
        try {
          const adminQuery = query(
            collection(adminDb, "users"),
            where("email", "==", user.email),
            where("role", "==", "admin"),
            limit(1),
          );
          const adminSnap = await getDocs(adminQuery);

          if (!adminSnap.empty) {
            const data = adminSnap.docs[0].data();
            if (data.isActive === false) {
              toast.error("تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول.");
              await adminAuth.signOut();
              setIsLoading(false);
              return;
            }
            isAuthorized = true;
            adminData = data;
          } else {
            // Fallback: check if isAdmin flag exists even if role is different
            const backupQuery = query(
              collection(adminDb, "users"),
              where("email", "==", user.email),
              where("isAdmin", "==", true),
              limit(1),
            );
            const backupSnap = await getDocs(backupQuery);
            if (!backupSnap.empty) {
              const data = backupSnap.docs[0].data();
              if (data.isActive === false) {
                toast.error("تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول.");
                await adminAuth.signOut();
                setIsLoading(false);
                return;
              }
              isAuthorized = true;
              adminData = data;
            }
          }
        } catch (err) {
          console.warn("Background auth check error:", err);
        }

        if (isAuthorized && adminData) {
          localStorage.setItem("admin_auth", "true");
          localStorage.setItem("admin_email", user.email);
          localStorage.setItem(
            "admin_name",
            adminData.displayName || adminData.name || "مشرف",
          );
          localStorage.setItem(
            "admin_role",
            adminData.adminRole || adminData.role || "editor",
          );
          navigate("/admin");
        } else {
          if (localStorage.getItem("admin_attempt") === "true") {
            toast.error("هذا الحساب ليس لديه صلاحيات إدارية");
            localStorage.removeItem("admin_attempt");
            await adminAuth.signOut();
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
    localStorage.setItem("admin_attempt", "true");

    try {
      // Auto-detect if input is a phone number and convert to dummy email
      let loginEmail = email.trim();
      // Remove common separators for cleaner check, but keep the original for getAdminDummyEmail if needed
      const cleanInput = loginEmail.replace(/[\s\-()]/g, "");
      const isPhone = /^\+?\d+$/.test(cleanInput) && cleanInput.length >= 7;

      if (isPhone) {
        // We assume default country code +967 if not explicitly provided in the start
        const countryCode = cleanInput.startsWith("+") ? "" : "+967";
        loginEmail = getAdminDummyEmail(cleanInput, countryCode);
      }

      await signInWithEmailAndPassword(adminAuth, loginEmail, password);
      // If login successful, the useEffect Auth listener handles the redirection logic
    } catch (error: any) {
      console.error("Login error:", error);
      const smartError = parseSmartError(error);
      toast.error(smartError.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center font-sans"
        dir="rtl"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-solar rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gold/20 animate-bounce">
            <Zap className="w-8 h-8 text-carbon fill-current" />
          </div>
          <p className="text-slate-500 font-bold animate-pulse">
            جاري التحقق من الصلاحيات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-carbon flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden"
      dir="rtl"
    >
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
          alt="Background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-carbon/80 via-carbon/90 to-carbon" />
        
        {/* Animated Mesh Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-solar/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Logo Section */}
        <div className="flex justify-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Logo variant="light" className="h-12" />
          </motion.div>
        </div>

        {/* Main Card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[40px] border border-white/10 p-8 sm:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">
              بوابة الإدارة
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-solar" />
              <span>نظام الدخول الآمن لمتجر النخبة</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key="login-form-centered"
              onSubmit={handleLogin}
              className="space-y-8"
            >
                <div className="space-y-6">
                  {/* Email Field with modern dark style */}
                  <div className="group">
                    <FloatingInput
                      label="البريد الإلكتروني للإدارة"
                      id="adminEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@elite.com"
                      dir="ltr"
                      className="text-left font-sans !bg-white/[0.04] !border-white/10 !text-solar focus:!border-solar/60 transition-all"
                      startElement={
                        <div className="flex items-center justify-center w-10 h-10 ml-1 rounded-xl bg-white/5 border border-white/10 text-slate-500 group-focus-within:text-solar transition-colors">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      }
                      required
                    />
                  </div>

                  <div className="group">
                    <FloatingInput
                      id="adminPassword"
                      label="كلمة المرور"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                      className="text-left font-sans !bg-white/[0.04] !border-white/10 !text-solar focus:!border-solar/60 transition-all"
                      startElement={
                        <div className="flex items-center px-1">
                          {!password ? (
                            <motion.button
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              type="button"
                              onClick={handlePasskeyLogin}
                              disabled={isLoading}
                              className="w-10 h-10 flex items-center justify-center text-solar hover:text-solar/80 transition-all hover:scale-110 active:scale-95 bg-white/5 rounded-xl border border-white/10"
                              title="دخول سريع بالبصمة"
                            >
                              <Fingerprint className="w-5 h-5" />
                            </motion.button>
                          ) : (
                            <motion.button
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </motion.button>
                          )}
                        </div>
                      }
                      icon={<Lock className="w-5 h-5 text-slate-500 group-focus-within:text-solar transition-colors" />}
                      iconPosition="end"
                      required
                    />
                  </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      rememberMe 
                        ? "bg-solar border-solar text-carbon" 
                        : "border-white/10 group-hover:border-white/30"
                    }`}
                  >
                    {rememberMe && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                  </div>
                  <span className="font-black text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-tight">
                    تذكر الجلسة الإدارية
                  </span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-solar text-carbon rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-yellow-400 transition-all shadow-[0_20px_40px_-12px_rgba(242,183,5,0.3)] hover:shadow-solar/40 active:scale-[0.98] disabled:opacity-70 group overflow-hidden relative"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <span className="relative z-10 tracking-widest uppercase">دخول النظام الآمن</span>
                    <ArrowLeft className="w-5 h-5 relative z-10 transition-transform group-hover:-translate-x-1" />
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>

              <div className="pt-8 text-center">
                <div className="inline-flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">
                  <Zap className="w-3 h-3 fill-slate-500" />
                  تحقق أمني متعدد الطبقات
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-[280px] mx-auto opacity-60">
                  الإصدار 4.5.3 • سحابة النخبة الإدارية
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Floating Actions */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all border border-transparent hover:border-white/10 flex items-center gap-2 group"
          >
            <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-tighter">العودة للمتجر</span>
          </Link>
        </div>
      </motion.div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
