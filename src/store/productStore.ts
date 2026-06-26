import { create } from "zustand";
import { Product, Category, InventoryLog } from "../types";
import { db, collection, getDocs, query, orderBy, limit, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, writeBatch } from "../lib/firebase";

const STATIC_CATEGORIES: Category[] = [
  { id: "electronics", name: "إلكترونيات", icon: "Cpu", isActive: true },
  { id: "batteries", name: "بطاريات", icon: "BatteryCharging", isActive: true },
  { id: "screens", name: "شاشات", icon: "Monitor", isActive: true },
  { id: "networks", name: "شبكات", icon: "Router", isActive: true },
  { id: "maintenance", name: "صيانة", icon: "Wrench", isActive: true },
  { id: "solar", name: "طاقة شمسية", icon: "Sun", isActive: true },
  { id: "spare_parts", name: "قطع غيار", icon: "Cog", isActive: true },
  { id: "cameras", name: "كاميرات مراقبة", icon: "Cctv", isActive: true },
  { id: "electrical", name: "كهربائيات", icon: "Plug", isActive: true },
];

interface ProductState {
  products: Product[];
  categories: Category[];
  inventoryLogs: InventoryLog[];
  recentlyViewed: Product[];
  isLoading: boolean;
  
  // Actions
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void;
  setInventoryLogs: (logs: InventoryLog[] | ((prev: InventoryLog[]) => InventoryLog[])) => void;
  setRecentlyViewed: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  setIsLoading: (loading: boolean) => void;
  
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  initializeProducts: () => () => void;
  addToRecentlyViewed: (product: Product) => void;
  
  // Mutations (extracted from StoreContext)
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, newStock: number, reason?: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: JSON.parse(localStorage.getItem("store_products") || "[]"),
  categories: JSON.parse(localStorage.getItem("store_categories") || "[]"),
  inventoryLogs: [],
  recentlyViewed: JSON.parse(localStorage.getItem("store_recently_viewed") || "[]"),
  isLoading: false,

  setProducts: (input) => {
    const products = typeof input === 'function' ? (input as any)(get().products) : input;
    localStorage.setItem("store_products", JSON.stringify(products));
    set({ products });
  },
  
  setCategories: (input) => {
    const categories = typeof input === 'function' ? (input as any)(get().categories) : input;
    localStorage.setItem("store_categories", JSON.stringify(categories));
    set({ categories });
  },

  setInventoryLogs: (input) => {
    const inventoryLogs = typeof input === 'function' ? (input as any)(get().inventoryLogs) : input;
    set({ inventoryLogs });
  },

  setRecentlyViewed: (input) => {
    const recentlyViewed = typeof input === 'function' ? (input as any)(get().recentlyViewed) : input;
    localStorage.setItem("store_recently_viewed", JSON.stringify(recentlyViewed));
    set({ recentlyViewed });
  },
  setIsLoading: (isLoading) => set({ isLoading }),

  fetchProducts: async () => {
    // This will be replaced by the more advanced initializeProducts
  },

  initializeProducts: () => {
    const startedLoading = get().products.length === 0;
    if (startedLoading) set({ isLoading: true });

    const activeDb = db; 

    // Set static categories
    get().fetchCategories();

    const q = query(collection(activeDb, "products"), orderBy("createdAt", "desc"), limit(300));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      get().setProducts(data);
      set({ isLoading: false });
    }, (error) => {
      console.error("Firestore Error [productStore:initializeProducts]: ", error);
      set({ isLoading: false });
    });

    return unsub;
  },

  fetchCategories: async () => {
    // Relying on static icons as requested. We set them here.
    get().setCategories(STATIC_CATEGORIES);

    // One-time cleanup of Firestore categories collection if needed
    // This runs once per session to ensure DB stays clean as requested
    const cleanupDone = localStorage.getItem("firestore_categories_cleaned");
    if (!cleanupDone) {
      try {
        const snap = await getDocs(collection(db, "categories"));
        if (snap.size > 0) {
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
        localStorage.setItem("firestore_categories_cleaned", "true");
      } catch (e) {
        // Silently fail if permissions or other issues
      }
    }
  },

  addToRecentlyViewed: (product) => {
    const current = get().recentlyViewed;
    const filtered = current.filter(p => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, 10);
    get().setRecentlyViewed(updated);
  },

  addProduct: async (product) => {
    const tempId = "temp-" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const optimisticObj = {
      ...product,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Product;

    // Immediately update local state & localStorage
    get().setProducts(prev => [optimisticObj, ...prev]);

    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Replace temporary ID with actual db ID
      get().setProducts(prev => prev.map(p => p.id === tempId ? { ...p, id: docRef.id } : p));
    } catch (error) {
      // Rollback on failure
      get().setProducts(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    const original = get().products.find(p => p.id === id);
    if (!original) return;

    // Immediately update local state & localStorage
    get().setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    try {
      await updateDoc(doc(db, "products", id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      // Rollback on failure
      get().setProducts(prev => prev.map(p => p.id === id ? original : p));
      throw error;
    }
  },

  deleteProduct: async (id) => {
    const original = get().products.find(p => p.id === id);
    if (!original) return;

    // Immediately update local state & localStorage
    get().setProducts(prev => prev.filter(p => p.id !== id));

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      // Rollback on failure
      get().setProducts(prev => [...prev, original]);
      throw error;
    }
  },

  updateStock: async (productId, newStock, reason) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const previousStock = product.stockCount || 0;
    const previousInStock = product.inStock;

    // Immediately update local state & localStorage
    get().setProducts(prev => prev.map(p => p.id === productId ? { ...p, stockCount: newStock, inStock: newStock > 0 } : p));

    try {
      await updateDoc(doc(db, "products", productId), {
        stockCount: newStock,
        inStock: newStock > 0,
        updatedAt: serverTimestamp(),
      });

      if (reason) {
        await addDoc(collection(db, "inventory_logs"), {
          productId,
          productName: product.name,
          change: newStock - previousStock,
          previousStock,
          newStock,
          reason,
          date: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Rollback on failure
      get().setProducts(prev => prev.map(p => p.id === productId ? { ...p, stockCount: previousStock, inStock: previousInStock } : p));
      throw error;
    }
  }
}));
