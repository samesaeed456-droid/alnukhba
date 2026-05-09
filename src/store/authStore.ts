import { create } from "zustand";
import { UserProfile } from "../types";
import { 
  auth, 
  adminAuth, 
  db, 
  adminDb, 
  doc, 
  getDoc, 
  onAuthStateChanged,
  updateDoc,
  serverTimestamp,
} from "../lib/firebase";
import { refreshNotificationToken } from "../lib/notifications";

interface AuthState {
  user: UserProfile | null;
  adminUser: UserProfile | null;
  isAuthReady: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setAdminUser: (admin: UserProfile | null) => void;
  setIsAuthReady: (ready: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  
  logout: () => Promise<void>;
  adminLogout: () => Promise<void>;
  
  // Initialization
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem("store_user") || "null"),
  adminUser: null,
  isAuthReady: false,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem("store_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("store_user");
    }
    set({ user });
  },

  setAdminUser: (admin) => set({ adminUser: admin }),
  
  setIsAuthReady: (ready) => set({ isAuthReady: ready }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),

  logout: async () => {
    await auth.signOut();
    localStorage.removeItem("store_user");
    localStorage.removeItem("local_session_id");
    localStorage.removeItem("last_session_ping");
    set({ user: null });
  },

  adminLogout: async () => {
    await adminAuth.signOut();
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("admin_role");
    set({ adminUser: null });
  },

  initialize: () => {
    // 1. Customer Auth Listener
    const unsubCustomer = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let localSessionId = localStorage.getItem("local_session_id");
        if (!localSessionId) {
          localSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem("local_session_id", localSessionId);
        }

        try {
          const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (docSnap.exists()) {
            const userData = { ...docSnap.data(), uid: docSnap.id } as UserProfile;
            
            // Basic validation
            if (userData.isActive === false) {
              await auth.signOut();
              get().setUser(null);
              set({ isAuthReady: true });
              return;
            }

            get().setUser(userData);
            
            // Session ping
            const lastPing = localStorage.getItem("last_session_ping");
            const now = Date.now();
            if (!lastPing || now - parseInt(lastPing) > 600000) {
              updateDoc(doc(db, "users", firebaseUser.uid), {
                currentSessionId: localSessionId,
                lastActive: new Date().toISOString(),
                updatedAt: serverTimestamp(),
              }).catch(() => {});
              localStorage.setItem("last_session_ping", now.toString());
            }

            // Sync Permissions logic (Super Admin Rescue)
            const hardcodedAdmins = [
              "samesaeed456@gmail.com",
              "samisaeed2027@gmail.com",
              "samisaeed2025@gmail.com",
            ];
            const userEmail = (userData.email || "").toLowerCase();
            if (hardcodedAdmins.includes(userEmail)) {
              if (userData.role !== "admin" || userData.adminRole !== "super_admin" || !userData.permissions?.includes("all")) {
                const updates: any = {
                  role: "admin",
                  adminRole: "super_admin",
                  isAdmin: true,
                  permissions: ["all"],
                  updatedAt: serverTimestamp(),
                };
                await updateDoc(doc(db, "users", firebaseUser.uid), updates);
                get().setUser({ ...userData, ...updates });
              }
            }

            refreshNotificationToken();
          } else {
            // Check if super admin (could be a migration case)
            const superAdmins = ["samesaeed456@gmail.com", "samisaeed2027@gmail.com", "samisaeed2025@gmail.com"];
            if (firebaseUser.email && superAdmins.includes(firebaseUser.email.toLowerCase())) {
              const adminData: any = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: "admin",
                isAdmin: true,
                displayName: "مدير النظام",
              };
              get().setUser(adminData);
            } else {
              get().setUser(null);
            }
          }
        } catch (error) {
          console.warn("Auth sync warning:", error);
          set({ isAuthReady: true });
        }
      } else {
        get().setUser(null);
      }
      set({ isAuthReady: true });
    });

    // 2. Admin Auth Listener
    const unsubAdmin = onAuthStateChanged(adminAuth, async (firebaseAdmin) => {
      if (firebaseAdmin) {
        try {
          const adminDoc = await getDoc(doc(adminDb, "users", firebaseAdmin.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data() as UserProfile;
            set({ 
              adminUser: { 
                ...adminData, 
                uid: adminDoc.id,
                isActive: adminData.isActive !== false 
              } 
            });
          } else {
            // Fallback for super admins
            const superAdmins = ["samesaeed456@gmail.com", "samisaeed2027@gmail.com", "samisaeed2025@gmail.com"];
            if (firebaseAdmin.email && superAdmins.includes(firebaseAdmin.email.toLowerCase())) {
              set({
                adminUser: {
                  uid: firebaseAdmin.uid,
                  email: firebaseAdmin.email,
                  role: "admin",
                  isAdmin: true,
                  displayName: "المدير العام",
                } as UserProfile
              });
            }
          }
        } catch (e) {
          console.warn("Admin sync warning:", e);
        }
      } else {
        set({ adminUser: null });
      }
    });

    return () => {
      unsubCustomer();
      unsubAdmin();
    };
  },
}));
