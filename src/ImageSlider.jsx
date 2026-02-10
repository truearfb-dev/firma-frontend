import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BASE_URL = 'https://firmashop-truear.waw0.amvera.tech';

const ImageSlider = ({ imagesStr }) => {
  if (!imagesStr) return <div className="bg-gray-800 w-full h-full flex items-center justify-center text-gray-600 text-xs">NO IMG</div>;

  const images = imagesStr.split(',').map(url => 
    url.startsWith('http') ? url : `${BASE_URL}${url}`
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 🖐 STATE ДЛЯ СВАЙПОВ
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50; // Минимальное расстояние для свайпа

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 🔥 ОБРАБОТЧИКИ СВАЙПОВ
  const onTouchStart = (e) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      next(); // Свайпнули влево -> следующая картинка
    }
    if (isRightSwipe) {
      prev(); // Свайпнули вправо -> предыдущая
    }
  };

  if (images.length === 1) {
    return <img src={images[0]} className="w-full h-full object-cover" />;
  }

  return (
    <div 
        className="w-full h-full relative group overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      <img 
        src={images[currentIndex]} 
        className="w-full h-full object-cover transition-all duration-300"
        draggable={false} // Чтобы не перетаскивалась как файл
      />
      
      {/* Стрелки (на ПК удобнее) */}
      <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={20} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} />
      </button>

      {/* Индикаторы (Точки) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, idx) => (
            <div 
                key={idx} 
                className={`transition-all duration-300 rounded-full shadow-lg ${
                    idx === currentIndex 
                    ? 'w-2 h-2 bg-white' 
                    : 'w-1.5 h-1.5 bg-white/40'
                }`} 
            />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;