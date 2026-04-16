import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { FastImage } from './FastImage';

interface ProductGalleryProps {
  images: string[];
  onZoom?: (index: number) => void;
}

const ProductGallery: React.FC<ProductGalleryProps> = React.memo(({ images, onZoom }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + images.length) % images.length);
  }, [images.length]);

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -10000 || offset.x < -50) {
      paginate(1); // Swipe left -> next
    } else if (swipe > 10000 || offset.x > 50) {
      paginate(-1); // Swipe right -> prev
    }
  };

  if (!images || images.length === 0) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="w-full mx-auto flex flex-col gap-4 select-none">
      {/* Main Image Container */}
      <div className="relative aspect-square w-full bg-white shadow-sm overflow-hidden group border-b border-black/5">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          >
            <FastImage
              src={images[currentIndex] || undefined}
              alt={`Product image ${currentIndex + 1}`}
              priority={true}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Counter Badge */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 pointer-events-none">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Zoom Button */}
        {onZoom && (
          <button 
            onClick={() => onZoom(currentIndex)}
            className="absolute bottom-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md text-carbon rounded-full flex items-center justify-center shadow-lg z-10 active:scale-95 transition-transform"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        )}

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
          {images.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                currentIndex === idx ? 'w-4 bg-solar' : 'w-1.5 bg-white/80'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows (Hidden on Mobile) */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-between px-3 pointer-events-none z-10">
          <button
            onClick={() => paginate(-1)}
            className="pointer-events-auto p-2 rounded-full bg-white/40 backdrop-blur-md text-carbon hover:bg-white/60 active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
            aria-label="Previous image"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => paginate(1)}
            className="pointer-events-auto p-2 rounded-full bg-white/40 backdrop-blur-md text-carbon hover:bg-white/60 active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
            aria-label="Next image"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* Thumbnails Row */}
      <div className="flex gap-3 overflow-x-auto py-1 px-4 hide-scrollbar snap-x scroll-smooth">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`relative flex-shrink-0 w-[calc(25%-9px)] aspect-square rounded-lg overflow-hidden snap-start transition-all duration-300 border-2 ${
              currentIndex === index 
                ? 'border-solar scale-105 shadow-md z-10' 
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <FastImage
              src={image || undefined}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
});

export default ProductGallery;
