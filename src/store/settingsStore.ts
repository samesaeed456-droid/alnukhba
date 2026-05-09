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
  shippingFee: 0,
  freeShippingThreshold: 0,
  currency: "YER",
  language: "ar",
  isMaintenanceMode: false,
  primaryColor: "#000000",
  fontFamily: "Inter",
  homeSectionOrder: ["hero", "categories", "deals", "featured", "new_arrivals"]
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
    localStorage.setItem("store_settings", JSON.stringify(settings));
    set({ settings });
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
    await updateDoc(doc(db, "settings", "store"), {
      ...updates,
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
