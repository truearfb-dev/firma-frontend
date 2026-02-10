import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BASE_URL = 'https://firmashop-truear.waw0.amvera.tech'; // ТВОЙ URL

const ImageSlider = ({ imagesStr }) => {
  if (!imagesStr) return <div className="bg-gray-800 w-full h-full" />;

  // Разбиваем строку "url1,url2" на массив
  const images = imagesStr.split(',').map(url => 
    url.startsWith('http') ? url : `${BASE_URL}${url}`
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const next = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 1) {
    return <img src={images[0]} className="w-full h-full object-cover" />;
  }

  return (
    <div className="w-full h-full relative group">
      <img 
        src={images[currentIndex]} 
        className="w-full h-full object-cover transition-all duration-300" 
      />
      
      {/* Стрелки */}
      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} />
      </button>

      {/* Точки внизу */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {images.map((_, idx) => (
            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;