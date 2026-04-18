import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, MessageCircle, PhoneCall, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function BlockedOverlay() {
  const { user, logout } = useStore();

  if (!user || !user.isBlocked) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-carbon/95 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-[2.5rem] p-8 sm:p-12 w-full max-w-lg shadow-2xl border border-white/10 text-center"
        >
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-carbon mb-4">عذراً، حسابك محظور</h2>
          <p className="text-titanium/60 mb-8 leading-relaxed">
            تم تقييد وصولك إلى المتجر حالياً. نعتذر عن أي إزعاج، ولكن هذا القرار تم اتخاذه بناءً على سياسات المتجر.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-right space-y-4">
            <h3 className="font-bold text-carbon text-sm uppercase tracking-wider mb-2">كيف يمكنك حل هذه المشكلة؟</h3>
            <p className="text-xs text-titanium/70">يرجى التواصل مع فريق الإدارة لمراجعة حالة حسابك وتوضيح الأسباب.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <a 
              href="https://wa.me/967776668370" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white h-14 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              <MessageCircle className="w-5 h-5" />
              واتساب الإدارة
            </a>
            <a 
              href="tel:967776668370" 
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-carbon h-14 rounded-2xl font-bold transition-all"
            >
              <PhoneCall className="w-5 h-5" />
              اتصل بنا
            </a>
          </div>

          <button 
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 px-6 py-3 rounded-xl transition-all mx-auto"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
