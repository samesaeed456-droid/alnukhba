import { create } from "zustand";
import { StoreSettings, Banner, Coupon, StaticPage, ShippingZone, CityData, MarketingNotification } from "../types";
import { db, doc, onSnapshot, getDocs, collection, updateDoc, serverTimestamp, query, limit, orderBy } from "../lib/firebase";

interface SettingsState {
  settings: StoreSettings;
  banners: Banner[];
  coupons: Coupon[];
  staticPages: StaticPage[];
  shippingZones: ShippingZone[];
  cities: CityData[];
  language: "ar" | "en";
  
  marketingNotifications: MarketingNotification[];

  // Actions
  setSettings: (settings: StoreSettings) => void;
  setBanners: (banners: Banner[]) => void;
  setCoupons: (coupons: Coupon[]) => void;
  setStaticPages: (pages: StaticPage[]) => void;
  setShippingZones: (zones: ShippingZone[]) => void;
  setCities: (cities: CityData[]) => void;
  setLanguage: (lang: "ar" | "en") => void;
  setMarketingNotifications: (notifications: MarketingNotification[]) => void;
  
  updateSettings: (updates: Partial<StoreSettings>) => Promise<void>;
  initializeSettings: () => () => void;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "متجري",
  contactEmail: "",
  contactPhone: "",
  address: "",
  ownerName: "حسين عبد الكريم هزاع",
  shippingFee: 0,
  freeShippingThreshold: 0,
  currency: "YER",
  language: "ar",
  isMaintenanceMode: false,
  primaryColor: "#000000",
  backgroundColor: "#FFFFFF",
  cardColor: "#FFFFFF",
  textColor: "#0F172A",
  textMutedColor: "#64748B",
  fontFamily: "Inter",
  homeSectionOrder: ["hero", "categories", "deals", "featured", "new_arrivals"],
  announcementSettings: {
    enabled: true,
    announcements: [
      { id: "1", text: "توصيل مجاني وسريع — للطلبات فوق 50 ألف ﷼", isActive: true }
    ],
    isMarquee: true,
    backgroundColor: "#F8FAFC",
    textColor: "#0F172A",
    speed: 15
  }
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: JSON.parse(localStorage.getItem("store_settings") || JSON.stringify(DEFAULT_SETTINGS)),
  banners: JSON.parse(localStorage.getItem("store_banners") || "[]"),
  coupons: JSON.parse(localStorage.getItem("store_coupons") || "[]"),
  staticPages: [],
  shippingZones: [],
  cities: [],
  language: (localStorage.getItem("store_language") as "ar" | "en") || "ar",
  marketingNotifications: JSON.parse(localStorage.getItem("store_marketing_notifications") || "[]"),

  setSettings: (settings) => {
    // If we have custom colors nested in announcementSettings, pull them to flat top-level properties
    const themeColors = settings.announcementSettings?.themeColors || {};
    const mergedSettings = {
      ...settings,
      backgroundColor: themeColors.backgroundColor || settings.backgroundColor || "#FFFFFF",
      cardColor: themeColors.cardColor || settings.cardColor || "#FFFFFF",
      textColor: themeColors.textColor || settings.textColor || "#0F172A",
      textMutedColor: themeColors.textMutedColor || settings.textMutedColor || "#64748B",
    };
    localStorage.setItem("store_settings", JSON.stringify(mergedSettings));
    set({ settings: mergedSettings });
  },
  
  setBanners: (banners) => {
    localStorage.setItem("store_banners", JSON.stringify(banners));
    set({ banners });
  },

  setCoupons: (coupons) => {
    localStorage.setItem("store_coupons", JSON.stringify(coupons));
    set({ coupons });
  },

  setStaticPages: (staticPages) => set({ staticPages }),
  setShippingZones: (shippingZones) => set({ shippingZones }),
  setCities: (cities) => set({ cities }),

  setLanguage: (language) => {
    localStorage.setItem("store_language", language);
    set({ language });
  },

  setMarketingNotifications: (marketingNotifications) => {
    localStorage.setItem("store_marketing_notifications", JSON.stringify(marketingNotifications));
    set({ marketingNotifications });
  },

  updateSettings: async (updates) => {
    const dbUpdates: any = { ...updates };
    
    // Intercept design color updates and format them as nested JSON inside announcementSettings
    if (
      updates.primaryColor ||
      updates.backgroundColor ||
      updates.cardColor ||
      updates.textColor ||
      updates.textMutedColor
    ) {
      const currentAnnounce = updates.announcementSettings || get().settings.announcementSettings || {};
      dbUpdates.announcementSettings = {
        ...currentAnnounce,
        themeColors: {
          primaryColor: updates.primaryColor || get().settings.primaryColor || "#000000",
          backgroundColor: updates.backgroundColor || get().settings.backgroundColor || "#FFFFFF",
          cardColor: updates.cardColor || get().settings.cardColor || "#FFFFFF",
          textColor: updates.textColor || get().settings.textColor || "#0F172A",
          textMutedColor: updates.textMutedColor || get().settings.textMutedColor || "#64748B",
        }
      };
    }

    await updateDoc(doc(db, "settings", "store"), {
      ...dbUpdates,
      updatedAt: serverTimestamp(),
    });
    get().setSettings({ ...get().settings, ...updates });
  },

  initializeSettings: () => {
    // 1. Sync settings in real-time
    const unsubSettings = onSnapshot(doc(db, "settings", "store"), (docSnap) => {
      if (docSnap.exists()) {
        get().setSettings(docSnap.data() as StoreSettings);
      }
    }, (error) => {
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        operationType: "get",
        path: "settings/store",
        authInfo: { userId: null }
      };
      console.error("Firestore Error [settingsStore:initializeSettings]: ", JSON.stringify(errInfo));
    });

    // 2. Fetch marketing notifications
    const fetchMarketing = async () => {
      try {
        const snap = await getDocs(query(collection(db, "marketing_notifications"), orderBy("date", "desc"), limit(50)));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingNotification));
        get().setMarketingNotifications(data);
      } catch (e) {}
    };
    fetchMarketing();

    return () => {
      unsubSettings();
    };
  }
}));
