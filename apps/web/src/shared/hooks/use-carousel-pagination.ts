import { useState } from 'react';

export const useCarouselPagination = (totalItems: number, itemsPerPage: number = 3) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - itemsPerPage));
  
  const handleNext = () => setCurrentIndex((prev) => 
    Math.min(Math.max(0, totalItems - itemsPerPage), prev + itemsPerPage)
  );
  
  const resetPagination = () => setCurrentIndex(0);

  return {
    currentIndex,
    itemsPerPage,
    handlePrev,
    handleNext,
    resetPagination
  };
};