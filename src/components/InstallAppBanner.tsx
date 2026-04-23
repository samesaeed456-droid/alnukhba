import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, Smartphone, Download, X } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to avoid flash
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const standsAlone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    
    setIsStandalone(standsAlone);

    if (standsAlone) return; // If already installed, do nothing

    // Check if the user is on iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Listen for the Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS manual instructions
      setShowIosInstructions(true);
      return;
    }

    if (deferredPrompt) {
      try {
        // Show the native install prompt
        await deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('جاري تثبيت التطبيق...');
        } else {
          toast.info('تم إلغاء التثبيت');
        }
        // We no longer need the prompt. Clear it up.
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      toast.info('التثبيت غير متاح حالياً. حاول من متصفح آخر مثل Chrome.');
    }
  };

  // Only show the banner if not installed, not dismissed, and we either have a prompt (Android) or it's iOS
  const shouldShowBanner = !isStandalone && !dismissed && (deferredPrompt !== null || isIOS);

  return (
    <>
      <AnimatePresence>
        {shouldShowBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 1 }}
            className="fixed bottom-0 left-0 right-0 z-[8000] p-4 pointer-events-none"
          >
            <div className="max-w-md mx-auto pointer-events-auto bg-carbon/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl shadow-carbon/50 flex flex-col gap-3">
              <button 
                onClick={() => setDismissed(true)}
                className="absolute top-2 left-2 p-1.5 text-white/50 hover:text-white bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-solar/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-solar" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">تطبيق متجر النخبة</h4>
                  <p className="text-white/60 text-xs mt-0.5">ثبت التطبيق لتجربة أسرع وطلب أسهل</p>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full bg-solar text-carbon py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت التطبيق الآن</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIosInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] bg-carbon/80 backdrop-blur flex p-4 items-end sm:items-center justify-center"
            onClick={() => setShowIosInstructions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setShowIosInstructions(false)}
                className="absolute top-4 left-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-carbon"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
                <Share className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-center text-carbon mb-2">لتثبيت التطبيق على آيفون</h3>
              <p className="text-center text-slate-500 text-sm mb-6">
                أبل تمنع التثبيت التلقائي، لكن يمكنك إضافته بثانيتين فقط:
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="font-bold text-sm">1. اضغط على زر المشاركة بالأسفل</span>
                  <Share className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="font-bold text-sm">2. اختر "إضافة للشاشة الرئيسية"</span>
                  <PlusSquare className="w-5 h-5 text-carbon" />
                </div>
              </div>

              <button
                onClick={() => setShowIosInstructions(false)}
                className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold"
              >
                حسناً، فهمت
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
