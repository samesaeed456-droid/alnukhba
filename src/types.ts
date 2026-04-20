export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  category: string;
  isNew?: boolean;
  brand: string;
  description: string;
  specs: Record<string, string>;
  reviewsList: Review[];
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  stockCount?: number;
  costPrice?: number;
  minStock?: number;
  metaTitle?: string;
  metaDescription?: string;
  sku?: string;
  status?: 'active' | 'draft';
}

export interface CartItem {
  id: string; // Unique ID for cart item (product.id + color + size)
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  phone: string;
  countryCode?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'purchase';
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

export interface UserNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface UserProfile {
  uid?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  password?: string;
  email?: string;
  countryCode?: string;
  address?: string;
  addresses?: Address[];
  walletBalance?: number;
  transactions?: Transaction[];
  wishlist?: Product[];
  preferences?: {
    notifications?: boolean;
    language?: 'ar' | 'en';
  };
  notes?: UserNote[];
  totalSpent?: number;
  orderCount?: number;
  lastOrderDate?: string;
  lastActive?: string;
  joinDate?: string;
  isBlocked?: boolean;
  adminRole?: string;
  adminName?: string;
  tags?: string[];
  createdAt?: string;
  notifications?: any[];
  orders?: any[];
}

export interface Order {
  id: string;
  userId?: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  city?: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentReference?: string;
  paymentProof?: string;
  shippingMethod?: 'delivery' | 'pickup';
  deliveryInstructions?: string;
  currency: string;
  timeline?: {
    status: Order['status'];
    date: string;
    note?: string;
  }[];
}

export interface NotificationSubscription {
  productId: string;
  type: 'back_in_stock' | 'on_sale';
  email: string;
}

export interface NotificationSettings {
  sale: boolean;
  stock: boolean;
  order: boolean;
  promotions: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  productId?: string;
  type: 'sale' | 'stock' | 'order' | 'system';
  userId?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  description?: string;
  isActive: boolean;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  change: number;
  previousStock: number;
  newStock: number;
  date: string;
  user: string;
  reason?: string;
}

export interface Banner {
  id: string;
  image: string;
  images?: string[];
  title: string;
  subtitle?: string;
  link?: string;
  isActive: boolean;
  order: number;
  position?: 'hero' | 'middle' | 'bottom' | 'screens' | 'electronics' | 'solar' | 'accessories' | 'batteries';
  startDate?: string;
  endDate?: string;
  views: number;
  clicks: number;
}

export interface MarketingNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  target: 'all' | 'vip' | 'new' | 'inactive' | 'abandoned_cart' | 'specific_product' | 'specific_user';
  targetUserId?: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  status: 'sent' | 'scheduled' | 'draft';
  scheduledFor?: string;
  type: 'push' | 'email' | 'sms';
}

export type AdminPermission = 
  | 'view_dashboard'
  | 'manage_orders'
  | 'manage_products'
  | 'manage_customers'
  | 'manage_marketing'
  | 'manage_coupons'
  | 'manage_settings'
  | 'manage_security'
  | 'view_logs'
  | 'manage_logistics'
  | 'manage_messages';

export type AdminRole = 'super_admin' | 'manager' | 'editor' | 'support';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  password?: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  date: string;
  ip?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  logo?: string;
  accountNumber?: string;
  accountName?: string;
  instructions?: string;
  isActive: boolean;
  requiresProof: boolean;
  type: 'wallet' | 'bank' | 'other';
}

export interface StoreSettings {
  storeName: string;
  storeLogo?: string;
  contactEmail: string;
  contactPhone: string;
  contactPhone2?: string;
  address: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    snapchat?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  shippingFee: number;
  freeShippingThreshold: number;
  currency: string;
  language: 'ar' | 'en';
  isMaintenanceMode: boolean;
  maintenanceMessage?: string;
  announcementText?: string;
  primaryColor: string;
  fontFamily: string;
  homeSectionOrder: string[];
  autoNotifications?: {
    enabled: boolean;
    sms: boolean;
    email: boolean;
    onStatusChange: Order['status'][];
  };
  paymentMethods?: PaymentMethodConfig[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    favicon?: string;
    ogImage?: string;
    keywords?: string[];
  };
}

export interface Visit {
  id: string;
  sessionId: string;
  timestamp: string;
  page: string;
  referrer: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  country: string;
  city: string;
  duration: number;
  isUnique: boolean;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  replies: {
    id: string;
    sender: 'admin' | 'customer';
    message: string;
    timestamp: string;
  }[];
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  slug: string;
  tags: string[];
  isPublished: boolean;
}

export interface StaticPage {
  id: string;
  title: string;
  content: string;
  slug: string;
  lastUpdated: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  cities: string[];
  rate: number;
  freeThreshold?: number;
  estimatedDays?: string;
  isActive: boolean;
}

export interface AbandonedCart {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  lastActivity: string;
  recovered: boolean;
}

export interface SearchTerm {
  term: string;
  count: number;
  resultsCount: number;
  lastSearched: string;
}
