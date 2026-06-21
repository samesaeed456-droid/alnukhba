import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { toast as sonnerToast } from "sonner";
import {
  Product,
  CartItem,
  UserProfile,
  Order,
  NotificationSubscription,
  AppNotification,
  Coupon,
  NotificationSettings,
  Category,
  StoreSettings,
  InventoryLog,
  UserNote,
  Transaction,
  Banner,
  MarketingNotification,
  AdminUser,
  AdminRole,
  AdminPermission,
  SupportTicket,
  StaticPage,
  ShippingZone,
  CityData,
  SearchTerm,
  Visit,
  RechargeRequest,
} from "../types";
import { products as initialProducts } from "../data";
import {
  getAIRecommendations,
  getRuleBasedRecommendations,
} from "../services/recommendationService";
import { roundMoney, formatMoney, BASE_CURRENCY_CODE } from "../lib/finance";

import { notificationService } from "../services/notificationService";

import {
  deleteImagesFromCloudinary,
} from "../lib/cloudinary";
import {
  auth,
  adminAuth,
  db,
  adminDb,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  onAuthStateChanged,
  serverTimestamp,
  increment,
  OperationType,
  handleFirestoreError,
  getDocFromServer,
  writeBatch,
  runTransaction,
  createAdminUserClientSide,
} from "../lib/firebase";

interface StoreContextType {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  cart: CartItem[];
  wishlist: Product[];
  orders: Order[];
  user: UserProfile | null;
  notifications: AppNotification[];
  notificationSettings: NotificationSettings;
  subscriptions: NotificationSubscription[];
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
  getRecommendations: (currentProduct?: Product) => Promise<Product[]>;
  getRuleBasedRecommendations: (currentProduct?: Product) => Product[];
  formatPrice: (price: number) => string;
  addToCart: (
    product: Product,
    quantity?: number,
    color?: string,
    size?: string,
  ) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  placeOrder: (
    paymentMethod: string,
    shippingMethod?: "delivery" | "pickup",
    paymentReference?: string,
    customerName?: string,
    customerPhone?: string,
    shippingAddress?: string,
    city?: string,
    deliveryInstructions?: string,
    paymentProof?: string,
    district?: string,
    paymentAmount?: string,
  ) => Promise<string>;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"],
    isRevert?: boolean,
  ) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  updateUser: (user: UserProfile) => void;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  customers: UserProfile[];
  addCustomer: (customer: UserProfile) => void;
  deleteCustomer: (phone: string) => void;
  updateCustomerBalance: (
    phone: string,
    amount: number,
    description: string,
  ) => void;
  addCustomerNote: (phone: string, note: string) => void;
  updateStock: (productId: string, newStock: number, reason?: string) => void;
  bulkUpdateStock: (
    updates: { productId: string; newStock: number }[],
    reason?: string,
  ) => void;
  inventoryLogs: InventoryLog[];
  discount: {
    code: string | null;
    amount: number;
    type: "percentage" | "fixed";
    pointsUsed?: number;
  };
  applyDiscountCode: (code: string) => boolean;
  removeDiscount: () => void;
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, "id" | "usedCount">) => void;
  updateCoupon: (
    id: string,
    coupon: Partial<Coupon>,
    showToastMsg?: boolean,
  ) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponStatus: (id: string) => void;
  subscribeToProduct: (
    productId: string,
    type: "back_in_stock" | "on_sale",
    email: string,
  ) => void;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  banners: Banner[];
  addBanner: (banner: Omit<Banner, "id">) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  marketingNotifications: MarketingNotification[];
  sendMarketingNotification: (
    notification: Omit<
      MarketingNotification,
      "id" | "date" | "sentCount" | "openedCount" | "clickedCount" | "status"
    >,
  ) => void;
  adminUsers: AdminUser[];
  adminUser: UserProfile | null;
  addAdminUser: (admin: Omit<AdminUser, "id">) => void;
  updateAdminUser: (
    id: string,
    admin: Partial<AdminUser>,
    logDetails?: string,
  ) => void;
  deleteAdminUser: (id: string) => void;
  adminLogout: () => void;
  logActivity: (action: string, details: string) => void;
  supportTickets: SupportTicket[];
  addTicket: (
    ticket: Omit<SupportTicket, "id" | "createdAt" | "replies" | "status">,
  ) => void;
  updateTicketStatus: (id: string, status: SupportTicket["status"]) => void;
  replyToTicket: (id: string, message: string) => void;
  deleteTicket: (id: string) => void;
  staticPages: StaticPage[];
  updateStaticPage: (id: string, content: string) => void;
  shippingZones: ShippingZone[];
  addShippingZone: (zone: Omit<ShippingZone, "id" | "isActive">) => void;
  updateShippingZone: (id: string, zone: Partial<ShippingZone>) => void;
  deleteShippingZone: (id: string) => void;
  toggleShippingZoneStatus: (id: string) => void;
  cities: CityData[];
  addCity: (city: Omit<CityData, "id">) => void;
  updateCity: (id: string, city: Partial<CityData>) => void;
  deleteCity: (id: string) => void;
  searchTerms: SearchTerm[];
  trackSearch: (term: string, resultsCount: number) => void;
  visits: Visit[];
  trackVisit: (page: string) => void;
  bulkUpdatePrices: (category: string, percentage: number) => void;
  toast: { show: boolean; message: string };
  showToast: (
    message: string,
    type?: "success" | "error" | "info",
    options?: {
      image?: string;
      action?: { label: string; onClick: () => void };
    },
  ) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (isOpen: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (isOpen: boolean) => void;
  isMobileSearchOpen: boolean;
  setIsMobileSearchOpen: (isOpen: boolean) => void;
  isSearchInputFocused: boolean;
  setIsSearchInputFocused: (isFocused: boolean) => void;
  canInstallPWA: boolean;
  installPWA: () => void;
}

interface StoreState {
  products: Product[];
  cart: CartItem[];
  wishlist: Product[];
  orders: Order[];
  user: UserProfile | null;
  notifications: AppNotification[];
  notificationSettings: NotificationSettings;
  subscriptions: NotificationSubscription[];
  recentlyViewed: Product[];
  language: "ar" | "en";
  settings: StoreSettings;
  categories: Category[];
  inventoryLogs: InventoryLog[];
  customers: UserProfile[];
  banners: Banner[];
  marketingNotifications: MarketingNotification[];
  adminUsers: AdminUser[];
  adminUser: UserProfile | null;
  discount: {
    code: string | null;
    amount: number;
    type: "percentage" | "fixed";
    pointsUsed?: number;
  };
  coupons: Coupon[];
  supportTickets: SupportTicket[];
  staticPages: StaticPage[];
  shippingZones: ShippingZone[];
  cities: CityData[];
  searchTerms: SearchTerm[];
  visits: Visit[];
  recharges: RechargeRequest[];
  systemError: string | null;
  isLoading: boolean;
  isAuthReady: boolean;
}

interface StoreActions {
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addToRecentlyViewed: (product: Product) => void;
  getRecommendations: (currentProduct?: Product) => Promise<Product[]>;
  getRuleBasedRecommendations: (currentProduct?: Product) => Product[];
  setLanguage: (lang: "ar" | "en") => void;
  updateStock: (productId: string, newStock: number, reason?: string) => void;
  bulkUpdateStock: (
    updates: { productId: string; newStock: number }[],
    reason?: string,
  ) => void;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  addBanner: (banner: Omit<Banner, "id">) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  sendMarketingNotification: (
    notification: Omit<
      MarketingNotification,
      "id" | "date" | "sentCount" | "openedCount" | "clickedCount" | "status"
    >,
  ) => void;
  addAdminUser: (admin: Omit<AdminUser, "id">) => void;
  updateAdminUser: (
    id: string,
    admin: Partial<AdminUser>,
    logDetails?: string,
  ) => void;
  deleteAdminUser: (id: string) => void;
  logActivity: (action: string, details: string) => void;
  addTicket: (
    ticket: Omit<SupportTicket, "id" | "createdAt" | "replies" | "status">,
  ) => void;
  updateTicketStatus: (id: string, status: SupportTicket["status"]) => void;
  replyToTicket: (id: string, message: string) => void;
  deleteTicket: (id: string) => void;
  updateStaticPage: (id: string, content: string) => void;
  addShippingZone: (zone: Omit<ShippingZone, "id" | "isActive">) => void;
  updateShippingZone: (id: string, zone: Partial<ShippingZone>) => void;
  deleteShippingZone: (id: string) => void;
  toggleShippingZoneStatus: (id: string) => void;
  addCity: (city: Omit<CityData, "id">) => void;
  updateCity: (id: string, city: Partial<CityData>) => void;
  deleteCity: (id: string) => void;
  trackSearch: (term: string, resultsCount: number) => void;
  trackVisit: (page: string) => void;
  bulkUpdatePrices: (category: string, percentage: number) => void;
  addToCart: (
    product: Product,
    quantity?: number,
    color?: string,
    size?: string,
  ) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  placeOrder: (
    paymentMethod: string,
    shippingMethod?: "delivery" | "pickup",
    paymentReference?: string,
    customerName?: string,
    customerPhone?: string,
    shippingAddress?: string,
    city?: string,
    deliveryInstructions?: string,
    paymentProof?: string,
    district?: string,
    paymentAmount?: string,
  ) => Promise<string>;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"],
  ) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  updateUser: (user: UserProfile) => void;
  forceSetUser: (user: UserProfile | null) => void;
  logout: () => void;
  adminLogout: () => void;
  updateCustomer: (phone: string, updates: Partial<UserProfile>) => void;
  blockCustomer: (phone: string) => void;
  addCustomer: (customer: UserProfile) => void;
  deleteCustomer: (phone: string) => void;
  updateCustomerBalance: (
    phone: string,
    amount: number,
    description: string,
  ) => void;
  addCustomerNote: (phone: string, note: string) => void;
  applyDiscountCode: (code: string) => boolean;
  removeDiscount: () => void;
  addCoupon: (coupon: Omit<Coupon, "id" | "usedCount">) => void;
  updateCoupon: (
    id: string,
    coupon: Partial<Coupon>,
    showToastMsg?: boolean,
  ) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponStatus: (id: string) => void;
  subscribeToProduct: (
    productId: string,
    type: "back_in_stock" | "on_sale",
    email: string,
  ) => void;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  trackOrderById: (orderId: string) => Promise<Order | null>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  formatPrice: (price: number) => string;
  syncOnDemand: (colName: string) => void;
}

interface StoreUI {
  toast: { show: boolean; message: string };
  showToast: (
    message: string,
    type?: "success" | "error" | "info",
    options?: {
      image?: string;
      action?: { label: string; onClick: () => void };
    },
  ) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isPlacingOrder: boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (isOpen: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (isOpen: boolean) => void;
  isMobileSearchOpen: boolean;
  setIsMobileSearchOpen: (isOpen: boolean) => void;
  isSearchInputFocused: boolean;
  setIsSearchInputFocused: (isFocused: boolean) => void;
  canInstallPWA: boolean;
  installPWA: () => void;
}

const StoreStateContext = createContext<StoreState | undefined>(undefined);
const StoreActionsContext = createContext<StoreActions | undefined>(undefined);
const StoreUIContext = createContext<StoreUI | undefined>(undefined);

import { useAuthStore } from "../store/authStore";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import { useOrderStore } from "../store/orderStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUIStore } from "../store/uiStore";

import { migrateLocalDataToFirebase } from "../lib/migrateData";
import { getAdminDummyEmail } from "../lib/adminAuth";
import { refreshNotificationToken } from "../lib/notifications";

export function StoreProvider({ children }: { children: ReactNode }) {
  const { 
    user, adminUser, isAuthReady, isLoading: isAuthLoading, logout: authLogout, adminLogout: authAdminLogout, 
    setUser, setAdminUser, setIsAuthReady, setIsLoading: setIsAuthLoading, initialize: initializeAuth 
  } = useAuthStore();
  const { 
    products, setProducts, categories, setCategories, inventoryLogs, setInventoryLogs,
    recentlyViewed, setRecentlyViewed, addToRecentlyViewed: addToRecentlyViewedStore
  } = useProductStore();
  const { 
    cart, setCart, wishlist, setWishlist, discount, setDiscount 
  } = useCartStore();
  const { 
    orders, setOrders 
  } = useOrderStore();
  const { 
    settings, setSettings, language, setLanguage 
  } = useSettingsStore();
  const {
    showToast, isCartOpen, setIsCartOpen, isWishlistOpen, setIsWishlistOpen,
    isNotificationsOpen, setIsNotificationsOpen, isMobileSearchOpen, setIsMobileSearchOpen,
    isSearchInputFocused, setIsSearchInputFocused, canInstallPWA, installPWA, isPlacingOrder, setIsPlacingOrder
  } = useUIStore();

  const [isLoading, setIsLoading] = useState(() => {
    const hasProducts = !!localStorage.getItem("store_products");
    const hasSettings = !!localStorage.getItem("store_settings");
    const hasUser = !!localStorage.getItem("store_user");
    return !(hasProducts && hasSettings); // Only show loader if we don't even have layout data
  });
  const [systemError, setSystemError] = useState<string | null>(null);
  const lastAdminDataFetch = React.useRef(0);

  useEffect(() => {
    return initializeAuth();
  }, [initializeAuth]);

  // Connection check removed per user request
  useEffect(() => {
    // Intentionally empty
  }, []);
  useEffect(() => {
    if (!isAuthReady || !user || user.role !== "admin") return;

    const hasMigrated = localStorage.getItem("has_migrated_to_firebase");
    if (!hasMigrated) {
      migrateLocalDataToFirebase().then((success) => {
        if (success) {
          localStorage.setItem("has_migrated_to_firebase", "true");
        }
      });
    }
  }, [isAuthReady, user]);

  // Super Admin Rescue & Admin Sync Logic removed (moved to authStore)

  // Sync Products from Firestore removed (moved to productStore)
  const { initializeProducts } = useProductStore();
  useEffect(() => {
    return initializeProducts();
  }, [initializeProducts]);

  // Sync Orders from Firestore with Real-time Support
  // Orders are now synced on demand via syncOnDemand method
  
  // Admin data is now synced on demand via syncOnDemand method
  
  const { initializeSettings } = useSettingsStore();
  useEffect(() => {
    return initializeSettings();
  }, [initializeSettings]);

  // SearchTerms and visits logic

  const [subscriptions, setSubscriptions] = useState<
    NotificationSubscription[]
  >(() => {
    const saved = localStorage.getItem("store_subscriptions");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("store_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(() => {
      const saved = localStorage.getItem("store_notification_settings");
      return saved
        ? JSON.parse(saved)
        : { sale: true, stock: true, order: true, promotions: true };
    });

  // notifications

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem("store_coupons");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const q = collection(db, "coupons");
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Coupon[];
      setCoupons(data);
      localStorage.setItem("store_coupons", JSON.stringify(data));
    });
    return () => unsub();
  }, []);

  // settings

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem("store_tickets");
    return saved ? JSON.parse(saved) : [];
  });

  const [staticPages, setStaticPages] = useState<StaticPage[]>(() => {
    const saved = localStorage.getItem("store_pages");
    return saved ? JSON.parse(saved) : [];
  });

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>(() => {
    const saved = localStorage.getItem("store_shipping_zones");
    return saved ? JSON.parse(saved) : [];
  });

  const [cities, setCities] = useState<CityData[]>(() => {
    const saved = localStorage.getItem("store_cities");
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>(() => {
    const saved = localStorage.getItem("store_search_terms");
    return saved ? JSON.parse(saved) : [];
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem("store_banners");
    return saved ? JSON.parse(saved) : [];
  });

  const [marketingNotifications, setMarketingNotifications] = useState<
    MarketingNotification[]
  >(() => {
    const saved = localStorage.getItem("store_marketing_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [visits, setVisits] = useState<Visit[]>(() => {
    const saved = localStorage.getItem("store_visits");
    if (saved) return JSON.parse(saved);

    return [];
  });

  const [recharges, setRecharges] = useState<RechargeRequest[]>(() => {
    const saved = localStorage.getItem("store_recharges");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const getPermissionsByRole = (role: AdminRole): AdminPermission[] => {
    switch (role) {
      case "super_admin":
        return [
          "view_dashboard",
          "manage_orders",
          "manage_products",
          "manage_customers",
          "manage_marketing",
          "manage_coupons",
          "manage_settings",
          "manage_security",
          "view_logs",
          "manage_logistics",
          "manage_messages",
        ];
      case "manager":
        return [
          "view_dashboard",
          "manage_orders",
          "manage_products",
          "manage_customers",
          "manage_marketing",
          "manage_coupons",
          "manage_logistics",
          "manage_messages",
        ];
      case "editor":
        return [
          "view_dashboard",
          "manage_products",
          "manage_marketing",
          "manage_coupons",
          "manage_messages",
        ];
      case "support":
        return [
          "view_dashboard",
          "manage_orders",
          "manage_customers",
          "manage_messages",
        ];
      default:
        return ["view_dashboard"];
    }
  };

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem("store_admin_users");
    if (saved) return JSON.parse(saved);
    return [];
  });

  // categories

  const [customers, setCustomers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("store_customers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // inventory

  const [toast, setToast] = useState({ show: false, message: "" });

  const unsubscribeMap = useRef<Map<string, () => void>>(new Map());

  const syncOnDemand = useCallback(
    (colName: string) => {
      // Prevents multiple listeners for the same collection
      if (unsubscribeMap.current.has(colName)) return;
      // Temporarily mark as syncing to prevent race conditions before onSnapshot returns
      unsubscribeMap.current.set(colName, () => {});

      const activeDb = adminAuth.currentUser ? adminDb : db;

      const setterMap: Record<string, any> = {
        coupons: setCoupons,
        static_pages: setStaticPages,
        shipping_zones: setShippingZones,
        banners: setBanners,
        admin_users: setAdminUsers,
        customers: setCustomers,
        marketing_notifications: setMarketingNotifications,
        orders: setOrders,
        visits: setVisits,
        searchTerms: setSearchTerms,
        cities: setCities,
        inventory_logs: setInventoryLogs,
        recharges: setRecharges,
        support_tickets: setSupportTickets,
      };

      const storageKeyMap: Record<string, string> = {
        coupons: "store_coupons",
        static_pages: "store_pages",
        shipping_zones: "store_shipping_zones",
        banners: "store_banners",
        admin_users: "store_admin_users",
        customers: "store_customers",
        marketing_notifications: "store_marketing_notifications",
        orders: "store_orders",
        visits: "store_visits",
        searchTerms: "store_search_terms",
        cities: "store_cities",
        inventory_logs: "store_inventory_logs",
        recharges: "store_recharges",
        support_tickets: "store_tickets",
      };

      if (!setterMap[colName]) {
        unsubscribeMap.current.delete(colName);
        return;
      }

      let collectionPath = colName;
      if (colName === "customers" || colName === "admin_users") {
        collectionPath = "users";
      }
      let q = query(collection(activeDb, collectionPath));
      if (colName === "orders") {
        const activeAdmin =
          adminUser?.role === "admin" || adminUser?.isAdmin
            ? adminUser
            : user?.role === "admin"
              ? user
              : null;
        if (activeAdmin) {
          q = query(collection(activeDb, "orders"), orderBy("date", "desc"), limit(100));
        } else {
          q = query(
            collection(activeDb, "orders"),
            where("userId", "==", auth.currentUser?.uid || "guest"),
            orderBy("date", "desc"),
            limit(50)
          );
        }
      } else if (colName === "inventory_logs") {
        q = query(collection(activeDb, "inventory_logs"), orderBy("date", "desc"), limit(100));
      } else if (colName === "visits") {
        q = query(collection(activeDb, "visits"), orderBy("timestamp", "desc"), limit(100));
      } else if (colName === "searchTerms") {
        q = query(collection(activeDb, "searchTerms"), orderBy("timestamp", "desc"), limit(100));
      } else if (colName === "support_tickets") {
        q = query(collection(activeDb, "support_tickets"), orderBy("createdAt", "desc"), limit(100));
      } else if (colName === "recharges") {
        q = query(collection(activeDb, "recharges"), orderBy("createdAt", "desc"), limit(100));
      }

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          let data = snapshot.docs.map((doc) => ({
            id: (doc.data() as any).id || doc.id,
            orderDocId: doc.id,
            ...doc.data(),
          }));

          if (colName === "admin_users") {
            data = data.filter((u: any) => {
              const isAdminRole = u.adminRole !== undefined && u.adminRole !== null && String(u.adminRole).trim() !== "" && String(u.adminRole) !== "null" && String(u.adminRole) !== "undefined";
              return (
                u.role === "admin" || 
                u.isAdmin === true || 
                isAdminRole ||
                ["super_admin", "admin", "manager", "editor", "support"].includes(u.role)
              );
            });
          } else if (colName === "customers") {
            data = data.filter((u: any) => {
              const isAdminRole = u.adminRole !== undefined && u.adminRole !== null && String(u.adminRole).trim() !== "" && String(u.adminRole) !== "null" && String(u.adminRole) !== "undefined";
              return (
                u.role !== "admin" && 
                u.isAdmin !== true && 
                !isAdminRole &&
                !["super_admin", "admin", "manager", "editor", "support"].includes(u.role)
              );
            });
          }

          setterMap[colName](data);
          localStorage.setItem(storageKeyMap[colName], JSON.stringify(data));
        },
        async (error) => {
          const { auth } = await import("../lib/firebase");
          const errInfo = {
            error: error instanceof Error ? error.message : String(error),
            operationType: "list",
            path: collectionPath,
            authInfo: {
              userId: auth.currentUser?.uid,
              email: auth.currentUser?.email,
              emailVerified: auth.currentUser?.emailVerified,
              isAnonymous: auth.currentUser?.isAnonymous,
            }
          };
          console.error(`Firestore Error [syncOnDemand:${colName}]: `, JSON.stringify(errInfo));
          unsubscribeMap.current.delete(colName);
        },
      );
      
      unsubscribeMap.current.set(colName, unsub);
    },
    [adminAuth.currentUser, adminUser?.uid, user?.uid, adminUser?.role, user?.role],
  );

  // Clear active syncs when identity changes to ensure listeners use correct permissions/queries
  useEffect(() => {
    unsubscribeMap.current.forEach((unsub) => unsub());
    unsubscribeMap.current.clear();
  }, [adminAuth.currentUser?.uid, user?.uid, adminUser?.role, user?.role]);

  const { setDeferredPrompt, setCanInstallPWA } = useUIStore();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, [setDeferredPrompt, setCanInstallPWA]);

  // Persist state to localStorage individually to improve performance
  useEffect(() => {
    localStorage.setItem("store_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (!user) {
      localStorage.setItem("store_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, user]);
  useEffect(() => {
    localStorage.setItem("store_subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions]);
  useEffect(() => {
    localStorage.setItem("store_notifications", JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem(
      "store_notification_settings",
      JSON.stringify(notificationSettings),
    );
  }, [notificationSettings]);
  useEffect(() => {
    localStorage.setItem(
      "store_recently_viewed",
      JSON.stringify(recentlyViewed),
    );
  }, [recentlyViewed]);
  useEffect(() => {
    localStorage.setItem("store_language", language);
  }, [language]);
  useEffect(() => {
    localStorage.setItem("store_recharges", JSON.stringify(recharges));
  }, [recharges]);
  useEffect(() => {
    localStorage.setItem(
      "store_marketing_notifications",
      JSON.stringify(marketingNotifications),
    );
  }, [marketingNotifications]);

  // Auto-sync admin collections when logged in
  useEffect(() => {
    if (adminUser || user?.role === "admin") {
      const adminCols = ["orders", "recharges", "support_tickets", "admin_users", "visits"];
      adminCols.forEach(col => syncOnDemand(col));
    }
  }, [adminUser, user, syncOnDemand]);

  // Sync basic data on mount
  useEffect(() => {
    syncOnDemand("products");
    syncOnDemand("categories");
    syncOnDemand("banners");
    syncOnDemand("settings");
    syncOnDemand("shipping_zones");
    syncOnDemand("cities");
  }, [syncOnDemand]);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Remove simulated notification check interval as it's confusing and fake
  /*
  useEffect(() => {
    ...
  }, [subscriptions, products]);
  */

  const formatPrice = React.useCallback(
    (price: number) => {
      return formatMoney(price, language === "ar" ? "ar-u-nu-latn" : "en-US");
    },
    [language],
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => {
          const price = Number(item.product.price) || 0;
          const quantity = Number(item.quantity) || 0;
          return roundMoney(sum + price * quantity);
        },
        0,
      ),
    [cart],
  );

  const discountAmount = useMemo(() => {
    if (!discount.code) return 0;
    if (discount.type === "percentage") {
      return roundMoney(subtotal * (discount.amount / 100));
    }
    return roundMoney(Math.min(discount.amount, subtotal));
  }, [discount, subtotal]);

  const total = useMemo(
    () => roundMoney(Math.max(0, subtotal - discountAmount)),
    [subtotal, discountAmount],
  );

  const logActivity = React.useCallback(
    (action: string, details: string) => {
      // Activity logging disabled
    },
    [],
  );

  const updateSettings = React.useCallback(
    async (newSettings: Partial<StoreSettings>) => {
      try {
        const updated = { ...settings, ...newSettings };
        const activeDb = adminAuth.currentUser ? adminDb : db;

        const removedImages: string[] = [];

        // Cleanup old logo
        if (
          newSettings.storeLogo &&
          settings.storeLogo &&
          newSettings.storeLogo !== settings.storeLogo
        ) {
          removedImages.push(settings.storeLogo);
        }

        // Cleanup favicon
        if (
          newSettings.seo?.favicon &&
          settings.seo?.favicon &&
          newSettings.seo.favicon !== settings.seo.favicon
        ) {
          removedImages.push(settings.seo.favicon);
        }

        // Cleanup ogImage
        if (
          newSettings.seo?.ogImage &&
          settings.seo?.ogImage &&
          newSettings.seo.ogImage !== settings.seo.ogImage
        ) {
          removedImages.push(settings.seo.ogImage);
        }

        // Cleanup payment method logos
        if (newSettings.paymentMethods && settings.paymentMethods) {
          settings.paymentMethods.forEach((oldMethod) => {
            const newMethod = newSettings.paymentMethods?.find(
              (m) => m.id === oldMethod.id,
            );
            if (
              oldMethod.logo &&
              newMethod &&
              newMethod.logo &&
              oldMethod.logo !== newMethod.logo
            ) {
              removedImages.push(oldMethod.logo);
            }
          });
        }

        if (removedImages.length > 0) {
          deleteImagesFromCloudinary(removedImages);
        }

        await setDoc(
          doc(activeDb, "settings", "store"),
          {
            ...updated,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        if (
          newSettings.language &&
          newSettings.language !== settings.language
        ) {
          setLanguage(newSettings.language as "ar" | "en");
        }

        setSettings(updated);
        showToast("تم تحديث إعدادات المتجر بنجاح", "success");
        logActivity("تحديث الإعدادات", "قام المدير بتحديث إعدادات المتجر");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, "settings/store");
        throw error;
      }
    },
    [settings, showToast, logActivity],
  );

  const addTicket = React.useCallback(
    async (
      ticket: Omit<SupportTicket, "id" | "createdAt" | "replies" | "status">,
    ) => {
      try {
        const newTicketRef = doc(collection(db, "support_tickets"));
        const newTicket: SupportTicket = {
          ...ticket,
          id: newTicketRef.id,
          createdAt: new Date().toISOString(),
          status: "open",
          replies: [],
        };
        await setDoc(newTicketRef, {
          ...newTicket,
          createdAt: serverTimestamp(),
        });
        showToast("تم إرسال رسالتك بنجاح، سنتواصل معك قريباً", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "support_tickets");
      }
    },
    [showToast],
  );

  const updateTicketStatus = React.useCallback(
    async (id: string, status: SupportTicket["status"]) => {
      try {
        await updateDoc(doc(db, "support_tickets", id), {
          status,
          updatedAt: serverTimestamp(),
        });
        logActivity("تحديث تذكرة", `تم تغيير حالة التذكرة ${id} إلى ${status}`);
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `support_tickets/${id}`,
        );
      }
    },
    [logActivity],
  );

  const replyToTicket = React.useCallback(
    async (id: string, message: string) => {
      try {
        const reply = {
          id: Math.random().toString(36).substr(2, 9),
          sender: "admin" as const,
          message,
          timestamp: new Date().toISOString(),
        };
        const ticketRef = doc(db, "support_tickets", id);
        const ticketSnap = await getDoc(ticketRef);
        if (ticketSnap.exists()) {
          const ticketData = ticketSnap.data() as SupportTicket;
          await updateDoc(ticketRef, {
            replies: [...(ticketData.replies || []), reply],
            updatedAt: serverTimestamp(),
          });
          logActivity("رد على تذكرة", `تم الرد على التذكرة ${id}`);
        }
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `support_tickets/${id}`,
        );
      }
    },
    [logActivity],
  );

  const deleteTicket = React.useCallback(
    async (id: string) => {
      try {
        const ticketRef = doc(db, "support_tickets", id);
        const ticketSnap = await getDoc(ticketRef);
        
        if (ticketSnap.exists()) {
          const ticketData = ticketSnap.data();
          if (ticketData.attachments && Array.isArray(ticketData.attachments) && ticketData.attachments.length > 0) {
            deleteImagesFromCloudinary(ticketData.attachments);
          }
        }

        await deleteDoc(ticketRef);
        logActivity("حذف تذكرة", `تم حذف التذكرة ${id}`);
        showToast("تم حذف الرسالة بنجاح");
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `support_tickets/${id}`,
        );
      }
    },
    [logActivity, showToast],
  );

  const updateStaticPage = React.useCallback(
    async (id: string, content: string) => {
      try {
        await setDoc(
          doc(db, "static_pages", id),
          {
            content,
            lastUpdated: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        logActivity("تحديث صفحة", `تم تحديث محتوى الصفحة ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `static_pages/${id}`);
      }
    },
    [logActivity],
  );

  const addCity = React.useCallback(
    async (city: Omit<CityData, "id">) => {
      const activeDb = adminAuth.currentUser ? adminDb : db;
      try {
        const docRef = await addDoc(collection(activeDb, "cities"), {
          ...city,
          createdAt: serverTimestamp(),
        });
        showToast("تمت إضافة المدينة بنجاح");
        logActivity("إضافة مدينة", `تمت إضافة المدينة: ${city.name}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "cities");
      }
    },
    [showToast, logActivity],
  );

  const updateCity = React.useCallback(
    async (id: string, updatedData: Partial<CityData>) => {
      const activeDb = adminAuth.currentUser ? adminDb : db;
      try {
        await updateDoc(doc(activeDb, "cities", id), {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
        showToast("تم تحديث المدينة بنجاح");
        logActivity("تحديث مدينة", `تم تحديث المدينة ID: ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `cities/${id}`);
      }
    },
    [showToast, logActivity],
  );

  const deleteCity = React.useCallback(
    async (id: string) => {
      if (!window.confirm("هل أنت متأكد من حذف هذه المدينة؟")) return;
      const activeDb = adminAuth.currentUser ? adminDb : db;
      try {
        await deleteDoc(doc(activeDb, "cities", id));
        showToast("تم حذف المدينة بنجاح");
        logActivity("حذف مدينة", `تم حذف المدينة ID: ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `cities/${id}`);
      }
    },
    [showToast, logActivity],
  );

  const addShippingZone = React.useCallback(
    async (zone: Omit<ShippingZone, "id" | "isActive">) => {
      try {
        const newZoneRef = doc(collection(db, "shipping_zones"));
        await setDoc(newZoneRef, {
          ...zone,
          id: newZoneRef.id,
          isActive: true,
          createdAt: serverTimestamp(),
        });
        logActivity("إضافة منطقة شحن", `تم إضافة المنطقة ${zone.name}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "shipping_zones");
      }
    },
    [logActivity],
  );

  const updateShippingZone = React.useCallback(
    async (id: string, zone: Partial<ShippingZone>) => {
      try {
        await updateDoc(doc(db, "shipping_zones", id), {
          ...zone,
          updatedAt: serverTimestamp(),
        });
        logActivity("تحديث منطقة شحن", `تم تحديث المنطقة ${id}`);
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `shipping_zones/${id}`,
        );
      }
    },
    [logActivity],
  );

  const deleteShippingZone = React.useCallback(
    async (id: string) => {
      try {
        await deleteDoc(doc(db, "shipping_zones", id));
        logActivity("حذف منطقة شحن", `تم حذف المنطقة ${id}`);
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `shipping_zones/${id}`,
        );
      }
    },
    [logActivity],
  );

  const toggleShippingZoneStatus = React.useCallback(
    async (id: string) => {
      try {
        const zoneRef = doc(db, "shipping_zones", id);
        const zoneSnap = await getDoc(zoneRef);
        if (zoneSnap.exists()) {
          const zoneData = zoneSnap.data() as ShippingZone;
          await updateDoc(zoneRef, {
            isActive: !zoneData.isActive,
            updatedAt: serverTimestamp(),
          });
          logActivity("تغيير حالة منطقة شحن", `تم تغيير حالة المنطقة ${id}`);
        }
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `shipping_zones/${id}`,
        );
      }
    },
    [logActivity],
  );

  const trackSearch = React.useCallback(
    async (term: string, resultsCount: number) => {
      try {
        if (!term || term.trim() === "") return;

        const safeId = term
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_")
          .substring(0, 50);
        if (!safeId) return;

        const docRef = doc(db, "searchTerms", safeId);
        await setDoc(
          docRef,
          {
            term: term.trim(),
            count: increment(1),
            resultsCount,
            lastSearched: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Failed to track search:", error);
      }
    },
    [],
  );

  const trackVisit = React.useCallback(async (page: string) => {
    try {
      // Throttle visits to maximum once per 5 minutes per user session to save Firebase costs
      const lastVisitTime = sessionStorage.getItem("last_visit_tracked_time");
      const now = Date.now();
      if (lastVisitTime && now - parseInt(lastVisitTime) < 300000) {
        return; // Skip writing to limit database usage
      }

      const sessionId =
        sessionStorage.getItem("store_session_id") ||
        Math.random().toString(36).substring(2, 11);
      if (!sessionStorage.getItem("store_session_id")) {
        sessionStorage.setItem("store_session_id", sessionId);
      }
      sessionStorage.setItem("last_visit_tracked_time", now.toString());

      const isUnique = !localStorage.getItem("store_visited_before");
      if (isUnique) {
        localStorage.setItem("store_visited_before", "true");
      }

      // Optimize Analytics: use aggregated document with increment counters instead of individual documents to massively reduce writes
      const today = new Date().toISOString().split("T")[0];
      const statsRef = doc(db, "statistics", `daily_${today}`);

      const updateData: any = {
        totalVisits: increment(1),
        lastUpdated: serverTimestamp(),
      };

      if (isUnique) {
        updateData.uniqueVisitors = increment(1);
      }

      // We use setDoc with merge: true to create or update the daily document efficiently
      await setDoc(statsRef, updateData, { merge: true });

      // ADDED: Log individual visit for real-time tracking (Live Visitors)
      const visitRef = doc(collection(db, "visits"));
      await setDoc(visitRef, {
        sessionId,
        page,
        timestamp: new Date().toISOString(),
        device: window.innerWidth < 768 ? "mobile" : "desktop",
        isUnique,
      });
    } catch (error) {
      console.error("Failed to track visit:", error);
    }
  }, []);

  const bulkUpdatePrices = React.useCallback(
    async (category: string, percentage: number) => {
      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        const batch = writeBatch(activeDb);
        let count = 0;

        products.forEach((p) => {
          if (category === "الكل" || p.category === category) {
            const newPrice = Math.round(p.price * (1 + percentage / 100));
            const updates: any = {
              price: newPrice,
              originalPrice: p.price,
              updatedAt: serverTimestamp(),
            };

            if (p.sizePrices) {
              const newSizePrices: Record<string, number> = {};
              const newSizeOriginalPrices: Record<string, number> = {};
              Object.entries(p.sizePrices).forEach(([size, price]) => {
                newSizePrices[size] = Math.round(price * (1 + percentage / 100));
                newSizeOriginalPrices[size] = price;
              });
              updates.sizePrices = newSizePrices;
              updates.sizeOriginalPrices = newSizeOriginalPrices;
            }

            const pRef = doc(activeDb, "products", p.id);
            batch.update(pRef, updates);
            count++;
          }
        });

        if (count > 0) {
          await batch.commit();
          logActivity(
            "تحديث أسعار جماعي",
            `تم تغيير أسعار ${count} منتج في قسم ${category} بنسبة ${percentage}%`,
          );
          showToast("تم تحديث الأسعار بنجاح", "success");
        } else {
          showToast("لا توجد منتجات لتحديثها في هذا القسم", "info");
        }
      } catch (error) {
        console.error("Bulk price update failed:", error);
        showToast("فشل تحديث الأسعار جماعياً", "error");
      }
    },
    [products, logActivity, showToast],
  );

  const addBanner = React.useCallback(
    async (banner: Omit<Banner, "id">) => {
      const tempId = doc(collection(db, "banners")).id;
      const optimisticBanner = { ...banner, id: tempId } as Banner;
      setBanners((prev) => [optimisticBanner, ...prev]);

      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await setDoc(doc(activeDb, "banners", tempId), {
          ...banner,
          id: tempId,
          createdAt: serverTimestamp(),
        });
        showToast("تم إضافة البنر بنجاح");
        logActivity("إضافة بنر", `تم إضافة بنر جديد: ${banner.title}`);
      } catch (error) {
        setBanners((prev) => prev.filter((b) => b.id !== tempId));
        handleFirestoreError(error, OperationType.CREATE, "banners");
      }
    },
    [showToast, logActivity],
  );

  const updateBanner = React.useCallback(
    async (id: string, updatedData: Partial<Banner>) => {
      const oldBanner = banners.find((b) => b.id === id);
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updatedData } : b)),
      );

      try {
        if (
          updatedData.image &&
          oldBanner &&
          oldBanner.image !== updatedData.image
        ) {
          deleteImagesFromCloudinary([oldBanner.image]);
        }

        if (
          updatedData.images &&
          oldBanner &&
          JSON.stringify(oldBanner.images) !== JSON.stringify(updatedData.images)
        ) {
          const removedImages = (oldBanner.images || []).filter(
            (img) => !updatedData.images?.includes(img),
          );
          if (removedImages.length > 0) {
            deleteImagesFromCloudinary(removedImages);
          }
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        await updateDoc(doc(activeDb, "banners", id), {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
        showToast("تم تحديث البانر بنجاح");
        logActivity("تحديث بنر", `تم تحديث بيانات البانر ID: ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `banners/${id}`);
      }
    },
    [showToast, logActivity, banners],
  );

  const deleteBanner = React.useCallback(
    async (id: string) => {
      const bannerToDelete = banners.find((b) => b.id === id);
      setBanners((prev) => prev.filter((b) => b.id !== id));

      try {
        if (bannerToDelete) {
          const imagesToDelete = [
            bannerToDelete.image,
            ...(bannerToDelete.images || []),
          ].filter(Boolean) as string[];

          if (imagesToDelete.length > 0) {
            deleteImagesFromCloudinary(imagesToDelete);
          }
        }
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await deleteDoc(doc(activeDb, "banners", id));
        showToast("تم حذف البانر");
        logActivity("حذف بنر", `تم حذف البانر ID: ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `banners/${id}`);
      }
    },
    [showToast, logActivity, banners],
  );

  const sendMarketingNotification = React.useCallback(
    async (
      notification: Omit<
        MarketingNotification,
        "id" | "date" | "sentCount" | "openedCount" | "clickedCount" | "status"
      >,
    ) => {
      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        const newNotifRef = doc(
          collection(activeDb, "marketing_notifications"),
        );
        const newNotification: MarketingNotification = {
          ...notification,
          id: newNotifRef.id,
          date: new Date().toISOString(),
          sentCount: customers.length,
          openedCount: 0,
          clickedCount: 0,
          status: notification.scheduledFor ? "scheduled" : "sent",
        };

        await setDoc(newNotifRef, {
          ...newNotification,
          createdAt: serverTimestamp(),
        });

        showToast("تم إرسال الإشعار بنجاح");
        logActivity(
          "إرسال إشعار تسويقي",
          `تم إرسال إشعار: ${notification.title}`,
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.CREATE,
          "marketing_notifications",
        );
      }
    },
    [customers, showToast, logActivity, setNotifications],
  );

  const addAdminUser = React.useCallback(
    async (admin: Omit<AdminUser, "id">) => {
      try {
        const trimmedIdentifier = (admin.email || "").trim();
        const cleanIdentifier = trimmedIdentifier.replace(/[\s\-()]/g, "");
        const isPhone = /^\+?\d+$/.test(cleanIdentifier) && cleanIdentifier.length >= 7;
        let finalEmail = trimmedIdentifier;

        if (isPhone) {
          const countryCode = cleanIdentifier.startsWith("+") ? "" : (admin.countryCode || "+967");
          finalEmail = getAdminDummyEmail(cleanIdentifier, countryCode);
        } else {
          // Basic email validation for non-phone identifiers
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedIdentifier)) {
            showToast("يرجى إدخال بريد إلكتروني صحيح أو رقم جوال", "error");
            return;
          }
        }

        let finalAdmin = { ...admin, email: finalEmail };
        const activeDb = adminAuth.currentUser ? adminDb : db;
        let createdUid = doc(collection(activeDb, "users")).id;

        // Create user in Auth if password provided
        if (finalAdmin.password && finalAdmin.email) {
          try {
            const newUser = await createAdminUserClientSide(
              finalAdmin.email,
              finalAdmin.password,
            );
            createdUid = newUser.uid;
          } catch (pwError: any) {
            console.error("Auth user creation failed:", pwError);
            let errorMsg = "فشل إنشاء حساب الدخول";
            if (pwError.code === "auth/invalid-email")
              errorMsg = "رقم الجوال غير صالح";
            if (pwError.code === "auth/email-already-in-use")
              errorMsg = "هذا الرقم مسجل مسبقاً";
            if (pwError.code === "auth/weak-password")
              errorMsg = "كلمة المرور ضعيفة جداً";

            showToast(`${errorMsg}: ${pwError.message || ""}`, "error");
            return;
          }
        }

        const newUserRef = doc(activeDb, "users", createdUid);
        await setDoc(newUserRef, {
          uid: createdUid,
          email: finalAdmin.email,
          displayName: finalAdmin.name,
          name: finalAdmin.name,
          phone: finalAdmin.phone || "",
          countryCode: finalAdmin.countryCode || "+967",
          role: "admin",
          adminRole: finalAdmin.role,
          isAdmin: true,
          isActive: finalAdmin.isActive ?? true,
          permissions: finalAdmin.permissions || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        showToast("تم إضافة المشرف بنجاح");
        logActivity(
          "إضافة مشرف",
          `تم إضافة مشرف جديد: ${finalAdmin.name} (${finalAdmin.email})`,
        );
      } catch (error: any) {
        console.error("AddAdminUser Error:", error);
        showToast(`فشل الإضافة: ${error.message || "خطأ غير معروف"}`, "error");
        handleFirestoreError(error, OperationType.CREATE, "users");
      }
    },
    [showToast, logActivity],
  );

  const updateAdminUser = React.useCallback(
    async (
      id: string,
      updatedData: Partial<AdminUser>,
      logDetails?: string,
    ) => {
      try {
        let finalData = { ...updatedData };
        const activeDb = adminAuth.currentUser ? adminDb : db;

        // Handle password synchronization if changed
        if (finalData.password && finalData.email) {
          try {
            const syncRes = await fetch("/api/admin/update-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: finalData.email,
                newPassword: finalData.password,
              }),
            });
            const syncData = await syncRes.json();
            if (!syncData.success) {
              console.error("Failed to sync password to Auth:", syncData.error);
              showToast(
                `لم يتم تحديث كلمة المرور: ${syncData.error}. (تأكد من إعداد Firebase Admin)`,
                "error",
              );
            } else {
              showToast("تم تحديث كلمة المرور بنجاح");
            }
          } catch (pwError: any) {
            console.error("Password sync attempt failed:", pwError);
            showToast("حدث خطأ في الاتصال لتحديث كلمة المرور", "error");
          }
        }

        const updates: any = {
          updatedAt: serverTimestamp(),
        };

        Object.keys(finalData).forEach((key) => {
          if ((finalData as any)[key] !== undefined && key !== "password") {
            updates[key] = (finalData as any)[key];
          }
        });

        if (finalData.name) {
          updates.displayName = finalData.name;
          updates.name = finalData.name;
        }
        if (finalData.role) {
          updates.adminRole = finalData.role;
          updates.role = "admin";
          updates.isAdmin = true;
        }

        await updateDoc(doc(activeDb, "users", id), updates);

        showToast("تم تحديث بيانات المشرف");
        logActivity(
          "تحديث مشرف",
          logDetails || `تم تحديث بيانات المشرف ID: ${id}`,
        );
      } catch (error: any) {
        console.error("UpdateAdminUser Error:", error);
        showToast(`فشل التحديث: ${error.message || "خطأ غير معروف"}`, "error");
        handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
      }
    },
    [showToast, logActivity],
  );

  const deleteAdminUser = React.useCallback(
    async (id: string) => {
      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await deleteDoc(doc(activeDb, "users", id));
        showToast("تم حذف المشرف");
        logActivity("حذف مشرف", `تم حذف المشرف ID: ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
      }
    },
    [showToast, logActivity],
  );

  const addToCart = React.useCallback(
    (product: Product, quantity: number = 1, color?: string, size?: string) => {
      const maxQuantity =
        product.stockCount !== undefined ? product.stockCount : 99;

      // Validate quantity
      if (quantity <= 0) return;
      if (quantity > maxQuantity) {
        showToast(`عذراً، الحد الأقصى للكمية هو ${maxQuantity}`, "error");
        return;
      }

      // Check stock
      if (product.inStock === false || maxQuantity === 0) {
        showToast("عذراً، هذا المنتج غير متوفر حالياً", "error");
        return;
      }

      setCart((prev) => {
        const cartItemId = `${product.id}-${color || "default"}-${size || "default"}`;
        const existing = prev.find((item) => item.id === cartItemId);

        // Determine correct price for this variant
        const priceToUse = (size && product.sizePrices && product.sizePrices[size]) 
          ? product.sizePrices[size] 
          : product.price;
        
        const cartProduct = { ...product, price: priceToUse };

        if (existing) {
          const newQuantity = Math.min(
            maxQuantity,
            existing.quantity + quantity,
          );
          return prev.map((item) =>
            item.id === cartItemId ? { ...item, product: cartProduct, quantity: newQuantity } : item,
          );
        }
        return [
          ...prev,
          {
            id: cartItemId,
            product: cartProduct,
            quantity,
            selectedColor: color,
            selectedSize: size,
          },
        ];
      });
      showToast(`تمت الإضافة للسلة بنجاح`, "success", {
        image: product.image,
        action: {
          label: "عرض",
          onClick: () => setIsCartOpen(true),
        },
      });
    },
    [showToast],
  );

  const updateCartQuantity = React.useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const maxQuantity =
              item.product.stockCount !== undefined
                ? item.product.stockCount
                : 99;
            const newQ = Math.min(
              maxQuantity,
              Math.max(0, item.quantity + delta),
            );
            return { ...item, quantity: newQ };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeFromCart = React.useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
  }, []);

  const updateCoupon = React.useCallback(
    async (id: string, updatedData: Partial<Coupon>, showToastMsg = true) => {
      const previousCoupons = [...coupons];

      // Optimistic Update
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)),
      );

      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await updateDoc(doc(activeDb, "coupons", id), updatedData);
        if (showToastMsg) {
          showToast("تم تحديث الكوبون بنجاح");
        }
        logActivity("تحديث كوبون", `تم تحديث الكوبون ID: ${id}`);
      } catch (error) {
        // Rollback
        setCoupons(previousCoupons);
        handleFirestoreError(error, OperationType.UPDATE, "coupons");
      }
    },
    [coupons, showToast, logActivity],
  );

  const updateCustomerBalance = React.useCallback(
    async (identifier: string, amount: number, description: string) => {
      // 1. Optimistic Update - Update local state immediately for "blink of an eye" performance
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.uid === identifier || c.phone === identifier) {
            const transaction: Transaction = {
              id: "temp-" + Date.now(),
              amount: Math.abs(amount),
              type: amount >= 0 ? "deposit" : "withdrawal",
              date: new Date().toISOString(),
              status: "completed",
              description,
            };
            return {
              ...c,
              walletBalance: (c.walletBalance || 0) + amount,
              transactions: [transaction, ...(c.transactions || [])],
            };
          }
          return c;
        }),
      );

      try {
        if (!identifier) {
          showToast("معرف العميل غير صالح", "error");
          return;
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        let docRef = null;
        let userData = null;

        // Try by UID first from local state cache first to avoid extra getDoc
        const localUser = customers.find(
          (c) => c.uid === identifier || c.phone === identifier,
        );

        if (localUser && localUser.uid) {
          docRef = doc(activeDb, "users", localUser.uid);
          userData = localUser;
        } else {
          const uidRef = doc(activeDb, "users", identifier);
          const uidSnap = await getDoc(uidRef);
          if (uidSnap.exists()) {
            docRef = uidRef;
            userData = uidSnap.data() as UserProfile;
          } else {
            const q = query(
              collection(activeDb, "users"),
              where("phone", "==", identifier),
            );
            const snapshot = await getDocs(q);
            if (
              snapshot &&
              !snapshot.empty &&
              snapshot.docs &&
              snapshot.docs.length > 0
            ) {
              docRef = snapshot.docs[0].ref;
              userData = snapshot.docs[0].data() as UserProfile;
            }
          }
        }

        if (!docRef || !userData) {
          // Rollback optimistic update if user not found by reloading from storage
          const saved = localStorage.getItem("app_users");
          if (saved) setCustomers(JSON.parse(saved));
          showToast("العميل غير موجود", "error");
          return;
        }

        const newBalance = (userData.walletBalance || 0) + amount;

        const transaction: Transaction = {
          id: crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15),
          amount: Math.abs(amount),
          type: amount >= 0 ? "deposit" : "withdrawal",
          date: new Date().toISOString(),
          status: "completed",
          description,
        };

        // Perform the actual update
        await updateDoc(docRef, {
          walletBalance: newBalance,
          transactions: [transaction, ...(userData.transactions || [])],
          updatedAt: serverTimestamp(),
        } as any);

        // Add in-app notification for the user
        const notificationRef = doc(collection(activeDb, `users/${userData.uid}/notifications`));
        const isDeposit = amount >= 0;
        const notifTitle = isDeposit ? "تغيير في الرصيد: إيداع 💰" : "تغيير في الرصيد: خصم 💸";
        const notifBody = isDeposit 
          ? `قامت الإدارة بإضافة مبلغ ${formatPrice(Math.abs(amount))} إلى محفظتك. رصيدك الحالي هو ${formatPrice(newBalance)}. سبب العملية: ${description}`
          : `تم خصم مبلغ ${formatPrice(Math.abs(amount))} من محفظتك. رصيدك الحالي هو ${formatPrice(newBalance)}. سبب العملية: ${description}`;

        await setDoc(notificationRef, {
          title: notifTitle,
          message: notifBody,
          type: "system",
          isRead: false,
          date: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });

        // Try to send real push if possible (background API)
        try {
          fetch("/api/admin/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: notifTitle,
              message: notifBody,
              target: "specific_user",
              targetUserId: userData.uid,
              url: "/profile",
              type: "system"
            })
          }).catch(e => console.warn("Background notification failed:", e));
        } catch (e) {}

        logActivity(
          "تحديث رصيد",
          `تم ${amount >= 0 ? "إضافة" : "خصم"} ${Math.abs(amount)} لرصيد العميل: ${identifier} - ${description}`,
        );
        showToast(
          amount >= 0 ? "تم إضافة الرصيد بنجاح" : "تم خصم الرصيد بنجاح",
        );
      } catch (error) {
        // Rollback optimistic update on error by reloading from storage
        const saved = localStorage.getItem("app_users");
        if (saved) setCustomers(JSON.parse(saved));
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `users (balance): ${identifier}`,
        );
      }
    },
    [showToast, logActivity, customers],
  );

  const addCustomerNote = React.useCallback(
    async (identifier: string, text: string) => {
      try {
        if (!identifier) {
          showToast("معرف العميل غير صالح", "error");
          return;
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        let docRef = null;
        let userData = null;

        // Try by UID first
        const uidRef = doc(activeDb, "users", identifier);
        const uidSnap = await getDoc(uidRef);

        if (uidSnap.exists()) {
          docRef = uidRef;
          userData = uidSnap.data() as UserProfile;
        } else {
          // Fallback to phone search
          const q = query(
            collection(activeDb, "users"),
            where("phone", "==", identifier),
          );
          const snapshot = await getDocs(q);
          if (
            snapshot &&
            !snapshot.empty &&
            snapshot.docs &&
            snapshot.docs.length > 0
          ) {
            docRef = snapshot.docs[0].ref;
            userData = snapshot.docs[0].data() as UserProfile;
          }
        }

        if (!docRef || !userData) {
          showToast("العميل غير موجود", "error");
          return;
        }

        const note: UserNote = {
          id: crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15),
          text,
          date: new Date().toISOString(),
          author: "مدير النظام",
        };

        await updateDoc(docRef, {
          notes: [note, ...(userData.notes || [])],
          updatedAt: serverTimestamp(),
        });

        showToast("تمت إضافة الملاحظة بنجاح");
        logActivity(
          "إضافة ملاحظة",
          `تمت إضافة ملاحظة لملف العميل: ${identifier}`,
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `users (notes): ${identifier}`,
        );
      }
    },
    [showToast, logActivity],
  );

  const placeOrder = React.useCallback(
    async (
      paymentMethod: string,
      shippingMethod: "delivery" | "pickup" = "delivery",
      paymentReference?: string,
      customerName?: string,
      customerPhone?: string,
      shippingAddress?: string,
      city?: string,
      deliveryInstructions?: string,
      paymentProof?: string,
      district?: string,
      paymentAmount?: string,
    ) => {
      if (cart.length === 0) return "";
      if (isPlacingOrder) return "";

      setIsPlacingOrder(true);

      try {
        // 1. All logic inside a single transaction
        const orderId = await runTransaction(db, async (transaction) => {
          // A. Setup references for all required reads
          const counterRef = doc(db, "settings", "counters");
          const prodRefs = cart.map((item) =>
            doc(db, "products", String(item.product.id)),
          );

          let couponRefToUpdate = null;
          let couponData = null;
          if (discount.code) {
            const coupon = coupons.find(
              (c) => c.code.toUpperCase() === discount.code?.toUpperCase(),
            );
            if (coupon) couponRefToUpdate = doc(db, "coupons", coupon.id);
          }

          let userRef = null;
          if (auth.currentUser) {
            userRef = doc(db, "users", auth.currentUser.uid);
          }

          // B. Execute ALL reads simultaneously
          const [counterSnap, couponSnap, userSnap, ...prodSnaps] =
            await Promise.all([
              transaction.get(counterRef),
              couponRefToUpdate
                ? transaction.get(couponRefToUpdate)
                : Promise.resolve(null),
              userRef ? transaction.get(userRef) : Promise.resolve(null),
              ...prodRefs.map((ref) => transaction.get(ref)),
            ]);

          let nextSeq = 1;
          if (counterSnap.exists()) {
            nextSeq = (counterSnap.data().orderCounter || 0) + 1;
          }

          // C. Gather Product Data and Validate Stock
          const validatedItems = [];
          const productUpdates: { ref: any; newStock: number }[] = [];

          for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            const prodRef = prodRefs[i];
            const prodSnap = prodSnaps[i];

            if (!prodSnap.exists())
              throw new Error(`المنتج ${item.product.name} غير موجود`);

            const sourceProduct = prodSnap.data();
            if (
              sourceProduct.stockCount !== undefined &&
              sourceProduct.stockCount < item.quantity
            ) {
              throw new Error(
                `عذراً، المنتج ${sourceProduct.name} نفذ من المخزون أو الكمية غير كافية`,
              );
            }

            const effectivePrice = (item.selectedSize && sourceProduct.sizePrices && sourceProduct.sizePrices[item.selectedSize])
              ? sourceProduct.sizePrices[item.selectedSize]
              : sourceProduct.price;

            validatedItems.push({
              ...item,
              price: effectivePrice,
              product: {
                ...item.product,
                name: sourceProduct.name || item.product.name,
                price: effectivePrice,
                image:
                  sourceProduct.image ||
                  (sourceProduct.images && sourceProduct.images[0]) ||
                  item.product.image,
                brand: sourceProduct.brand || item.product.brand,
              },
            });

            productUpdates.push({
              ref: prodRef,
              newStock: (sourceProduct.stockCount || 0) - item.quantity,
            });
          }

          // D. Calculate Totals
          const subtotal = roundMoney(
            validatedItems.reduce(
              (sum, item) => sum + item.product.price * item.quantity,
              0,
            ),
          );

          let shipping = 0;
          if (subtotal > 0 && shippingMethod === "delivery") {
            const cityData = city ? cities.find((c) => c.name === city) : null;
            const zone = city
              ? shippingZones.find((z) => z.cities.includes(city))
              : null;
            
            if (cityData?.shippingRate !== undefined) {
              shipping = cityData.shippingRate;
            } else if (zone) {
              shipping =
                zone.freeThreshold && subtotal >= zone.freeThreshold
                  ? 0
                  : zone.rate;
            } else {
              shipping =
                settings.freeShippingThreshold &&
                subtotal >= settings.freeShippingThreshold
                  ? 0
                  : settings.shippingFee;
            }
          }

          let discountAmount = 0;
          let newUsedCount = 0;

          if (couponSnap && couponSnap.exists()) {
            const cData = couponSnap.data();
            if (
              cData.isActive &&
              (!cData.usageLimit || cData.usedCount < cData.usageLimit)
            ) {
              if (discount.type === "percentage") {
                discountAmount = roundMoney(subtotal * (discount.amount / 100));
              } else {
                discountAmount = roundMoney(
                  Math.min(discount.amount, subtotal),
                );
              }
              newUsedCount = (cData.usedCount || 0) + 1;
            } else {
              couponRefToUpdate = null; // Don't update if invalid
            }
          }

          const { calculateOrderTotals } = await import("../utils/orderCalculations");
          const total = calculateOrderTotals(subtotal, shipping, discountAmount);

          // E. Validate Wallet Balance
          let newUserBalance = 0;
          if (userRef) {
            if (!userSnap || !userSnap.exists())
              throw new Error("بيانات المستخدم غير موجودة");

            const userBal = (userSnap.data() as any).walletBalance || 0;
            if (userBal < total) throw new Error("رصيد المحفظة غير كافٍ");

            newUserBalance = userBal - total;
          }

          // E. Generate Order ID


          // G. PERFORM ALL WRITES
          // Helper to remove undefined for Firestore
          const cleanData = (obj: any) => {
            const newObj: any = {};
            Object.keys(obj).forEach((key) => {
              if (obj[key] !== undefined) newObj[key] = obj[key];
            });
            return newObj;
          };

          const orderRef = doc(collection(db, "orders"));
          const printableId = orderRef.id;


          // 1. Create Order
          const newOrderData = cleanData({
            id: printableId,
            userId: auth.currentUser?.uid || "guest",
            customerName:
              customerName ||
              user?.displayName ||
              user?.name ||
              auth.currentUser?.displayName ||
              "عميل المتجر",
            customerPhone: customerPhone || user?.phone || "",
            customerImage:
              user?.photoURL ||
              user?.avatar ||
              auth.currentUser?.photoURL ||
              null,
            shippingAddress: shippingAddress || user?.address || "",
            city: city || null,
            district: district || null,
            date: now.toISOString(),
            createdAt: serverTimestamp(),
            items: validatedItems.map((item) => ({
              productId: item.product.id || "",
              name: item.product.name || "",
              price: item.product.price || 0,
              image: item.product.image || item.product.images?.[0] || null,
              quantity: item.quantity || 1,
              selectedColor: item.selectedColor || null,
              selectedSize: item.selectedSize || null,
            })),
            subtotal,
            shippingFee: shipping,
            discountAmount,
            couponCode: discount.code || null,
            total,
            status:
              paymentMethod === "المحفظة الرقمية" ? "processing" : "pending",
            paymentMethod,
            paymentReference: paymentReference || null,
            paymentProof: paymentProof || null,
            paymentAmount: paymentAmount || null,
            shippingMethod,
            deliveryInstructions: deliveryInstructions || null,
            currency: BASE_CURRENCY_CODE || "YER",
          });

          transaction.set(orderRef, newOrderData);

          // 2. Update Counter
          transaction.set(
            counterRef,
            { orderCounter: nextSeq },
            { merge: true },
          );

          // 3. Update Stocks
          productUpdates.forEach((pu) =>
            transaction.update(pu.ref, { stockCount: pu.newStock }),
          );

          // 4. Update Wallet / Transactions
          if (userRef) {
            const currentUserData = userSnap?.data() as UserProfile;
            const newTransaction: Transaction = {
              id: printableId,
              amount: total,
              type: "purchase",
              date: new Date().toISOString(),
              status: "completed",
              description: `طلب رقم: ${printableId}`,
            };

            const updateData: any = {
              transactions: [newTransaction, ...(currentUserData?.transactions || [])],
              updatedAt: serverTimestamp(),
            };

            if (paymentMethod === "المحفظة الرقمية") {
                updateData.walletBalance = newUserBalance;
            }

            transaction.update(userRef, updateData);
          }

          // 5. Update Coupon
          if (couponRefToUpdate) {
            transaction.update(couponRefToUpdate, { usedCount: newUsedCount });
          }

          return printableId;
        });

        // G. Post-Order cleanup (outside transaction)
        await setDoc(doc(db, "settings", "store_meta"), {
          products_updated_at: Date.now()
        }, { merge: true }).catch(() => {});

        showToast(`تم إتمام الطلب بنجاح!`);
        clearCart();
        setDiscount({ code: null, amount: 0, type: "percentage" });
        setIsPlacingOrder(false);
        return orderId;
      } catch (error: any) {
        console.error("Order placement failed:", error);
        showToast(error.message || "حدث خطأ أثناء إتمام الطلب", "error");
        setIsPlacingOrder(false);
        return "";
      }
    },
    [
      cart,
      discount,
      coupons,
      updateCoupon,
      clearCart,
      showToast,
      user,
      products,
      isPlacingOrder,
      shippingZones,
      settings,
      cities,
    ],
  );

  const updateOrderStatus = React.useCallback(
    async (orderId: string, status: Order["status"]) => {
      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        const orderRef = doc(activeDb, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          showToast("الطلب غير موجود", "error");
          return;
        }

        await updateDoc(orderRef, {
          status,
          updatedAt: serverTimestamp(),
        });

        showToast("تم تحديث حالة الطلب");
        logActivity(
          "تحديث حالة طلب",
          `تم تحديث حالة الطلب ${orderId} إلى: ${status}`,
        );

        const orderData = orderSnap.data() as Order;
        const targetUserId = orderData.userId;

        // 1. Send status Notification (for all users, including guests)
        try {
          await notificationService.sendOrderStatusNotification(
            orderData,
            status,
          );
        } catch (notifErr) {
          console.error("Failed to send status notification:", notifErr);
        }

        // 2. Send App/Push Notification (only for registered users)
        if (targetUserId && targetUserId !== "guest") {
          let statusTitle = "تحديث حالة الطلب";
          let statusMessage = `تم تحديث حالة طلبك ${orderId} إلى ${status}`;

          switch (status) {
            case "pending":
              statusTitle = "الطلب قيد المراجعة ⏳";
              statusMessage = `مرحباً، طلبك رقم ${orderId} قيد الانتظار للمراجعة الآن. سنقوم بإبلاغك فور البدء بتجهيزه.`;
              break;
            case "processing":
              statusTitle = "بدأ تجهيز طلبك 📦";
              statusMessage = `طلبك رقم ${orderId} قيد التجهيز الآن، سنخطرك عند شحنه.`;
              break;
            case "shipped":
              statusTitle = "تم شحن طلبك 🚚";
              statusMessage = `خبر سعيد! طلبك رقم ${orderId} في الطريق إليك الآن.`;
              break;
            case "delivered":
              statusTitle = "وصل طلبك! 🎉";
              statusMessage = `نأمل أن تعجبك مشترياتك. شكراً لثقتك بمتجر النخبة!`;
              break;
            case "cancelled":
              statusTitle = "تم إلغاء الطلب";
              statusMessage = `نأسف، تم إلغاء طلبك رقم ${orderId}. لمزيد من التفاصيل يرجى التواصل مع الدعم.`;
              break;
          }

          try {
            await fetch("/api/admin/notifications/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: statusTitle,
                message: statusMessage,
                target: "specific_user",
                targetUserId: targetUserId,
                url: `/profile`,
              }),
            });

            // ADDED: Write to Firestore notifications collection too
            const notificationRef = doc(collection(activeDb, `users/${targetUserId}/notifications`));
            await setDoc(notificationRef, {
              title: statusTitle,
              message: statusMessage,
              type: "order",
              isRead: false,
              date: new Date().toISOString(),
              createdAt: serverTimestamp(),
              url: `/profile`,
            });
          } catch (notifErr) {
            console.error("Failed to send App notification:", notifErr);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }
    },
    [showToast, logActivity],
  );

  const deleteOrder = React.useCallback(
    async (id: string) => {
      // Optimistic UI update
      const previousOrders = [...orders];
      setOrders((prev) => prev.filter((o) => o.id !== id));

      try {
        const orderToDelete = orders.find((o) => o.id === id);
        if (orderToDelete && orderToDelete.paymentProof) {
          deleteImagesFromCloudinary([orderToDelete.paymentProof]);
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        const documentId = orderToDelete?.orderDocId || id;
        await deleteDoc(doc(activeDb, "orders", documentId));
        showToast("تم حذف الطلب بنجاح", "success");
        logActivity("حذف طلب", `تم حذف الطلب رقم: ${id}`);
      } catch (error) {
        console.error("Delete order failed, rolling back", error);
        setOrders(previousOrders); // Rollback
        syncOnDemand("orders");
        handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
      }
    },
    [orders, setOrders, showToast, logActivity, syncOnDemand],
  );

  const toggleWishlist = React.useCallback(
    (product: Product) => {
      const exists = wishlist.some((p) => String(p.id) === String(product.id));
      let newWishlist: Product[];

      if (exists) {
        showToast(`تم إزالة ${product.name} من المفضلة`);
        newWishlist = wishlist.filter((p) => String(p.id) !== String(product.id));
      } else {
        showToast(`تم إضافة ${product.name} إلى المفضلة`);
        newWishlist = [...wishlist, product];
      }
      
      setWishlist(newWishlist);

      // Handle user state update
      if (user) {
        const updatedUser = { ...user, wishlist: newWishlist };
        setUser(updatedUser);
        
        // Update customers list if applicable (sync local state)
        setCustomers((prevCustomers) =>
          prevCustomers.map((c) => {
            if (c.phone === user.phone) {
              return { ...c, wishlist: newWishlist };
            }
            return c;
          }),
        );
      }
    },
    [showToast, user, wishlist],
  );

  const isInWishlist = React.useCallback(
    (productId: string) => {
      return wishlist.some((p) => String(p.id) === String(productId));
    },
    [wishlist],
  );

  const updateUser = React.useCallback(
    async (newUser: UserProfile) => {
      if (!auth.currentUser) return;

      // Save current user for error reversal if needed
      const prevUser = user;

      // Cleanup old avatar if changed
      if (
        prevUser &&
        newUser.avatar &&
        prevUser.avatar &&
        prevUser.avatar !== newUser.avatar
      ) {
        deleteImagesFromCloudinary([prevUser.avatar]);
      }

      // Cleanup old photoURL if changed
      if (
        prevUser &&
        newUser.photoURL &&
        prevUser.photoURL &&
        prevUser.photoURL !== newUser.photoURL
      ) {
        deleteImagesFromCloudinary([prevUser.photoURL]);
      }

      const prevPhone = prevUser?.phone || "";
      const newPhone = newUser.phone || "";
      const prevCode = prevUser?.countryCode || "+967";
      const newCode = newUser.countryCode || "+967";
      const isPhoneAuthUser = prevUser?.email?.endsWith("@elite-store.local");

      // Check if phone number is changing and it actually existed before
      const isPhoneChanging =
        isPhoneAuthUser &&
        prevPhone &&
        (newPhone !== prevPhone || newCode !== prevCode);

      setUser(newUser);

      try {
        // 1. Sync with Firebase Auth via Server if phone changed
        if (isPhoneChanging && prevUser) {
          const syncResponse = await fetch("/api/update-phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              oldPhone: prevPhone,
              oldCountryCode: prevCode,
              newPhone: newPhone,
              newCountryCode: newCode,
            }),
          });
          const syncData = await syncResponse.json();
          if (!syncResponse.ok || !syncData.success) {
            throw new Error(
              syncData.error || "فشل مزامنة الرقم مع نظام تسجيل الدخول",
            );
          }

          // Also update the local email to match the new dummy email
          newUser.email = `${(newUser.countryCode || "+967").replace("+", "")}${newUser.phone}@elite-store.local`;
        }

        // Ensure we don't accidentally drop the admin role if it was set
        if (prevUser?.role === "admin" && newUser.role !== "admin") {
          newUser.role = "admin";
          if (prevUser.adminRole) {
            newUser.adminRole = prevUser.adminRole;
          }
        }

        // 2. Update Firestore
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          ...newUser,
          updatedAt: serverTimestamp(),
        });

        showToast("تم تحديث البيانات بنجاح");
      } catch (error: any) {
        // Revert optimistic update on failure
        if (prevUser) setUser(prevUser);
        if (error.message === "الرقم الجديد مسجل مسبقاً في حساب آخر") {
          showToast(error.message, "error");
        } else {
          handleFirestoreError(
            error,
            OperationType.UPDATE,
            `users/${auth.currentUser.uid}`,
          );
        }
      }
    },
    [showToast, user],
  );

  const forceSetUserWrapper = React.useCallback(
    (newUser: UserProfile | null) => {
      setUser(newUser);
      setIsAuthReady(true);
    },
    [],
  );

  const deleteAccount = React.useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const uid = auth.currentUser.uid;
      
      // Cleanup user images
      if (user) {
        const imagesToDelete = [user.avatar, user.photoURL].filter(
          Boolean,
        ) as string[];
        if (imagesToDelete.length > 0) {
          deleteImagesFromCloudinary(imagesToDelete);
        }
      }

      // 1. Delete user data from Firestore
      await deleteDoc(doc(db, "users", uid));

      // 2. Delete auth account
      await auth.currentUser.delete();

      setUser(null);
      setWishlist([]);
      showToast("تم حذف الحساب بنجاح");
    } catch (error) {
      console.error("Account deletion failed:", error);
      throw error; // Let the component handle it
    }
  }, [showToast]);

  const logout = React.useCallback(async () => {
    try {
      // Clear only customer session flags
      const keysToRemove = [
        "local_session_id",
        "last_session_ping",
        "is_logged_in",
        "store_user",
        "store_cart",
        "store_wishlist",
        "store_notifications",
        "store_recently_viewed"
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      await auth.signOut();
      setUser(null);
      setWishlist([]);
      setNotifications([]);
      showToast("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [showToast]);

  const adminLogout = React.useCallback(async () => {
    try {
      const keysToRemove = [
        "admin_auth",
        "admin_email",
        "admin_role",
        "admin_name",
        "admin_attempt",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      await adminAuth.signOut();
      setAdminUser(null);
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Admin logout error:", error);
    }
  }, []);

  const updateCustomer = React.useCallback(
    async (identifier: string, updates: Partial<UserProfile>) => {
      try {
        if (!identifier) {
          showToast("معرف العميل غير صالح", "error");
          return;
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        let docRef = null;
        let userData: UserProfile | null = null;

        // Try by UID first
        const uidRef = doc(activeDb, "users", identifier);
        const uidSnap = await getDoc(uidRef);

        if (uidSnap.exists()) {
          docRef = uidRef;
          userData = { uid: uidSnap.id, ...uidSnap.data() } as UserProfile;
        } else {
          // Fallback to phone search
          const q = query(
            collection(activeDb, "users"),
            where("phone", "==", identifier),
          );
          const snapshot = await getDocs(q);
          if (
            snapshot &&
            !snapshot.empty &&
            snapshot.docs &&
            snapshot.docs.length > 0
          ) {
            docRef = snapshot.docs[0].ref;
            userData = {
              uid: snapshot.docs[0].id,
              ...snapshot.docs[0].data(),
            } as UserProfile;
          }
        }

        if (!docRef || !userData) {
          showToast("العميل غير موجود", "error");
          return;
        }

        const oldPhone = userData.phone || "";
        const newPhone = updates.phone || oldPhone;
        const oldCode = userData.countryCode || "+967";
        const newCode = updates.countryCode || oldCode;
        const isCustomerPhoneAuth =
          userData.email?.endsWith("@elite-store.local");

        // Check if phone is being updated
        if (
          isCustomerPhoneAuth &&
          oldPhone &&
          (newPhone !== oldPhone || newCode !== oldCode)
        ) {
          const syncResponse = await fetch("/api/update-phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              oldPhone: oldPhone,
              oldCountryCode: oldCode,
              newPhone: newPhone,
              newCountryCode: newCode,
            }),
          });
          const syncData = await syncResponse.json();
          if (!syncResponse.ok || !syncData.success) {
            showToast(
              syncData.error || "فشل تحديث الرقم في نظام المصادقة",
              "error",
            );
            return;
          }

          // Update the email in Firestore too
          updates.email = `${(updates.countryCode || userData.countryCode || "+967").replace("+", "")}${updates.phone}@elite-store.local`;
        }

        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        } as any);

        // If password update is included, we MUST trigger the backend API to update Firebase Auth
        if (updates.password) {
          try {
            const snap = await getDoc(docRef);
            const userData = snap.data() as UserProfile | undefined;
            if (userData && userData.phone) {
              const resetResponse = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone: userData.phone,
                  countryCode: userData.countryCode || "+967",
                  newPassword: updates.password,
                }),
              });
              const resetData = await resetResponse.json();
              if (!resetResponse.ok || !resetData.success) {
                console.error(
                  "Backend Auth Password Update Failed:",
                  resetData.error,
                );
                showToast(
                  "تم تحديث البيانات لكن لم يتم تغيير كلمة المرور في السيرفر",
                  "error",
                );
                return;
              }
            }
          } catch (authUpdateError) {
            console.error("Critical Auth Update Error:", authUpdateError);
            showToast("خطأ في مزامنة كلمة المرور مع السيرفر", "error");
          }
        }

        showToast("تم تحديث بيانات العميل بنجاح");
        logActivity("تحديث عميل", `تم تحديث بيانات العميل: ${identifier}`);
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `users: ${identifier}`,
        );
      }
    },
    [showToast, logActivity],
  );

  const blockCustomer = React.useCallback(
    async (identifier: string) => {
      try {
        if (!identifier) {
          showToast("معرف العميل غير صالح", "error");
          return;
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        let docRef = null;
        let userData = null;

        // Try by UID first
        const uidRef = doc(activeDb, "users", identifier);
        const uidSnap = await getDoc(uidRef);

        if (uidSnap.exists()) {
          docRef = uidRef;
          userData = uidSnap.data() as UserProfile;
        } else {
          // Fallback to phone search
          const q = query(
            collection(activeDb, "users"),
            where("phone", "==", identifier),
          );
          const snapshot = await getDocs(q);
          if (
            snapshot &&
            !snapshot.empty &&
            snapshot.docs &&
            snapshot.docs.length > 0
          ) {
            docRef = snapshot.docs[0].ref;
            userData = snapshot.docs[0].data() as UserProfile;
          }
        }

        if (!docRef || !userData) {
          showToast("العميل غير موجود", "error");
          return;
        }

        await updateDoc(docRef, {
          isBlocked: !userData.isBlocked,
          updatedAt: serverTimestamp(),
        } as any);
        showToast("تم تغيير حالة حظر العميل");
        logActivity(
          "تغيير حالة حظر عميل",
          `تم تغيير حالة حظر العميل: ${identifier}`,
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.UPDATE,
          `users (block): ${identifier}`,
        );
      }
    },
    [showToast, logActivity],
  );

  const addCustomer = React.useCallback(
    async (customer: UserProfile) => {
      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        const cleanPhone = (customer.phone || "")
          .trim()
          .replace(/\D/g, "")
          .replace(/^0+/, "");
        const countryCode = (customer.countryCode || "+967")
          .trim()
          .replace(/\D/g, "");

        if (!cleanPhone) {
          showToast("يرجى إدخال رقم الهاتف", "error");
          return;
        }

        const q = query(
          collection(activeDb, "users"),
          where("phone", "==", cleanPhone),
        );
        const snapshot = await getDocs(q);
        if (snapshot && !snapshot.empty) {
          showToast("هذا الرقم مسجل مسبقاً لعميل آخر", "error");
          return;
        }

        const dummyEmail =
          `${countryCode}${cleanPhone}@elite-store.local`.toLowerCase();
        let authUid = "";

        // Create in Auth if password is provided
        if (customer.password) {
          try {
            const syncRes = await fetch("/api/admin/update-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: dummyEmail,
                newPassword: customer.password,
              }),
            });

            if (!syncRes.ok) {
              const errorData = await syncRes.json().catch(() => ({}));
              console.error("Server error during auth sync:", errorData);
              showToast(
                `فشل في توثيق الحساب: ${errorData.error || "خطأ في السيرفر"}`,
                "error",
              );
              return;
            }

            const syncData = await syncRes.json();
            if (syncData.success && syncData.uid) {
              authUid = syncData.uid;
            } else if (
              syncData.error &&
              syncData.error.includes("email-already-in-use")
            ) {
              showToast(
                'هذا البريد مسجل مسبقاً. يرجى "تحديث" العميل بدلاً من إضافته.',
                "error",
              );
              return;
            } else {
              console.error("Failed to create Auth record:", syncData.error);
              showToast(
                `لم يتم إنشاء حساب تسجيل الدخول: ${syncData.error}. (تأكد من إعداد Firebase Admin)`,
                "error",
              );
              return;
            }
          } catch (authErr) {
            console.error("Auth sync attempt failed:", authErr);
            showToast(
              "فشل الاتصال بخادم التوثيق. تأكد من جودة الإنترنت.",
              "error",
            );
            return;
          }
        } else {
          showToast(
            "يرجى تحديد كلمة مرور ليتمكن العميل من تسجيل الدخول",
            "info",
          );
          // If no password, we just use a random ID for Firestore, but they can't login
          authUid = doc(collection(activeDb, "users")).id;
        }

        await setDoc(doc(activeDb, "users", authUid), {
          ...customer,
          uid: authUid,
          email: dummyEmail,
          phone: cleanPhone,
          role: "customer",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        showToast("تم إضافة العميل بنجاح");
        logActivity(
          "إضافة عميل",
          `تم إضافة عميل جديد: ${customer.displayName || customer.name}`,
        );
      } catch (error: any) {
        console.error("StoreContext addCustomer Error:", error);
        showToast(
          `فشل الإضافة: ${error.message || "مشكلة في الصلاحيات او البيانات المدخلة"}`,
          "error",
        );
        handleFirestoreError(error, OperationType.CREATE, "users");
      }
    },
    [showToast, logActivity],
  );

  const deleteCustomer = React.useCallback(
    async (identifier: string) => {
      // Optimistic UI update
      const previousCustomers = [...customers];
      setCustomers((prev) =>
        prev.filter((c) => c.phone !== identifier && c.uid !== identifier),
      );

      try {
        if (!identifier) {
          showToast("معرف العميل غير صالح", "error");
          setCustomers(previousCustomers); // Rollback
          return;
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        let docRef = null;

        // Try to get by UID first
        const uidRef = doc(activeDb, "users", identifier);
        const uidSnap = await getDoc(uidRef);

        if (uidSnap.exists()) {
          docRef = uidRef;
        } else {
          // Fallback to phone search
          const q = query(
            collection(activeDb, "users"),
            where("phone", "==", identifier),
          );
          const snapshot = await getDocs(q);
          if (
            snapshot &&
            !snapshot.empty &&
            snapshot.docs &&
            snapshot.docs.length > 0
          ) {
            docRef = snapshot.docs[0].ref;
          }
        }

        if (!docRef) {
          showToast("العميل غير موجود", "error");
          setCustomers(previousCustomers); // Rollback
          return;
        }

        const customerToDelete = customers.find(
          (c) => c.uid === identifier || c.phone === identifier,
        );
        if (customerToDelete) {
          const imagesToDelete = [
            customerToDelete.avatar,
            customerToDelete.photoURL,
          ].filter(Boolean) as string[];
          if (imagesToDelete.length > 0) {
            deleteImagesFromCloudinary(imagesToDelete);
          }
        }

        await deleteDoc(docRef);
        showToast("تم حذف العميل بنجاح", "success");
        logActivity("حذف عميل", `تم حذف العميل: ${identifier}`);
      } catch (error) {
        console.error("Delete customer failed, rolling back", error);
        setCustomers(previousCustomers); // Rollback
        syncOnDemand("customers");
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `users: ${identifier}`,
        );
      }
    },
    [customers, setCustomers, showToast, logActivity, syncOnDemand],
  );

  const addCoupon = React.useCallback(
    async (coupon: Omit<Coupon, "id" | "usedCount">) => {
      const newId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
      const newCoupon: Coupon = {
        ...coupon,
        id: newId,
        usedCount: 0,
      };

      // Optimistic Update
      setCoupons((prev) => [newCoupon, ...prev]);

      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await setDoc(doc(activeDb, "coupons", newId), newCoupon);
        showToast("تمت إضافة الكوبون بنجاح");
        logActivity("إضافة كوبون", `تم إضافة كود خصم جديد: ${coupon.code}`);
      } catch (error) {
        // Rollback
        setCoupons((prev) => prev.filter((c) => c.id !== newId));
        handleFirestoreError(error, OperationType.CREATE, "coupons");
      }
    },
    [showToast, logActivity],
  );

  const deleteCoupon = React.useCallback(
    async (id: string) => {
      const previousCoupons = [...coupons];
      // Optimistic Update
      setCoupons((prev) => prev.filter((c) => c.id !== id));

      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await deleteDoc(doc(activeDb, "coupons", id));
        showToast("تم حذف الكوبون بنجاح");
        logActivity("حذف كوبون", `تم حذف كود الخصم بمعرف: ${id}`);
      } catch (error) {
        // Rollback
        setCoupons(previousCoupons);
        handleFirestoreError(error, OperationType.DELETE, "coupons");
      }
    },
    [coupons, showToast, logActivity],
  );

  const toggleCouponStatus = React.useCallback(
    async (id: string) => {
      const previousCoupons = [...coupons];
      const coupon = coupons.find((c) => c.id === id);
      if (!coupon) return;

      // Optimistic Update
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
      );

      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await updateDoc(doc(activeDb, "coupons", id), {
          isActive: !coupon.isActive,
        });
        showToast("تم تغيير حالة الكوبون");
        logActivity("تحديث كوبون", `تم إيقاف/تفعيل كود الخصم: ${coupon.code}`);
      } catch (error) {
        // Rollback
        setCoupons(previousCoupons);
        handleFirestoreError(error, OperationType.UPDATE, "coupons");
      }
    },
    [coupons, showToast, logActivity],
  );

  const applyDiscountCode = React.useCallback(
    (code: string) => {
      const upperCode = code.toUpperCase();
      const coupon = coupons.find((c) => c.code.toUpperCase() === upperCode);

      if (!coupon) {
        showToast("كود الخصم غير صالح", "error");
        return false;
      }

      if (!coupon.isActive) {
        showToast("كود الخصم غير فعال حالياً", "error");
        return false;
      }

      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        showToast("كود الخصم منتهي الصلاحية", "error");
        return false;
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        showToast("تم الوصول للحد الأقصى لاستخدام هذا الكوبون", "error");
        return false;
      }

      const cartTotal = cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      );
      if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        showToast(
          `الحد الأدنى للطلب لتطبيق هذا الكوبون هو ${formatPrice(coupon.minOrderValue)}`,
          "error",
        );
        return false;
      }

      setDiscount({
        code: upperCode,
        amount: coupon.discountValue,
        type: coupon.discountType,
      });

      showToast(`تم تطبيق كود الخصم ${upperCode} بنجاح`);
      return true;
    },
    [coupons, cart, formatPrice, showToast],
  );

  const removeDiscount = React.useCallback(() => {
    setDiscount({ code: null, amount: 0, type: "percentage" });
    showToast("تم إزالة الخصم");
  }, [showToast]);

  // Automatically remove discount if cart total falls below minimum order value
  useEffect(() => {
    if (discount.code) {
      const cartTotal = cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      );
      const coupon = coupons.find(
        (c) => c.code.toUpperCase() === discount.code?.toUpperCase(),
      );

      if (coupon && coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        setDiscount({ code: null, amount: 0, type: "percentage" });
        showToast(
          `تم إزالة كود الخصم لأن إجمالي السلة أقل من الحد الأدنى (${formatPrice(coupon.minOrderValue)})`,
          "info",
        );
      }
    }
  }, [cart, discount.code, coupons, formatPrice, showToast]);

  const subscribeToProduct = React.useCallback(
    (productId: string, type: "back_in_stock" | "on_sale", email: string) => {
      const exists = subscriptions.some(
        (s) =>
          s.productId === productId && s.type === type && s.email === email,
      );
      if (exists) {
        showToast("أنت مشترك بالفعل في هذه التنبيهات", "info");
        return;
      }
      setSubscriptions((prev) => [...prev, { productId, type, email }]);
      showToast("تم الاشتراك في التنبيهات بنجاح");
    },
    [subscriptions, showToast],
  );

  const markNotificationAsRead = React.useCallback(async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      if (user?.uid) {
        const notifRef = doc(db, `users/${user.uid}/notifications`, id);
        updateDoc(notifRef, { isRead: true }).catch(() => {});
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [user?.uid]);

  const deleteNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const deletedIds = JSON.parse(
      localStorage.getItem("store_deleted_notif_ids") || "[]",
    );
    if (!deletedIds.includes(id)) {
      localStorage.setItem(
        "store_deleted_notif_ids",
        JSON.stringify([...deletedIds, id]),
      );
    }
    if (user?.uid) {
      deleteDoc(doc(db, `users/${user.uid}/notifications`, id)).catch(() => {});
    }
  }, [user?.uid]);

  const clearAllNotifications = React.useCallback(() => {
    setNotifications((prev) => {
      const deletedIds = JSON.parse(
        localStorage.getItem("store_deleted_notif_ids") || "[]",
      );
      const newDeletedIds = new Set([...deletedIds, ...prev.map((n) => n.id)]);
      localStorage.setItem(
        "store_deleted_notif_ids",
        JSON.stringify(Array.from(newDeletedIds)),
      );
      
      if (user?.uid) {
        prev.forEach((n) => {
           deleteDoc(doc(db, `users/${user.uid}/notifications`, n.id)).catch(() => {});
        });
      }
      
      return [];
    });
  }, [user?.uid]);

  const updateNotificationSettings = React.useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setNotificationSettings((prev) => ({ ...prev, ...newSettings }));
      showToast("تم تحديث إعدادات الإشعارات");
    },
    [showToast],
  );

  const trackOrderById = React.useCallback(async (orderId: string) => {
    try {
      const docRef = doc(db, "orders", orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error("Error tracking order:", error);
      return null;
    }
  }, []);

  const addToRecentlyViewed = React.useCallback((product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 5); // Keep last 5
    });
  }, []);


  const updateStock = React.useCallback(
    async (
      productId: string,
      newStock: number,
      reason: string = "تحديث يدوي",
    ) => {
      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const previousStock = product.stockCount || 0;
        const change = newStock - previousStock;

        if (change === 0) return;

        const batch = writeBatch(activeDb);

        // Update product
        const pRef = doc(activeDb, "products", productId);
        batch.update(pRef, {
          stockCount: newStock,
          inStock: newStock > 0,
          updatedAt: serverTimestamp(),
        });

        // Create inventory log
        const logRef = doc(collection(activeDb, "inventory_logs"));
        batch.set(logRef, {
          productId,
          productName: product.name,
          change,
          previousStock,
          newStock,
          date: new Date().toISOString(),
          user: user?.name || user?.displayName || "مدير النظام",
          reason,
          createdAt: serverTimestamp(),
        } as any);

        await batch.commit();
        await setDoc(doc(activeDb, "settings", "store_meta"), {
          products_updated_at: Date.now()
        }, { merge: true }).catch(() => {});
        logActivity(
          "تحديث مخزون",
          `تم تحديث مخزون المنتج ${product.name} إلى ${newStock}`,
        );
      } catch (error) {
        console.error("Stock update failed:", error);
        showToast("فشل تحديث المخزون", "error");
      }
    },
    [products, user, logActivity, showToast],
  );

  const bulkUpdateStock = React.useCallback(
    async (
      updates: { productId: string; newStock: number }[],
      reason: string = "تحديث جماعي",
    ) => {
      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        const batch = writeBatch(activeDb);
        let logCount = 0;

        updates.forEach((update) => {
          const product = products.find((p) => p.id === update.productId);
          if (!product) return;

          const previousStock = product.stockCount || 0;
          const change = update.newStock - previousStock;

          if (change === 0) return;

          // Update product ref
          const pRef = doc(activeDb, "products", update.productId);
          batch.update(pRef, {
            stockCount: update.newStock,
            inStock: update.newStock > 0,
            updatedAt: serverTimestamp(),
          });

          // Create inventory log doc
          const logRef = doc(collection(activeDb, "inventory_logs"));
          batch.set(logRef, {
            productId: update.productId,
            productName: product.name,
            change,
            previousStock,
            newStock: update.newStock,
            date: new Date().toISOString(),
            user: user?.name || user?.displayName || "مدير النظام",
            reason,
            createdAt: serverTimestamp(),
          } as any);

          logCount++;
        });

        if (logCount > 0) {
          await batch.commit();
          await setDoc(doc(activeDb, "settings", "store_meta"), {
            products_updated_at: Date.now()
          }, { merge: true }).catch(() => {});
          logActivity("تحديث مخزون جماعي", `تم تحديث مخزون ${logCount} منتجات`);
          showToast(`تم تحديث مخزون ${logCount} منتجات`);
        }
      } catch (error) {
        console.error("Bulk stock update failed:", error);
        showToast("فشل تحديث المخزون جماعياً", "error");
      }
    },
    [products, user, showToast, logActivity],
  );

  const addProduct = React.useCallback(
    async (product: Omit<Product, "id">) => {
      const tempId = String(Date.now());
      const optimisticProduct = {
        ...product,
        id: tempId,
        createdAt: new Date().toISOString(),
      } as Product;

      // Optimistic UI update
      setProducts((prev) => [optimisticProduct, ...prev]);

      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await setDoc(doc(activeDb, "products", tempId), {
          ...product,
          id: tempId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await setDoc(doc(activeDb, "settings", "store_meta"), {
          products_updated_at: Date.now()
        }, { merge: true }).catch(() => {});
        showToast("تم إضافة المنتج بنجاح");
        logActivity("إضافة منتج", `تم إضافة المنتج الجديد: ${product.name}`);
      } catch (error) {
        // Rollback on error
        setProducts((prev) => prev.filter((p) => p.id !== tempId));
        handleFirestoreError(error, OperationType.CREATE, "products");
      }
    },
    [showToast, logActivity],
  );

  const updateProduct = React.useCallback(
    async (id: string, updatedData: Partial<Product>) => {
      // Optimistic UI update
      const oldProduct = products.find((p) => p.id === id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updatedData } : p)),
      );

      try {
        // If images were updated, delete old ones
        if (
          updatedData.image &&
          oldProduct &&
          oldProduct.image !== updatedData.image
        ) {
          deleteImagesFromCloudinary([oldProduct.image]);
        }
        if (
          updatedData.images &&
          oldProduct &&
          JSON.stringify(oldProduct.images) !==
            JSON.stringify(updatedData.images)
        ) {
          const removedImages = (oldProduct.images || []).filter(
            (img) => !updatedData.images?.includes(img),
          );
          if (removedImages.length > 0)
            deleteImagesFromCloudinary(removedImages);
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        await updateDoc(doc(activeDb, "products", String(id)), {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
        await setDoc(doc(activeDb, "settings", "store_meta"), {
          products_updated_at: Date.now()
        }, { merge: true }).catch(() => {});
        showToast("تم تحديث المنتج بنجاح");
        logActivity("تحديث منتج", `تم تحديث بيانات المنتج ID: ${id}`);
      } catch (error) {
        // Snapshot listener will eventually correct state, but explicit rollback is safer
        handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
      }
    },
    [showToast, logActivity],
  );

  const deleteProduct = React.useCallback(
    async (id: string) => {
      if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

      // Optimistic UI update: Remove immediately from all relevant stores
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setRecentlyViewed((prev) => prev.filter((p) => p.id !== id));
      setWishlist((prev) => prev.filter((p) => p.id !== id));
      setCart((prev) => prev.filter((item) => item.product.id !== id));

      const productToDelete = products.find((p) => p.id === id);

      try {
        if (productToDelete) {
          deleteImagesFromCloudinary([
            productToDelete.image,
            ...(productToDelete.images || []),
          ]);
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        
        // Execute deletion
        await deleteDoc(doc(activeDb, "products", String(id)));
        
        // Log activity
        logActivity("حذف منتج", `تم حذف المنتج ID: ${id}`);
        showToast("تم حذف المنتج بنجاح", "success");

        // We do NOT manually update store_meta here to prevent re-triggering a re-fetch.
        // If necessary, syncOnDemand can be used later or trust the local state removal.
      } catch (error) {
        // Rollback: Re-fetch if deletion fails
        console.error("Delete failed, rolling back", error);
        syncOnDemand("products");
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    },
    [products, setProducts, setRecentlyViewed, setWishlist, setCart, showToast, logActivity, syncOnDemand],
  );

  const addCategory = React.useCallback(
    async (category: Omit<Category, "id">) => {
      const tempId = Date.now().toString();
      setCategories((prev) => [...prev, { ...category, id: tempId }]);

      try {
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await setDoc(doc(activeDb, "categories", tempId), {
          ...category,
          id: tempId,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(activeDb, "settings", "store_meta"), {
          categories_updated_at: Date.now()
        }, { merge: true }).catch(() => {});
        logActivity("إضافة قسم", `تم إضافة قسم جديد: ${category.name}`);
        showToast("تم إضافة الفئة بنجاح", "success");
      } catch (error) {
        setCategories((prev) => prev.filter((c) => c.id !== tempId));
        handleFirestoreError(error, OperationType.CREATE, "categories");
      }
    },
    [showToast, logActivity],
  );

  const updateCategory = React.useCallback(
    async (id: string, updatedData: Partial<Category>) => {
      const oldCategory = categories.find((c) => c.id === id);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)),
      );

      try {
        if (
          updatedData.image &&
          oldCategory &&
          oldCategory.image !== updatedData.image
        ) {
          deleteImagesFromCloudinary([oldCategory.image]);
        }
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await updateDoc(doc(activeDb, "categories", id), {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
        await setDoc(doc(activeDb, "settings", "store_meta"), {
          categories_updated_at: Date.now()
        }, { merge: true }).catch(() => {});
        logActivity("تحديث قسم", `تم تحديث بيانات القسم`);
        showToast("تم تحديث الفئة بنجاح", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, "categories");
      }
    },
    [showToast, logActivity],
  );

  const deleteCategory = React.useCallback(
    async (id: string) => {
      if (!window.confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
      const categoryToDelete = categories.find((c) => c.id === id);
      setCategories((prev) => prev.filter((c) => c.id !== id));

      try {
        if (categoryToDelete) {
          deleteImagesFromCloudinary([categoryToDelete.image]);
        }
        const activeDb = adminAuth.currentUser ? adminDb : db;
        await deleteDoc(doc(activeDb, "categories", id));
        await setDoc(doc(activeDb, "settings", "store_meta"), {
          categories_updated_at: Date.now()
        }, { merge: true }).catch(() => {});
        logActivity("حذف قسم", `تم حذف القسم بنجاح`);
        showToast(`تم حذف الفئة بنجاح`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, "categories");
      }
    },
    [showToast, logActivity],
  );

  const getRecommendations = React.useCallback(
    async (currentProduct?: Product) => {
      // If we have a Gemini API key, use AI, otherwise rule-based
      if (process.env.GEMINI_API_KEY) {
        return getAIRecommendations(
          recentlyViewed,
          cart,
          products,
          currentProduct,
        );
      }
      return getRuleBasedRecommendations(
        recentlyViewed,
        cart,
        products,
        currentProduct,
      );
    },
    [recentlyViewed, cart, products],
  );

  const getRuleBasedRecommendationsContext = React.useCallback(
    (currentProduct?: Product) => {
      return getRuleBasedRecommendations(
        recentlyViewed,
        cart,
        products,
        currentProduct,
      );
    },
    [recentlyViewed, cart, products],
  );

  const stateValue = useMemo(
    () => ({
      products,
      cart,
      wishlist,
      orders,
      user,
      notifications,
      notificationSettings,
      subscriptions,
      recentlyViewed,
      language,
      settings,
      categories,
      inventoryLogs,
      customers,
      discount,
      coupons,
      banners,
      marketingNotifications,
      adminUsers,
      adminUser,
      supportTickets,
      staticPages,
      shippingZones,
      cities,
      searchTerms,
      visits,
      recharges,
      systemError,
      isLoading,
      isAuthReady,
    }),
    [
      products,
      cart,
      wishlist,
      orders,
      user,
      notifications,
      notificationSettings,
      subscriptions,
      recentlyViewed,
      language,
      settings,
      categories,
      inventoryLogs,
      customers,
      discount,
      coupons,
      banners,
      marketingNotifications,
      adminUsers,
      adminUser,
      supportTickets,
      staticPages,
      shippingZones,
      cities,
      searchTerms,
      visits,
      recharges,
      systemError,
      isLoading,
      isAuthReady,
    ],
  );

  const actionsValue = useMemo(
    () => ({
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      addToRecentlyViewed,
      getRecommendations,
      getRuleBasedRecommendations: getRuleBasedRecommendationsContext,
      setLanguage,
      updateSettings,
      addBanner,
      updateBanner,
      deleteBanner,
      sendMarketingNotification,
      addAdminUser,
      updateAdminUser,
      deleteAdminUser,
      logActivity,
      addTicket,
      updateTicketStatus,
      replyToTicket,
      deleteTicket,
      updateStaticPage,
      addShippingZone,
      updateShippingZone,
      deleteShippingZone,
      toggleShippingZoneStatus,
      addCity,
      updateCity,
      deleteCity,
      trackSearch,
      trackVisit,
      bulkUpdatePrices,
      updateStock,
      bulkUpdateStock,
      updateCustomerBalance,
      addCustomerNote,
      updateCustomer,
      blockCustomer,
      addCustomer,
      deleteCustomer,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      placeOrder,
      updateOrderStatus,
      deleteOrder,
      toggleWishlist,
      isInWishlist,
      updateUser,
      forceSetUser: forceSetUserWrapper,
      deleteAccount,
      logout,
      adminLogout,
      applyDiscountCode,
      removeDiscount,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      toggleCouponStatus,
      subscribeToProduct,
      markNotificationAsRead,
      deleteNotification,
      clearAllNotifications,
      updateNotificationSettings,
      trackOrderById,
      setNotifications,
      formatPrice,
      syncOnDemand,
    }),
    [
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      addToRecentlyViewed,
      getRecommendations,
      getRuleBasedRecommendationsContext,
      setLanguage,
      updateSettings,
      addBanner,
      updateBanner,
      deleteBanner,
      sendMarketingNotification,
      addAdminUser,
      updateAdminUser,
      deleteAdminUser,
      logActivity,
      addTicket,
      updateTicketStatus,
      replyToTicket,
      deleteTicket,
      updateStaticPage,
      addShippingZone,
      updateShippingZone,
      deleteShippingZone,
      toggleShippingZoneStatus,
      addCity,
      updateCity,
      deleteCity,
      trackSearch,
      trackVisit,
      bulkUpdatePrices,
      updateStock,
      bulkUpdateStock,
      updateCustomerBalance,
      addCustomerNote,
      updateCustomer,
      blockCustomer,
      addCustomer,
      deleteCustomer,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      placeOrder,
      updateOrderStatus,
      deleteOrder,
      toggleWishlist,
      isInWishlist,
      updateUser,
      forceSetUserWrapper,
      deleteAccount,
      logout,
      adminLogout,
      applyDiscountCode,
      removeDiscount,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      toggleCouponStatus,
      subscribeToProduct,
      markNotificationAsRead,
      deleteNotification,
      clearAllNotifications,
      updateNotificationSettings,
      trackOrderById,
      formatPrice,
      syncOnDemand,
    ],
  );

  const uiValue = useMemo(
    () => ({
      toast,
      showToast,
      isCartOpen,
      setIsCartOpen,
      isPlacingOrder,
      isWishlistOpen,
      setIsWishlistOpen,
      isNotificationsOpen,
      setIsNotificationsOpen,
      isMobileSearchOpen,
      setIsMobileSearchOpen,
      isSearchInputFocused,
      setIsSearchInputFocused,
      canInstallPWA,
      installPWA,
    }),
    [
      toast,
      showToast,
      isCartOpen,
      isPlacingOrder,
      isWishlistOpen,
      isNotificationsOpen,
      isMobileSearchOpen,
      isSearchInputFocused,
      canInstallPWA,
      installPWA,
    ],
  );

  return (
    <StoreStateContext.Provider value={stateValue}>
      <StoreActionsContext.Provider value={actionsValue}>
        <StoreUIContext.Provider value={uiValue}>
          {children}
        </StoreUIContext.Provider>
      </StoreActionsContext.Provider>
    </StoreStateContext.Provider>
  );
}

export function useStore() {
  const state = useContext(StoreStateContext);
  const actions = useContext(StoreActionsContext);
  const ui = useContext(StoreUIContext);

  if (!state || !actions || !ui) {
    throw new Error("useStore must be used within a StoreProvider");
  }

  return useMemo(() => ({ ...state, ...actions, ...ui }), [state, actions, ui]);
}

export function useStoreState(): StoreState {
  const context = useContext(StoreStateContext);
  if (context === undefined) {
    throw new Error("useStoreState must be used within a StoreProvider");
  }
  return context;
}

export function useStoreActions(): StoreActions {
  const context = useContext(StoreActionsContext);
  if (context === undefined) {
    throw new Error("useStoreActions must be used within a StoreProvider");
  }
  return context;
}

export function useStoreUI(): StoreUI {
  const context = useContext(StoreUIContext);
  if (context === undefined) {
    throw new Error("useStoreUI must be used within a StoreProvider");
  }
  return context;
}
