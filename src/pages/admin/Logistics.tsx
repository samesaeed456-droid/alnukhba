import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
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
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CityData } from "../../types";
import FloatingInput from "../../components/FloatingInput";
import ConfirmationModal from "../../components/ConfirmationModal";

import { YEMEN_CITIES } from "../../constants";

const Logistics = () => {
  const {
    cities,
    addCity,
    updateCity,
    deleteCity,
    formatPrice,
    showToast,
    syncOnDemand,
  } = useStore();

  React.useEffect(() => {
    syncOnDemand("cities");
  }, [syncOnDemand]);

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityData | null>(null);
  
  const [cityFormData, setCityFormData] = useState({
    name: "",
    districts: [] as string[],
    newDistrict: "",
    shippingRate: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [isSeeding, setIsSeeding] = useState(false);

  const seedYemenData = async () => {
    setIsSeeding(true);
    showToast("جاري استيراد كافة المدن والأحياء...", "info");
    
    const yemenDetailedData = [
      {
        name: "صنعاء - الأمانة",
        districts: [
          "حي السبعين", "ميدان السبعين", "حي الأصبحي", "حي بيت بوس", "حي وحدّة", "حي الارتل", "حي حزيز", "دار سلم", 
          "حي حده", "حده المدينة", "شارع جيبوتي", "شارع الجزائر", "شارع عمان", "شارع بغداد", "حي الوحدة", "الحي السياسي", 
          "حي فج عطان", "حي عصر", "حي الزبيري", "شارع صخر", "شارع مجاهد", "حي القادسية", "حي الصافية", "حارة النصر", 
          "حي التحرير", "شارع القصر", "شارع جمال", "شارع علي عبدالمغني", "شارع الإذاعة", "حي بئر العزب", "حي القاع", 
          "صنعاء القديمة", "باب اليمن", "حي الفليحي", "حي شعوب", "حي الفوارس", "شارع مأرب", "حي سعوان", "مدينة سعوان", 
          "حي جولة آية", "حي النصر", "حي الروضة", "حي مطار صنعاء", "حي الحصبة", "حي مازدا", "شارع التلفزيون", "حي النهضة", 
          "حي الثورة", "حي الجراف الغربي", "حي الجراف الشرقي", "حي تونس", "حي صوفان", "حي مذبح", "حي شملان", "حي السنينة"
        ]
      },
      {
        name: "محافظة صنعاء",
        districts: ["سنحان", "بني بهلول", "بني مطر", "الحيمة الخارجية", "الحيمة الداخلية", "بني حشيش", "خولان", "جحانة", "بلاد الروس", "ارحب", "همدان", "نهم", "صعفان", "مناخة"]
      },
      {
        name: "عدن",
        districts: [
          "كريتر (صيرة)", "حي القطيع", "حي شعب العيدروس", "حي الخساف", "حي الرزميت", "المعلا", "حي الروضة (المعلا)", "حي حافون", "حي المشروع", "التواهي", "حي القلوعة", "حي الفتح", "حي جولدمور", "خور مكسر", "حي السفارات", "حي ريمي", "حي أكتوبر", "حي السعادة", "حي العريش", "حي النصر (خور مكسر)", "الشيخ عثمان", "حي الممدارة", "حي عبد القوي", "حي السيلة", "حي الهاشمي", "المنصورة", "حي الدرين", "حي كابوتا", "حي إنماء", "حي التقنية", "حي القاهرة", "البريقة", "مدينة الشعب", "حي الحسوة", "حي أبو حربة", "حي فقم", "حي صعدة", "دار سعد", "حي اللحوم", "حي البساتين", "حي المصعبين"
        ]
      },
      {
        name: "تعز",
        districts: [
          "وسط المدينة (شارع جمال)", "حي المظفر", "حي القاهرة", "حي صالة", "حي الضبوعة", "حي المسبح", 
          "وادي القاضي", "حي الروضة", "حي زيد الموشكي", "حي عصيفرة", "حي الجمهوري", "حي الجحملية", 
          "حي المجلية", "حي ثعبات", "النسيرية", "حي المناخ", "حي كلابة", "حي الشماسي", "الحوبان", "مدينة الراهدة", "سوق السبت", "حي الضلعة", "دمنة خدير", "حيفان", "الصلو", "المواسط", "المعافر", "النشمة", "تربة ذبحان (الشمايتين)", "جبل حبشي", "مقبنة", "الوازعية", "ذو باب (المخا)", "ميناء المخا"
        ]
      },
      {
        name: "حضرموت",
        districts: [
          "المكلا - الشرج", "المكلا - الديس", "المكلا - فوة", "المكلا - روكب", "المكلا القديمة", "سيئون", "تريم", "الشحر", "القطن", "شبام", "ساه", "دوعن", "غيل باوزير", "غيل بن يمين", "الريدة وقصيعر", "حجر الصيعر", "عبر عثمان", "جول مسحة"
        ]
      },
      {
        name: "إب",
        districts: [
          "حي الظهار", "حي المشنة", "جبلة", "السياني", "ذي السفال", "يريم", "السدة", "النادرة", 
          "العدين", "حبيش", "المحمول", "بعدان", "القفر", "مذيخرة", "فرع العدين", "حي المجمعة", "حي المعاين", "الرضمة", "المخادر", "حزم العدين"
        ]
      },
      {
        name: "الحديدة",
        districts: [
          "حي الحوك", "حي الميناء", "حي الحالي", "باجل", "بيت الفقيه", "زبيد", "القطيع", "كيلو 16", 
          "حي الربصة", "حي الشهداء", "غليفقة", "الزيدية", "الضحي", "القناوص", "المنصورية", "التحيتا", "الخوخة", "الدريهمي", "حيس", "اللحية", "برع", "جبل السخنة"
        ]
      },
      {
        name: "ذمار",
        districts: ["مدينة ذمار", "حي عنس", "معبر", "ضوران آنس", "الحداء", "وصاب العالي", "وصاب السافل", "عتمة", "حي الجمارك", "حي المحافظة", "حي الدرب", "مغرب عنس", "جبل الشرق"]
      },
      {
        name: "عمران",
        districts: ["مدينة عمران", "خمر", "ريدة", "حوث", "ثلاء", "شهارة", "عيال سريح", "مسور", "حرف سفيان", "جبل عيال يزيد", "السود", "السودة"]
      },
      {
        name: "حجة",
        districts: ["مدينة حجة", "المحابشة", "عبس", "حرض", "ميدي", "كشر", "كعيدنة", "الشاهل", "كحلان عفار", "كحلان الشرف", "أفلح اليمن", "أفلح الشام", "خيري"]
      },
      {
        name: "صعدة",
        districts: ["مدينة صعدة", "سحار", "الصفراء", "مجز", "حيدان", "كتاف والبقع", "باقم", "رازح", "منبه", "شدا", "غمر", "الظاهر"]
      },
      {
        name: "مأرب",
        districts: ["مدينة مأرب", "وادي مأرب", "حريب", "الجوبة", "صرواح", "مجزر", "رغوان", "مدغل", "ماهلية", "العبدية", "رحبة", "قانية"]
      },
      {
        name: "أبين",
        districts: ["زنجبار", "جعار", "لودر", "مودية", "أحور", "المحفد", "شقرة", "رصد", "سرار", "جيشان", "سباح", "الوضيع"]
      },
      {
        name: "البيضاء",
        districts: ["مدينة البيضاء", "رداع", "مكيراس", "السوادية", "الزاهر", "ذي ناعم", "الطفة", "ناطع", "نعمان", "صباح", "الرياشية", "العرش"]
      },
      {
        name: "شبوة",
        districts: ["عتق", "بيحان", "عزان", "حبان", "ميفعة", "نصاب", "رضوم", "الروضة", "جردان", "دهر", "عرماء", "الطلح", "عين"]
      },
      {
        name: "لحج",
        districts: ["الحوطة", "تبن", "ردفان", "يافع (لبعوس)", "يافع (يهر)", "المقاطرة", "الملاح", "حبيل جبر", "المضاربة والشط", "المسيمير", "طور الباحة", "القبيطة"]
      },
      {
        name: "الضالع",
        districts: ["مدينة الضالع", "قعطبة", "دمت", "حجر", "الأزارق", "الشعيب", "الحصين", "جحاف", "حي المطار (الضالع)", "جبن"]
      },
      {
        name: "المهرة",
        districts: ["الغيضة", "شحن", "حوف", "قشن", "سيحوت", "المسيلة", "منعر", "حات", "حصوين"]
      },
      {
        name: "الجوف",
        districts: ["الحزم", "المصلوب", "برط العنان", "خب والشعف", "المتون", "الزاهر", "الحميدات", "المطمة", "رجوزة", "خراب المراشي"]
      },
      {
        name: "ريمة",
        districts: ["الجبين", "كسمة", "مزهر", "بلاد الطعام", "الجعفرية", "السلفية"]
      },
      {
        name: "المحويت",
        districts: ["مدينة المحويت", "شبام كوكبان", "الطويلة", "الرجم", "ملحان", "حفاش", "بني سعد", "الخبت"]
      },
      {
        name: "سقطرى",
        districts: ["حديبو", "قلنسية", "مومي", "نوجد", "عبد الكوري", "سمحة"]
      }
    ];

    try {
      for (const city of yemenDetailedData) {
        // Check if city already exists in the local state to avoid duplicates
        const alreadyExists = cities.some(c => c.name === city.name);
        if (alreadyExists) continue;

        await addCity({
          name: city.name,
          districts: city.districts,
          isActive: true
        } as any);
      }
      showToast("تم استيراد كافة المدن والمناطق اليمنية بنجاح!", "success");
      if (typeof syncOnDemand === 'function') syncOnDemand("cities");
    } catch (error) {
      showToast("حدث خطأ أثناء الاستيراد", "error");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmitCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityFormData.name) {
      showToast("يرجى إدخال اسم المدينة", "error");
      return;
    }

    const data = {
      name: cityFormData.name,
      districts: cityFormData.districts,
      shippingRate: parseFloat(cityFormData.shippingRate) || 0,
      isActive: true,
    };

    if (editingCity) {
      await updateCity(editingCity.id, data);
    } else {
      await addCity(data as any);
    }

    setIsCityModalOpen(false);
  };

  const addCityDistrict = (district: string) => {
    if (!district) return;
    if (!cityFormData.districts.includes(district)) {
      setCityFormData({
        ...cityFormData,
        districts: [...cityFormData.districts, district],
        newDistrict: "",
      });
    }
  };

  const removeCityDistrict = (district: string) => {
    setCityFormData({
      ...cityFormData,
      districts: cityFormData.districts.filter((d) => d !== district),
    });
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-carbon flex items-center gap-3">
            <div className="w-9 h-9 bg-solar/10 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-solar" />
            </div>
            إدارة المدن والمناطق
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            إدارة {cities.length} مدينة ومحافظة مسجلة
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن مدينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pr-11 pl-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-solar/20 outline-none"
            />
          </div>
          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: "استيراد شامل لمدن اليمن",
                message: "هل تريد حقاً استيراد كافة المدن والمناطق اليمنية؟ سيوفر عليك هذا مجهود الإدخال اليدوي.",
                onConfirm: seedYemenData,
              });
            }}
            disabled={isSeeding}
            className="flex items-center gap-2 bg-carbon text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-carbon/90 transition-all active:scale-95 disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" />
            <span>{isSeeding ? "جاري..." : "استيراد الكل"}</span>
          </button>
          <button
            onClick={() => {
              setEditingCity(null);
              setCityFormData({
                name: "",
                districts: [],
                newDistrict: "",
              });
              setIsCityModalOpen(true);
            }}
            className="flex items-center gap-2 bg-solar text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-solar/90 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مدينة</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCities.map((city) => (
          <motion.div
            layout
            key={city.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-solar/5 rounded-lg flex items-center justify-center border border-solar/10">
                    <MapPin className="w-4 h-4 text-solar" />
                  </div>
                  <h3 className="text-sm font-black text-carbon truncate max-w-[120px]">{city.name}</h3>
                </div>
                {city.shippingRate !== undefined && (
                  <span className="text-[10px] bg-solar/10 text-solar px-1.5 py-0.5 rounded font-black">
                    {formatPrice(city.shippingRate)}
                  </span>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCity(city);
                      setCityFormData({
                        name: city.name,
                        districts: city.districts || [],
                        newDistrict: "",
                        shippingRate: city.shippingRate?.toString() || "",
                      });
                      setIsCityModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-solar hover:bg-solar/5 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: "حذف مدينة",
                        message: `هل أنت متأكد من حذف مدينة ${city.name}؟`,
                        onConfirm: () => deleteCity(city.id),
                      });
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 min-h-[44px] content-start">
                {(city.districts || []).slice(0, 3).map((d) => (
                  <span key={d} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-black rounded-md border border-gray-100">
                    {d}
                  </span>
                ))}
                {(city.districts?.length || 0) > 3 && (
                  <span className="px-1.5 py-0.5 text-gray-400 text-[9px] font-bold">
                    +{(city.districts?.length || 0) - 3}
                  </span>
                )}
                {(city.districts?.length || 0) === 0 && (
                  <span className="text-[9px] text-gray-300 font-bold italic">لا توجد مناطق</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {filteredCities.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-gray-500 font-bold text-sm">لم يتم العثور على نتائج</h3>
          </div>
        )}
      </div>


      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isCityModalOpen && (
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
                    {editingCity ? "تعديل مدينة" : "إضافة مدينة جديدة"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsCityModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-carbon transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitCity} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-widest">
                      اسم المدينة
                    </label>
                    <input
                      type="text"
                      required
                      value={cityFormData.name}
                      onChange={(e) => setCityFormData({ ...cityFormData, name: e.target.value })}
                      placeholder="مثال: صنعاء، تعز، عدن..."
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-solar/30 focus:border-solar outline-none bg-white font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-widest">
                      سعر الشحن للمدينة
                    </label>
                    <input
                      type="number"
                      value={cityFormData.shippingRate}
                      onChange={(e) => setCityFormData({ ...cityFormData, shippingRate: e.target.value })}
                      placeholder="أدخل السعر..."
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-solar/30 focus:border-solar outline-none bg-white font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-widest">
                      المناطق التابعة
                    </label>
                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 min-h-[60px] max-h-[220px] overflow-y-auto custom-scrollbar">
                      <div className="flex flex-wrap gap-1.5">
                        {cityFormData.districts.map((district) => (
                          <span
                            key={district}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[11px] font-black text-carbon border border-gray-100 shadow-sm"
                          >
                            {district}
                            <button
                              type="button"
                              onClick={() => removeCityDistrict(district)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {cityFormData.districts.length === 0 && (
                          <span className="text-gray-400 text-xs py-1">لا توجد مناطق مضافة</span>
                        )}
                      </div>
                    </div>
                  </div>


                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-widest">
                      أضف منطقة جديدة لهذه المدينة
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cityFormData.newDistrict}
                        onChange={(e) => setCityFormData({ ...cityFormData, newDistrict: e.target.value })}
                        placeholder="اسم الحي أو المنطقة..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCityDistrict(cityFormData.newDistrict);
                          }
                        }}
                        className="flex-1 h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-solar/30 focus:border-solar outline-none bg-white font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => addCityDistrict(cityFormData.newDistrict)}
                        className="h-12 w-12 flex items-center justify-center bg-solar text-white rounded-xl hover:bg-solar/90 font-bold"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                  <button
                    type="submit"
                    className="flex-[2] bg-solar text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-solar/20 active:scale-95 text-lg"
                  >
                    {editingCity ? "حفظ التعديلات" : "إضافة المدينة"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCityModalOpen(false)}
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
