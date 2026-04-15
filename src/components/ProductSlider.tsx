import React, { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { FastLink } from './FastLink';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductSliderProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
}

export default React.memo(function ProductSlider({ title, subtitle, products, viewAllLink }: ProductSliderProps) {
  const swiperRef = useRef<SwiperType>(null);

  const handlePrev = useCallback(() => {
    if (!swiperRef.current) return;
    swiperRef.current.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!swiperRef.current) return;
    swiperRef.current.slideNext();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="px-2 sm:px-6 mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={handlePrev} 
          className="hidden sm:flex lg:hidden w-10 h-10 items-center justify-center text-carbon hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        
        <div className="text-center lg:text-right flex-1 px-4 lg:px-0">
          <h2 className="text-xl lg:text-xl font-black text-carbon mb-1">{title}</h2>
          {subtitle && <p className="text-titanium/60 font-medium text-sm lg:text-sm">{subtitle}</p>}
        </div>

        <button 
          onClick={handleNext} 
          className="hidden sm:flex lg:hidden w-10 h-10 items-center justify-center text-carbon hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {viewAllLink && (
          <FastLink to={viewAllLink} prefetchPage="Search" className="hidden lg:flex text-base font-bold text-carbon hover:underline items-center gap-1 group">
            عرض الكل
            <ChevronLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          </FastLink>
        )}
      </div>
      
      {/* Mobile & Tablet Slider */}
      <div 
        className="lg:hidden -mx-2 sm:mx-0 relative"
        style={{ 
          '--swiper-pagination-color': '#C5A059', 
          '--swiper-pagination-bullet-inactive-color': '#cbd5e1',
          '--swiper-pagination-bullet-inactive-opacity': '0.5'
        } as React.CSSProperties}
      >
        {/* Visual Cues for Scrolling */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#F9F9F9] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#F9F9F9] to-transparent pointer-events-none z-10" />

        <Swiper
          modules={[Navigation, Pagination]}
          onBeforeInit={(swiper) => {
            swiperRef.current = swiper;
          }}
          slidesPerView="auto"
          spaceBetween={8}
          loop={products.slice(0, 8).length > 5}
          pagination={{ 
            clickable: true,
            dynamicBullets: true,
          }}
          className="!pb-12 !pt-4 px-2"
          breakpoints={{
            640: {
              spaceBetween: 20,
            }
          }}
        >
          {products.slice(0, 8).map(p => (
            <SwiperSlide key={p.id} className="!w-[160px] sm:!w-[220px] md:!w-[280px] !h-auto">
              <div className="h-full py-2 flex flex-col">
                <ProductCard product={p} className="h-full flex-1" wide />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-5">
        {products.slice(0, 4).map(p => (
          <ProductCard key={p.id} product={p} className="h-full" wide />
        ))}
      </div>

      {viewAllLink && (
        <div className="mt-2 text-center lg:hidden">
          <FastLink to={viewAllLink} prefetchPage="Search" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-solar text-solar font-bold hover:bg-solar hover:text-white transition-all text-sm sm:text-base">
            عرض الكل
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </FastLink>
        </div>
      )}
    </div>
  );
});
