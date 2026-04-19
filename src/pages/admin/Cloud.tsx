import React, { useEffect, useState } from 'react';
import { Cloud, Loader2, RefreshCw, Trash2, Eye, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

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
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [imgRes, usageRes] = await Promise.all([
        fetch('/api/cloudinary/images'),
        fetch('/api/cloudinary/usage')
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

  const bulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} صورة؟`)) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/cloudinary/bulk-delete', {
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
                  <button onClick={() => toggleSelect(img.public_id)} className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-lg text-white">
                    {selectedIds.includes(img.public_id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity rounded-xl">
                    <a href={img.secure_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-slate-900">
                      <Eye className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => {
                        setSelectedIds([img.public_id]);
                        bulkDelete();
                      }}
                      className="p-2 bg-rose-500 rounded-full text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
