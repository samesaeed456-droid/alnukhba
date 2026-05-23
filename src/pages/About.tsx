import React from "react";
import { 
  Store, 
  Users, 
  Target, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";
import SEO from "../components/SEO";
import founderImg from "../assets/images/founder_avatar_1779541619999.png";

export default function About() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const contactOptions = [
    {
      icon: Phone,
      label: "اتصال مباشر",
      value: "+967 770 000 000",
      link: "tel:+967770000000",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50",
    },
    {
      icon: MessageSquare,
      label: "محادثة واتساب",
      value: "تواصل مباشر مع الدعم",
      link: "https://wa.me/967770000000",
      color: "bg-green-50 text-green-600 border-green-100 hover:bg-green-100/50",
    },
    {
      icon: Mail,
      label: "البريد الإلكتروني",
      value: "samesaeed456@gmail.com",
      link: "mailto:samesaeed456@gmail.com",
      color: "bg-amber-50 text-solar border-amber-100 hover:bg-amber-100/50",
    },
    {
      icon: MapPin,
      label: "موقعنا الرئيسي",
      value: "محلات النخبة للإلكترونيات",
      link: "https://maps.google.com",
      color: "bg-slate-50 text-carbon border-slate-200 hover:bg-slate-100",
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 selection:bg-solar/20 selection:text-carbon"
      dir="rtl"
    >
      <SEO 
        title="من نحن | متجر النخبة الإلكتروني" 
        description="تعرف على قصة تأسيس متجر النخبة كذراع رقمي لمحلات النخبة للإلكترونيات، ورؤية مؤسسه المهندس أسامة سعيد في تقديم أفضل الحلول التقنية في اليمن."
        canonical="https://alnukhba.store/about"
      />

      {/* Hero Badge & Section */}
      <motion.div
        variants={itemVariants}
        className="text-center mb-16 sm:mb-24 relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-72 h-72 bg-solar/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 bg-solar/10 text-solar-dark px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-6 border border-solar/20 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span>القصة، الرؤية والشغف بالتميز</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-carbon mb-6 leading-tight">
          من نحن في <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar via-amber-600 to-solar-dark">
            متجر النخبة للإلكترونيات
          </span>
        </h1>
        
        <p className="text-base sm:text-xl text-cool-gray max-w-4xl mx-auto leading-relaxed font-medium">
          نحن لسمنا مجرد متجر إلكتروني عابر، بل نحن الذراع الرقمي الرسمي لـ 
          <span className="text-carbon font-extrabold mx-1 relative inline-block">
            "محلات النخبة للإلكترونيات"
          </span> 
          العريقة. انطلقنا برؤية عصرية طموحة لنقل التسوق التكنولوجي في اليمن لآفاق تفوق توقعاتكم بالكامل.
        </p>
      </motion.div>

      {/* Main Philosophy & The Store Idea */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20 sm:mb-32">
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-7 space-y-6"
        >
          <div className="flex items-center gap-3">
            <span className="h-1 w-10 bg-solar rounded-full"></span>
            <span className="text-xs sm:text-sm font-bold text-solar-dark uppercase tracking-widest">فكرة المتجر وغايته</span>
          </div>
          
          <h2 className="text-2xl sm:text-4xl font-black text-carbon leading-snug">
            لماذا فتحنا هذا المتجر؟ وما هي الفكرة التي تحرّكنا؟
          </h2>
          
          <p className="text-sm sm:text-base text-cool-gray leading-relaxed">
            تأسست <strong>محلات النخبة للإلكترونيات</strong> لخدمة السوق بروح الالتزام والجودة العالية. ومع التطور التقني السريع وصعوبة وصول الكثير من العملاء في مختلف المحافظات إلى فروعنا للحصول على قطع أصلية مضمونة، ولدت فكرة إطلاق هذا <strong>المتجر الإلكتروني الراقي</strong>.
          </p>

          <p className="text-sm sm:text-base text-cool-gray leading-relaxed">
            الهدف الأساسي كان سد الفجوة في السوق اليمنية عبر تقديم منصة تتيح شراء كابلات الكهرباء، الأجهزة، حلول الطاقة الاحترافية، والقطع الإلكترونية المتكاملة بمصداقية مئة بالمئة ودعم كامل، مع تفعيل خدمات الشحن الذكية والدفع عند الاستلام لتصلك التقنية أينما كنت.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Cpu className="w-5 h-5 text-solar shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-carbon text-sm sm:text-base">تكنولوجيا موثوقة</h4>
                <p className="text-xs text-cool-gray mt-1">جميع منتجات النخبة تخضع لفحص جودة صارم قبل شحنها.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-solar shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-carbon text-sm sm:text-base">ضمان وأمان حقيقي</h4>
                <p className="text-xs text-cool-gray mt-1">خدمة ضمان حقيقية وسياسة استرجاع مرنة لراحة بالك.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Big visual banner for the affiliate stores */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-5 relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-solar to-carbon rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-3xl border border-slate-100 p-8 sm:p-10 shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-solar/5 rounded-full blur-2xl"></div>
            
            <Store className="w-12 h-12 text-solar-dark mb-6" />
            <span className="text-xs font-extrabold text-solar py-1 px-3 bg-solar/10 rounded-full">الجهة المالكة للعلامة</span>
            
            <h3 className="text-xl sm:text-2xl font-black text-carbon mt-4 mb-2">محلات النخبة للإلكترونيات</h3>
            <p className="text-sm text-cool-gray leading-relaxed mb-6">
              سلسلة فروع رائدة في توريد الحلول الكهربية، التقنية ومعدات الطاقة الحديثة. نعتّز بثقة آلاف العملاء الأوفياء على مدى سنوات من الالتزام والخدمة الفريدة.
            </p>

            <div className="border-t border-slate-100 pt-6 space-y-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>فروعنا مجهزة بالكامل لخدمتكم</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>فريق هندسي متخصص للدعم الفني</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Owner Detail & Profile Section */}
      <div className="bg-slate-50/70 rounded-3xl border border-slate-100/50 p-8 sm:p-12 lg:p-16 mb-20 sm:mb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-solar/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-carbon/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Picture of the Owner */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-4 flex justify-center"
          >
            <div className="relative group">
              {/* Outer decorative gold ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-solar via-amber-500 to-solar-dark rounded-2xl blur-md opacity-75 group-hover:scale-102 transition duration-500"></div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white w-64 h-80 sm:w-72 sm:h-96">
                <img 
                  src={founderImg} 
                  alt="المهندس أسامة سعيد - صاحب متجر النخبة" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="text-solar font-black text-xs uppercase tracking-wider mb-1">صاحب ومؤسس المتجر</span>
                  <h4 className="text-white text-lg sm:text-xl font-bold">المهندس أسامة سعيد</h4>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details & Founders message */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-8 space-y-6"
          >
            <span className="text-solar font-black text-sm uppercase tracking-wider block">كلمة مؤسس المتجر</span>
            
            <h3 className="text-2xl sm:text-4xl font-black text-carbon leading-snug">
              "نهجنا الدائم هو تزويدكم بالنوعية لا الكمية، وبناء جسور من الثقة غير قابلة للاهتزاز"
            </h3>

            <p className="text-sm sm:text-base text-cool-gray leading-relaxed italic">
              «عندما بدأت التخطيط لإطلاق متجر النخبة الإلكتروني، كان دافعي الأبرز هو تسهيل حياة عملائنا الكرام. التكنولوجيا يجب أن تُبسط الحياة، لا أن تكون مصدر قلق بشأن الجودة والضمان. من هنا، أخذت على عاتقي أن تكون كل قطعة، جهاز، أو تفصيل تقني نعرضه بمثابة كلمة شرف نلتزم بها أمامكم. نحن في محلات النخبة نعتبركم شركاء نجاح ونسعد بخدمتكم في كل ثانية.»
            </p>

            <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="font-bold text-carbon text-lg">م. أسامة سعيد</h5>
                <p className="text-xs sm:text-sm text-cool-gray">مؤسس ومدير متجر النخبة للإلكترونيات</p>
              </div>

              <div className="flex gap-3">
                <a 
                  href="mailto:samesaeed456@gmail.com" 
                  className="bg-carbon text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-xl transition-all hover:bg-solar hover:text-carbon shadow-sm hover:shadow"
                >
                  راسل المؤسس مباشرة
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Professional Direct Contact Section (تواصل معنا) */}
      <div id="contact-panel" className="mb-20 sm:mb-32">
        <motion.div 
          variants={itemVariants}
          className="text-center mb-12"
        >
          <span className="text-solar font-bold text-xs sm:text-sm uppercase tracking-wider px-3 py-1 bg-solar/10 rounded-full inline-block mb-3">مركز تواصل النخبة</span>
          <h2 className="text-2xl sm:text-4xl font-black text-carbon">نحن هنا دائمًا للاستماع والاستفسار</h2>
          <p className="text-sm sm:text-base text-cool-gray max-w-2xl mx-auto mt-2">
            سواء كنت بحاجة لاستشارة فنية، طلب صيانة لمنتج مسبق، أو طلب كميات مخصصة؛ نسعد بتواصلك المباشر معنا.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {contactOptions.map((opt, idx) => (
            <motion.a
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              href={opt.link}
              target={opt.link.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className={`p-6 rounded-2xl border text-right transition-all flex flex-col h-full justify-between cursor-pointer shadow-sm bg-white ${opt.color}`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm mb-4">
                  <opt.icon className="w-5 h-5 shrink-0" />
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-carbon mb-1">{opt.label}</h4>
                <p className="text-xs sm:text-sm font-semibold opacity-90">{opt.value}</p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-black transition-colors">
                <span>تواصل الآن</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>

      {/* Elite Stats / Trust highlights */}
      <motion.div
        variants={itemVariants}
        className="bg-carbon rounded-3xl p-8 sm:p-16 text-white relative overflow-hidden shadow-2xl border border-carbon-light/10"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-solar/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-solar/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-x-reverse divide-white/10">
          {[
            { num: "١٠٠٪", label: "منتجات أصلية بمصدر مضمون" },
            { num: "٢٤/٧", label: "مستشارون فنيون لخدمتكم" },
            { num: "١", label: "متجر معتمد رسمياً بضمان محلات النخبة" },
            { num: "ثقة", label: "آلاف الشحنات الناجحة لكافة مدن اليمن" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="space-y-2 px-2"
            >
              <div className="text-3xl sm:text-5xl font-black text-solar">
                {stat.num}
              </div>
              <div className="text-[11px] sm:text-sm text-slate-300 font-bold leading-relaxed">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
