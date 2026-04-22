import React from 'react';
import { motion } from 'motion/react';
import { Truck, MapPin, ShieldCheck, Clock } from 'lucide-react';

export default function Shipping() {
  return (
    <div className="bg-bg-general min-h-screen py-8 sm:py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bg-section to-bg-general -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6"
      >
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-12 shadow-xl border border-bg-hover">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-solar/10 flex items-center justify-center">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-solar" />
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-carbon">سياسة الشحن والتوصيل</h1>
          </div>

          <div className="space-y-6 sm:space-y-8 text-right">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-carbon mb-3 sm:mb-4 flex items-center gap-2 justify-end">
                مناطق التوصيل
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-solar" />
              </h2>
              <p className="text-muted text-sm sm:text-base leading-relaxed font-medium">
                نحن نقدم خدمة التوصيل إلى جميع محافظات الجمهورية اليمنية. نسعى جاهدين لتوسيع نطاق تغطيتنا لتشمل جميع المناطق النائية في المستقبل القريب.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-carbon mb-3 sm:mb-4 flex items-center gap-2 justify-end">
                مدة التوصيل
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-solar" />
              </h2>
              <p className="text-muted text-sm sm:text-base leading-relaxed font-medium">
                تتراوح مدة التوصيل عادة بين 24 إلى 48 ساعة داخل المدن الرئيسية، ومن 3 إلى 5 أيام عمل للمناطق الأخرى. قد تختلف هذه المدد بناءً على الظروف اللوجستية.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-carbon mb-3 sm:mb-4 flex items-center gap-2 justify-end">
                تكلفة الشحن
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-solar" />
              </h2>
              <p className="text-muted text-sm sm:text-base leading-relaxed font-medium">
                يتم احتساب تكلفة الشحن بناءً على وزن الطلب والوجهة النهائية. يمكنك رؤية التكلفة الإجمالية للشحن في صفحة الدفع قبل إتمام الطلب.
              </p>
            </section>

            <div className="bg-bg-section p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-bg-hover mt-8 sm:mt-12">
              <p className="text-xs sm:text-sm text-muted text-center font-medium">
                إذا كان لديك أي استفسار بخصوص شحنتك، يرجى التواصل مع فريق الدعم الفني عبر صفحة اتصل بنا.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
