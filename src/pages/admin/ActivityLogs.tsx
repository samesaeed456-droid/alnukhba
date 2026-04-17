import React, { useState, useMemo } from 'react';
import { History, Search, Download, Filter, ChevronRight, ChevronLeft, Calendar, User, Activity, Plus, Edit2, Trash2, LogIn } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { FloatingInput } from '../../components/FloatingInput';

export default function ActivityLogs() {
  const { activityLogs, logActivity } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper for action colors and icons
  const getActionStyle = (action: string) => {
    if (action.includes('إضافة') || action.includes('إنشاء')) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: Plus };
    if (action.includes('تعديل') || action.includes('تحديث')) return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Edit2 };
    if (action.includes('حذف') || action.includes('إزالة')) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: Trash2 };
    if (action.includes('دخول') || action.includes('خروج')) return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: LogIn };
    return { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: Activity };
  };

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch = 
        (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || (log.action || '').includes(actionFilter);
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const logDate = (log.date as any)?.seconds ? new Date((log.date as any).seconds * 1000) : new Date(log.date);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = logDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesDate = logDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchesDate = logDate >= monthAgo;
        }
      }

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [activityLogs, searchTerm, actionFilter, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const exportToCSV = () => {
    logActivity('تصدير بيانات', 'تم تصدير سجل النشاطات إلى ملف CSV');
    const headers = ['المشرف', 'العملية', 'التفاصيل', 'التاريخ', 'IP'];
    const csvData = filteredLogs.map(log => [
      log.userName, 
      log.action, 
      log.details, 
      new Date((log.date as any)?.seconds ? (log.date as any).seconds * 1000 : log.date).toLocaleString('ar-EG'), 
      log.ip || '192.168.1.1'
    ]);
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-carbon flex items-center gap-2">
          <History className="w-6 h-6 text-solar" />
          <span>سجل النشاطات</span>
        </h2>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 text-carbon px-4 py-2 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm shadow-sm w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          <span>تصدير السجل (CSV)</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <FloatingInput
            id="logSearch"
            label="بحث في السجل..."
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Search className="w-4 h-4" />}
            iconPosition="start"
            bgClass="bg-white"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 text-carbon text-sm rounded-xl focus:ring-solar focus:border-solar block pr-10 p-3 appearance-none font-bold"
            >
              <option value="all">جميع العمليات</option>
              <option value="إضافة">إضافة</option>
              <option value="تعديل">تعديل</option>
              <option value="حذف">حذف</option>
              <option value="دخول">تسجيل دخول</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 text-carbon text-sm rounded-xl focus:ring-solar focus:border-solar block pr-10 p-3 appearance-none font-bold"
            >
              <option value="all">كل الأوقات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">المشرف</th>
                <th className="px-6 py-4 font-bold">العملية</th>
                <th className="px-6 py-4 font-bold">التفاصيل</th>
                <th className="px-6 py-4 font-bold">التاريخ</th>
                <th className="px-6 py-4 font-bold text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const style = getActionStyle(log.action);
                  const Icon = style.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold text-sm">
                            {(log.userName || '؟').charAt(0)}
                          </div>
                          <span className="font-bold text-carbon">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${style.bg} ${style.color} ${style.border} text-xs font-bold`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{log.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                        <div className="flex flex-col">
                          <span>{new Date((log.date as any)?.seconds ? (log.date as any).seconds * 1000 : log.date).toLocaleDateString('ar-EG')}</span>
                          <span>{new Date((log.date as any)?.seconds ? (log.date as any).seconds * 1000 : log.date).toLocaleTimeString('ar-EG')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono text-left" dir="ltr">
                        {log.ip || '192.168.1.1'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Activity className="w-12 h-12 text-gray-200" />
                      <p className="font-bold">لا توجد نشاطات مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-gray-50">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => {
              const style = getActionStyle(log.action);
              const Icon = style.icon;
              return (
                <div key={log.id} className="p-4 space-y-3 hover:bg-gray-50/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-solar/10 flex items-center justify-center text-solar font-bold text-sm">
                        {(log.userName || '؟').charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-carbon block">{log.userName}</span>
                        <span className="text-xs text-gray-400 font-mono" dir="ltr">{log.ip || '192.168.1.1'}</span>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${style.bg} ${style.color} ${style.border} text-xs font-bold`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{log.action}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">{log.details}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date((log.date as any)?.seconds ? (log.date as any).seconds * 1000 : log.date).toLocaleString('ar-EG')}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
              <Activity className="w-12 h-12 text-gray-200" />
              <p className="font-bold">لا توجد نشاطات مطابقة للبحث</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500 font-medium">
              صفحة {currentPage} من {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-carbon hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white text-carbon hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
