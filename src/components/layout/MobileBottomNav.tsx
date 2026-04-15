import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Tag, User } from 'lucide-react';
import { useStoreState, useStoreUI } from '../../context/StoreContext';
import { prefetch } from '../../App';
import { motion, AnimatePresence } from 'motion/react';
import { FastLink } from '../FastLink';

interface MobileBottomNavProps {}

export default React.memo(function MobileBottomNav({}: MobileBottomNavProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSearching = location.pathname === '/search' && searchParams.get('q');
  
  const { cart, user } = useStoreState();
  const { setIsCartOpen, isSearchInputFocused } = useStoreUI();
  const [cartShake, setCartShake] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const prevCartCount = useRef(0);
  
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 400);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  // Keyboard detection logic
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        const type = (target as HTMLInputElement).type;
        // Don't hide for radio, checkbox, submit, button, etc.
        if (!['radio', 'checkbox', 'submit', 'button', 'image', 'file'].includes(type)) {
          // Use a small timeout to ensure the keyboard is actually opening
          setTimeout(() => setIsKeyboardVisible(true), 100);
        }
      }
    };

    const handleFocusOut = () => {
      // Use a small timeout to ensure we're not just switching between inputs
      setTimeout(() => {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setIsKeyboardVisible(false);
        }
      }, 100);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const hideOnPaths = ['/checkout', '/auth', '/signup', '/cart'];
  const shouldHide = location.pathname.startsWith('/product/') || 
    isSearching || 
    isSearchInputFocused || 
    isKeyboardVisible || 
    hideOnPaths.includes(location.pathname);

  const navItems = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/search', icon: Grid, label: 'الأقسام', prefetch: 'Search' },
    { path: 'cart', icon: ShoppingCart, label: 'السلة', isButton: true, prefetch: 'Cart' },
    { path: '/deals', icon: Tag, label: 'العروض', prefetch: 'Deals' },
    { path: user ? '/profile' : '/auth', icon: User, label: 'حسابي', matchPaths: ['/profile', '/auth'], prefetch: user ? 'Profile' : 'Auth' },
  ];

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-[24px] border-t border-slate-200/40 z-50 rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-safe"
        >
          <div className="flex items-center justify-around h-16 px-4 relative">
            {navItems.map((item) => {
              const matchPaths = (item as any).matchPaths;
              const isActive = matchPaths 
                ? matchPaths.includes(location.pathname)
                : location.pathname === item.path;

              const Icon = item.icon;

              if (item.isButton) {
                return (
                  <button 
                    key={item.label}
                    onClick={() => setIsCartOpen(true)}
                    onMouseEnter={() => item.prefetch && prefetch(item.prefetch)}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-200 relative group"
                  >
                    <div className="relative flex flex-col items-center transition-all duration-500 group-hover:-translate-y-0.5">
                      <div className="p-1.5 rounded-xl transition-all duration-300 bg-transparent relative">
                        <Icon 
                          className={`w-5.5 h-5.5 transition-all duration-300 text-slate-500 ${cartShake ? 'animate-shake text-solar' : ''}`} 
                          strokeWidth={1.5}
                          fill="none"
                        />
                        {cartCount > 0 && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 bg-solar text-carbon text-[9px] font-black min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1 shadow-sm"
                          >
                            {cartCount > 99 ? '99+' : cartCount}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 transition-colors duration-300">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <FastLink 
                  key={item.label}
                  to={item.path} 
                  prefetchPage={item.prefetch as any}
                  className="flex-1 h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-200 relative group"
                >
                  <div className={`relative flex flex-col items-center transition-all duration-500 ${
                    isActive ? '-translate-y-1.5' : 'group-hover:-translate-y-0.5'
                  }`}>
                    <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                      isActive ? 'bg-solar/10' : 'bg-transparent'
                    }`}>
                      <Icon 
                        className={`w-5.5 h-5.5 transition-all duration-300 ${
                          isActive ? 'text-solar' : 'text-slate-500'
                        }`} 
                        strokeWidth={isActive ? 2 : 1.5}
                        fill="none"
                      />
                    </div>
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicator"
                          className="absolute -bottom-2.5 w-1.5 h-1.5 rounded-full bg-solar shadow-[0_0_8px_rgba(229,199,107,0.6)]"
                          initial={{ opacity: 0, scale: 0, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0, y: 5 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <span className={`text-[10px] transition-all duration-300 mt-0.5 ${
                    isActive ? 'text-solar font-bold scale-105' : 'text-slate-500 font-medium'
                  }`}>
                    {item.label}
                  </span>
                </FastLink>
              );
            })}
          </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
});
