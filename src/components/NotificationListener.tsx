import React, { useEffect, useRef } from "react";
import { onSnapshot, collection, query, orderBy, limit, db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { useStore } from "../context/StoreContext";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Sparkles, Package, Wallet } from "lucide-react";
import confetti from "canvas-confetti";

export default function NotificationListener() {
  const { user } = useAuthStore();
  const { setNotifications, formatPrice, markNotificationAsRead } = useStore();
  const isFirstLoadProducts = useRef(true);

  // 1. Listen for new products (Awesome Window)
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      // Skip initial load
      if (isFirstLoadProducts.current) {
        isFirstLoadProducts.current = false;
        return;
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const product = change.doc.data();
          // Modern minimal product notification
          toast.custom((t) => (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-3 pr-4 flex gap-4 items-center border border-white/50 dark:border-white/10 w-[380px] max-w-[92vw] pointer-events-auto relative overflow-hidden group"
              dir="rtl"
            >
              <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-solar to-orange-400" />
              
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-inner overflow-hidden border border-slate-200/50 dark:border-white/5">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Package className="w-7 h-7 text-solar" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-black tracking-widest text-solar uppercase bg-solar/10 px-2 py-0.5 rounded-full">وصول جديد</span>
                  <Sparkles className="w-3 h-3 text-solar animate-pulse" />
                </div>
                <h4 className="text-[15px] font-black text-gray-900 dark:text-white line-clamp-1">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[13px] font-black text-solar">
                    {formatPrice(product.price || 0)}
                  </p>
                  {product.oldPrice && (
                    <span className="text-[11px] text-gray-400 line-through font-bold">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => {
                  window.location.href = `/product/${change.doc.id}`;
                  toast.dismiss(t);
                }}
                className="bg-solar text-black text-[12px] font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-solar/20 active:scale-95 transition-all hover:brightness-105"
              >
                عرض
              </button>
            </motion.div>
          ), { duration: 6000, position: 'top-center' });
        }
      });
    }, (error) => {
       console.error("Error listening to products", error);
    });

    return () => unsub();
  }, [formatPrice]);

  // 2. Listen for User Notifications (Wallet Recharge, etc)
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }
    
    let isInitialLoad = true;

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const newNotifs: any[] = [];
      let latestUnreadRef: any = null;

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const notif = {
          id: change.doc.id,
          title: data.title,
          message: data.body,
          date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          isRead: data.isRead,
          type: data.type === 'wallet' ? 'system' : (data.type || 'system'),
        };
        
        if (change.type === "added") {
          newNotifs.push(notif);
          
          if (!data.isRead) {
            if (isInitialLoad) {
              if (!latestUnreadRef || new Date(notif.date) > new Date(latestUnreadRef.date)) {
                latestUnreadRef = { notif, data, docId: change.doc.id };
              }
            } else {
              showStandardToast(data, change.doc.id);
            }
          }
        }
      });
      
      if (isInitialLoad && latestUnreadRef) {
        showStandardToast(latestUnreadRef.data, latestUnreadRef.docId);
      }

      if (newNotifs.length > 0) {
        setNotifications((prev) => {
          const merged = [...newNotifs, ...prev];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      }

      isInitialLoad = false;
    }, (error) => {
        console.error("Error listening to user notifications", error);
    });

    return () => unsub();
  }, [user?.uid, setNotifications]);

  // Helper to trigger confetti
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#F7941E', '#FFB74D', '#FFF176']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#F7941E', '#FFB74D', '#FFF176']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // Helper to show professional horizontal top banner (App Store style)
  const showStandardToast = (data: any, id: string) => {
    // If it's a recharge success, trigger confetti
    const isRecharge = data.title.includes("شحن") || data.body?.includes("رصيد") || data.type === 'wallet';
    const isOrder = data.type === 'order' || data.title.includes("طلب");
    
    if (isRecharge) {
      setTimeout(triggerConfetti, 500);
    }

    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -60, scale: 0.8, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(5px)' }}
        transition={{ type: 'spring', damping: 18, stiffness: 120 }}
        className="bg-white/85 dark:bg-gray-950/85 backdrop-blur-2xl border border-white/40 dark:border-white/5 rounded-[2rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.3)] p-3.5 flex items-center gap-4 w-[400px] max-w-[94vw] pointer-events-auto relative group overflow-hidden"
        dir="rtl"
      >
        {/* Dynamic Accent Bar */}
        <div className={`absolute top-0 right-0 w-2 h-full opacity-80 ${
          isRecharge ? 'bg-emerald-500' : isOrder ? 'bg-blue-500' : 'bg-solar'
        }`} />
        
        {/* Animated Background Element */}
        <div className={`absolute -left-10 -bottom-10 w-32 h-32 blur-3xl opacity-20 rounded-full transition-colors ${
          isRecharge ? 'bg-emerald-500' : isOrder ? 'bg-blue-500' : 'bg-solar'
        }`} />
        
        {/* Icon Container */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative z-10 ${
          isRecharge ? 'bg-emerald-50' : isOrder ? 'bg-blue-50' : 'bg-solar/10'
        }`}>
          {isRecharge ? (
            <Wallet className="w-7 h-7 text-emerald-600 stroke-[2.5px]" />
          ) : isOrder ? (
            <Package className="w-7 h-7 text-blue-600 stroke-[2.5px]" />
          ) : (
            <Sparkles className="w-7 h-7 text-solar stroke-[2.5px]" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 text-right space-y-0.5 relative z-10">
          <h4 className="text-[15px] font-black text-gray-950 dark:text-white leading-tight tracking-tight">
            {data.title}
          </h4>
          <p className="text-[12.5px] font-bold text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug" title={data.body || data.message}>
            {data.body || data.message}
          </p>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => {
             markNotificationAsRead(id);
             toast.dismiss(t);
          }}
          className={`h-11 px-5 rounded-2xl text-[13px] font-black transition-all flex items-center justify-center whitespace-nowrap active:scale-90 relative z-10 ${
            isRecharge 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
              : isOrder 
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-solar text-black shadow-lg shadow-solar/30'
          }`}
        >
          {isRecharge ? "رائع!" : isOrder ? "متابعة" : "فهمت"}
        </button>
      </motion.div>
    ), { 
      duration: isRecharge ? 15000 : 10000, 
      id: `std-${id}`,
      position: 'top-center'
    });
  };

  return null;
}
