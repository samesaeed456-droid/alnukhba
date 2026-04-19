import React, { useState, useMemo } from 'react';
import { 
  Search, Eye, Filter, Edit, Download, 
  Package, Truck, CheckCircle2, XCircle, RotateCcw,
  Clock, DollarSign, Calendar, MapPin, 
  User, Phone, CreditCard, ChevronRight,
  Printer, Mail, MoreVertical, ArrowUpDown,
  ExternalLink, Trash2, X, AlertCircle, Menu, ArrowRight,
  MessageCircle, PhoneCall, ShoppingBag, Info, ShieldCheck,
  FileText, Share2, CheckSquare, Square, ListFilter, History,
  Bell, TrendingUp, Star, Crown, Grid
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';
import { notificationService } from '../../services/notificationService';
import { FloatingInput } from '../../components/FloatingInput';

export default function Orders() {
  const { orders, updateOrderStatus, formatPrice, showToast, logActivity } = useStore();
  
  const renderPrice = (price: number, className?: string) => {
    const formatted = formatPrice(price);
    const lastSpaceIndex = formatted.lastIndexOf(' ');
    if (lastSpaceIndex === -1) return <span className={className}>{formatted}</span>;
    
    const value = formatted.substring(0, lastSpaceIndex);
    const symbol = formatted.substring(lastSpaceIndex + 1);
    
    return (
      <span className={className}>
        {value}
        <span className="text-[0.4em] font-bold mr-1 text-slate-400 uppercase tracking-normal">{symbol}</span>
      </span>
    );
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('الكل');
  const [paymentFilter, setPaymentFilter] = useState('الكل');
  const [priceFilter, setPriceFilter] = useState('الكل');
  const [cityFilter, setCityFilter] = useState('الكل');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeModalTab, setActiveModalTab] = useState<'items' | 'customer' | 'timeline'>('items');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filterTabs = ['الكل', 'قيد الانتظار', 'قيد التنفيذ', 'مكتمل'];
  const dateOptions = ['الكل', 'اليوم', 'أمس', 'آخر 7 أيام', 'هذا الشهر'];
  const paymentOptions = ['الكل', 'كاش', 'تحويل بنكي', 'مدى', 'فيزا'];
  const priceOptions = ['الكل', 'أقل من 500', '500 - 2000', 'أكثر من 2000'];
  const cityOptions = ['الكل', 'الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    
    // Mocking yesterday's revenue for percentage change
    const yesterdayRevenue = totalRevenue * 0.88; 
    const percentageChange = ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

    return { total, pending, processing, shipped, delivered, cancelled, totalRevenue, percentageChange };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        (order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (order.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone || '').includes(searchTerm);
      
      let matchesStatus = true;
      if (statusFilter !== 'الكل') {
        const statusMap: Record<string, string> = {
          'pending': 'قيد الانتظار',
          'processing': 'قيد التنفيذ',
          'shipped': 'مكتمل',
          'delivered': 'مكتمل',
          'cancelled': 'ملغي'
        };
        matchesStatus = statusMap[order.status] === statusFilter;
      }

      let matchesDate = true;
      const orderDate = new Date(order.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'اليوم') {
        matchesDate = orderDate >= today;
      } else if (dateFilter === 'أمس') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = orderDate >= yesterday && orderDate < today;
      } else if (dateFilter === 'آخر 7 أيام') {
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        matchesDate = orderDate >= last7Days;
      } else if (dateFilter === 'هذا الشهر') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        matchesDate = orderDate >= startOfMonth;
      }

      let matchesPayment = true;
      if (paymentFilter !== 'الكل') {
        matchesPayment = order.paymentMethod === paymentFilter;
      }

      let matchesPrice = true;
      if (priceFilter === 'أقل من 500') matchesPrice = order.total < 500;
      else if (priceFilter === '500 - 2000') matchesPrice = order.total >= 500 && order.total <= 2000;
      else if (priceFilter === 'أكثر من 2000') matchesPrice = order.total > 2000;

      let matchesCity = true;
      if (cityFilter !== 'الكل') {
        matchesCity = order.city === cityFilter;
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesPayment && matchesPrice && matchesCity;
    });
  }, [orders, searchTerm, statusFilter, dateFilter, paymentFilter, priceFilter, cityFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, paymentFilter, priceFilter, cityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': 
      case 'shipped': return 'bg-state-success-bg text-state-success';
      case 'processing': return 'bg-blue-50 text-blue-600';
      case 'pending': return 'bg-orange-50 text-orange-600';
      case 'cancelled': return 'bg-gray-50 text-gray-400';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': 
      case 'shipped': return 'مكتمل';
      case 'processing': return 'قيد التنفيذ';
      case 'pending': return 'قيد الانتظار';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order['status'], isRevert: boolean = false) => {
    updateOrderStatus(orderId, newStatus);
    showToast(`تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`, 'success');
  };

  const handleWhatsApp = (phone: string, orderId: string) => {
    const message = encodeURIComponent(`مرحباً، بخصوص طلبك رقم #${orderId.slice(-6).toUpperCase()}`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleBulkStatusUpdate = (newStatus: Order['status']) => {
    selectedOrders.forEach(id => updateOrderStatus(id, newStatus));
    setSelectedOrders([]);
    showToast(`تم تحديث ${selectedOrders.length} طلبات بنجاح`, 'success');
  };

  const exportToCSV = () => {
    logActivity('تصدير بيانات', `تم تصدير ${filteredOrders.length} طلبات إلى ملف CSV`);
    const headers = ['رقم الطلب', 'العميل', 'الجوال', 'التاريخ', 'الحالة', 'الإجمالي', 'طريقة الدفع'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.customerName || o.userId,
      o.customerPhone,
      new Date(o.date).toLocaleDateString('ar-EG'),
      getStatusText(o.status),
      o.total,
      o.paymentMethod
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printInvoice = () => {
    window.print();
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full pb-24 bg-bg-general min-h-screen relative font-sans pt-8" 
      dir="rtl"
    >
      {/* Page Title Section */}
      <div className="px-4 sm:px-8 lg:px-12 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-sm">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-carbon tracking-tight">إدارة الطلبات</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">لوحة التحكم الشاملة لطلبات متجرك</p>
          </div>
        </div>
      </div>

      {/* Today's Statistics - Refined Compact Card */}
      <div className="px-4 sm:px-8 lg:px-12 mt-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-bg-hover rounded-[32px] p-6 sm:p-8 shadow-sm max-w-md"
        >
          {/* Revenue Section (Top) */}
          <div className="flex items-center gap-5 mb-6">
            <div className="w-14 h-14 rounded-[20px] bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">إجمالي مبيعات اليوم</div>
              <div className="flex items-baseline gap-2">
                {renderPrice(stats.totalRevenue, "text-3xl sm:text-4xl font-black text-carbon tracking-tighter")}
                <span className={`text-xs font-black ${stats.percentageChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.percentageChange >= 0 ? '↑' : '↓'} {Math.abs(stats.percentageChange).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Stats (Bottom Row) */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-bg-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg-general flex items-center justify-center text-carbon border border-bg-hover shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">إجمالي الطلبات</div>
                <div className="text-xl font-black text-carbon leading-none">{stats.total}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">طلبات معلقة</div>
                <div className="text-xl font-black text-carbon leading-none">{stats.pending}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Filters - Categories Style */}
      <div className="px-2 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2 sm:gap-3">
            <ListFilter className="w-6 h-6 sm:w-8 sm:h-8 text-solar" />
            حالات الطلبات
          </h2>
        </div>
        <div className="flex overflow-x-auto gap-4 sm:gap-6 no-scrollbar pb-4 pt-2">
          {[
            { label: 'الكل', count: stats.total, icon: Grid, color: 'text-solar', bg: 'bg-solar/10', activeBg: 'bg-solar', status: 'الكل' },
            { label: 'قيد الانتظار', count: stats.pending, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', activeBg: 'bg-orange-500', status: 'قيد الانتظار' },
            { label: 'قيد التنفيذ', count: stats.processing, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50', activeBg: 'bg-blue-500', status: 'قيد التنفيذ' },
            { label: 'مكتمل', count: stats.delivered + stats.shipped, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', activeBg: 'bg-emerald-500', status: 'مكتمل' },
            { label: 'ملغي', count: stats.cancelled, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', activeBg: 'bg-red-500', status: 'ملغي' },
          ].map((item, idx) => (
            <motion.button 
              key={idx} 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(item.status)}
              className="flex flex-col items-center gap-2 sm:gap-3 min-w-[80px] sm:min-w-[110px] transition-all group relative shrink-0"
            >
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-[22px] flex flex-col items-center justify-center transition-all duration-300 relative z-10 border ${
                statusFilter === item.status 
                ? `${item.activeBg} text-white shadow-xl shadow-solar/20 border-transparent` 
                : `${item.bg} ${item.color} shadow-sm hover:shadow-md border-bg-hover`
              }`}>
                <item.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                <span className="text-[10px] sm:text-xs font-black">{item.count}</span>
                {statusFilter === item.status && (
                  <motion.div 
                    layoutId="activeStatusIndicator"
                    className="absolute -bottom-1.5 w-6 h-1 bg-white/40 rounded-full"
                  />
                )}
              </div>
              <span className={`text-[10px] sm:text-sm font-bold transition-colors ${statusFilter === item.status ? 'text-solar' : 'text-slate-500 group-hover:text-carbon'}`}>
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-2 sm:px-6 lg:px-8">
        {/* Search & Bulk Actions Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <FloatingInput
                id="orderSearch"
                label="بحث سريع في الطلبات..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                iconPosition="start"
                bgClass="bg-white"
              />
            </div>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFilterMenuOpen(true)}
              className="p-4 bg-white border border-bg-hover rounded-2xl text-carbon hover:bg-bg-hover transition-all shadow-sm shrink-0"
            >
              <Filter className="w-6 h-6" />
            </motion.button>
          </div>

          {selectedOrders.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-carbon text-white px-6 py-3 rounded-2xl shadow-xl border border-white/10 w-full md:w-auto justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-solar/20 text-solar flex items-center justify-center font-black text-sm">
                  {selectedOrders.length}
                </div>
                <span className="text-xs font-bold">طلب مختار</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleBulkStatusUpdate('shipped')} className="px-4 py-2 bg-solar text-black rounded-xl text-[10px] font-black">شحن</button>
                <button onClick={() => setSelectedOrders([])} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Orders List Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2 sm:gap-3">
            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-solar" />
            قائمة الطلبات
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 bg-bg-card px-4 py-2 rounded-xl border border-bg-hover">
              {filteredOrders.length} طلب متاح
            </span>
          </div>
        </div>

        {/* Orders Grid - Product Card Style */}
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center bg-white rounded-[32px] border border-bg-hover shadow-sm"
            >
              <div className="w-24 h-24 bg-bg-general rounded-full flex items-center justify-center mx-auto mb-6 border border-bg-hover">
                <ShoppingBag className="w-12 h-12 text-slate-200" />
              </div>
              <p className="text-slate-400 font-black text-lg">لا توجد نتائج تطابق بحثك</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            >
              {paginatedOrders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  variants={itemVariants}
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsDetailsModalOpen(true);
                  }}
                  className="bg-white border border-bg-hover rounded-[32px] p-5 sm:p-7 transition-all duration-500 flex flex-col group relative shadow-sm hover:shadow-2xl hover:shadow-solar/10 hover:border-solar/30 hover:-translate-y-2 overflow-hidden cursor-pointer"
                >
                  {/* Decorative Background Element */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-solar/5 rounded-full blur-3xl group-hover:bg-solar/10 transition-colors" />

                  {/* Top Row: ID & Status */}
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-bg-general flex items-center justify-center text-slate-400 group-hover:bg-carbon group-hover:text-solar transition-all duration-500 shadow-inner">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">رقم الطلب</span>
                        <span className="text-xs font-black text-carbon uppercase tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/50 ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                    {order.paymentProof && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 z-20">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                    )}
                  </div>
 
                  {/* Customer Info */}
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-[24px] bg-bg-general overflow-hidden border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.customerName || order.id}`} 
                        alt="Customer" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-carbon text-lg mb-1 truncate leading-tight group-hover:text-solar transition-colors">{order.customerName || 'عميل مجهول'}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-solar" />
                        <span className="truncate">{order.city || 'الرياض'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Items Count */}
                  <div className="bg-bg-general rounded-[24px] p-5 mb-8 flex items-center justify-between border border-bg-hover group-hover:bg-white transition-colors relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">القيمة الإجمالية</span>
                      {renderPrice(order.total, "text-xl font-black text-carbon tracking-tighter")}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">المنتجات</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-carbon">{order.items.length}</span>
                        <ShoppingBag className="w-3.5 h-3.5 text-solar" />
                      </div>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="flex items-center gap-3 mt-auto relative z-10">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        setIsDetailsModalOpen(true);
                      }}
                      className="flex-1 py-4 bg-carbon text-solar rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-carbon/10 hover:shadow-carbon/20 transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                      <Eye className="w-4 h-4" />
                      التفاصيل
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: '#10B981', color: '#fff' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(order.customerPhone, order.id);
                      }}
                      className="w-14 h-14 bg-white border border-bg-hover rounded-2xl flex items-center justify-center text-emerald-500 transition-all shadow-sm"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {/* Selection Checkbox (if bulk mode) */}
                  <motion.div 
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrderSelection(order.id);
                    }}
                    className={`absolute top-6 left-6 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all z-20 ${
                      selectedOrders.includes(order.id) 
                      ? 'bg-solar border-solar text-carbon shadow-lg shadow-solar/20' 
                      : 'bg-white/40 border-white/60 backdrop-blur-md opacity-0 group-hover:opacity-100 shadow-sm'
                    }`}
                  >
                    {selectedOrders.includes(order.id) && <CheckSquare className="w-4 h-4" />}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white border border-bg-hover flex items-center justify-center text-carbon disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-general transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="text-sm font-bold text-carbon">
              صفحة {currentPage} من {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl bg-white border border-bg-hover flex items-center justify-center text-carbon disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-general transition-colors rotate-180"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedOrders.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-6 right-6 z-50 bg-carbon rounded-3xl p-4 flex items-center justify-between shadow-2xl border border-white/10"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedOrders([])}
                className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-white">
                <div className="text-xs font-black">{selectedOrders.length} طلبات مختارة</div>
                <div className="text-[10px] text-solar font-bold">إجراءات سريعة</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkStatusUpdate('shipped')}
                className="px-4 py-2 bg-solar text-carbon rounded-xl text-[10px] font-black"
              >
                شحن الكل
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('delivered')}
                className="px-4 py-2 bg-state-success text-white rounded-xl text-[10px] font-black"
              >
                إكمال الكل
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Filter Bottom Sheet - Redesigned for Elite Aesthetic */}
      <AnimatePresence>
        {isFilterMenuOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterMenuOpen(false)}
              className="absolute inset-0 bg-carbon/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-bg-general rounded-t-[40px] p-8 sm:p-12 shadow-2xl border-t border-white/20"
            >
              <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mb-10" />
              
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-carbon tracking-tight">تصفية متقدمة</h3>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setDateFilter('الكل');
                    setPaymentFilter('الكل');
                    setPriceFilter('الكل');
                    setCityFilter('الكل');
                  }}
                  className="text-xs font-black text-solar uppercase tracking-widest"
                >
                  إعادة تعيين
                </motion.button>
              </div>
              
              <div className="space-y-10 max-h-[60vh] overflow-y-auto no-scrollbar pb-10">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 block">إجراءات سريعة</label>
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedOrders(filteredOrders.map(o => o.id));
                      setIsFilterMenuOpen(false);
                    }}
                    className="w-full py-5 bg-white text-carbon rounded-3xl font-black text-sm border border-bg-hover flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <CheckSquare className="w-6 h-6 text-solar" />
                    <span>تحديد جميع الطلبات المعروضة</span>
                  </motion.button>
                </div>

                {[
                  { label: 'حسب التاريخ', options: dateOptions, current: dateFilter, setter: setDateFilter },
                  { label: 'طريقة الدفع', options: paymentOptions, current: paymentFilter, setter: setPaymentFilter },
                  { label: 'نطاق السعر', options: priceOptions, current: priceFilter, setter: setPriceFilter },
                  { label: 'المدينة', options: cityOptions, current: cityFilter, setter: setCityFilter },
                ].map((group, i) => (
                  <div key={i}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 block">{group.label}</label>
                    <div className="flex flex-wrap gap-3">
                      {group.options.map(opt => (
                        <motion.button 
                          key={opt}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => group.setter(opt)}
                          className={`px-6 py-3.5 rounded-2xl text-xs font-black transition-all border ${
                            group.current === opt 
                            ? 'bg-carbon text-solar border-carbon shadow-lg shadow-carbon/20' 
                            : 'bg-white text-slate-500 border-bg-hover hover:border-solar/30'
                          }`}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-bg-hover">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFilterMenuOpen(false)}
                  className="w-full py-5 bg-solar text-carbon rounded-[24px] font-black text-base shadow-2xl shadow-solar/30 border border-white/20"
                >
                  تطبيق الفلاتر
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Quick View Modal - Redesigned as Profile Card */}
      <AnimatePresence>
        {isCustomerModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute inset-0 bg-carbon/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl border border-white/20"
            >
              {/* Profile Header Background */}
              <div className="h-32 bg-carbon relative">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-solar rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-solar rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>
              </div>

              <div className="px-8 pb-10 -mt-16 relative z-10 text-center">
                <div className="w-32 h-32 rounded-[40px] bg-white p-2 mx-auto mb-6 shadow-2xl border border-bg-hover">
                  <div className="w-full h-full rounded-[32px] bg-bg-general overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCustomer.name}`} 
                      alt={selectedCustomer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-2xl font-black text-carbon tracking-tight">{selectedCustomer.name}</h3>
                  <Crown className="w-5 h-5 text-solar" />
                </div>
                <p className="text-sm font-bold text-slate-400 mb-8 flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  {selectedCustomer.phone}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-6 bg-bg-general rounded-[32px] border border-bg-hover shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي الطلبات</div>
                    <div className="text-2xl font-black text-carbon">{selectedCustomer.totalOrders}</div>
                  </div>
                  <div className="p-6 bg-bg-general rounded-[32px] border border-bg-hover shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي المشتريات</div>
                    <div className="text-2xl font-black text-solar">{renderPrice(selectedCustomer.totalSpent)}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWhatsApp(selectedCustomer.phone, '')}
                    className="flex-1 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    تواصل واتساب
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-8 py-5 bg-bg-general text-slate-400 rounded-[24px] font-black text-sm border border-bg-hover"
                  >
                    إغلاق
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Overlay - Redesigned for Elite Aesthetic */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-white/95 backdrop-blur-2xl"
          >
            <div className="max-w-4xl mx-auto px-6 pt-12 sm:pt-24">
              <div className="flex items-center gap-6 mb-12">
                <motion.button 
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSearchOpen(false)} 
                  className="w-14 h-14 rounded-2xl bg-bg-general border border-bg-hover flex items-center justify-center text-carbon shadow-sm"
                >
                  <ArrowRight className="w-7 h-7" />
                </motion.button>
                <div className="flex-1 relative group">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-7 h-7 text-solar transition-transform group-focus-within:scale-110" />
                  <input 
                    type="text"
                    placeholder="ابحث بالاسم، رقم الطلب، أو رقم الجوال..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-bg-general border-2 border-transparent focus:border-solar/30 rounded-[32px] py-6 pr-16 pl-8 text-xl font-black text-carbon placeholder:text-slate-300 focus:ring-4 focus:ring-solar/10 transition-all shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">اقتراحات البحث</h4>
                  <div className="flex flex-wrap gap-3">
                    {['الرياض', 'جدة', 'قيد الانتظار', 'مكتمل', 'اليوم'].map((tag) => (
                      <motion.button
                        key={tag}
                        whileHover={{ y: -3, backgroundColor: '#000', color: '#EAB308' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSearchTerm(tag)}
                        className="px-6 py-3 bg-bg-general border border-bg-hover rounded-2xl text-sm font-bold text-slate-500 transition-all"
                      >
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {searchTerm && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-general rounded-[40px] p-8 border border-bg-hover"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-black text-carbon">نتائج البحث ({filteredOrders.length})</span>
                      <button onClick={() => setSearchTerm('')} className="text-xs font-bold text-solar">مسح البحث</button>
                    </div>
                    <div className="max-h-[40vh] overflow-y-auto no-scrollbar space-y-3">
                      {filteredOrders.slice(0, 5).map((order) => (
                        <div 
                          key={order.id}
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailsModalOpen(true);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-bg-hover hover:border-solar transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-solar/10 flex items-center justify-center text-solar group-hover:bg-solar group-hover:text-carbon transition-colors">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-carbon">#{order.id.slice(-8).toUpperCase()}</div>
                              <div className="text-[10px] font-bold text-slate-400">{order.customerName}</div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-solar transition-colors" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Details Modal - Redesigned for Elite Aesthetic */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-carbon/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-bg-general rounded-t-[32px] sm:rounded-t-[40px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border-t border-white/20"
            >
              {/* Modal Header */}
              <div className="px-5 sm:px-10 py-4 sm:py-8 border-b border-bg-hover flex items-center justify-between bg-white/50 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[24px] bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-inner shrink-0">
                    <ShoppingBag className="w-5 h-5 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-carbon tracking-tight">تفاصيل الطلب</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest bg-bg-general px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-bg-hover">
                        #{selectedOrder.id.slice(-10).toUpperCase()}
                      </span>
                      <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white border border-bg-hover text-slate-400 flex items-center justify-center shadow-sm shrink-0"
                  >
                    <MoreVertical className="w-4 h-4 sm:w-6 sm:h-6" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white border border-bg-hover text-slate-400 flex items-center justify-center shadow-sm shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-6 sm:h-6" />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isActionMenuOpen && (
                      <>
                        {/* Backdrop for click outside */}
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsActionMenuOpen(false);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-[calc(100%+8px)] left-0 sm:left-auto sm:right-0 w-56 bg-white rounded-2xl shadow-2xl border border-bg-hover overflow-hidden z-50"
                        >
                        <div className="p-2 flex flex-col gap-1">
                          {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (selectedOrder.status === 'pending') handleStatusUpdate(selectedOrder.id, 'processing');
                                else if (selectedOrder.status === 'processing') handleStatusUpdate(selectedOrder.id, 'shipped');
                                else if (selectedOrder.status === 'shipped') handleStatusUpdate(selectedOrder.id, 'delivered');
                                setIsActionMenuOpen(false);
                              }}
                              className="flex items-center gap-3 w-full p-3 text-right text-sm font-bold text-carbon hover:bg-bg-general rounded-xl transition-colors"
                            >
                              {selectedOrder.status === 'pending' ? <><Package className="w-4 h-4 text-solar" /> قبول وتجهيز الطلب</> : 
                               selectedOrder.status === 'processing' ? <><Truck className="w-4 h-4 text-solar" /> تحديث: تم الشحن</> : 
                               selectedOrder.status === 'shipped' ? <><CheckCircle2 className="w-4 h-4 text-solar" /> تحديث: تم التوصيل</> : 'تحديث الحالة'}
                            </button>
                          )}
                          
                          {/* Revert Status Button */}
                          {selectedOrder.status !== 'pending' && (
                            <button
                              onClick={() => {
                                if (selectedOrder.status === 'processing') handleStatusUpdate(selectedOrder.id, 'pending', true);
                                else if (selectedOrder.status === 'shipped') handleStatusUpdate(selectedOrder.id, 'processing', true);
                                else if (selectedOrder.status === 'delivered') handleStatusUpdate(selectedOrder.id, 'shipped', true);
                                else if (selectedOrder.status === 'cancelled') handleStatusUpdate(selectedOrder.id, 'pending', true);
                                setIsActionMenuOpen(false);
                              }}
                              className="flex items-center gap-3 w-full p-3 text-right text-sm font-bold text-slate-500 hover:bg-bg-general rounded-xl transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              {selectedOrder.status === 'cancelled' ? 'إعادة تفعيل الطلب' : 'تراجع عن الحالة السابقة'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              handleWhatsApp(selectedOrder.customerPhone || '', selectedOrder.id);
                              setIsActionMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full p-3 text-right text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            مراسلة عبر واتساب
                          </button>
                          <button
                            onClick={() => {
                              showToast('جاري تحضير الفاتورة للطباعة...', 'info');
                              window.print();
                              setIsActionMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full p-3 text-right text-sm font-bold text-carbon hover:bg-bg-general rounded-xl transition-colors"
                          >
                            <Printer className="w-4 h-4 text-slate-400" />
                            طباعة الفاتورة
                          </button>
                          {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                            <button
                              onClick={() => {
                                handleStatusUpdate(selectedOrder.id, 'cancelled');
                                setIsActionMenuOpen(false);
                              }}
                              className="flex items-center gap-3 w-full p-3 text-right text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1 border-t border-bg-hover"
                            >
                              <XCircle className="w-4 h-4" />
                              إلغاء الطلب
                            </button>
                          )}
                        </div>
                      </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Top Navigation Tabs */}
              <div className="px-5 sm:px-10 bg-white/50 backdrop-blur-xl border-b border-bg-hover flex items-center gap-5 sm:gap-10 overflow-x-auto no-scrollbar">
                {[
                  { id: 'items', label: 'المنتجات', icon: Package },
                  { id: 'customer', label: 'العميل والشحن', icon: User },
                  { id: 'timeline', label: 'التتبع والحالة', icon: History }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModalTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 sm:py-4 border-b-2 transition-all shrink-0 ${
                      activeModalTab === tab.id 
                        ? 'border-solar text-solar font-black' 
                        : 'border-transparent text-slate-400 font-bold hover:text-carbon'
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeModalTab === tab.id ? 'text-solar' : 'text-slate-300'}`} />
                    <span className="text-[11px] sm:text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-10 no-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeModalTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeModalTab === 'items' && (
                      <div className="space-y-6 sm:space-y-10">
                        {/* Items Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Package className="w-4 h-4 text-solar" />
                              المنتجات ({selectedOrder.items.length})
                            </h3>
                          </div>
                          <div className="space-y-3 sm:space-y-4">
                            {selectedOrder.items.map((item, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 sm:gap-5 p-3 sm:p-5 bg-white rounded-[16px] sm:rounded-[32px] border border-bg-hover shadow-sm hover:shadow-md transition-all group"
                              >
                                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-[12px] sm:rounded-[20px] overflow-hidden border border-bg-hover shrink-0 group-hover:scale-105 transition-transform">
                                  <img src={item.product?.image || undefined} alt={item.product?.name || 'محذوف'} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-base font-black text-carbon truncate leading-tight mb-1">{item.product?.name || 'منتج محذوف غير متوفر'}</div>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-[9px] sm:text-xs font-bold text-slate-400">{item.quantity} قطعة</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    {renderPrice(item.product?.price || 0, "text-[9px] sm:text-xs font-black text-solar")}
                                  </div>
                                </div>
                                <div className="text-xs sm:text-base font-black text-carbon">{renderPrice((item.product?.price || 0) * item.quantity)}</div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary Card */}
                        <div className="bg-carbon rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 text-white shadow-2xl shadow-carbon/30 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-solar/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                          <div className="relative z-10 space-y-3 sm:space-y-6">
                            <div className="flex justify-between items-center text-[11px] sm:text-sm">
                              <span className="text-slate-400 font-bold">المجموع الفرعي</span>
                              <span>{renderPrice(selectedOrder.subtotal, "font-black")}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] sm:text-sm">
                              <span className="text-slate-400 font-bold">رسوم الشحن والتوصيل</span>
                              <span>{renderPrice(selectedOrder.shippingFee, "font-black")}</span>
                            </div>
                            {selectedOrder.discountAmount > 0 && (
                              <div className="flex justify-between items-center text-[11px] sm:text-sm text-emerald-400">
                                <span className="font-bold">خصم ترويجي</span>
                                <span>-{renderPrice(selectedOrder.discountAmount, "font-black")}</span>
                              </div>
                            )}
                            <div className="pt-4 sm:pt-8 border-t border-white/10 flex justify-between items-center">
                              <div>
                                <span className="text-[8px] sm:text-[10px] text-solar font-black uppercase tracking-[0.2em] block mb-1">المبلغ الإجمالي</span>
                                <div className="text-2xl sm:text-4xl font-black text-solar tracking-tighter">{renderPrice(selectedOrder.total)}</div>
                              </div>
                              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-solar/20 flex items-center justify-center text-solar border border-solar/30">
                                <CreditCard className="w-5 h-5 sm:w-8 sm:h-8" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeModalTab === 'customer' && (
                      /* Customer Card */
                      <div className="bg-white rounded-[24px] sm:rounded-[40px] p-4 sm:p-8 border border-bg-hover shadow-sm">
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-solar" />
                          بيانات العميل
                        </h3>
                        <div className="flex items-center gap-3 sm:gap-5 mb-5 sm:mb-8">
                          <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-[14px] sm:rounded-[24px] bg-bg-general border border-bg-hover overflow-hidden shadow-inner shrink-0">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedOrder.customerName}`} alt="" className="w-full h-full" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm sm:text-lg font-black text-carbon leading-tight mb-1 truncate">{selectedOrder.customerName}</div>
                            <div className="text-[9px] sm:text-xs font-bold text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate">{selectedOrder.customerPhone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-bg-hover">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-bg-general flex items-center justify-center text-slate-400 shrink-0">
                              <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                              <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">عنوان التوصيل</div>
                              <div className="text-[11px] sm:text-sm font-bold text-carbon leading-relaxed">{selectedOrder.city} - {selectedOrder.shippingAddress || 'العنوان غير محدد'}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-bg-general flex items-center justify-center text-slate-400 shrink-0">
                              <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                              <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">طريقة الدفع</div>
                              <div className="text-[11px] sm:text-sm font-bold text-carbon">{selectedOrder.paymentMethod}</div>
                              {selectedOrder.paymentReference && (
                                <div className="text-[8px] sm:text-[10px] font-mono font-bold text-solar mt-0.5 sm:mt-1">
                                  المرجع: {selectedOrder.paymentReference}
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedOrder.paymentProof && (
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-bg-general flex items-center justify-center text-slate-400 shrink-0">
                                <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">إثبات الدفع</div>
                                <div className="relative group cursor-zoom-in rounded-xl sm:rounded-2xl overflow-hidden border border-bg-hover">
                                  <img 
                                    src={selectedOrder.paymentProof || undefined} 
                                    alt="إثبات الدفع" 
                                    className="w-full h-auto max-h-32 sm:max-h-48 object-cover transition-transform group-hover:scale-110" 
                                    referrerPolicy="no-referrer"
                                    onClick={() => window.open(selectedOrder.paymentProof, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-carbon/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-[9px] sm:text-[10px] font-black">اضغط للتكبير</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeModalTab === 'timeline' && (
                      /* Order Timeline (Simplified) */
                      <div className="bg-white rounded-[24px] sm:rounded-[40px] p-4 sm:p-8 border border-bg-hover shadow-sm">
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-solar" />
                          تتبع الطلب
                        </h3>
                        <div className="space-y-4 sm:space-y-6">
                          {[
                            { label: 'تم استلام الطلب', date: selectedOrder.date, active: true, icon: CheckCircle2 },
                            { label: 'قيد التجهيز', date: null, active: selectedOrder.status !== 'pending', icon: Package },
                            { label: 'تم الشحن', date: null, active: ['shipped', 'delivered'].includes(selectedOrder.status), icon: Truck },
                            { label: 'تم التوصيل', date: null, active: selectedOrder.status === 'delivered', icon: CheckCircle2 },
                          ].map((step, i) => (
                            <div key={i} className="flex items-center gap-3 sm:gap-4 relative">
                              {i < 3 && (
                                <div className={`absolute top-7 sm:top-8 right-4 sm:right-5 w-0.5 h-5 sm:h-6 ${step.active ? 'bg-solar' : 'bg-slate-100'}`} />
                              )}
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border-2 transition-all shrink-0 ${
                                step.active ? 'bg-solar/10 border-solar text-solar' : 'bg-white border-slate-100 text-slate-200'
                              }`}>
                                <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="flex-1">
                                <div className={`text-[11px] sm:text-xs font-black ${step.active ? 'text-carbon' : 'text-slate-300'}`}>{step.label}</div>
                                {step.date && <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5">{new Date((step.date as any)?.seconds ? (step.date as any).seconds * 1000 : step.date).toLocaleString('ar-EG')}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
