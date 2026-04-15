import { create } from 'zustand';
import { toast as sonnerToast } from 'sonner';
import React from 'react';

interface ToastOptions {
  image?: string;
  action?: { label: string; onClick: () => void };
}

interface UIState {
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
  isPlacingOrder: boolean;
  setIsPlacingOrder: (isPlacing: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info', options?: ToastOptions) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  isWishlistOpen: false,
  setIsWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),
  isNotificationsOpen: false,
  setIsNotificationsOpen: (isOpen) => set({ isNotificationsOpen: isOpen }),
  isMobileSearchOpen: false,
  setIsMobileSearchOpen: (isOpen) => set({ isMobileSearchOpen: isOpen }),
  isSearchInputFocused: false,
  setIsSearchInputFocused: (isFocused) => set({ isSearchInputFocused: isFocused }),
  isPlacingOrder: false,
  setIsPlacingOrder: (isPlacing) => set({ isPlacingOrder: isPlacing }),
  
  showToast: (message, type = 'success', options) => {
    if (!message) return;
    
    const hasCustomContent = options?.image || options?.action;
    
    // Using React.createElement instead of JSX to avoid TSX parsing issues in a .ts file
    const toastContent = hasCustomContent ? 
      React.createElement('div', { className: "flex items-center justify-between w-full gap-3 py-0.5" },
        React.createElement('div', { className: "flex items-center gap-3 flex-1 min-w-0" },
          options?.image && React.createElement('img', { src: options.image, alt: "toast-img", className: "w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" }),
          React.createElement('span', { className: "text-sm font-medium text-white truncate" }, message)
        ),
        options?.action && React.createElement('button', {
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            options.action!.onClick();
            sonnerToast.dismiss();
          },
          className: "text-[10px] font-bold bg-gold-gradient text-black px-4 py-2 rounded-full whitespace-nowrap hover:scale-105 transition-transform shrink-0 shadow-gold"
        }, options.action.label)
      ) : message;

    const toastOptions = {
      icon: type === 'success' ? 
        React.createElement('div', { className: "w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center shrink-0 shadow-gold" },
          React.createElement('svg', { className: "w-3.5 h-3.5 text-black", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3 },
            React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
          )
        ) : undefined,
    };

    if (type === 'error') {
      sonnerToast.error(toastContent as any, toastOptions);
    } else if (type === 'info') {
      sonnerToast.info(toastContent as any, toastOptions);
    } else {
      sonnerToast.success(toastContent as any, toastOptions);
    }
  }
}));
