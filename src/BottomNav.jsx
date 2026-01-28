import React from 'react';
import { ShoppingBag, User } from 'lucide-react'; // Импортируем красивые иконки

const BottomNav = ({ currentTab, onChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        
        {/* Кнопка SHOP */}
        <button
          onClick={() => onChange('shop')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
            currentTab === 'shop' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          {/* Иконка сумки */}
          <ShoppingBag 
            size={20} 
            strokeWidth={currentTab === 'shop' ? 2.5 : 1.5} // Жирнее, если активна
            className="mb-1"
          />
          <span className="text-[9px] font-bold tracking-widest uppercase">
            Shop
          </span>
        </button>

        {/* Кнопка PROFILE */}
        <button
          onClick={() => onChange('profile')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
            currentTab === 'profile' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          {/* Иконка человека */}
          <User 
            size={20} 
            strokeWidth={currentTab === 'profile' ? 2.5 : 1.5}
            className="mb-1"
          />
          <span className="text-[9px] font-bold tracking-widest uppercase">
            Profile
          </span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;