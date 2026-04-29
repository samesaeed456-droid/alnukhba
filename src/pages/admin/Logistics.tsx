import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Truck, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Globe, 
  Banknote, 
  CheckCircle, 
  X,
  Package,
  Navigation,
  Search,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingInput from '../../components/FloatingInput';
import ConfirmationModal from '../../components/ConfirmationModal';

import { YEMEN_CITIES } from '../../constants';

const Logistics = () => {
  const { shippingZones, addShippingZone, updateShippingZone, deleteShippingZone, toggleShippingZoneStatus, formatPrice, showToast } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    cities: [] as string[],
    newCity: '',
    rate: '',
    freeThreshold: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.cities.length === 0 && !formData.newCity) {
      showToast('يرجى إضافة مدينة واحدة على الأقل', 'error');
      return;
    }

    const finalCities = [...formData.cities];
    if (formData.newCity) {
      if (!finalCities.includes(formData.newCity)) {
        finalCities.push(formData.newCity);
      }
    }

    const data = {
      name: formData.name || finalCities[0],
      cities: finalCities,
      rate: Number(formData.rate),
      freeThreshold: formData.freeThreshold ? Number(formData.freeThreshold) : undefined
    };

    try {
      if (editingZone) {
        await updateShippingZone(editingZone.id, data);
        showToast('تم تحديث سعر الشحن بنجاح');
      } else {
        await addShippingZone(data);
        showToast('تم إضافة سعر الشحن بنجاح');
      }
      setIsModalOpen(false);
      setEditingZone(null);
      setFormData({ name: '', cities: [], newCity: '', rate: '', freeThreshold: '' });
    } catch (error) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleEdit = (zone: any) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name || '',
      cities: zone.cities || [],
      newCity: '',
      rate: zone.rate.toString(),
      freeThreshold: zone.freeThreshold ? zone.freeThreshold.toString() : ''
    });
    setIsModalOpen(true);
  };

  const addCity = (city: string) => {
    if (!city) return;
    if (!formData.cities.includes(city)) {
      setFormData({ ...formData, cities: [...formData.cities, city], newCity: '' });
    } else {
      showToast('المدينة مضافة بالفعل في هذه المنطقة', 'info');
    }
  };

  const removeCity = (city: string) => {
    setFormData({ ...formData, cities: formData.cities.filter(c => c !== city) });
  };

  // Filter out cities that already have a shipping rate defined elsewhere
  const availablePresetCities = YEMEN_CITIES.filter(city => 
    !shippingZones.some(zone => 
      zone.id !== editingZone?.id && (zone.cities || []).includes(city)
    )
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-carbon flex items-center gap-3">
            <div className="w-10 h-10 bg-solar/10 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-solar" />
            </div>
            إدارة أسعار الشحن
          </h1>
          <p className="text-gray-400 text-sm mt-1">حدد تكلفة التوصيل لكل مدينة أو منطقة</p>
        </div>
        <button
          onClick={() => {
            setEditingZone(null);
            setFormData({ name: '', cities: [], newCity: '', rate: '', freeThreshold: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-solar text-white px-6 py-3 rounded-2xl font-bold hover:bg-solar/90 transition-all shadow-lg shadow-solar/20 active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة منطقة شحن</span>
        </button>
      </div>

      {/* Shipping Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shippingZones.map((zone) => (
          <motion.div 
            layout
            key={zone.id} 
            className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 ${!zone.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
          >
            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform ${!zone.isActive ? 'bg-gray-100' : ''}`}>
                  <MapPin className={`w-6 h-6 ${zone.isActive ? 'text-solar' : 'text-gray-400'}`} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleShippingZoneStatus(zone.id)}
                    className={`p-2.5 rounded-xl transition-all ${zone.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={zone.isActive ? 'إيقاف التوصيل مؤقتاً' : 'تفعيل التوصيل'}
                  >
                    {zone.isActive ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleEdit(zone)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setConfirmModal({
                      isOpen: true,
                      title: 'حذف منطقة الشحن',
                      message: `هل أنت متأكد من حذف منطقة الشحن "${zone.name || zone.cities?.[0] || ''}"؟`,
                      onConfirm: () => {
                        deleteShippingZone(zone.id);
                        showToast('تم حذف المنطقة بنجاح');
                      }
                    })}
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-black text-xl text-carbon truncate">{zone.name || zone.cities?.[0]}</h3>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {zone.cities?.map((city: string) => (
                  <span key={city} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100">
                    {city}
                  </span>
                ))}
                {!zone.isActive && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg border border-red-100">
                    متوقف مؤقتاً
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-solar/10 rounded-xl text-solar font-black text-sm">
                  <Banknote className="w-4 h-4" />
                  {formatPrice(zone.rate)}
                </div>
              </div>
            </div>
            <div className="p-6">
              {zone.freeThreshold ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-2xl font-bold">
                  <CheckCircle className="w-4 h-4" />
                  شحن مجاني للطلبات فوق {formatPrice(zone.freeThreshold)}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-2xl font-medium">
                  <Info className="w-4 h-4" />
                  لا يوجد شحن مجاني لهذه المنطقة
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {shippingZones.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Navigation className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-700">لا توجد مناطق شحن</h3>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">ابدأ بإضافة مناطق شحن لتحديد أسعار التوصيل لعملائك</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-solar rounded-xl flex items-center justify-center shadow-lg shadow-solar/20">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-carbon">
                    {editingZone ? 'تعديل منطقة الشحن' : 'إضافة منطقة شحن جديدة'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-gray-600 transition-all font-bold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <FloatingInput
                    label="اسم المنطقة (مثال: المدن الرئيسية)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 px-1">المدن في هذه المنطقة</label>
                    <div className="flex flex-wrap gap-2 p-3 min-h-[3rem] bg-gray-50 rounded-2xl border border-gray-100">
                      {formData.cities.map(city => (
                        <span key={city} className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl text-xs font-bold text-carbon border border-gray-200">
                          {city}
                          <button 
                            type="button" 
                            onClick={() => removeCity(city)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {formData.cities.length === 0 && <span className="text-gray-400 text-xs py-1">لا توجد مدن مضافة</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 px-2">اختر من القائمة</label>
                      <select 
                        onChange={(e) => {
                          if (e.target.value) addCity(e.target.value);
                          e.target.value = '';
                        }}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-solar/30 focus:border-solar outline-none bg-white transition-all font-bold text-carbon text-sm appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.75rem center', backgroundSize: '1.25rem' }}
                      >
                        <option value="">-- اختر مدينة --</option>
                        {availablePresetCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 px-2">أو اكتب اسم المدينة</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={formData.newCity}
                          onChange={(e) => setFormData({ ...formData, newCity: e.target.value })}
                          placeholder="اسم المدينة..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCity(formData.newCity);
                            }
                          }}
                          className="flex-1 h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-solar/30 focus:border-solar outline-none bg-white font-bold text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => addCity(formData.newCity)}
                          className="h-12 w-12 flex items-center justify-center bg-carbon text-white rounded-xl hover:bg-carbon/90 font-bold"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInput
                    label="سعر الشحن (ر.س)"
                    required
                    type="number"
                    min="0"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    startElement={<Banknote className="w-5 h-5 text-gray-400" />}
                  />
                  <FloatingInput
                    label="حد الشحن المجاني (اختياري)"
                    type="number"
                    min="0"
                    value={formData.freeThreshold}
                    onChange={(e) => setFormData({ ...formData, freeThreshold: e.target.value })}
                    placeholder="فارغ = لا يوجد"
                    startElement={<CheckCircle className="w-5 h-5 text-gray-400" />}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-[2] bg-solar text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-solar/20 active:scale-95 text-lg"
                  >
                    {editingZone ? 'حفظ التعديلات' : 'إضافة المنطقة'}
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
        confirmText="حذف السعر"
      />
    </div>
  );
};

export default Logistics;
