import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  image: string;
  link: string;
}

interface ImageSliderProps {
  slides: Slide[];
  height?: string;
  mobileHeight?: string;
}

export default React.memo(function ImageSlider({ slides, height = "350px", mobileHeight = "140px" }: ImageSliderProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setDirection(1);
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };
  
  const prevSlide = () => {
    setDirection(-1);
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const onDragEnd = (_: any, info: any) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevSlide();
    } else if (info.offset.x < -threshold) {
      nextSlide();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.1,
      filter: 'blur(10px)',
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)',
    })
  };

  return (
    <div className="relative mx-2 sm:mx-6 my-4 sm:my-6 rounded-xl sm:rounded-[24px] overflow-hidden group shadow-lg border border-slate-100/50 cursor-grab active:cursor-grabbing">
      <div 
        className="relative w-full overflow-hidden bg-carbon"
        style={{ height: window.innerWidth < 640 ? mobileHeight : height }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.6 },
              filter: { duration: 0.4 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={onDragEnd}
            className="absolute inset-0 w-full h-full touch-none"
          >
            <Link to={slides[activeSlide].link} className="block w-full h-full relative">
              <motion.img
                key={`img-${activeSlide}`}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: "linear" }}
                src={slides[activeSlide].image || undefined}
                alt="Banner"
                referrerPolicy="no-referrer-when-downgrade"
                loading={activeSlide === 0 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover select-none"
                draggable="false"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute inset-y-0 right-0 left-0 flex items-center justify-between px-2 sm:px-4 pointer-events-none">
        <button 
          onClick={(e) => { e.preventDefault(); prevSlide(); }}
          className="pointer-events-auto w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); nextSlide(); }}
          className="pointer-events-auto w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 sm:bottom-4 right-1/2 translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSlide(idx)}
            className={`h-1 transition-all duration-300 rounded-full ${
              activeSlide === idx ? 'bg-solar w-4 sm:w-6' : 'bg-white/40 w-1'
            }`}
          />
        ))}
      </div>
    </div>
  );
});
