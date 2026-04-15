import React from 'react';
import { motion } from 'motion/react';
import { Truck, MapPin, ShieldCheck, Clock } from 'lucide-react';

export default function Shipping() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-100"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-solar/10 flex items-center justify-center">
            <Truck className="w-6 h-6 text-solar" />
          </div>
          <h1 className="text-3xl font-black text-carbon">سياسة الشحن والتوصيل</h1>
        </div>

        <div className="space-y-8 text-right">
          <section>
            <h2 className="text-xl font-bold text-carbon mb-4 flex items-center gap-2 justify-end">
              مناطق التوصيل
              <MapPin className="w-5 h-5 text-solar" />
            </h2>
            <p className="text-slate-600 leading-relaxed">
              نحن نقدم خدمة التوصيل إلى جميع محافظات الجمهورية اليمنية. نسعى جاهدين لتوسيع نطاق تغطيتنا لتشمل جميع المناطق النائية في المستقبل القريب.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-carbon mb-4 flex items-center gap-2 justify-end">
              مدة التوصيل
              <Clock className="w-5 h-5 text-solar" />
            </h2>
            <p className="text-slate-600 leading-relaxed">
              تتراوح مدة التوصيل عادة بين 24 إلى 48 ساعة داخل المدن الرئيسية، ومن 3 إلى 5 أيام عمل للمناطق الأخرى. قد تختلف هذه المدد بناءً على الظروف اللوجستية.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-carbon mb-4 flex items-center gap-2 justify-end">
              تكلفة الشحن
              <ShieldCheck className="w-5 h-5 text-solar" />
            </h2>
            <p className="text-slate-600 leading-relaxed">
              يتم احتساب تكلفة الشحن بناءً على وزن الطلب والوجهة النهائية. يمكنك رؤية التكلفة الإجمالية للشحن في صفحة الدفع قبل إتمام الطلب.
            </p>
          </section>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-12">
            <p className="text-sm text-slate-500 text-center">
              إذا كان لديك أي استفسار بخصوص شحنتك، يرجى التواصل مع فريق الدعم الفني عبر صفحة اتصل بنا.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
