import { create } from "zustand";
import { Product, Category, InventoryLog } from "../types";
import { db, collection, getDocs, query, orderBy, limit, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "../lib/firebase";

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

    const activeDb = db; // Simplified for now, in context it handles adminDb too
    const unsubMeta = onSnapshot(doc(activeDb, "settings", "store_meta"), async (docSnap) => {
      const meta = docSnap.data() || {};
      const serverProductsTs = meta.products_updated_at || 0;
      const serverCategoriesTs = meta.categories_updated_at || 0;

      const localProductsTs = parseInt(localStorage.getItem("store_meta_products_ts") || "0");
      const localCategoriesTs = parseInt(localStorage.getItem("store_meta_categories_ts") || "0");
      const hasLocalProducts = !!localStorage.getItem("store_products");
      const hasLocalCategories = !!localStorage.getItem("store_categories");

      if (serverProductsTs > localProductsTs || !hasLocalProducts) {
        try {
          const q = query(collection(activeDb, "products"), orderBy("createdAt", "desc"), limit(300));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          get().setProducts(data);
          localStorage.setItem("store_meta_products_ts", serverProductsTs.toString());
        } catch (e) {
          console.error("Products fallback:", e);
        }
      }
      
      if (serverCategoriesTs > localCategoriesTs || !hasLocalCategories) {
        try {
          const q = query(collection(activeDb, "categories"), limit(300));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
          get().setCategories(data);
          localStorage.setItem("store_meta_categories_ts", serverCategoriesTs.toString());
        } catch (e) {}
      }
      
      set({ isLoading: false });
    });

    return unsubMeta;
  },

  fetchCategories: async () => {
    try {
      const snap = await getDocs(query(collection(db, "categories"), orderBy("name")));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      get().setCategories(data);
    } catch (e) {}
  },

  addToRecentlyViewed: (product) => {
    const current = get().recentlyViewed;
    const filtered = current.filter(p => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, 10);
    get().setRecentlyViewed(updated);
  },

  addProduct: async (product) => {
    const docRef = await addDoc(collection(db, "products"), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newProduct = { ...product, id: docRef.id } as Product;
    get().setProducts([...get().products, newProduct]);
  },

  updateProduct: async (id, updates) => {
    await updateDoc(doc(db, "products", id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    const updatedProducts = get().products.map(p => p.id === id ? { ...p, ...updates } : p);
    get().setProducts(updatedProducts);
  },

  deleteProduct: async (id) => {
    await deleteDoc(doc(db, "products", id));
    get().setProducts(get().products.filter(p => p.id !== id));
  },

  updateStock: async (productId, newStock, reason) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const previousStock = product.stockCount || 0;
    await updateDoc(doc(db, "products", productId), {
      stockCount: newStock,
      inStock: newStock > 0,
      updatedAt: serverTimestamp(),
    });

    // Handle inventory log if needed (extracted logic simplified)
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

    const updatedProducts = get().products.map(p => 
      p.id === productId ? { ...p, stockCount: newStock, inStock: newStock > 0 } : p
    );
    get().setProducts(updatedProducts);
  }
}));
