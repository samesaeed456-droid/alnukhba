import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Search, 
  User, 
  Clock,
  Trash2,
  MessageCircle,
  Inbox,
  Copy,
  CheckCircle2,
  Mail,
  ChevronDown,
  X,
  ListFilter,
  Eye,
  CheckSquare,
  ArrowRight,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { toast } from 'sonner';
import { FloatingInput } from '../../components/FloatingInput';
import ConfirmationModal from '../../components/ConfirmationModal';

const QUICK_REPLIES = [
  { id: 'welcome', label: 'رسالة ترحيب', text: 'مرحباً بك، كيف يمكننا مساعدتك اليوم؟' },
  { id: 'details', label: 'طلب تفاصيل', text: 'يرجى تزويدنا بمزيد من التفاصيل حول المشكلة لنتمكن من مساعدتك بشكل أفضل.' },
  { id: 'resolved', label: 'تم الحل', text: 'يسعدنا إبلاغك بأنه تم حل المشكلة. شكراً لتواصلك معنا.' },
];

const Messages = () => {
  const { supportTickets, updateTicketStatus, deleteTicket } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'غير مقروءة'>('الكل');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const filteredMessages = useMemo(() => {
    return supportTickets
      .filter(msg => {
        const matchesSearch = 
          (msg.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (msg.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (msg.message || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesFilter = true;
        if (statusFilter === 'غير مقروءة') matchesFilter = msg.status === 'open';
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [supportTickets, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = supportTickets.length;
    const unread = supportTickets.filter(t => t.status === 'open').length;
    return { total, unread };
  }, [supportTickets]);

  const handleWhatsApp = (phone: string, text: string = '') => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const toggleTicketSelection = (id: string) => {
    setSelectedTickets(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = (newStatus: 'open' | 'resolved') => {
    selectedTickets.forEach(id => updateTicketStatus(id, newStatus));
    setSelectedTickets([]);
    toast.success(`تم تحديث ${selectedTickets.length} رسائل بنجاح`);
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف الرسائل',
      message: `هل أنت متأكد من حذف ${selectedTickets.length} رسائل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`,
      onConfirm: () => {
        selectedTickets.forEach(id => deleteTicket(id));
        setSelectedTickets([]);
        toast.success('تم حذف الرسائل بنجاح');
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
      <div className="px-4 sm:px-8 lg:px-12 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-sm">
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-carbon tracking-tight">الرسائل والدعم</h1>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-0.5 sm:mt-1">إدارة استفسارات وشكاوى العملاء</p>
          </div>
        </div>
      </div>

      {/* Stats Cards - Elite Style (Shrinked) */}
      <div className="px-4 sm:px-8 lg:px-12 mb-8">
        <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {[
            { label: 'إجمالي الرسائل', value: stats.total, icon: Inbox, color: 'text-solar', bg: 'bg-solar/10', status: 'الكل' },
            { label: 'رسائل جديدة', value: stats.unread, icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50', status: 'غير مقروءة' },
          ].map((stat, idx) => (
            <motion.button
              key={idx}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStatusFilter(stat.status as any)}
              className={`px-4 sm:px-5 py-3 sm:py-3.5 rounded-[20px] sm:rounded-[24px] border transition-all duration-300 text-right group relative overflow-hidden flex items-center gap-3 sm:gap-4 shrink-0 sm:shrink ${
                statusFilter === stat.status 
                ? 'bg-carbon text-white border-carbon shadow-lg shadow-carbon/10' 
                : 'bg-white border-bg-hover shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
                statusFilter === stat.status 
                ? 'bg-white/10 border-white/20 text-solar' 
                : `${stat.bg} ${stat.color} border-transparent`
              }`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-0.5 ${statusFilter === stat.status ? 'text-white/60' : 'text-slate-400'}`}>
                  {stat.label}
                </p>
                <h3 className="text-base sm:text-lg font-black tracking-tighter leading-none">{stat.value}</h3>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-4 sm:px-8 lg:px-12">
        {/* Search & Filters Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <FloatingInput
                id="messageSearch"
                label="بحث في الرسائل..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                iconPosition="start"
                bgClass="bg-white"
              />
            </div>
          </div>

          {selectedTickets.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-carbon text-white px-6 py-3 rounded-2xl shadow-xl border border-white/10 w-full md:w-auto justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-solar/20 text-solar flex items-center justify-center font-black text-sm">
                  {selectedTickets.length}
                </div>
                <span className="text-xs font-bold">رسالة مختارة</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleBulkStatusUpdate('resolved')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black">مقروءة</button>
                <button onClick={handleBulkDelete} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black">حذف</button>
                <button onClick={() => setSelectedTickets([])} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Messages Grid */}
        <AnimatePresence mode="popLayout">
          {filteredMessages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center bg-white rounded-[32px] border border-bg-hover shadow-sm"
            >
              <div className="w-24 h-24 bg-bg-general rounded-full flex items-center justify-center mx-auto mb-6 border border-bg-hover">
                <Inbox className="w-12 h-12 text-slate-200" />
              </div>
              <p className="text-slate-400 font-black text-lg">لا توجد رسائل تطابق بحثك</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {filteredMessages.map((msg) => {
                const isUnread = msg.status === 'open';

                return (
                  <motion.div
                    key={msg.id}
                    layout
                    variants={itemVariants}
                    onClick={() => {
                      setSelectedMessage(msg);
                      setIsDetailsModalOpen(true);
                      if (isUnread) updateTicketStatus(msg.id, 'resolved');
                    }}
                    className={`bg-white border rounded-[28px] sm:rounded-[32px] p-5 sm:p-10 transition-all duration-500 flex flex-col group relative shadow-sm hover:shadow-2xl hover:-translate-y-2 overflow-hidden cursor-pointer ${
                      isUnread ? 'border-blue-200 hover:border-blue-300 hover:shadow-blue-500/10' : 'border-bg-hover hover:border-solar/30 hover:shadow-solar/10'
                    }`}
                  >
                    {/* Decorative Background Element */}
                    <div className={`absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 rounded-full blur-3xl transition-colors ${
                      isUnread ? 'bg-blue-500/5 group-hover:bg-blue-500/10' : 'bg-solar/5 group-hover:bg-solar/10'
                    }`} />

                    {/* Top Row: Status & Date */}
                    <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] sm:rounded-[20px] flex items-center justify-center transition-all duration-500 shadow-inner ${
                          isUnread ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : 'bg-bg-general text-slate-400 group-hover:bg-carbon group-hover:text-solar'
                        }`}>
                          <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">تاريخ الاستلام</span>
                          <span className="text-xs sm:text-sm font-black text-carbon uppercase tracking-tighter">
                            {new Date(msg.createdAt).toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {isUnread && (
                        <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm border border-blue-100 bg-blue-50 text-blue-600">
                          جديد
                        </div>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8 relative z-10">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[24px] bg-bg-general overflow-hidden border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-500 shrink-0">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.customerName}`} 
                          alt="Customer" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-carbon text-lg sm:text-xl mb-0.5 sm:mb-1 truncate leading-tight group-hover:text-solar transition-colors">{msg.customerName}</h3>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-bold">
                          <span className="truncate" dir="ltr">{msg.customerId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subject & Message Snippet */}
                    <div className="bg-bg-general rounded-[24px] sm:rounded-[28px] p-5 sm:p-8 mb-6 sm:mb-8 flex-1 border border-bg-hover group-hover:bg-white transition-colors relative z-10">
                      <h4 className={`text-base sm:text-lg mb-2 sm:mb-3 truncate ${isUnread ? 'font-black text-carbon' : 'font-bold text-slate-700'}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium">
                        {msg.message}
                      </p>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-auto relative z-10">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(msg);
                          setIsDetailsModalOpen(true);
                          if (isUnread) updateTicketStatus(msg.id, 'resolved');
                        }}
                        className="flex-1 py-4 sm:py-5 bg-carbon text-solar rounded-[20px] sm:rounded-[24px] font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-carbon/10 hover:shadow-carbon/20 transition-all flex items-center justify-center gap-2 sm:gap-3 border border-white/10"
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        عرض التفاصيل
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05, backgroundColor: '#10B981', color: '#fff' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsApp(msg.customerId);
                        }}
                        className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-bg-hover rounded-[20px] sm:rounded-[24px] flex items-center justify-center text-emerald-500 transition-all shadow-sm"
                      >
                        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                      </motion.button>
                    </div>

                    {/* Selection Checkbox */}
                    <motion.div 
                      whileTap={{ scale: 0.8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTicketSelection(msg.id);
                      }}
                      className={`absolute top-8 left-8 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all z-20 ${
                        selectedTickets.includes(msg.id) 
                        ? 'bg-solar border-solar text-carbon shadow-lg shadow-solar/20' 
                        : 'bg-white/40 border-white/60 backdrop-blur-md opacity-0 group-hover:opacity-100 shadow-sm'
                      }`}
                    >
                      {selectedTickets.includes(msg.id) && <CheckSquare className="w-5 h-5" />}
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Details Modal - More Spacious & Less Crowded */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedMessage && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-carbon/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl bg-white rounded-t-[40px] sm:rounded-[48px] overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[95vh] sm:max-h-[92vh]"
            >
              {/* Header - Cleaner & More Spacious */}
              <div className="p-6 sm:p-12 border-b border-bg-hover bg-bg-general relative">
                {/* Mobile Close Handle */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />

                <div className="absolute top-6 sm:top-8 left-6 sm:left-8 flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMessage.message);
                      toast.success('تم نسخ محتوى الرسالة');
                    }}
                    className="hidden sm:block p-4 bg-white text-slate-400 hover:text-carbon hover:bg-slate-50 rounded-[22px] transition-colors border border-bg-hover shadow-sm"
                    title="نسخ الرسالة"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-3 sm:p-4 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[18px] sm:rounded-[22px] transition-colors border border-bg-hover shadow-sm"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 pr-0 sm:pr-0 mt-4 sm:mt-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] sm:rounded-[32px] bg-white overflow-hidden border-2 border-bg-hover shadow-xl shrink-0">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMessage.customerName}`} 
                      alt="Customer" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-4xl font-black text-carbon mb-1 sm:mb-2 tracking-tight leading-tight truncate">{selectedMessage.subject}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-sm sm:text-base">
                      <span className="font-black text-slate-700">{selectedMessage.customerName}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="text-slate-500 font-bold block sm:inline" dir="ltr">{selectedMessage.customerId}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="text-slate-400 text-[10px] sm:text-sm font-black flex items-center gap-1.5 sm:gap-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-solar" />
                        {new Date(selectedMessage.createdAt).toLocaleString('ar-SA', { 
                          month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body - Maximum Breathing Room */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-16 bg-white">
                <div className="max-w-4xl mx-auto">
                  <div className="prose prose-slate prose-base sm:prose-xl max-w-none">
                    <p className="text-carbon leading-[1.8] sm:leading-[2] whitespace-pre-wrap font-bold text-base sm:text-xl opacity-90">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions - Clean & Impactful */}
              <div className="p-6 sm:p-12 border-t border-bg-hover bg-bg-general flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="relative w-full sm:w-auto order-2 sm:order-1">
                  <button 
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 sm:gap-4 px-8 sm:px-10 py-4 sm:py-5 bg-emerald-500 text-white rounded-[20px] sm:rounded-[28px] font-black text-sm sm:text-base shadow-2xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all hover:-translate-y-1"
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    رد سريع عبر واتساب
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 opacity-70" />
                  </button>

                  <AnimatePresence>
                    {showQuickReplies && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowQuickReplies(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-4 sm:mb-5 w-full sm:w-96 bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl border border-bg-hover py-3 sm:py-4 z-20 overflow-hidden"
                        >
                          <div className="px-5 sm:px-6 pb-3 sm:pb-4 mb-2 sm:mb-3 border-b border-bg-hover text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            قوالب الردود الجاهزة
                          </div>
                          {QUICK_REPLIES.map(reply => (
                            <button
                              key={reply.id}
                              onClick={() => {
                                handleWhatsApp(selectedMessage.customerId, reply.text);
                                setShowQuickReplies(false);
                              }}
                              className="w-full text-right px-5 sm:px-6 py-3 sm:py-4 hover:bg-bg-general transition-colors"
                            >
                              <div className="text-sm sm:text-base font-black text-carbon mb-1 sm:mb-1.5">{reply.label}</div>
                              <div className="text-xs sm:text-sm text-slate-500 font-bold line-clamp-1">{reply.text}</div>
                            </button>
                          ))}
                          <div className="border-t border-bg-hover mt-2 sm:mt-3 pt-2 sm:pt-3">
                            <button
                              onClick={() => {
                                handleWhatsApp(selectedMessage.customerId);
                                setShowQuickReplies(false);
                              }}
                              className="w-full text-right px-5 sm:px-6 py-3 sm:py-4 hover:bg-bg-general transition-colors text-sm sm:text-base font-black text-emerald-600"
                            >
                              فتح واتساب بدون قالب
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
                  <button 
                    onClick={() => {
                      updateTicketStatus(selectedMessage.id, 'open');
                      setIsDetailsModalOpen(false);
                      toast.success('تم التحديد كغير مقروءة');
                    }}
                    className="flex-1 sm:flex-none px-6 sm:px-10 py-4 sm:py-5 bg-white text-carbon rounded-[20px] sm:rounded-[28px] font-black text-xs sm:text-base border border-bg-hover shadow-sm hover:bg-slate-50 transition-all hover:border-solar/30"
                  >
                    تحديد كغير مقروءة
                  </button>
                  <button 
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="flex-1 sm:flex-none px-6 sm:px-10 py-4 sm:py-5 bg-bg-general text-slate-400 rounded-[20px] sm:rounded-[28px] font-black text-xs sm:text-base border border-bg-hover hover:text-carbon transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="حذف الرسائل"
      />
    </motion.div>
  );
};

export default Messages;
