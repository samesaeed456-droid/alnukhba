import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ShieldCheck, Scale, UserCheck, CreditCard, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const termSections = [
  {
    id: "1",
    title: "مقدمة واتفاقية الاستخدام",
    icon: Scale,
    content: "مرحباً بكم في متجر النخبة. باستخدامكم لهذا الموقع، فإنكم توافقون على الالتزام بالشروط والأحكام التالية. يرجى قراءتها بعناية قبل البدء في استخدام المتجر، حيث تعتبر هذه الشروط بمثابة عقد قانوني بينكم وبين المتجر."
  },
  {
    id: "2",
    title: "حساب المستخدم والمسؤولية",
    icon: UserCheck,
    content: "أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور الخاصة بك. كما توافق على تحمل المسؤولية الكاملة عن جميع الأنشطة التي تحدث تحت حسابك، ويجب إبلاغنا فوراً في حال اشتباهك في أي اختراق أمني."
  },
  {
    id: "3",
    title: "الأسعار وعمليات الدفع",
    icon: CreditCard,
    content: "نحن نسعى جاهدين لتقديم أدق المعلومات حول الأسعار. ومع ذلك، قد تحدث أخطاء تقنية. في حال وجود خطأ في سعر المنتج، نحتفظ بالحق في إلغاء الطلب أو التواصل معك لتصحيح السعر قبل الشحن."
  },
  {
    id: "4",
    title: "الشحن والتوصيل",
    icon: Truck,
    content: "نحن نبذل قصارى جهدنا لتوصيل طلباتكم في أسرع وقت ممكن. تعتمد مدة التوصيل على موقعك الجغرافي. المتجر غير مسؤول عن التأخير الناتج عن شركات الشحن الخارجية أو الظروف القاهرة."
  },
  {
    id: "5",
    title: "حقوق الملكية الفكرية",
    icon: ShieldCheck,
    content: "جميع المحتويات الموجودة على الموقع من نصوص، صور، شعارات، وتصاميم هي ملكية حصرية لمتجر النخبة ومحمية بموجب قوانين الملكية الفكرية المعمول بها."
  }
];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-general py-8 sm:py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bg-section to-bg-general -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border border-bg-hover hover:scale-110 transition-all text-carbon"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-4xl font-black text-carbon">الشروط والأحكام</h1>
            <p className="text-muted text-xs sm:text-sm font-medium mt-1">آخر تحديث: مارس 2026</p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {termSections.map((section) => (
            <motion.section 
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-xl border border-bg-hover group hover:border-solar/30 transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-bg-section rounded-lg sm:rounded-xl flex items-center justify-center text-solar group-hover:scale-110 transition-transform">
                  <section.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 className="text-base sm:text-xl font-black text-carbon">{section.id}. {section.title}</h2>
              </div>
              <p className="text-muted text-sm sm:text-base leading-relaxed font-medium sm:mr-14">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 p-6 sm:p-8 bg-carbon rounded-2xl sm:rounded-[2rem] text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-solar/10 rounded-full blur-2xl" />
          <p className="text-white/70 text-sm sm:text-base font-medium mb-6">باستخدامك لمتجر النخبة، أنت توافق على جميع البنود المذكورة أعلاه.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-solar text-carbon px-6 sm:px-8 py-3 rounded-xl font-black hover:scale-105 transition-transform text-sm sm:text-base"
          >
            العودة للرئيسية
          </button>
        </div>
      </motion.div>
    </div>
  );
}
