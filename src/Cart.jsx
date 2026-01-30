import React from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';

const BASE_URL = 'https://firmashop-truear.waw0.amvera.tech'; // ТВОЙ URL

const Cart = ({ items, onClose, onRemove, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const getImgUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black animate-fade-in flex flex-col pb-safe">
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <h2 className="text-xl font-black uppercase tracking-tighter">Корзина ({items.length})</h2>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
            <span className="text-4xl">🛒</span>
            <p className="font-mono text-xs uppercase tracking-widest">Корзина пуста</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex gap-4 animate-slide-up">
              <div className="w-20 h-24 bg-[#111] rounded-lg overflow-hidden shrink-0">
                <img src={getImgUrl(item.image_url)} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-sm uppercase leading-tight mb-1">{item.name}</h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-gray-500 font-mono uppercase">
                        {item.brand ? item.brand.name : 'Firma'}
                    </p>
                    {item.selectedSize && (
                        <span className="self-start px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-white">
                            Размер: {item.selectedSize}
                        </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-mono font-bold">{item.price} ₽</span>
                  <button onClick={() => onRemove(index)} className="text-gray-600 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="p-6 border-t border-white/10 bg-black safe-bottom">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">Итого</span>
            <span className="text-3xl font-black tracking-tight">{total} ₽</span>
          </div>
          <button onClick={onCheckout} className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
            <span className="uppercase tracking-wider text-sm">Оформить заказ</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;