import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Wallet,
  ArrowDownToLine,
  Phone,
  User,
  Calendar,
  ExternalLink,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { useStore } from "@/context/StoreContext";
import PriceDisplay from "@/components/PriceDisplay";
import ConfirmationModal from "@/components/ConfirmationModal";
import { showLuxuryToast } from "@/lib/luxuryToast";

interface RechargeRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  reference: string;
  proof: string;
  method?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  updatedAt?: any;
}

export default function WalletRecharges() {
  const { formatPrice, logActivity, isAuthReady, adminUser } = useStore();
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedRecharge, setSelectedRecharge] = useState<RechargeRequest | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;

    let unsubscribeRecharges: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        const { db, adminDb, adminAuth, collection, query, orderBy, onSnapshot } = await import("@/lib/firebase");
        const activeDb = adminAuth.currentUser ? adminDb : db;
        
        // 1. Listen to recharges
        const q = query(collection(activeDb, "recharges"), orderBy("createdAt", "desc"));
        unsubscribeRecharges = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as RechargeRequest[];
          setRecharges(data);
          setIsLoading(false);
        }, (error) => {
          console.error("Firestore Error [WalletRecharges]:", error);
          showLuxuryToast("error", { title: "خطأ في التحميل", description: "فشل تحميل طلبات الإيداع من الخادم" });
          setIsLoading(false);
        });

        // 2. Listen to users for real-time balances
        unsubscribeUsers = onSnapshot(collection(activeDb, "users"), (snapshot) => {
          const balances: Record<string, number> = {};
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            balances[doc.id] = data.walletBalance || 0;
          });
          setUserBalances(balances);
        }, (error) => {
          console.error("Firestore Error [UserBalances]:", error);
        });

      } catch (error) {
        console.error("Error setting up listeners:", error);
        setIsLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeRecharges) unsubscribeRecharges();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [isAuthReady, adminUser?.uid]);

  const handleDelete = async (recharge: RechargeRequest) => {
    if (!window.confirm(`هل أنت متأكد من حذف طلب الشحن الخاص بـ ${recharge.userName} بشكل نهائي؟`)) return;
    try {
      const { db, adminDb, adminAuth, doc, deleteDoc } = await import("@/lib/firebase");
      const activeDb = adminAuth.currentUser ? adminDb : db;
      const rechargeRef = doc(activeDb, "recharges", recharge.id);
      await deleteDoc(rechargeRef);
      
      logActivity(
        "حذف سجل شحن",
        `تم حذف طلب الشحن للعميل ${recharge.userName} بقيمة ${recharge.amount}`
      );
      
      showLuxuryToast("success", { 
        title: "تم الحذف!", 
        description: "تم حذف سجل طلب الشحن بنجاح" 
      });
    } catch (error) {
      console.error("Error deleting recharge request:", error);
      showLuxuryToast("error", { title: "فشل الحذف", description: "تعذر حذف السجل، يرجى المحاولة لاحقاً" });
    }
  };

  // Helper to get safe date object from Firestore Timestamp or JS Date string/obj
  const getSafeDate = (dateObj: any): Date | null => {
    if (!dateObj) return null;
    if (typeof dateObj.toDate === "function") return dateObj.toDate();
    const d = new Date(dateObj);
    return isNaN(d.getTime()) ? null : d;
  };

  // Helper to format date nicely
  const formatDateLocale = (dateObj: any) => {
    const date = getSafeDate(dateObj);
    if (!date) return "غير متوفر";
    return date.toLocaleDateString("ar-YE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ المرجع بنجاح");
  };

  const getMethodIcon = (method?: string) => {
    // Return a generic icon but could be customized
    return <Wallet className="w-3.5 h-3.5" />;
  };

  const filteredRecharges = useMemo(() => {
    return recharges.filter(r => {
      const matchesSearch = 
        r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userPhone.includes(searchQuery) ||
        r.reference.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recharges, searchQuery, statusFilter]);

  const handleAction = async () => {
    if (!selectedRecharge) return;
    setIsProcessing(true);

    try {
      const { db, adminDb, adminAuth, doc, writeBatch, getDoc, serverTimestamp, collection } = await import("@/lib/firebase");
      const activeDb = adminAuth.currentUser ? adminDb : db;
      const batch = writeBatch(activeDb);
      const rechargeRef = doc(activeDb, "recharges", selectedRecharge.id);

      if (actionType === "approve") {
        // 1. Update recharge status
        batch.update(rechargeRef, {
          status: "approved",
          updatedAt: serverTimestamp()
        });

        // 2. Update user wallet balance
        const userRef = doc(activeDb, "users", selectedRecharge.userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentBalance = userData.walletBalance || 0;
          const newBalance = currentBalance + selectedRecharge.amount;
          
          const newTransaction = {
            id: `topup-${selectedRecharge.id}`,
            amount: selectedRecharge.amount,
            type: "deposit",
            date: new Date().toISOString(),
            status: "completed",
            description: `إيداع رصيد (مرجع: ${selectedRecharge.reference})`
          };

          batch.update(userRef, {
            walletBalance: newBalance,
            transactions: [newTransaction, ...(userData.transactions || [])]
          });
          
          // Add notification for user in Firestore (for in-app notification list)
          const notificationRef = doc(collection(activeDb, `users/${selectedRecharge.userId}/notifications`));
          const notifTitle = "✅ تم شحن محفظتك بنجاح";
          const notifBody = `أهلاً ${selectedRecharge.userName}، يسعدنا إبلاغك بأنه تمت الموافقة على طلب الشحن بمبلغ ${formatPrice(selectedRecharge.amount)}.
          
الرصيد الجديد المتوفر: ${formatPrice(newBalance)}
رقم المرجع: ${selectedRecharge.reference}

نتمنى لك تجربة تسوق ممتعة!`;
          
          batch.set(notificationRef, {
            title: notifTitle,
            message: notifBody,
            type: "system",
            isRead: false,
            date: new Date().toISOString(),
            createdAt: serverTimestamp()
          });

          // Trigger Push Notification via Server API
          try {
            fetch("/api/admin/notifications/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: notifTitle,
                message: notifBody,
                target: "specific_user",
                targetUserId: selectedRecharge.userId,
                url: "/profile",
                type: "wallet"
              })
            }).catch(e => console.warn("Background notification failed:", e));
          } catch (e) {}
        }
      } else {
        // Reject
        batch.update(rechargeRef, {
          status: "rejected",
          updatedAt: serverTimestamp()
        });
        
        // Add notification for user
        const notificationRef = doc(collection(activeDb, `users/${selectedRecharge.userId}/notifications`));
        const notifTitle = "❌ تحديث بشأن طلب الشحن";
        const notifMessage = `نأسف لإبلاغك بأنه تعذر قبول طلب الشحن الخاص بك بمبلغ ${formatPrice(selectedRecharge.amount)} (مرجع: ${selectedRecharge.reference}).

يرجى مراجعة بيانات السند أو التواصل مع خدمة العملاء لمساعدتك في إتمام العملية.`;

        batch.set(notificationRef, {
          title: notifTitle,
          message: notifMessage,
          type: "system",
          isRead: false,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });

        // Trigger Push Notification via Server API
        try {
          fetch("/api/admin/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: notifTitle,
              message: notifMessage,
              target: "specific_user",
              targetUserId: selectedRecharge.userId,
              url: "/profile",
              type: "system"
            })
          }).catch(e => console.warn("Background notification failed:", e));
        } catch (e) {}
      }

      await batch.commit();
      
      logActivity(
        actionType === "approve" ? "موافقة على إيداع" : "رفض إيداع",
        `${actionType === "approve" ? "تمت الموافقة" : "تم رفض"} طلب إيداع العميل ${selectedRecharge.userName} بمبلغ ${selectedRecharge.amount}`
      );

      showLuxuryToast("success", { 
        title: "تمت العملية!", 
        description: actionType === "approve" ? "تم قبول الطلب وشحن المحفظة بنجاح" : "تم رفض الطلب بنجاح" 
      });
      setIsConfirmModalOpen(false);
      setSelectedRecharge(null);
    } catch (error) {
      console.error("Error processing recharge action:", error);
      showLuxuryToast("error", { title: "فشل العملية", description: "تعذر إكمال العملية، يرجى المحاولة لاحقاً" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-solar rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium font-sans">جاري تحميل طلبات الإيداع...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-right">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-solar/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-solar" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">في الانتظار</p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">{recharges.filter(r => r.status === "pending").length}</p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-right">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">تمت الموافقة</p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">{recharges.filter(r => r.status === "approved").length}</p>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-carbon p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-carbon shadow-lg shadow-carbon/10 flex flex-row items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-solar" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-xs font-black text-white/40 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">إجمالي الإيداعات</p>
            <PriceDisplay
              price={recharges.filter(r => r.status === "approved").reduce((sum, r) => sum + r.amount, 0)}
              numberClassName="text-base sm:text-lg font-black text-white leading-tight"
              currencyClassName="text-[10px] font-bold text-solar mr-1 uppercase"
            />
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <input
                type="text"
                placeholder="ابحث عن عميل، مرجع، أو هاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 sm:py-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-solar/20 transition-all text-right"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar self-start md:self-auto w-full md:w-auto">
              {[
                { id: "all", label: "الكل" },
                { id: "pending", label: "في الانتظار" },
                { id: "approved", label: "مقبول" },
                { id: "rejected", label: "مرفوض" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as any)}
                  className={`flex-1 md:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all whitespace-nowrap ${
                    statusFilter === filter.id
                      ? "bg-white text-carbon shadow-md"
                      : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto -mx-6 sm:-mx-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100/60">
                <th className="text-right p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">العميل</th>
                <th className="text-right p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">طريقة الدفع</th>
                <th className="text-right p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">المبلغ</th>
                <th className="text-right p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">رقم المرجع</th>
                <th className="text-right p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ والوقت</th>
                <th className="text-right p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الحالة</th>
                <th className="text-center p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              <AnimatePresence mode="popLayout">
                {filteredRecharges.map((recharge) => (
                  <motion.tr
                    layout
                    key={recharge.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm leading-none flex items-center gap-1.5 shrink-0">
                            <span>{recharge.userName}</span>
                            {userBalances[recharge.userId] !== undefined && (
                              <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100/50 rounded-md px-1.5 py-0.5" dir="rtl">
                                رصيده: <PriceDisplay price={userBalances[recharge.userId]} />
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Phone className="w-3 h-3" />
                            <span>{recharge.userPhone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          {getMethodIcon(recharge.method)}
                        </div>
                        <span className="text-xs font-black text-slate-700">
                          {recharge.method || "حوالة مباشرة"}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <PriceDisplay
                        price={recharge.amount}
                        numberClassName="font-black text-slate-900 text-base"
                        currencyClassName="text-[10px] font-bold text-slate-400 mr-1"
                      />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest">
                          {recharge.reference}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(recharge.reference)}
                          className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-solar" />
                          {getSafeDate(recharge.createdAt)?.toLocaleDateString("ar-YE", { day: 'numeric', month: 'short', year: 'numeric' }) || "غير متوفر"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-solar" />
                          {getSafeDate(recharge.createdAt)?.toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" }) || "غير متوفر"}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider
                        ${recharge.status === "pending" ? "bg-solar/10 text-solar" : 
                          recharge.status === "approved" ? "bg-emerald-50 text-emerald-600" : 
                          "bg-rose-50 text-rose-600"}
                      `}>
                        {recharge.status === "pending" && <Clock className="w-3 h-3" />}
                        {recharge.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                        {recharge.status === "rejected" && <XCircle className="w-3 h-3" />}
                        {recharge.status === "pending" ? "في الانتظار" : 
                         recharge.status === "approved" ? "مقبول" : "مرفوض"}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        {recharge.proof && (
                          <a
                            href={recharge.proof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="عرض صورة السند"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {(recharge.status === "pending" || recharge.status === "rejected") && (
                          <button
                            onClick={() => {
                              setSelectedRecharge(recharge);
                              setActionType("approve");
                              setIsConfirmModalOpen(true);
                            }}
                            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="موافقة وشحن الرصيد"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {recharge.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedRecharge(recharge);
                              setActionType("reject");
                              setIsConfirmModalOpen(true);
                            }}
                            className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title="رفض"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(recharge)}
                          className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="حذف السجل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredRecharges.map((recharge) => (
              <motion.div
                layout
                key={recharge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    recharge.status === "pending" ? "bg-solar" : 
                    recharge.status === "approved" ? "bg-emerald-500" : 
                    "bg-rose-500"
                  }`} 
                />

                <div className="flex flex-col gap-4">
                  {/* Top Section: User & Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm leading-tight truncate mb-1">{recharge.userName}</p>
                        {userBalances[recharge.userId] !== undefined && (
                          <p className="text-[10px] font-bold text-emerald-600 mb-1" dir="rtl">
                            الرصيد الحالي: <PriceDisplay price={userBalances[recharge.userId]} />
                          </p>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <p className="text-[11px] font-bold text-slate-400" dir="ltr">{recharge.userPhone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider
                        ${recharge.status === "pending" ? "bg-solar/10 text-solar" : 
                          recharge.status === "approved" ? "bg-emerald-50 text-emerald-600" : 
                          "bg-rose-50 text-rose-600"}
                      `}>
                        {recharge.status === "pending" ? "في الانتظار" : 
                         recharge.status === "approved" ? "مقبول" : "مرفوض"}
                      </span>
                    </div>
                  </div>

                  {/* Amount & Reference Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">المبلغ المطلوب</p>
                      <PriceDisplay
                        price={recharge.amount}
                        numberClassName="font-black text-slate-900 text-base"
                        currencyClassName="text-[11px] font-bold text-solar mr-1"
                      />
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">طريقة الدفع</p>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3 h-3 text-solar" />
                        <p className="text-[11px] font-black text-slate-900">{recharge.method || "حوالة مباشرة"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">رقم المرجع</p>
                      <code className="text-xs font-black text-solar tracking-widest block">{recharge.reference}</code>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(recharge.reference)}
                      className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
                    >
                      <ArrowDownToLine className="w-5 h-5 rotate-180" />
                    </button>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-solar" />
                        <span>{getSafeDate(recharge.createdAt)?.toLocaleDateString("ar-YE", { day: 'numeric', month: 'short' }) || "غير متوفر"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-200" />
                        <span>{getSafeDate(recharge.createdAt)?.toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" }) || "غير متوفر"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {recharge.proof && (
                        <a
                          href={recharge.proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-black hover:opacity-90 active:scale-95 transition-all shadow-md shadow-carbon/20"
                        >
                          <Eye className="w-4 h-4" />
                          <span>عرض السند</span>
                        </a>
                      )}
                      
                      <div className="flex items-center gap-1.5 font-sans">
                        {(recharge.status === "pending" || recharge.status === "rejected") && (
                          <button
                            onClick={() => {
                              setSelectedRecharge(recharge);
                              setActionType("approve");
                              setIsConfirmModalOpen(true);
                            }}
                            className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-emerald-500/20"
                            title="موافقة وشحن الرصيد"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        {recharge.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedRecharge(recharge);
                              setActionType("reject");
                              setIsConfirmModalOpen(true);
                            }}
                            className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-rose-500/20"
                            title="رفض"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(recharge)}
                          className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-red-500/20"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredRecharges.length === 0 && (
          <div className="text-center py-20 sm:py-32">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
              <ArrowDownToLine className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">لا توجد طلبات إيداع</h3>
            <p className="text-sm font-medium text-slate-400">لم يتم العثور على أي طلبات تطابق بحثك</p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleAction}
        title={actionType === "approve" ? "تأكيد الموافقة" : "تأكيد الرفض"}
        message={actionType === "approve" 
          ? `هل أنت متأكد من الموافقة على طلب إيداع العميل ${selectedRecharge?.userName} بمبلغ ${formatPrice(selectedRecharge?.amount || 0)}؟ سيتم إضافة الرصيد إلى محفظته فوراً.`
          : `هل أنت متأكد من رفض طلب إيداع العميل ${selectedRecharge?.userName}؟ سيتم إشعار العميل بالرفض.`
        }
        isLoading={isProcessing}
        confirmText={actionType === "approve" ? "نعم، موافقة وشحن" : "نعم، رفض الطلب"}
        type={actionType === "approve" ? "success" : "danger"}
      />
    </div>
  );
}
