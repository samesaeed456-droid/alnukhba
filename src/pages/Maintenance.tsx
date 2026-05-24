import React from "react";
import { 
  Settings, 
  Clock, 
  Phone, 
  ArrowLeft, 
  ShieldCheck, 
  KeyRound, 
  MessageCircle, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import Logo from "../components/Logo";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface MaintenanceProps {
  onBypass?: () => void;
}

export default function Maintenance({ onBypass }: MaintenanceProps) {
  const { settings } = useStore();
  const [activeTab, setActiveTab] = React.useState<"status" | "support" | "staff">("status");
  const [phone, setPhone] = React.useState("");
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [verificationError, setVerificationError] = React.useState(false);
  
  // High-fidelity countdown logic - persistent and realistic
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    let targetTime = localStorage.getItem("maintenance_target");
    if (!targetTime) {
      // 2 days, 14 hours, 35 minutes from now
      const defaultTarget = Date.now() + (2 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000) + (35 * 60 * 1000);
      targetTime = defaultTarget.toString();
      localStorage.setItem("maintenance_target", targetTime);
    }

    const updateTimer = () => {
      const difference = parseInt(targetTime!) - Date.now();
      if (difference <= 0) {
        // Reset timer 24h as a fallback to keep the preview beautiful and running
        const newTarget = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem("maintenance_target", newTarget.toString());
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsSubscribed(true);
    toast.success("تم تسجيل اهتمامك بنجاح! سنرسل لك إشعارًا فوريًا عند الإطلاق.", {
      description: "حصلت أيضاً على خصم افتتاح حصري بقيمة 20% 🎉",
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Verification Bypass Codes: 1122, 2026, 9999
    if (code === "1122" || code === "2026" || code === "9999") {
      toast.success("تم التحقق بنجاح! جاري تجاوز شاشة الصيانة...");
      if (onBypass) {
        onBypass();
      }
    } else {
      setVerificationError(true);
      toast.error("الرمز البرمجي غير صحيح!");
      setTimeout(() => setVerificationError(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#070A13] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 text-center relative overflow-hidden font-sans select-none"
      dir="rtl"
    >
      {/* Background Gradients & Subtle Orbits */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-solar/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header / Logo */}
      <div className="w-full max-w-lg mt-4 sm:mt-6 relative z-10 flex justify-center">
        <Logo
          variant="light"
          className="h-10 sm:h-12 md:h-14 drop-shadow-xl hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Main Glassmorphic Panel Container */}
      <div className="w-full max-w-lg my-auto relative z-10">
        
        {/* Modern Tabs Navigation */}
        <div className="flex bg-[#0F172A]/80 border border-white/5 p-1 rounded-2xl max-w-sm mx-auto mb-6 sm:mb-8 shadow-inner">
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 active:scale-95 ${
              activeTab === "status"
                ? "text-slate-950 bg-[#C5A059] shadow-md shadow-solar/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            حالة الإطلاق
          </button>
          
          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 active:scale-95 ${
              activeTab === "support"
                ? "text-slate-950 bg-[#C5A059] shadow-md shadow-solar/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            تواصل معنا
          </button>
          
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex-1 py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 active:scale-95 ${
              activeTab === "staff"
                ? "text-slate-950 bg-[#C5A059] shadow-md shadow-solar/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            بوابة الإدارة
          </button>
        </div>

        {/* Dynamic Glassmorphic Core */}
        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10">
            <AnimatePresence mode="wait">
              
              {/* STATUS TAB */}
              {activeTab === "status" && (
                <motion.div
                  key="status"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Luxury Gear & Orbit Anim */}
                  <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <motion.div 
                      className="absolute inset-0 border-2 border-dashed border-solar/30 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    />
                    <span className="absolute inset-1.5 bg-solar/5 rounded-full animate-pulse" />
                    <motion.div 
                      className="absolute inset-3 border border-solar/40 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    />
                    <div className="relative w-14 h-14 bg-gradient-to-br from-solar/90 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-solar/40">
                      <Settings className="w-7 h-7 text-white animate-[spin_6s_linear_infinite]" />
                    </div>
                  </div>

                  {/* Text Title */}
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      نعمل على ترقية تجربتكم!
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed max-w-md mx-auto">
                      {settings?.maintenanceMessage ||
                        "يسر طاقم العمل إعلامكم بأنه يجري حالياً وضع اللمسات الذهبية الأخيرة لإطلاق نسختنا المحسنة الجديدة كلياً. شكراً لصبركم وجدارتكم."}
                    </p>
                  </div>

                  {/* Real-time Countdown Grid */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto py-3">
                    {[
                      { label: "أيام", value: timeLeft.days },
                      { label: "ساعات", value: timeLeft.hours },
                      { label: "دقائق", value: timeLeft.minutes },
                      { label: "ثواني", value: timeLeft.seconds },
                    ].map((item, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-2 sm:p-3 shadow-md backdrop-blur-md relative overflow-hidden group hover:border-solar/40 transition-all duration-300">
                        <span className="absolute inset-0 bg-gradient-to-b from-solar/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-lg sm:text-2xl font-black text-white leading-tight font-mono mb-1">
                          {String(item.value).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400 font-bold">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subscribe alert notification for Mobile Priority */}
                  <div className="border-t border-white/5 pt-6">
                    {!isSubscribed ? (
                      <form onSubmit={handleSubscribe} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="أدخل رقم هاتفك للإشعار عند العودة"
                            className="flex-1 bg-white/5 border border-white/10 text-right rounded-xl py-3 px-4 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-solar/50 transition-all focus:border-solar/40"
                            required
                          />
                          <button
                            type="submit"
                            className="py-3 px-5 bg-solar hover:bg-solar/90 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-solar/10 active:scale-95 text-xs whitespace-nowrap"
                          >
                            أرسل لي تنبيهاً
                          </button>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                          🛎️ احصل على عرض مجاني أو كوبون خصم 20% فور الإطلاق لقاء صبرك!
                        </p>
                      </form>
                    ) : (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 bg-solar/10 border border-solar/30 rounded-2xl flex items-center gap-3 text-right"
                      >
                        <CheckCircle2 className="w-6 h-6 text-solar shrink-0" />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">تم إدراج رقمكم بنجاح!</h4>
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">سنعلمكم مباشرةً برابط وهدية الافتتاح الخاص بك.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SUPPORT TAB */}
              {activeTab === "support" && (
                <motion.div
                  key="support"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 text-right"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      قنوات الدعم والعمليات
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
                      فريق خدمة العملاء واللوجستيات يعمل على مدار الساعة لمتابعة وتوصيل طلباتكم السابقة بشكل متكامل:
                    </p>
                  </div>

                  {/* Two Main Support Blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <a
                      href={`https://wa.me/${settings?.contactPhone?.replace(/\D/g, '') || '966'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 rounded-2xl transition-all group"
                    >
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-all">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">دعم الواتساب</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{settings?.contactPhone || "+966"}</p>
                      </div>
                    </a>

                    <a
                      href={`tel:${settings?.contactPhone || '966'}`}
                      className="flex items-center gap-3 p-3.5 bg-solar/5 hover:bg-solar/10 border border-solar/15 hover:border-solar/30 rounded-2xl transition-all group"
                    >
                      <div className="w-10 h-10 bg-solar/10 rounded-xl flex items-center justify-center text-solar shrink-0 group-hover:scale-110 transition-all">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">الاتصال الهاتفي</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{settings?.contactPhone || "+966"}</p>
                      </div>
                    </a>
                  </div>

                  {/* Secondary/Alt Contacts with sleek layouts */}
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    {settings?.contactPhone2 && (
                      <a
                        href={`tel:${settings.contactPhone2}`}
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-solar/20 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold text-white">رقم الهاتف البديل</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono font-bold group-hover:text-solar transition-colors">{settings.contactPhone2}</span>
                      </a>
                    )}
                    
                    <div className="p-4 bg-[#0F172A]/50 border border-white/5 rounded-2xl flex items-start gap-2.5 mt-2 text-right">
                      <Clock className="w-4 h-4 text-solar mt-0.5 shrink-0" />
                      <div className="text-[10px] sm:text-xs text-gray-400 leading-normal font-medium">
                        جميع المعالجات اللوجستية والشحن للطلبات القائمة مستمرة كالمعتاد ولم تتأثر بأعمال الصيانة الرقمية للواجهة.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STAFF PORTAL TAB */}
              {activeTab === "staff" && (
                <motion.div
                  key="staff"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 text-right animate-none"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      بوابة طاقم العمل والمطورين
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
                      هذه المساحة مخصصة للإدارة والمطورين فقط للوصول السريع إلى غرف التحكم وقنوات الإدارة:
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-solar mt-0.5 shrink-0 animate-pulse" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">الولوج الأمن للمشرفين</h4>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1 leading-relaxed">
                        لو الحساب الخاص بك لديه صلاحيات، يمكنك الضغط على تسجيل الدخول والعمل بشكل طبيعي حيث إن بوابة الإدارة مستثناة من وضع الصيانة.
                      </p>
                    </div>
                  </div>

                  {/* Direct Access Gateways */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <a
                      href="/admin/login"
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-solar hover:bg-solar/95 text-slate-950 font-extrabold rounded-xl transition-all shadow-md hover:scale-[1.02] text-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>تسجيل دخول لوحة التحكم</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </a>
                    
                    <a
                      href="/admin"
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-bold rounded-xl transition-all text-xs hover:border-solar/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>اتصال داخلي مباشر</span>
                    </a>
                  </div>

                  {/* Custom Pin Bypass */}
                  <form onSubmit={handleVerify} className="border-t border-white/5 pt-4 space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 block mb-1">
                      🔐 تجاوز شاشة الصيانة عبر كود المعاينة السريع:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="أدخل رمز التحقق (4 أرقام)"
                        className={`flex-1 bg-white/5 border ${verificationError ? "border-red-500" : "border-white/10"} text-center rounded-xl py-3 text-sm text-white placeholder-gray-500 tracking-widest font-mono focus:outline-none focus:ring-1 focus:ring-solar/50`}
                        maxLength={4}
                      />
                      <button
                        type="submit"
                        className="py-3 px-5 bg-white/10 hover:bg-solar hover:text-slate-950 text-white font-bold rounded-xl transition-all text-xs whitespace-nowrap active:scale-95"
                      >
                        تحقق وتجاوز
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      (رمز المعاينة السريعة لطاقم العمل: <code className="text-solar font-bold font-mono">1122</code> أو <code className="text-solar font-bold font-mono">2026</code>)
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Branding Area */}
      <div className="w-full max-w-lg mt-6 relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-4 text-[10px] sm:text-xs text-gray-500 gap-3">
        <span>&copy; {new Date().getFullYear()} {settings?.storeName || "متجر النخبة"}. جميع الحقوق محفوظة.</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-solar border border-solar/20 px-2 py-0.5 rounded-md tracking-wider">
            LUXURY EDITION
          </span>
        </div>
      </div>
    </div>
  );
}
