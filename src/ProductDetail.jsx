import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

const ProductDetail = ({ product, onBack, onAddToCart }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black text-white overflow-y-auto animate-fade-in pb-24">
      
      {/* Кнопка НАЗАД (плавающая) */}
      <button 
        onClick={onBack}
        className="fixed top-4 left-4 z-50 bg-black/50 backdrop-blur-md p-3 rounded-full border border-white/10 active:scale-95 transition-all"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Изображение товара */}
      <div className="w-full h-[50vh] relative bg-[#111]">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Информация */}
      <div className="px-6 -mt-8 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-black uppercase leading-tight max-w-[70%]">
            {product.name}
          </h1>
          <div className="text-2xl font-mono font-bold text-white">
            {product.price} ₽
          </div>
        </div>

        {/* Бренд / Категория */}
        <div className="flex gap-2 mb-6">
           <span className="px-3 py-1 border border-white/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
             {product.brand?.name || 'Firma'}
           </span>
           {product.category && (
             <span className="px-3 py-1 bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-full text-gray-300">
               {product.category}
             </span>
           )}
        </div>

        {/* Описание */}
        <div className="space-y-4 mb-12">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</h3>
          <p className="text-sm text-gray-300 leading-relaxed font-light">
            {product.description || "Описание отсутствует. Но вещь, безусловно, стильная."}
          </p>
        </div>
      </div>

      {/* Кнопка КУПИТЬ (фиксированная снизу) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-50">
        <button 
          onClick={() => onAddToCart(product)}
          className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <ShoppingBag size={20} />
          <span className="uppercase tracking-wider text-sm">Add to Cart</span>
        </button>
      </div>

    </div>
  );
};

export default ProductDetail;