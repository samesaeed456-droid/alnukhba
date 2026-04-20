import React, { useState, useMemo } from 'react';
import { 
  Search, Users, User, Mail, Phone, MapPin, 
  Calendar, ShoppingBag, DollarSign, 
  MoreVertical, Edit, Trash2, ExternalLink,
  Filter, Plus, Star, ShieldCheck,
  TrendingUp, ArrowUpDown, X, Printer, MessageSquare, PhoneCall,
  Eye, EyeOff, Lock, BarChart3, Package, ChevronRight, TrendingDown, ArrowLeft, ArrowRight,
  AlertCircle, ListFilter, Grid, UserPlus, Wallet, Activity, Download, Bell, Pin,
  Ban, UserCheck, Zap, History, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingInput } from '../../components/FloatingInput';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useStore } from '../../context/StoreContext';
import { UserProfile as UserType } from '../../types';
import { smsService } from '../../services/smsService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Customers() {
  const { customers, orders, formatPrice, addCustomer, deleteCustomer, updateCustomerBalance, updateCustomer, blockCustomer, showToast, settings, setNotifications, logActivity, sendMarketingNotification } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCustomer, setSelectedCustomer] = useState<UserType | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAction, setBalanceAction] = useState<{ type: 'deposit' | 'withdraw', customer: UserType | null }>({ type: 'deposit', customer: null });
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wallet' | 'activity'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({ name: '', phone: '', address: '' });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [pinnedNotes, setPinnedNotes] = useState<string[]>([]);
  
  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'system' as any });
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceAction.customer || !balanceAmount) return;

    const amount = Number(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    const finalAmount = balanceAction.type === 'deposit' ? amount : -amount;
    updateCustomerBalance(balanceAction.customer.uid || balanceAction.customer.phone || '', finalAmount, balanceDescription || (balanceAction.type === 'deposit' ? 'شحن رصيد يدوي' : 'سحب رصيد يدوي'));
    
    setBalanceAmount('');
    setBalanceDescription('');
    setIsBalanceModalOpen(false);
    
    if (selectedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        walletBalance: (selectedCustomer.walletBalance || 0) + finalAmount
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`تم نسخ ${label} بنجاح`, 'success');
      }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          showToast(`تم نسخ ${label} بنجاح`, 'success');
        } catch (err) {
          showToast('فشل النسخ', 'error');
        }
        document.body.removeChild(textArea);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast(`تم نسخ ${label} بنجاح`, 'success');
      } catch (err) {
        showToast('فشل النسخ', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !notificationData.title || !notificationData.message) return;
    
    try {
      await sendMarketingNotification({
        title: notificationData.title,
        message: notificationData.message,
        target: 'specific_user',
        targetUserId: selectedCustomer.uid || selectedCustomer.phone,
        type: notificationData.type === 'sms' ? 'sms' : 'push'
      });
      // sendMarketingNotification takes care of showing the success toast and logging activity
    } catch (err) {
      showToast('فشل إرسال الإشعار', 'error');
    }
    
    setIsNotificationModalOpen(false);
    setNotificationData({ title: '', message: '', type: 'system' });
  };

  const [isSendingSms, setIsSendingSms] = useState(false);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !smsMessage) return;
    
    setIsSendingSms(true);
    
    try {
      showToast('تم إرسال الرسالة النصية بنجاح', 'success');
      setIsSmsModalOpen(false);
      setSmsMessage('');
    } catch (error) {
      showToast('فشل إرسال الرسالة', 'error');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleSendReminder = async (customer: UserType) => {
    setIsActionMenuOpen(false);
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: customer.phone,
          message: `أهلاً ${customer.displayName || 'عميلنا العزيز'}، مكانك محفوظ دائماً في متجر النخبة 🌟. لأننا نقدر ذوقك الرفيع، حرصنا على توفير أحدث الإصدارات التي نعلم أنها ستنال إعجابك. ننتظر إطلالتك بشوق: ${window.location.origin}`
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('تم إرسال تذكير SMS بنجاح', 'success');
      } else {
        // Show the actual error from the server
        showToast(data.error || 'فشل إرسال التذكير', 'error');
        console.error('SMS Error:', data.details);
      }
      
      logActivity('إرسال تذكير', `تم إرسال تذكير عام للعميل ${customer.displayName}`);
    } catch (error) {
      showToast('فشل الاتصال بالخادم لإرسال الرسالة', 'error');
    }
  };

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    balance: 0,
    notes: '',
  });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      showToast('يرجى إدخال الاسم ورقم الهاتف على الأقل', 'error');
      return;
    }

    const customerData: UserType = {
      displayName: newCustomer.name,
      phone: newCustomer.phone,
      password: newCustomer.password,
      address: `${newCustomer.city}, ${newCustomer.address}`,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(newCustomer.name)}&background=random`,
      walletBalance: Number(newCustomer.balance) || 0,
      joinDate: new Date().toISOString(),
      orderCount: 0,
      totalSpent: 0,
      transactions: newCustomer.balance > 0 ? [{
        id: crypto.randomUUID(),
        amount: Number(newCustomer.balance),
        type: 'deposit',
        date: new Date().toISOString(),
        status: 'completed',
        description: 'رصيد افتتاحي عند إنشاء الحساب'
      }] : [],
      notes: newCustomer.notes ? [{
        id: crypto.randomUUID(),
        text: newCustomer.notes,
        date: new Date().toISOString(),
        author: 'مدير النظام'
      }] : [],
      wishlist: [],
    };

    addCustomer(customerData);

    setNewCustomer({
      name: '',
      phone: '',
      password: '',
      address: '',
      city: '',
      balance: 0,
      notes: '',
    });
    setIsAddModalOpen(false);
  };

  // Calculate customer metrics
  const customerMetrics = useMemo(() => {
    return customers.map(user => {
      const userOrders = orders.filter(o => o.userId === user.uid);
      const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        ...user,
        orderCount: userOrders.length,
        totalSpent,
        lastOrder: userOrders.length > 0 ? userOrders[0].date : null
      };
    });
  }, [customers, orders]);

  const stats = useMemo(() => {
    const total = customers.length;
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeThisMonth = customers.filter(c => {
      const userOrders = orders.filter(o => o.userId === c.uid);
      const lastOrder = userOrders.length > 0 ? userOrders[0].date : null;
      const lastOrderDate = (lastOrder as any)?.seconds ? new Date((lastOrder as any).seconds * 1000) : (lastOrder ? new Date(lastOrder) : null);
      return lastOrderDate && lastOrderDate >= thirtyDaysAgo;
    }).length;

    const newThisMonth = customers.filter(c => {
      const joinDate = (c.joinDate as any)?.seconds ? new Date((c.joinDate as any).seconds * 1000) : (c.joinDate ? new Date(c.joinDate) : null);
      return joinDate && joinDate >= thirtyDaysAgo;
    }).length;

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgLTV = total > 0 ? totalRevenue / total : 0;
    
    const inactiveCount = total - activeThisMonth;
    
    return { total, activeThisMonth, avgLTV, newThisMonth, inactiveCount };
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    return customerMetrics
      .filter(customer => {
        const matchesSearch = (customer.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (customer.phone || '').includes(searchTerm);
        
        let matchesStatus = true;
        const lastOrder = customer.lastOrder;
        const lastOrderDate = (lastOrder as any)?.seconds ? new Date((lastOrder as any).seconds * 1000) : (lastOrder ? new Date(lastOrder) : null);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isActive = lastOrderDate ? lastOrderDate >= thirtyDaysAgo : false;

        if (statusFilter === 'نشط') {
          matchesStatus = isActive;
        } else if (statusFilter === 'غير نشط') {
          matchesStatus = !isActive;
        } else if (statusFilter === 'جديد') {
          matchesStatus = customer.orderCount <= 1;
        }

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') comparison = (a.displayName || '').localeCompare(b.displayName || '');
        if (sortBy === 'orders') comparison = a.orderCount - b.orderCount;
        if (sortBy === 'spent') comparison = a.totalSpent - b.totalSpent;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [customerMetrics, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleViewProfile = (customer: UserType) => {
    setSelectedCustomer(customer);
    setIsProfileModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['الاسم', 'رقم الهاتف', 'العنوان', 'الرصيد', 'عدد الطلبات', 'إجمالي الإنفاق', 'تاريخ الانضمام'];
    const csvData = filteredCustomers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.walletBalance || 0,
      c.orderCount || 0,
      c.totalSpent || 0,
      c.joinDate ? `"${new Date(c.joinDate).toLocaleDateString('ar-u-nu-latn')}"` : ''
    ]);
    
    const csvContent = '\uFEFF' + [headers.join(','), ...csvData.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير بيانات العملاء بنجاح', 'success');
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full pb-32 bg-bg-general min-h-screen relative font-sans pt-4 sm:pt-8" 
      dir="rtl"
    >
      {/* Page Title Section */}
      <div className="px-2 sm:px-8 lg:px-12 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-sm">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-carbon tracking-tight">إدارة العملاء</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">لوحة التحكم الشاملة لعملاء متجرك</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-white text-carbon px-5 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95 border border-gray-200"
          >
            <Download className="w-5 h-5 text-slate-500" />
            <span className="text-xs uppercase tracking-widest hidden sm:inline">تصدير CSV</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-carbon text-white px-7 py-3 rounded-2xl font-bold hover:bg-carbon/90 transition-all shadow-xl shadow-carbon/20 active:scale-95 border border-white/10"
          >
            <Plus className="w-5 h-5 text-solar" />
            <span className="text-xs uppercase tracking-widest">إضافة عميل</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-2 sm:px-8 lg:px-12 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Total Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-slate-900/20">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">إجمالي العملاء</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-carbon">{stats.total}</span>
                <span className="text-[10px] font-bold text-slate-400">عميل</span>
              </div>
            </div>
          </motion.div>

          {/* Active Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-wider flex items-center gap-1">
                <span>نشط</span>
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">عملاء نشطون</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-carbon">{stats.activeThisMonth}</span>
                <span className="text-[10px] font-bold text-slate-400">نشط</span>
              </div>
            </div>
          </motion.div>

          {/* New Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">عملاء جدد</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-carbon">{stats.newThisMonth}</span>
                <span className="text-[10px] font-bold text-slate-400">جديد</span>
              </div>
            </div>
          </motion.div>

          {/* Average LTV */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-solar/10 transition-all duration-500"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-solar/10 text-solar flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">متوسط القيمة</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-carbon">{formatPrice(stats.avgLTV)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Filters - Categories Style */}
      <div className="px-2 sm:px-8 lg:px-12 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2 sm:gap-3">
            <ListFilter className="w-6 h-6 sm:w-8 sm:h-8 text-solar" />
            تصنيفات العملاء
          </h2>
        </div>
        <div className="flex overflow-x-auto gap-4 sm:gap-6 no-scrollbar pb-4 pt-2">
          {[
            { label: 'الكل', count: stats.total, icon: Grid, color: 'text-solar', bg: 'bg-solar/10', activeBg: 'bg-solar', status: 'الكل' },
            { label: 'نشط', count: stats.activeThisMonth, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', activeBg: 'bg-emerald-500', status: 'نشط' },
            { label: 'غير نشط', count: stats.inactiveCount, icon: TrendingDown, color: 'text-slate-400', bg: 'bg-slate-50', activeBg: 'bg-slate-400', status: 'غير نشط' },
            { label: 'جديد', count: customerMetrics.filter(c => c.orderCount <= 1).length, icon: Star, color: 'text-blue-500', bg: 'bg-blue-50', activeBg: 'bg-blue-500', status: 'جديد' },
          ].map((item, idx) => (
            <motion.button 
              key={idx} 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(item.status)}
              className={`flex flex-col items-center justify-center min-w-[100px] sm:min-w-[120px] p-4 sm:p-5 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden group ${
                statusFilter === item.status 
                  ? `border-transparent ${item.activeBg} shadow-xl shadow-${item.activeBg.split('-')[1]}-500/30` 
                  : `border-transparent ${item.bg} hover:border-${item.color.split('-')[1]}-200`
              }`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                statusFilter === item.status ? 'bg-white/20 text-white' : `bg-white ${item.color} shadow-sm`
              }`}>
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className={`text-xs sm:text-sm font-black mb-1 ${statusFilter === item.status ? 'text-white' : 'text-carbon'}`}>
                {item.label}
              </span>
              <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg ${
                statusFilter === item.status ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
              }`}>
                {item.count} عميل
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="px-2 sm:px-8 lg:px-12 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FloatingInput
              id="customerSearch"
              label="البحث بالاسم، رقم الهاتف..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              iconPosition="start"
              bgClass="bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-4 bg-white border border-bg-hover rounded-2xl text-carbon font-bold focus:outline-none focus:ring-2 focus:ring-solar/50 transition-all shadow-sm appearance-none min-w-[140px]"
            >
              <option value="name">الاسم</option>
              <option value="orders">عدد الطلبات</option>
              <option value="spent">الإنفاق</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-4 bg-white border border-bg-hover rounded-2xl text-carbon hover:bg-bg-hover transition-all shadow-sm shrink-0"
            >
              <ArrowUpDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="px-2 sm:px-8 lg:px-12">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center bg-white rounded-[32px] border border-bg-hover shadow-sm"
            >
              <div className="w-24 h-24 bg-bg-general rounded-full flex items-center justify-center mx-auto mb-6 border border-bg-hover">
                <Users className="w-12 h-12 text-slate-200" />
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
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.uid || customer.phone || index}
                  layout
                  variants={itemVariants}
                  onClick={() => handleViewProfile(customer)}
                  className="bg-white border border-bg-hover rounded-[32px] p-5 sm:p-7 transition-all duration-500 flex flex-col group relative shadow-sm hover:shadow-2xl hover:shadow-solar/10 hover:border-solar/30 hover:-translate-y-2 overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({
                          isOpen: true,
                          title: 'حذف العميل',
                          message: `هل أنت متأكد من حذف العميل "${customer.name}"؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع بياناته.`,
                          onConfirm: () => deleteCustomer(customer.uid || customer.phone || ''),
                          type: 'danger',
                          confirmText: 'حذف العميل'
                        });
                      }}
                      className="p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Decorative Background Element */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-solar/5 rounded-full blur-3xl group-hover:bg-solar/10 transition-colors" />

                  {/* Customer Info */}
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-16 h-16 rounded-[24px] bg-bg-general overflow-hidden border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-500 flex items-center justify-center text-2xl font-black text-slate-400 relative">
                      {customer.avatar ? (
                        <img src={customer.avatar || undefined} alt={customer.name} className="w-full h-full object-cover absolute inset-0 z-10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : null}
                      <span className="relative z-0">{(customer.name || customer.phone || '?').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-carbon truncate">{customer.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const lastOrderDate = customer.lastOrder ? new Date(customer.lastOrder) : null;
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          const isActive = lastOrderDate ? lastOrderDate >= thirtyDaysAgo : false;
                          
                          return isActive ? (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">نشط الآن</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">غير نشط</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-3 mb-6 relative z-10">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-slate-600 font-medium" dir="ltr">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <a 
                        href={`https://wa.me/${customer.phone.replace(/\s+/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        واتساب
                      </a>
                      <button 
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsProfileModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
                      >
                        <User className="w-3.5 h-3.5" />
                        الملف
                      </button>
                    </div>
                    {customer.lastOrder && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-bold">
                          آخر طلب: {new Date(customer.lastOrder).toLocaleDateString('ar-u-nu-latn')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-6 border-t border-bg-hover relative z-10 mt-auto">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">الطلبات</span>
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-solar" />
                        <span className="text-base font-black text-carbon">{customer.orderCount || 0}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">الرصيد</span>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-base font-black text-carbon">{formatPrice(customer.walletBalance || 0)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">الإنفاق</span>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-solar" />
                        <span className="text-base font-black text-carbon">{formatPrice(customer.totalSpent || 0)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Customer Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && selectedCustomer && (() => {
          const customer = customers.find(c => c.phone === selectedCustomer.phone) || selectedCustomer;
          const userOrders = orders.filter(o => 
            (customer.uid && o.userId === customer.uid) || 
            (customer.phone && o.customerPhone === customer.phone)
          );
          
          const filteredOrders = userOrders.filter(o => 
            (o.id || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
            (o.total || 0).toString().includes(orderSearchTerm)
          );

          const averageOrderValue = userOrders.length > 0 
            ? userOrders.reduce((sum, o) => sum + o.total, 0) / userOrders.length 
            : 0;

          const getCustomerTier = (spent: number) => {
            if (spent >= 5000) return { label: 'VIP', color: 'bg-purple-50 text-purple-600', icon: Star };
            if (spent >= 2000) return { label: 'ذهبي', color: 'bg-amber-50 text-amber-600', icon: ShieldCheck };
            if (spent >= 1000) return { label: 'فضي', color: 'bg-slate-100 text-slate-600', icon: ShieldCheck };
            return { label: 'برونزي', color: 'bg-orange-50 text-orange-600', icon: ShieldCheck };
          };

          const tier = getCustomerTier(customer.totalSpent || 0);
          
          return (
            <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute inset-0 bg-carbon/40 backdrop-blur-sm hidden sm:block"
              />
              
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 150) setIsProfileModalOpen(false);
                }}
                className="relative bg-white w-full sm:max-w-2xl lg:max-w-4xl h-full sm:h-[85vh] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
              >
                {/* Header / Top Bar */}
                <div className="bg-white/80 backdrop-blur-md px-4 py-3 sm:px-8 sm:py-5 flex items-center justify-between border-b border-slate-100 shrink-0 sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsProfileModalOpen(false)}
                      className="p-2 -mr-2 text-slate-400 hover:text-carbon hover:bg-slate-50 rounded-full transition-all"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold text-carbon">بروفايل العميل</h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                      className="p-2 text-slate-400 hover:text-carbon hover:bg-slate-50 rounded-full transition-all relative"
                    >
                      <MoreVertical className="w-6 h-6" />
                      <AnimatePresence>
                        {isActionMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsActionMenuOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-2"
                            >
                              <button onClick={() => { setIsActionMenuOpen(false); setEditCustomerData({ name: customer.name, phone: customer.phone, address: customer.address || '' }); setIsEditModalOpen(true); }} className="flex items-center gap-3 w-full p-3 text-right text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Edit className="w-4 h-4 text-slate-400" />تعديل البيانات</button>
                              <button onClick={() => { setIsActionMenuOpen(false); setIsPasswordModalOpen(true); }} className="flex items-center gap-3 w-full p-3 text-right text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Lock className="w-4 h-4 text-slate-400" />تغيير كلمة المرور</button>
                              <button onClick={() => { setIsActionMenuOpen(false); setIsNotificationModalOpen(true); }} className="flex items-center gap-3 w-full p-3 text-right text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><Bell className="w-4 h-4 text-slate-400" />إرسال إشعار</button>
                              
                              <div className="h-px bg-slate-100 my-1 mx-2" />
                              
                              <a 
                                href={`https://wa.me/${customer.phone.replace(/\s+/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setIsActionMenuOpen(false)}
                                className="flex items-center gap-3 w-full p-3 text-right text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              >
                                <MessageSquare className="w-4 h-4" />
                                مراسلة عبر واتساب
                              </a>
                              
                              <button 
                                onClick={() => { setIsActionMenuOpen(false); handleSendReminder(customer); }} 
                                className="flex items-center gap-3 w-full p-3 text-right text-sm font-semibold text-solar hover:bg-solar/5 rounded-xl transition-all"
                              >
                                <Zap className="w-4 h-4" />
                                إرسال تذكير سريع
                              </button>

                              <div className="h-px bg-slate-100 my-1 mx-2" />
                              <button 
                                onClick={() => { 
                                  setIsActionMenuOpen(false); 
                                  setConfirmModal({
                                    isOpen: true,
                                    title: customer.isBlocked ? 'إلغاء حظر العميل' : 'حظر العميل',
                                    message: customer.isBlocked ? `هل أنت متأكد من إلغاء حظر العميل "${customer.name}"؟` : `هل أنت متأكد من حظر العميل "${customer.name}"؟`,
                                    onConfirm: () => blockCustomer(customer.uid || customer.phone || ''),
                                    type: customer.isBlocked ? 'success' : 'warning',
                                    confirmText: customer.isBlocked ? 'إلغاء الحظر' : 'تأكيد الحظر'
                                  });
                                }} 
                                className={`flex items-center gap-3 w-full p-3 text-right text-sm font-semibold rounded-xl transition-all ${customer.isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                              >
                                {customer.isBlocked ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                {customer.isBlocked ? 'إلغاء الحظر' : 'حظر العميل'}
                              </button>
                              <button 
                                onClick={() => { 
                                  setIsActionMenuOpen(false); 
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'حذف الحساب',
                                    message: `هل أنت متأكد من حذف حساب العميل "${customer.name}" بشكل نهائي؟`,
                                    onConfirm: () => {
                                      setIsProfileModalOpen(false);
                                      deleteCustomer(customer.uid || customer.phone || '');
                                    },
                                    type: 'danger',
                                    confirmText: 'حذف نهائي'
                                  });
                                }} 
                                className="flex items-center gap-3 w-full p-3 text-right text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                                حذف الحساب
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                  {/* Profile Hero Section - More Compact */}
                  <div className="px-6 pb-6 pt-8 border-b border-slate-50 relative overflow-hidden">
                    {/* Subtle Background Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-solar/5 to-transparent pointer-events-none" />
                    
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[2.5rem] bg-white p-1 shadow-xl shadow-solar/10">
                          <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-br from-solar to-solar/80 text-white flex items-center justify-center text-3xl font-bold overflow-hidden">
                            {customer.avatar ? (
                              <img src={customer.avatar || undefined} alt={customer.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(customer.name || customer.phone || '?').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${customer.isBlocked ? 'bg-red-400' : 'bg-emerald-400'}`}>
                          {customer.isBlocked ? <Ban className="w-4 h-4 text-white" /> : <ShieldCheck className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-carbon mb-1">{customer.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-slate-400 font-semibold text-sm" dir="ltr">{customer.phone}</p>
                        <a 
                          href={`tel:${customer.phone}`}
                          className="p-1.5 bg-slate-50 text-slate-400 hover:text-solar hover:bg-solar/5 rounded-lg transition-all active:scale-90"
                          title="اتصال مباشر"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${tier.color.replace('text-', 'text-opacity-90 text-')} flex items-center gap-1 shadow-sm`}>
                          <tier.icon className="w-3 h-3" />
                          {tier.label}
                        </span>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${customer.isBlocked ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'} shadow-sm`}>
                          {customer.isBlocked ? 'حساب محظور' : 'عميل نشط'}
                        </span>
                        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-500 shadow-sm flex items-center gap-1">
                          <History className="w-3 h-3" />
                          {customer.lastActive ? `آخر ظهور: ${new Date(customer.lastActive).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short' })}` : 'آخر ظهور: غير متوفر'}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid - Bento Style */}
                    <div className="grid grid-cols-6 grid-rows-2 gap-2 mt-8 h-44">
                      <div className="col-span-3 row-span-2 bg-slate-50/80 rounded-[2rem] p-4 flex flex-col justify-between transition-all hover:bg-slate-100 group">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Wallet className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-carbon block leading-none mb-1">{formatPrice(customer.walletBalance || 0)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الرصيد الحالي</span>
                        </div>
                      </div>
                      
                      <div className="col-span-3 row-span-1 bg-slate-50/80 rounded-[1.5rem] p-3 flex items-center gap-3 transition-all hover:bg-slate-100 group">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                          <ShoppingBag className="w-4 h-4 text-solar" />
                        </div>
                        <div>
                          <span className="text-lg font-bold text-carbon block leading-none">{userOrders.length}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">طلب</span>
                        </div>
                      </div>

                      <div className="col-span-3 row-span-1 bg-slate-50/80 rounded-[1.5rem] p-3 flex items-center gap-3 transition-all hover:bg-slate-100 group">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:-rotate-12 transition-transform">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-lg font-bold text-carbon block leading-none truncate">{formatPrice(customer.totalSpent || 0)}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">إنفاق</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Navigation - Sticky and Clean */}
                  <div className="bg-white sticky top-0 z-10 px-4 border-b border-slate-50 flex items-center justify-around">
                    {[
                      { id: 'overview', label: 'المعلومات', icon: User },
                      { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
                      { id: 'wallet', label: 'المحفظة', icon: Wallet },
                      { id: 'activity', label: 'النشاط', icon: Activity },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-1 py-3.5 px-2 relative transition-all ${
                          activeTab === tab.id ? 'text-solar' : 'text-slate-400'
                        }`}
                      >
                        <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-105' : ''}`} />
                        <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>{tab.label}</span>
                        {activeTab === tab.id && (
                          <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-solar rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-5">
                    <AnimatePresence mode="wait">
                      {activeTab === 'overview' && (
                        <motion.div 
                          key="overview"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 group transition-all hover:bg-white hover:shadow-md hover:shadow-slate-100">
                              <div className="w-10 h-10 rounded-xl bg-white text-solar flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">العنوان المسجل</span>
                                <p className="text-sm font-semibold text-carbon leading-relaxed">{customer.address || 'لا يوجد عنوان مسجل'}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 group transition-all hover:bg-white hover:shadow-md hover:shadow-slate-100">
                              <div className="w-10 h-10 rounded-xl bg-white text-emerald-500 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">تاريخ التسجيل</span>
                                <p className="text-sm font-semibold text-carbon leading-relaxed">
                                  {new Date(customer.joinDate || Date.now()).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'orders' && (
                        <motion.div 
                          key="orders"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="text"
                              placeholder="بحث في الطلبات..."
                              value={orderSearchTerm}
                              onChange={(e) => setOrderSearchTerm(e.target.value)}
                              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            {filteredOrders.length > 0 ? (
                              filteredOrders.map((order) => (
                                <div key={order.id} className="p-3.5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-50 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-solar transition-all">
                                      <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-carbon text-sm">#{order.id.slice(-6).toUpperCase()}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold">{new Date(order.date).toLocaleDateString('ar-u-nu-latn')}</p>
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <p className="font-bold text-carbon text-sm">{formatPrice(order.total)}</p>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {order.status === 'delivered' ? 'تم التوصيل' : 'قيد التجهيز'}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-16 text-center">
                                <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-slate-400">
                                  {orderSearchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات سابقة'}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'wallet' && (
                        <motion.div 
                          key="wallet"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="p-6 sm:p-8 bg-gradient-to-br from-solar to-solar/90 rounded-[2rem] text-white shadow-lg shadow-solar/20 relative overflow-hidden">
                            <div className="relative z-10">
                              <p className="text-[10px] font-bold text-white/70 mb-1 uppercase tracking-wider">الرصيد المتاح</p>
                              <h3 className="text-3xl sm:text-4xl font-bold mb-6">{formatPrice(customer.walletBalance || 0)}</h3>
                              <div className="flex gap-2">
                                <button onClick={() => { setBalanceAction({ type: 'deposit', customer: customer }); setIsBalanceModalOpen(true); }} className="flex-1 py-3 bg-white text-solar rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                                  <Plus className="w-4 h-4" /> شحن
                                </button>
                                <button onClick={() => { setBalanceAction({ type: 'withdraw', customer: customer }); setIsBalanceModalOpen(true); }} className="flex-1 py-3 bg-black/10 backdrop-blur-sm text-white rounded-xl font-bold text-sm hover:bg-black/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10">
                                  <TrendingDown className="w-4 h-4" /> سحب
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">العمليات الأخيرة</h4>
                              <button className="text-[10px] font-bold text-solar hover:underline">عرض الكل</button>
                            </div>
                            {customer.transactions?.length ? (
                              customer.transactions.slice(0, 5).map((tx, idx) => (
                                <div key={idx} className="p-3.5 bg-white rounded-2xl border border-slate-50 flex items-center justify-between shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                      {tx.type === 'deposit' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <p className="font-bold text-carbon text-xs">{tx.description || (tx.type === 'deposit' ? 'إيداع رصيد' : 'سحب رصيد')}</p>
                                      <p className="text-[9px] text-slate-400 font-semibold">{new Date(tx.date).toLocaleDateString('ar-u-nu-latn')}</p>
                                    </div>
                                  </div>
                                  <p className={`font-bold text-sm ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {tx.type === 'deposit' ? '+' : '-'}{formatPrice(tx.amount)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                                <p className="text-xs font-semibold text-slate-400">لا توجد عمليات مالية</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'activity' && (
                        <motion.div 
                          key="activity"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ملاحظات إدارية</h4>
                          {customer.notes?.length ? (
                            [...customer.notes]
                              .sort((a, b) => (pinnedNotes.includes(b.id) ? 1 : 0) - (pinnedNotes.includes(a.id) ? 1 : 0))
                              .map((note) => (
                                <div key={note.id} className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${pinnedNotes.includes(note.id) ? 'bg-solar/5 border-solar/20' : 'bg-amber-50/30 border-amber-100/50'}`}>
                                  <div className={`absolute top-0 right-0 w-1 h-full ${pinnedNotes.includes(note.id) ? 'bg-solar' : 'bg-amber-400/50'}`} />
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`text-sm font-semibold leading-relaxed ${pinnedNotes.includes(note.id) ? 'text-carbon' : 'text-amber-900'}`}>{note.text}</p>
                                    <button 
                                      onClick={() => {
                                        setPinnedNotes(prev => 
                                          prev.includes(note.id) ? prev.filter(id => id !== note.id) : [...prev, note.id]
                                        );
                                      }}
                                      className={`p-1 rounded-lg transition-all ${pinnedNotes.includes(note.id) ? 'text-solar bg-solar/10' : 'text-slate-300 hover:text-amber-500'}`}
                                    >
                                      <Pin className={`w-3.5 h-3.5 ${pinnedNotes.includes(note.id) ? 'fill-current' : ''}`} />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2 mt-3">
                                    <Calendar className={`w-3 h-3 ${pinnedNotes.includes(note.id) ? 'text-solar/70' : 'text-amber-500/70'}`} />
                                    <p className={`text-[10px] font-bold ${pinnedNotes.includes(note.id) ? 'text-solar/70' : 'text-amber-600/70'}`}>{new Date(note.date).toLocaleDateString('ar-u-nu-latn')}</p>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                              <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                              <p className="text-sm font-semibold text-slate-400">لا توجد ملاحظات إدارية</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Edit Customer Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-carbon flex items-center gap-2">
                    <Edit className="w-6 h-6 text-solar" />
                    تعديل بيانات العميل
                  </h3>
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateCustomer(selectedCustomer.uid || selectedCustomer.phone || '', editCustomerData);
                  setSelectedCustomer(prev => prev ? { ...prev, ...editCustomerData } : null);
                  setIsEditModalOpen(false);
                  showToast('تم تحديث بيانات العميل بنجاح', 'success');
                }} className="space-y-4">
                  <FloatingInput 
                    label="اسم العميل"
                    required
                    value={editCustomerData.name}
                    onChange={(e) => setEditCustomerData({...editCustomerData, name: e.target.value})}
                  />
                  <FloatingInput 
                    label="رقم الهاتف"
                    type="tel"
                    required
                    value={editCustomerData.phone}
                    onChange={(e) => setEditCustomerData({...editCustomerData, phone: e.target.value})}
                    dir="ltr"
                  />
                  <FloatingInput 
                    label="العنوان"
                    value={editCustomerData.address}
                    onChange={(e) => setEditCustomerData({...editCustomerData, address: e.target.value})}
                  />

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="submit"
                      className="flex-1 bg-carbon text-white py-3 rounded-xl font-bold hover:bg-carbon/90 transition-all shadow-lg shadow-carbon/20"
                    >
                      حفظ التعديلات
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-carbon flex items-center gap-2">
                    <Lock className="w-6 h-6 text-blue-500" />
                    تغيير كلمة المرور
                  </h3>
                  <button 
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateCustomer(selectedCustomer.uid || selectedCustomer.phone || '', { password: newPassword });
                  setIsPasswordModalOpen(false);
                  setNewPassword('');
                  showToast('تم تغيير كلمة المرور بنجاح', 'success');
                }} className="space-y-4">
                  <FloatingInput 
                    label="كلمة المرور الجديدة"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة..."
                  />

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                      حفظ التغيير
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Balance Update Modal */}
      <AnimatePresence>
        {isBalanceModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBalanceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className={`p-6 text-white ${balanceAction.type === 'deposit' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black">
                    {balanceAction.type === 'deposit' ? 'شحن رصيد العميل' : 'سحب رصيد من العميل'}
                  </h3>
                  <button 
                    onClick={() => setIsBalanceModalOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                    {(balanceAction.customer?.name || balanceAction.customer?.phone || '?').charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{balanceAction.customer?.name}</p>
                    <p className="text-sm opacity-80" dir="ltr">{balanceAction.customer?.phone}</p>
                  </div>
                </div>
              </div>

                <form onSubmit={handleUpdateBalance} className="p-6 space-y-4">
                  <div className="relative">
                    <FloatingInput 
                      label="المبلغ"
                      type="number"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="text-left"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold z-10 pointer-events-none">
                      {settings.currency}
                    </div>
                  </div>

                  <FloatingInput 
                    label="ملاحظات (اختياري)"
                    isTextArea
                    value={balanceDescription}
                    onChange={(e) => setBalanceDescription(e.target.value)}
                    placeholder="مثلاً: دفعة نقدية، استرجاع مبلغ..."
                  />

                  <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBalanceModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-lg ${
                      balanceAction.type === 'deposit' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                        : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                    }`}
                  >
                    تأكيد العملية
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl lg:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col mt-auto sm:mt-0"
            >
              <div className="p-4 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-bg-general shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-sm">
                    <UserPlus className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-black text-carbon">إضافة عميل جديد</h2>
                    <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">قم بتعبئة بيانات العميل بدقة واحترافية</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 sm:p-3 hover:bg-white rounded-xl sm:rounded-2xl transition-all text-slate-400 hover:text-carbon border border-transparent hover:border-gray-100"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                  {/* Basic Info Section */}
                  <div className="space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-carbon uppercase tracking-widest">البيانات الشخصية</h3>
                    </div>
                    
                    <div className="space-y-4 sm:space-y-5">
                      <FloatingInput 
                        label="الاسم الكامل للعميل"
                        required
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        placeholder="مثال: محمد أحمد علي"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingInput 
                          label="رقم الهاتف (الواتساب)"
                          type="tel"
                          required
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                          placeholder="777..."
                          dir="ltr"
                        />
                        <div className="relative">
                          <FloatingInput 
                            label="كلمة المرور"
                            type={showPassword ? "text" : "password"}
                            required
                            value={newCustomer.password}
                            onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                            placeholder="••••••••"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-solar transition-colors z-10"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 sm:pt-4 pb-2 border-b border-gray-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-carbon uppercase tracking-widest">العنوان والموقع</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FloatingInput 
                        label="المدينة"
                        value={newCustomer.city}
                        onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                        placeholder="مثال: صنعاء"
                      />
                      <FloatingInput 
                        label="العنوان بالتفصيل"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                        placeholder="الحي، الشارع، المعلم..."
                      />
                    </div>
                  </div>

                  {/* Financial & Admin Section */}
                  <div className="space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-carbon uppercase tracking-widest">البيانات المالية</h3>
                    </div>

                    <FloatingInput 
                      label="الرصيد الافتتاحي"
                      type="number"
                      value={newCustomer.balance}
                      onChange={(e) => setNewCustomer({...newCustomer, balance: Number(e.target.value)})}
                      placeholder="0.00"
                    />

                    <div className="flex items-center gap-3 pt-2 sm:pt-4 pb-2 border-b border-gray-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-carbon uppercase tracking-widest">ملاحظات إدارية</h3>
                    </div>

                    <FloatingInput 
                      label="ملاحظات خاصة (للمدراء فقط)"
                      isTextArea
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                      placeholder="أضف أي ملاحظات إضافية حول العميل، تفضيلاته، أو تاريخ التعامل معه..."
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3.5 sm:py-4 bg-bg-general text-carbon font-black rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 active:scale-95 text-sm sm:text-base"
                  >
                    إلغاء العملية
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-3.5 sm:py-4 bg-carbon text-white font-black rounded-xl sm:rounded-2xl hover:bg-carbon/90 transition-all shadow-xl shadow-carbon/20 border border-white/10 flex items-center justify-center gap-3 active:scale-95 group text-sm sm:text-base"
                  >
                    <span>إضافة العميل</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Send Notification Modal */}
        {isNotificationModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden"
            >
              <button 
                onClick={() => setIsNotificationModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-carbon mb-2">إرسال إشعار</h2>
                <p className="text-sm text-gray-500 font-bold">سيصل هذا الإشعار إلى صفحة إشعارات العميل {selectedCustomer.name}</p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <FloatingInput 
                  label="عنوان الإشعار"
                  required
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                  placeholder="مثال: خصم خاص لك!"
                />
                <FloatingInput 
                  label="نص الإشعار"
                  isTextArea
                  required
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                  placeholder="اكتب رسالتك هنا..."
                />
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">نوع الإشعار</label>
                  <select
                    value={notificationData.type}
                    onChange={(e) => setNotificationData({...notificationData, type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-bg-general border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold text-carbon transition-all"
                  >
                    <option value="system">إشعار نظام</option>
                    <option value="sms">رسالة SMS نصية</option>
                    <option value="sale">عرض ترويجي</option>
                    <option value="order">تحديث طلب</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-carbon font-black rounded-xl hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    إرسال الإشعار
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Send SMS Modal */}
        {isSmsModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSmsModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 sm:p-8 overflow-hidden"
            >
              <button 
                onClick={() => setIsSmsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-carbon mb-2">إرسال رسالة نصية SMS</h2>
                <p className="text-sm text-gray-500 font-bold" dir="ltr">{selectedCustomer.phone}</p>
              </div>

              <form onSubmit={handleSendSms} className="space-y-4">
                <div className="relative">
                  <FloatingInput 
                    label="نص الرسالة"
                    isTextArea
                    required
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="اكتب رسالتك النصية هنا..."
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold text-left" dir="ltr">
                    {smsMessage.length} / 160 characters
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsSmsModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-carbon font-black rounded-xl hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    disabled={isSendingSms}
                    className="flex-[2] py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSendingSms ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      'إرسال SMS'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
        />
      </AnimatePresence>
    </motion.div>
  );
}
