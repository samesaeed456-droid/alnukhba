import React from 'react';
import { Store, Users, Target, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
          نحن هنا لنعيد تعريف <br className="hidden sm:block" />
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            تجربة التسوق الإلكتروني
          </motion.span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
          منذ تأسيسنا في عام 2020، أخذنا على عاتقنا مهمة توفير أحدث المنتجات التقنية والإلكترونية بأفضل الأسعار، مع التركيز التام على جودة الخدمة ورضا العميل.
        </p>
      </motion.div>

      {/* Image Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-24">
        <motion.div 
          whileHover={{ y: -10 }}
          className="md:col-span-2 h-64 sm:h-96 rounded-3xl overflow-hidden shadow-lg relative group"
        >
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1600" 
            alt="Our Team" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
            <h3 className="text-xl font-bold text-white">فريق عمل شغوف</h3>
          </div>
        </motion.div>
        <div className="flex flex-col gap-4 sm:gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="h-48 sm:h-[calc(50%-12px)] rounded-3xl overflow-hidden shadow-lg relative group"
          >
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" 
              alt="Our Office" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="h-48 sm:h-[calc(50%-12px)] rounded-3xl overflow-hidden shadow-lg relative group"
          >
            <img 
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800" 
              alt="Customer Service" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          </motion.div>
        </div>
      </motion.div>

      {/* Core Values */}
      <div className="mb-24">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-2xl font-black text-slate-900 mb-4">قيمنا الأساسية</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            نؤمن بأن النجاح الحقيقي يبنى على أسس وقيم راسخة لا نحيد عنها في تعاملاتنا اليومية.
          </p>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: "الجودة أولاً",
              desc: "ننتقي منتجاتنا بعناية فائقة من أفضل العلامات التجارية العالمية لضمان حصولك على الأفضل دائماً."
            },
            {
              icon: Users,
              title: "العميل هو المحور",
              desc: "كل قرار نتخذه يهدف في المقام الأول إلى تحسين وتسهيل تجربة التسوق لعملائنا الكرام."
            },
            {
              icon: Award,
              title: "الشفافية والمصداقية",
              desc: "نلتزم بالوضوح التام في أسعارنا، سياساتنا، ومواصفات منتجاتنا دون أي تكاليف خفية."
            }
          ].map((val, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <val.icon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{val.title}</h3>
              <p className="text-slate-500 leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div 
        variants={itemVariants}
        className="bg-slate-900 rounded-3xl p-12 sm:p-16 text-white relative overflow-hidden"
      >
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"
        ></motion.div>
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"
        ></motion.div>
        
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "+50K", label: "عميل سعيد" },
            { num: "+10K", label: "منتج متاح" },
            { num: "99%", label: "نسبة الرضا" },
            { num: "24/7", label: "دعم فني" }
          ].map((stat, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-2"
            >
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                {stat.num}
              </div>
              <div className="text-slate-400 font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
