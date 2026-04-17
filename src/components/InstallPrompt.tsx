import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Check, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function InstallPrompt() {
  const { settings } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already dismissed in this session
    const isDismissed = sessionStorage.getItem('installPromptDismissed');
    if (isDismissed) return;

    // Show after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for iOS or browsers that don't support beforeinstallprompt
      alert('لتثبيت التطبيق على آيفون: اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"');
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative"
        >
          {/* Top Section with Brand Color Gradient */}
          <div 
            className="h-48 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${settings.primaryColor} 0%, #000033 100%)` 
            }}
          >
            {/* Decorative Circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
            
            {/* Logo Container - Rounded square like in screenshot */}
            <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl mb-4 relative z-10 w-24 h-24 flex items-center justify-center">
              {settings.storeLogo ? (
                <img src={settings.storeLogo || undefined} alt={settings.storeName} className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center text-4xl font-black" style={{ color: settings.primaryColor }}>
                  {(settings?.storeName || '?').charAt(0)}
                </div>
              )}
            </div>
            
            <h2 className="text-white text-2xl font-black relative z-10 drop-shadow-md">
              {settings.storeName}
            </h2>
          </div>

          {/* Content Section */}
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Download className="w-5 h-5 text-carbon" />
              <h3 className="text-xl font-black text-carbon">تثبيت التطبيق</h3>
            </div>
            
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              أضف إلى الشاشة الرئيسية للوصول الأسرع وتجربة أفضل
            </p>

            {/* Features */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-600">سريع</span>
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-600">سهل</span>
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-600">مجاني</span>
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleInstall}
                className="w-full py-4 rounded-2xl text-white font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <span>تثبيت الآن</span>
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
