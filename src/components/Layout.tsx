import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, X, AlertCircle, Info as InfoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { useStoreUI } from '../context/StoreContext';

// Layout Components
import Header from './layout/Header';
import Footer from './layout/Footer';
import MobileBottomNav from './layout/MobileBottomNav';

import MobileMenu from './MobileMenu';
import CartDrawer from './layout/CartDrawer';
import WishlistDrawer from './layout/WishlistDrawer';
import NotificationsDrawer from './layout/NotificationsDrawer';
import FloatingActions from './layout/FloatingActions';
import InstallPrompt from './InstallPrompt';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSearching = location.pathname === '/search' && searchParams.get('q');
  
  const { isCartOpen, setIsCartOpen, isWishlistOpen, setIsWishlistOpen } = useStoreUI();

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

  return (
    <div className="min-h-screen flex flex-col font-sans text-carbon transition-colors duration-200" dir="rtl">
      <Header 
        scrolled={scrolled} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

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

      <InstallPrompt />
    </div>
  );
}
