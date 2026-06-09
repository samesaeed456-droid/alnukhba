import { create } from "zustand";
import { showLuxuryToast } from "../lib/luxuryToast";

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
  liveVisitorsCount: number;
  setLiveVisitorsCount: (count: number) => void;
  installPWA: () => Promise<void>;
  showToast: (
    message: string,
    type?: "success" | "error" | "info" | "warning",
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
  liveVisitorsCount: 0,
  setLiveVisitorsCount: (liveVisitorsCount) => set({ liveVisitorsCount }),
  
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

    showLuxuryToast(type, {
      title: type === 'success' ? "تم بنجاح!" : type === 'error' ? "خطأ!" : "تنبيه",
      description: message,
      image: options?.image,
      actionText: options?.action?.label,
      onAction: options?.action?.onClick,
    });
  },
}));
