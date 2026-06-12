import React, { useEffect, useRef } from "react";
import { onSnapshot, collection, query, orderBy, limit, db } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import { useStore } from "../context/StoreContext";
import { showLuxuryToast, showOrderShippedToast } from "../lib/luxuryToast";
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
          // Luxury Custom Toast for New Product Arrival
          showLuxuryToast("info", {
            title: "وصول جديد!",
            description: product.name,
            image: product.image,
            actionText: "عرض",
            onAction: () => (window.location.href = `/product/${change.doc.id}`),
          });
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
            if (!isInitialLoad) {
              showStandardToast(data, change.doc.id);
            }
          }
        }
      });

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

  // Helper to show professional luxury toast
  const showStandardToast = (data: any, id: string) => {
    // If it's a recharge success, trigger confetti
    const isRecharge = data.type === 'wallet' || data.title.includes("رصيد") || data.body?.includes("رصيد");
    const isOrder = data.type === 'order' || data.title.includes("طلب");
    const isShipping = data.type === 'shipping' || data.title.includes("شحن") || data.body?.includes("شحن");
    
    if (isRecharge) {
      setTimeout(triggerConfetti, 500);
    }

    if (isShipping) {
      showOrderShippedToast(data.title, data.body || data.message, () => markNotificationAsRead(id));
    } else {
      showLuxuryToast(isRecharge ? "success" : "info", {
        title: data.title,
        description: data.body || data.message,
        actionText: isRecharge ? "رائع!" : isOrder ? "متابعة" : "فهمت",
        onAction: () => markNotificationAsRead(id),
      });
    }
  };

  return null;
}
