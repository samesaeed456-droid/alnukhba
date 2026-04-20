import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Plus, Search, Trash2, Edit, Check, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    isActive: true
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) && c.id !== 'all'
  );

  const handleOpenModal = (category: any = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image: category.image || '',
        description: category.description || '',
        isActive: category.isActive ?? true
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', image: '', description: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
    } else {
      addCategory(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen relative font-sans pt-4 sm:pt-8" dir="rtl">
      <div className="px-2 sm:px-8 lg:px-12 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-sm">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-carbon tracking-tight">إدارة الفئات</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">تحكم في فئات متجرك</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-carbon text-white px-7 py-3 rounded-2xl font-bold transition-all hover:bg-carbon/90 shadow-xl border border-white/10"
        >
          <Plus className="w-5 h-5 text-solar" />
          <span className="text-xs uppercase tracking-widest">إضافة فئة</span>
        </button>
      </div>

      <div className="px-2 sm:px-8 lg:px-12 mb-6">
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="ابحث عن فئة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-solar/20 transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-8 lg:px-12 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredCategories.map(category => (
            <motion.div key={category.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 group relative">
              <div className="relative w-full h-32 mb-4 rounded-xl overflow-hidden bg-slate-50">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">بدون صورة</div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-bold ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {category.isActive ? 'نشط' : 'مخفي'}
                </div>
              </div>
              <h3 className="text-lg font-black text-carbon mb-2">{category.name}</h3>
              <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2">{category.description || 'لا يوجد وصف'}</p>
              
              <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => handleOpenModal(category)} className="flex-1 py-2 bg-slate-50 text-carbon hover:bg-slate-100 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                  <Edit className="w-4 h-4" /> تعديل
                </button>
                <button onClick={() => { setCategoryToDelete(category.id); setDeleteModalOpen(true); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl relative z-10">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-black text-carbon mb-6">{editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">اسم الفئة</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-solar transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">رابط الصورة (اختياري)</label>
                  <input type="text" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-solar transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">الوصف (اختياري)</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-solar transition-colors resize-none" />
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${formData.isActive ? 'bg-solar text-white' : 'bg-slate-200 text-transparent'}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm font-bold text-carbon">التفعيل في المتجر المباشر</span>
                </div>
                
                <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">إلغاء</button>
                  <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-solar text-white hover:bg-solar/90 shadow-lg shadow-solar/20 hover:-translate-y-1 transition-all">{editingCategory ? 'حفظ التغييرات' : 'إضافة الفئة'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (categoryToDelete) deleteCategory(categoryToDelete);
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        title="حذف الفئة"
        message="هل أنت متأكد من حذف هذه الفئة؟ سيتم حذفها نهائياً ولا يمكن التراجع عن ذلك."
        confirmText="حذف الفئة"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
}
