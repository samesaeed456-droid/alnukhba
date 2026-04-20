import React, { useState, useMemo } from 'react';
import { 
  Search, Users, User, Mail, Phone, MapPin, 
  Calendar, ShoppingBag, DollarSign, 
  MoreVertical, Edit, Trash2, ExternalLink,
  Filter, Plus, Star, ShieldCheck,
  TrendingUp, ArrowUpDown, X, Printer, MessageSquare, PhoneCall,
  Eye, EyeOff, Lock, BarChart3, Package, ChevronRight, TrendingDown, ArrowLeft, ArrowRight,
  AlertCircle, ListFilter, Grid, UserPlus, Wallet, Activity, Download, Bell, Pin,
  Ban, UserCheck, Zap, History, Info, Send
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
  const { customers, orders, formatPrice, addCustomer, deleteCustomer, updateCustomerBalance, updateCustomer, blockCustomer, showToast, settings, setNotifications, logActivity } = useStore();
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
    
    const appNotif = {
      id: crypto.randomUUID(),
      title: notificationData.title,
      message: notificationData.message,
      date: new Date().toISOString(),
      isRead: false,
      type: notificationData.type === 'sms' ? 'system' : notificationData.type,
      userId: selectedCustomer.phone // Link to customer
    };
    
    setNotifications(prev => [appNotif, ...prev]);

    // If type is SMS, send real SMS
    if (notificationData.type === 'sms') {
      try {
        const result = await smsService.sendSingle(
          selectedCustomer.phone,
          `${notificationData.title}\n${notificationData.message}`
        );
        
        if (result.success) {
          showToast('تم إرسال إشعار SMS للعميل بنجاح', 'success');
        } else {
          showToast(`فشل إرسال SMS: ${result.error}`, 'error');
        }
      } catch (err) {
        showToast('فشل الاتصال بخدمة الرسائل', 'error');
      }
    } else {
      showToast('تم إرسال الإشعار للعميل بنجاح', 'success');
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
      className="w-full pb-32 bg-white min-h-screen relative font-sans pt-4 sm:pt-8" 
      dir="rtl"
    >
      {/* Page Title Section */}
      <div className="px-4 sm:px-8 lg:px-12 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[24px] bg-carbon text-solar flex items-center justify-center border border-titanium/20 shadow-2xl shadow-carbon/20">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-carbon tracking-tightest">إدارة العملاء</h1>
            <p className="text-xs font-black text-titanium/40 uppercase tracking-widest mt-1">التحكم الكامل بقاعدة بيانات النخبة</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-3 bg-white text-carbon px-6 py-4 rounded-2xl font-black hover:bg-carbon hover:text-solar transition-all shadow-sm active:scale-95 border border-titanium/10 group"
          >
            <Download className="w-5 h-5 text-solar group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em] hidden sm:inline">تصدير قاعدة البيانات</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-carbon text-solar px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-2xl shadow-carbon/40 active:scale-95 border border-titanium/20 group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em]">إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-4 sm:px-8 lg:px-12 mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Total Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-carbon/5 p-6 sm:p-8 rounded-[40px] border border-titanium/5 flex flex-col items-center sm:items-start text-center sm:text-right group hover:bg-white hover:shadow-2xl hover:shadow-carbon/5 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-solar/5 rounded-full blur-3xl group-hover:bg-solar/10 transition-colors" />
            <div className="flex justify-between items-start w-full mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-carbon text-solar flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-carbon/20">
                <Users className="w-7 h-7" />
              </div>
            </div>
            <div className="w-full relative z-10">
              <span className="text-titanium/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] block mb-2">إجمالي العملاء</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-2xl sm:text-3xl font-black text-carbon tracking-tighter">{stats.total}</span>
                <span className="text-[10px] font-black text-titanium/40 uppercase tracking-widest">عميل</span>
              </div>
            </div>
          </motion.div>

          {/* Active Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-carbon/5 p-6 sm:p-8 rounded-[40px] border border-titanium/5 flex flex-col items-center sm:items-start text-center sm:text-right group hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex justify-between items-start w-full mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-7 h-7" />
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-widest uppercase shadow-sm">
                <span>نشط</span>
              </div>
            </div>
            <div className="w-full relative z-10">
              <span className="text-titanium/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] block mb-2">النشاط الشهري</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-2xl sm:text-3xl font-black text-carbon tracking-tighter">{stats.activeThisMonth}</span>
                <span className="text-[10px] font-black text-titanium/40 uppercase tracking-widest">نشط الآن</span>
              </div>
            </div>
          </motion.div>

          {/* New Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-carbon/5 p-6 sm:p-8 rounded-[40px] border border-titanium/5 flex flex-col items-center sm:items-start text-center sm:text-right group hover:bg-white hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex justify-between items-start w-full mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <UserPlus className="w-7 h-7" />
              </div>
            </div>
            <div className="w-full relative z-10">
              <span className="text-titanium/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] block mb-2">انضمام جديد</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-2xl sm:text-3xl font-black text-carbon tracking-tighter">{stats.newThisMonth}</span>
                <span className="text-[10px] font-black text-titanium/40 uppercase tracking-widest">هذا الشهر</span>
              </div>
            </div>
          </motion.div>

          {/* Average LTV */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-carbon/5 p-6 sm:p-8 rounded-[40px] border border-titanium/5 flex flex-col items-center sm:items-start text-center sm:text-right group hover:bg-white hover:shadow-2xl hover:shadow-solar/5 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-solar/5 rounded-full blur-3xl group-hover:bg-solar/10 transition-colors" />
            <div className="flex justify-between items-start w-full mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-solar flex items-center justify-center text-carbon group-hover:scale-110 transition-transform duration-500 shadow-gold">
                <Wallet className="w-7 h-7" />
              </div>
            </div>
            <div className="w-full relative z-10">
              <span className="text-titanium/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] block mb-2">متوسط القيم</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-2xl sm:text-3xl font-black text-carbon tracking-tighter">{formatPrice(stats.avgLTV)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Filters - Categories Style */}
      <div className="px-4 sm:px-8 lg:px-12 mb-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-carbon flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-solar flex items-center justify-center text-carbon shadow-gold">
              <ListFilter className="w-6 h-6" />
            </div>
            <span>تصنيفات النخبة</span>
          </h2>
        </div>
        <div className="flex overflow-x-auto gap-6 no-scrollbar pb-6 pt-2">
          {[
            { label: 'الكل', count: stats.total, icon: Grid, color: 'text-solar', bg: 'bg-carbon/5', activeBg: 'bg-carbon', status: 'الكل' },
            { label: 'نشط', count: stats.activeThisMonth, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/5', activeBg: 'bg-emerald-500', status: 'نشط' },
            { label: 'غير نشط', count: stats.inactiveCount, icon: TrendingDown, color: 'text-titanium/40', bg: 'bg-carbon/5', activeBg: 'bg-titanium/40', status: 'غير نشط' },
            { label: 'جديد', count: customerMetrics.filter(c => c.orderCount <= 1).length, icon: Star, color: 'text-blue-500', bg: 'bg-blue-500/5', activeBg: 'bg-blue-500', status: 'جديد' },
          ].map((item, idx) => (
            <motion.button 
              key={idx} 
              whileHover={{ y: -8, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(item.status)}
              className={`flex flex-col items-center justify-center min-w-[130px] p-6 rounded-[32px] border-2 transition-all duration-500 relative overflow-hidden group shadow-sm ${
                statusFilter === item.status 
                  ? `border-transparent ${item.activeBg} shadow-2xl shadow-carbon/20` 
                  : `border-titanium/5 ${item.bg} hover:border-solar/30`
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                statusFilter === item.status ? 'bg-white/10 text-solar' : `bg-white ${item.color} shadow-sm border border-titanium/5`
              }`}>
                <item.icon className="w-7 h-7" />
              </div>
              <span className={`text-sm font-black mb-2 tracking-tighter ${statusFilter === item.status ? 'text-solar' : 'text-carbon'}`}>
                {item.label}
              </span>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                statusFilter === item.status ? 'bg-white/10 text-solar/80' : 'bg-carbon/5 text-titanium/40'
              }`}>
                {item.count} عميل
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="px-4 sm:px-8 lg:px-12 mb-10">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-solar transition-transform group-focus-within:scale-110 group-focus-within:text-carbon" />
            <input 
              type="text"
              placeholder="البحث بالاسم، رقم الهاتف، أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-carbon/5 border-2 border-transparent focus:border-solar/30 rounded-[24px] py-5 pr-16 pl-6 text-base font-black text-carbon placeholder:text-titanium/20 focus:ring-8 focus:ring-solar/10 transition-all shadow-inner text-right"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <ListFilter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-solar pointer-events-none" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pr-12 pl-10 py-5 bg-white border border-titanium/10 rounded-[24px] text-carbon font-black text-sm focus:outline-none focus:ring-8 focus:ring-solar/5 transition-all shadow-sm appearance-none min-w-[200px] cursor-pointer hover:border-solar/30"
              >
                <option value="name">ترتيب بالأبجدية</option>
                <option value="orders">عدد الطلبات</option>
                <option value="spent">إجمالي الإنفاق</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-titanium/40">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-5 bg-white border border-titanium/10 rounded-[24px] text-carbon hover:bg-carbon hover:text-solar transition-all shadow-sm shrink-0 active:scale-95 group"
            >
              <ArrowUpDown className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="px-4 sm:px-8 lg:px-12">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center bg-carbon/5 rounded-[48px] border border-titanium/5 shadow-inner"
            >
              <div className="w-28 h-28 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-titanium/10 shadow-sm backdrop-blur-xl">
                <Users className="w-14 h-14 text-titanium/20" />
              </div>
              <p className="text-carbon/40 font-black text-xl tracking-tighter">لم نعثر على أي عملاء تطابق معايير النخبة</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
            >
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.uid || customer.phone || index}
                  layout
                  variants={itemVariants}
                  onClick={() => handleViewProfile(customer)}
                  className="bg-white border border-titanium/5 rounded-[48px] p-6 sm:p-8 transition-all duration-700 flex flex-col group relative shadow-sm hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] hover:border-solar/40 hover:-translate-y-3 overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-6 left-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
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
                      className="w-10 h-10 bg-white/95 backdrop-blur-xl text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl border border-rose-100 flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Decorative Background Element */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-solar/5 rounded-full blur-[80px] group-hover:bg-solar/15 transition-all duration-700" />

                  {/* Customer Info */}
                  <div className="flex items-center gap-6 mb-8 relative z-10">
                    <div className="w-20 h-20 rounded-[30px] bg-carbon p-1 shadow-2xl shadow-carbon/20 group-hover:scale-110 transition-transform duration-700 relative overflow-hidden border border-titanium/20">
                      {customer.avatar ? (
                        <img 
                          src={customer.avatar || undefined} 
                          alt={customer.name} 
                          className="w-full h-full object-cover rounded-[25px] absolute inset-0 z-10" 
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-solar bg-carbon uppercase tracking-tighter">
                        {(customer.name || customer.phone || '?').charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-carbon truncate tracking-tighter mb-1.5">{customer.name}</h3>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const lastOrderDate = customer.lastOrder ? new Date(customer.lastOrder) : null;
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          const isActive = lastOrderDate ? lastOrderDate >= thirtyDaysAgo : false;
                          
                          return isActive ? (
                            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">نشط بالنخبة</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-titanium/5 px-3 py-1 rounded-full border border-titanium/10">
                              <div className="w-2 h-2 rounded-full bg-titanium/30" />
                              <span className="text-[10px] font-black text-titanium/40 uppercase tracking-[0.1em]">سكون مؤقت</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-4 mb-8 relative z-10">
                    <div className="flex items-center gap-4 text-sm bg-carbon/5 p-4 rounded-3xl border border-titanium/5 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white text-solar flex items-center justify-center shrink-0 shadow-sm border border-titanium/5">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="text-carbon font-black tracking-tight" dir="ltr">{customer.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <a 
                        href={`https://wa.me/${customer.phone.replace(/\s+/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 group/btn"
                      >
                        <MessageSquare className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                        واتساب
                      </a>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(customer);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-carbon text-solar rounded-2xl text-xs font-black hover:bg-black transition-all shadow-xl shadow-carbon/20 group/btn border border-titanium/10"
                      >
                        <User className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        الملف الكامل
                      </button>
                    </div>
                    
                    {customer.lastOrder && (
                      <div className="flex items-center gap-3 px-2">
                        <Calendar className="w-4 h-4 text-titanium/20" />
                        <span className="text-[11px] text-titanium/40 font-black uppercase tracking-widest">
                          تاريخ آخر عملية: {new Date(customer.lastOrder).toLocaleDateString('ar-u-nu-latn')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-8 border-t border-titanium/10 relative z-10 mt-auto">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-titanium/20 uppercase tracking-widest block mb-1">الطلبات</span>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-solar/10 flex items-center justify-center text-solar">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="text-lg font-black text-carbon tracking-tighter">{customer.orderCount || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-titanium/20 uppercase tracking-widest block mb-1">المحفظة</span>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <span className="text-lg font-black text-carbon tracking-tighter">{formatPrice(customer.walletBalance || 0)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-titanium/20 uppercase tracking-widest block mb-1">إجمالي</span>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-lg font-black text-carbon tracking-tighter">{formatPrice(customer.totalSpent || 0)}</span>
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
          const userOrders = orders.filter(o => o.userId === customer.name || o.customerPhone === customer.phone);
          
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
                className="absolute inset-0 bg-carbon/60 backdrop-blur-md hidden sm:block"
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
                className="relative bg-white w-full sm:max-w-2xl lg:max-w-4xl h-full sm:h-[90vh] sm:rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col sm:m-4"
              >
                {/* Header / Top Bar */}
                <div className="bg-white/80 backdrop-blur-3xl px-6 py-4 sm:px-10 sm:py-6 flex items-center justify-between border-b border-titanium/10 shrink-0 sticky top-0 z-30">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsProfileModalOpen(false)}
                      className="p-3 -mr-2 text-carbon hover:bg-carbon hover:text-solar rounded-2xl transition-all shadow-sm group"
                    >
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="text-right">
                      <h2 className="text-lg sm:text-xl font-black text-carbon tracking-tighter">ملف عميل النخبة</h2>
                      <p className="text-[10px] font-black text-titanium/40 uppercase tracking-widest mt-0.5">تفاصيل العضوية المتميزة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                      className="w-12 h-12 bg-carbon text-solar flex items-center justify-center rounded-2xl shadow-xl shadow-carbon/20 hover:scale-105 active:scale-95 transition-all relative border border-titanium/20"
                    >
                      <MoreVertical className="w-6 h-6" />
                      <AnimatePresence>
                        {isActionMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); }} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10, originX: 'left', originY: 'top' }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className="absolute left-0 top-full mt-3 w-64 bg-white rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-titanium/10 overflow-hidden z-50 p-3"
                            >
                              <button onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); setEditCustomerData({ name: customer.name, phone: customer.phone, address: customer.address || '' }); setIsEditModalOpen(true); }} className="flex items-center gap-4 w-full p-4 text-right text-sm font-black text-carbon hover:bg-carbon hover:text-solar rounded-[20px] transition-all group"><Edit className="w-5 h-5 text-solar group-hover:scale-110 transition-transform" />تعديل البيانات</button>
                              <button onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); setIsPasswordModalOpen(true); }} className="flex items-center gap-4 w-full p-4 text-right text-sm font-black text-carbon hover:bg-carbon hover:text-solar rounded-[20px] transition-all group"><Lock className="w-5 h-5 text-solar group-hover:scale-110 transition-transform" />كلمة المرور</button>
                              <button onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); setIsNotificationModalOpen(true); }} className="flex items-center gap-4 w-full p-4 text-right text-sm font-black text-carbon hover:bg-carbon hover:text-solar rounded-[20px] transition-all group"><Bell className="w-5 h-5 text-solar group-hover:rotate-12 transition-transform" />إرسال إشعار</button>
                              
                              <div className="h-px bg-titanium/5 my-2 mx-4" />
                              
                              <a 
                                href={`https://wa.me/${customer.phone.replace(/\s+/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); }}
                                className="flex items-center gap-4 w-full p-4 text-right text-sm font-black text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-[20px] transition-all"
                              >
                                <MessageSquare className="w-5 h-5" />
                                مراسلة واتساب
                              </a>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(false); handleSendReminder(customer); }} 
                                className="flex items-center gap-4 w-full p-4 text-right text-sm font-black text-solar hover:bg-carbon rounded-[20px] transition-all group"
                              >
                                <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                إرسال تذكير
                              </button>

                              <div className="h-px bg-titanium/5 my-2 mx-4" />
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation();
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
                                className={`flex items-center gap-4 w-full p-4 text-right text-sm font-black rounded-[20px] transition-all ${customer.isBlocked ? 'text-emerald-600 hover:bg-emerald-500 hover:text-white' : 'text-amber-600 hover:bg-amber-500 hover:text-white'}`}
                              >
                                {customer.isBlocked ? <UserCheck className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                {customer.isBlocked ? 'تفعيل الحساب' : 'حظر العضوية'}
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation();
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
                                className="flex items-center gap-4 w-full p-4 text-right text-sm font-black text-red-600 hover:bg-red-500 hover:text-white rounded-[20px] transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                                حذف نهائي
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                  {/* Profile Hero Section */}
                  <div className="px-8 pb-10 pt-12 relative overflow-hidden text-right border-b border-titanium/5">
                    {/* Artistic Background Text */}
                    <div className="absolute -top-10 -left-10 text-[180px] font-black text-carbon/[0.03] select-none pointer-events-none uppercase tracking-tighter mix-blend-darken rotate-6">
                      Elite
                    </div>
                    
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="relative mb-8 group">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[48px] bg-carbon p-1.5 shadow-[0_32px_64px_rgba(0,0,0,0.3)] relative overflow-hidden border border-titanium/20">
                          <div className="w-full h-full rounded-[42px] bg-gradient-to-br from-carbon to-black text-solar flex items-center justify-center text-5xl font-black overflow-hidden relative">
                            {customer.avatar ? (
                              <img 
                                src={customer.avatar || undefined} 
                                alt={customer.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span>{(customer.name || customer.phone || '?').charAt(0)}</span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 text-[10px] text-solar font-black uppercase tracking-widest">
                               عضوية النخبة
                            </div>
                          </div>
                        </div>
                        <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-[20px] border-4 border-white flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 ${customer.isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                          {customer.isBlocked ? <Ban className="w-6 h-6 text-white" /> : <ShieldCheck className="w-6 h-6 text-white" />}
                        </div>
                      </div>
                      
                      <div className="max-w-xl">
                        <h3 className="text-3xl font-black text-carbon mb-2 tracking-tighter">{customer.name}</h3>
                        <div className="flex items-center justify-center gap-4 mb-8">
                          <p className="text-titanium/40 font-black text-lg tracking-widest" dir="ltr">{customer.phone}</p>
                          <a 
                            href={`tel:${customer.phone}`}
                            className="w-10 h-10 bg-carbon text-solar hover:bg-black rounded-xl transition-all shadow-lg shadow-carbon/20 flex items-center justify-center active:scale-90"
                            title="اتصال مباشر"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </a>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <span className={`${tier.color} text-[10px] font-black px-5 py-2.5 rounded-full flex items-center gap-2 shadow-2xl shadow-carbon/10 border border-titanium/5 uppercase tracking-widest`}>
                            <tier.icon className="w-4 h-4" />
                            مستوى: {tier.label}
                          </span>
                          <span className={`text-[10px] font-black px-5 py-2.5 rounded-full border ${customer.isBlocked ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'} shadow-2xl shadow-black/5 uppercase tracking-widest`}>
                            {customer.isBlocked ? 'عضوية محظورة' : 'حساب نشط'}
                          </span>
                          <span className="text-[10px] font-black px-5 py-2.5 rounded-full bg-carbon/5 text-carbon/40 border border-titanium/5 shadow-2xl shadow-black/5 flex items-center gap-2 uppercase tracking-widest">
                            <History className="w-4 h-4 text-solar" />
                            {customer.lastActive ? `آخر إطلالة: ${new Date(customer.lastActive).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'لم يتم التسجيل بعد'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid - Luxury Bento */}
                    <div className="grid grid-cols-6 grid-rows-2 gap-4 mt-12 h-56 max-w-4xl mx-auto">
                      <div className="col-span-3 row-span-2 bg-carbon rounded-[40px] p-8 flex flex-col justify-between group relative overflow-hidden shadow-2xl shadow-carbon/30 border border-titanium/20 transition-all hover:scale-[1.02]">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-solar/10 rounded-full blur-[60px]" />
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform relative z-10 ring-1 ring-white/10">
                          <Wallet className="w-7 h-7 text-solar" />
                        </div>
                        <div className="relative z-10">
                          <span className="text-4xl font-black text-solar block leading-none mb-3 tracking-tighter">{formatPrice(customer.walletBalance || 0)}</span>
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">الرصيد المتاح للنخبة</span>
                        </div>
                      </div>
                      
                      <div className="col-span-3 row-span-1 bg-white rounded-[32px] p-6 flex items-center gap-6 transition-all hover:bg-carbon/5 border border-titanium/5 group shadow-xl shadow-black/5">
                        <div className="w-12 h-12 bg-carbon text-solar rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform border border-titanium/10">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-2xl font-black text-carbon block leading-none tracking-tight">{userOrders.length}</span>
                          <span className="text-[10px] font-black text-titanium/40 uppercase tracking-widest">عملية شراء</span>
                        </div>
                      </div>

                      <div className="col-span-3 row-span-1 bg-white rounded-[32px] p-6 flex items-center gap-6 transition-all hover:bg-carbon/5 border border-titanium/5 group shadow-xl shadow-black/5">
                        <div className="w-12 h-12 bg-solar text-carbon rounded-2xl flex items-center justify-center shadow-gold group-hover:-rotate-12 transition-transform">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-2xl font-black text-carbon block leading-none truncate tracking-tight">{formatPrice(customer.totalSpent || 0)}</span>
                          <span className="text-[10px] font-black text-titanium/40 uppercase tracking-widest">إجمالي الإنفاق</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Navigation - Premium Style */}
                  <div className="bg-white/80 backdrop-blur-3xl sticky top-0 z-30 px-6 border-b border-titanium/10 flex items-center justify-around">
                    {[
                      { id: 'overview', label: 'المعلومات', icon: User },
                      { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
                      { id: 'wallet', label: 'تمويل النخبة', icon: Wallet },
                      { id: 'activity', label: 'سجل النشاط', icon: Activity },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-2 py-5 px-4 relative transition-all group ${
                          activeTab === tab.id ? 'text-carbon' : 'text-titanium/40 hover:text-carbon'
                        }`}
                      >
                        <tab.icon className={`w-6 h-6 transition-all duration-500 ${activeTab === tab.id ? 'scale-110 rotate-3' : 'group-hover:scale-105'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
                        {activeTab === tab.id && (
                          <motion.div 
                            layoutId="activeTabProfile" 
                            className="absolute bottom-0 left-0 right-0 h-1 bg-solar rounded-t-full shadow-[0_0_12px_rgba(191,167,93,0.8)]" 
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content with padding */}
                  <div className="p-8 sm:p-12 mb-12">
                    <AnimatePresence mode="wait">
                      {activeTab === 'overview' && (
                        <motion.div 
                          key="overview"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6 text-right max-w-3xl mx-auto"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-6 p-8 bg-carbon rounded-[40px] border border-titanium/10 group transition-all hover:bg-black shadow-2xl shadow-carbon/20">
                              <div className="w-14 h-14 rounded-2xl bg-white/5 text-solar flex items-center justify-center shrink-0 shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                                <MapPin className="w-7 h-7" />
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] font-black text-white/30 uppercase block mb-2 tracking-[0.3em]">موقع العميل المعتمد</span>
                                <p className="text-base font-black text-white leading-relaxed">{customer.address || 'لم يتم تسجيل موقع حالياً'}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-6 p-8 bg-white rounded-[40px] border border-titanium/10 group transition-all hover:border-solar/30 shadow-xl shadow-black/[0.03]">
                              <div className="w-14 h-14 rounded-2xl bg-carbon text-solar flex items-center justify-center shrink-0 shadow-2xl shadow-carbon/20 group-hover:rotate-6 transition-transform">
                                <Calendar className="w-7 h-7" />
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] font-black text-titanium/40 uppercase block mb-2 tracking-[0.3em]">تاريخ عضوية النخبة</span>
                                <p className="text-base font-black text-carbon leading-relaxed">
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
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8 text-right max-w-4xl mx-auto"
                        >
                          <div className="relative group">
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-solar group-focus-within:scale-110 transition-transform" />
                            <input 
                              type="text"
                              placeholder="البحث في سجل العمليات..."
                              value={orderSearchTerm}
                              onChange={(e) => setOrderSearchTerm(e.target.value)}
                              className="w-full pr-16 pl-6 py-5 bg-carbon/5 border-2 border-transparent focus:border-solar/30 rounded-[24px] text-base font-black text-carbon focus:ring-8 focus:ring-solar/5 transition-all text-right"
                            />
                          </div>

                          <div className="space-y-4">
                            {filteredOrders.length > 0 ? (
                              filteredOrders.map((order) => (
                                <motion.div 
                                  key={order.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-6 bg-white rounded-[32px] border border-titanium/5 flex items-center justify-between group hover:border-solar transition-all shadow-xl shadow-black/[0.02]"
                                >
                                  <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-carbon text-solar rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-titanium/10">
                                      <Package className="w-7 h-7" />
                                    </div>
                                    <div>
                                      <p className="font-black text-carbon text-lg tracking-tighter">#{order.id.slice(-8).toUpperCase()}</p>
                                      <p className="text-[10px] text-titanium/40 font-black uppercase tracking-widest mt-0.5">{new Date(order.date).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <p className="font-black text-carbon text-xl mb-1 tracking-tight">{formatPrice(order.total)}</p>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                                      {order.status === 'delivered' ? 'تم الوصول' : 'قيد التجهيز'}
                                    </span>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="py-24 text-center bg-carbon/5 rounded-[48px] border border-titanium/5">
                                <ShoppingBag className="w-16 h-16 text-titanium/10 mx-auto mb-6" />
                                <p className="text-lg font-black text-titanium/40 tracking-tighter">
                                  {orderSearchTerm ? 'لا توجد نتائج مطابقة لبحث في سجل النخبة' : 'لا توجد طلبات سابقة لهذا العميل'}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'wallet' && (
                        <motion.div 
                          key="wallet"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-12 text-right max-w-2xl mx-auto"
                        >
                          <div className="p-10 bg-carbon rounded-[48px] text-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                            <div className="absolute -top-12 -right-12 w-64 h-64 bg-solar/10 rounded-full blur-[80px]" />
                            <div className="relative z-10">
                              <p className="text-[11px] font-black text-solar uppercase tracking-[0.4em] mb-4"> الرصيد الملكي المتاح</p>
                              <h3 className="text-5xl sm:text-6xl font-black mb-10 tracking-tighter shadow-sm">{formatPrice(customer.walletBalance || 0)}</h3>
                              <div className="flex gap-4">
                                <button onClick={() => { setBalanceAction({ type: 'deposit', customer: customer }); setIsBalanceModalOpen(true); }} className="flex-1 py-5 bg-solar text-carbon rounded-2xl font-black text-sm shadow-gold hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-3 group/btn">
                                  <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" /> إيداع رصيد
                                </button>
                                <button onClick={() => { setBalanceAction({ type: 'withdraw', customer: customer }); setIsBalanceModalOpen(true); }} className="flex-1 py-5 bg-white/5 backdrop-blur-xl text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-3 border border-white/10 group/btn">
                                  <TrendingDown className="w-5 h-5 group-hover/btn:translate-y-1 transition-transform" /> سحب رصيد
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                              <h4 className="text-[10px] font-black text-titanium/40 uppercase tracking-[0.3em]">سجل العمليات المالية للنخبة</h4>
                              <button className="text-[10px] font-black text-solar hover:underline tracking-widest">تحميل التقرير الكامل</button>
                            </div>
                            {customer.transactions?.length ? (
                              <div className="space-y-3">
                                {customer.transactions.slice(0, 5).map((tx, idx) => (
                                  <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 bg-white rounded-3xl border border-titanium/5 flex items-center justify-between shadow-xl shadow-black/[0.02] group"
                                  >
                                    <div className="flex items-center gap-5">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                        {tx.type === 'deposit' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                      </div>
                                      <div>
                                        <p className="font-black text-carbon text-sm tracking-tight">{tx.description || (tx.type === 'deposit' ? 'إيداع رصيد ملكي' : 'سحب من المحفظة')}</p>
                                        <p className="text-[10px] text-titanium/40 font-black uppercase mt-0.5 tracking-widest">{new Date(tx.date).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short' })}</p>
                                      </div>
                                    </div>
                                    <p className={`font-black text-lg tracking-tight ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {tx.type === 'deposit' ? '+' : '-'}{formatPrice(tx.amount)}
                                    </p>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-20 text-center bg-carbon/5 rounded-[40px] border border-dashed border-titanium/20">
                                <Wallet className="w-12 h-12 text-titanium/10 mx-auto mb-4" />
                                <p className="text-sm font-black text-titanium/40 tracking-widest">لا توجد عمليات مالية مسجلة للنخبة</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'activity' && (
                        <motion.div 
                          key="activity"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6 text-right max-w-2xl mx-auto"
                        >
                          <div className="flex items-center justify-between px-2 mb-2">
                             <h4 className="text-[10px] font-black text-titanium/40 uppercase tracking-[0.3em]">الملاحظات السرية والإدارية</h4>
                             <div className="w-8 h-8 rounded-full bg-solar/10 flex items-center justify-center text-solar">
                                <History className="w-4 h-4" />
                             </div>
                          </div>
                          {customer.notes?.length ? (
                            <div className="space-y-4">
                              {[...customer.notes]
                                .sort((a, b) => (pinnedNotes.includes(b.id) ? 1 : 0) - (pinnedNotes.includes(a.id) ? 1 : 0))
                                .map((note) => (
                                  <motion.div 
                                    key={note.id} 
                                    layout
                                    className={`p-6 rounded-[32px] border-2 relative overflow-hidden transition-all duration-500 shadow-xl ${pinnedNotes.includes(note.id) ? 'bg-carbon text-white border-solar shadow-solar/20' : 'bg-white border-titanium/5 hover:border-solar/30 shadow-black/[0.02]'}`}
                                  >
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                      <p className={`text-base font-black leading-relaxed ${pinnedNotes.includes(note.id) ? 'text-solar' : 'text-carbon'}`}>{note.text}</p>
                                      <button 
                                        onClick={() => {
                                          setPinnedNotes(prev => 
                                            prev.includes(note.id) ? prev.filter(id => id !== note.id) : [...prev, note.id]
                                          );
                                        }}
                                        className={`p-2.5 rounded-xl transition-all shadow-sm ${pinnedNotes.includes(note.id) ? 'bg-solar text-carbon' : 'text-titanium/20 bg-titanium/5 hover:text-solar'}`}
                                      >
                                        <Pin className={`w-4 h-4 ${pinnedNotes.includes(note.id) ? 'fill-current' : ''}`} />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-3 pt-4 border-t border-current/10">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pinnedNotes.includes(note.id) ? 'bg-solar/20 text-solar' : 'bg-carbon/5 text-solar'}`}>
                                        <Calendar className="w-4 h-4" />
                                      </div>
                                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${pinnedNotes.includes(note.id) ? 'text-white/60' : 'text-titanium/40'}`}>{new Date(note.date).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                  </motion.div>
                                ))}
                            </div>
                          ) : (
                            <div className="py-24 text-center bg-carbon/5 rounded-[48px] border border-titanium/5">
                              <AlertCircle className="w-16 h-16 text-titanium/10 mx-auto mb-6" />
                              <p className="text-lg font-black text-titanium/40 tracking-tighter">سجل الملاحظات فارغ حالياً كصفحة بيضاء</p>
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
              className="absolute inset-0 bg-carbon/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative bg-white rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden border border-titanium/10"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-right">
                    <h3 className="text-2xl font-black text-carbon flex items-center gap-3 tracking-tighter">
                      <div className="w-10 h-10 bg-carbon text-solar rounded-xl flex items-center justify-center shadow-lg">
                        <Edit className="w-6 h-6" />
                      </div>
                      تحديث بيانات النخبة
                    </h3>
                    <p className="text-[10px] font-black text-titanium/40 uppercase tracking-widest mt-1">تعديل سجلات العضوية المعتمدة</p>
                  </div>
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-3 bg-carbon/5 text-carbon hover:bg-carbon hover:text-solar rounded-[18px] transition-all group"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateCustomer(selectedCustomer.uid || selectedCustomer.phone || '', editCustomerData);
                  setSelectedCustomer(prev => prev ? { ...prev, ...editCustomerData } : null);
                  setIsEditModalOpen(false);
                  showToast('تم تحديث بيانات العميل بنجاح', 'success');
                }} className="space-y-6">
                  <FloatingInput 
                    label="اللقب الرسمي / الاسم الكامل"
                    required
                    value={editCustomerData.name}
                    onChange={(e) => setEditCustomerData({...editCustomerData, name: e.target.value})}
                  />
                  <FloatingInput 
                    label="رقم التواصل المشفر"
                    type="tel"
                    required
                    value={editCustomerData.phone}
                    onChange={(e) => setEditCustomerData({...editCustomerData, phone: e.target.value})}
                    dir="ltr"
                  />
                  <FloatingInput 
                    label="مقر الإقامة / العنوان الحالي"
                    value={editCustomerData.address}
                    onChange={(e) => setEditCustomerData({...editCustomerData, address: e.target.value})}
                  />

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="submit"
                      className="flex-[2] bg-carbon text-solar py-5 rounded-[22px] font-black text-sm shadow-2xl shadow-carbon/30 hover:bg-black transition-all active:scale-95 border border-titanium/20"
                    >
                      تأكيد التعديلات
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 bg-carbon/5 text-carbon/40 py-5 rounded-[22px] font-black text-sm hover:bg-carbon/10 transition-all"
                    >
                      تراجع
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
              className="absolute inset-0 bg-carbon/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative bg-white rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden border border-titanium/10"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-right">
                    <h3 className="text-2xl font-black text-carbon flex items-center gap-3 tracking-tighter">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Lock className="w-6 h-6" />
                      </div>
                      تشفير الدخول
                    </h3>
                    <p className="text-[10px] font-black text-titanium/40 uppercase tracking-widest mt-1">تغيير رمز الوصول السري للحساب</p>
                  </div>
                  <button 
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="p-3 bg-carbon/5 text-carbon hover:bg-carbon hover:text-solar rounded-[18px] transition-all group"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateCustomer(selectedCustomer.uid || selectedCustomer.phone || '', { password: newPassword });
                  setIsPasswordModalOpen(false);
                  setNewPassword('');
                  showToast('تم تغيير كلمة المرور بنجاح', 'success');
                }} className="space-y-6">
                  <div className="bg-carbon/5 p-6 rounded-[28px] border border-titanium/5 mb-2">
                    <p className="text-xs font-black text-carbon/40 uppercase tracking-widest mb-2">توصية أمنية</p>
                    <p className="text-sm font-black text-carbon leading-relaxed">استخدم مزيجاً من الرموز الكبيرة والصغيرة لضمان حماية مطلقة لبيانات العميل.</p>
                  </div>

                  <FloatingInput 
                    label="رمز الدخول السري الجديد"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل الرمز المشفر الجديد..."
                  />

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="submit"
                      className="flex-[2] bg-indigo-600 text-white py-5 rounded-[22px] font-black text-sm shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      تحديث التشفير
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="flex-1 bg-carbon/5 text-carbon/40 py-5 rounded-[22px] font-black text-sm hover:bg-carbon/10 transition-all"
                    >
                      تراجع
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
              className="absolute inset-0 bg-carbon/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-md bg-white rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden border border-titanium/10"
            >
              <div className={`p-8 text-white relative overflow-hidden ${balanceAction.type === 'deposit' ? 'bg-carbon' : 'bg-rose-500'}`}>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="text-right">
                    <h3 className="text-2xl font-black tracking-tighter">
                      {balanceAction.type === 'deposit' ? 'تمويل ملكي' : 'تسوية النخبة'}
                    </h3>
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">تعديل الميزانية المخصصة للعضوية</p>
                  </div>
                  <button 
                    onClick={() => setIsBalanceModalOpen(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-[18px] transition-all group"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <div className="flex items-center gap-6 relative z-10 bg-white/5 p-4 rounded-[28px] border border-white/10 backdrop-blur-xl">
                  <div className="w-16 h-16 rounded-[22px] bg-white text-carbon flex items-center justify-center text-2xl font-black shadow-xl">
                    {(balanceAction.customer?.name || balanceAction.customer?.phone || '?').charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tracking-tight">{balanceAction.customer?.name}</p>
                    <p className="text-xs font-black opacity-60 uppercase tracking-widest mt-1" dir="ltr">{balanceAction.customer?.phone}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateBalance} className="p-8 sm:p-10 space-y-6">
                <div className="relative group">
                  <FloatingInput 
                    label="المقدار المالي"
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="text-left font-black text-2xl"
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-carbon/40 font-black z-10 pointer-events-none group-focus-within:text-solar transition-colors">
                    {settings.currency}
                  </div>
                </div>

                <FloatingInput 
                  label="بيان العملية / ملاحظات إدارية"
                  isTextArea
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  placeholder="مثلاً: بونص نخبوي، استرداد ملكي..."
                />

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className={`flex-[2] py-5 text-white rounded-[22px] font-black text-sm shadow-2xl transition-all active:scale-95 border border-white/10 ${
                      balanceAction.type === 'deposit' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' 
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30'
                    }`}
                  >
                    تأكيد المعاملة المالية
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBalanceModalOpen(false)}
                    className="flex-1 py-5 bg-carbon/5 text-carbon/40 rounded-[22px] font-black text-sm hover:bg-carbon/10 transition-all"
                  >
                    إلغاء
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
              initial={{ opacity: 0.5, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative bg-white rounded-t-[48px] sm:rounded-[64px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] w-full max-w-4xl h-[95vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col mt-auto sm:mt-0 border-t sm:border border-titanium/10"
            >
              {/* Header */}
              <div className="p-8 sm:p-10 border-b border-titanium/5 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-carbon text-solar flex items-center justify-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-solar/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <UserPlus className="w-8 h-8 relative z-10" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-carbon tracking-tighter leading-none">توسعة النخبة</h2>
                    <p className="text-[10px] font-black text-titanium/40 uppercase tracking-[0.3em] mt-2">تسجيل عضوية متميزة جديدة في النظام</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-4 bg-carbon/5 text-carbon hover:bg-carbon hover:text-solar rounded-2xl transition-all group"
                >
                  <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-12 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Basic Info Section */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-carbon text-solar flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-carbon uppercase tracking-[0.2em]">هوية العضوية</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <FloatingInput 
                        label="الاسم الكامل والتوصيف"
                        required
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        placeholder="مثال: سعادة محمد بن أحمد"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FloatingInput 
                          label="القناة المباشرة للهاتف"
                          type="tel"
                          required
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                          placeholder="7..."
                          dir="ltr"
                        />
                        <div className="relative group/pass">
                          <FloatingInput 
                            label="شفرة التعريف الخاصة"
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
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-titanium/30 hover:text-carbon transition-colors z-10"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group mt-12">
                      <div className="w-10 h-10 rounded-xl bg-carbon/5 text-carbon flex items-center justify-center border border-titanium/10 transition-transform group-hover:scale-110">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-carbon uppercase tracking-[0.2em]">ملاذ الإقامة</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FloatingInput 
                        label="المدينة / المنطقة"
                        value={newCustomer.city}
                        onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                        placeholder="مثال: الواحة الملكية"
                      />
                      <FloatingInput 
                        label="العنوان التفصيلي"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                        placeholder="المعلم الأقرب، الشارع..."
                      />
                    </div>
                  </div>

                  {/* Financial & Admin Section */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-carbon uppercase tracking-[0.2em]">الميزانية الافتتاحية</h3>
                    </div>

                    <div className="bg-carbon p-8 rounded-[40px] border border-titanium/10 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-solar/10 transition-colors" />
                      <div className="relative z-10">
                        <FloatingInput 
                          label="إيداع الرصيد العقاري"
                          type="number"
                          value={newCustomer.balance}
                          onChange={(e) => setNewCustomer({...newCustomer, balance: Number(e.target.value)})}
                          placeholder="0.00"
                          className="text-white text-3xl font-black bg-white/5 border-white/10 rounded-2xl"
                        />
                         <div className="flex items-center gap-2 mt-4 text-solar/60">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">سيتم تقييد هذا المبلغ في محفظة العميل فور التفعيل</p>
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group mt-12">
                      <div className="w-10 h-10 rounded-xl bg-carbon/5 text-carbon flex items-center justify-center border border-titanium/10 transition-transform group-hover:scale-110">
                        <Activity className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-carbon uppercase tracking-[0.2em]">ملاحظات السيادة</h3>
                    </div>

                    <div className="relative">
                      <FloatingInput 
                        label="بروتوكول التعامل الخاص (إداري)"
                        isTextArea
                        value={newCustomer.notes}
                        onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                        placeholder="أضف أي تفضيلات نخبوية أو ملاحظات أمنية حول العضو..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-titanium/5">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-6 bg-carbon/5 text-carbon/40 font-black rounded-[32px] hover:bg-carbon/10 transition-all text-sm uppercase tracking-widest"
                  >
                    إلغاء البروتوكول
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-6 bg-carbon text-solar font-black rounded-[32px] hover:bg-black transition-all shadow-2xl shadow-carbon/40 border border-titanium/20 flex items-center justify-center gap-4 active:scale-95 group text-lg tracking-tighter"
                  >
                    <span>تفعيل عضوية النخبة</span>
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
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
              className="absolute inset-0 bg-carbon/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0.5, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative bg-white rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] w-full max-w-lg p-8 sm:p-12 overflow-hidden border border-titanium/10"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-carbon/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
              
              <div className="relative z-10 mb-10 text-center">
                <div className="w-20 h-20 bg-carbon text-solar rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-2xl relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-solar/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Bell className="w-10 h-10 relative z-10 animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-carbon tracking-tighter leading-tight">بث ملكي</h2>
                <p className="text-[10px] font-black text-titanium/40 uppercase tracking-[0.3em] mt-3 leading-relaxed">
                  إرسال مراسلة فورية إلى لوحة العميل <span className="text-carbon border-b border-solar pb-0.5">{selectedCustomer.name}</span>
                </p>
              </div>

              <form onSubmit={handleSendNotification} className="relative z-10 space-y-6">
                <FloatingInput 
                  label="مانشيت الإشعار"
                  required
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                  placeholder="مثال: ترقية استثنائية لحسابكم"
                />
                <FloatingInput 
                  label="محتوى المراسلة"
                  isTextArea
                  required
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                  placeholder="اكتب تفاصيل الإشعار النخبوي هنا..."
                />
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-titanium/40 uppercase tracking-[0.3em] px-2">بروتوكول الوصول</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['system', 'sms', 'sale', 'order'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNotificationData({...notificationData, type: type as any})}
                        className={`py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all border ${
                          notificationData.type === type 
                            ? 'bg-carbon text-solar border-solar/30 shadow-xl scale-[1.02]' 
                            : 'bg-carbon/5 text-carbon/40 border-transparent hover:bg-carbon/10'
                        }`}
                      >
                        {type === 'system' ? 'نظام مدمج' : 
                         type === 'sms' ? 'رسالة SMS' : 
                         type === 'sale' ? 'عرض حصري' : 'تحديث طلب'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4 pt-8">
                  <button 
                    type="button"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="flex-1 py-5 bg-carbon/5 text-carbon/40 font-black rounded-[24px] hover:bg-carbon/10 transition-all text-sm uppercase tracking-widest"
                  >
                    تجاهل
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-carbon text-solar font-black rounded-[24px] hover:bg-black transition-all shadow-2xl shadow-carbon/40 border border-titanium/20 flex items-center justify-center gap-3 active:scale-95 group text-base"
                  >
                    <span>إرسال البث الفوري</span>
                    <Send className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
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
              className="absolute inset-0 bg-carbon/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0.5, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative bg-white rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] w-full max-w-md p-8 sm:p-10 overflow-hidden border border-titanium/10"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mt-32 blur-3xl opacity-50" />
              
              <div className="relative z-10 mb-10 text-center">
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-2xl relative group overflow-hidden">
                  <MessageSquare className="w-10 h-10 relative z-10 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-carbon tracking-tighter leading-tight">رسالة نصية نقدية</h2>
                <p className="text-[10px] font-black text-titanium/40 uppercase tracking-[0.3em] mt-3" dir="ltr">{selectedCustomer.phone}</p>
              </div>

              <form onSubmit={handleSendSms} className="relative z-10 space-y-6">
                <div className="relative group">
                  <FloatingInput 
                    label="المحتوى النصي الموجز"
                    isTextArea
                    required
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="اكتب رسالتك النصية المباشرة هنا..."
                    maxLength={160}
                  />
                  <div className="flex justify-between items-center mt-3 px-2">
                    <div className="h-1 flex-1 bg-carbon/5 rounded-full overflow-hidden mr-4">
                      <motion.div 
                        className={`h-full transition-all ${smsMessage.length > 140 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(smsMessage.length / 160) * 100}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-black text-titanium/40 uppercase tracking-widest whitespace-nowrap" dir="ltr">
                      {smsMessage.length} / 160
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsSmsModalOpen(false)}
                    className="flex-1 py-5 bg-carbon/5 text-carbon/40 font-black rounded-[24px] hover:bg-carbon/10 transition-all text-sm uppercase tracking-widest"
                  >
                    تراجع
                  </button>
                  <button 
                    type="submit"
                    disabled={isSendingSms}
                    className="flex-[2] py-5 bg-emerald-600 text-white font-black rounded-[24px] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/30 border border-white/10 flex items-center justify-center gap-3 active:scale-95 group text-base disabled:opacity-50"
                  >
                    {isSendingSms ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>إرسال العبارة</span>
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
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
