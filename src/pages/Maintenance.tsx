import React from "react";
import { 
  Settings, 
  Phone, 
  KeyRound, 
  MessageCircle,
  Instagram,
  Twitter,
  Facebook,
  Youtube
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import Logo from "../components/Logo";
import { motion, AnimatePresence } from "motion/react";

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.892 2.892 0 0 1-5.201 1.743 2.892 2.892 0 0 1 2.308-4.642c.307 0 .604.05.88.143v-3.41a6.845 6.845 0 0 0-1.04-.057c-3.572 0-6.467 2.895-6.467 6.467 0 3.572 2.895 6.467 6.467 6.467 3.566 0 6.456-2.884 6.467-6.446V7.073A8.157 8.157 0 0 0 20 8.59V5.191a4.805 4.805 0 0 1-2.434-.848 4.773 4.773 0 0 1-1.03-.834c.002-.276.012-.55.053-.823z" />
  </svg>
);

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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

  // Filter and build social media networks exactly like Footer.tsx
  const socials = [
    {
      icon: Facebook,
      url: settings?.socialMedia?.facebook,
      color: "hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:text-[#1877F2]",
      name: "فيسبوك",
    },
    {
      icon: Twitter,
      url: settings?.socialMedia?.twitter,
      color: "hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2]",
      name: "تويتر",
    },
    {
      icon: Instagram,
      url: settings?.socialMedia?.instagram,
      color: "hover:bg-[#E4405F]/20 hover:border-[#E4405F]/50 hover:text-[#E4405F]",
      name: "إنستغرام",
    },
    {
      icon: TiktokIcon,
      url: settings?.socialMedia?.tiktok,
      color: "hover:bg-white/10 hover:border-white/20 text-[#ff0050] hover:text-white",
      name: "تيك توك",
    },
    {
      icon: Youtube,
      url: settings?.socialMedia?.youtube,
      color: "hover:bg-[#FF0000]/20 hover:border-[#FF0000]/50 hover:text-[#FF0000]",
      name: "يوتيوب",
    },
    {
      icon: WhatsappIcon,
      url: settings?.socialMedia?.whatsapp
        ? settings.socialMedia.whatsapp.startsWith("http")
          ? settings.socialMedia.whatsapp
          : `https://wa.me/${settings.socialMedia.whatsapp.replace(/\D/g, "")}`
        : settings?.contactPhone
          ? `https://wa.me/${settings.contactPhone.replace(/\D/g, "")}`
          : undefined,
      color: "hover:bg-[#25D366]/20 hover:border-[#25D366]/50 hover:text-[#25D366]",
      name: "واتساب",
    },
  ].filter((s) => s.url && s.url !== "#");

  // Format Whatsapp contact phone appropriately
  const calculatedWhatsapp = settings?.socialMedia?.whatsapp
    ? settings.socialMedia.whatsapp.startsWith("http")
      ? settings.socialMedia.whatsapp
      : `https://wa.me/${settings.socialMedia.whatsapp.replace(/\D/g, "")}`
    : settings?.contactPhone
      ? `https://wa.me/${settings.contactPhone.replace(/\D/g, "")}`
      : "https://wa.me/966";

  return (
    <div
      className="min-h-screen bg-[#070A13] flex flex-col items-center justify-between p-4 sm:p-6 text-center relative overflow-hidden font-sans select-none"
      dir="rtl"
    >
      {/* 1. Dynamic Live Background Ambient Glowing Circles */}
      <motion.div 
        className="absolute top-[10%] right-[10%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-solar/15 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -60, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-[10%] left-[10%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-blue-500/10 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none"
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 50, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Interactive Micro-particles floating up */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-solar/20 rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              bottom: "-10px",
            }}
            animate={{
              y: ["0vh", "-110vh"],
              x: [0, Math.random() * 30 - 15],
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: Math.random() * 12 + 8,
              repeat: Infinity,
              delay: Math.random() * 6,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-40" />

      {/* Invisible Hidden Access to Administration Panel */}
      <a 
        href="/admin/login" 
        className="absolute top-4 left-4 z-30 p-2 text-white/5 hover:text-[#C5A059] rounded-full hover:bg-white/5 transition-all active:scale-95 duration-300"
        title="بوابة التحكم"
      >
        <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
      </a>

      {/* Header Profile / Logo (Balanced size) */}
      <div className="w-full max-w-md mt-4 sm:mt-6 relative z-10 flex justify-center">
        <Logo
          variant="light"
          className="h-10 sm:h-13 drop-shadow-xl hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Main Container Card (Balanced layout for Mobile and Desktop) */}
      <div className="w-full max-w-md sm:max-w-lg my-auto relative z-10 py-5">
        
        {/* Main Glassmorphic Card */}
        <div className="bg-slate-900/45 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2.25rem] border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            
            {/* Spinning Golden Gear Asset with Pulsing Rings */}
            <div className="relative w-14 h-14 sm:w-18 sm:h-18 mx-auto flex items-center justify-center">
              <motion.div 
                className="absolute inset-0 border border-dashed border-solar/40 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              />
              <motion.span 
                className="absolute inset-2 bg-solar/5 rounded-full"
                animate={{ scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-[#C5A059] to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-solar/20">
                <Settings className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-white animate-[spin_8s_linear_infinite]" />
              </div>
            </div>

            {/* Maintenance Message */}
            <div className="space-y-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-solar border border-solar/30 px-3 py-1 rounded-full bg-solar/5 tracking-wider inline-block">
                أعمال صيانة وتطوير مجدولة
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight pt-0.5">
                نعمل على ترقية تجربتكم الرقمية!
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed max-w-sm sm:max-w-md mx-auto">
                {settings?.maintenanceMessage ||
                  "نقوم الآن بوضع اللمسات والتحسينات النهائية لنقدم لكم واجهة فارهة ومستقرة تماماً للهواتف والأجهزة."}
              </p>
            </div>

            {/* Countdown Grid (Elegant, clean spacing with bright white labels) */}
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
                  <div className="text-[10px] sm:text-xs text-white font-black drop-shadow-sm tracking-wider">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Channels with Micro-Interactions */}
            <div className="border-t border-white/5 pt-5 sm:pt-6 text-right space-y-3">
              <h3 className="text-[11px] sm:text-xs font-black text-white flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-solar inline-block animate-ping" />
                تواصل مباشر لخدمة العملاء واللوجستيات:
              </h3>
              
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* WhatsApp Button with Glow & Scale Transition */}
                <motion.a
                  href={calculatedWhatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl transition-all group text-right relative overflow-hidden"
                  whileHover={{ 
                    scale: 1.03, 
                    borderColor: "rgba(16, 185, 129, 0.4)",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    boxShadow: "0 0 15px rgba(16, 185, 129, 0.15)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 animate-[pulse_2s_infinite]" />
                  </div>
                  <div className="overflow-hidden z-10">
                    <h4 className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">عبر الواتساب</h4>
                    <span className="text-[8px] sm:text-[10px] text-gray-200 block font-mono truncate">{settings?.socialMedia?.whatsapp || settings?.contactPhone || "+966"}</span>
                  </div>
                  
                  {/* Subtle sweep shimmer highlight */}
                  <motion.div 
                    className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                    initial={{ left: "-100%" }}
                    animate={{ left: "200%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                      repeatDelay: 1.5
                    }}
                  />
                </motion.a>

                {/* Calling Button with Glow & Scale Transition */}
                <motion.a
                  href={`tel:${settings?.contactPhone || '966'}`}
                  className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-solar/5 border border-solar/10 rounded-xl transition-all group text-right relative overflow-hidden"
                  whileHover={{ 
                    scale: 1.03, 
                    borderColor: "rgba(197, 160, 89, 0.4)",
                    backgroundColor: "rgba(197, 160, 89, 0.08)",
                    boxShadow: "0 0 15px rgba(197, 160, 89, 0.15)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-solar/10 rounded-lg flex items-center justify-center text-solar shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 animate-[pulse_2s_infinite]" />
                  </div>
                  <div className="overflow-hidden z-10">
                    <h4 className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">الاتصال المباشر</h4>
                    <span className="text-[8px] sm:text-[10px] text-gray-200 block font-mono truncate">{settings?.contactPhone || "+966"}</span>
                  </div>

                  {/* Subtle sweep shimmer highlight */}
                  <motion.div 
                    className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                    initial={{ left: "-100%" }}
                    animate={{ left: "200%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 3.2,
                      ease: "linear",
                      repeatDelay: 2
                    }}
                  />
                </motion.a>
              </div>
            </div>

            {/* Mini Social Media Icons Section with smooth hover effects */}
            <div className="border-t border-white/5 pt-5 text-center space-y-3">
              <span className="text-[10px] sm:text-xs text-gray-200 font-bold block">تابعنا عبر وسائل التواصل لقرب الافتتاح:</span>
              <div className="flex justify-center items-center gap-3">
                {socials.length > 0 ? (
                  socials.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2 sm:p-2.5 bg-white/5 text-gray-300 border border-white/5 rounded-full transition-all relative flex items-center justify-center ${social.color}`}
                      whileHover={{ y: -3, scale: 1.15, boxShadow: "0 4px 12px rgba(197, 160, 89, 0.1)" }}
                      whileTap={{ scale: 0.95 }}
                      title={social.name}
                    >
                      <social.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </motion.a>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">سعداء بقرب تواصلكم قريباً</span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer Branding Bar (Perfect fit without scrolling with brilliant high contrast white) */}
      <div className="w-full max-w-md sm:max-w-lg mt-3 relative z-10 flex items-center justify-between border-t border-white/5 pt-3 text-[9px] sm:text-xs text-gray-200">
        <span>&copy; {new Date().getFullYear()} {settings?.storeName || "متجر النخبة"}. جميع الحقوق محفوظة.</span>
        <span className="text-[8px] sm:text-[10px] font-black uppercase text-solar border border-solar/20 px-2 py-0.5 rounded-md tracking-wider leading-none">
          LUXURY EDITION
        </span>
      </div>
    </div>
  );
}
