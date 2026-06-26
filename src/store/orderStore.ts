import { create } from "zustand";
import { Order } from "../types";
import { db, doc, updateDoc, deleteDoc, serverTimestamp, getDocs, collection, query, orderBy, limit, onSnapshot, addDoc } from "../lib/firebase";

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  
  // Actions
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
  setIsLoading: (loading: boolean) => void;
  
  fetchOrders: () => (() => void);
  updateOrderStatus: (id: string, status: Order["status"], isRevert?: boolean) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: JSON.parse(localStorage.getItem("store_orders") || "[]"),
  isLoading: false,

  setOrders: (input) => {
    const orders = typeof input === 'function' ? (input as any)(get().orders) : input;
    localStorage.setItem("store_orders", JSON.stringify(orders));
    set({ orders });
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  fetchOrders: () => {
    set({ isLoading: true });
    const q = query(collection(db, "orders"), orderBy("date", "desc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      get().setOrders(data);
      set({ isLoading: false });
    }, (error) => {
      console.error("Firestore Error [orderStore:fetchOrders]: ", error);
      set({ isLoading: false });
    });
    return unsub;
  },

  updateOrderStatus: async (id, status) => {
    const original = get().orders.find(o => o.id === id);
    if (!original) return;

    // Immediately update local state & localStorage
    get().setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

    try {
      await updateDoc(doc(db, "orders", id), {
        status,
        updatedAt: serverTimestamp(),
      });

      if (original.userId) {
        await addDoc(collection(db, `users/${original.userId}/notifications`), {
            title: "تحديث حالة الطلب",
            body: `تم تغيير حالة الطلب إلى ${status === 'processing' ? 'قيد المعالجة' : status === 'shipped' ? 'تم الشحن' : status === 'delivered' ? 'تم التوصيل' : status}`,
            type: 'order',
            createdAt: serverTimestamp(),
            isRead: false
        });
      }
    } catch (error) {
      // Rollback on failure
      get().setOrders(prev => prev.map(o => o.id === id ? original : o));
      throw error;
    }
  },

  deleteOrder: async (id) => {
    const original = get().orders.find(o => o.id === id);
    if (!original) return;

    // Immediately update local state & localStorage
    get().setOrders(prev => prev.filter(o => o.id !== id));

    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (error) {
      // Rollback on failure
      get().setOrders(prev => [...prev, original]);
      throw error;
    }
  }
}));
