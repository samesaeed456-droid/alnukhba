import React from "react";
import { 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  CheckCircle,
  Clock,
  ThumbsUp
} from "lucide-react";
import { motion } from "motion/react";
import SEO from "../components/SEO";
import { useStore } from "../context/StoreContext";
import founderImg from "../assets/images/founder_avatar_1779541619999.png";

export default function About() {
  const { settings } = useStore();

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const trustStats = [
    { icon: CheckCircle, value: "١٠٠٪", text: "أصلية ومضمونة" },
    { icon: Clock, value: "٢٤/٧", text: "دعم فني استشاري" },
    { icon: ThumbsUp, value: settings?.storeName || "النخبة", text: "ضمان محلاتنا الحقيقي" },
    { icon: MapPin, value: "اليمن", text: "توصيل آمن للمحافظات" }
  ];

  // Helper to format whatsapp link smoothly based on dynamic contact settings
  const formattedWhatsapp = settings?.socialMedia?.whatsapp
    ? settings.socialMedia.whatsapp.startsWith("http")
      ? settings.socialMedia.whatsapp
      : `https://wa.me/${settings.socialMedia.whatsapp.replace(/\D/g, "")}`
    : settings?.contactPhone
    ? `https://wa.me/${settings.contactPhone.replace(/\D/g, "")}`
    : "https://wa.me/967770000000";

  const contactOptions = [
    {
      icon: MessageSquare,
      label: "محادثة واتساب مباشرة Support",
      value: "تواصل فوري",
      link: formattedWhatsapp,
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100/60 border-emerald-100",
    },
    {
      icon: Phone,
      label: "اتصال هاتفي مباشر",
      value: settings?.contactPhone || "+967 770 000 000",
      link: settings?.contactPhone ? `tel:${settings.contactPhone.replace(/\s+/g, "")}` : "tel:+967770000000",
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100/60 border-blue-100",
    },
    {
      icon: Mail,
      label: "راسل المؤسس والشركة",
      value: settings?.contactEmail || "samesaeed456@gmail.com",
      link: `mailto:${settings?.contactEmail || "samesaeed456@gmail.com"}`,
      color: "bg-amber-50 text-solar-dark hover:bg-amber-100/60 border-amber-100",
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-10 selection:bg-solar/20 selection:text-carbon"
      dir="rtl"
    >
      <SEO 
        title={`من نحن | ${settings?.storeName || "متجر النخبة الإلكتروني"}`} 
        description={`تعرف على متجر النخبة، الذراع الرقمي لمحلات النخبة للإلكترونيات تحت قيادة الأستاذ حسين عبد الكريم هزاع، ورؤيتنا في تقديم أفضل المنتجات الكهربائية والتقنية المضمونة في اليمن.`}
        canonical="https://alnukhba.store/about"
      />

      {/* Hero Header Section - Compact & Modern */}
      <motion.div
        variants={itemVariants}
        className="text-center mb-8 relative pt-4"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-60 h-60 bg-solar/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-1.5 bg-solar/10 text-solar-dark px-3 mt-2 py-1 rounded-full text-xs font-extrabold mb-4 border border-solar/20 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-solar" />
          <span>القصة، الرؤية والتأثير</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-carbon mb-4 leading-tight">
          من نحن في <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar via-amber-600 to-solar-dark">
            {settings?.storeName || "متجر النخبة للإلكترونيات"}
          </span>
        </h1>
        
        <p className="text-sm sm:text-lg text-cool-gray max-w-3xl mx-auto leading-relaxed font-semibold">
          نحن الذراع الرقمي الرسمي لـ 
          <span className="text-carbon font-extrabold mx-1 relative inline-block underline decoration-solar decoration-2">
            "محلات النخبة للإلكترونيات"
          </span> 
          العريقة باليمن. ننطلق لنوفر البضائع الأصلية وحلول الطاقة ونوصلها لباب بيتك بضمان ومصداقية تامة.
        </p>
      </motion.div>

      {/* Trust Highlights Ribbon under Hero - Compact & Visual */}
      <motion.div 
        variants={itemVariants}
        className="bg-white border border-slate-100/80 rounded-2xl p-4 sm:p-6 mb-12 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {trustStats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3 justify-center md:border-l md:last:border-0 border-slate-100 px-2">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-solar/10 flex items-center justify-center">
              <stat.icon className="w-4 h-4 text-solar-dark" />
            </div>
            <div className="text-right">
              <div className="text-sm sm:text-base font-black text-carbon">{stat.value}</div>
              <div className="text-[11px] text-cool-gray font-bold">{stat.text}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Master 2-Column Split Layout - MERGED Founder & Entity & Message */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
        
        {/* RIGHT COLUMN: The Core Identity & Store Story */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-7 space-y-5"
        >
          <div className="flex items-center gap-2">
            <span className="h-1 w-6 bg-solar rounded-full"></span>
            <span className="text-xs font-bold text-solar-dark uppercase tracking-widest">فكرة التأسيس وغايتنا</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-carbon leading-snug">
            لماذا فتحنا ملف متجر النخبة الرقمي؟
          </h2>

          <p className="text-xs sm:text-sm text-cool-gray leading-relaxed text-justify">
            تأسست <strong>محلات النخبة للإلكترونيات</strong> لخدمة السوق بروح الأمانة والالتزام بالتكنولوجيا العالية. مع تسارع التقنية وتزايد طلب زوارنا من كافة المحافظات على الأجهزة والقطع الأصلية ومعدات الطاقة دون تكاليف السفر العالية؛ بادرنا بابتكار هذا المتجر كواجهة إلكترونية راقية تقدم جميع القطع والحلول مباشرة بضغطة زر.
          </p>

          {/* Key Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <Cpu className="w-4 h-4 text-solar shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-carbon text-xs">تكنولوجيا موثوقة</h4>
                <p className="text-[11px] text-cool-gray mt-0.5">فحص واختبار دقيق للمعدات قبل إعطائها إذن الشحن.</p>
              </div>
            </div>
            
            <div className="flex gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-solar shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-carbon text-xs">ضمان حقيقي ومدعوم</h4>
                <p className="text-[11px] text-cool-gray mt-0.5">حلول دعم مابعد البيع بضمان فروعنا الفيزيائية.</p>
              </div>
            </div>
          </div>

          {/* Connected Entity info inside the story */}
          <div className="bg-gradient-to-l from-slate-900 via-carbon to-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-solar/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-2.5">
              <Store className="w-5 h-5 text-solar" />
              <h3 className="font-black text-sm text-solar">محلات النخبة للإلكترونيات العريقة</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-normal mb-0">
              العلامة الأم الضامنة لكافة عمليات البيع والاسترجاع عبر المتجر. نفخر بثقة آلاف العملاء في فروعنا على امتداد سنوات من الخدمة والجدارة الفنية.
            </p>
          </div>
        </motion.div>

        {/* LEFT COLUMN: Premium Master Owner Card & Message */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-4 lg:sticky lg:top-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-md flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-solar/5 rounded-full blur-2xl"></div>
          
          {/* Avatar frame */}
          <div className="relative group mb-3.5">
            <div className="absolute -inset-1 bg-gradient-to-tr from-solar via-amber-500 to-solar-dark rounded-full blur-sm opacity-70 group-hover:scale-105 transition duration-500"></div>
            <div className="relative rounded-full overflow-hidden w-24 h-24 sm:w-28 sm:h-28 border-2 border-white bg-slate-100">
              <img 
                src={founderImg} 
                alt="حسين عبد الكريم هزاع - صاحب متجر النخبة" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <span className="text-solar-dark font-extrabold text-[11px] uppercase tracking-wider bg-solar/10 py-0.5 px-2 rounded">
            قسم المالك و الإدارة
          </span>
          
          <h3 className="text-base sm:text-lg font-black text-carbon mt-2 mb-0.5">حسين عبد الكريم هزاع</h3>
          <p className="text-[11px] text-cool-gray font-bold mb-3">صاحب ومؤسس متجر ومحلات النخبة للإلكترونيات</p>

          <blockquote className="text-xs text-cool-gray leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100/50 mb-0">
            "شعارنا الدائم هو تزويد عملائنا بالنوعية الممتازة لا بالكمية العابرة، وبناء جسور من الثقة الصلبة معكم أينما كنتم في اليمن."
          </blockquote>
        </motion.div>
      </div>

      {/* COMPACT CONNECTION PANEL - All contact options horizontal and premium (دمج وتوفير مساحة) */}
      <motion.div 
        variants={itemVariants} 
        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-6 mb-8 text-center"
      >
        <span className="text-solar-dark font-bold text-xs bg-solar/15 px-3 py-1 rounded-full mb-2 inline-block">
          تواصل معنا وتفضّل بالاستفسار
        </span>
        <h3 className="text-lg sm:text-xl font-black text-carbon mb-1">صوت العميل مسموع في كل وقت</h3>
        <p className="text-xs text-cool-gray max-w-xl mx-auto mb-4">
          نحن هنا لتلقي أسئلتكم، وإعطائكم استفسارات بخصوص الأجهزة والأصناف أو صيانة منتج سابق بشكل فوري.
        </p>

        {/* Contacts Option Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {contactOptions.map((opt, key) => (
            <a
              key={key}
              href={opt.link}
              target={opt.link.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className={`p-3.5 rounded-xl border text-right transition-all flex items-center gap-3 cursor-pointer shadow-xs ${opt.color}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0">
                <opt.icon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <h5 className="font-extrabold text-[11px] text-carbon mb-0.5 truncate">{opt.label}</h5>
                <p className="text-xs font-bold truncate opacity-90">{opt.value}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
