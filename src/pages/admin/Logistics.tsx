import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Truck, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Globe, 
  DollarSign, 
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

const YEMEN_CITIES = [
  'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'المكلا', 'حجة', 'صعدة', 
  'البيضاء', 'مأرب', 'عمران', 'الجوف', 'المهرة', 'سقطرى', 'شبوة', 'أبين', 
  'لحج', 'الضالع', 'ريمة', 'المحويت'
];

const Logistics = () => {
  const { shippingZones, addShippingZone, updateShippingZone, deleteShippingZone, toggleShippingZoneStatus, formatPrice } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [formData, setFormData] = useState({
    city: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.city, // Use city name as the zone name
      cities: [formData.city], // Single city per entry
      rate: Number(formData.rate),
      freeThreshold: formData.freeThreshold ? Number(formData.freeThreshold) : undefined
    };

    if (editingZone) {
      updateShippingZone(editingZone.id, data);
    } else {
      addShippingZone(data);
    }
    setIsModalOpen(false);
    setEditingZone(null);
    setFormData({ city: '', rate: '', freeThreshold: '' });
  };

  const handleEdit = (zone: any) => {
    setEditingZone(zone);
    setFormData({
      city: zone.cities[0] || zone.name,
      rate: zone.rate.toString(),
      freeThreshold: zone.freeThreshold ? zone.freeThreshold.toString() : ''
    });
    setIsModalOpen(true);
  };

  // Filter out cities that already have a shipping rate defined (except the one being edited)
  const availableCities = YEMEN_CITIES.filter(city => 
    !shippingZones.some(zone => zone.cities.includes(city) && zone.id !== editingZone?.id)
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
          <p className="text-gray-400 text-sm mt-1">حدد تكلفة التوصيل لكل مدينة على حدة</p>
        </div>
        <button
          onClick={() => {
            setEditingZone(null);
            setFormData({ city: '', rate: '', freeThreshold: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-solar text-white px-6 py-3 rounded-2xl font-bold hover:bg-solar/90 transition-all shadow-lg shadow-solar/20 active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة سعر لمدينة</span>
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
                      title: 'حذف سعر الشحن',
                      message: `هل أنت متأكد من حذف سعر الشحن لمدينة "${zone.cities[0] || zone.name}"؟`,
                      onConfirm: () => deleteShippingZone(zone.id)
                    })}
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-carbon">{zone.cities[0] || zone.name}</h3>
                {!zone.isActive && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-bold rounded-full">
                    متوقف مؤقتاً
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-solar/10 rounded-xl text-solar font-black text-sm">
                  <DollarSign className="w-4 h-4" />
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
                  لا يوجد شحن مجاني لهذه المدينة
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
            <h3 className="text-xl font-black text-gray-700">لا توجد أسعار شحن</h3>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">ابدأ بإضافة أسعار الشحن للمدن اليمنية لتفعيل التوصيل</p>
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
                    {editingZone ? 'تعديل سعر المدينة' : 'إضافة سعر لمدينة'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 px-1">اختر المدينة</label>
                  <select 
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-solar/30 focus:border-solar outline-none bg-white transition-all font-bold text-carbon appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="">-- اختر مدينة --</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInput
                    label="سعر الشحن (ر.س)"
                    required
                    type="number"
                    min="0"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    startElement={<DollarSign className="w-5 h-5 text-gray-400" />}
                  />
                  <FloatingInput
                    label="حد الشحن المجاني (اختياري)"
                    type="number"
                    min="0"
                    value={formData.freeThreshold}
                    onChange={(e) => setFormData({ ...formData, freeThreshold: e.target.value })}
                    placeholder="اتركه فارغاً إذا لم يوجد"
                    startElement={<CheckCircle className="w-5 h-5 text-gray-400" />}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-solar text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-solar/20 active:scale-95"
                  >
                    {editingZone ? 'حفظ التعديلات' : 'إضافة السعر'}
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
