import React, { useEffect, useState } from 'react';
import { Cloud, Loader2, RefreshCw, Trash2, Eye, CheckSquare, Square, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  bytes: number;
}

interface UsageStats {
  plan: string;
  storage: {
    usage: number;
    limit: number;
  };
}

export default function CloudPage() {
  const store = useStore();
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [imgRes, usageRes] = await Promise.all([
        fetch('/api/cloudinary?action=images'),
        fetch('/api/cloudinary?action=usage')
      ]);
      if (!imgRes.ok || !usageRes.ok) throw new Error('فشل جلب البيانات');
      const contentType = imgRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('السيرفر أرجع استجابة غير صالحة (HTML بدلاً من JSON)');
      }

      const imgData = await imgRes.json();
      const usageData = await usageRes.json();
      setImages(imgData.images);
      setUsage(usageData);
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب البيانات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deleteImage = async (id: string) => {
    if (!confirm(`هل أنت متأكد من حذف هذه الصورة؟`)) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/cloudinary?action=bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_ids: [id] })
      });
      if (!response.ok) throw new Error('فشل الحذف');
      toast.success('تم حذف الصورة');
      setSelectedIds(prev => prev.filter(i => i !== id));
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} صورة؟`)) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/cloudinary?action=bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_ids: selectedIds })
      });
      if (!response.ok) throw new Error('فشل الحذف');
      toast.success('تم حذف الصور المختارة');
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const selectUnusedImages = () => {
    try {
      const everything = JSON.stringify({
        products: store.products,
        categories: store.categories,
        banners: store.banners,
        settings: store.settings,
        blogPosts: store.blogPosts,
        marketing: store.marketingNotifications,
        orders: store.orders,
        users: store.customers,
        tickets: store.supportTickets,
        pages: store.staticPages,
        carts: store.abandonedCarts
      });

      const unusedIds = images.filter(img => {
        const parts = img.public_id.split('/');
        const shortId = parts[parts.length - 1]; // Just the file name part without the folder
        
        // Exact URL match
        const hasUrl = everything.includes(img.secure_url);
        
        // ID match (prevent false positives if the ID is just a 1 or 2 letter word, but Cloudinary random strings are 20 chars long)
        const hasId = shortId.length > 5 ? everything.includes(shortId) : everything.includes(img.public_id);
        
        return !hasUrl && !hasId;
      }).map(img => img.public_id);

      setSelectedIds(unusedIds);
      
      if (unusedIds.length > 0) {
        toast.success(`تم تحديد ${unusedIds.length} صورة غير مستخدمة`);
      } else {
        toast.info('جميع الصور مستخدمة حالياً في التطبيق أو الطلبات');
      }
    } catch(err) {
      toast.error("حدث خطأ أثناء فحص الصور");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Cloud className="w-8 h-8 text-solar" />
          السحابة (Cloudinary)
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={selectUnusedImages}
            disabled={images.length === 0}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            title="تحديد الصور التي لا تظهر في أي منتج أو إعلان في المتجر"
          >
            <Wand2 className="w-4 h-4" />
            تحديد غير المستخدم
          </button>
          {selectedIds.length > 0 && (
            <button 
              onClick={bulkDelete}
              disabled={deleting}
              className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-600 transition-colors disabled:bg-slate-400"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف المختار ({selectedIds.length})
            </button>
          )}
          <button onClick={fetchData} className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors" title="تحديث">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-solar" /></div>
      ) : (
        <div className="space-y-6">
          {usage && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">استهلاك التخزين</h3>
                <p className="text-xs text-slate-500 font-medium">استخدمت {Math.round(usage.storage.usage / (1024 * 1024))} ميجابايت من إجمالي {Math.round(usage.storage.limit / (1024 * 1024))} ميجابايت</p>
              </div>
              <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-solar" style={{ width: `${(usage.storage.usage / usage.storage.limit) * 100}%` }}></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((img) => (
              <div key={img.public_id} className={`bg-white p-2 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group ${selectedIds.includes(img.public_id) ? 'ring-2 ring-solar' : ''}`}>
                <div className="relative">
                  <img src={img.secure_url} alt={img.public_id} className="w-full h-40 object-cover rounded-xl" referrerPolicy="no-referrer" />
                  <button onClick={() => toggleSelect(img.public_id)} className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-lg text-white z-10 transition-colors hover:bg-black/70">
                    {selectedIds.includes(img.public_id) ? <CheckSquare className="w-4 h-4 text-solar" /> : <Square className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(img.public_id);
                    }} 
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-lg text-white z-10 hover:bg-rose-600 transition-colors shadow-sm"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-xl">
                    <a href={img.secure_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-slate-900">
                      <Eye className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="p-2 text-[10px] text-slate-400 font-medium truncate">{img.public_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
