import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
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
  ActivityLog,
  AdminRole,
  AdminPermission,
  SupportTicket,
  BlogPost,
  StaticPage,
  ShippingZone,
  AbandonedCart,
  SearchTerm,
  Visit,
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
  ) => string;
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
  addAdminUser: (admin: Omit<AdminUser, "id">) => void;
  updateAdminUser: (
    id: string,
    admin: Partial<AdminUser>,
    logDetails?: string,
  ) => void;
  deleteAdminUser: (id: string) => void;
  activityLogs: ActivityLog[];
  logActivity: (action: string, details: string) => void;
  supportTickets: SupportTicket[];
  addTicket: (
    ticket: Omit<SupportTicket, "id" | "createdAt" | "replies" | "status">,
  ) => void;
  updateTicketStatus: (id: string, status: SupportTicket["status"]) => void;
  replyToTicket: (id: string, message: string) => void;
  deleteTicket: (id: string) => void;
  blogPosts: BlogPost[];
  addBlogPost: (post: Omit<BlogPost, "id">) => void;
  updateBlogPost: (id: string, post: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  staticPages: StaticPage[];
  updateStaticPage: (id: string, content: string) => void;
  shippingZones: ShippingZone[];
  addShippingZone: (zone: Omit<ShippingZone, "id" | "isActive">) => void;
  updateShippingZone: (id: string, zone: Partial<ShippingZone>) => void;
  deleteShippingZone: (id: string) => void;
  toggleShippingZoneStatus: (id: string) => void;
  abandonedCarts: AbandonedCart[];
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
  activityLogs: ActivityLog[];
  discount: {
    code: string | null;
    amount: number;
    type: "percentage" | "fixed";
    pointsUsed?: number;
  };
  coupons: Coupon[];
  supportTickets: SupportTicket[];
  blogPosts: BlogPost[];
  staticPages: StaticPage[];
  shippingZones: ShippingZone[];
  abandonedCarts: AbandonedCart[];
  searchTerms: SearchTerm[];
  visits: Visit[];
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
  addBlogPost: (post: Omit<BlogPost, "id">) => void;
  updateBlogPost: (id: string, post: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  updateStaticPage: (id: string, content: string) => void;
  addShippingZone: (zone: Omit<ShippingZone, "id" | "isActive">) => void;
  updateShippingZone: (id: string, zone: Partial<ShippingZone>) => void;
  deleteShippingZone: (id: string) => void;
  toggleShippingZoneStatus: (id: string) => void;
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

import { migrateLocalDataToFirebase } from "../lib/migrateData";
import { getAdminDummyEmail } from "../lib/adminAuth";
import { refreshNotificationToken } from "../lib/notifications";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("store_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deduplicate products by id and ensure string IDs
        const uniqueProducts = Array.from(
          new Map(
            parsed.map((p: any) => [String(p.id), { ...p, id: String(p.id) }]),
          ).values(),
        ) as Product[];
        return uniqueProducts;
      } catch (e) {
        // Fallback to initial products if parsing fails
      }
    }
    // Empty initial products
    return [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("store_cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deduplicate cart items by id to prevent React key errors
        const uniqueItemsMap = new Map();
        parsed.forEach((item: any) => {
          const id =
            item.id ||
            `${item.product?.id || Date.now()}-${item.selectedColor || "default"}-${item.selectedSize || "default"}`;
          if (!uniqueItemsMap.has(id)) {
            uniqueItemsMap.set(id, { ...item, id });
          }
        });
        return Array.from(uniqueItemsMap.values());
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const savedGuest = localStorage.getItem("store_wishlist");
    const savedUser = localStorage.getItem("store_user");
    const isLoggedIn = localStorage.getItem("is_logged_in") === "true";

    let loadedWishlist: Product[] = [];

    if (isLoggedIn && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        loadedWishlist = userObj.wishlist || [];
      } catch (e) {}
    } else if (savedGuest) {
      try {
        loadedWishlist = JSON.parse(savedGuest);
      } catch (e) {}
    }

    // Deduplicate wishlist by id and ensure string IDs
    return Array.from(
      new Map(
        loadedWishlist.map((p: any) => [
          String(p.id),
          { ...p, id: String(p.id) },
        ]),
      ).values(),
    ) as Product[];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("store_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("store_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [adminUser, setAdminUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    const hasProducts = !!localStorage.getItem("store_products");
    const hasSettings = !!localStorage.getItem("store_settings");
    const hasUser = !!localStorage.getItem("store_user");
    return !(hasProducts && hasSettings); // Only show loader if we don't even have layout data
  });
  const [systemError, setSystemError] = useState<string | null>(null);
  const lastAdminDataFetch = React.useRef(0);

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

  // Firebase Auth Listeners
  useEffect(() => {
    let unsubUser: (() => void) | undefined;

    // 1. Customer Auth Listener (Standard Instance)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Enforce single session policy
        let localSessionId = localStorage.getItem("local_session_id");
        if (!localSessionId) {
          localSessionId =
            Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem("local_session_id", localSessionId);
        }

        // Check hardcoded admins first for instant UI response
        const hardcodedAdmins = [
          "samesaeed456@gmail.com",
          "samisaeed2027@gmail.com",
          "samisaeed2025@gmail.com",
        ];
        const isHardcodedAdmin =
          firebaseUser.email &&
          hardcodedAdmins.includes(firebaseUser.email.toLowerCase());

        if (isHardcodedAdmin) {
          // Instant promotion to admin state for hardcoded admins
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "Admin",
            role: "admin",
            createdAt: new Date().toISOString(),
          });

          // Mark as pre-authorized to bypass some security initial checks in UI
          localStorage.setItem("admin_auth", "true");
        }

        // Replace onSnapshot with getDoc for user profile
        getDoc(doc(db, "users", firebaseUser.uid))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const userData = {
                ...docSnap.data(),
                uid: docSnap.id,
              } as UserProfile;

              // Deduplicate addresses and transactions if they exist
              if (userData.addresses && Array.isArray(userData.addresses)) {
                const seenIds = new Set();
                userData.addresses = userData.addresses.filter((addr) => {
                  if (!addr || typeof addr !== "object") return false;
                  const id = (addr as any).id;
                  if (!id || seenIds.has(id)) return false;
                  seenIds.add(id);
                  return true;
                });
              }

              if (
                userData.transactions &&
                Array.isArray(userData.transactions)
              ) {
                const seenTxIds = new Set();
                userData.transactions = userData.transactions.filter((tx) => {
                  if (!tx || typeof tx !== "object") return false;
                  const id = (tx as any).id;
                  if (!id || seenTxIds.has(id)) return false;
                  seenTxIds.add(id);
                  return true;
                });
              }

              // Periodically update session metadata (once per session/load)
              const currentLocalSession =
                localStorage.getItem("local_session_id");
              const lastPing = localStorage.getItem("last_session_ping");
              const now = Date.now();

              if (!lastPing || now - parseInt(lastPing) > 600000) {
                // 10 mins
                updateDoc(doc(db, "users", firebaseUser.uid), {
                  currentSessionId: currentLocalSession,
                  lastActive: new Date().toISOString(),
                  updatedAt: serverTimestamp(),
                }).catch(() => {});
                localStorage.setItem("last_session_ping", now.toString());
              }

              // Mismatch check removed to allow multiple tabs/windows

              // MANDATORY FIELD CHECK:
              // Forbidden to enter if name or phone is missing.
              // If incomplete, treat as no profile so Auth.tsx forces completion.
              const hasName = !!(userData.name || userData.displayName);
              const hasPhone = !!userData.phone;

              if (!hasName || !hasPhone) {
                setUser(null);
                localStorage.removeItem("store_user");
                setIsAuthReady(true);
                return;
              }

              setUser(userData);
              localStorage.setItem("store_user", JSON.stringify(userData));
              refreshNotificationToken();
            } else {
              // Document doesn't exist yet (e.g. during signup before Auth.tsx completes setDoc)
              // Or if the user was deleted but Auth is still active
              if (
                firebaseUser.email &&
                hardcodedAdmins.includes(firebaseUser.email)
              ) {
                const adminData: any = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  role: "admin",
                  isAdmin: true,
                  displayName: "مدير النظام",
                  currentSessionId: localStorage.getItem("local_session_id"),
                  updatedAt: serverTimestamp(),
                };
                setDoc(doc(db, "users", firebaseUser.uid), adminData, {
                  merge: true,
                });
                setUser(adminData);
              } else {
                // FOR NORMAL USERS:
                // If the document is missing, DO NOT automatically create it here.
                // This ensures that deleted users are forced to re-register.
                setUser(null);
              }
            }
            setIsAuthReady(true);
          })
          .catch((error) => {
            console.warn("User profile sync warning:", error);
            if (
              firebaseUser.email &&
              hardcodedAdmins.includes(firebaseUser.email)
            ) {
              const adminData: any = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: "admin",
                isAdmin: true,
                displayName: "مدير النظام",
                currentSessionId: localStorage.getItem("local_session_id"),
              };
              setUser(adminData);
            } else {
              const cachedUser = localStorage.getItem("store_user");
              if (cachedUser) {
                try {
                  setUser(JSON.parse(cachedUser));
                } catch (e) {
                  setUser(null);
                }
              } else {
                setUser(null);
              }
            }
            setIsAuthReady(true);
          });
      } else {
        if (unsubUser) unsubUser();
        setUser(null);
        // Clear customer specific storage
        const keysToRemove = [
          "store_user",
          "local_session_id",
          "last_session_ping",
        ];
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        setIsAuthReady(true);
      }
    });

    // 2. Admin Auth Listener (Dedicated Instance)
    const unsubscribeAdmin = onAuthStateChanged(
      adminAuth,
      async (firebaseAdmin) => {
        if (firebaseAdmin) {
          try {
            const adminDoc = await getDoc(
              doc(adminDb, "users", firebaseAdmin.uid),
            );
            if (adminDoc.exists()) {
              setAdminUser({
                ...adminDoc.data(),
                uid: adminDoc.id,
              } as UserProfile);
            } else {
              const hardcoded = [
                "samesaeed456@gmail.com",
                "samisaeed2027@gmail.com",
                "samisaeed2025@gmail.com",
              ];
              if (
                firebaseAdmin.email &&
                hardcoded.includes(firebaseAdmin.email.toLowerCase())
              ) {
                setAdminUser({
                  uid: firebaseAdmin.uid,
                  email: firebaseAdmin.email,
                  role: "admin",
                  isAdmin: true,
                  displayName: "المدير العام",
                } as UserProfile);
              }
            }
          } catch (e) {
            console.warn("Admin profile background sync:", e);
            const hardcoded = [
              "samesaeed456@gmail.com",
              "samisaeed2027@gmail.com",
              "samisaeed2025@gmail.com",
            ];
            if (
              firebaseAdmin.email &&
              hardcoded.includes(firebaseAdmin.email.toLowerCase())
            ) {
              setAdminUser({
                uid: firebaseAdmin.uid,
                email: firebaseAdmin.email,
                role: "admin",
                isAdmin: true,
                displayName: "المدير العام",
              } as UserProfile);
            }
          }
        } else {
          setAdminUser(null);
        }
      },
    );

    return () => {
      unsubscribe();
      unsubscribeAdmin();
      if (unsubUser) unsubUser();
    };
  }, []);

  // Super Admin Rescue & Admin Sync Logic
  useEffect(() => {
    if (user && isAuthReady) {
      const syncPermissions = async () => {
        try {
          // 1. Simple Role/Permissions Check (Single Collection 'users')
          const hardcodedAdmins = [
            "samesaeed456@gmail.com",
            "samisaeed2027@gmail.com",
            "samisaeed2025@gmail.com",
          ];
          const userEmail = (user.email || "").toLowerCase();
          const isHardcoded = hardcodedAdmins.includes(userEmail);

          if (isHardcoded) {
            // Super Admin Enforcement
            if (
              user.role !== "admin" ||
              user.adminRole !== "super_admin" ||
              !user.permissions?.includes("all")
            ) {
              const updates: any = {
                role: "admin",
                adminRole: "super_admin",
                isAdmin: true,
                permissions: ["all"],
                updatedAt: serverTimestamp(),
              };
              await setDoc(doc(db, "users", user.uid), updates, {
                merge: true,
              });
              setUser((prev) => (prev ? { ...prev, ...updates } : null));
              showToast("تم تحديث صلاحيات المدير العام", "success");
            }
          }
        } catch (e) {
          // Log but don't spam errors
          console.warn("Permission sync background check:", e);
        }
      };

      syncPermissions();
    }
  }, [user, isAuthReady]);

  // Sync Products from Firestore with Real-time Support
  useEffect(() => {
    // Only set loading if we don't have products yet (initial load only)
    const startedLoading = products.length === 0;
    if (startedLoading) {
      setIsLoading(true);
    }

    // Safety timeout: if Firestore doesn't respond within 30 seconds, stop loading and use cache
    const loadingTimeout = startedLoading ? setTimeout(() => {
      if (products.length === 0) {
        setIsLoading(false);
        const cached = localStorage.getItem("store_products");
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setProducts(data);
            showToast("تعذر الاتصال بقاعدة البيانات، تم تحميل البيانات المخزنة مؤقتاً", "info");
          } catch (e) {
            setProducts(initialProducts);
          }
        } else {
          setSystemError("تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت.");
        }
      }
    }, 30000) : null;
    
    // Determine admin status stably to avoid listener churn
    const currentAdminUid = adminAuth.currentUser?.uid;
    const activeDb = currentAdminUid ? adminDb : db;
    const productsRef = collection(activeDb, "products");
    const q = query(productsRef, orderBy("createdAt", "desc"), limit(300));

    // --- Meta-Document Pattern (Real-Time + Minimal Cost) ---
    // Single listener controls fetching for high-read collections
    const unsubMeta = onSnapshot(doc(activeDb, "settings", "store_meta"), async (docSnap) => {
      const meta = docSnap.data() || {};
      const serverProductsTs = meta.products_updated_at || 0;
      const serverCategoriesTs = meta.categories_updated_at || 0;

      // 1. Get local timestamps from localStorage
      const localProductsTs = parseInt(localStorage.getItem("store_meta_products_ts") || "0");
      const localCategoriesTs = parseInt(localStorage.getItem("store_meta_categories_ts") || "0");

      const hasLocalProducts = !!localStorage.getItem("store_products");
      const hasLocalCategories = !!localStorage.getItem("store_categories");

      const { getDocs, collection, limit } = await import("firebase/firestore");

      // 2. Fetch Products ONLY if server is newer OR no local data exists
      if (serverProductsTs > localProductsTs || !hasLocalProducts) {
        try {
          const snapshot = await getDocs(q);
          if (loadingTimeout) clearTimeout(loadingTimeout);
          
          const productsData = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: String(doc.id),
          })) as unknown as Product[];
          
          setProducts(productsData);
          localStorage.setItem("store_products", JSON.stringify(productsData));
          localStorage.setItem("store_meta_products_ts", serverProductsTs.toString());
          
          if (startedLoading) setIsLoading(false);
        } catch (error: any) {
          if (loadingTimeout) clearTimeout(loadingTimeout);
          console.error("Products fetch error:", error);
          if (startedLoading) setIsLoading(false);
        }
      } else {
        // Up to date!
        if (loadingTimeout) clearTimeout(loadingTimeout);
        if (startedLoading) setIsLoading(false);
      }

      // 3. Fetch Categories ONLY if server is newer OR no local data exists
      if (serverCategoriesTs > localCategoriesTs || !hasLocalCategories) {
        try {
          const catQ = query(collection(activeDb, "categories"), limit(300));
          const snapshot = await getDocs(catQ);
          const categoriesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Category[];
          
          setCategories(categoriesData);
          localStorage.setItem("store_categories", JSON.stringify(categoriesData));
          localStorage.setItem("store_meta_categories_ts", serverCategoriesTs.toString());
        } catch (error) {
          console.error("Categories fetch error:", error);
        }
      }
    });

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      unsubMeta();
    };
    // Only re-run if role changes or admin identity changes
  }, [user?.role, adminAuth.currentUser?.uid]);

  // Sanitize local states against actual products list to remove deleted items
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const productIds = new Set(products.map((p) => p.id));

      setRecentlyViewed((prev) => {
        const filtered = prev.filter((p) => productIds.has(p.id));
        return filtered.length !== prev.length ? filtered : prev;
      });

      setWishlist((prev) => {
        const filtered = prev.filter((p) => productIds.has(p.id));
        return filtered.length !== prev.length ? filtered : prev;
      });

      setCart((prev) => {
        const filtered = prev.filter((item) =>
          productIds.has(item.product.id),
        );
        return filtered.length !== prev.length ? filtered : prev;
      });
    }
  }, [products, isLoading]);

  // Sync Orders from Firestore with Real-time Support
  useEffect(() => {
    const activeAdmin =
      adminUser?.role === "admin" || adminUser?.isAdmin
        ? adminUser
        : user?.role === "admin"
          ? user
          : null;

    if (!auth.currentUser && !adminAuth.currentUser && !activeAdmin) {
      setOrders([]);
      return;
    }

    const activeDb = adminAuth.currentUser ? adminDb : db;
    const ordersRef = collection(activeDb, "orders");
    
    // Determine query based on role
    const q = activeAdmin
      ? query(ordersRef, orderBy("date", "desc"), limit(50))
      : query(
          ordersRef,
          where("userId", "==", auth.currentUser?.uid || "guest"),
          orderBy("date", "desc"),
          limit(50),
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as Order[];
      setOrders(ordersData);
      localStorage.setItem("store_orders", JSON.stringify(ordersData));
    }, (error) => {
      if (error.code === "permission-denied") return;
      console.error("Orders real-time sync error:", error);
    });

    return () => unsubscribe();
    // Only re-run if roles or user identity change, or admin login status changes
  }, [user?.role, user?.uid, adminUser?.role, adminUser?.uid, adminAuth.currentUser?.uid]);

  // Sync Admin-only Data
  useEffect(() => {
    const activeAdmin =
      adminUser?.role === "admin" || adminUser?.isAdmin
        ? adminUser
        : user?.role === "admin"
          ? user
          : null;
    const activeDb = adminAuth.currentUser ? adminDb : db;

    if (!isAuthReady) return;

    if (!activeAdmin) {
      setCustomers([]);
      setActivityLogs([]);
      setAdminUsers([]);
      return;
    }

    const now = Date.now();
    if (now - lastAdminDataFetch.current < 60000) {
      // Throttle: don't re-fetch admin metrics within 1 minute of last fetch
      return;
    }

    // Use getDocs instead of onSnapshot for heavy admin collections to save 100% of continuous read costs
    const fetchAdminData = async () => {
      try {
        const isCurrentAdmin =
          adminAuth.currentUser || (auth.currentUser && user?.role === "admin");
        if (!isCurrentAdmin) return;

        lastAdminDataFetch.current = Date.now();

        const currentUid = auth.currentUser?.uid || adminAuth.currentUser?.uid;

        // Fetch Users once per load (Limited to prevent quota issues)
        try {
          const snapshot = await getDocs(
            query(collection(activeDb, "users"), limit(50)),
          );
          const allUsersData = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          })) as unknown as UserProfile[];
          const adminsList = allUsersData
            .filter((u) => u.role === "admin" || u.isAdmin === true)
            .map((u) => ({
              id: u.uid,
              name: u.displayName || u.name || "",
              email: u.email || "",
              phone: u.phone || "",
              countryCode: u.countryCode || "+967",
              role: u.adminRole || u.role || "support",
              isActive: (u as any).isActive ?? true,
              permissions: u.permissions || [],
              createdAt: u.createdAt,
            }));
          const customersList = allUsersData.filter(
            (u) => u.role !== "admin" && !u.isAdmin,
          );
          setAdminUsers(adminsList as any);
          setCustomers(customersList);
          localStorage.setItem(
            "store_customers",
            JSON.stringify(customersList),
          );
          localStorage.setItem("app_users", JSON.stringify(customersList));
          localStorage.setItem("admin_users_list", JSON.stringify(adminsList));
        } catch (error: any) {
          if (error.code !== "permission-denied") console.error(error);
        }

        // Fetch Logs
        try {
          const snapshot = await getDocs(
            query(
              collection(activeDb, "activity_logs"),
              orderBy("date", "desc"),
              limit(50),
            ),
          );
          const logsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as ActivityLog[];
          const sortedLogs = logsData.sort((a, b) => {
            const dateA = (a.date as any)?.seconds
              ? (a.date as any).seconds
              : new Date(a.date).getTime();
            const dateB = (b.date as any)?.seconds
              ? (b.date as any).seconds
              : new Date(b.date).getTime();
            return dateB - dateA;
          });
          setActivityLogs(sortedLogs);
          localStorage.setItem(
            "store_activity_logs",
            JSON.stringify(sortedLogs),
          );
        } catch (error: any) {}

        // Fetch Support Tickets
        try {
          const snapshot = await getDocs(
            query(
              collection(activeDb, "support_tickets"),
              orderBy("createdAt", "desc"),
              limit(50),
            ),
          );
          const ticketsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as SupportTicket[];
          setSupportTickets(ticketsData);
          localStorage.setItem("store_tickets", JSON.stringify(ticketsData));
        } catch (error: any) {}

        // Fetch Visits
        try {
          const snapshot = await getDocs(
            query(
              collection(activeDb, "visits"),
              orderBy("timestamp", "desc"),
              limit(50),
            ),
          );
          const visitsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as Visit[];
          setVisits(visitsData);
          localStorage.setItem("store_visits", JSON.stringify(visitsData));
        } catch (error: any) {}

        // Fetch Search Terms
        try {
          const snapshot = await getDocs(
            query(
              collection(activeDb, "searchTerms"),
              orderBy("timestamp", "desc"),
              limit(50),
            ),
          );
          const termsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as SearchTerm[];
          setSearchTerms(termsData);
          localStorage.setItem("store_search_terms", JSON.stringify(termsData));
        } catch (error: any) {}

        // Fetch Abandoned Carts
        try {
          const snapshot = await getDocs(
            query(
              collection(activeDb, "abandonedCarts"),
              orderBy("lastActive", "desc"),
              limit(50),
            ),
          );
          const cartsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as AbandonedCart[];
          setAbandonedCarts(cartsData);
          localStorage.setItem(
            "store_abandoned_carts",
            JSON.stringify(cartsData),
          );
        } catch (error: any) {}

        // Fetch Inventory Logs
        try {
          const snapshot = await getDocs(
            query(
              collection(activeDb, "inventory_logs"),
              orderBy("date", "desc"),
              limit(50),
            ),
          );
          const logsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as InventoryLog[];
          setInventoryLogs(
            logsData
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .slice(0, 1000),
          );
          localStorage.setItem(
            "store_inventory_logs",
            JSON.stringify(logsData.slice(0, 500)),
          );
        } catch (error: any) {
          if (
            error.code === "resource-exhausted" ||
            error?.message?.includes("Quota")
          ) {
            console.warn(`Admin data fetch alert: Quota exceeded.`);
          } else {
            console.error("Admin data fetch error:", error);
          }
        }
      } catch (err: any) {
        if (
          err.code === "resource-exhausted" ||
          err?.message?.includes("Quota")
        ) {
          console.warn("Admin data fetch alert: Quota exceeded.");
        } else {
          console.error("Admin data fetch error:", err);
        }
      }
    };

    fetchAdminData();

    return () => {};
  }, [user, adminUser, isAuthReady]);

  // Sync Public Data
  useEffect(() => {
    const activeDb = adminAuth.currentUser ? adminDb : db;
    const isAdmin = !!adminAuth.currentUser || user?.role === "admin";
    const now = Date.now();
    let isInitialMarketingSync = true;

    const syncCollection = async (
      colName: string,
      setter: (data: any) => void,
      storageKey: string
    ) => {
      try {
        const { getDocs } = await import("firebase/firestore");
        const q = query(collection(activeDb, colName), limit(300));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setter(data);
        localStorage.setItem(storageKey, JSON.stringify(data));
        localStorage.setItem(`${storageKey}_time`, Date.now().toString());
      } catch (error: any) {
        if (error.code === "permission-denied") return;
        console.error(`Fetch error for ${colName}:`, error);
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          try {
            setter(JSON.parse(cached));
          } catch (e) {}
        }
      }
    };

    // Categories are now synced via the Meta-Document listener above
    syncCollection("coupons", setCoupons, "store_coupons");
    syncCollection("blog_posts", setBlogPosts, "store_blog");
    syncCollection("static_pages", setStaticPages, "store_pages");
    syncCollection("shipping_zones", setShippingZones, "store_shipping_zones");
    syncCollection("banners", setBanners, "store_banners");
    
    const unsubSettings = onSnapshot(doc(activeDb, "settings", "store"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as StoreSettings;
        setSettings(data);
        localStorage.setItem("store_settings", JSON.stringify(data));
        localStorage.setItem("store_settings_time", Date.now().toString());
      }
    });

    const fetchMarketingData = async () => {
      try {
        const { getDocs } = await import("firebase/firestore");
        const snapshot = await getDocs(query(collection(activeDb, "marketing_notifications"), orderBy("date", "desc"), limit(50)));
        const rawUser = localStorage.getItem("store_user");
        let userRegistrationTime = 0;
        if (rawUser) {
          try {
            const u = JSON.parse(rawUser);
            if (u.createdAt) userRegistrationTime = new Date(u.createdAt).getTime();
          } catch (e) {}
        }

        const allData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as MarketingNotification[];
        
        const filteredData = allData.filter((notif) => {
          if (userRegistrationTime === 0) return true;
          const notifDate = new Date(notif.date || new Date().toISOString()).getTime();
          return notifDate >= userRegistrationTime;
        });

        setMarketingNotifications(filteredData);
        localStorage.setItem("store_marketing_notifications", JSON.stringify(filteredData));
      } catch (e) {}
    };
    fetchMarketingData();

    return () => {
      unsubSettings();
    };
    // Only re-run on authentication state or environment change
  }, [isAuthReady, user?.role, adminUser?.role, adminAuth.currentUser?.uid]);

  // Sync cart to abandonedCarts for abandoned cart notifications
  useEffect(() => {
    if (!user || cart.length === 0) return;

    const timeoutId = setTimeout(async () => {
      try {
        const cartId = user.uid || user.phone;
        const total = cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );

        await setDoc(doc(db, "abandonedCarts", cartId), {
          id: cartId,
          userId: user.uid || null,
          customerName: user.displayName || user.name || "عميل",
          customerPhone: user.phone || "",
          items: cart.map((item) => ({
            productId: item.id.split("-")[0], // Extract real product ID
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image,
          })),
          total,
          date: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          recovered: false,
        });
      } catch (error) {
        console.error("Failed to sync abandoned cart:", error);
      }
    }, 10000); // 10 second debounce to avoid excessive writes

    return () => clearTimeout(timeoutId);
  }, [cart, user]);

  const [discount, setDiscount] = useState<{
    code: string | null;
    amount: number;
    type: "percentage" | "fixed";
    pointsUsed?: number;
  }>({
    code: null,
    amount: 0,
    type: "percentage",
  });

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

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    const saved = localStorage.getItem("store_recently_viewed");
    return saved ? JSON.parse(saved) : [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem("store_coupons");
    return saved ? JSON.parse(saved) : [];
  });

  const [language, setLanguageState] = useState<"ar" | "en">(() => {
    const saved = localStorage.getItem("store_language");
    return (saved as "ar" | "en") || "ar";
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem("store_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure new statuses are included for existing users
      if (
        parsed.autoNotifications &&
        parsed.autoNotifications.onStatusChange &&
        !parsed.autoNotifications.onStatusChange.includes("pending")
      ) {
        parsed.autoNotifications.onStatusChange = Array.from(
          new Set([
            ...parsed.autoNotifications.onStatusChange,
            "pending",
            "processing",
          ]),
        );
      }
      return parsed;
    }
    return {
      storeName: "متجري",
      contactEmail: "",
      contactPhone: "",
      contactPhone2: "",
      address: "",
      socialMedia: {
        instagram: "",
        twitter: "",
        facebook: "",
        whatsapp: "",
        tiktok: "",
        youtube: "",
      },
      shippingFee: 0,
      freeShippingThreshold: 0,
      currency: "YER",
      language: "ar",
      isMaintenanceMode: false,
      maintenanceMessage: "المتجر في وضع الصيانة حالياً. سنعود قريباً!",
      announcementText: "",
      primaryColor: "#000000",
      fontFamily: "Inter",
      homeSectionOrder: [
        "hero",
        "categories",
        "deals",
        "featured",
        "new_arrivals",
        "category_sliders",
      ],
      seo: {
        metaTitle: "متجر النخبة للإلكترونيات",
        metaDescription:
          "الرؤية الجديدة للطاقة الشمسية والإلكترونيات الذكية في اليمن",
        favicon: "/favicon.svg",
        ogImage: "/favicon.svg",
      },
      autoNotifications: {
        enabled: true,
        email: true,
        onStatusChange: [
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ],
      },
      paymentMethods: [
        {
          id: "wallet",
          name: "المحفظة",
          type: "wallet",
          isActive: true,
          requiresProof: false,
        },
      ],
    };
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem("store_tickets");
    return saved ? JSON.parse(saved) : [];
  });

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem("store_blog");
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

  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(() => {
    const saved = localStorage.getItem("store_abandoned_carts");
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

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("store_activity_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("store_categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

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

  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() => {
    const saved = localStorage.getItem("store_inventory_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = React.useCallback(
    (
      message: string,
      type: "success" | "error" | "info" = "success",
      options?: {
        image?: string;
        action?: { label: string; onClick: () => void };
      },
    ) => {
      if (!message) return;

      const hasCustomContent = options?.image || options?.action;

      const toastContent = hasCustomContent ? (
        <div className="flex items-center justify-between w-full gap-3 py-0.5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {options?.image && (
              <img
                src={options.image || undefined}
                alt="toast-img"
                className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
              />
            )}
            <span className="text-sm font-medium text-white truncate">
              {message}
            </span>
          </div>
          {options?.action && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                options.action!.onClick();
                sonnerToast.dismiss();
              }}
              className="text-[10px] font-bold bg-gold-gradient text-black px-4 py-2 rounded-full whitespace-nowrap hover:scale-105 transition-transform shrink-0 shadow-gold"
            >
              {options.action.label}
            </button>
          )}
        </div>
      ) : (
        message
      );

      const toastOptions = {
        icon:
          type === "success" ? (
            <div className="w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center shrink-0 shadow-gold">
              <svg
                className="w-3.5 h-3.5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : undefined,
      };

      if (type === "error") {
        sonnerToast.error(toastContent, toastOptions);
      } else if (type === "info") {
        sonnerToast.info(toastContent, toastOptions);
      } else {
        sonnerToast.success(toastContent, toastOptions);
      }
    },
    [],
  );

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

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
  }, []);

  const installPWA = React.useCallback(async () => {
    if (!deferredPrompt) {
      showToast(
        "التطبيق مثبت بالفعل أو المتصفح لا يدعم التثبيت المباشر",
        "info",
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      showToast("شكراً لتثبيت تطبيق متجر النخبة!");
      setCanInstallPWA(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, showToast]);

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
    localStorage.setItem(
      "store_marketing_notifications",
      JSON.stringify(marketingNotifications),
    );
  }, [marketingNotifications]);

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
    async (action: string, details: string) => {
      try {
        const adminEmail = localStorage.getItem("admin_email");
        const adminName = localStorage.getItem("admin_name");
        const activeDb = adminAuth.currentUser ? adminDb : db;

        const ip = "127.0.0.1";

        const logData = {
          userId: adminEmail || user?.uid || user?.phone || "system",
          userName: adminName || user?.name || user?.displayName || "النظام",
          action,
          details,
          date: serverTimestamp(),
          ip,
        };

        await addDoc(collection(activeDb, "activity_logs"), logData);
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    },
    [user],
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
          setLanguageState(newSettings.language);
        }

        setSettings(updated);
        showToast("تم تحديث إعدادات المتجر بنجاح", "success");
        logActivity("تحديث الإعدادات", "قام المدير بتحديث إعدادات المتجر");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, "settings/store");
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

  const addBlogPost = React.useCallback(
    async (post: Omit<BlogPost, "id">) => {
      try {
        const newPostRef = doc(collection(db, "blog_posts"));
        await setDoc(newPostRef, {
          ...post,
          id: newPostRef.id,
          createdAt: serverTimestamp(),
        });
        logActivity("إضافة مقال", `تم إضافة المقال ${post.title}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "blog_posts");
      }
    },
    [logActivity],
  );

  const updateBlogPost = React.useCallback(
    async (id: string, post: Partial<BlogPost>) => {
      try {
        const oldPost = blogPosts.find((p) => p.id === id);
        if (oldPost && post.image && oldPost.image !== post.image) {
          deleteImagesFromCloudinary([oldPost.image]);
        }

        await updateDoc(doc(db, "blog_posts", id), {
          ...post,
          updatedAt: serverTimestamp(),
        });
        logActivity("تحديث مقال", `تم تحديث المقال ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `blog_posts/${id}`);
      }
    },
    [blogPosts, logActivity],
  );

  const deleteBlogPost = React.useCallback(
    async (id: string) => {
      try {
        const postToDelete = blogPosts.find((p) => p.id === id);
        if (postToDelete && postToDelete.image) {
          deleteImagesFromCloudinary([postToDelete.image]);
        }

        await deleteDoc(doc(db, "blog_posts", id));
        logActivity("حذف مقال", `تم حذف المقال ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `blog_posts/${id}`);
      }
    },
    [blogPosts, logActivity],
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
            const pRef = doc(activeDb, "products", p.id);
            batch.update(pRef, {
              price: newPrice,
              originalPrice: p.price,
              updatedAt: serverTimestamp(),
            });
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
    [showToast, logActivity],
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
    [showToast, logActivity],
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
          if (paymentMethod === "المحفظة الرقمية" && auth.currentUser) {
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

            validatedItems.push({
              ...item,
              product: {
                ...item.product,
                name: sourceProduct.name || item.product.name,
                price: sourceProduct.price,
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
            const zone = city
              ? shippingZones.find((z) => z.cities.includes(city))
              : null;
            if (zone) {
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

          const total = roundMoney(
            Math.max(0, subtotal + shipping - discountAmount),
          );

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
          const now = new Date();
          const yy = String(now.getFullYear()).slice(-2);
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const dd = String(now.getDate()).padStart(2, "0");
          const id = `NKH-${yy}${mm}${dd}-${nextSeq}`;

          // G. PERFORM ALL WRITES
          // Helper to remove undefined for Firestore
          const cleanData = (obj: any) => {
            const newObj: any = {};
            Object.keys(obj).forEach((key) => {
              if (obj[key] !== undefined) newObj[key] = obj[key];
            });
            return newObj;
          };

          // 1. Create Order
          const newOrderData = cleanData({
            id: id,
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
            shippingMethod,
            deliveryInstructions: deliveryInstructions || null,
            currency: BASE_CURRENCY_CODE || "YER",
          });

          transaction.set(doc(db, "orders", id), newOrderData);

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

          // 4. Update Wallet
          if (userRef) {
            transaction.update(userRef, {
              walletBalance: newUserBalance,
              updatedAt: serverTimestamp(),
            });
          }

          // 5. Update Coupon
          if (couponRefToUpdate) {
            transaction.update(couponRefToUpdate, { usedCount: newUsedCount });
          }

          return id;
        });

        // G. Post-Order cleanup (outside transaction)
        if (auth.currentUser) {
          deleteDoc(doc(db, "abandonedCarts", auth.currentUser.uid)).catch(
            () => {},
          );
        }
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
      try {
        const orderToDelete = orders.find((o) => o.id === id);
        if (orderToDelete && orderToDelete.paymentProof) {
          deleteImagesFromCloudinary([orderToDelete.paymentProof]);
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        await deleteDoc(doc(activeDb, "orders", id));
        showToast("تم حذف الطلب بنجاح", "success");
        logActivity("حذف طلب", `تم حذف الطلب رقم: ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
      }
    },
    [orders, showToast, logActivity],
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
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      await auth.signOut();
      setUser(null);
      setWishlist([]);
      showToast("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [showToast]);

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
      try {
        if (!identifier) {
          showToast("معرف العميل غير صالح", "error");
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
        showToast("تم حذف العميل بنجاح");
        logActivity("حذف عميل", `تم حذف العميل: ${identifier}`);
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `users: ${identifier}`,
        );
      }
    },
    [showToast, logActivity],
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
      // Optionally sync to Firestore if notification is user-specific
      // Currently notifications appear to be local or pushed via marketing_notifications
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

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
  }, []);

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
      return [];
    });
  }, []);

  const updateNotificationSettings = React.useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setNotificationSettings((prev) => ({ ...prev, ...newSettings }));
      showToast("تم تحديث إعدادات الإشعارات");
    },
    [showToast],
  );

  const trackOrderById = React.useCallback(async (orderId: string) => {
    try {
      // 1. Try exact match
      let orderRef = doc(db, "orders", orderId);
      let orderSnap = await getDoc(orderRef);

      // 2. Try uppercase match if exact fails (common for sequential IDs like NKH-...)
      if (!orderSnap.exists()) {
        orderRef = doc(db, "orders", orderId.toUpperCase());
        orderSnap = await getDoc(orderRef);
      }

      if (orderSnap.exists()) {
        return { id: orderSnap.id, ...orderSnap.data() } as Order;
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

  const setLanguage = React.useCallback(
    (lang: "ar" | "en") => {
      setLanguageState(lang);
      showToast(
        lang === "ar"
          ? "تم تغيير اللغة إلى العربية"
          : "Language changed to English",
      );
    },
    [showToast],
  );

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

      const productToDelete = products.find((p) => p.id === id);

      // Optimistic UI update
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setRecentlyViewed((prev) => prev.filter((p) => p.id !== id));
      setWishlist((prev) => prev.filter((p) => p.id !== id));
      setCart((prev) => prev.filter((item) => item.product.id !== id));

      try {
        // Automatic Cloud Cleanup
        if (productToDelete) {
          deleteImagesFromCloudinary([
            productToDelete.image,
            ...(productToDelete.images || []),
          ]);
        }

        const activeDb = adminAuth.currentUser ? adminDb : db;
        await deleteDoc(doc(activeDb, "products", String(id)));
        await setDoc(doc(activeDb, "settings", "store_meta"), {
          products_updated_at: Date.now()
        }, { merge: true }).catch(() => {});
        showToast("تم حذف المنتج بنجاح");
        logActivity("حذف منتج", `تم حذف المنتج ID: ${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    },
    [showToast, logActivity],
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
      activityLogs,
      supportTickets,
      blogPosts,
      staticPages,
      shippingZones,
      abandonedCarts,
      searchTerms,
      visits,
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
      activityLogs,
      supportTickets,
      blogPosts,
      staticPages,
      shippingZones,
      abandonedCarts,
      searchTerms,
      visits,
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
      addBlogPost,
      updateBlogPost,
      deleteBlogPost,
      updateStaticPage,
      addShippingZone,
      updateShippingZone,
      deleteShippingZone,
      toggleShippingZoneStatus,
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
      addBlogPost,
      updateBlogPost,
      deleteBlogPost,
      updateStaticPage,
      addShippingZone,
      updateShippingZone,
      deleteShippingZone,
      toggleShippingZoneStatus,
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
