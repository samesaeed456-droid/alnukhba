import { create } from "zustand";
import { Order } from "../types";
import { db, doc, updateDoc, deleteDoc, serverTimestamp, getDocs, collection, query, orderBy, limit, onSnapshot } from "../lib/firebase";

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
    await updateDoc(doc(db, "orders", id), {
      status,
      updatedAt: serverTimestamp(),
    });
    const updatedOrders = get().orders.map(o => o.id === id ? { ...o, status } : o);
    get().setOrders(updatedOrders);
  },

  deleteOrder: async (id) => {
    await deleteDoc(doc(db, "orders", id));
    get().setOrders(get().orders.filter(o => o.id !== id));
  }
}));
