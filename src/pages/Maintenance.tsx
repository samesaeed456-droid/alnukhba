import React from "react";
import { 
  Settings, 
  Clock, 
  Phone, 
  ArrowLeft, 
  ShieldCheck, 
  KeyRound, 
  MessageCircle, 
  Eye,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import Logo from "../components/Logo";
import { toast } from "sonner";
import { motion } from "motion/react";

interface MaintenanceProps {
  onBypass?: () => void;
}

export default function Maintenance({ onBypass }: MaintenanceProps) {
  const { settings } = useStore();
  const [code, setCode] = React.useState("");
  const [verificationError, setVerificationError] = React.useState(false);
  
  // Real-time beautiful countdown
  const [timeLeft, setTimeLeft] = React.useState({ days: 2, hours: 14, minutes: 35, seconds: 50 });

  React.useEffect(() => {
    let targetTime = localStorage.getItem("maintenance_target");
    if (!targetTime) {
      const defaultTarget = Date.now() + (2 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000) + (35 * 60 * 1000);
      targetTime = defaultTarget.toString();
      localStorage.setItem("maintenance_target", targetTime);
    }

    const updateTimer = () => {
      const difference = parseInt(targetTime!) - Date.now();
      if (difference <= 0) {
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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
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
      className="min-h-screen bg-[#070A13] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 text-center relative overflow-x-hidden font-sans select-none"
      dir="rtl"
    >
      {/* Background radial glow & particles */}
      <div className="absolute top-[-10%] right-[-10%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-solar/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-blue-500/5 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:40px_40px] pointer-events-none" />

      {/* Header Profile / Logo */}
      <div className="w-full max-w-lg mt-3 sm:mt-6 relative z-10 flex justify-center">
        <Logo
          variant="light"
          className="h-9 sm:h-12 md:h-14 drop-shadow-xl hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Main Container Dashboard */}
      <div className="w-full max-w-lg my-auto relative z-10 space-y-4">
        
        {/* Prime Status & Countdown Card */}
        <div className="bg-slate-900/45 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2.25rem] border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
            
            {/* Spinning Golden Gear Asset */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
              <motion.div 
                className="absolute inset-0 border border-dashed border-solar/40 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              />
              <span className="absolute inset-2 bg-solar/5 rounded-full animate-pulse" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#C5A059] to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-solar/20">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-[spin_8s_linear_infinite]" />
              </div>
            </div>

            {/* Messaging */}
            <div className="space-y-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-solar border border-solar/30 px-3 py-1 rounded-full bg-solar/5 tracking-wider inline-block">
                أعمال صيانة وتطوير مجدولة
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight pt-1">
                نعمل على ترقية تجربتكم الرقمية!
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed max-w-md mx-auto">
                {settings?.maintenanceMessage ||
                  "نقوم الآن بوضع التحسينات واللمسات النهائية لمتجرنا الإلكتروني لنقدم لكم واجهة فارهة وأداء أسرع كلياً وصديقاً لجميع الأجهزة."}
              </p>
            </div>

            {/* Countdown Grid (Golden Core) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto">
              {[
                { label: "أيام", value: timeLeft.days },
                { label: "ساعات", value: timeLeft.hours },
                { label: "دقائق", value: timeLeft.minutes },
                { label: "ثواني", value: timeLeft.seconds },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-md backdrop-blur-md relative overflow-hidden group hover:border-solar/30 transition-all duration-300">
                  <div className="text-base sm:text-xl md:text-2xl font-black text-white font-mono leading-none mb-1">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] sm:text-[11px] text-gray-400 font-bold">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Channels Section (Sourced Directly dynamically) */}
            <div className="border-t border-white/5 pt-5 sm:pt-6 text-right space-y-3">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-solar inline-block animate-ping" />
                تواصل مباشر لخدمة العملاء واللوجستيات:
              </h3>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <a
                  href={`https://wa.me/${settings?.contactPhone?.replace(/\D/g, '') || '966'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl transition-all group text-right"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">عبر الواتساب</h4>
                    <span className="text-[8px] sm:text-[10px] text-gray-400 block font-mono truncate">{settings?.contactPhone || "+966"}</span>
                  </div>
                </a>

                <a
                  href={`tel:${settings?.contactPhone || '966'}`}
                  className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-solar/5 hover:bg-solar/10 border border-solar/10 hover:border-solar/30 rounded-xl transition-all group text-right"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-solar/10 rounded-lg flex items-center justify-center text-solar shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">الاتصال المباشر</h4>
                    <span className="text-[8px] sm:text-[10px] text-gray-400 block font-mono truncate">{settings?.contactPhone || "+966"}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Direct Admin Control & Developer Gateways */}
            <div className="border-t border-white/5 pt-5 sm:pt-6 text-right space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5 text-solar" />
                  بوابة طاقم العمل والإدارة:
                </h3>
              </div>

              {/* Major Action Buttons for Admin Landing */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href="/admin/login"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-solar hover:bg-solar-dark text-slate-950 font-black rounded-xl transition-all shadow-md active:scale-95 text-xs sm:text-sm cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>تسجيل دخول لوحة التحكم للاداره</span>
                  <ChevronLeft className="w-4 h-4" />
                </a>
                
                <a
                  href="/admin"
                  className="flex items-center justify-center gap-1.5 py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-bold rounded-xl transition-all text-xs active:scale-95 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>الاتصال الداخلي المباشر</span>
                </a>
              </div>

              {/* Embedded Bypass Code Logic */}
              <form onSubmit={handleVerify} className="space-y-2 pt-1 bg-[#0F172A]/35 p-3 sm:p-4 rounded-xl border border-white/5">
                <label className="text-[10px] sm:text-xs font-bold text-gray-450 block">
                  🔓 هل أنت من طاقم العمل؟ أدخل برمز المعاينة السريع:
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="أدخل رمز المرور السريع المعطى لك (مثال: 1122)"
                    className={`flex-1 bg-white/5 border ${verificationError ? "border-red-500" : "border-white/10"} text-center rounded-lg py-2 text-xs text-white placeholder-gray-500 tracking-wider font-mono focus:outline-none focus:ring-1 focus:ring-solar/30`}
                    maxLength={4}
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-white/10 hover:bg-solar hover:text-slate-950 text-white font-bold rounded-lg transition-all text-xs whitespace-nowrap active:scale-95"
                  >
                    عرض المتجر
                  </button>
                </div>
                <p className="text-[8px] sm:text-[10px] text-gray-500 font-mono text-center">
                  (رموز المعاينة الفورية المعتمدة للمعاينة السريعة: <code className="text-solar font-bold font-mono">1122</code> أو <code className="text-solar font-bold font-mono">2026</code>)
                </p>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* Footer Branding Bar */}
      <div className="w-full max-w-lg mt-3 sm:mt-6 relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-4 text-[9px] sm:text-xs text-gray-500 gap-2 sm:gap-4">
        <span>&copy; {new Date().getFullYear()} {settings?.storeName || "متجر النخبة"}. جميع الحقوق محفوظة.</span>
        <span className="text-[8px] font-black uppercase text-solar border border-solar/20 px-2.5 py-0.5 rounded-md tracking-widest leading-none">
          LUXURY EDITION
        </span>
      </div>
    </div>
  );
}
