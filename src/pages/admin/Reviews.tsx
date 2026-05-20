import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { db, collectionGroup, getDocs, deleteDoc, doc, handleFirestoreError, OperationType } from "../../lib/firebase";
import { deleteImagesFromCloudinary } from "../../lib/cloudinary";
import { Review } from "../../types";
import {
  Search,
  Star,
  Trash2,
  Clock,
  Filter,
  CheckCircle2,
  Info,
  Calendar,
  ThumbsUp,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { showLuxuryToast } from "@/lib/luxuryToast";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function Reviews() {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    setIsFetching(true);
    try {
      const qs = await getDocs(collectionGroup(db, "reviews"));
      const reviewsData = qs.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as Review
      );
      // Sort: newest first
      reviewsData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllReviews(reviewsData);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      showLuxuryToast("error", {
        title: "خطأ في التحميل",
        description: "فشل استيراد تقييمات المنتجات من قاعدة البيانات"
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async () => {
    if (!deleteConfirmReview) return;
    const review = deleteConfirmReview;
    try {
      if (review.images && review.images.length > 0) {
        deleteImagesFromCloudinary(review.images);
      }
      await deleteDoc(doc(db, "products", review.productId, "reviews", review.id));
      setAllReviews((prev) => prev.filter((r) => r.id !== review.id));
      showLuxuryToast("success", {
        title: "تم حذف التقييم",
        description: "تمت إزالة مراجعة العميل بنجاح من قاعدة البيانات"
      });
      setDeleteConfirmReview(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${review.productId}/reviews/${review.id}`);
    }
  };

  const filteredReviews = useMemo(() => {
    return allReviews.filter((review) => {
      const matchesSearch =
        (review.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.comment || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = ratingFilter === "all" || review.rating === ratingFilter;

      return matchesSearch && matchesRating;
    });
  }, [allReviews, searchTerm, ratingFilter]);

  // Stat calculation
  const stats = useMemo(() => {
    const total = allReviews.length;
    if (total === 0) return { avg: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    let sum = 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    
    allReviews.forEach((r) => {
      sum += r.rating;
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    });

    return {
      avg: Number((sum / total).toFixed(1)),
      5: counts[5],
      4: counts[4],
      3: counts[3],
      2: counts[2],
      1: counts[1],
    };
  }, [allReviews]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full pb-24 bg-bg-general min-h-screen relative font-sans pt-8"
      dir="rtl"
    >
      {/* Title */}
      <div className="px-4 sm:px-8 lg:px-12 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-sm">
            <Star className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-carbon tracking-tight">
              تقييمات ومراجعات المنتجات
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-0.5 sm:mt-1">
              عرض آراء العملاء وتقييماتهم والتحكم بمصداقيتها وحذف التقييمات الوهمية
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Card Block */}
      <div className="px-4 sm:px-8 lg:px-12 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total & Average */}
        <div className="bg-white rounded-[24px] border border-bg-hover p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">التقييم العام للمتجر</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-carbon">{stats.avg}</span>
              <span className="text-sm font-bold text-slate-500">من 5</span>
            </div>
            <div className="flex items-center gap-0.5 text-solar mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(stats.avg) ? "fill-current" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-solar/5 flex items-center justify-center text-solar border border-solar/10">
            <Star className="w-8 h-8 fill-current" />
          </div>
        </div>

        {/* Counter Card */}
        <div className="bg-white rounded-[24px] border border-bg-hover p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">إجمالي التقييمات</p>
            <span className="text-4xl font-black text-carbon">{allReviews.length}</span>
            <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>مراجعة وتقييم مسجل</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
            <ThumbsUp className="w-8 h-8" />
          </div>
        </div>

        {/* Breakdown progress bars */}
        <div className="bg-white rounded-[24px] border border-bg-hover p-6 shadow-sm flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = (stats as any)[stars] || 0;
            const percentage = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-3 font-bold text-slate-500">{stars}</span>
                <Star className="w-3 h-3 text-solar fill-current" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-solar rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-left font-bold text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Actions Row */}
      <div className="px-4 sm:px-8 lg:px-12 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-bg-hover flex flex-col md:flex-row items-center gap-4 justify-between shadow-sm-soft">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم العميل أو نص التقييم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-bg-general border border-slate-200/80 rounded-2xl text-sm font-semibold text-carbon focus:outline-none focus:ring-2 focus:ring-solar/20 focus:border-solar transition-all"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto self-stretch">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-2">
              <Filter className="w-3.5 h-3.5" />
              <span>تصفية بالنجوم:</span>
            </span>
            <button
              onClick={() => setRatingFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                ratingFilter === "all"
                  ? "bg-solar text-white shadow-lg shadow-solar/15"
                  : "bg-bg-general text-slate-500 border border-slate-100 hover:bg-slate-100"
              }`}
            >
              الكل
            </button>
            {[5, 4, 3, 2, 1].map((stars) => (
              <button
                key={stars}
                onClick={() => setRatingFilter(stars)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                  ratingFilter === stars
                    ? "bg-solar text-white shadow-lg shadow-solar/15"
                    : "bg-bg-general text-slate-500 border border-slate-100 hover:bg-slate-100"
                }`}
              >
                <span>{stars}</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List Grid */}
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="bg-white rounded-[32px] sm:rounded-[40px] shadow-sm border border-bg-hover overflow-hidden">
          <div className="flex flex-col">
            {filteredReviews.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-3xl mx-auto mb-4">
                  <Star className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-500 font-bold">لم يتم العثور على أي تقييمات مطابقة</p>
                {allReviews.length === 0 && isFetching && (
                  <p className="text-xs text-slate-400 mt-2 animate-pulse">جاري تحديث البيانات من السيرفر...</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-bg-hover">
                {filteredReviews.map((review) => {
                  const productObj = products.find((p) => p.id === review.productId);
                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Avatar and Info Block */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-bg-general shrink-0 border border-bg-hover flex items-center justify-center">
                            <img
                              src={
                                review.userImage ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                  review.userName || review.id
                                )}`
                              }
                              alt="Avatar"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-carbon text-sm">
                              {review.userName || "مستخدم مجهول"}
                            </h4>
                            <div className="flex items-center gap-1 text-solar mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating ? "fill-current" : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Comment text */}
                        <p className="text-carbon/80 text-sm font-medium pr-14 leading-relaxed mt-2">
                          {review.comment || (
                            <span className="text-slate-400 italic">قيم العميل المنتج بالنجوم فقط وبدون تعليق</span>
                          )}
                        </p>

                        {/* Review uploaded images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pr-14">
                            {review.images.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-16 h-16 rounded-xl overflow-hidden border border-bg-hover hover:border-solar transition-all block"
                              >
                                <img
                                  src={url}
                                  alt="إثبات العميل"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 font-bold mt-3 pr-14 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(review.createdAt).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs leading-none">
                            منتج: {productObj ? productObj.name : "منتج غير معروف أو محذوف"}
                          </span>
                        </div>
                      </div>

                      {/* Delete actions */}
                      <div className="flex items-center gap-2 pr-14 md:pr-0 self-end md:self-center shrink-0">
                        <button
                          onClick={() => setDeleteConfirmReview(review)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف التقييم</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation code */}
      <ConfirmationModal
        isOpen={!!deleteConfirmReview}
        onClose={() => setDeleteConfirmReview(null)}
        onConfirm={handleDeleteReview}
        title="حذف التقييم نهائياً"
        message="هل أنت متأكد من رغبتك في حذف هذا التقييم؟ سيتم حذفه على الفور من صفحة المنتج ولا يمكن لمشتركي المتجر رؤيته تارة أخرى."
        type="danger"
        confirmText="نعم، حذف التقييم"
      />
    </motion.div>
  );
}
