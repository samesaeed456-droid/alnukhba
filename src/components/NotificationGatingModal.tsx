import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Gift, Zap, X, ShieldCheck, ArrowRight } from "lucide-react";
import { useStoreState, useStoreUI } from "../context/StoreContext";
import { toast } from "sonner";

export default function NotificationGatingModal() {
  const { user } = useStoreState();
  const { setIsNotificationsOpen } = useStoreUI();
  const [isVisible, setIsVisible] = useState(false);
  const [isPermissionRequested, setIsPermissionRequested] = useState(false);

  useEffect(() => {
    // Check if permission is already granted or denied
    const checkPermission = async () => {
      if (!("Notification" in window)) return;

      if (Notification.permission === "default") {
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
    if (!("Notification" in window)) {
      toast.error("المتصفح لا يدعم الإشعارات");
      return;
    }

    try {
      setIsPermissionRequested(true);
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        toast.success("تم تفعيل الإشعارات بنجاح! شكراً لك.");
        setIsVisible(false);
        // Track this in profile if user is logged in
        if (user) {
          // Logic for token refresh is already in App.tsx/StoreContext
        }
      } else {
        toast.error(
          "لقد رفضت تفعيل الإشعارات. لن تتمكن من الحصول على العروض الحصرية.",
        );
        // Don't close the modal or re-show it very soon
        setTimeout(() => {
          setIsPermissionRequested(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setIsPermissionRequested(false);
    }
  };

  // If already granted, don't show
  if (typeof window !== "undefined" && Notification.permission === "granted")
    return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-carbon/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="w-full max-w-[360px] bg-white rounded-[2rem] overflow-hidden shadow-2xl relative"
          >
            {/* Visual Header - More Compact */}
            <div className="relative h-32 bg-gradient-to-br from-solar to-gold flex items-center justify-center overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                  <Bell className="w-10 h-10 text-carbon" />
                </div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-solar animate-pulse" />
              </motion.div>

              <Gift className="w-20 h-20 text-carbon/10 absolute -bottom-4 -left-4 -rotate-12" />
              <Zap className="w-16 h-16 text-carbon/10 absolute -top-4 -right-4 rotate-12" />
            </div>

            <div className="p-6 text-center">
              <h2 className="text-xl font-black text-carbon mb-2">
                لا تفوّت هداياك! 🎁
              </h2>
              <p className="text-sm text-slate-600 font-bold mb-6 leading-relaxed">
                فعّل الإشعارات الآن لتصلك كوبونات الخصم الحصرية وتنبيهات العروض
                قبل الجميع.
                <span className="block mt-1 text-solar text-xs">
                  احصل على خصم 10% فوري عند التفعيل!
                </span>
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleRequestPermission}
                  disabled={isPermissionRequested}
                  className="w-full bg-solar text-carbon py-3.5 rounded-xl font-black text-base shadow-lg shadow-solar/20 flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPermissionRequested ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-carbon border-t-transparent rounded-full"
                    />
                  ) : (
                    <Zap className="w-4 h-4 fill-current" />
                  )}
                  <span>تفعيل واستلام الهدية</span>
                </button>

                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-[10px] text-red-600 font-bold leading-tight">
                    يرجى تفعيل الإشعارات للمتابعة والحصول على العروض الجديدة.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-wider pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>آمن 100%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
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
