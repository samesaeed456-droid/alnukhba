import React from 'react';
import { motion } from 'motion/react';
import { FastImage } from '../FastImage';
import { Mail, Send } from 'lucide-react';
import { FloatingInput } from '../FloatingInput';

const PremiumFeatures = React.memo(() => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={itemVariants} 
      className="mt-16 sm:mt-28 mb-10 sm:mb-20 mx-4 sm:mx-auto max-w-[1400px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-center">
        {/* Newsletter / Join Us Card - Desktop Only */}
        <div className="hidden lg:flex lg:col-span-2 bg-bg-card p-10 rounded-[48px] border border-white/5 shadow-xl flex-col justify-center relative overflow-hidden group h-full">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-solar/10 rounded-full blur-3xl group-hover:bg-solar/20 transition-colors duration-500"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-solar/10 rounded-2xl flex items-center justify-center text-solar mb-6">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="text-3xl font-black text-carbon mb-4 leading-tight">
              كن أول من يعرف <br /> عن أقوى العروض
            </h3>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              انضم إلى أكثر من 10,000 مشترك واحصل على خصومات حصرية تصل إلى 30% مباشرة في بريدك.
            </p>
            
            <div className="flex flex-col gap-3">
              <FloatingInput 
                id="newsletterEmail"
                label="بريدك الإلكتروني"
                type="email" 
                bgClass="bg-bg-general"
              />
              <button className="bg-solar text-black px-8 py-4 rounded-2xl font-black shadow-lg shadow-solar/20 hover:shadow-solar/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                اشترك الآن
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Features Image Card - Blended with Background */}
        <div className="lg:col-span-3 flex items-center justify-center">
          <div className="w-full relative group">
            <FastImage 
              src="https://cdn.salla.sa/form-builder/vcCs6gGkOM8L38C6HgrrX5TC83SE4pa4dfXoiAwk.png" 
              alt="مميزات متجر النخبة" 
              className="w-full h-auto rounded-2xl sm:rounded-[48px] mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            />
            {/* Subtle glow behind image to integrate it */}
            <div className="absolute inset-0 bg-gradient-to-tr from-solar/5 to-transparent -z-10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default PremiumFeatures;
