import React, { useEffect, useRef, useState } from "react";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";
import { showLuxuryToast } from "@/lib/luxuryToast";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/context/StoreContext";

export const AdminNotificationListener: React.FC = () => {
  const navigate = useNavigate();
  const { formatPrice } = useStore();
  const [isReady, setIsReady] = useState(false);
  const initialCounts = useRef({ orders: 0, recharges: 0, tickets: 0 });
  const listenersLoaded = useRef({ orders: false, recharges: false, tickets: false });

  const checkReady = () => {
    if (listenersLoaded.current.orders && 
        listenersLoaded.current.recharges && 
        listenersLoaded.current.tickets) {
      setIsReady(true);
    }
  };

  useEffect(() => {
    // 1. Listen for Pending Orders
    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      if (!listenersLoaded.current.orders) {
        initialCounts.current.orders = snapshot.size;
        listenersLoaded.current.orders = true;
        checkReady();
        return;
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const order = change.doc.data();
          showLuxuryToast("success", {
            title: "طلب جديد وارد! 🛍️",
            description: `العميل: ${order.customerName} - المبلغ: ${formatPrice(order.total)}`,
            actionText: "معاينة",
            onAction: () => navigate(`/admin/orders?id=${change.doc.id}`),
          });
        }
      });
    }, (err) => console.error("AdminNotif Orders Error:", err));

    // 2. Listen for Wallet Recharge Requests
    const rechargeQuery = query(
      collection(db, "recharges"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribeRecharges = onSnapshot(rechargeQuery, (snapshot) => {
      if (!listenersLoaded.current.recharges) {
        initialCounts.current.recharges = snapshot.size;
        listenersLoaded.current.recharges = true;
        checkReady();
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const recharge = change.doc.data();
          showLuxuryToast("info", {
            title: "طلب شحن محفظة 💰",
            description: `بقيمة ${formatPrice(recharge.amount)} - بانتظار الموافقة`,
            actionText: "فحص",
            onAction: () => navigate(`/admin/recharges`),
          });
          console.log("AdminNotificationListener: New recharge detected!");
        }
      });
    }, (err) => console.error("AdminNotif Recharges Error:", err));

    // 3. Listen for Support Tickets
    const ticketsQuery = query(
      collection(db, "support_tickets"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      if (!listenersLoaded.current.tickets) {
        initialCounts.current.tickets = snapshot.size;
        listenersLoaded.current.tickets = true;
        checkReady();
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const ticket = change.doc.data();
          showLuxuryToast("warning", {
            title: "رسالة دعم جديدة 💬",
            description: ticket.subject || "استفسار من عميل",
            actionText: "رد",
            onAction: () => navigate(`/admin/messages`),
          });
        }
      });
    }, (err) => console.error("AdminNotif Tickets Error:", err));

    return () => {
      unsubscribeOrders();
      unsubscribeRecharges();
      unsubscribeTickets();
    };
  }, [navigate, formatPrice]);

  // Show summary only once when all listeners are initialized
  useEffect(() => {
    if (isReady) {
      const { orders, recharges, tickets } = initialCounts.current;
      const total = orders + recharges + tickets;
      
      if (total > 0) {
        // Debounce summary slightly to ensure it shows after initial rapid changes
        const summaryTimer = setTimeout(() => {
          showLuxuryToast("info", {
            title: "ملخص الأعمال المعلقة 📊",
            description: [
              orders > 0 ? `${orders} طلبات` : "",
              recharges > 0 ? `${recharges} شحن` : "",
              tickets > 0 ? `${tickets} تذاكر` : ""
            ].filter(Boolean).join(" | "),
            actionText: "تصفح",
            onAction: () => navigate("/admin"),
          });
        }, 1000);
        return () => clearTimeout(summaryTimer);
      }
    }
  }, [isReady, navigate]);

  return null;
};
