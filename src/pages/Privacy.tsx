import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Eye, Lock, Database, Share2, Cookie, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const privacySections = [
  {
    id: "1",
    title: "المعلومات التي نجمعها",
    icon: Database,
    content: "نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب أو إجراء عملية شراء، مثل الاسم، البريد الإلكتروني، رقم الهاتف، وعنوان التوصيل. كما نجمع بيانات تقنية حول جهازك وتفاعلك مع الموقع لتحسين الخدمة."
  },
  {
    id: "2",
    title: "كيف نستخدم معلوماتك",
    icon: Eye,
    content: "نستخدم هذه المعلومات لمعالجة طلباتك، التواصل معك بشأن طلبك، وتحسين تجربة التسوق الخاصة بك. كما قد نستخدمها لإرسال عروض ترويجية مخصصة لك إذا وافقت على ذلك."
  },
  {
    id: "3",
    title: "حماية البيانات وأمنها",
    icon: Lock,
    content: "نحن نطبق أعلى معايير الأمان العالمية للحفاظ على سلامة معلوماتك. يتم تشفير جميع البيانات الحساسة والمالية عبر تقنية SSL المتقدمة، ولا يتم تخزين بيانات البطاقات الائتمانية في خوادمنا."
  },
  {
    id: "4",
    title: "ملفات تعريف الارتباط (Cookies)",
    icon: Cookie,
    content: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك، تذكر محتويات سلة التسوق، وفهم تفضيلاتك للزيارات المستقبلية. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من متصفحك."
  },
  {
    id: "5",
    title: "الإفصاح لأطراف ثالثة",
    icon: Share2,
    content: "نحن لا نبيع أو نتاجر بمعلوماتك الشخصية. نشارك فقط البيانات الضرورية مع شركاء موثوقين (مثل شركات الشحن) لإتمام طلبك، وبموجب اتفاقيات سرية صارمة."
  }
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-general py-8 sm:py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bg-section to-bg-general -z-10" />
      <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

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
            <h1 className="text-xl sm:text-4xl font-black text-carbon">سياسة الخصوصية</h1>
            <p className="text-muted text-xs sm:text-sm font-medium mt-1">نحن نحمي خصوصيتك كأنها خصوصيتنا</p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {privacySections.map((section) => (
            <motion.section 
              key={section.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-xl border border-bg-hover group hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-bg-section rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
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

        <div className="mt-8 sm:mt-12 p-5 sm:p-8 bg-emerald-50 rounded-2xl sm:rounded-[2rem] border border-emerald-100 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm self-center sm:self-start">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-center sm:text-right">
            <h4 className="font-black text-carbon mb-1 text-base sm:text-lg">التزامنا تجاهك</h4>
            <p className="text-muted text-xs sm:text-sm font-medium leading-relaxed">
              في متجر النخبة، نعتبر خصوصية بياناتك أولوية قصوى. نحن نلتزم بكافة القوانين واللوائح المحلية والدولية المتعلقة بحماية البيانات لضمان تجربة تسوق آمنة وموثوقة.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
