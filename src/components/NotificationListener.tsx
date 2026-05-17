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
          // Awesome small window notification for new product
          toast.custom((t) => (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 flex gap-4 items-center border border-solar/20 relative overflow-hidden pointer-events-auto"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-solar/10 rounded-full blur-3xl -z-10" />
              
              <div className="w-14 h-14 bg-solar/10 rounded-xl flex items-center justify-center shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Package className="w-6 h-6 text-solar" />
                )}
              </div>
              
              <div className="flex-1 text-right">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <span className="text-xs font-bold text-solar uppercase tracking-wider">منتج جديد</span>
                  <Sparkles className="w-4 h-4 text-solar" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-sm font-bold text-solar mt-1">
                  {formatPrice(product.price || 0)}
                </p>
              </div>
            </motion.div>
          ), { duration: 5000, position: 'top-center' });
        }
      });
    }, (error) => {
       console.error("Error listening to products", error);
    });

    return () => unsub();
  }, [formatPrice]);

  // 2. Listen for User Notifications (Wallet Recharge, etc)
  useEffect(() => {
    if (!user?.uid) return;
    
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
    const isRecharge = data.title.includes("شحن") || data.body.includes("رصيد") || data.type === 'wallet';
    
    if (isRecharge) {
      setTimeout(triggerConfetti, 500);
    }

    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-3 pr-4 flex items-center gap-3.5 w-[360px] max-w-[95vw] pointer-events-auto relative group overflow-hidden"
        dir="rtl"
      >
        {/* Subtle accent glow */}
        <div className={`absolute top-0 right-0 w-1.5 h-full ${isRecharge ? 'bg-emerald-500' : 'bg-solar'}`} />
        
        {isRecharge && (
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
        )}
        
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isRecharge ? 'bg-emerald-50' : 'bg-solar/10'}`}>
          <Wallet className={`w-5.5 h-5.5 stroke-[2.5px] ${isRecharge ? 'text-emerald-600' : 'text-solar'}`} />
        </div>
        
        <div className="flex-1 min-w-0 text-right">
          <h4 className="text-[14px] font-black text-gray-900 dark:text-white truncate">
            {data.title}
          </h4>
          <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 truncate mt-0.5" title={data.body}>
            {data.body}
          </p>
        </div>

        <button 
          onClick={() => {
             markNotificationAsRead(id);
             toast.dismiss(t);
          }}
          className={`text-[12px] font-black px-4 py-2 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
            isRecharge 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:brightness-105' 
              : 'text-solar bg-solar/5 hover:bg-solar/10'
          }`}
        >
          {isRecharge ? "رائع!" : "فهمت"}
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
