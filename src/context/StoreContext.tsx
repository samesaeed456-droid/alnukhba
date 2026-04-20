import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { 
  Product, CartItem, UserProfile, Order, NotificationSubscription, 
  AppNotification, Coupon, NotificationSettings, Category, StoreSettings, InventoryLog,
  UserNote, Transaction, Banner, MarketingNotification, AdminUser, ActivityLog, AdminRole, AdminPermission,
  SupportTicket, BlogPost, StaticPage, ShippingZone, AbandonedCart, SearchTerm, Visit
} from '../types';
import { products as initialProducts } from '../data';
import { getAIRecommendations, getRuleBasedRecommendations } from '../services/recommendationService';
import { roundMoney, formatMoney, BASE_CURRENCY_CODE } from '../lib/finance';

import { notificationService } from '../services/notificationService';
import { smsService } from '../services/smsService';

import { 
  auth, db, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, 
  onAuthStateChanged, serverTimestamp, increment, OperationType, handleFirestoreError, getDocFromServer, writeBatch, runTransaction 
} from '../lib/firebase';

interface StoreContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
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
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  placeOrder: (paymentMethod: string, shippingMethod?: 'delivery' | 'pickup', paymentReference?: string, customerName?: string, customerPhone?: string, shippingAddress?: string) => string;
  updateOrderStatus: (orderId: string, status: Order['status'], isRevert?: boolean) => Promise<void>;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  updateUser: (user: UserProfile) => void;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  customers: UserProfile[];
  addCustomer: (customer: UserProfile) => void;
  deleteCustomer: (phone: string) => void;
  updateCustomerBalance: (phone: string, amount: number, description: string) => void;
  addCustomerNote: (phone: string, note: string) => void;
  updateStock: (productId: string, newStock: number, reason?: string) => void;
  bulkUpdateStock: (updates: { productId: string, newStock: number }[], reason?: string) => void;
  inventoryLogs: InventoryLog[];
  discount: { code: string | null; amount: number; type: 'percentage' | 'fixed'; pointsUsed?: number };
  applyDiscountCode: (code: string) => boolean;
  removeDiscount: () => void;
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount'>) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>, showToastMsg?: boolean) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponStatus: (id: string) => void;
  subscribeToProduct: (productId: string, type: 'back_in_stock' | 'on_sale', email: string) => void;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  banners: Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  marketingNotifications: MarketingNotification[];
  sendMarketingNotification: (notification: Omit<MarketingNotification, 'id' | 'date' | 'sentCount' | 'openedCount' | 'clickedCount' | 'status'>) => void;
  adminUsers: AdminUser[];
  addAdminUser: (admin: Omit<AdminUser, 'id'>) => void;
  updateAdminUser: (id: string, admin: Partial<AdminUser>, logDetails?: string) => void;
  deleteAdminUser: (id: string) => void;
  activityLogs: ActivityLog[];
  logActivity: (action: string, details: string) => void;
  supportTickets: SupportTicket[];
  addTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'replies' | 'status'>) => void;
  updateTicketStatus: (id: string, status: SupportTicket['status']) => void;
  replyToTicket: (id: string, message: string) => void;
  deleteTicket: (id: string) => void;
  blogPosts: BlogPost[];
  addBlogPost: (post: Omit<BlogPost, 'id'>) => void;
  updateBlogPost: (id: string, post: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  staticPages: StaticPage[];
  updateStaticPage: (id: string, content: string) => void;
  shippingZones: ShippingZone[];
  addShippingZone: (zone: Omit<ShippingZone, 'id' | 'isActive'>) => void;
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
  showToast: (message: string, type?: 'success' | 'error' | 'info', options?: { image?: string, action?: { label: string, onClick: () => void } }) => void;
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
  language: 'ar' | 'en';
  settings: StoreSettings;
  categories: Category[];
  inventoryLogs: InventoryLog[];
  customers: UserProfile[];
  banners: Banner[];
  marketingNotifications: MarketingNotification[];
  adminUsers: AdminUser[];
  activityLogs: ActivityLog[];
  discount: { code: string | null; amount: number; type: 'percentage' | 'fixed'; pointsUsed?: number };
  coupons: Coupon[];
  supportTickets: SupportTicket[];
  blogPosts: BlogPost[];
  staticPages: StaticPage[];
  shippingZones: ShippingZone[];
  abandonedCarts: AbandonedCart[];
  searchTerms: SearchTerm[];
  visits: Visit[];
  systemError: string | null;
}

interface StoreActions {
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addToRecentlyViewed: (product: Product) => void;
  getRecommendations: (currentProduct?: Product) => Promise<Product[]>;
  getRuleBasedRecommendations: (currentProduct?: Product) => Product[];
  setLanguage: (lang: 'ar' | 'en') => void;
  updateStock: (productId: string, newStock: number, reason?: string) => void;
  bulkUpdateStock: (updates: { productId: string, newStock: number }[], reason?: string) => void;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  sendMarketingNotification: (notification: Omit<MarketingNotification, 'id' | 'date' | 'sentCount' | 'openedCount' | 'clickedCount' | 'status'>) => void;
  addAdminUser: (admin: Omit<AdminUser, 'id'>) => void;
  updateAdminUser: (id: string, admin: Partial<AdminUser>, logDetails?: string) => void;
  deleteAdminUser: (id: string) => void;
  logActivity: (action: string, details: string) => void;
  addTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'replies' | 'status'>) => void;
  updateTicketStatus: (id: string, status: SupportTicket['status']) => void;
  replyToTicket: (id: string, message: string) => void;
  deleteTicket: (id: string) => void;
  addBlogPost: (post: Omit<BlogPost, 'id'>) => void;
  updateBlogPost: (id: string, post: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  updateStaticPage: (id: string, content: string) => void;
  addShippingZone: (zone: Omit<ShippingZone, 'id' | 'isActive'>) => void;
  updateShippingZone: (id: string, zone: Partial<ShippingZone>) => void;
  deleteShippingZone: (id: string) => void;
  toggleShippingZoneStatus: (id: string) => void;
  trackSearch: (term: string, resultsCount: number) => void;
  trackVisit: (page: string) => void;
  bulkUpdatePrices: (category: string, percentage: number) => void;
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  placeOrder: (
    paymentMethod: string, 
    shippingMethod?: 'delivery' | 'pickup', 
    paymentReference?: string, 
    customerName?: string, 
    customerPhone?: string, 
    shippingAddress?: string,
    city?: string,
    deliveryInstructions?: string,
    paymentProof?: string
  ) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  updateUser: (user: UserProfile) => void;
  logout: () => void;
  updateCustomer: (phone: string, updates: Partial<UserProfile>) => void;
  blockCustomer: (phone: string) => void;
  addCustomer: (customer: UserProfile) => void;
  deleteCustomer: (phone: string) => void;
  updateCustomerBalance: (phone: string, amount: number, description: string) => void;
  addCustomerNote: (phone: string, note: string) => void;
  applyDiscountCode: (code: string) => boolean;
  removeDiscount: () => void;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount'>) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>, showToastMsg?: boolean) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponStatus: (id: string) => void;
  subscribeToProduct: (productId: string, type: 'back_in_stock' | 'on_sale', email: string) => void;
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
  showToast: (message: string, type?: 'success' | 'error' | 'info', options?: { image?: string, action?: { label: string, onClick: () => void } }) => void;
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

import { migrateLocalDataToFirebase } from '../lib/migrateData';

import { getAdminDummyEmail } from '../lib/adminAuth';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('store_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deduplicate products by id and ensure string IDs
        const uniqueProducts = Array.from(new Map(parsed.map((p: any) => [String(p.id), { ...p, id: String(p.id) }])).values()) as Product[];
        return uniqueProducts;
      } catch (e) {
        // Fallback to initial products if parsing fails
      }
    }
    // Empty initial products
    return [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('store_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          id: item.id || `${item.product?.id || Date.now()}-${item.selectedColor || 'default'}-${item.selectedSize || 'default'}`
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const savedGuest = localStorage.getItem('store_wishlist');
    const savedUser = localStorage.getItem('store_user');
    const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
    
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
    return Array.from(new Map(loadedWishlist.map((p: any) => [String(p.id), { ...p, id: String(p.id) }])).values()) as Product[];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('store_orders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('store_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);

  // Connection check removed per user request
  useEffect(() => {
    // Intentionally empty
  }, []);
  useEffect(() => {
    if (!isAuthReady || !user || user.role !== 'admin') return;

    const hasMigrated = localStorage.getItem('has_migrated_to_firebase');
    if (!hasMigrated) {
      migrateLocalDataToFirebase().then((success) => {
        if (success) {
          localStorage.setItem('has_migrated_to_firebase', 'true');
        }
      });
    }
  }, [isAuthReady, user]);

  // Firebase Auth Listener
  useEffect(() => {
    let unsubUser: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set up real-time listener for user document
        unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = { ...docSnap.data(), uid: docSnap.id } as UserProfile;
            setUser(userData);
            localStorage.setItem('store_user', JSON.stringify(userData));
          } else {
            // Gentle creation: only set essential and firebase-provided fields with merge:true
            // to avoid overwriting fields (like name/phone) being simultaneously saved by Auth.tsx
            const defaultData: any = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'user',
              createdAt: serverTimestamp()
            };
            
            if (firebaseUser.displayName) defaultData.displayName = firebaseUser.displayName;
            if (firebaseUser.photoURL) defaultData.photoURL = firebaseUser.photoURL;

            setDoc(doc(db, 'users', firebaseUser.uid), defaultData, { merge: true })
              .catch(error => console.error("Error creating fallback profile:", error));

            // Don't set user state here with empty fields, let the snapshot update it naturally
            // once Auth.tsx finishes its true save, or this setDoc finishes.
          }
          setIsAuthReady(true);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setIsAuthReady(true);
        });
      } else {
        if (unsubUser) unsubUser();
        setUser(null);
        localStorage.removeItem('store_user');
        setIsAuthReady(true);
      }
    });
    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
    };
  }, []);

  // Super Admin Rescue Logic
  useEffect(() => {
    if (user) {
      // If the owner's email matches, force super_admin regardless of current role
      const ownerEmails = ['samesaeed456@gmail.com'];
      const ownerPhones = ['776668370', '967776668370', '+967776668370'];
      
      const isOwner = 
        ownerEmails.includes(user.email) || 
        user.email.includes('elite-store.local') ||
        (user.phone && ownerPhones.some(p => user.phone?.includes(p)));

      if (isOwner) {
         const checkIfShouldBeSuper = async () => {
           try {
             const adminQuery = query(collection(db, 'admin_users'), where('email', '==', user.email));
             const adminSnap = await getDocs(adminQuery);
             
             // If we didn't find by email, try falling back to finding by phone
             let adminDocId = user.uid;
             let currentRole = null;

             if (adminSnap && !adminSnap.empty && adminSnap.docs && adminSnap.docs.length > 0) {
               adminDocId = adminSnap.docs[0].id;
               currentRole = adminSnap.docs[0].data().role;
             } else {
                // Not found by email, try phone
                const dummyEmail = getAdminDummyEmail(user.phone || '', '+967');
                const adminPhoneQuery = query(collection(db, 'admin_users'), where('email', '==', dummyEmail));
                const adminPhoneSnap = await getDocs(adminPhoneQuery);
                if (adminPhoneSnap && !adminPhoneSnap.empty && adminPhoneSnap.docs && adminPhoneSnap.docs.length > 0) {
                  adminDocId = adminPhoneSnap.docs[0].id;
                  currentRole = adminPhoneSnap.docs[0].data().role;
                }
             }
             
             // If they don't even exist in admin_users or are downgraded
             if (currentRole !== 'super_admin') {
               console.log("Owner detected by phone/email! Forcing permissions...");
               
               await setDoc(doc(db, 'admin_users', adminDocId), {
                 id: user.uid,
                 name: user.displayName || user.name || 'المدير العام',
                 email: user.email,
                 phone: user.phone || '776668370',
                 role: 'super_admin',
                 isActive: true,
                 permissions: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security', 'view_logs', 'manage_logistics', 'manage_messages']
               }, { merge: true });

               await updateDoc(doc(db, 'users', user.uid), {
                 role: 'admin',
                 adminRole: 'super_admin'
               });
               
               showToast('تمت استعادة صلاحيات المدير العام بنجاح', 'success');
               // Force a real reload
               window.location.reload();
             }
           } catch (e) {
             console.error("Rescue failed:", e);
           }
         };
         checkIfShouldBeSuper();
      }
    }
  }, [user]);

  // Sync Products from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: String(doc.id) 
        };
      }) as unknown as Product[];
      setProducts(productsData);
      localStorage.setItem('store_products', JSON.stringify(productsData));
    }, (error) => {
      console.error('Products sync error:', error);
      // setSystemError('فشل مزامنة المنتجات. يرجى التحقق من الاتصال.');
    });
    return () => unsubscribe();
  }, []);

  // Sync Orders from Firestore
  useEffect(() => {
    if (!auth.currentUser || !user) {
      setOrders([]);
      return;
    }

    // If admin, sync ALL orders. If user, sync only THEIR orders.
    const ordersRef = collection(db, 'orders');
    const q = user.role === 'admin' 
      ? query(ordersRef) 
      : query(ordersRef, where('userId', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Order[];
      setOrders(ordersData);
    }, (error) => {
      console.error('Orders sync error:', error);
      // Don't set global system error for orders to avoid blocking the whole app
    });
    return () => unsubscribe();
  }, [user]);

  // Sync Admin-only Data
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setCustomers([]);
      setActivityLogs([]);
      setAdminUsers([]);
      return;
    }

    const unsubCustomers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as unknown as UserProfile[];
      setCustomers(customersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubLogs = onSnapshot(collection(db, 'activity_logs'), (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as ActivityLog[];
      setActivityLogs(logsData.sort((a, b) => {
        const dateA = (a.date as any)?.seconds ? (a.date as any).seconds : new Date(a.date).getTime();
        const dateB = (b.date as any)?.seconds ? (b.date as any).seconds : new Date(b.date).getTime();
        return dateB - dateA;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'activity_logs'));

    const unsubAdmins = onSnapshot(collection(db, 'admin_users'), (snapshot) => {
      const adminsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as AdminUser[];
      setAdminUsers(adminsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'admin_users'));

    const unsubTickets = onSnapshot(collection(db, 'support_tickets'), (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as SupportTicket[];
      setSupportTickets(ticketsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'support_tickets'));

    const unsubVisits = onSnapshot(collection(db, 'visits'), (snapshot) => {
      const visitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Visit[];
      setVisits(visitsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'visits'));

    const unsubSearchTerms = onSnapshot(collection(db, 'searchTerms'), (snapshot) => {
      const termsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as SearchTerm[];
      setSearchTerms(termsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'searchTerms'));

    const unsubAbandonedCarts = onSnapshot(collection(db, 'abandonedCarts'), (snapshot) => {
      const cartsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as AbandonedCart[];
      setAbandonedCarts(cartsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'abandonedCarts'));

    const unsubInventoryLogs = onSnapshot(collection(db, 'inventory_logs'), (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as InventoryLog[];
      setInventoryLogs(logsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 1000));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory_logs'));

    return () => {
      unsubCustomers();
      unsubLogs();
      unsubAdmins();
      unsubTickets();
      unsubVisits();
      unsubSearchTerms();
      unsubAbandonedCarts();
      unsubInventoryLogs();
    };
  }, [user]);

  // Sync Public Data
  useEffect(() => {
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Category[];
      setCategories(data);
      localStorage.setItem('store_categories', JSON.stringify(data));
    });
    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Coupon[];
      setCoupons(data);
      localStorage.setItem('store_coupons', JSON.stringify(data));
    });
    const unsubPosts = onSnapshot(collection(db, 'blog_posts'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as BlogPost[];
      setBlogPosts(data);
      localStorage.setItem('store_blog', JSON.stringify(data));
    });
    const unsubPages = onSnapshot(collection(db, 'static_pages'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as StaticPage[];
      setStaticPages(data);
      localStorage.setItem('store_pages', JSON.stringify(data));
    });
    const unsubZones = onSnapshot(collection(db, 'shipping_zones'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as ShippingZone[];
      setShippingZones(data);
      localStorage.setItem('store_shipping_zones', JSON.stringify(data));
    });
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Banner[];
      setBanners(data);
      localStorage.setItem('store_banners', JSON.stringify(data));
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as StoreSettings;
        setSettings(data);
        localStorage.setItem('store_settings', JSON.stringify(data));
      }
    });
    
    let isInitialMarketingSync = true;
    const unsubMarketingNotifs = onSnapshot(collection(db, 'marketing_notifications'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as MarketingNotification[];
      setMarketingNotifications(data);
      localStorage.setItem('store_marketing_notifications', JSON.stringify(data));

      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const docData = change.doc.data() as MarketingNotification;
          // Keep notifications from the last 7 days in the bell
          const isRecent = new Date(docData.date || new Date().toISOString()).getTime() > Date.now() - (7 * 24 * 3600000);
          
          if (isRecent) {
            const currentUser = auth.currentUser;
            
            // If the notification targets a specific user, strictly ensure the current user matches
            if (docData.target === 'specific_user') {
              if (!currentUser) return; // Ignore if not logged in
              if (docData.targetUserId !== currentUser.uid && docData.targetUserId !== currentUser.phoneNumber) {
                return; // Exclude, this is not meant for them
              }
            }

            // Prevent resurrecting deleted marketing notifications
            const deletedIds = JSON.parse(localStorage.getItem('store_deleted_notif_ids') || '[]');
            if (deletedIds.includes(change.doc.id)) return;

            setNotifications(prev => {
              // Prevent duplicates
              if (prev.some(n => n.id === change.doc.id)) return prev;
              
              const appNotif: AppNotification = {
                id: change.doc.id,
                title: docData.title,
                message: docData.message,
                date: docData.date || new Date().toISOString(),
                isRead: false,
                type: 'sale'
              };

              // Show a pop-up toast if this is a truly new notification arriving in real-time
              // OR if it was sent less than 2 minutes ago (so if the user just opened the app/tab to check)
              const timeSinceSent = Date.now() - new Date(docData.date || new Date().toISOString()).getTime();
              if (!isInitialMarketingSync || timeSinceSent < 120000) {
                setTimeout(() => sonnerToast.success(`رسالة جديدة: ${docData.title}`, {
                  description: docData.message,
                  duration: 6000,
                  position: 'top-center'
                }), 100);
              }

              return [appNotif, ...prev];
            });
          }
        }
      });
      isInitialMarketingSync = false;
    });

    return () => {
      unsubCategories();
      unsubCoupons();
      unsubPosts();
      unsubPages();
      unsubZones();
      unsubBanners();
      unsubSettings();
      unsubMarketingNotifs();
    };
  }, []);

  const [discount, setDiscount] = useState<{ code: string | null; amount: number; type: 'percentage' | 'fixed'; pointsUsed?: number }>({
    code: null,
    amount: 0,
    type: 'percentage'
  });

  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>(() => {
    const saved = localStorage.getItem('store_subscriptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('store_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('store_notification_settings');
    return saved ? JSON.parse(saved) : { sale: true, stock: true, order: true, promotions: true };
  });

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    const saved = localStorage.getItem('store_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('store_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  const [language, setLanguageState] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('store_language');
    return (saved as 'ar' | 'en') || 'ar';
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('store_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure new statuses are included for existing users
      if (parsed.autoNotifications && !parsed.autoNotifications.onStatusChange.includes('pending')) {
        parsed.autoNotifications.onStatusChange = Array.from(new Set([...parsed.autoNotifications.onStatusChange, 'pending', 'processing']));
      }
      return parsed;
    }
    return {
      storeName: 'متجري',
      contactEmail: '',
      contactPhone: '',
      contactPhone2: '',
      address: '',
      shippingFee: 0,
      freeShippingThreshold: 0,
      currency: 'YER_OLD',
      language: 'ar',
      isMaintenanceMode: false,
      maintenanceMessage: 'المتجر في وضع الصيانة حالياً. سنعود قريباً!',
      announcementText: '',
      primaryColor: '#000000',
      fontFamily: 'Inter',
      homeSectionOrder: ['hero', 'categories', 'deals', 'featured', 'new_arrivals', 'category_sliders'],
      seo: {
        metaTitle: 'متجري',
        metaDescription: '',
        favicon: '',
        ogImage: ''
      },
      autoNotifications: {
        enabled: true,
        sms: true,
        email: true,
        onStatusChange: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
      },
      paymentMethods: [
        { id: 'wallet', name: 'المحفظة', type: 'wallet', isActive: true, requiresProof: false }
      ]
    };
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('store_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('store_blog');
    return saved ? JSON.parse(saved) : [];
  });

  const [staticPages, setStaticPages] = useState<StaticPage[]>(() => {
    const saved = localStorage.getItem('store_pages');
    return saved ? JSON.parse(saved) : [];
  });

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>(() => {
    const saved = localStorage.getItem('store_shipping_zones');
    return saved ? JSON.parse(saved) : [];
  });

  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(() => {
    const saved = localStorage.getItem('store_abandoned_carts');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>(() => {
    const saved = localStorage.getItem('store_search_terms');
    return saved ? JSON.parse(saved) : [];
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('store_banners');
    return saved ? JSON.parse(saved) : [];
  });

  const [marketingNotifications, setMarketingNotifications] = useState<MarketingNotification[]>(() => {
    const saved = localStorage.getItem('store_marketing_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [visits, setVisits] = useState<Visit[]>(() => {
    const saved = localStorage.getItem('store_visits');
    if (saved) return JSON.parse(saved);
    
    return [];
  });

  const getPermissionsByRole = (role: AdminRole): AdminPermission[] => {
    switch (role) {
      case 'super_admin':
        return [
          'view_dashboard', 'manage_orders', 'manage_products', 'manage_customers',
          'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security',
          'view_logs', 'manage_logistics', 'manage_messages'
        ];
      case 'manager':
        return [
          'view_dashboard', 'manage_orders', 'manage_products', 'manage_customers',
          'manage_marketing', 'manage_coupons', 'manage_logistics', 'manage_messages'
        ];
      case 'editor':
        return [
          'view_dashboard', 'manage_products', 'manage_marketing', 'manage_coupons', 'manage_messages'
        ];
      case 'support':
        return [
          'view_dashboard', 'manage_orders', 'manage_customers', 'manage_messages'
        ];
      default:
        return ['view_dashboard'];
    }
  };

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('store_admin_users');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('store_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('store_categories');
    if (saved) return JSON.parse(saved);
    
    return [];
  });

  const [customers, setCustomers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('app_users');
    if (saved) return JSON.parse(saved);
    
    return [];
  });

  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() => {
    const saved = localStorage.getItem('store_inventory_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', options?: { image?: string, action?: { label: string, onClick: () => void } }) => {
    if (!message) return;
    
    const hasCustomContent = options?.image || options?.action;
    
    const toastContent = hasCustomContent ? (
      <div className="flex items-center justify-between w-full gap-3 py-0.5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {options?.image && (
            <img src={options.image || undefined} alt="toast-img" className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
          )}
          <span className="text-sm font-medium text-white truncate">{message}</span>
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
    ) : message;

    const toastOptions = {
      icon: type === 'success' ? (
        <div className="w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center shrink-0 shadow-gold">
          <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : undefined,
    };

    if (type === 'error') {
      sonnerToast.error(toastContent, toastOptions);
    } else if (type === 'info') {
      sonnerToast.info(toastContent, toastOptions);
    } else {
      sonnerToast.success(toastContent, toastOptions);
    }
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = React.useCallback(async () => {
    if (!deferredPrompt) {
      showToast('التطبيق مثبت بالفعل أو المتصفح لا يدعم التثبيت المباشر', 'info');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      showToast('شكراً لتثبيت تطبيق متجر النخبة!');
      setCanInstallPWA(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, showToast]);

  // Persist state to localStorage individually to improve performance
  useEffect(() => { localStorage.setItem('store_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { 
    if (!user) {
      localStorage.setItem('store_wishlist', JSON.stringify(wishlist)); 
    }
  }, [wishlist, user]);
  useEffect(() => { localStorage.setItem('store_subscriptions', JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { localStorage.setItem('store_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('store_notification_settings', JSON.stringify(notificationSettings)); }, [notificationSettings]);
  useEffect(() => { localStorage.setItem('store_recently_viewed', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);
  useEffect(() => { localStorage.setItem('store_language', language); }, [language]);
  useEffect(() => { localStorage.setItem('store_marketing_notifications', JSON.stringify(marketingNotifications)); }, [marketingNotifications]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Remove simulated notification check interval as it's confusing and fake
  /*
  useEffect(() => {
    ...
  }, [subscriptions, products]);
  */


  const formatPrice = React.useCallback((price: number) => {
    return formatMoney(price, language === 'ar' ? 'ar-u-nu-latn' : 'en-US');
  }, [language]);

  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => roundMoney(sum + (item.product.price * item.quantity)), 0)
  , [cart]);

  const discountAmount = useMemo(() => {
    if (!discount.code) return 0;
    if (discount.type === 'percentage') {
      return roundMoney(subtotal * (discount.amount / 100));
    }
    return roundMoney(Math.min(discount.amount, subtotal));
  }, [discount, subtotal]);

  const total = useMemo(() => 
    roundMoney(Math.max(0, subtotal - discountAmount))
  , [subtotal, discountAmount]);

  const logActivity = React.useCallback(async (action: string, details: string) => {
    try {
      const adminEmail = localStorage.getItem('admin_email');
      const adminName = localStorage.getItem('admin_name');
      
      const ip = '127.0.0.1';

      const logData = {
        userId: adminEmail || user?.uid || user?.phone || 'system',
        userName: adminName || user?.name || user?.displayName || 'النظام',
        action,
        details,
        date: serverTimestamp(),
        ip
      };

      await addDoc(collection(db, 'activity_logs'), logData);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [user]);

  const updateSettings = React.useCallback(async (newSettings: Partial<StoreSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await setDoc(doc(db, 'settings', 'store'), {
        ...updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      if (newSettings.language && newSettings.language !== settings.language) {
        setLanguageState(newSettings.language);
      }
      
      setSettings(updated);
      showToast('تم تحديث إعدادات المتجر بنجاح', 'success');
      logActivity('تحديث الإعدادات', 'قام المدير بتحديث إعدادات المتجر');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/store');
    }
  }, [settings, showToast, logActivity]);

  const addTicket = React.useCallback(async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'replies' | 'status'>) => {
    try {
      const newTicketRef = doc(collection(db, 'support_tickets'));
      const newTicket: SupportTicket = {
        ...ticket,
        id: newTicketRef.id,
        createdAt: new Date().toISOString(),
        status: 'open',
        replies: []
      };
      await setDoc(newTicketRef, {
        ...newTicket,
        createdAt: serverTimestamp()
      });
      showToast('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'support_tickets');
    }
  }, [showToast]);

  const updateTicketStatus = React.useCallback(async (id: string, status: SupportTicket['status']) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), {
        status,
        updatedAt: serverTimestamp()
      });
      logActivity('تحديث تذكرة', `تم تغيير حالة التذكرة ${id} إلى ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_tickets/${id}`);
    }
  }, [logActivity]);

  const replyToTicket = React.useCallback(async (id: string, message: string) => {
    try {
      const reply = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'admin' as const,
        message,
        timestamp: new Date().toISOString()
      };
      const ticketRef = doc(db, 'support_tickets', id);
      const ticketSnap = await getDoc(ticketRef);
      if (ticketSnap.exists()) {
        const ticketData = ticketSnap.data() as SupportTicket;
        await updateDoc(ticketRef, {
          replies: [...(ticketData.replies || []), reply],
          updatedAt: serverTimestamp()
        });
        logActivity('رد على تذكرة', `تم الرد على التذكرة ${id}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_tickets/${id}`);
    }
  }, [logActivity]);

  const deleteTicket = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'support_tickets', id));
      logActivity('حذف تذكرة', `تم حذف التذكرة ${id}`);
      showToast('تم حذف الرسالة بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `support_tickets/${id}`);
    }
  }, [logActivity, showToast]);

  const addBlogPost = React.useCallback(async (post: Omit<BlogPost, 'id'>) => {
    try {
      const newPostRef = doc(collection(db, 'blog_posts'));
      await setDoc(newPostRef, {
        ...post,
        id: newPostRef.id,
        createdAt: serverTimestamp()
      });
      logActivity('إضافة مقال', `تم إضافة المقال ${post.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'blog_posts');
    }
  }, [logActivity]);

  const updateBlogPost = React.useCallback(async (id: string, post: Partial<BlogPost>) => {
    try {
      await updateDoc(doc(db, 'blog_posts', id), {
        ...post,
        updatedAt: serverTimestamp()
      });
      logActivity('تحديث مقال', `تم تحديث المقال ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `blog_posts/${id}`);
    }
  }, [logActivity]);

  const deleteBlogPost = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
      logActivity('حذف مقال', `تم حذف المقال ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blog_posts/${id}`);
    }
  }, [logActivity]);

  const updateStaticPage = React.useCallback(async (id: string, content: string) => {
    try {
      await setDoc(doc(db, 'static_pages', id), {
        content,
        lastUpdated: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      logActivity('تحديث صفحة', `تم تحديث محتوى الصفحة ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `static_pages/${id}`);
    }
  }, [logActivity]);

  const addShippingZone = React.useCallback(async (zone: Omit<ShippingZone, 'id' | 'isActive'>) => {
    try {
      const newZoneRef = doc(collection(db, 'shipping_zones'));
      await setDoc(newZoneRef, {
        ...zone,
        id: newZoneRef.id,
        isActive: true,
        createdAt: serverTimestamp()
      });
      logActivity('إضافة منطقة شحن', `تم إضافة المنطقة ${zone.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'shipping_zones');
    }
  }, [logActivity]);

  const updateShippingZone = React.useCallback(async (id: string, zone: Partial<ShippingZone>) => {
    try {
      await updateDoc(doc(db, 'shipping_zones', id), {
        ...zone,
        updatedAt: serverTimestamp()
      });
      logActivity('تحديث منطقة شحن', `تم تحديث المنطقة ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shipping_zones/${id}`);
    }
  }, [logActivity]);

  const deleteShippingZone = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shipping_zones', id));
      logActivity('حذف منطقة شحن', `تم حذف المنطقة ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shipping_zones/${id}`);
    }
  }, [logActivity]);

  const toggleShippingZoneStatus = React.useCallback(async (id: string) => {
    try {
      const zoneRef = doc(db, 'shipping_zones', id);
      const zoneSnap = await getDoc(zoneRef);
      if (zoneSnap.exists()) {
        const zoneData = zoneSnap.data() as ShippingZone;
        await updateDoc(zoneRef, {
          isActive: !zoneData.isActive,
          updatedAt: serverTimestamp()
        });
        logActivity('تغيير حالة منطقة شحن', `تم تغيير حالة المنطقة ${id}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shipping_zones/${id}`);
    }
  }, [logActivity]);

  const trackSearch = React.useCallback(async (term: string, resultsCount: number) => {
    try {
      const q = query(collection(db, 'searchTerms'), where('term', '==', term));
      const snapshot = await getDocs(q);
      
      if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
        const docRef = snapshot.docs[0].ref;
        const data = snapshot.docs[0].data();
        await updateDoc(docRef, {
          count: (data.count || 0) + 1,
          resultsCount,
          lastSearched: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'searchTerms'), {
          term,
          count: 1,
          resultsCount,
          lastSearched: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, []);

  const trackVisit = React.useCallback(async (page: string) => {
    try {
      const sessionId = sessionStorage.getItem('store_session_id') || Math.random().toString(36).substr(2, 9);
      if (!sessionStorage.getItem('store_session_id')) {
        sessionStorage.setItem('store_session_id', sessionId);
      }

      const isUnique = !localStorage.getItem('store_visited_before');
      if (isUnique) {
        localStorage.setItem('store_visited_before', 'true');
      }

      const ua = navigator.userAgent;
      let browser = 'Other';
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edge')) browser = 'Edge';

      let os = 'Other';
      if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'MacOS';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

      let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';
      if (/Mobi|Android/i.test(ua)) device = 'mobile';
      else if (/Tablet|iPad/i.test(ua)) device = 'tablet';

      const visitData = {
        sessionId,
        timestamp: new Date().toISOString(),
        page,
        referrer: document.referrer || 'Direct',
        device,
        browser,
        os,
        country: 'اليمن',
        city: 'صنعاء',
        duration: 0,
        isUnique,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'visits'), visitData);
    } catch (error) {
      console.error('Failed to track visit:', error);
    }
  }, []);

  const bulkUpdatePrices = React.useCallback(async (category: string, percentage: number) => {
    try {
      const batch = writeBatch(db);
      let count = 0;

      products.forEach(p => {
        if (category === 'الكل' || p.category === category) {
          const newPrice = Math.round(p.price * (1 + percentage / 100));
          const pRef = doc(db, 'products', p.id);
          batch.update(pRef, {
            price: newPrice,
            originalPrice: p.price,
            updatedAt: serverTimestamp()
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        logActivity('تحديث أسعار جماعي', `تم تغيير أسعار ${count} منتج في قسم ${category} بنسبة ${percentage}%`);
        showToast('تم تحديث الأسعار بنجاح', 'success');
      } else {
        showToast('لا توجد منتجات لتحديثها في هذا القسم', 'info');
      }
    } catch (error) {
      console.error('Bulk price update failed:', error);
      showToast('فشل تحديث الأسعار جماعياً', 'error');
    }
  }, [products, logActivity, showToast]);

  const addBanner = React.useCallback(async (banner: Omit<Banner, 'id'>) => {
    try {
      const newBannerRef = doc(collection(db, 'banners'));
      await setDoc(newBannerRef, {
        ...banner,
        id: newBannerRef.id,
        createdAt: serverTimestamp()
      });
      showToast('تم إضافة البنر بنجاح');
      logActivity('إضافة بنر', `تم إضافة بنر جديد: ${banner.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'banners');
    }
  }, [showToast, logActivity]);

  const updateBanner = React.useCallback(async (id: string, updatedData: Partial<Banner>) => {
    try {
      await updateDoc(doc(db, 'banners', id), {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      showToast('تم تحديث البانر بنجاح');
      logActivity('تحديث بنر', `تم تحديث بيانات البانر ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `banners/${id}`);
    }
  }, [showToast, logActivity]);

  const deleteBanner = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
      showToast('تم حذف البانر');
      logActivity('حذف بنر', `تم حذف البانر ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `banners/${id}`);
    }
  }, [showToast, logActivity]);

  const sendMarketingNotification = React.useCallback(async (notification: Omit<MarketingNotification, 'id' | 'date' | 'sentCount' | 'openedCount' | 'clickedCount' | 'status'>) => {
    try {
      const newNotifRef = doc(collection(db, 'marketing_notifications'));
      const newNotification: MarketingNotification = {
        ...notification,
        id: newNotifRef.id,
        date: new Date().toISOString(),
        sentCount: customers.length,
        openedCount: 0,
        clickedCount: 0,
        status: notification.scheduledFor ? 'scheduled' : 'sent'
      };

      await setDoc(newNotifRef, {
        ...newNotification,
        createdAt: serverTimestamp()
      });
      
      // Send SMS if type is sms
      if (notification.type === 'sms') {
        const targetCustomers = customers.filter(c => {
          if (notification.target === 'all') return true;
          if (notification.target === 'specific_user') return c.uid === notification.targetUserId || c.phone === notification.targetUserId;
          if (notification.target === 'vip') return (c.orderCount || 0) > 10;
          if (notification.target === 'new') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return c.joinDate && new Date(c.joinDate) >= thirtyDaysAgo;
          }
          if (notification.target === 'inactive') {
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            return !c.joinDate || new Date(c.joinDate) < sixtyDaysAgo;
          }
          return false;
        });

        const phones = targetCustomers.map(c => c.phone).filter(Boolean) as string[];
        if (phones.length > 0) {
          smsService.sendBulk(phones, notification.message).then(result => {
            if (result.success) {
              showToast(result.message || 'تم بدء إرسال الحملة بنجاح', 'success');
            } else {
              showToast(result.error || 'فشل بدء الحملة', 'error');
            }
          });
        }
      }
      
      showToast('تم إرسال الإشعار بنجاح');
      logActivity('إرسال إشعار تسويقي', `تم إرسال إشعار: ${notification.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketing_notifications');
    }
  }, [customers, showToast, logActivity, setNotifications]);

  const addAdminUser = React.useCallback(async (admin: Omit<AdminUser, 'id'>) => {
    try {
      const newAdminRef = doc(collection(db, 'admin_users'));
      let finalAdmin = { ...admin };

      // Secretly convert phone to dummy email if no email provided but phone exists
      if (!finalAdmin.email && finalAdmin.phone && finalAdmin.countryCode) {
        finalAdmin.email = getAdminDummyEmail(finalAdmin.phone, finalAdmin.countryCode);
      }

      await setDoc(newAdminRef, {
        ...finalAdmin,
        id: newAdminRef.id,
        permissions: finalAdmin.permissions || getPermissionsByRole(finalAdmin.role),
        createdAt: serverTimestamp()
      });
      showToast('تم إضافة المشرف بنجاح');
      logActivity('إضافة مشرف', `تم إضافة مشرف جديد: ${finalAdmin.name} (${finalAdmin.phone || finalAdmin.email})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'admin_users');
    }
  }, [showToast, logActivity]);

  const updateAdminUser = React.useCallback(async (id: string, updatedData: Partial<AdminUser>, logDetails?: string) => {
    try {
      let finalData = { ...updatedData };

      // Handle phone to email conversion on update if phone changes
      if (finalData.phone && finalData.countryCode && !finalData.email) {
        finalData.email = getAdminDummyEmail(finalData.phone, finalData.countryCode);
      }

      await updateDoc(doc(db, 'admin_users', id), {
        ...finalData,
        updatedAt: serverTimestamp()
      });

      // Synchronize changes to the main `users` collection to prevent loss of admin role or disconnected data
      try {
        const dummyEmail = finalData.email || getAdminDummyEmail(finalData.phone || '', finalData.countryCode || '+967');
        const usersQuery = query(collection(db, 'users'), where('email', '==', dummyEmail));
        const userDocs = await getDocs(usersQuery);
        if (userDocs && !userDocs.empty && userDocs.docs && userDocs.docs.length > 0) {
          const userDocRef = doc(db, 'users', userDocs.docs[0].id);
          const updatesToUser: any = {};
          if (finalData.name) {
            // We store the admin's chosen name into a separate field in the main user record
            // THIS PREVENTS it from overwriting the client name!
            updatesToUser.adminName = finalData.name;
          }
          if (finalData.role) {
            updatesToUser.adminRole = finalData.role;
            updatesToUser.role = 'admin'; // Always ensure they remain an admin
          }
          if (finalData.phone) updatesToUser.phone = finalData.phone;
          
          if (Object.keys(updatesToUser).length > 0) {
            await updateDoc(userDocRef, updatesToUser);
          }
        }
      } catch (syncError) {
        console.error('Failed to sync admin details to users collection:', syncError);
      }

      showToast('تم تحديث بيانات المشرف');
      logActivity('تحديث مشرف', logDetails || `تم تحديث بيانات المشرف ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admin_users/${id}`);
    }
  }, [showToast, logActivity]);

  const deleteAdminUser = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admin_users', id));
      showToast('تم حذف المشرف');
      logActivity('حذف مشرف', `تم حذف المشرف ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admin_users/${id}`);
    }
  }, [showToast, logActivity]);

  const addToCart = React.useCallback((product: Product, quantity: number = 1, color?: string, size?: string) => {
    const maxQuantity = product.stockCount !== undefined ? product.stockCount : 99;
    
    // Validate quantity
    if (quantity <= 0) return;
    if (quantity > maxQuantity) {
      showToast(`عذراً، الحد الأقصى للكمية هو ${maxQuantity}`, 'error');
      return;
    }

    // Check stock
    if (product.inStock === false || maxQuantity === 0) {
      showToast('عذراً، هذا المنتج غير متوفر حالياً', 'error');
      return;
    }

    setCart(prev => {
      const cartItemId = `${product.id}-${color || 'default'}-${size || 'default'}`;
      const existing = prev.find(item => item.id === cartItemId);
      
      if (existing) {
        const newQuantity = Math.min(maxQuantity, existing.quantity + quantity);
        return prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: newQuantity } 
            : item
        );
      }
      return [...prev, { id: cartItemId, product, quantity, selectedColor: color, selectedSize: size }];
    });
    showToast(`تمت الإضافة للسلة بنجاح`, 'success', {
      image: product.image,
      action: {
        label: 'عرض',
        onClick: () => setIsCartOpen(true)
      }
    });
  }, [showToast]);

  const updateCartQuantity = React.useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const maxQuantity = item.product.stockCount !== undefined ? item.product.stockCount : 99;
        const newQ = Math.min(maxQuantity, Math.max(0, item.quantity + delta));
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  const removeFromCart = React.useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
  }, []);

  const updateCoupon = React.useCallback(async (id: string, updatedData: Partial<Coupon>, showToastMsg = true) => {
    try {
      await updateDoc(doc(db, 'coupons', id), updatedData);
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
      if (showToastMsg) {
        showToast('تم تحديث الكوبون بنجاح');
      }
      logActivity('تحديث كوبون', `تم تحديث الكوبون ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'coupons');
    }
  }, [showToast, logActivity]);

  const updateCustomerBalance = React.useCallback(async (identifier: string, amount: number, description: string) => {
    try {
      if (!identifier) {
        showToast('معرف العميل غير صالح', 'error');
        return;
      }

      let docRef = null;
      let userData = null;

      // Try by UID first
      const uidRef = doc(db, 'users', identifier);
      const uidSnap = await getDoc(uidRef);

      if (uidSnap.exists()) {
        docRef = uidRef;
        userData = uidSnap.data() as UserProfile;
      } else {
        // Fallback to phone search
        const q = query(collection(db, 'users'), where('phone', '==', identifier));
        const snapshot = await getDocs(q);
        if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
          docRef = snapshot.docs[0].ref;
          userData = snapshot.docs[0].data() as UserProfile;
        }
      }

      if (!docRef || !userData) {
        showToast('العميل غير موجود', 'error');
        return;
      }

      const newBalance = (userData.walletBalance || 0) + amount;
      
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        amount: Math.abs(amount),
        type: amount >= 0 ? 'deposit' : 'withdrawal',
        date: new Date().toISOString(),
        status: 'completed',
        description
      };

      await updateDoc(docRef, {
        walletBalance: newBalance,
        transactions: [transaction, ...(userData.transactions || [])],
        updatedAt: serverTimestamp()
      } as any);

      logActivity('تحديث رصيد', `تم ${amount >= 0 ? 'إضافة' : 'خصم'} ${Math.abs(amount)} لرصيد العميل: ${identifier} - ${description}`);
      showToast(amount >= 0 ? 'تم إضافة الرصيد بنجاح' : 'تم خصم الرصيد بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users (balance): ${identifier}`);
    }
  }, [showToast, logActivity]);

  const addCustomerNote = React.useCallback(async (identifier: string, text: string) => {
    try {
      if (!identifier) {
        showToast('معرف العميل غير صالح', 'error');
        return;
      }

      let docRef = null;
      let userData = null;

      // Try by UID first
      const uidRef = doc(db, 'users', identifier);
      const uidSnap = await getDoc(uidRef);

      if (uidSnap.exists()) {
        docRef = uidRef;
        userData = uidSnap.data() as UserProfile;
      } else {
        // Fallback to phone search
        const q = query(collection(db, 'users'), where('phone', '==', identifier));
        const snapshot = await getDocs(q);
        if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
          docRef = snapshot.docs[0].ref;
          userData = snapshot.docs[0].data() as UserProfile;
        }
      }

      if (!docRef || !userData) {
        showToast('العميل غير موجود', 'error');
        return;
      }
      
      const note: UserNote = {
        id: crypto.randomUUID(),
        text,
        date: new Date().toISOString(),
        author: 'مدير النظام'
      };

      await updateDoc(docRef, {
        notes: [note, ...(userData.notes || [])],
        updatedAt: serverTimestamp()
      });

      showToast('تمت إضافة الملاحظة بنجاح');
      logActivity('إضافة ملاحظة', `تمت إضافة ملاحظة لملف العميل: ${identifier}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users (notes): ${identifier}`);
    }
  }, [showToast, logActivity]);

  const placeOrder = React.useCallback(async (
    paymentMethod: string, 
    shippingMethod: 'delivery' | 'pickup' = 'delivery', 
    paymentReference?: string, 
    customerName?: string, 
    customerPhone?: string, 
    shippingAddress?: string,
    city?: string,
    deliveryInstructions?: string,
    paymentProof?: string
  ) => {
    if (cart.length === 0) return '';
    if (isPlacingOrder) return '';

    setIsPlacingOrder(true);

    try {
      // 1. Re-validate prices and stock from source of truth (products list)
      const validatedItems = cart.map(item => {
        const sourceProduct = products.find(p => p.id === item.product.id);
        if (!sourceProduct) {
          throw new Error(`المنتج ${item.product.name} لم يعد متوفراً`);
        }
        if (sourceProduct.stockCount !== undefined && sourceProduct.stockCount <= 0) {
          throw new Error(`عذراً، المنتج ${sourceProduct.name} نفذ من المخزون`);
        }
        return {
          ...item,
          product: {
            ...item.product,
            price: sourceProduct.price
          }
        };
      });

      const subtotal = roundMoney(validatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0));
      
      let shipping = 0;
      if (subtotal > 0 && shippingMethod === 'delivery') {
        const zone = city ? shippingZones.find(z => z.cities.includes(city)) : null;
        if (zone) {
          shipping = (zone.freeThreshold && subtotal >= zone.freeThreshold) ? 0 : zone.rate;
        } else {
          shipping = (settings.freeShippingThreshold && subtotal >= settings.freeShippingThreshold) ? 0 : settings.shippingFee;
        }
      }
      
      let discountAmount = 0;
      if (discount.code) {
        const coupon = coupons.find(c => c.code.toUpperCase() === discount.code?.toUpperCase());
        
        if (!coupon || !coupon.isActive || (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) || (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) || (coupon.minOrderValue && subtotal < coupon.minOrderValue)) {
          showToast('عذراً، كود الخصم لم يعد صالحاً أو لا يستوفي الشروط', 'error');
          setDiscount({ code: null, amount: 0, type: 'percentage' });
          setIsPlacingOrder(false);
          return '';
        }

        if (discount.type === 'percentage') {
          discountAmount = roundMoney(subtotal * (discount.amount / 100));
        } else {
          discountAmount = roundMoney(Math.min(discount.amount, subtotal));
        }
        
        updateCoupon(coupon.id, { usedCount: coupon.usedCount + 1 }, false);
      }

      const total = roundMoney(Math.max(0, subtotal + shipping - discountAmount));
      
      // Get Sequential Order ID with Transaction to prevent duplicates
      let orderId = '';
      try {
        orderId = await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, 'settings', 'counters');
          const counterSnap = await transaction.get(counterRef);
          
          let nextSeq = 1;
          if (counterSnap.exists()) {
            nextSeq = (counterSnap.data().orderCounter || 0) + 1;
          }
          
          transaction.set(counterRef, { orderCounter: nextSeq }, { merge: true });
          
          const now = new Date();
          const yy = String(now.getFullYear()).slice(-2);
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          
          return `NKH-${yy}${mm}${dd}-${nextSeq}`;
        });
      } catch (error) {
        console.error('Failed to generate sequential order ID, falling back to random:', error);
        // Fallback to random ID if transaction fails (e.g. permission issues or network error)
        orderId = `NKH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }

      // 2. Prepare Order Data
      const newOrderData = {
        id: orderId,
        userId: auth.currentUser?.uid || 'guest',
        customerName: customerName || user?.displayName || user?.name || 'عميل المتجر',
        customerPhone: customerPhone || user?.phone || '',
        shippingAddress: shippingAddress || user?.address || '',
        city: city || null,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        items: validatedItems.map(item => ({
          productId: item.product.id || '',
          name: item.product.name || '',
          price: item.product.price || 0,
          quantity: item.quantity || 1,
          selectedColor: item.selectedColor || null,
          selectedSize: item.selectedSize || null
        })),
        subtotal: subtotal || 0,
        shippingFee: shipping || 0,
        discountAmount: discountAmount || 0,
        total: total || 0,
        status: paymentMethod === 'المحفظة الرقمية' ? 'processing' : 'pending',
        paymentMethod: paymentMethod || 'وسيلة دفع',
        paymentReference: paymentReference || null,
        paymentProof: paymentProof || null,
        shippingMethod: shippingMethod || null,
        deliveryInstructions: deliveryInstructions || null,
        currency: BASE_CURRENCY_CODE || 'YER_OLD'
      };

      // 3. Save to Firestore
      // Ensure no undefined values reach Firestore
      const finalOrderData = JSON.parse(JSON.stringify(newOrderData, (key, value) => 
        value === undefined ? null : value
      ));
      
      // serverTimestamp() is lost in JSON.stringify, so we restore it
      finalOrderData.createdAt = newOrderData.createdAt;

      await setDoc(doc(db, 'orders', orderId), finalOrderData);

      // 4. Update Stock
      for (const item of validatedItems) {
        await updateDoc(doc(db, 'products', String(item.product.id)), {
          stockCount: increment(-item.quantity)
        });
      }

      // 5. Deduct Wallet Balance 
      if (paymentMethod === 'المحفظة الرقمية' && auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          walletBalance: increment(-total)
        });
      }

      showToast(`تم إتمام الطلب بنجاح!`);
      clearCart();
      setDiscount({ code: null, amount: 0, type: 'percentage' });
      setIsPlacingOrder(false);
      return orderId;

    } catch (error) {
      console.error('Order placement failed:', error);
      showToast(error instanceof Error ? error.message : 'حدث خطأ أثناء إتمام الطلب', 'error');
      setIsPlacingOrder(false);
      return '';
    }
  }, [cart, discount, coupons, updateCoupon, clearCart, showToast, user, products, isPlacingOrder, shippingZones, settings]);

  const updateOrderStatus = React.useCallback(async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp()
      });
      showToast('تم تحديث حالة الطلب');
      logActivity('تحديث حالة طلب', `تم تحديث حالة الطلب ${orderId} إلى: ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  }, [showToast, logActivity]);

  const toggleWishlist = React.useCallback((product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => String(p.id) === String(product.id));
      let newWishlist: Product[];
      
      if (exists) {
        showToast(`تم إزالة ${product.name} من المفضلة`);
        newWishlist = prev.filter(p => String(p.id) !== String(product.id));
      } else {
        showToast(`تم إضافة ${product.name} إلى المفضلة`);
        newWishlist = [...prev, product];
      }

      // Update customers state
      if (user) {
        setCustomers(prevCustomers => prevCustomers.map(c => {
          if (c.phone === user.phone) {
            const updated = { ...c, wishlist: newWishlist };
            setUser(updated);
            return updated;
          }
          return c;
        }));
      }

      return newWishlist;
    });
  }, [showToast, user]);

  const isInWishlist = React.useCallback((productId: string) => {
    return wishlist.some(p => String(p.id) === String(productId));
  }, [wishlist]);

  const updateUser = React.useCallback(async (newUser: UserProfile) => {
    if (!auth.currentUser) return;

    try {
      // Ensure we don't accidentally drop the admin role if it was set
      if (user?.role === 'admin' && newUser.role !== 'admin') {
        newUser.role = 'admin';
        if (user.adminRole) {
          newUser.adminRole = user.adminRole;
        }
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...newUser,
        updatedAt: serverTimestamp()
      });
      setUser(newUser);
      showToast('تم تحديث البيانات بنجاح');

      // Sync back to admin_users to keep the Dashboard perfectly synced
      if (newUser.role === 'admin') {
        try {
          const dummyEmail = newUser.email || getAdminDummyEmail(newUser.phone || '', newUser.countryCode || '+967');
          const adminQuery = query(collection(db, 'admin_users'), where('email', '==', dummyEmail));
          const adminDocs = await getDocs(adminQuery);
          if (adminDocs && !adminDocs.empty && adminDocs.docs && adminDocs.docs.length > 0) {
             const adminDocRef = doc(db, 'admin_users', adminDocs.docs[0].id);
             // We only sync the phone and timestamp back to admin record.
             // We DO NOT sync the name back, because the admin might have 
             // a specific "Admin Name" they want to keep separate from their client name.
             await updateDoc(adminDocRef, {
               phone: newUser.phone,
               updatedAt: serverTimestamp()
             });
          }
        } catch (adminSyncError) {
          console.error("Failed to sync profile back to admin_users:", adminSyncError);
        }
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  }, [showToast, user]);

  const deleteAccount = React.useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const uid = auth.currentUser.uid;
      // 1. Delete user data from Firestore
      await deleteDoc(doc(db, 'users', uid));
      
      // 2. Delete auth account
      await auth.currentUser.delete();
      
      setUser(null);
      setWishlist([]);
      showToast('تم حذف الحساب بنجاح');
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error; // Let the component handle it
    }
  }, [showToast]);

  const logout = React.useCallback(async () => {
    try {
      await auth.signOut();
      setUser(null);
      setWishlist([]);
      showToast('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [showToast]);

  const updateCustomer = React.useCallback(async (identifier: string, updates: Partial<UserProfile>) => {
    try {
      if (!identifier) {
        showToast('معرف العميل غير صالح', 'error');
        return;
      }

      let docRef = null;

      // Try by UID first
      const uidRef = doc(db, 'users', identifier);
      const uidSnap = await getDoc(uidRef);

      if (uidSnap.exists()) {
        docRef = uidRef;
      } else {
        // Fallback to phone search
        const q = query(collection(db, 'users'), where('phone', '==', identifier));
        const snapshot = await getDocs(q);
        if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
          docRef = snapshot.docs[0].ref;
        }
      }

      if (!docRef) {
        showToast('العميل غير موجود', 'error');
        return;
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      } as any);

      // If password update is included, we MUST trigger the backend API to update Firebase Auth
      if (updates.password) {
        try {
          const snap = await getDoc(docRef);
          const userData = snap.data() as UserProfile | undefined;
          if (userData && userData.phone) {
             const resetResponse = await fetch('/api/reset-password', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 phone: userData.phone,
                 countryCode: userData.countryCode || '+967',
                 newPassword: updates.password
               })
             });
             const resetData = await resetResponse.json();
             if (!resetResponse.ok || !resetData.success) {
               console.error("Backend Auth Password Update Failed:", resetData.error);
               showToast('تم تحديث البيانات لكن لم يتم تغيير كلمة المرور في السيرفر', 'error');
               return;
             }
          }
        } catch (authUpdateError) {
          console.error("Critical Auth Update Error:", authUpdateError);
          showToast('خطأ في مزامنة كلمة المرور مع السيرفر', 'error');
        }
      }

      showToast('تم تحديث بيانات العميل بنجاح');
      logActivity('تحديث عميل', `تم تحديث بيانات العميل: ${identifier}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users: ${identifier}`);
    }
  }, [showToast, logActivity]);

  const blockCustomer = React.useCallback(async (identifier: string) => {
    try {
      if (!identifier) {
        showToast('معرف العميل غير صالح', 'error');
        return;
      }

      let docRef = null;
      let userData = null;

      // Try by UID first
      const uidRef = doc(db, 'users', identifier);
      const uidSnap = await getDoc(uidRef);

      if (uidSnap.exists()) {
        docRef = uidRef;
        userData = uidSnap.data() as UserProfile;
      } else {
        // Fallback to phone search
        const q = query(collection(db, 'users'), where('phone', '==', identifier));
        const snapshot = await getDocs(q);
        if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
          docRef = snapshot.docs[0].ref;
          userData = snapshot.docs[0].data() as UserProfile;
        }
      }

      if (!docRef || !userData) {
        showToast('العميل غير موجود', 'error');
        return;
      }

      await updateDoc(docRef, {
        isBlocked: !userData.isBlocked,
        updatedAt: serverTimestamp()
      } as any);
      showToast('تم تغيير حالة حظر العميل');
      logActivity('تغيير حالة حظر عميل', `تم تغيير حالة حظر العميل: ${identifier}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users (block): ${identifier}`);
    }
  }, [showToast, logActivity]);

  const addCustomer = React.useCallback(async (customer: UserProfile) => {
    try {
      const q = query(collection(db, 'users'), where('phone', '==', customer.phone));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        showToast('هذا الرقم مسجل مسبقاً لعميل آخر', 'error');
        return;
      }
      
      const newUserRef = doc(collection(db, 'users'));
      await setDoc(newUserRef, {
        ...customer,
        uid: newUserRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      showToast('تم إضافة العميل بنجاح');
      logActivity('إضافة عميل', `تم إضافة عميل جديد: ${customer.displayName || customer.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  }, [showToast, logActivity]);

  const deleteCustomer = React.useCallback(async (identifier: string) => {
    try {
      if (!identifier) {
        showToast('معرف العميل غير صالح', 'error');
        return;
      }

      let docRef = null;
      
      // Try to get by UID first
      const uidRef = doc(db, 'users', identifier);
      const uidSnap = await getDoc(uidRef);
      
      if (uidSnap.exists()) {
        docRef = uidRef;
      } else {
        // Fallback to phone search
        const q = query(collection(db, 'users'), where('phone', '==', identifier));
        const snapshot = await getDocs(q);
        if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
          docRef = snapshot.docs[0].ref;
        }
      }

      if (!docRef) {
        showToast('العميل غير موجود', 'error');
        return;
      }

      await deleteDoc(docRef);
      showToast('تم حذف العميل بنجاح');
      logActivity('حذف عميل', `تم حذف العميل: ${identifier}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users: ${identifier}`);
    }
  }, [showToast, logActivity]);

  const addCoupon = React.useCallback(async (coupon: Omit<Coupon, 'id' | 'usedCount'>) => {
    try {
      const newCoupon: Coupon = {
        ...coupon,
        id: crypto.randomUUID(),
        usedCount: 0
      };
      await setDoc(doc(db, 'coupons', newCoupon.id), newCoupon);
      showToast('تمت إضافة الكوبون بنجاح');
      logActivity('إضافة كوبون', `تم إضافة كود خصم جديد: ${coupon.code}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'coupons');
    }
  }, [showToast, logActivity]);

  const deleteCoupon = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      showToast('تم حذف الكوبون بنجاح');
      logActivity('حذف كوبون', `تم حذف كود الخصم بمعرف: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'coupons');
    }
  }, [showToast, logActivity]);

  const toggleCouponStatus = React.useCallback(async (id: string) => {
    try {
      const coupon = coupons.find(c => c.id === id);
      if (coupon) {
        await updateDoc(doc(db, 'coupons', id), { isActive: !coupon.isActive });
        showToast('تم تغيير حالة الكوبون');
        logActivity('تحديث كوبون', `تم إيقاف/تفعيل كود الخصم: ${coupon.code}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'coupons');
    }
  }, [coupons, showToast, logActivity]);

  const applyDiscountCode = React.useCallback((code: string) => {
    const upperCode = code.toUpperCase();
    const coupon = coupons.find(c => c.code.toUpperCase() === upperCode);

    if (!coupon) {
      showToast('كود الخصم غير صالح', 'error');
      return false;
    }

    if (!coupon.isActive) {
      showToast('كود الخصم غير فعال حالياً', 'error');
      return false;
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      showToast('كود الخصم منتهي الصلاحية', 'error');
      return false;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      showToast('تم الوصول للحد الأقصى لاستخدام هذا الكوبون', 'error');
      return false;
    }

    const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      showToast(`الحد الأدنى للطلب لتطبيق هذا الكوبون هو ${formatPrice(coupon.minOrderValue)}`, 'error');
      return false;
    }

    setDiscount({ code: upperCode, amount: coupon.discountValue, type: coupon.discountType });
    
    showToast(`تم تطبيق كود الخصم ${upperCode} بنجاح`);
    return true;
  }, [coupons, cart, formatPrice, showToast]);

  const removeDiscount = React.useCallback(() => {
    setDiscount({ code: null, amount: 0, type: 'percentage' });
    showToast('تم إزالة الخصم');
  }, [showToast]);

  // Automatically remove discount if cart total falls below minimum order value
  useEffect(() => {
    if (discount.code) {
      const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      const coupon = coupons.find(c => c.code.toUpperCase() === discount.code?.toUpperCase());
      
      if (coupon && coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        setDiscount({ code: null, amount: 0, type: 'percentage' });
        showToast(`تم إزالة كود الخصم لأن إجمالي السلة أقل من الحد الأدنى (${formatPrice(coupon.minOrderValue)})`, 'info');
      }
    }
  }, [cart, discount.code, coupons, formatPrice, showToast]);

  const subscribeToProduct = React.useCallback((productId: string, type: 'back_in_stock' | 'on_sale', email: string) => {
    const exists = subscriptions.some(s => s.productId === productId && s.type === type && s.email === email);
    if (exists) {
      showToast('أنت مشترك بالفعل في هذه التنبيهات', 'info');
      return;
    }
    setSubscriptions(prev => [...prev, { productId, type, email }]);
    showToast('تم الاشتراك في التنبيهات بنجاح');
  }, [subscriptions, showToast]);

  const markNotificationAsRead = React.useCallback(async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      // Optionally sync to Firestore if notification is user-specific
      // Currently notifications appear to be local or pushed via marketing_notifications
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const deleteNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const deletedIds = JSON.parse(localStorage.getItem('store_deleted_notif_ids') || '[]');
    if (!deletedIds.includes(id)) {
      localStorage.setItem('store_deleted_notif_ids', JSON.stringify([...deletedIds, id]));
    }
  }, []);

  const clearAllNotifications = React.useCallback(() => {
    setNotifications(prev => {
      const deletedIds = JSON.parse(localStorage.getItem('store_deleted_notif_ids') || '[]');
      const newDeletedIds = new Set([...deletedIds, ...prev.map(n => n.id)]);
      localStorage.setItem('store_deleted_notif_ids', JSON.stringify(Array.from(newDeletedIds)));
      return [];
    });
  }, []);

  const updateNotificationSettings = React.useCallback((newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...newSettings }));
    showToast('تم تحديث إعدادات الإشعارات');
  }, [showToast]);

  const trackOrderById = React.useCallback(async (orderId: string) => {
    try {
      // 1. Try exact match
      let orderRef = doc(db, 'orders', orderId);
      let orderSnap = await getDoc(orderRef);
      
      // 2. Try uppercase match if exact fails (common for sequential IDs like NKH-...)
      if (!orderSnap.exists()) {
        orderRef = doc(db, 'orders', orderId.toUpperCase());
        orderSnap = await getDoc(orderRef);
      }

      if (orderSnap.exists()) {
        return { id: orderSnap.id, ...orderSnap.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error tracking order:', error);
      return null;
    }
  }, []);

  const addToRecentlyViewed = React.useCallback((product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 5); // Keep last 5
    });
  }, []);

  const setLanguage = React.useCallback((lang: 'ar' | 'en') => {
    setLanguageState(lang);
    showToast(lang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English');
  }, [showToast]);

  const updateStock = React.useCallback(async (productId: string, newStock: number, reason: string = 'تحديث يدوي') => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const previousStock = product.stockCount || 0;
      const change = newStock - previousStock;

      if (change === 0) return;

      const batch = writeBatch(db);

      // Update product
      const pRef = doc(db, 'products', productId);
      batch.update(pRef, {
        stockCount: newStock,
        inStock: newStock > 0,
        updatedAt: serverTimestamp()
      });

      // Create inventory log
      const logRef = doc(collection(db, 'inventory_logs'));
      batch.set(logRef, {
        productId,
        productName: product.name,
        change,
        previousStock,
        newStock,
        date: new Date().toISOString(),
        user: user?.name || user?.displayName || 'مدير النظام',
        reason,
        createdAt: serverTimestamp()
      } as any);

      await batch.commit();
      logActivity('تحديث مخزون', `تم تحديث مخزون المنتج ${product.name} إلى ${newStock}`);
    } catch (error) {
      console.error('Stock update failed:', error);
      showToast('فشل تحديث المخزون', 'error');
    }
  }, [products, user, logActivity, showToast]);

  const bulkUpdateStock = React.useCallback(async (updates: { productId: string, newStock: number }[], reason: string = 'تحديث جماعي') => {
    try {
      const batch = writeBatch(db);
      let logCount = 0;

      updates.forEach(update => {
        const product = products.find(p => p.id === update.productId);
        if (!product) return;

        const previousStock = product.stockCount || 0;
        const change = update.newStock - previousStock;

        if (change === 0) return;

        // Update product ref
        const pRef = doc(db, 'products', update.productId);
        batch.update(pRef, {
          stockCount: update.newStock,
          inStock: update.newStock > 0,
          updatedAt: serverTimestamp()
        });

        // Create inventory log doc
        const logRef = doc(collection(db, 'inventory_logs'));
        batch.set(logRef, {
          productId: update.productId,
          productName: product.name,
          change,
          previousStock,
          newStock: update.newStock,
          date: new Date().toISOString(),
          user: user?.name || user?.displayName || 'مدير النظام',
          reason,
          createdAt: serverTimestamp()
        } as any);

        logCount++;
      });

      if (logCount > 0) {
        await batch.commit();
        logActivity('تحديث مخزون جماعي', `تم تحديث مخزون ${logCount} منتجات`);
        showToast(`تم تحديث مخزون ${logCount} منتجات`);
      }
    } catch (error) {
      console.error('Bulk stock update failed:', error);
      showToast('فشل تحديث المخزون جماعياً', 'error');
    }
  }, [products, user, showToast, logActivity]);

  const addProduct = React.useCallback(async (product: Omit<Product, 'id'>) => {
    try {
      const newId = String(Date.now()); 
      await setDoc(doc(db, 'products', newId), {
        ...product,
        id: newId,
        createdAt: serverTimestamp()
      });
      showToast('تم إضافة المنتج بنجاح');
      logActivity('إضافة منتج', `تم إضافة المنتج الجديد: ${product.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  }, [showToast, logActivity]);

  const updateProduct = React.useCallback(async (id: string, updatedData: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', String(id)), {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      showToast('تم تحديث المنتج بنجاح');
      logActivity('تحديث منتج', `تم تحديث بيانات المنتج ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  }, [showToast, logActivity]);

  const deleteProduct = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', String(id)));
      showToast('تم حذف المنتج بنجاح');
      logActivity('حذف منتج', `تم حذف المنتج ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  }, [showToast, logActivity]);

  const addCategory = React.useCallback(async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory: Category = {
        ...category,
        id: Date.now().toString()
      };
      await setDoc(doc(db, 'categories', newCategory.id), newCategory);
      logActivity('إضافة قسم', `تم إضافة قسم جديد: ${category.name}`);
      showToast('تم إضافة الفئة بنجاح', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  }, [showToast, logActivity]);

  const updateCategory = React.useCallback(async (id: string, updatedData: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), updatedData);
      logActivity('تحديث قسم', `تم تحديث بيانات القسم`);
      showToast('تم تحديث الفئة بنجاح', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    }
  }, [showToast, logActivity]);

  const deleteCategory = React.useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      logActivity('حذف قسم', `تم حذف القسم بنجاح`);
      showToast(`تم حذف الفئة بنجاح`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'categories');
    }
  }, [showToast, logActivity]);

  const getRecommendations = React.useCallback(async (currentProduct?: Product) => {
    // If we have a Gemini API key, use AI, otherwise rule-based
    if (process.env.GEMINI_API_KEY) {
      return getAIRecommendations(recentlyViewed, cart, products, currentProduct);
    }
    return getRuleBasedRecommendations(recentlyViewed, cart, products, currentProduct);
  }, [recentlyViewed, cart, products]);

  const getRuleBasedRecommendationsContext = React.useCallback((currentProduct?: Product) => {
    return getRuleBasedRecommendations(recentlyViewed, cart, products, currentProduct);
  }, [recentlyViewed, cart, products]);

  const stateValue = useMemo(() => ({
    products, cart, wishlist, orders, user,
    notifications, notificationSettings, subscriptions, recentlyViewed, language, settings, categories, inventoryLogs, customers, discount, coupons,
    banners, marketingNotifications, adminUsers, activityLogs,
    supportTickets, blogPosts, staticPages, shippingZones, abandonedCarts, searchTerms, visits, systemError
  }), [products, cart, wishlist, orders, user, notifications, notificationSettings, subscriptions, recentlyViewed, language, settings, categories, inventoryLogs, customers, discount, coupons, banners, marketingNotifications, adminUsers, activityLogs, supportTickets, blogPosts, staticPages, shippingZones, abandonedCarts, searchTerms, visits, systemError]);

  const actionsValue = useMemo(() => ({
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    addToRecentlyViewed, getRecommendations,
    getRuleBasedRecommendations: getRuleBasedRecommendationsContext,
    setLanguage,
    updateSettings,
    addBanner, updateBanner, deleteBanner,
    sendMarketingNotification,
    addAdminUser, updateAdminUser, deleteAdminUser,
    logActivity,
    addTicket, updateTicketStatus, replyToTicket, deleteTicket,
    addBlogPost, updateBlogPost, deleteBlogPost,
    updateStaticPage,
    addShippingZone, updateShippingZone, deleteShippingZone, toggleShippingZoneStatus,
    trackSearch, trackVisit, bulkUpdatePrices,
    updateStock, bulkUpdateStock,
    updateCustomerBalance, addCustomerNote,
    updateCustomer, blockCustomer,
    addCustomer, deleteCustomer,
    addToCart, updateCartQuantity, removeFromCart, clearCart, placeOrder, updateOrderStatus,
    toggleWishlist, isInWishlist, updateUser, deleteAccount, logout,
    applyDiscountCode, removeDiscount,
    addCoupon, updateCoupon, deleteCoupon, toggleCouponStatus,
    subscribeToProduct, markNotificationAsRead, deleteNotification, clearAllNotifications, updateNotificationSettings,
    trackOrderById,
    setNotifications, formatPrice
  }), [
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    addToRecentlyViewed, getRecommendations,
    getRuleBasedRecommendationsContext,
    setLanguage,
    updateSettings,
    addBanner, updateBanner, deleteBanner,
    sendMarketingNotification,
    addAdminUser, updateAdminUser, deleteAdminUser,
    logActivity,
    addTicket, updateTicketStatus, replyToTicket, deleteTicket,
    addBlogPost, updateBlogPost, deleteBlogPost,
    updateStaticPage,
    addShippingZone, updateShippingZone, deleteShippingZone, toggleShippingZoneStatus,
    trackSearch, trackVisit, bulkUpdatePrices,
    updateStock, bulkUpdateStock,
    updateCustomerBalance, addCustomerNote,
    updateCustomer, blockCustomer,
    addCustomer, deleteCustomer,
    addToCart, updateCartQuantity, removeFromCart, clearCart, placeOrder, updateOrderStatus,
    toggleWishlist, isInWishlist, updateUser, deleteAccount, logout,
    applyDiscountCode, removeDiscount,
    addCoupon, updateCoupon, deleteCoupon, toggleCouponStatus,
    subscribeToProduct, markNotificationAsRead, deleteNotification, clearAllNotifications, updateNotificationSettings,
    trackOrderById,
    formatPrice
  ]);

  const uiValue = useMemo(() => ({
    toast, showToast,
    isCartOpen, setIsCartOpen,
    isPlacingOrder,
    isWishlistOpen, setIsWishlistOpen,
    isNotificationsOpen, setIsNotificationsOpen,
    isMobileSearchOpen, setIsMobileSearchOpen,
    isSearchInputFocused, setIsSearchInputFocused,
    canInstallPWA, installPWA
  }), [
    toast, showToast,
    isCartOpen, isPlacingOrder, isWishlistOpen, isNotificationsOpen, isMobileSearchOpen, isSearchInputFocused,
    canInstallPWA, installPWA
  ]);

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
    throw new Error('useStore must be used within a StoreProvider');
  }
  
  return useMemo(() => ({ ...state, ...actions, ...ui }), [state, actions, ui]);
}

export function useStoreState(): StoreState {
  const context = useContext(StoreStateContext);
  if (context === undefined) {
    throw new Error('useStoreState must be used within a StoreProvider');
  }
  return context;
}

export function useStoreActions(): StoreActions {
  const context = useContext(StoreActionsContext);
  if (context === undefined) {
    throw new Error('useStoreActions must be used within a StoreProvider');
  }
  return context;
}

export function useStoreUI(): StoreUI {
  const context = useContext(StoreUIContext);
  if (context === undefined) {
    throw new Error('useStoreUI must be used within a StoreProvider');
  }
  return context;
}
