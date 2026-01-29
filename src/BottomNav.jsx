import React from 'react';
import { ShoppingBag, User, Users } from 'lucide-react'; // Добавили иконку Users

const BottomNav = ({ currentTab, onChange }) => {
  const navItems = [
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'community', label: 'Community', icon: Users }, // Новая вкладка посередине
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 py-2 px-6 z-50 pb-safe animate-slide-up-delayed">
      <div className="flex justify-around items-center max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300 group relative active:scale-95 ${
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
               {isActive && (
                <span className="absolute inset-0 bg-white/5 rounded-xl -z-10 animate-fade-in" />
               )}
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={`mb-1 transition-all duration-300 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'group-hover:scale-105'
                }`}
              />
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                {item.label}
              </span>
                 {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                 )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;