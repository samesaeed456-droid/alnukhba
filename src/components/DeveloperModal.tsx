import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Facebook, MessageCircle, Phone, ExternalLink, Code2, Cpu, Globe, Sparkles } from 'lucide-react';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeveloperModal({ isOpen, onClose }: DeveloperModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-carbon/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[380px] bg-carbon border border-solar/20 rounded-[32px] overflow-hidden z-[101] shadow-gold-lg max-h-[90vh] flex flex-col"
          >
            {/* Premium Header Background */}
            <div className="h-24 shrink-0 relative overflow-hidden bg-carbon">
              <div className="absolute inset-0 bg-gold-gradient opacity-10"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-solar/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-solar/10 rounded-full blur-3xl"></div>
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all hover:scale-105 hover:rotate-90 duration-300 z-20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto custom-scrollbar px-6 sm:px-8 pb-8 -mt-12 relative z-10">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl border-4 border-carbon bg-gold-gradient flex items-center justify-center mb-4 shadow-xl shadow-solar/20 transform rotate-3 hover:rotate-0 transition-transform duration-300 overflow-hidden shrink-0">
                  <img 
                    src="https://19vojde6sh.ucarecd.net/eeff8d50-8d9f-437a-ae22-0dd2f7d7b53f/noroot.jpg" 
                    alt="سامي العريقي"
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2 className="text-lg font-black text-white mb-0.5 tracking-tight flex items-center gap-2">
                  سامي العريقي
                  <Sparkles className="w-3.5 h-3.5 text-solar" />
                </h2>
                <p className="text-solar font-bold text-[10px] uppercase tracking-widest mb-3">
                  Full-Stack Developer
                </p>
                
                <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed mb-5 max-w-[280px] mx-auto">
                  شغوف ببناء تجارب رقمية استثنائية تجمع بين الأداء العالي والتصميم العصري. متخصص في تطوير المتاجر الإلكترونية الفاخرة.
                </p>

                {/* Skills/Tags */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                  {[
                    { icon: Code2, label: 'React' },
                    { icon: Cpu, label: 'Node.js' },
                    { icon: Globe, label: 'UI/UX' }
                  ].map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-solar/10 rounded-lg text-[9px] font-bold text-slate-200 hover:bg-solar/10 hover:border-solar/30 transition-colors cursor-default">
                      <tag.icon className="w-2.5 h-2.5 text-solar" />
                      {tag.label}
                    </div>
                  ))}
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-3 gap-2 w-full mb-5">
                  {[
                    { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/EngSamiAlAriqi', color: 'hover:border-blue-500 hover:text-blue-500' },
                    { icon: MessageCircle, label: 'WhatsApp', href: 'https://wa.me/967776668370', color: 'hover:border-green-500 hover:text-green-500' },
                    { icon: Phone, label: 'Call', href: 'tel:967776668370', color: 'hover:border-solar hover:text-solar' }
                  ].map((social, idx) => (
                    <a 
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 transition-all duration-300 group ${social.color}`}
                    >
                      <social.icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">{social.label}</span>
                    </a>
                  ))}
                </div>

                {/* Portfolio Link */}
                <a 
                  href="#" 
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-solar/10 text-solar border border-solar/20 text-[10px] font-bold hover:bg-solar hover:text-carbon transition-all duration-300 group"
                >
                  <span>عرض معرض الأعمال</span>
                  <ExternalLink className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
