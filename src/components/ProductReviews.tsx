import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  db,
  getDocs,
  OperationType,
  handleFirestoreError
} from "../lib/firebase";
import { Review } from "../types";
import { useStore } from "../context/StoreContext";
import { motion, AnimatePresence } from "motion/react";
import { Star, MessageSquare, Send, User, Check, AlertCircle, Image as ImageIcon, X, BadgeCheck, ChevronDown } from "lucide-react";
import { VoiceButton } from "./admin/VoiceButton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const { user } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    console.log("DEBUG [ProductReviews]: Setting up listener. Props.productId:", productId);
    const reviewsRef = collection(db, "products", productId, "reviews");
    
    console.log("DEBUG [ProductReviews]: Firestore path:", `products/${productId}/reviews`);
    
    const q = query(
      reviewsRef,
      orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => {
        const rawDate = doc.data().createdAt;
        const createdAt = (rawDate && typeof rawDate === 'object' && 'toDate' in rawDate)
          ? (rawDate as any).toDate().toISOString()
          : (typeof rawDate === 'string' ? rawDate : new Date().toISOString());
        return {
          id: doc.id,
          ...doc.data(),
          createdAt
        };
      }) as Review[];
      
      console.log("DEBUG [ProductReviews]: Received real-time reviews for productId:", productId, "Count:", reviewsData.length);
      setReviews(reviewsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching real-time reviews for", productId, ":", error);
      setIsLoading(false);
    });

    return () => {
      console.log("DEBUG [ProductReviews]: Cleaning up listener for", productId);
      unsub();
    };
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً لإضافة تقييم");
      return;
    }

    if (comment.trim().length < 5) {
      toast.error("يرجى كتابة تعليق أطول قليلاً");
      return;
    }

    setIsSubmitting(true);
    const path = `products/${productId}/reviews`;
    console.log("DEBUG [ProductReviews]: Submitting review to:", path, "for productId:", productId);
    
    try {
      await addDoc(collection(db, "products", productId, "reviews"), {
        productId,
        userId: user.uid,
        userName: user.name || user.displayName || "عميل مجهول",
        userImage: user.avatar || user.photoURL || "",
        rating,
        comment: comment.trim(),
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setComment("");
      setRating(5);
      setShowForm(false);
      toast.success("تم إضافة تقييمك بنجاح! شكراً لك.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 
      : 0
  }));

  return (
    <div className="mt-8 pt-8 border-t border-slate-100 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Simplified Review Submission - Always visible or very prominent */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-carbon mb-1">آراء العملاء</h3>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={12}
                      className={`${s <= Math.round(averageRating) ? "fill-solar text-solar" : "text-slate-200"}`} 
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black text-slate-400">{reviews.length} تقييم</span>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-solar text-carbon rounded-xl font-black text-xs shadow-lg shadow-solar/20 active:scale-95 transition-all"
              >
                إضافة تقييمك
              </button>
            )}
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 sm:p-8 bg-white rounded-[2rem] border-2 border-solar/20 relative shadow-xl shadow-solar/5 mb-10 overflow-hidden">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full transition-all z-20 shadow-sm"
                    title="إغلاق"
                  >
                    <X size={20} />
                  </button>

                  <form onSubmit={handleSubmitReview} className="relative pt-2">
                    <div className="mb-10 text-center px-8">
                      <h4 className="font-black text-carbon text-lg mb-2">شاركنا تجربتك مع المنتج</h4>
                      <div className="w-12 h-1 bg-solar mx-auto rounded-full mb-3" />
                      <p className="text-[10px] text-slate-400 font-bold max-w-[280px] mx-auto leading-relaxed">رأيك يساعدنا في تقديم الأفضل دائماً ويساعد العملاء في اختيار الأنسب لهم</p>
                    </div>

                    <div className="flex justify-center gap-3 mb-8">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button 
                          key={s} 
                          type="button" 
                          onClick={() => setRating(s)}
                          className="group transition-transform active:scale-90"
                        >
                          <Star 
                            size={32}
                            className={`transition-all duration-300 ${s <= rating ? "fill-solar text-solar drop-shadow-sm scale-110" : "text-slate-200"}`} 
                          />
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="اكتب رأيك الصادق هنا..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-solar/10 focus:border-solar outline-none transition-all h-32 resize-none mb-6"
                      />
                      <div className="absolute bottom-10 left-5">
                       <VoiceButton onTranscript={(tr) => setComment((prev) => prev + " " + tr)} />
                      </div>
                    </div>

                    <button
                      disabled={isSubmitting}
                      className="w-full py-4.5 bg-carbon text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl shadow-carbon/20 hover:bg-black active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={16} className="rotate-180" />
                          نشر تقييمي الآن
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews Feed */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">آخر التقييمات</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {isLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-50 h-32 rounded-3xl" />
              ))
            ) : reviews.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} className="text-slate-200" />
                </div>
                <h4 className="text-sm font-black text-slate-400">لا توجد تقييمات بعد</h4>
                <p className="text-[10px] font-bold text-slate-300">كن أول من يترك بصمته هنا</p>
              </div>
            ) : (
              (showAll ? reviews : reviews.slice(0, 4)).map((review) => (
                <motion.div 
                  key={review.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white rounded-[2rem] border border-slate-100 hover:border-solar/20 hover:shadow-xl hover:shadow-solar/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {review.userImage ? (
                          <img src={review.userImage} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-black text-xs text-carbon truncate max-w-[120px] sm:max-w-[150px]">{review.userName}</span>
                          <BadgeCheck size={14} className="text-solar fill-solar/10 shrink-0" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mt-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} className={`${s <= review.rating ? "fill-solar text-solar" : "text-slate-100"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">{review.comment}</p>
                </motion.div>
              ))
            )}
          </div>

          {reviews.length > 4 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-8 py-3 bg-white border-2 border-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-carbon transition-all flex items-center gap-2 group"
              >
                {showAll ? "عرض أقل" : `عرض المزيد (${reviews.length - 4})`}
                <ChevronDown size={14} className={`transition-transform duration-300 ${showAll ? "rotate-180" : "group-hover:translate-y-0.5"}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
