import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, Zap, ChevronDown, 
  LayoutDashboard, Package, Tags, ShoppingCart, Users, LogOut, 
  Store, Menu, X, Ticket, Settings as SettingsIcon, TrendingUp, 
  Megaphone, ShieldCheck, Truck, FileText, Globe, Search, Plus, RefreshCw, Inbox, Activity,
  Cloud, AlertCircle, MessageSquare, Clock, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import Logo from '../../components/Logo';
import { useStore } from '../../context/StoreContext';
import { FloatingInput } from '../../components/FloatingInput';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, products, formatPrice, adminUsers, logActivity, supportTickets } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('admin_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist read notifications
  useEffect(() => {
    localStorage.setItem('admin_read_notifications', JSON.stringify(readNotifications));
  }, [readNotifications]);

  // Generate Admin Notifications
  const adminNotifications = useMemo(() => {
    const alerts: any[] = [];

    // 1. New Orders (Pending)
    const pendingOrders = orders.filter(o => o.status === 'pending');
    pendingOrders.slice(0, 3).forEach(order => {
      const orderDate = (order.date as any)?.seconds ? new Date((order.date as any).seconds * 1000) : new Date(order.date);
      alerts.push({
        id: `order-${order.id}`,
        title: 'طلب جديد ينتظر الموافقة',
        description: `العميل: ${order.customerName} - المبلغ: ${formatPrice(order.total)}`,
        time: orderDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        icon: ShoppingCart,
        color: 'text-solar',
        bg: 'bg-solar/10',
        link: `/admin/orders?id=${order.id}`
      });
    });

    // 2. Low Stock
    const lowStockProducts = products.filter(p => p.inStock && (p.stockCount || 0) <= (p.minStock || 5));
    lowStockProducts.slice(0, 2).forEach(product => {
      alerts.push({
        id: `stock-${product.id}`,
        title: 'تنبيه مخزون منخفض',
        description: `المنتج: ${product.name} - المتبقي: ${product.stockCount}`,
        time: 'الآن',
        icon: AlertCircle,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        link: `/admin/products?id=${product.id}`
      });
    });

    // 3. Support Tickets
    const openTickets = supportTickets.filter(t => t.status === 'open');
    openTickets.slice(0, 2).forEach(ticket => {
      alerts.push({
        id: `ticket-${ticket.id}`,
        title: 'رسالة دعم فني جديدة',
        description: ticket.subject,
        time: 'منذ قليل',
        icon: MessageSquare,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        link: '/admin/messages'
      });
    });

    return alerts.filter(alert => !readNotifications.includes(alert.id));
  }, [orders, products, supportTickets, formatPrice, readNotifications]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Mark all as read function
  const markAllAsRead = () => {
    // Get all current notification IDs (even those not currently filtered out)
    // To be safe, we'll mark the ones currently in the list
    const currentIds = adminNotifications.map(n => n.id);
    if (currentIds.length === 0) return;
    
    setReadNotifications(prev => {
      const next = [...new Set([...prev, ...currentIds])];
      localStorage.setItem('admin_read_notifications', JSON.stringify(next));
      return next;
    });
    
    toast.success('تم تحديد جميع التنبيهات كمقروءة');
    setIsNotificationsOpen(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const syncToast = toast.loading('جاري مزامنة البيانات...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSyncing(false);
    toast.dismiss(syncToast);
    toast.success('تم تحديث البيانات بنجاح', {
      description: `آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}`
    });
  };

  const adminEmail = localStorage.getItem('admin_email');
  const currentAdmin = useMemo(() => 
    adminUsers.find(u => u.email === adminEmail),
    [adminUsers, adminEmail]
  );

  const navGroups = useMemo(() => {
    const groups = [
      {
        title: 'الرئيسية',
        items: [
          { name: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard, permission: 'view_dashboard' },
          { name: 'التحليلات', path: '/admin/analytics', icon: TrendingUp, permission: 'view_dashboard' },
        ]
      },
      {
        title: 'التجارة الإلكترونية',
        items: [
          { name: 'الطلبات', path: '/admin/orders', icon: ShoppingCart, permission: 'manage_orders' },
          { name: 'المنتجات والمخزون', path: '/admin/products', icon: Package, permission: 'manage_products' },
          { name: 'الفئات', path: '/admin/categories', icon: Package, permission: 'manage_products' },
          { name: 'العملاء', path: '/admin/customers', icon: Users, permission: 'manage_customers' },
        ]
      },
      {
        title: 'التسويق والنمو',
        items: [
          { name: 'التسويق', path: '/admin/marketing', icon: Megaphone, permission: 'manage_marketing' },
          { name: 'الكوبونات', path: '/admin/coupons', icon: Ticket, permission: 'manage_coupons' },
        ]
      },
      {
        title: 'الإدارة والتشغيل',
        items: [
          { name: 'الشحن واللوجستيات', path: '/admin/logistics', icon: Globe, permission: 'manage_logistics' },
          { name: 'رسائل اتصل بنا', path: '/admin/messages', icon: Inbox, permission: 'manage_messages' },
          { name: 'الأمان والأدوار', path: '/admin/security', icon: ShieldCheck, permission: 'manage_security' },
          { name: 'السحابة', path: '/admin/cloud', icon: Cloud, permission: 'view_logs' },
          { name: 'سجل النشاطات', path: '/admin/logs', icon: Activity, permission: 'view_logs' },
          { name: 'الإعدادات', path: '/admin/settings', icon: SettingsIcon, permission: 'manage_settings' },
        ]
      }
    ];

    if (!currentAdmin) return groups;

    const getFallbackPermissions = (role: string): any[] => {
      switch (role) {
        case 'super_admin':
          return ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_settings', 'manage_security', 'view_logs', 'manage_logistics', 'manage_messages'];
        case 'manager':
          return ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'manage_marketing', 'manage_coupons', 'manage_logistics', 'manage_messages'];
        case 'editor':
          return ['view_dashboard', 'manage_products', 'manage_marketing', 'manage_coupons', 'manage_messages'];
        case 'support':
          return ['view_dashboard', 'manage_orders', 'manage_customers', 'manage_messages'];
        default:
          return ['view_dashboard'];
      }
    };

    const adminPermissions = currentAdmin.permissions?.length > 0 
      ? currentAdmin.permissions 
      : getFallbackPermissions(currentAdmin.role);

    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        currentAdmin.role === 'super_admin' || !item.permission || adminPermissions.includes(item.permission as any)
      )
    })).filter(group => group.items.length > 0);
  }, [currentAdmin]);

  // Check authentication and permissions
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_auth') === 'true';
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    // Check permissions for current route
    if (currentAdmin && currentAdmin.role !== 'super_admin' && location.pathname !== '/admin/login' && location.pathname !== '/admin') {
      const allItems = navGroups.flatMap(g => g.items);
      const currentItem = allItems.find(i => i.path === location.pathname || (i.path !== '/admin' && location.pathname.startsWith(i.path)));
      
      // If the item is not in navGroups, it means the user doesn't have permission
      if (!currentItem) {
        toast.error('ليس لديك صلاحية للوصول لهذه الصفحة');
        navigate('/admin');
      }
    }
  }, [navigate, location.pathname, currentAdmin, navGroups]);

  // Quick Stats for Header
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const orderDate = (o.date as any)?.seconds ? new Date((o.date as any).seconds * 1000) : new Date(o.date);
      return orderDate.toISOString().split('T')[0] === today;
    });
    const sales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      sales,
      count: todayOrders.length
    };
  }, [orders]);

  const handleLogout = async () => {
    logActivity('تسجيل خروج', `تم تسجيل خروج المشرف: ${adminName}`);
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_name');
    
    // Sign out from Firebase Auth
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../../lib/firebase');
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    navigate('/admin/login');
  };

  const adminName = currentAdmin?.name || localStorage.getItem('admin_name') || 'المدير العام';
  const adminRole = currentAdmin?.role || localStorage.getItem('admin_role') || 'super_admin';

  const roleLabels: Record<string, string> = {
    super_admin: 'مدير عام',
    manager: 'مدير',
    editor: 'محرر',
    support: 'دعم فني'
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'لوحة التحكم';
    const group = navGroups.find(g => g.items.some(i => i.path === path));
    const item = group?.items.find(i => i.path === path);
    return item?.name || 'لوحة التحكم';
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans" dir="rtl">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-50 w-72 bg-white flex flex-col
        transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        border-l border-slate-100
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-solar flex items-center justify-center text-carbon shadow-lg shadow-gold">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">HORIZON</span>
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
          className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar"
        >
          {navGroups.map((group) => (
            <motion.div variants={itemVariants} key={group.title} className="space-y-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">{group.title}</div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
                      isActive 
                        ? 'bg-solar text-carbon font-bold shadow-xl shadow-gold' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </motion.div>
          ))}
        </motion.nav>

        <div className="p-6 border-t border-slate-50">
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col h-screen w-full relative bg-[#FDFCFB]">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30 shrink-0">
          <div className="px-4 lg:px-8 py-3 flex justify-between items-center gap-4">
            {/* Left: Mobile Toggle & Page Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  {getPageTitle()}
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>الرئيسية</span>
                  <ChevronDown className="w-2.5 h-2.5 rotate-90" />
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">مبيعات اليوم</span>
                  <span className="text-sm font-black text-emerald-600">{formatPrice(todayStats.sales)}</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">طلبات اليوم</span>
                  <span className="text-sm font-black text-blue-600">{todayStats.count} طلب</span>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  className={`p-2.5 rounded-xl transition-all group ${isSyncing ? 'text-solar bg-solar/10' : 'text-slate-500 hover:text-solar hover:bg-solar/10'}`}
                  onClick={handleSync}
                  disabled={isSyncing}
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </button>

                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2.5 rounded-xl transition-all relative group ${isNotificationsOpen ? 'bg-solar/10 text-solar' : 'text-slate-500 hover:text-solar hover:bg-solar/10'}`}
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
                          <h3 className="text-sm font-black text-slate-900">الإشعارات</h3>
                          <span className="bg-solar/10 text-solar px-2 py-0.5 rounded-lg text-[9px] font-black">
                            {adminNotifications.length} تنبيهات
                          </span>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          {adminNotifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                              {adminNotifications.map((notif) => (
                                <Link 
                                  key={notif.id}
                                  to={notif.link}
                                  onClick={() => setIsNotificationsOpen(false)}
                                  className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors group"
                                >
                                  <div className={`w-10 h-10 rounded-2xl ${notif.bg} ${notif.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <notif.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-900 line-clamp-1">{notif.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">{notif.description}</p>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-bold">
                                      <Clock className="w-3 h-3" />
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
                              <p className="text-sm font-black text-slate-900">كل شيء تمام!</p>
                              <p className="text-xs text-slate-400 font-medium mt-1">لا توجد تنبيهات جديدة حالياً</p>
                            </div>
                          )}
                        </div>

                        {adminNotifications.length > 0 && (
                          <div className="p-3 bg-slate-50 border-t border-slate-100">
                            <button 
                              onClick={markAllAsRead}
                              className="w-full py-2 text-[10px] font-black text-slate-600 hover:text-slate-900 transition-colors"
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
                      <span className="text-xs font-black text-slate-900 block leading-tight">{adminName}</span>
                      <span className="text-[9px] font-bold text-emerald-500 block uppercase tracking-widest">{roleLabels[adminRole] || 'مدير'}</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-slate-900/20 border-2 border-white ring-1 ring-slate-100 group-hover:scale-105 transition-transform">
                      {(adminName || '?').charAt(0)}
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
        
        <div className="p-3 sm:p-10 flex-1 overflow-x-hidden pb-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
