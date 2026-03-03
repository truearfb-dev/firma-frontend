import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react';
import ImageSlider from './ImageSlider'; 

const ProductDetail = ({ product, onBack, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  
  const sizes = product.sizes ? product.sizes.split(',').map(s => s.trim()) : [];

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      alert("Пожалуйста, выберите размер");
      return;
    }
    onAddToCart(product, selectedSize);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col animate-fade-in">
      
      {/* Кнопка НАЗАД */}
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 z-[100] bg-black/50 backdrop-blur-md p-3 rounded-full border border-white/10 active:scale-95 transition-all"
      >
        <ArrowLeft size={24} />
      </button>

      {/* ЗОНА СКРОЛЛА */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        
        <div className="w-full h-[55vh] relative bg-[#111]">
          <ImageSlider imagesStr={product.image_url} />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>

        <div className="px-6 -mt-8 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-black uppercase leading-tight max-w-[70%]">
              {product.name}
            </h1>
            <div className="text-2xl font-mono font-bold text-white">
              {product.price} ₽
            </div>
          </div>

          <div className="flex gap-2 mb-6">
             <span className="px-3 py-1 border border-white/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
               {product.brand ? product.brand.name : 'Firma'}
             </span>
             {product.category && (
               <span className="px-3 py-1 bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-full text-gray-300">
                 {product.category}
               </span>
             )}
          </div>

          {sizes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Выберите размер</h3>
              <div className="flex flex-wrap gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[50px] h-12 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${
                      selectedSize === size 
                        ? 'bg-white text-black border-white scale-105' 
                        : 'bg-transparent text-gray-400 border-white/20 hover:border-white/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Описание</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-wrap">
              {product.description || "Описание отсутствует."}
            </p>
          </div>

          {/* ЖЕЛЕЗОБЕТОННАЯ РАСПОРКА - 192px пустого места в конце контента */}
          <div className="h-48 w-full shrink-0"></div>
        </div>
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ С КНОПКОЙ (Абсолютная, поверх скролла) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-24 bg-gradient-to-t from-black via-black to-transparent z-[80] pointer-events-none flex flex-col justify-end">
        <button 
          onClick={handleAddToCart}
          disabled={sizes.length > 0 && !selectedSize} 
          className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all pointer-events-auto shadow-2xl ${
            sizes.length > 0 && !selectedSize 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-black'
          }`}
        >
          {sizes.length > 0 && !selectedSize ? <AlertCircle size={20}/> : <ShoppingBag size={20} />}
          <span className="uppercase tracking-wider text-sm">
            {sizes.length > 0 && !selectedSize ? 'Выберите размер' : 'В корзину'}
          </span>
        </button>
      </div>
      
    </div>
  );
};

export default ProductDetail;
