import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, 
  Calendar, Download, MapPin, ArrowUpRight, Activity, CreditCard, 
  Plus, Tag, AlertCircle, Eye, Edit, ChevronRight, Filter, 
  MoreHorizontal, RefreshCw, LayoutGrid, List, Clock, ShieldCheck,
  Sparkles, ArrowRight, UserPlus, Wallet
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell as ReCell, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { toast } from 'sonner';
import { BASE_CURRENCY_SYMBOL } from '../../lib/finance';

export default function Dashboard() {
  const { 
    products, 
    orders, 
    formatPrice, 
    customers, 
    abandonedCarts,
    activityLogs,
    categories
  } = useStore();

  const [salesTimeRange, setSalesTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const [topSellingRange, setTopSellingRange] = useState<'today' | 'week' | 'all'>('all');

  // Real Stats Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const ordersToday = orders.filter(o => {
      const orderDate = (o.date as any)?.seconds ? new Date((o.date as any).seconds * 1000) : new Date(o.date);
      return orderDate.toISOString().split('T')[0] === todayStr;
    });
    const salesToday = ordersToday.reduce((sum, o) => sum + o.total, 0);
    
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;
    
    const aov = orders.length > 0 ? totalSales / orders.length : 0;
    
    // Calculate growth (comparing to previous period - simplified for now)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const ordersYesterday = orders.filter(o => {
      const orderDate = (o.date as any)?.seconds ? new Date((o.date as any).seconds * 1000) : new Date(o.date);
      return orderDate.toISOString().split('T')[0] === yesterdayStr;
    });
    const salesYesterday = ordersYesterday.reduce((sum, o) => sum + o.total, 0);
    const aovYesterday = ordersYesterday.length > 0 ? salesYesterday / ordersYesterday.length : 0;
    
    const salesGrowth = salesYesterday > 0 ? ((salesToday - salesYesterday) / salesYesterday) * 100 : 0;
    const ordersGrowth = ordersYesterday.length > 0 ? ((ordersToday.length - ordersYesterday.length) / ordersYesterday.length) * 100 : 0;
    const aovGrowth = aovYesterday > 0 ? ((aov - aovYesterday) / aovYesterday) * 100 : 0;

    return {
      salesToday,
      ordersToday: ordersToday.length,
      totalSales,
      activeOrders,
      aov,
      abandonedCarts: abandonedCarts?.length || 0,
      salesGrowth: salesGrowth.toFixed(0),
      ordersGrowth: ordersGrowth.toFixed(0),
      aovGrowth: aovGrowth.toFixed(0)
    };
  }, [orders, abandonedCarts]);

  // Sales Chart Data (Weekly or Monthly)
  const salesChartData = useMemo(() => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const shortDays = ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
    
    const count = salesTimeRange === 'weekly' ? 7 : 30;
    const lastDays = Array.from({ length: count }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (count - 1 - i));
      return d;
    });

    return lastDays.map((date, i) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => {
        const orderDate = (o.date as any)?.seconds ? new Date((o.date as any).seconds * 1000) : new Date(o.date);
        return orderDate.toISOString().split('T')[0] === dateStr;
      });
      const value = dayOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        label: salesTimeRange === 'weekly' ? shortDays[date.getDay()] : (i + 1).toString(),
        fullLabel: days[date.getDay()],
        value: Math.round(value)
      };
    });
  }, [orders, salesTimeRange]);

  // Inventory Health by Category
  const inventoryHealth = useMemo(() => {
    const cats = categories.length > 0 ? categories.map(c => c.name) : Array.from(new Set(products.map(p => p.category)));
    return cats.slice(0, 3).map((cat, idx) => {
      const catProducts = products.filter(p => p.category === cat);
      const inStockCount = catProducts.filter(p => (p.stockCount || 0) > 0).length;
      const value = catProducts.length > 0 ? Math.round((inStockCount / catProducts.length) * 100) : 0;
      const colors = ['bg-solar', 'bg-amber-500', 'bg-rose-500'];
      return {
        name: cat,
        value,
        color: colors[idx % colors.length]
      };
    });
  }, [products, categories]);

  // Low Stock Alerts
  const lowStockAlerts = useMemo(() => {
    return products
      .filter(p => (p.stockCount || 0) <= 5)
      .sort((a, b) => (a.stockCount || 0) - (b.stockCount || 0))
      .slice(0, 3);
  }, [products]);

  // Top Selling Products with Range Filter
  const topSellingProducts = useMemo(() => {
    const productSales: Record<string, { name: string, sales: number, color: string }> = {};
    const colors = ['bg-solar', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'];
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const filteredOrders = orders.filter(o => {
      const orderDate = (o.date as any)?.seconds ? new Date((o.date as any).seconds * 1000) : new Date(o.date);
      const orderDateStr = orderDate.toISOString().split('T')[0];
      if (topSellingRange === 'today') return orderDateStr === todayStr;
      if (topSellingRange === 'week') return orderDate >= weekAgo;
      return true;
    });

    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!item?.product?.id) return;
        const pId = item.product.id.toString();
        if (!productSales[pId]) {
          productSales[pId] = { 
            name: item.product.name, 
            sales: 0, 
            color: colors[Object.keys(productSales).length % colors.length] 
          };
        }
        productSales[pId].sales += item.quantity;
      });
    });

    const previousOrders = orders.filter(o => {
      const orderDate = (o.date as any)?.seconds ? new Date((o.date as any).seconds * 1000) : new Date(o.date);
      const orderDateStr = orderDate.toISOString().split('T')[0];
      if (topSellingRange === 'today') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return orderDateStr === yesterdayStr;
      }
      if (topSellingRange === 'week') {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return orderDate >= twoWeeksAgo && orderDate < weekAgo;
      }
      return false;
    });

    const prevProductSales: Record<string, number> = {};
    previousOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!item?.product?.id) return;
        const pId = item.product.id.toString();
        prevProductSales[pId] = (prevProductSales[pId] || 0) + item.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => {
        const currentSales = data.sales;
        const prevSales = prevProductSales[id] || 0;
        let growth = 'جديد';
        
        if (prevSales > 0) {
          const growthPct = ((currentSales - prevSales) / prevSales) * 100;
          growth = `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(0)}%`;
        } else if (currentSales > 0 && topSellingRange !== 'all') {
          growth = 'جديد';
        } else {
          growth = 'مستقر';
        }

        return { id, ...data, growth };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);
  }, [orders, topSellingRange]);

  // Recent Transactions (Mix of orders and logs)
  const recentTransactions = useMemo(() => {
    const lastOrders = orders.slice(0, 4).map(o => {
      const orderDate = (o.date as any)?.seconds ? new Date((o.date as any).seconds * 1000) : new Date(o.date);
      return {
        id: o.id,
        shortId: o.id.substring(0, 4),
        type: 'طلب جديد',
        user: o.customerName,
        time: orderDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        amount: `+${o.total} ${BASE_CURRENCY_SYMBOL}`,
        icon: ShoppingCart,
        color: 'text-solar',
        bg: 'bg-solar/10',
        link: `/admin/orders?id=${o.id}`
      };
    });

    if (lastOrders.length < 4) {
      // Fill with activity logs if not enough orders
      const logs = activityLogs.slice(0, 4 - lastOrders.length).map(log => ({
        id: log.id,
        shortId: log.id.substring(0, 4),
        type: log.action,
        user: log.userName || 'النظام',
        time: new Date((log.date as any)?.seconds ? (log.date as any).seconds * 1000 : log.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        amount: 'نشاط',
        icon: Activity,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        link: '/admin/settings' // Activity logs usually relate to settings/system
      }));
      return [...lastOrders, ...logs];
    }

    return lastOrders;
  }, [orders, activityLogs]);

  useEffect(() => {
    toast.success('أهلاً بك مجدداً، المدير العام 👋', {
      description: 'إليك ملخص أداء متجرك اليوم',
      duration: 5000,
    });
  }, []);
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div 
      className="w-full space-y-6 pb-24 lg:pb-10 px-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-8"></div>

      {/* Stats Grid - Professional 3-column layout on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Sales Today */}
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-solar/10 transition-all duration-500">
          <div className="flex justify-between items-start w-full mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-solar/10 text-solar flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="bg-solar/10 text-solar px-2 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-wider flex items-center gap-1">
              <span>مباشر</span>
              <div className="w-1.5 h-1.5 rounded-full bg-solar animate-pulse" />
            </div>
          </div>
          <div className="w-full">
            <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">مبيعات اليوم</span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.salesToday.toLocaleString()}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">{BASE_CURRENCY_SYMBOL}</span>
            </div>
          </div>
        </motion.div>

        {/* Orders Today */}
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
          <div className="flex justify-between items-start w-full mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className={`text-[10px] font-black ${Number(stats.ordersGrowth) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(stats.ordersGrowth) >= 0 ? '+' : ''}{stats.ordersGrowth}%
            </div>
          </div>
          <div className="w-full">
            <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">طلبات اليوم</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.ordersToday}</span>
          </div>
        </motion.div>

        {/* Total Sales */}
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-solar/10 transition-all duration-500">
          <div className="flex justify-between items-start w-full mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-solar/10 text-solar flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className={`text-[10px] font-black ${Number(stats.salesGrowth) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(stats.salesGrowth) >= 0 ? '+' : ''}{stats.salesGrowth}%
            </div>
          </div>
          <div className="w-full">
            <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">إجمالي المبيعات</span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalSales.toLocaleString()}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">{BASE_CURRENCY_SYMBOL}</span>
            </div>
          </div>
        </motion.div>

        {/* Active Orders */}
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500">
          <div className="flex justify-between items-start w-full mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className={`text-[10px] font-black ${stats.activeOrders > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {stats.activeOrders > 0 ? 'نشط' : 'مكتمل'}
            </div>
          </div>
          <div className="w-full">
            <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">الطلبات النشطة</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.activeOrders}</span>
          </div>
        </motion.div>

        {/* Average Order Value (AOV) */}
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-solar/10 transition-all duration-500">
          <div className="flex justify-between items-start w-full mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-solar/10 text-solar flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className={`text-[10px] font-black ${Number(stats.aovGrowth) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(stats.aovGrowth) >= 0 ? '+' : ''}{stats.aovGrowth}%
            </div>
          </div>
          <div className="w-full">
            <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">متوسط الطلب</span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{Math.round(stats.aov).toLocaleString()}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">{BASE_CURRENCY_SYMBOL}</span>
            </div>
          </div>
        </motion.div>

        {/* Abandoned Carts */}
        <motion.div variants={itemVariants} className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-500">
          <div className="flex justify-between items-start w-full mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className={`text-[10px] font-black ${stats.abandonedCarts > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.abandonedCarts > 0 ? 'تنبيه' : 'مثالي'}
            </div>
          </div>
          <div className="w-full">
            <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">سلال متروكة</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.abandonedCarts}</span>
          </div>
        </motion.div>
      </div>

      {/* Active Users Card */}
      <motion.div variants={itemVariants} className="bg-white p-4 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-right">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:rotate-12 transition-transform duration-500">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-black uppercase tracking-widest block mb-1">إجمالي العملاء</span>
            <span className="text-3xl font-black text-slate-900">{customers.length}</span>
          </div>
        </div>
        <div className="flex -space-x-3 rtl:space-x-reverse">
          {customers.slice(0, 4).map((c, i) => (
            <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-sm">
              <img src={c.avatar || `https://picsum.photos/seed/${c.phone}/100/100`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
          {customers.length > 4 && (
            <div className="w-10 h-10 rounded-full border-4 border-white bg-solar text-carbon flex items-center justify-center text-[10px] font-black shadow-sm">
              +{customers.length - 4}
            </div>
          )}
        </div>
      </motion.div>

      {/* Sales Evolution Chart */}
      <motion.div variants={itemVariants} className="bg-white p-4 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4 text-center sm:text-right">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">تطور المبيعات</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">آخر {salesTimeRange === 'weekly' ? '7 أيام' : '30 يوم'}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setSalesTimeRange('weekly')}
              className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${salesTimeRange === 'weekly' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-white'}`}
            >
              أسبوعي
            </button>
            <button 
              onClick={() => setSalesTimeRange('monthly')}
              className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${salesTimeRange === 'monthly' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-white'}`}
            >
              شهري
            </button>
          </div>
        </div>

        <div className={`h-64 flex items-end justify-between px-1 sm:px-2 ${salesTimeRange === 'monthly' ? 'gap-0.5 sm:gap-2' : 'gap-2 sm:gap-4'}`}>
          {salesChartData.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
              <div className="relative w-full flex flex-col items-center justify-end h-48">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(5, (item.value / Math.max(...salesChartData.map(v => v.value), 1)) * 100)}%` }}
                  transition={{ delay: idx * (salesTimeRange === 'weekly' ? 0.1 : 0.02), duration: 1, ease: "easeOut" }}
                  className={`w-full rounded-2xl transition-all duration-500 ${
                    salesTimeRange === 'monthly' ? 'max-w-[4px] sm:max-w-[12px]' : 'max-w-[32px] sm:max-w-[40px]'
                  } ${
                    idx === salesChartData.length - 1 ? 'bg-solar shadow-lg shadow-gold' : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}
                />
                {item.value > 0 && (
                  <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {item.value.toLocaleString()}
                  </div>
                )}
              </div>
              <span className={`text-[7px] sm:text-[10px] font-black uppercase tracking-widest ${idx === salesChartData.length - 1 ? 'text-solar' : 'text-slate-400'} ${salesTimeRange === 'monthly' && idx % 5 !== 0 && idx !== salesChartData.length - 1 ? 'hidden sm:block' : ''}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Inventory Health */}
      <motion.div variants={itemVariants} className="bg-white p-4 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">صحة المخزون</h3>
          <Link to="/admin/products" className="text-solar text-xs font-black flex items-center gap-1 hover:underline">
            <span>عرض الكل</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-8">
          {inventoryHealth.map((cat, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                <span className={`text-xs font-black ${cat.value < 20 ? 'text-rose-600' : cat.value < 50 ? 'text-amber-600' : 'text-solar'}`}>
                  {cat.value}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.value}%` }}
                  transition={{ delay: 0.5 + (idx * 0.1), duration: 1 }}
                  className={`h-full rounded-full ${cat.color}`}
                />
              </div>
            </div>
          ))}
          {inventoryHealth.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">لا توجد بيانات مخزون حالياً</p>
          )}
        </div>
      </motion.div>

      {/* Inventory & Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">تنبيهات المخزون</h3>
                <p className="text-xs text-slate-400 font-bold">منتجات أوشكت على النفاد</p>
              </div>
            </div>
            <Link to="/admin/products" className="text-solar text-xs font-black hover:underline flex items-center gap-1">
              عرض الكل <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {lowStockAlerts.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-rose-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                    {item.image ? (
                      <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">{formatPrice(item.price)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${item.stockCount === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    {item.stockCount === 0 ? 'نفذ' : `بقي ${item.stockCount}`}
                  </div>
                </div>
              </div>
            ))}
            {lowStockAlerts.length === 0 && (
              <div className="text-center py-8">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">المخزون سليم</p>
                <p className="text-xs text-slate-400">لا توجد منتجات منخفضة المخزون</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Selling Products */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-solar/10 text-solar flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">الأكثر مبيعاً</h3>
                <p className="text-xs text-slate-400 font-bold">أداء المنتجات</p>
              </div>
            </div>
            <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
              <button 
                onClick={() => setTopSellingRange('today')}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${topSellingRange === 'today' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                اليوم
              </button>
              <button 
                onClick={() => setTopSellingRange('week')}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${topSellingRange === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                أسبوع
              </button>
              <button 
                onClick={() => setTopSellingRange('all')}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${topSellingRange === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                الكل
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {topSellingProducts.map((item) => (
              <div key={item.id} className="relative overflow-hidden p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:shadow-md transition-all">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full ${item.color}`} />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{item.sales} مبيعة</p>
                    </div>
                  </div>
                  <div className="text-solar text-[10px] font-black flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {item.growth}
                  </div>
                </div>
              </div>
            ))}
            {topSellingProducts.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">لا توجد مبيعات مسجلة بعد</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants} className="bg-white p-4 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">أحدث العمليات</h3>
          <Link to="/admin/orders" className="text-solar text-xs font-black hover:underline">عرض الكل</Link>
        </div>

        <div className="space-y-2 sm:space-y-4">
          {recentTransactions.map((item, idx) => (
            <Link 
              key={idx} 
              to={item.link}
              className="flex items-center justify-between p-3 sm:p-4 rounded-3xl hover:bg-slate-50 transition-all group cursor-pointer border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">{item.type}</h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-0.5">{item.user} • {item.time}</p>
                </div>
              </div>
              <div className={`text-xs sm:text-sm font-black ${item.color}`}>
                {item.amount}
              </div>
            </Link>
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">لا توجد عمليات حديثة</p>
          )}
        </div>

        <Link to="/admin/orders" className="block w-full mt-8 py-4 bg-slate-50 text-slate-600 text-center text-xs font-black rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">
          عرض جميع العمليات
        </Link>
      </motion.div>

      {/* Floating Action Button */}
      <Link to="/admin/products?add=true">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-28 right-6 sm:bottom-10 sm:right-10 w-16 h-16 bg-solar text-carbon rounded-full shadow-2xl shadow-gold flex items-center justify-center z-50 lg:bottom-10"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </Link>
    </motion.div>
  );
}
