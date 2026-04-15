import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingActionsProps {
  showScrollTop: boolean;
  scrollToTop: () => void;
}

export default React.memo(function FloatingActions({ showScrollTop, scrollToTop }: FloatingActionsProps) {
  const location = useLocation();
  const hideOnPaths = ['/checkout', '/auth', '/signup'];
  const shouldHide = hideOnPaths.includes(location.pathname);

  return (
    <>
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && !shouldHide && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 w-12 h-12 bg-carbon text-solar rounded-full shadow-xl flex items-center justify-center transition-all hover:bg-carbon/90 hover:-translate-y-1 border border-titanium/20"
            title="العودة للأعلى"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
});
