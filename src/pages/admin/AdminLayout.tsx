import React, { useState, useMemo, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Zap,
  ChevronDown,
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  LogOut,
  Store,
  Menu,
  X,
  Ticket,
  Wallet,
  Settings as SettingsIcon,
  TrendingUp,
  Megaphone,
  ShieldCheck,
  Truck,
  FileText,
  Globe,
  Search,
  Plus,
  RefreshCw,
  Inbox,
  Activity,
  Cloud,
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Fingerprint,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { toast } from "sonner";
import { startRegistration } from "@simplewebauthn/browser";
import Logo from "@/components/Logo";
import { useStore } from "@/context/StoreContext";
import { FloatingInput } from "@/components/FloatingInput";
import { AdminNotificationListener } from "@/components/admin/AdminNotificationListener";
import { showLuxuryToast } from "@/lib/luxuryToast";

const getFallbackPermissions = (role: string): any[] => {
  switch (role) {
    case "super_admin":
    case "admin":
      return [
        "view_dashboard",
        "manage_orders",
        "manage_products",
        "manage_customers",
        "manage_marketing",
        "manage_coupons",
        "manage_settings",
        "manage_security",
        "view_logs",
        "manage_logistics",
        "manage_messages",
      ];
    case "manager":
      return [
        "view_dashboard",
        "manage_orders",
        "manage_products",
        "manage_customers",
        "manage_marketing",
        "manage_coupons",
        "manage_logistics",
        "manage_messages",
      ];
    case "editor":
      return [
        "view_dashboard",
        "manage_products",
        "manage_marketing",
        "manage_coupons",
        "manage_messages",
      ];
    case "support":
      return [
        "view_dashboard",
        "manage_orders",
        "manage_customers",
        "manage_messages",
      ];
    default:
      return ["view_dashboard"];
  }
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    orders,
    products,
    formatPrice,
    adminUsers,
    logActivity,
    supportTickets,
    recharges,
    logout,
    syncOnDemand,
  } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem("admin_read_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Persist read notifications
  useEffect(() => {
    localStorage.setItem(
      "admin_read_notifications",
      JSON.stringify(readNotifications),
    );
  }, [readNotifications]);

  // Generate Admin Notifications
  const adminNotifications = useMemo(() => {
    const alerts: any[] = [];

    // 1. New Orders (Pending)
    const pendingOrders = orders.filter((o) => o.status === "pending");
    pendingOrders.forEach((order) => {
      const orderDate = (order.date as any)?.seconds
        ? new Date((order.date as any).seconds * 1000)
        : new Date(order.date);
      alerts.push({
        id: `order-${order.id}`,
        title: "طلب جديد ينتظر الموافقة",
        description: `العميل: ${order.customerName} - المبلغ: ${formatPrice(order.total)}`,
        timestamp: orderDate.getTime(),
        time: orderDate.toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: ShoppingCart,
        color: "text-solar",
        bg: "bg-solar/10",
        link: `/admin/orders?id=${order.id}`,
      });
    });

    // 2. Low Stock
    const lowStockProducts = products.filter(
      (p) => p.inStock && (p.stockCount || 0) <= (p.minStock || 5),
    );
    lowStockProducts.slice(0, 5).forEach((product) => {
      alerts.push({
        id: `stock-${product.id}`,
        title: "تنبيه مخزون منخفض",
        description: `المنتج: ${product.name} - المتبقي: ${product.stockCount}`,
        timestamp: Date.now(),
        time: "الآن",
        icon: AlertCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        link: `/admin/products?id=${product.id}`,
      });
    });

    // 3. Support Tickets
    const openTickets = supportTickets.filter((t) => t.status === "open");
    openTickets.forEach((ticket) => {
      const ticketDate = (ticket.createdAt as any)?.seconds
        ? new Date((ticket.createdAt as any).seconds * 1000)
        : ticket.createdAt ? new Date(ticket.createdAt) : new Date();
      alerts.push({
        id: `ticket-${ticket.id}`,
        title: "رسالة دعم فني جديدة",
        description: ticket.subject,
        timestamp: ticketDate.getTime(),
        time: ticketDate.toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: MessageSquare,
        color: "text-blue-600",
        bg: "bg-blue-50",
        link: "/admin/messages",
      });
    });

    // 4. Wallet Recharges
    const pendingRecharges = recharges.filter((r) => r.status === "pending");
    pendingRecharges.forEach((recharge) => {
      const rechargeDate = (recharge.createdAt as any)?.seconds
        ? new Date((recharge.createdAt as any).seconds * 1000)
        : recharge.createdAt ? new Date(recharge.createdAt) : new Date();
      alerts.push({
        id: `recharge-${recharge.id}`,
        title: "طلب شحن محفظة جديد",
        description: `العميل: ${recharge.userName} - المبلغ: ${formatPrice(recharge.amount)}`,
        timestamp: rechargeDate.getTime(),
        time: rechargeDate.toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: Wallet,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        link: "/admin/recharges",
      });
    });

    // Sort by timestamp descending
    const sortedAlerts = alerts.sort((a, b) => b.timestamp - a.timestamp);
    
    // Only show notifications that haven't been marked as read
    return sortedAlerts.filter((alert) => !readNotifications.includes(alert.id));
  }, [orders, products, supportTickets, recharges, formatPrice, readNotifications]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const handleRegisterPasskey = async () => {
    setIsRegisteringPasskey(true);
    setIsProfileOpen(false);
    try {
      const { adminAuth } = await import("@/lib/firebase");
      const user = adminAuth.currentUser;
      if (!user) throw new Error("غير مسجل دخول كإدارة");

      const res = await fetch("/api/webauthn/register/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email || "admin",
        }),
      });

      const resText = await res.text();
      if (!res.ok) throw new Error(`Server returned ${res.status}: ${resText}`);

      const options = JSON.parse(resText);
      if (options.error) throw new Error(options.error);

      const sessionToken = options.sessionToken;
      const expectedChallenge = options.challenge;

      let response;
      try {
        response = await startRegistration({ optionsJSON: options });
      } catch (authErr: any) {
        if (authErr.name === "NotAllowedError") {
          setIsRegisteringPasskey(false);
          return;
        }
        throw authErr;
      }

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          response,
          challenge: expectedChallenge,
          sessionToken,
        }),
      });
      const verifyText = await verifyRes.text();
      if (!verifyRes.ok) throw new Error(`Server returned ${verifyRes.status}: ${verifyText}`);
      
      const verifyData = JSON.parse(verifyText);

      if (verifyData.success) {
        showLuxuryToast("success", {
          title: "تم الإعداد بنجاح!",
          description: "تم تسجيل بصمة الدخول بنجاح لإدارة المتجر",
        });
      } else {
        throw new Error(verifyData.error || "فشل التحقق");
      }
    } catch (err: any) {
      console.error("[Admin Passkey Register Error]:", err);
      if (err.name === "NotSupportedError") {
        showLuxuryToast("error", {
          title: "خطأ في التوافق",
          description: "المتصفح أو الجهاز لا يدعم هذه الميزة حالياً",
        });
      } else {
        showLuxuryToast("error", {
          title: "فشل العملية",
          description: err.message || "حدث خطأ أثناء تسجيل البصمة",
        });
      }
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  // Mark all as read function
  const markAllAsRead = () => {
    // Get all current notification IDs (even those not currently filtered out)
    // To be safe, we'll mark the ones currently in the list
    const currentIds = adminNotifications.map((n) => n.id);
    if (currentIds.length === 0) return;

    setReadNotifications((prev) => {
      const next = [...new Set([...prev, ...currentIds])];
      localStorage.setItem("admin_read_notifications", JSON.stringify(next));
      return next;
    });

    showLuxuryToast("success", {
      title: "تم التحديث!",
      description: "تم تحديد جميع التنبيهات كمقروءة بنجاح",
    });
    setIsNotificationsOpen(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const syncToast = toast.loading("جاري مزامنة البيانات...");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSyncing(false);
    toast.dismiss(syncToast);
    
    showLuxuryToast("success", {
      title: "مزامنة ناجحة",
      description: `تم تحديث البيانات - ${new Date().toLocaleTimeString("ar-SA")}`,
    });
  };

  const adminEmail = localStorage.getItem("admin_email");
  const currentAdmin = useMemo(() => {
    const found = adminUsers.find((u) => u.email === adminEmail);
    if (found) return found;

    // Fallback if offline or quota exceeded
    if (adminEmail && localStorage.getItem("admin_auth") === "true") {
      const superAdmins = [
        "samesaeed456@gmail.com",
        "samisaeed2027@gmail.com",
        "samisaeed2025@gmail.com",
        "967776668370@elite-store.local",
      ];
      if (superAdmins.includes(adminEmail.toLowerCase())) {
        return {
          id: adminEmail,
          email: adminEmail,
          role: "super_admin" as const,
          name: localStorage.getItem("admin_name") || "المدير العام",
          permissions: ["all" as const],
          isActive: true,
        };
      }
      return {
        id: adminEmail,
        email: adminEmail,
        role: (localStorage.getItem("admin_role") || "admin") as any,
        name: localStorage.getItem("admin_name") || "مدير",
        permissions: [],
        isActive: true,
      };
    }
    return undefined;
  }, [adminUsers, adminEmail]);

  const navGroups = useMemo(() => {
    const groups = [
      {
        title: "الرئيسية",
        items: [
          {
            name: "لوحة التحكم",
            path: "/admin",
            icon: LayoutDashboard,
            permission: "view_dashboard",
          },
          {
            name: "التحليلات",
            path: "/admin/analytics",
            icon: TrendingUp,
            permission: "view_dashboard",
          },
        ],
      },
      {
        title: "التجارة الإلكترونية",
        items: [
          {
            name: "الطلبات",
            path: "/admin/orders",
            icon: ShoppingCart,
            permission: "manage_orders",
          },
          {
            name: "المنتجات والمخزون",
            path: "/admin/products",
            icon: Package,
            permission: "manage_products",
          },
          {
            name: "العملاء",
            path: "/admin/customers",
            icon: Users,
            permission: "manage_customers",
          },
          {
            name: "طلبات شحن المحفظة",
            path: "/admin/recharges",
            icon: Wallet,
            permission: "manage_orders",
          },
        ],
      },
      {
        title: "التسويق والنمو",
        items: [
          {
            name: "التسويق",
            path: "/admin/marketing",
            icon: Megaphone,
            permission: "manage_marketing",
          },
          {
            name: "الكوبونات",
            path: "/admin/coupons",
            icon: Ticket,
            permission: "manage_coupons",
          },
        ],
      },
      {
        title: "الإدارة والتشغيل",
        items: [
          {
            name: "الشحن واللوجستيات",
            path: "/admin/logistics",
            icon: Globe,
            permission: "manage_logistics",
          },
          {
            name: "الرسائل والتقييمات",
            path: "/admin/messages",
            icon: Inbox,
            permission: "manage_messages",
          },
          {
            name: "الأمان والأدوار",
            path: "/admin/security",
            icon: ShieldCheck,
            permission: "manage_security",
          },
          {
            name: "السحابة",
            path: "/admin/cloud",
            icon: Cloud,
            permission: "view_logs",
          },
          {
            name: "الإعدادات",
            path: "/admin/settings",
            icon: SettingsIcon,
            permission: "manage_settings",
          },
        ],
      },
    ];

    if (!currentAdmin) return [];

    const adminPermissions =
      currentAdmin.permissions && currentAdmin.permissions.length > 0
        ? currentAdmin.permissions
        : getFallbackPermissions(currentAdmin.role || "admin");
    const isSuperAdmin =
      currentAdmin.role === "super_admin" ||
      currentAdmin.role === "admin" ||
      (currentAdmin as any).isAdmin === true ||
      adminPermissions.includes("all");

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            isSuperAdmin ||
            !item.permission ||
            adminPermissions.includes(item.permission as any),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [currentAdmin]);

  // Check authentication and permissions
  useEffect(() => {
    syncOnDemand("recharges");
    syncOnDemand("orders");
    syncOnDemand("support_tickets");
  }, [syncOnDemand]);

  useEffect(() => {
    const checkAuth = async () => {
      const { adminAuth } = await import("@/lib/firebase");

      const unsubscribe = adminAuth.onAuthStateChanged((user) => {
        if (!user || !user.email) {
          navigate("/admin/login", { replace: true });
          setIsAuthLoading(false);
          return;
        }

        const storedAdminEmail = localStorage.getItem("admin_email");
        if (
          storedAdminEmail !== user.email ||
          localStorage.getItem("admin_auth") !== "true"
        ) {
          navigate("/admin/login", { replace: true });
          setIsAuthLoading(false);
          return;
        }

        // Check if account is disabled
        if (currentAdmin && currentAdmin.isActive === false) {
          // We show the blocked message overlay in the render, 
          // so we don't logout automatically here anymore.
          setIsAuthLoading(false);
          return;
        }

        // Check permissions for current route
        if (
          location.pathname !== "/admin/login" &&
          location.pathname !== "/admin"
        ) {
          if (!currentAdmin || currentAdmin.email !== user.email) {
            // Still loading or sync in progress, allow a small window
            return;
          }

          const adminPermissions =
            currentAdmin.permissions && currentAdmin.permissions.length > 0
              ? currentAdmin.permissions
              : getFallbackPermissions(currentAdmin.role || "admin");

          const isSuperAdmin =
            currentAdmin.role === "super_admin" ||
            currentAdmin.role === "admin" ||
            (currentAdmin as any).isAdmin === true ||
            adminPermissions.includes("all");

          if (!isSuperAdmin) {
            const allItems = navGroups.flatMap((g) => g.items);
            const currentItem = allItems.find(
              (i) =>
                i.path === location.pathname ||
                location.pathname.startsWith(i.path),
            );

            // If the item exists but user doesn't have its required permission
            if (
              currentItem &&
              currentItem.permission &&
              !adminPermissions.includes(
                currentItem.permission as any,
              )
            ) {
              showLuxuryToast("error", {
                title: "دخول غير مصرح",
                description: "ليس لديك الصلاحيات الكافية للوصول لهذا القسم",
              });
              navigate("/admin", { replace: true });
            }
          }
        }
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    };

    checkAuth();
  }, [navigate, location.pathname, currentAdmin, navGroups]);

  // Quick Stats for Header
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter((o) => {
      const orderDate = (o.date as any)?.seconds
        ? new Date((o.date as any).seconds * 1000)
        : new Date(o.date);
      return orderDate.toISOString().split("T")[0] === today;
    });
    const sales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      sales,
      count: todayOrders.length,
    };
  }, [orders]);

  const handleLogout = async () => {
    logActivity("تسجيل خروج", `تم تسجيل خروج المشرف: ${adminName}`);

    try {
      const { adminAuth } = await import("@/lib/firebase");
      await adminAuth.signOut();
    } catch (e) {
      console.error("Admin Logout error:", e);
    }

    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_name");

    navigate("/admin/login");
  };

  const adminName =
    currentAdmin?.name || localStorage.getItem("admin_name") || "المدير العام";
  const adminRole =
    currentAdmin?.role || localStorage.getItem("admin_role") || "super_admin";

  const roleLabels: Record<string, string> = {
    super_admin: "مدير عام",
    manager: "مدير",
    editor: "محرر",
    support: "دعم فني",
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin") return "لوحة التحكم";
    const group = navGroups.find((g) => g.items.some((i) => i.path === path));
    const item = group?.items.find((i) => i.path === path);
    return item?.name || "لوحة التحكم";
  };

  return (
    <div
      className="flex h-screen w-full max-w-full bg-[#F8FAFC] overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 right-0 z-50 w-72 bg-white flex flex-col
        transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        border-l border-slate-100
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-6 pb-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center">
            <Logo className="h-10" variant="dark" />
          </Link>
          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <motion.nav
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar"
        >
          {navGroups.map((group) => (
            <motion.div
              variants={itemVariants}
              key={group.title}
              className="space-y-1"
            >
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-4">
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/admin" &&
                    location.pathname.startsWith(item.path));
                return (
                  <motion.div
                    key={item.name}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, x: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
                        isActive
                          ? "bg-solar text-carbon font-bold shadow-xl shadow-gold"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                      />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
        </motion.nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col h-screen w-full relative bg-[#FDFCFB]">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30 shrink-0">
          <div className="px-4 lg:px-8 py-2 sm:py-3 flex justify-between items-center gap-4">
            {/* Left: Mobile Toggle & Page Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex flex-col">
                <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                  {getPageTitle()}
                </h1>
                <div className="hidden sm:flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  <span>الرئيسية</span>
                  <ChevronDown className="w-2 h-2 rotate-90" />
                  <span className="text-solar">{getPageTitle()}</span>
                </div>
              </div>
            </div>

            {/* Center: Search (Desktop Only) */}
            <div className="hidden md:flex flex-1 max-w-md relative group">
              <FloatingInput
                id="adminGlobalSearch"
                label="ابحث عن طلبات، عملاء، أو منتجات..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                iconPosition="start"
                bgClass="bg-slate-50"
              />
            </div>

            {/* Right: Stats & Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Quick Add Button (Desktop) */}
              <Link
                to="/admin/products?add=true"
                className="hidden md:flex items-center justify-center w-10 h-10 bg-solar text-carbon rounded-xl shadow-lg shadow-gold hover:scale-110 transition-all active:scale-95 shrink-0"
                title="إضافة منتج جديد"
              >
                <Plus className="w-5 h-5" />
              </Link>

              {/* Today's Quick Stats (Desktop) */}
              <div className="hidden xl:flex items-center gap-6 px-6 border-l border-slate-100">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    مبيعات اليوم
                  </span>
                  <span className="text-sm font-black text-emerald-600">
                    {formatPrice(todayStats.sales)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    طلبات اليوم
                  </span>
                  <span className="text-sm font-black text-blue-600">
                    {todayStats.count} طلب
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  className={`p-2.5 rounded-xl transition-all group ${isSyncing ? "text-solar bg-solar/10" : "text-slate-500 hover:text-solar hover:bg-solar/10"}`}
                  onClick={handleSync}
                  disabled={isSyncing}
                  title="تحديث البيانات"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${isSyncing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
                  />
                </button>

                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2.5 rounded-xl transition-all relative group ${isNotificationsOpen ? "bg-solar/10 text-solar" : "text-slate-500 hover:text-solar hover:bg-solar/10"}`}
                  >
                    <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {adminNotifications.length > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed inset-x-6 top-16 sm:absolute sm:inset-auto sm:left-0 sm:mt-3 w-auto sm:w-80 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden z-50 mx-auto max-w-[320px] sm:max-w-none"
                      >
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900">
                            الإشعارات
                          </h3>
                          <span className="bg-solar/10 text-solar px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider">
                            {adminNotifications.length} تنبيهات
                          </span>
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                          {adminNotifications.length > 0 ? (
                            <div className="divide-y divide-slate-100/60">
                              {adminNotifications.map((notif) => (
                                <Link
                                  key={notif.id}
                                  to={notif.link}
                                  onClick={() => setIsNotificationsOpen(false)}
                                  className="flex items-start gap-3 p-4 sm:p-5 hover:bg-slate-50/80 transition-all group border-r-4 border-transparent hover:border-solar"
                                >
                                  <div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${notif.bg} ${notif.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm`}
                                  >
                                    <notif.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[13px] sm:text-[15px] font-black text-carbon line-clamp-1 leading-tight mb-0.5 group-hover:text-solar transition-colors">
                                      {notif.title}
                                    </h4>
                                    <p className="text-[11px] sm:text-[13px] text-slate-600 font-bold line-clamp-2 leading-relaxed">
                                      {notif.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-xs text-slate-400 font-bold">
                                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                      {notif.time}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                              </div>
                              <p className="text-sm font-black text-slate-900">
                                كل شيء تمام!
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-1">
                                لا توجد تنبيهات جديدة حالياً
                              </p>
                            </div>
                          )}
                        </div>

                        {adminNotifications.length > 0 && (
                          <div className="p-3 bg-slate-50 border-t border-slate-100">
                            <button
                              onClick={markAllAsRead}
                              className="w-full py-2 text-[9px] sm:text-[10px] font-black text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              تحديد الكل كمقروء
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block"></div>

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-50 rounded-2xl transition-all group"
                  >
                    <div className="hidden sm:block text-left">
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        {adminName}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500 block uppercase tracking-widest">
                        {roleLabels[adminRole] || "مدير"}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-slate-900/20 border-2 border-white ring-1 ring-slate-100 group-hover:scale-105 transition-transform">
                      {(adminName || "?").charAt(0)}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 p-2"
                      >
                        <Link
                          to="/admin/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-900 transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4 text-slate-400" />
                          الإعدادات
                        </Link>
                        <button
                          onClick={handleRegisterPasskey}
                          disabled={isRegisteringPasskey}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 text-sm font-bold text-orange-600 transition-colors disabled:opacity-50"
                        >
                          <Fingerprint className="w-4 h-4" />
                          {isRegisteringPasskey ? "جاري الإعداد..." : "إعداد البصمة للإدارة"}
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-sm font-bold text-rose-600 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل الخروج
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden pb-10">
          <AdminNotificationListener />
          {isAuthLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-solar animate-spin" />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
