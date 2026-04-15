import React, { lazy, Suspense, useCallback } from 'react';
import { motion } from 'motion/react';
import { FastLink } from '../FastLink';
import { Zap, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ChevronLeft, ShieldCheck, Code } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

import Logo from '../Logo';

const DeveloperModal = lazy(() => import('../DeveloperModal.tsx'));

export default React.memo(function Footer() {
  const { user, canInstallPWA, installPWA, settings } = useStore();
  const [isDevModalOpen, setIsDevModalOpen] = React.useState(false);

  const socialLinks = [
    { icon: Facebook, url: settings.socialMedia?.facebook, color: 'hover:bg-[#1877F2] hover:border-[#1877F2]' },
    { icon: Twitter, url: settings.socialMedia?.twitter, color: 'hover:bg-[#1DA1F2] hover:border-[#1DA1F2]' },
    { icon: Instagram, url: settings.socialMedia?.instagram, color: 'hover:bg-[#E4405F] hover:border-[#E4405F]' },
    { icon: Youtube, url: '#', color: 'hover:bg-[#FF0000] hover:border-[#FF0000]' }
  ].filter(s => s.url && s.url !== '#');

  const handleOpenDevModal = useCallback(() => setIsDevModalOpen(true), []);
  const handleCloseDevModal = useCallback(() => setIsDevModalOpen(false), []);

  return (
    <footer className="relative bg-carbon-pattern text-slate-300 pt-8 pb-24 md:pb-8 mt-auto overflow-hidden border-t border-white/5">
      {/* Premium Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-solar/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-carbon/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-4">
            <FastLink to="/" className="inline-block mb-6 group">
              <Logo variant="orange" className="h-14 sm:h-20" />
            </FastLink>
            <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-sm">
              الوجهة الأولى لتسوق أحدث الأجهزة الإلكترونية الذكية ومنظومات الطاقة الشمسية. نجمع بين التكنولوجيا المتطورة والجودة العالية لنقدم لك تجربة تسوق استثنائية في {settings.storeName}.
            </p>
            
            {/* PWA Install Button */}
            {canInstallPWA && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={installPWA}
                className="flex items-center gap-3 px-6 py-3 bg-white text-carbon rounded-2xl font-black text-sm shadow-xl shadow-solar/20 mb-8 group/pwa"
              >
                <Zap className="w-5 h-5 fill-current group-hover/pwa:animate-pulse" />
                تحميل تطبيق المتجر
              </motion.button>
            )}

            <div className="flex items-center gap-3">
              {socialLinks.length > 0 ? socialLinks.map((social, idx) => (
                <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 ${social.color}`}>
                  <social.icon className="w-4 h-4" />
                </a>
              )) : (
                <p className="text-xs text-slate-500 italic">تابعنا على منصات التواصل</p>
              )}
            </div>
          </div>

          {/* Links Container */}
          <div className="lg:col-span-5 lg:col-start-5 grid grid-cols-2 gap-8">
            {/* Links Col 1 */}
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">تسوق معنا</h4>
              <ul className="space-y-4 text-sm">
                {[
                  { name: 'الرئيسية', path: '/', prefetch: undefined },
                  { name: 'أحدث المنتجات', path: '/search', prefetch: 'Search' },
                  { name: 'عروض حصرية', path: '/deals', prefetch: 'Deals' },
                  { name: 'قائمة المفضلة', path: '/wishlist', prefetch: 'Wishlist' }
                ].map((link, idx) => (
                  <li key={idx} className="group">
                    <FastLink to={link.path} prefetchPage={link.prefetch as any} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                      <ChevronLeft className="w-4 h-4 text-solar opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      <span>{link.name}</span>
                    </FastLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Links Col 2 */}
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">خدمة العملاء</h4>
              <ul className="space-y-4 text-sm">
                {[
                  { name: user ? 'حسابي' : 'تسجيل الدخول', path: user ? '/profile' : '/auth', prefetch: user ? 'Profile' : 'Auth' },
                  { name: 'تتبع طلبك', path: '/track-order', prefetch: 'TrackOrder' },
                  { name: 'الأسئلة الشائعة', path: '/faq', prefetch: 'FAQ' },
                  { name: 'سياسة الاسترجاع', path: '/returns', prefetch: 'Returns' }
                ].map((link, idx) => (
                  <li key={idx} className="group">
                    <FastLink to={link.path} prefetchPage={link.prefetch as any} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                      <ChevronLeft className="w-4 h-4 text-solar opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      <span>{link.name}</span>
                    </FastLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Col */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 text-lg">تواصل معنا</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-carbon transition-colors shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-slate-400 mt-1.5">{settings.address}</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-carbon transition-colors shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-slate-400" dir="ltr">
                  {settings.contactPhone}
                  {settings.contactPhone2 && ` - ${settings.contactPhone2}`}
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-carbon transition-colors shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-slate-400">{settings.contactEmail}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} {settings.storeName}. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-4">
              <FastLink to="/privacy" prefetchPage="Privacy" className="hover:text-white transition-colors">سياسة الخصوصية</FastLink>
              <FastLink to="/terms" prefetchPage="Terms" className="hover:text-white transition-colors">الشروط والأحكام</FastLink>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-8">
            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              {(settings.paymentMethods?.filter(m => m.isActive && m.logo) || []).map((payment, idx) => (
                <motion.div 
                  key={payment.id || idx} 
                  whileHover={{ 
                    y: -8, 
                    scale: 1.15,
                    boxShadow: `0 10px 25px -5px rgba(212, 175, 55, 0.4)`,
                    borderColor: 'rgba(212, 175, 55, 0.4)'
                  }}
                  className="bg-white p-1.5 rounded-xl shadow-lg shadow-black/20 border border-white/10 transition-all duration-300 group/pay overflow-hidden relative"
                >
                  <img 
                    src={payment.logo} 
                    alt={payment.name} 
                    className="h-7 md:h-9 w-auto object-contain filter saturate-[1.6] brightness-110 group-hover/pay:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover/pay:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
            
            {/* Clickable Developer Signature */}
            <div className="flex items-center gap-4">
              <FastLink 
                to="/dev-verify" 
                className="text-[10px] text-slate-600 hover:text-solar transition-colors opacity-0 hover:opacity-100"
              >
                Dev
              </FastLink>
              <motion.button 
                onClick={handleOpenDevModal}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="group flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-solar/10 hover:bg-solar/20 border border-solar/30 rounded-xl md:rounded-2xl transition-all duration-300"
              >
                <span className="text-[9px] md:text-[10px] font-bold text-solar uppercase tracking-widest">Developed By</span>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-[11px] md:text-xs font-black text-white group-hover:text-solar transition-colors">Sami Al-Ariki</span>
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-solar animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                </div>
              </motion.button>
            </div>

            <Suspense fallback={null}>
              <DeveloperModal 
                isOpen={isDevModalOpen} 
                onClose={handleCloseDevModal} 
              />
            </Suspense>
          </div>
        </div>
      </div>
    </footer>
  );
});
