import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, RefreshCcw, Search, Filter, 
  Users, Package, ShoppingCart, AlertCircle,
  Database, ArrowLeft, History, MoreVertical,
  ChevronRight, Calendar, Info
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { toast } from 'sonner';

type TrashTab = 'customers' | 'products' | 'orders';

export default function TrashBin() {
  const { trashItems, restoreItem, permanentlyDeleteItem, formatPrice } = useStore();
  const [activeTab, setActiveTab] = useState<TrashTab>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  const filteredItems = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'customers':
        return trashItems.users.filter(u => 
          u.displayName?.toLowerCase().includes(query) || 
          u.phone?.includes(query) ||
          u.email?.toLowerCase().includes(query)
        );
      case 'products':
        return trashItems.products.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.sku?.toLowerCase().includes(query)
        );
      case 'orders':
        return trashItems.orders.filter(o => 
          o.id.toLowerCase().includes(query) || 
          o.customerName?.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [activeTab, searchQuery, trashItems]);

  const handleRestore = async (id: string) => {
    const promise = restoreItem(
      activeTab === 'customers' ? 'users' : activeTab,
      id
    );
    toast.promise(promise, {
      loading: 'جاري الاستعادة...',
      success: 'تم استعادة العنصر بنجاح',
      error: 'فشل استعادة العنصر'
    });
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذه الخطوة.')) return;
    
    const promise = permanentlyDeleteItem(
      activeTab === 'customers' ? 'users' : activeTab,
      id
    );
    toast.promise(promise, {
      loading: 'جاري الحذف النهائي...',
      success: 'تم الحذف النهائي بنجاح',
      error: 'فشل الحذف النهائي'
    });
  };

  const tabs = [
    { id: 'customers' as const, label: 'العملاء', icon: Users, count: trashItems.users.length },
    { id: 'products' as const, label: 'المنتجات', icon: Package, count: trashItems.products.length },
    { id: 'orders' as const, label: 'الطلبات', icon: ShoppingCart, count: trashItems.orders.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">سلة المهملات</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة واستعادة العناصر المحذوفة (العناصر تبقى هنا حتى يتم حذفها نهائياً)</p>
        </div>
      </div>

      {/* Stats/Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
        <div className="bg-amber-100 p-2 rounded-xl">
          <Info className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-amber-900 font-semibold text-sm">ملاحظة هامة</h3>
          <p className="text-amber-800 text-xs mt-1 leading-relaxed">
            عند حذف عميل أو منتج، يتم نقله إلى هنا أولاً. يمكنك استعادته في أي وقت. 
            الحذف النهائي من هذه السلة سيؤدي لمسح البيانات من قاعدة البيانات بشكل كامل ولا يمكن استرجاعها.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100/50 p-1 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
              setSelectedIds([]);
            }}
            className={`
              relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.id 
                ? 'bg-white text-solar shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`
                px-2 py-0.5 rounded-full text-[10px] font-bold
                ${activeTab === tab.id ? 'bg-solar/10 text-solar' : 'bg-gray-200 text-gray-500'}
              `}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabTrash"
                className="absolute inset-0 border-2 border-solar/20 rounded-xl"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-solar transition-colors" />
          <input
            type="text"
            placeholder={`البحث في ${tabs.find(t => t.id === activeTab)?.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pr-12 pl-4 rounded-2xl border-2 border-gray-100 focus:border-solar focus:ring-4 focus:ring-solar/5 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">سلة المهملات فارغة</h3>
            <p className="text-gray-500 mt-2 max-w-sm px-6">
              لا توجد عناصر محذوفة حالياً في قسم {tabs.find(t => t.id === activeTab)?.label}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-bold text-gray-500">العنصر</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500">تاريخ الحذف</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500">السبب الأولي</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item: any) => (
                    <motion.tr
                      key={item.id || item.uid}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {activeTab === 'products' && (
                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900">
                              {activeTab === 'customers' ? (item.displayName || item.name || 'عميل مجهول') : item.name || `#${item.id}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {activeTab === 'customers' ? item.phone : (activeTab === 'products' ? `SKU: ${item.sku || 'N/A'}` : `المبلغ: ${formatPrice(item.total)}`)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'غير معروف'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          حذف إداري
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(item.id || item.uid)}
                            className="flex items-center gap-2 px-4 py-2 bg-solar/10 text-solar rounded-xl text-sm font-bold hover:bg-solar hover:text-white transition-all transform active:scale-95"
                          >
                            <RefreshCcw className="w-4 h-4" />
                            استعادة
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(item.id || item.uid)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all transform active:scale-95"
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
