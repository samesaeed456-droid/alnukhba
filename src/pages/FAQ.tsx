import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, MessageCircle, FileText, ShieldCheck, Truck, RefreshCcw, MapPin, Wallet, CreditCard, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const faqs = [
  {
    category: "الطلبات والتوصيل",
    icon: Truck,
    questions: [
      {
        q: "كم يستغرق توصيل الطلب؟",
        a: "يستغرق التوصيل داخل منطقة الراهدة وتعز من 24 إلى 48 ساعة. أما للمحافظات الأخرى، فيستغرق من 2 إلى 4 أيام عمل عبر شركات النقل المحلية."
      },
      {
        q: "هل يمكنني استلام طلبي من الفرع؟",
        a: "نعم، يمكنك اختيار 'الاستلام من الفرع' عند إتمام الطلب واستلامه مباشرة من مقرنا في تعز - الراهدة (جوار ورشة عبد الكافي للألمنيوم) دون أي رسوم توصيل."
      },
      {
        q: "كيف يمكنني تتبع حالة طلبي؟",
        a: "يمكنك تتبع طلبك بسهولة عبر صفحة 'تتبع الطلب' في القائمة العلوية باستخدام رقم الطلب الذي يصلك في رسالة التأكيد."
      }
    ]
  },
  {
    category: "الدفع والمحفظة",
    icon: Wallet,
    questions: [
      {
        q: "ما هي طرق الدفع المتاحة؟",
        a: "نوفر خيارات دفع متعددة تشمل: المحفظة الرقمية للمتجر، التحويل عبر الكريمي، جوال بي، نجم، بالإضافة إلى الدفع عند الاستلام في مناطق محددة."
      },
      {
        q: "كيف يمكنني شحن رصيد محفظتي؟",
        a: "يمكنك شحن رصيدك عبر التحويل إلى حساباتنا في الكريمي أو النجم، ثم إرسال صورة التحويل لخدمة العملاء ليتم إضافة الرصيد فوراً إلى حسابك في المتجر."
      },
      {
        q: "هل بياناتي المالية آمنة؟",
        a: "نعم، نحن نستخدم بروتوكولات تشفير متقدمة لضمان حماية خصوصيتك وبياناتك. جميع المعاملات المالية تتم عبر قنوات رسمية وآمنة."
      }
    ]
  },
  {
    category: "الجودة والاسترجاع",
    icon: ShieldCheck,
    questions: [
      {
        q: "هل جميع المنتجات أصلية؟",
        a: "نعم، نضمن في متجر النخبة أن جميع منتجاتنا أصلية 100% ومستوردة من مصادرها الرسمية. شعارنا هو الجودة والمصداقية."
      },
      {
        q: "ما هي سياسة الاستبدال والاسترجاع؟",
        a: "يمكنك استبدال أو استرجاع المنتج خلال 3 أيام من تاريخ الاستلام في حال وجود عيب مصنعي أو عدم مطابقة للمواصفات، بشرط أن يكون المنتج بحالته الأصلية وتغليفه المصنعي."
      }
    ]
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-bg-general py-12 sm:py-20 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bg-section to-bg-general -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-solar/5 rounded-full blur-3xl -z-10" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6"
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-white rounded-[24px] shadow-xl border border-bg-hover flex items-center justify-center mx-auto mb-6"
          >
            <HelpCircle className="w-10 h-10 text-solar" />
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black text-carbon mb-4 tracking-tight">الأسئلة الشائعة</h1>
          <p className="text-muted text-sm sm:text-lg max-w-2xl mx-auto font-medium">
            كل ما تحتاج معرفته عن خدمات متجر النخبة، التوصيل، وطرق الدفع في مكان واحد.
          </p>
        </motion.div>

        <div className="space-y-8">
          {faqs.map((section, sIdx) => (
            <motion.div 
              key={sIdx} 
              variants={itemVariants}
              className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-bg-hover"
            >
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-bg-hover">
                <div className="w-12 h-12 bg-bg-section rounded-2xl flex items-center justify-center text-solar">
                  <section.icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-carbon">{section.category}</h2>
              </div>

              <div className="space-y-4">
                {section.questions.map((item, qIdx) => {
                  const id = `${sIdx}-${qIdx}`;
                  const isOpen = openIndex === id;
                  return (
                    <div 
                      key={qIdx} 
                      className={`rounded-2xl overflow-hidden transition-all duration-300 border ${
                        isOpen 
                        ? 'border-solar/30 bg-bg-section' 
                        : 'border-bg-hover hover:border-solar/20 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => toggleAccordion(id)}
                        className="w-full flex items-center justify-between p-5 sm:p-6 text-right focus:outline-none"
                      >
                        <span className={`font-bold text-sm sm:text-lg pr-2 transition-colors ${isOpen ? 'text-carbon' : 'text-slate-600'}`}>
                          {item.q}
                        </span>
                        <motion.div 
                          animate={{ 
                            backgroundColor: isOpen ? 'var(--primary-gold)' : 'var(--bg-hover)',
                            color: isOpen ? '#000000' : 'var(--text-muted)',
                            rotate: isOpen ? 180 : 0
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="px-5 sm:px-6 pb-6 pt-2 text-muted text-xs sm:text-base leading-relaxed border-t border-bg-hover/50 mx-5 sm:mx-6 mt-2 font-medium">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div 
          variants={itemVariants}
          className="mt-16 bg-carbon rounded-[2.5rem] p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-solar/10 rounded-full blur-3xl -z-0" />
          
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">هل لديك سؤال آخر؟</h3>
            <p className="text-white/60 mb-10 max-w-lg mx-auto font-medium">
              فريق الدعم الفني في متجر النخبة متواجد لخدمتك عبر الواتساب أو الاتصال المباشر.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="https://wa.me/967777777777" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                واتساب مباشر
              </a>
              <Link 
                to="/contact" 
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-2xl font-black transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                اتصل بنا
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
