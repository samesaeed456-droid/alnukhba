import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Gift, Zap, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { useStoreState, useStoreUI } from '../context/StoreContext';
import { toast } from 'sonner';

export default function NotificationGatingModal() {
  const { user } = useStoreState();
  const { setIsNotificationsOpen } = useStoreUI();
  const [isVisible, setIsVisible] = useState(false);
  const [isPermissionRequested, setIsPermissionRequested] = useState(false);

  useEffect(() => {
    // Check if permission is already granted or denied
    const checkPermission = async () => {
      if (!('Notification' in window)) return;
      
      if (Notification.permission === 'default') {
        // Show the persistent modal after a short delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    checkPermission();
  }, []);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('المتصفح لا يدعم الإشعارات');
      return;
    }

    try {
      setIsPermissionRequested(true);
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast.success('تم تفعيل الإشعارات بنجاح! شكراً لك.');
        setIsVisible(false);
        // Track this in profile if user is logged in
        if (user) {
          // Logic for token refresh is already in App.tsx/StoreContext
        }
      } else {
        toast.error('لقد رفضت تفعيل الإشعارات. لن تتمكن من الحصول على العروض الحصرية.');
        // Don't close the modal or re-show it very soon
        setTimeout(() => {
          setIsPermissionRequested(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setIsPermissionRequested(false);
    }
  };

  // If already granted, don't show
  if (typeof window !== 'undefined' && Notification.permission === 'granted') return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-carbon/80 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            {/* Visual Header */}
            <div className="relative h-48 bg-gradient-to-br from-solar to-gold p-8 flex items-center justify-center overflow-hidden">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <Gift className="w-24 h-24 text-carbon opacity-20 absolute -top-4 -right-4 rotate-12" />
                <Bell className="w-20 h-20 text-carbon" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping" />
              </motion.div>
              
              {/* Floating particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -100], 
                    x: [0, Math.random() * 40 - 20],
                    opacity: [0, 1, 0] 
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 2 
                  }}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  style={{ 
                    bottom: -10, 
                    left: `${15 + (i * 15)}%` 
                  }}
                />
              ))}
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-black text-carbon mb-3">لا تفوّت هداياك! 🎁</h2>
              <p className="text-slate-600 font-bold mb-8 leading-relaxed">
                قم بتفعيل الإشعارات الآن لتصلك كوبونات الخصم الحصرية وتنبيهات بآخر العروض قبل الجميع.
                <span className="block mt-2 text-solar">احصل على خصم 10% فوري عند التفعيل!</span>
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleRequestPermission}
                  disabled={isPermissionRequested}
                  className="w-full bg-solar text-carbon py-4 rounded-2xl font-black text-lg shadow-xl shadow-solar/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isPermissionRequested ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-carbon border-t-transparent rounded-full"
                    />
                  ) : (
                    <Zap className="w-5 h-5 fill-current" />
                  )}
                  <span>تفعيل واستلام الهدية الفورية</span>
                </button>
                
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-[11px] text-red-600 font-bold">يجب تفعيل الإشعارات للمتابعة في المتجر والحصول على العروض .</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-6 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>آمن 100%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>تحديثات فورية</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
