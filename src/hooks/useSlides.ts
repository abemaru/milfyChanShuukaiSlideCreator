import { useState, useCallback } from 'react';

export interface SlideData {
  id: string;
  json: string;
  thumbnail: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useSlides = () => {
  const [slides, setSlides] = useState<SlideData[]>([
    { id: generateId(), json: '', thumbnail: '' },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const addSlide = useCallback(() => {
    const newSlide: SlideData = {
      id: generateId(),
      json: '',
      thumbnail: '',
    };
    setSlides((prev) => {
      const newSlides = [...prev];
      newSlides.splice(currentSlideIndex + 1, 0, newSlide);
      return newSlides;
    });
    setCurrentSlideIndex((prev) => prev + 1);
  }, [currentSlideIndex]);

  const deleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) return; // 最低1枚は残す

      setSlides((prev) => prev.filter((_, i) => i !== index));

      // インデックス調整
      if (index <= currentSlideIndex && currentSlideIndex > 0) {
        setCurrentSlideIndex((prev) => prev - 1);
      } else if (index === currentSlideIndex && index === slides.length - 1) {
        setCurrentSlideIndex((prev) => prev - 1);
      }
    },
    [slides.length, currentSlideIndex]
  );

  const switchSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
  }, []);

  const updateSlideData = useCallback(
    (index: number, json: string, thumbnail: string) => {
      setSlides((prev) =>
        prev.map((slide, i) =>
          i === index ? { ...slide, json, thumbnail } : slide
        )
      );
    },
    []
  );

  const duplicateSlide = useCallback(
    (index: number) => {
      const slideToDuplicate = slides[index];
      const newSlide: SlideData = {
        id: generateId(),
        json: slideToDuplicate.json,
        thumbnail: slideToDuplicate.thumbnail,
      };
      setSlides((prev) => {
        const newSlides = [...prev];
        newSlides.splice(index + 1, 0, newSlide);
        return newSlides;
      });
      setCurrentSlideIndex(index + 1);
    },
    [slides]
  );

  return {
    slides,
    currentSlideIndex,
    currentSlide: slides[currentSlideIndex],
    addSlide,
    deleteSlide,
    switchSlide,
    updateSlideData,
    duplicateSlide,
  };
};
