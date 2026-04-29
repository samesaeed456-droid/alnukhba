import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, X, AlertCircle, Info as InfoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
// Layout Components
import Header from './layout/Header';
import Footer from './layout/Footer';
import MobileBottomNav from './layout/MobileBottomNav';

import MobileMenu from './MobileMenu';
import CartDrawer from './layout/CartDrawer';
import WishlistDrawer from './layout/WishlistDrawer';
import NotificationsDrawer from './layout/NotificationsDrawer';
import FloatingActions from './layout/FloatingActions';
import { useStore, useStoreUI } from '../context/StoreContext';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const isSearching = location.pathname === '/search' && searchParams.get('q');
  
  const { isCartOpen, setIsCartOpen, isWishlistOpen, setIsWishlistOpen } = useStoreUI();
  const { user, isAuthReady } = useStore();

  // AUTH GUARD: Force incomplete/deleted profiles to auth page
  useEffect(() => {
    // Skip guard for admin paths or auth-related paths
    if (location.pathname.startsWith('/admin')) return;
    
    if (isAuthReady && !user && auth.currentUser && !['/auth', '/signup'].includes(location.pathname)) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthReady, user, location.pathname, navigate]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);



  const hideFooterPaths = [
    '/profile', 
    '/checkout', 
    '/auth', 
    '/signup', 
    '/cart', 
    '/track-order', 
    '/notifications', 
    '/orders',
    '/wishlist',
    '/compare',
    '/search',
    '/deals'
  ];
  const isFooterVisible = !hideFooterPaths.includes(location.pathname);
  
  // Professional check for bottom nav visibility to adjust padding
  const hideBottomNavPaths = ['/checkout', '/auth', '/signup', '/cart'];
  const isBottomNavVisible = !location.pathname.startsWith('/product/') && 
    !isSearching && 
    !hideBottomNavPaths.includes(location.pathname);

  // Paths where header should be hidden on mobile
  const hideHeaderMobilePaths = ['/auth', '/signup'];
  const isHeaderMobileHidden = hideHeaderMobilePaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col font-sans text-carbon transition-colors duration-200" dir="rtl">
      <div className={isHeaderMobileHidden ? 'hidden md:block' : ''}>
        <Header 
          scrolled={scrolled} 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />
      </div>

      <main className={`flex-grow w-full ${(!isFooterVisible && isBottomNavVisible) ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </main>

      {isFooterVisible && <Footer />}

      <MobileBottomNav />

      <CartDrawer />
      <WishlistDrawer />
      <NotificationsDrawer />

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <FloatingActions 
        showScrollTop={showScrollTop} 
        scrollToTop={scrollToTop} 
      />
    </div>
  );
}
