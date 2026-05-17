import { create } from "zustand";
import { toast as sonnerToast } from "sonner";
import React from "react";

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
  canInstallPWA: boolean;
  setCanInstallPWA: (can: boolean) => void;
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
  installPWA: () => Promise<void>;
  showToast: (
    message: string,
    type?: "success" | "error" | "info",
    options?: ToastOptions,
  ) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCartOpen: false,
  setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  isWishlistOpen: false,
  setIsWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),
  isNotificationsOpen: false,
  setIsNotificationsOpen: (isOpen) => set({ isNotificationsOpen: isOpen }),
  isMobileSearchOpen: false,
  setIsMobileSearchOpen: (isOpen) => set({ isMobileSearchOpen: isOpen }),
  isSearchInputFocused: false,
  setIsSearchInputFocused: (isFocused) =>
    set({ isSearchInputFocused: isFocused }),
  isPlacingOrder: false,
  setIsPlacingOrder: (isPlacing) => set({ isPlacingOrder: isPlacing }),
  canInstallPWA: false,
  setCanInstallPWA: (canInstallPWA) => set({ canInstallPWA }),
  deferredPrompt: null,
  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
  
  installPWA: async () => {
    const { deferredPrompt, showToast } = get();
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
      set({ canInstallPWA: false, deferredPrompt: null });
    }
  },

  showToast: (message, type = "success", options) => {
    if (!message) return;

    // We'll use a more modern, customized sonner implementation
    sonnerToast.custom((t) => 
      React.createElement(
        "div",
        {
          className: `
            flex items-center gap-4 p-3 pr-4 rounded-3xl backdrop-blur-2xl border pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.2)] 
            w-[380px] max-w-[92vw] mx-auto animate-in fade-in slide-in-from-top-4 duration-500
            ${type === 'success' 
              ? 'bg-white/80 dark:bg-gray-900/80 border-white/50 dark:border-white/10' 
              : type === 'error'
              ? 'bg-red-50/90 dark:bg-red-950/80 border-red-200/50 dark:border-red-500/20'
              : 'bg-blue-50/90 dark:bg-blue-950/80 border-blue-200/50 dark:border-blue-500/20'
            }
          `,
          dir: "rtl"
        },
        // Accent Bar
        React.createElement("div", {
          className: `absolute top-0 right-0 w-1.5 h-full rounded-l-full ${
            type === 'success' ? 'bg-solar' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`
        }),
        
        // Icon / Image
        options?.image 
          ? React.createElement("img", {
              src: options.image,
              className: "w-11 h-11 rounded-2xl object-cover shadow-sm",
              alt: "toast"
            })
          : React.createElement("div", {
              className: `w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                type === 'success' ? 'bg-solar/10' : type === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
              }`
            },
            React.createElement("svg", {
              className: `w-6 h-6 ${type === 'success' ? 'text-solar' : type === 'error' ? 'text-red-600' : 'text-blue-600'}`,
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              strokeWidth: 2.5
            }, 
            type === 'success' 
              ? React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
              : type === 'error'
              ? React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
              : React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
            )
          ),

        // Message
        React.createElement("div", { className: "flex-1 min-w-0" },
          React.createElement("p", { 
            className: `text-[14px] font-black leading-tight ${
              type === 'success' ? 'text-gray-900 dark:text-white' : type === 'error' ? 'text-red-900 dark:text-red-100' : 'text-blue-900 dark:text-blue-100'
            }`
          }, message)
        ),

        // Action
        options?.action && React.createElement("button", {
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            options.action!.onClick();
            sonnerToast.dismiss(t);
          },
          className: `px-4 py-2 rounded-2xl text-[12px] font-black transition-all active:scale-95 whitespace-nowrap ${
            type === 'success' 
              ? 'bg-solar text-black shadow-lg shadow-solar/25' 
              : 'bg-white/50 dark:bg-black/20 text-current'
          }`
        }, options.action.label)
      ),
      {
        duration: 4000,
        position: 'top-center'
      }
    );
  },
}));
