import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-24 sm:pt-32 pb-12 relative overflow-hidden bg-bg-general">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-solar/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-carbon/5 blur-[120px]" />
      </div>

      <div className="relative z-10 text-center max-w-7xl mx-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8 sm:mb-12"
        >
          <h1 className="text-[100px] sm:text-[150px] font-black text-carbon/5 leading-none select-none tracking-tighter">
            404
          </h1>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-carbon p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-solar/20 relative"
            >
              <ShoppingBag className="w-10 h-10 sm:w-16 sm:h-16 text-solar" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-4 border-carbon animate-pulse" />
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl sm:text-4xl font-black text-carbon mb-4 tracking-tight">
            عذراً، هذه الصفحة <span className="text-solar">غير متوفرة</span>
          </h2>
          <p className="text-slate-500 mb-12 max-w-md mx-auto text-sm sm:text-lg leading-relaxed">
            يبدو أنك سلكت طريقاً خاطئاً. لا تقلق، يمكنك العودة لتصفح أحدث مجموعاتنا الفاخرة بكل سهولة.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
        >
          <Link 
            to="/" 
            className="w-full sm:w-auto bg-carbon hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-carbon/20 hover:-translate-y-1 flex items-center justify-center gap-3 group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>العودة للرئيسية</span>
          </Link>
          
          <Link 
            to="/search" 
            className="w-full sm:w-auto bg-white border border-slate-200 hover:border-solar hover:text-solar text-carbon px-10 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group"
          >
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>البحث عن منتج</span>
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 pt-8 border-t border-slate-100"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-6">
            روابط قد تهمك
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {[
              { name: 'أحدث العروض', path: '/deals' },
              { name: 'الأكثر مبيعاً', path: '/search?sort=popular' },
              { name: 'تتبع طلبك', path: '/track-order' }
            ].map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                className="text-xs sm:text-sm font-bold text-carbon hover:text-solar transition-colors flex items-center gap-1 group"
              >
                {link.name}
                <ArrowRight className="w-3 h-3 -rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
