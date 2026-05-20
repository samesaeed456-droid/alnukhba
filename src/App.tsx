import React, { Suspense, lazy, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { MotionConfig, motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout";
import { StoreProvider, useStore } from "./context/StoreContext";

// Eager load critical pages for instant navigation
import Home from "./pages/Home";
import Search from "./pages/Search";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";

const Cart = lazy(() => import("./pages/Cart.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));

// Lazy load less critical pages
const Wishlist = lazy(() => import("./pages/Wishlist.tsx"));
const Deals = lazy(() => import("./pages/Deals.tsx"));
const TrackOrder = lazy(() => import("./pages/TrackOrder.tsx"));
const Orders = lazy(() => import("./pages/Orders.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const FAQ = lazy(() => import("./pages/FAQ.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Returns = lazy(() => import("./pages/Returns.tsx"));
const Shipping = lazy(() => import("./pages/Shipping.tsx"));

// Admin Pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.tsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const AdminProducts = lazy(() => import("./pages/admin/Products.tsx"));
const AdminOrders = lazy(() => import("./pages/admin/Orders.tsx"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers.tsx"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/Settings.tsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics.tsx"));
const AdminMarketing = lazy(() => import("./pages/admin/Marketing.tsx"));
const AdminSecurity = lazy(() => import("./pages/admin/Security.tsx"));
const AdminMessages = lazy(() => import("./pages/admin/Messages.tsx"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews.tsx"));
const AdminLogistics = lazy(() => import("./pages/admin/Logistics.tsx"));
const AdminCloud = lazy(() => import("./pages/admin/Cloud.tsx"));
const AdminRecharges = lazy(() => import("./pages/admin/WalletRecharges.tsx"));
import Maintenance from "./pages/Maintenance";
import BlockedOverlay from "./components/BlockedOverlay";
import OfflineStatus from "./components/OfflineStatus";
import NotificationGatingModal from "./components/NotificationGatingModal";
import InstallAppBanner from "./components/InstallAppBanner";
import { AlertCircle, X, Bell } from "lucide-react";
import {
  requestNotificationPermission,
  onForegroundMessage,
  refreshNotificationToken,
} from "./lib/notifications";
import NotificationListener from "./components/NotificationListener";

const SystemAlert = () => {
  const { systemError } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (!systemError || dismissed) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className="bg-red-500/10 border-b border-red-500/20 backdrop-blur-md z-[9999] relative"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{systemError}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-red-500/10 rounded-full transition-colors text-red-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Prefetch utility for Vite's glob import for better reliability
const pages = import.meta.glob("./pages/**/*.tsx");
export const prefetch = (componentPath: string) => {
  const path = `./pages/${componentPath}.tsx`;
  const page = pages[path];
  if (page) return page();
  return Promise.reject(
    new Error(`Page ${componentPath} not found at ${path}`),
  );
};

const LoadingFallback = () => (
  <div className="fixed top-0 left-0 w-full h-0.5 bg-transparent z-[9999] overflow-hidden">
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="h-full bg-gradient-to-r from-transparent via-solar to-transparent w-1/2"
    />
  </div>
);

const MainRoutes = () => {
  const { settings, trackVisit } = useStore();
  const location = useLocation();

  useEffect(() => {
    trackVisit(location.pathname);
  }, [location.pathname, trackVisit]);

  useEffect(() => {
    if (settings.seo) {
      // Update Title
      if (settings.seo.metaTitle) {
        document.title = settings.seo.metaTitle;
      } else {
        document.title = settings.storeName;
      }

      // Update Meta Description
      if (settings.seo.metaDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement("meta");
          metaDesc.setAttribute("name", "description");
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute("content", settings.seo.metaDescription);
      }

      // Update Favicon
      if (settings.seo.favicon) {
        let link = document.querySelector(
          "link[rel*='icon']",
        ) as HTMLLinkElement;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = settings.seo.favicon;
      }

      // OG Tags
      const ogTags = [
        {
          property: "og:title",
          content: settings.seo.metaTitle || settings.storeName,
        },
        {
          property: "og:description",
          content: settings.seo.metaDescription || "",
        },
        { property: "og:image", content: settings.seo.ogImage || "" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: window.location.href },
      ];

      ogTags.forEach((tag) => {
        let meta = document.querySelector(`meta[property="${tag.property}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("property", tag.property);
          document.head.appendChild(meta);
        }
        if (tag.content) {
          meta.setAttribute("content", tag.content);
        }
      });
    }
  }, [settings]);

  const isAdminPath = location.pathname.startsWith("/admin");
  const [bypassMaintenance, setBypassMaintenance] = useState(
    sessionStorage.getItem("bypassMaintenance") === "true",
  );

  useEffect(() => {
    // Register notification handler
    onForegroundMessage();

    // Refresh token silently if permission is already granted
    refreshNotificationToken();

    // Check if we should ask for permission
    const hasAsked = localStorage.getItem("notifications_asked");
    if (!hasAsked) {
      const timer = setTimeout(() => {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            className="bg-[#111214]/90 backdrop-blur-2xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 pr-4 flex gap-3 items-center border border-[#c5a880]/30 w-fit max-w-[92vw] mx-auto pointer-events-auto ring-1 ring-white/5"
            dir="rtl"
          >
            <div className="w-8 h-8 bg-[#c5a880] rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-[#c5a880]/20">
              <Bell className="w-4 h-4 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white leading-tight">
                تفعيل التنبيهات؟ 🔔
              </span>
              <span className="text-[9px] text-[#c5a880]/80">لعروض حصرية وطلباتك</span>
            </div>
            <div className="flex gap-1 ml-1">
              <button
                onClick={() => {
                  requestNotificationPermission();
                  localStorage.setItem("notifications_asked", "true");
                  toast.dismiss(t);
                }}
                className="bg-[#c5a880] text-black text-[9px] font-black px-4 py-1.5 rounded-full active:scale-90 transition-all hover:brightness-110"
              >
                تفعيل
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("notifications_asked", "true");
                  toast.dismiss(t);
                }}
                className="bg-white/5 text-white/60 text-[9px] font-bold px-3 py-1.5 rounded-full active:scale-90 transition-all"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        ), { duration: 10000, position: 'top-center' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleBypass = () => {
    sessionStorage.setItem("bypassMaintenance", "true");
    setBypassMaintenance(true);
  };

  if (settings.isMaintenanceMode && !isAdminPath && !bypassMaintenance) {
    return <Maintenance onBypass={handleBypass} />;
  }

  return (
    <Routes>
      {/* Admin Login Route */}
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminLogin />
          </Suspense>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="marketing" element={<AdminMarketing />} />
        <Route path="security" element={<AdminSecurity />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="logistics" element={<AdminLogistics />} />
        <Route path="cloud" element={<AdminCloud />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="recharges" element={<AdminRecharges />} />
      </Route>

      {/* Store Routes */}
      <Route
        path="/*"
        element={
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/category/:categoryName" element={<Category />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signup" element={<Auth />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <StoreProvider>
        <NotificationListener />
        <OfflineStatus />
        <SystemAlert />
        <BlockedOverlay />
        <InstallAppBanner />
        <NotificationGatingModal />
        <MotionConfig reducedMotion="user">
          <Toaster
            position="top-center"
            expand={false}
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              className: "font-sans !border-none !shadow-none !bg-transparent",
              style: {
                direction: 'rtl',
              }
            }}
          />
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <MainRoutes />
            </Suspense>
          </Router>
        </MotionConfig>
      </StoreProvider>
    </HelmetProvider>
  );
}
