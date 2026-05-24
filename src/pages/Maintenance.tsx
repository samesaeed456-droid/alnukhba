import React from "react";
import { 
  Settings, 
  Phone, 
  KeyRound, 
  MessageCircle
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import Logo from "../components/Logo";
import { motion } from "motion/react";

interface MaintenanceProps {
  onBypass?: () => void;
}

export default function Maintenance({ onBypass }: MaintenanceProps) {
  const { settings } = useStore();
  
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

  return (
    <div
      className="min-h-screen bg-[#070A13] flex flex-col items-center justify-between p-4 sm:p-6 text-center relative overflow-hidden font-sans select-none"
      dir="rtl"
    >
      {/* Discreet Hidden Admin Login Point */}
      <a 
        href="/admin/login" 
        className="absolute top-4 left-4 z-30 p-2 text-white/20 hover:text-[#C5A059] hover:text-opacity-100 rounded-full hover:bg-white/5 transition-all active:scale-95 duration-300"
        title="بوابة التحكم"
      >
        <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
      </a>

      {/* Background radial glow & particles */}
      <div className="absolute top-[-10%] right-[-10%] w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-solar/10 rounded-full blur-[70px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-blue-500/5 rounded-full blur-[70px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Header Profile / Logo (Extremely compact height) */}
      <div className="w-full max-w-md mt-3 sm:mt-5 relative z-10 flex justify-center">
        <Logo
          variant="light"
          className="h-10 sm:h-13 drop-shadow-xl hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Main Container Dashboard (Highly responsive layout) */}
      <div className="w-full max-w-md sm:max-w-lg my-auto relative z-10 space-y-4 sm:space-y-6 py-4">
        
        {/* Prime Status & Countdown Card */}
        <div className="bg-slate-900/45 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2.25rem] border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            
            {/* Spinning Golden Gear Asset */}
            <div className="relative w-14 h-14 sm:w-18 sm:h-18 mx-auto flex items-center justify-center">
              <motion.div 
                className="absolute inset-0 border border-dashed border-solar/40 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              />
              <span className="absolute inset-2 bg-solar/5 rounded-full animate-pulse" />
              <div className="relative w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#C5A059] to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-solar/20">
                <Settings className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-white animate-[spin_8s_linear_infinite]" />
              </div>
            </div>

            {/* Messaging */}
            <div className="space-y-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-solar border border-solar/30 px-3 py-1 rounded-full bg-solar/5 tracking-wider inline-block">
                أعمال صيانة وتطوير مجدولة
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight pt-0.5">
                نعمل على ترقية تجربتكم الرقمية!
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed max-w-sm sm:max-w-md mx-auto">
                {settings?.maintenanceMessage ||
                  "نقوم الآن بوضع اللمسات والتحسينات النهائية لنقدم لكم واجهة فارهة ومستقرة تماماً للهواتف والأجهزة."}
              </p>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xs sm:max-w-sm mx-auto">
              {[
                { label: "أيام", value: timeLeft.days },
                { label: "ساعات", value: timeLeft.hours },
                { label: "دقائق", value: timeLeft.minutes },
                { label: "ثواني", value: timeLeft.seconds },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-md backdrop-blur-md relative overflow-hidden group hover:border-solar/20 transition-all duration-300">
                  <div className="text-base sm:text-xl md:text-2xl font-black text-white font-mono leading-none mb-1">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] sm:text-[11px] text-gray-450 font-bold">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Channels Section (Beautiful balanced sizing) */}
            <div className="border-t border-white/5 pt-5 sm:pt-6 text-right space-y-3">
              <h3 className="text-[11px] sm:text-xs font-black text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-solar inline-block animate-ping" />
                تواصل مباشر لخدمة العملاء واللوجستيات:
              </h3>
              
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <a
                  href={`https://wa.me/${settings?.contactPhone?.replace(/\D/g, '') || '966'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/25 rounded-xl transition-all group text-right"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">عبر الواتساب</h4>
                    <span className="text-[8px] sm:text-[10px] text-gray-500 block font-mono truncate">{settings?.contactPhone || "+966"}</span>
                  </div>
                </a>

                <a
                  href={`tel:${settings?.contactPhone || '966'}`}
                  className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-solar/5 hover:bg-solar/10 border border-solar/10 hover:border-solar/25 rounded-xl transition-all group text-right"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-solar/10 rounded-lg flex items-center justify-center text-solar shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">الاتصال المباشر</h4>
                    <span className="text-[8px] sm:text-[10px] text-gray-500 block font-mono truncate">{settings?.contactPhone || "+966"}</span>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer Branding Bar (Always fit perfectly without scrolling) */}
      <div className="w-full max-w-md sm:max-w-lg mt-3 relative z-10 flex items-center justify-between border-t border-white/5 pt-3 text-[9px] sm:text-xs text-gray-500">
        <span>&copy; {new Date().getFullYear()} {settings?.storeName || "متجر النخبة"}. جميع الحقوق محفوظة.</span>
        <span className="text-[8px] sm:text-[10px] font-black uppercase text-solar border border-solar/20 px-2 py-0.5 rounded-md tracking-wider leading-none">
          LUXURY EDITION
        </span>
      </div>
    </div>
  );
}
