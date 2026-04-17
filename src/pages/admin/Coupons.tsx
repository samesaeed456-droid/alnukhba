import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Tag, Percent, DollarSign, Calendar, Users, Power, PowerOff, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';
import ConfirmationModal from '../../components/ConfirmationModal';
import FloatingInput from '../../components/FloatingInput';

export default function Coupons() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, formatPrice } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderValue: '',
    expiryDate: '',
    usageLimit: '',
    isActive: true
  });

  const filteredCoupons = coupons.filter(coupon => 
    (coupon.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        minOrderValue: coupon.minOrderValue ? coupon.minOrderValue.toString() : '',
        expiryDate: coupon.expiryDate || '',
        usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
        isActive: coupon.isActive
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderValue: '',
        expiryDate: '',
        usageLimit: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData = {
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : undefined,
      expiryDate: formData.expiryDate || undefined,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      isActive: formData.isActive
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, couponData);
    } else {
      addCoupon(couponData);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="البحث عن كوبون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar transition-all bg-white shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-solar text-white px-6 py-3 rounded-2xl font-bold hover:bg-solar/90 transition-all shadow-lg shadow-solar/20 active:scale-95 justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة كوبون جديد</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-600">الكود</th>
                <th className="p-4 font-bold text-gray-600">الخصم</th>
                <th className="p-4 font-bold text-gray-600">الحد الأدنى للطلب</th>
                <th className="p-4 font-bold text-gray-600">تاريخ الانتهاء</th>
                <th className="p-4 font-bold text-gray-600">الاستخدام</th>
                <th className="p-4 font-bold text-gray-600">الحالة</th>
                <th className="p-4 font-bold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-carbon/5 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-carbon" />
                      </div>
                      <span className="font-bold text-carbon font-mono text-lg">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-solar text-lg">
                    {coupon.discountType === 'percentage' ? (
                      <span className="flex items-center gap-1">{coupon.discountValue}% <Percent className="w-4 h-4" /></span>
                    ) : (
                      formatPrice(coupon.discountValue)
                    )}
                  </td>
                  <td className="p-4 text-gray-600">
                    {coupon.minOrderValue ? formatPrice(coupon.minOrderValue) : 'لا يوجد'}
                  </td>
                  <td className="p-4 text-gray-600">
                    {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('ar-u-nu-latn') : 'مفتوح'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                        coupon.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${coupon.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      {coupon.isActive ? 'نشط' : 'معطل'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(coupon)}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="تعديل"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(coupon.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-carbon/5 flex items-center justify-center">
                  <Tag className="w-6 h-6 text-carbon" />
                </div>
                <div>
                  <h3 className="font-bold text-carbon font-mono text-xl">{coupon.code}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {coupon.isActive ? 'نشط' : 'معطل'}
                    </span>
                    {coupon.expiryDate && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(coupon.expiryDate).toLocaleDateString('ar-u-nu-latn')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-solar">
                  {coupon.discountType === 'percentage' ? (
                    <span className="flex items-center justify-end gap-1">{coupon.discountValue}% <Percent className="w-4 h-4" /></span>
                  ) : (
                    formatPrice(coupon.discountValue)
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">قيمة الخصم</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-50">
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400">الحد الأدنى للطلب</div>
                <div className="text-sm font-bold text-gray-700">
                  {coupon.minOrderValue ? formatPrice(coupon.minOrderValue) : 'لا يوجد'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400">مرات الاستخدام</div>
                <div className="text-sm font-bold text-gray-700 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => toggleCouponStatus(coupon.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all"
              >
                {coupon.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                <span>{coupon.isActive ? 'تعطيل' : 'تفعيل'}</span>
              </button>
              <button 
                onClick={() => handleOpenModal(coupon)}
                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setItemToDelete(coupon.id)}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">لا توجد نتائج</h3>
          <p className="text-gray-400 mt-1">لم نجد أي كوبونات تطابق بحثك الحالي</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-carbon">
                {editingCoupon ? 'تعديل كوبون' : 'إضافة كوبون جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <FloatingInput 
                label="كود الخصم"
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="مثال: SUMMER2026"
                startElement={<Tag className="w-5 h-5 text-gray-400" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 px-1">نوع الخصم</label>
                  <select 
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full h-14 px-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-solar/30 focus:border-solar outline-none bg-white transition-all font-bold text-carbon"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
                <FloatingInput 
                  label="قيمة الخصم"
                  required
                  type="number"
                  min="1"
                  step="any"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                  startElement={formData.discountType === 'percentage' ? <Percent className="w-5 h-5 text-gray-400" /> : <DollarSign className="w-5 h-5 text-gray-400" />}
                />
              </div>

              <FloatingInput 
                label="الحد الأدنى للطلب (اختياري)"
                type="number"
                min="0"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                placeholder="اتركه فارغاً إذا لم يوجد حد أدنى"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput 
                  label="تاريخ الانتهاء (اختياري)"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
                <FloatingInput 
                  label="حد الاستخدام (اختياري)"
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  placeholder="عدد المرات"
                  startElement={<Users className="w-5 h-5 text-gray-400" />}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.isActive ? 'bg-solar border-solar' : 'bg-white border-gray-300'}`}>
                  {formData.isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm font-bold text-gray-700">تفعيل الكوبون فوراً</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-solar text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-solar/20 active:scale-95"
                >
                  {editingCoupon ? 'حفظ التعديلات' : 'إضافة الكوبون'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            deleteCoupon(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="حذف الكوبون"
        message="هل أنت متأكد من رغبتك في حذف هذا الكوبون؟"
        confirmText="حذف"
        cancelText="تراجع"
        type="danger"
      />
    </div>
  );
}
