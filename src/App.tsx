import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import { StoreProvider, useStore } from './context/StoreContext';

// Eager load critical pages for instant navigation
import Home from './pages/Home';
import Search from './pages/Search';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';

const Cart = lazy(() => import('./pages/Cart.tsx'));
const Checkout = lazy(() => import('./pages/Checkout.tsx'));
const Auth = lazy(() => import('./pages/Auth.tsx'));
const Profile = lazy(() => import('./pages/Profile.tsx'));

// Lazy load less critical pages
const Wishlist = lazy(() => import('./pages/Wishlist.tsx'));
const Deals = lazy(() => import('./pages/Deals.tsx'));
const TrackOrder = lazy(() => import('./pages/TrackOrder.tsx'));
const Orders = lazy(() => import('./pages/Orders.tsx'));
const Notifications = lazy(() => import('./pages/Notifications.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));
const Contact = lazy(() => import('./pages/Contact.tsx'));
const Terms = lazy(() => import('./pages/Terms.tsx'));
const Privacy = lazy(() => import('./pages/Privacy.tsx'));
const FAQ = lazy(() => import('./pages/FAQ.tsx'));
const About = lazy(() => import('./pages/About.tsx'));
const Returns = lazy(() => import('./pages/Returns.tsx'));
const Shipping = lazy(() => import('./pages/Shipping.tsx'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.tsx'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.tsx'));
const AdminProducts = lazy(() => import('./pages/admin/Products.tsx'));
const AdminCategories = lazy(() => import('./pages/admin/Categories.tsx'));
const AdminOrders = lazy(() => import('./pages/admin/Orders.tsx'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers.tsx'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons.tsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.tsx'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics.tsx'));
const AdminActivityLogs = lazy(() => import('./pages/admin/ActivityLogs.tsx'));
const AdminMarketing = lazy(() => import('./pages/admin/Marketing.tsx'));
const AdminSecurity = lazy(() => import('./pages/admin/Security.tsx'));
const AdminMessages = lazy(() => import('./pages/admin/Messages.tsx'));
const AdminLogistics = lazy(() => import('./pages/admin/Logistics.tsx'));
const AdminCloud = lazy(() => import('./pages/admin/Cloud.tsx'));
import Maintenance from './pages/Maintenance';
import BlockedOverlay from './components/BlockedOverlay';
import OfflineStatus from './components/OfflineStatus';
import { AlertCircle, X } from 'lucide-react';

const SystemAlert = () => {
  const { systemError } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (!systemError || dismissed) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
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
const pages = import.meta.glob('./pages/**/*.tsx');
export const prefetch = (componentPath: string) => {
  const path = `./pages/${componentPath}.tsx`;
  const page = pages[path];
  if (page) return page();
  return Promise.reject(new Error(`Page ${componentPath} not found at ${path}`));
};

const LoadingFallback = () => (
  <div className="fixed top-0 left-0 w-full h-0.5 bg-transparent z-[9999] overflow-hidden">
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
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
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', settings.seo.metaDescription);
      }

      // Update Favicon
      if (settings.seo.favicon) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.seo.favicon;
      }
      
      // OG Tags
      const ogTags = [
        { property: 'og:title', content: settings.seo.metaTitle || settings.storeName },
        { property: 'og:description', content: settings.seo.metaDescription || '' },
        { property: 'og:image', content: settings.seo.ogImage || '' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: window.location.href }
      ];

      ogTags.forEach(tag => {
        let meta = document.querySelector(`meta[property="${tag.property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', tag.property);
          document.head.appendChild(meta);
        }
        if (tag.content) {
          meta.setAttribute('content', tag.content);
        }
      });
    }
  }, [settings]);

  const isAdminPath = location.pathname.startsWith('/admin');
  const [bypassMaintenance, setBypassMaintenance] = useState(
    sessionStorage.getItem('bypassMaintenance') === 'true'
  );

  const handleBypass = () => {
    sessionStorage.setItem('bypassMaintenance', 'true');
    setBypassMaintenance(true);
  };

  if (settings.isMaintenanceMode && !isAdminPath && !bypassMaintenance) {
    return <Maintenance onBypass={handleBypass} />;
  }

  return (
    <Routes>
      {/* Admin Login Route */}
      <Route path="/admin/login" element={
        <Suspense fallback={<LoadingFallback />}>
          <AdminLogin />
        </Suspense>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="marketing" element={<AdminMarketing />} />
        <Route path="security" element={<AdminSecurity />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="logistics" element={<AdminLogistics />} />
        <Route path="cloud" element={<AdminCloud />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="logs" element={<AdminActivityLogs />} />
      </Route>

      {/* Store Routes */}
      <Route path="/*" element={
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
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <OfflineStatus />
      <SystemAlert />
      <BlockedOverlay />
      <MotionConfig reducedMotion="user">
        <Toaster 
          position="top-center" 
          offset="24px"
          duration={1500}
          closeButton
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
              padding: '14px 20px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'inherit',
            },
            className: 'font-sans',
          }}
        />
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <MainRoutes />
          </Suspense>
        </Router>
      </MotionConfig>
    </StoreProvider>
  );
}
