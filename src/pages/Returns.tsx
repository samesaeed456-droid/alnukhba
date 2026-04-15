import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, ShieldCheck, Clock, AlertCircle, CreditCard, Phone, CheckCircle2, ArrowLeftRight, Package, MessageSquare, HelpCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const policySections = [
  {
    title: "فترة الاسترجاع والاستبدال",
    icon: Clock,
    color: "bg-blue-50 text-blue-600",
    content: "نمنحك في متجر النخبة فترة مرنة تصل إلى 14 يوماً من تاريخ استلام الطلب لاستبدال أو استرجاع مشترياتك، لضمان رضاك التام عن الجودة والأداء."
  },
  {
    title: "ضمان الجودة والحالة",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
    content: "يجب أن يكون المنتج في حالته الأصلية، غير مستخدم، وبكامل تغليفه المصنعي مع كافة الملحقات والكتيبات والهدايا المرفقة إن وجدت."
  },
  {
    title: "المنتجات المستثناة",
    icon: AlertCircle,
    color: "bg-amber-50 text-amber-600",
    content: "لا يمكن استرجاع البرمجيات، البطاقات الرقمية، أو المنتجات التي تم فتح تغليفها الأصلي (مثل الهواتف والكمبيوترات) إلا في حال وجود عيب مصنعي واضح."
  }
];

const steps = [
  {
    title: "تواصل معنا",
    desc: "راسلنا عبر الواتساب أو اتصل بخدمة العملاء لتوضيح سبب الاسترجاع.",
    icon: MessageSquare
  },
  {
    title: "فحص الطلب",
    desc: "سيقوم فريقنا الفني بمراجعة طلبك والموافقة المبدئية عليه.",
    icon: CheckCircle2
  },
  {
    title: "شحن المنتج",
    desc: "قم بتغليف المنتج جيداً وإرساله عبر شركة الشحن المعتمدة لدينا.",
    icon: Package
  },
  {
    title: "استرداد المبلغ",
    desc: "بعد الفحص النهائي، يتم تحويل المبلغ لحسابك أو استبدال المنتج فوراً.",
    icon: CreditCard
  }
];

export default function Returns() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-bg-general py-12 sm:py-24 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bg-section to-bg-general -z-10" />
      <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-solar/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-40 left-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6"
      >
        {/* Hero Header */}
        <motion.div variants={itemVariants} className="text-center mb-20">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-white shadow-2xl border border-bg-hover mb-8"
          >
            <RefreshCcw className="w-10 h-10 text-solar" />
          </motion.div>
          <h1 className="text-3xl sm:text-6xl font-black text-carbon mb-6 tracking-tight">
            سياسة <span className="text-solar">النخبة</span> للاسترجاع
          </h1>
          <p className="text-muted text-sm sm:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            ثقتكم هي رأس مالنا. صممنا سياسة الاسترجاع والاستبدال لتكون عادلة، شفافة، وتضمن حقوقكم كشركاء نجاح لمتجر النخبة.
          </p>
        </motion.div>

        {/* Core Policy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {policySections.map((section, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-bg-hover relative overflow-hidden group"
            >
              <div className={`w-14 h-14 ${section.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                <section.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-carbon mb-4">{section.title}</h3>
              <p className="text-muted text-sm leading-relaxed font-medium">
                {section.content}
              </p>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-bg-section rounded-full -z-0 opacity-50" />
            </motion.div>
          ))}
        </div>

        {/* Detailed Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-20">
          {/* Main Content */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-12">
            <section className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-bg-hover">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-bg-section rounded-xl flex items-center justify-center text-solar">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-carbon">تفاصيل الاسترداد المالي</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-bg-section rounded-3xl border border-bg-hover">
                  <h4 className="font-bold text-carbon mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-solar rounded-full" />
                    البطاقات الائتمانية والمحافظ الرقمية
                  </h4>
                  <p className="text-muted text-sm font-medium mr-4">يتم إرجاع المبلغ تلقائياً لنفس وسيلة الدفع خلال 3-10 أيام عمل حسب سياسة البنك المصدر.</p>
                </div>
                
                <div className="p-6 bg-bg-section rounded-3xl border border-bg-hover">
                  <h4 className="font-bold text-carbon mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-solar rounded-full" />
                    الدفع عند الاستلام
                  </h4>
                  <p className="text-muted text-sm font-medium mr-4">يتم تحويل المبلغ لحسابكم البنكي أو محفظتكم في المتجر خلال 48 ساعة من فحص المنتج المرتجع.</p>
                </div>

                <div className="p-6 bg-bg-section rounded-3xl border border-bg-hover">
                  <h4 className="font-bold text-carbon mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-solar rounded-full" />
                    خدمات التقسيط (تابي/تمارا)
                  </h4>
                  <p className="text-muted text-sm font-medium mr-4">تتم تسوية المبالغ عبر مزود الخدمة مباشرة وتحديث خطة الدفع الخاصة بكم فوراً.</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-bg-hover">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-bg-section rounded-xl flex items-center justify-center text-solar">
                  <Package className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-carbon">رحلة الاسترجاع (خطوة بخطوة)</h2>
              </div>

              <div className="relative space-y-12">
                {/* Vertical Line */}
                <div className="absolute top-0 right-6 w-0.5 h-full bg-bg-hover -z-0 hidden sm:block" />
                
                {steps.map((step, idx) => (
                  <div key={idx} className="relative flex gap-8 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white border-4 border-bg-section shadow-lg flex items-center justify-center shrink-0 z-10 text-solar">
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-carbon mb-1">{step.title}</h4>
                      <p className="text-muted text-sm font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>

          {/* Sidebar Info */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="bg-carbon rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-solar/10 rounded-full blur-2xl" />
              <h3 className="text-xl font-black mb-6 relative z-10">ملاحظات هامة</h3>
              <ul className="space-y-4 relative z-10">
                <li className="flex gap-3 text-sm text-white/70 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-solar shrink-0" />
                  يتحمل العميل رسوم الشحن في حال كان الاسترجاع لرغبة شخصية.
                </li>
                <li className="flex gap-3 text-sm text-white/70 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-solar shrink-0" />
                  المتجر يتحمل كافة التكاليف في حال وجود عيب مصنعي.
                </li>
                <li className="flex gap-3 text-sm text-white/70 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-solar shrink-0" />
                  يجب إرفاق أصل الفاتورة أو رقم الطلب الإلكتروني.
                </li>
              </ul>
            </div>

            <div className="bg-bg-section rounded-[2.5rem] p-8 border border-bg-hover text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-bg-hover flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-solar" />
              </div>
              <h4 className="text-lg font-black text-carbon mb-2">تحتاج مساعدة فورية؟</h4>
              <p className="text-muted text-xs font-medium mb-6">فريقنا الفني جاهز للرد على استفساراتكم بخصوص الضمان والاسترجاع.</p>
              <a 
                href="tel:+967777777777"
                className="block w-full py-4 bg-white hover:bg-bg-hover border border-bg-hover rounded-2xl font-black text-carbon transition-all shadow-sm"
              >
                اتصل بنا الآن
              </a>
            </div>
          </motion.div>
        </div>

        {/* Support CTA */}
        <motion.div 
          variants={itemVariants}
          className="bg-solar rounded-[2.5rem] p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl shadow-solar/20"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-black text-carbon mb-4">هل لديك حالة خاصة؟</h2>
            <p className="text-carbon/70 mb-10 max-w-2xl mx-auto font-medium">
              إذا كان لديك استفسار بخصوص منتج معين أو حالة استرجاع معقدة، لا تتردد في مراسلتنا مباشرة عبر الواتساب.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="https://wa.me/967777777777"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-carbon text-white px-10 py-5 rounded-2xl font-black transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3"
              >
                <MessageSquare className="w-6 h-6" />
                تواصل عبر الواتساب
              </a>
              <Link 
                to="/faq"
                className="bg-white/20 hover:bg-white/30 text-carbon backdrop-blur-md px-10 py-5 rounded-2xl font-black transition-all border border-carbon/10 flex items-center justify-center gap-3"
              >
                <HelpCircle className="w-6 h-6" />
                الأسئلة الشائعة
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
