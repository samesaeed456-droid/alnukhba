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

  // Dynamic color customization dynamically mapping brand colours to root CSS variables
  useEffect(() => {
    if (settings && settings.primaryColor) {
      const root = document.documentElement;
      const primaryHex = settings.primaryColor;

      const hexToRgba = (hex: string, alpha: number) => {
        let cleanHex = hex.replace("#", "");
        if (cleanHex.length === 3) {
          cleanHex = cleanHex.split("").map((c) => c + c).join("");
        }
        const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
        const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
        const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const adjustBrightness = (hex: string, percent: number) => {
        let cleanHex = hex.replace("#", "");
        if (cleanHex.length === 3) {
          cleanHex = cleanHex.split("").map((c) => c + c).join("");
        }
        let r = parseInt(cleanHex.substring(0, 2), 16) || 0;
        let g = parseInt(cleanHex.substring(2, 4), 16) || 0;
        let b = parseInt(cleanHex.substring(4, 6), 16) || 0;

        r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
        g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
        b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));

        const rHex = r.toString(16).padStart(2, "0");
        const gHex = g.toString(16).padStart(2, "0");
        const bHex = b.toString(16).padStart(2, "0");

        return `#${rHex}${gHex}${bHex}`;
      };

      root.style.setProperty("--primary-gold", primaryHex);

      const hoverHex = adjustBrightness(primaryHex, -20);
      root.style.setProperty("--primary-gold-hover", hoverHex);

      const glowRgba = hexToRgba(primaryHex, 0.15);
      root.style.setProperty("--primary-glow", glowRgba);

      // Compute premium gradient stops for luxury gold buttons
      const gradientStart = adjustBrightness(primaryHex, 35);
      const gradientEnd = adjustBrightness(primaryHex, -35);
      root.style.setProperty("--primary-gold-start", gradientStart);
      root.style.setProperty("--primary-gold-end", gradientEnd);

      // Simple luminance calculation to decide whether button text should be light or dark
      const getLuminance = (hex: string) => {
        let cleanHex = hex.replace("#", "");
        if (cleanHex.length === 3) {
          cleanHex = cleanHex.split("").map((c) => c + c).join("");
        }
        const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
        const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
        const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
        return (r * 299 + g * 587 + b * 114) / 1000;
      };

      const primaryLuminance = getLuminance(primaryHex);
      const isPrimaryLight = primaryLuminance > 155;
      root.style.setProperty("--button-text", isPrimaryLight ? "#0F172A" : "#FFFFFF");

      // Dynamic header / footer deep dark contrast tones
      let primaryDark = "#0F172A"; // Default slate
      let textHeader = "#FFFFFF";

      if (settings.backgroundColor) {
        root.style.setProperty("--bg-general", settings.backgroundColor);
        
        // Dynamic helper to judge dark/light and compute contrasting backgrounds for nesting components
        const isDarkColor = (hex: string) => {
          return getLuminance(hex) < 128;
        };

        const backgroundIsDark = isDarkColor(settings.backgroundColor);
        const sectionBg = adjustBrightness(settings.backgroundColor, backgroundIsDark ? 10 : -4);
        const hoverBg = adjustBrightness(settings.backgroundColor, backgroundIsDark ? 15 : -6);
        root.style.setProperty("--bg-section", sectionBg);
        root.style.setProperty("--bg-hover", hoverBg);

        if (backgroundIsDark) {
          // In a dark theme, headers and footers blend with cardColor or a deep shade of background
          primaryDark = settings.cardColor || settings.backgroundColor;
          textHeader = settings.textColor || "#FFFFFF";
        } else {
          // In a light theme, we create a very classy ultra-deep dark shade matching the chosen primary color
          // This ensures header/footer contrast remains gorgeous while color-matching the store perfectly!
          primaryDark = adjustBrightness(primaryHex, -85);
          textHeader = "#FFFFFF";
        }
      }

      root.style.setProperty("--primary-dark", primaryDark);
      root.style.setProperty("--text-header", textHeader);

      if (settings.cardColor) {
        root.style.setProperty("--bg-card", settings.cardColor);
      }

      if (settings.textColor) {
        root.style.setProperty("--text-main", settings.textColor);
      }

      if (settings.textMutedColor) {
        root.style.setProperty("--text-muted", settings.textMutedColor);
      }
    }
  }, [
    settings?.primaryColor,
    settings?.backgroundColor,
    settings?.cardColor,
    settings?.textColor,
    settings?.textMutedColor,
  ]);

  // Dynamic font loading and border-radius override logic
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;

    // 1. Handle Font Family Setup & Google Font Dynamic Import
    const font = settings.fontFamily || "Cairo";
    root.style.setProperty("--font-sans", `'${font}', "Cairo", ui-sans-serif, system-ui, sans-serif`);
    document.body.style.fontFamily = `'${font}', "Cairo", sans-serif`;

    // Dynamic Google Fonts Loader
    if (font !== "Cairo") {
      const fontId = `google-font-${font.toLowerCase().replace(/\s+/g, "-")}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        
        let fontApiName = font;
        if (font === "El Messiri") fontApiName = "El+Messiri";
        else if (font === "Playfair Display") fontApiName = "Playfair+Display";
        else if (font === "Space Grotesk") fontApiName = "Space+Grotesk";
        else if (font === "JetBrains Mono") fontApiName = "JetBrains+Mono";
        
        link.href = `https://fonts.googleapis.com/css2?family=${fontApiName}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }

    // 2. Handle Border Rounding Customization
    const rounding = settings.borderRadius || "soft";
    if (rounding === "sharp") {
      root.style.setProperty("--radius-sm", "0px");
      root.style.setProperty("--radius-md", "0px");
      root.style.setProperty("--radius-lg", "0px");
      root.style.setProperty("--radius-xl", "0px");
      root.style.setProperty("--radius-2xl", "0px");
      root.style.setProperty("--radius-3xl", "0px");
      root.style.setProperty("--radius-base", "0px");
    } else if (rounding === "curved") {
      root.style.setProperty("--radius-sm", "6px");
      root.style.setProperty("--radius-md", "12px");
      root.style.setProperty("--radius-lg", "16px");
      root.style.setProperty("--radius-xl", "24px");
      root.style.setProperty("--radius-2xl", "32px");
      root.style.setProperty("--radius-3xl", "40px");
      root.style.setProperty("--radius-base", "12px");
    } else {
      // "soft" (Default balanced premium look)
      root.style.setProperty("--radius-sm", "4px");
      root.style.setProperty("--radius-md", "8px");
      root.style.setProperty("--radius-lg", "12px");
      root.style.setProperty("--radius-xl", "16px");
      root.style.setProperty("--radius-2xl", "24px");
      root.style.setProperty("--radius-3xl", "32px");
      root.style.setProperty("--radius-base", "8px");
    }
  }, [settings?.fontFamily, settings?.borderRadius]);

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
