import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Loader, Heart } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api'; // ТВОЙ URL

const Community = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    // user.initData или user.telegram_id нужно передать для валидации, 
    // но в App.jsx мы передавали просто user. 
    // Лучше передать initData пропсом, но если его нет, бэк проверит по user_id (если допилить).
    // В текущей версии API ждет initData.
    // ПРЕДПОЛАГАЕМ, ЧТО initData СОХРАНЕНА В window.Telegram.WebApp.initData
    
    const tgInitData = window.Telegram?.WebApp?.initData || '';
    formData.append('initData', tgInitData);
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/reviews/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert("Фото отправлено на модерацию! Спасибо.");
      } else {
        alert("Ошибка загрузки. Попробуйте позже.");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
    setIsUploading(false);
  };

  const getImgUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `https://firmashop-truear.waw0.amvera.tech${url}`;
  }

  return (
    <div className="pt-20 pb-24 px-4 animate-fade-in min-h-screen">
      
      {/* ЗАГОЛОВОК И КНОПКА ЗАГРУЗКИ */}
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Community</h1>
            <p className="text-gray-500 text-xs font-mono mt-2">Ваши стильные луки</p>
        </div>
        
        <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-white text-black px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-white/10"
        >
            {isUploading ? <Loader size={16} className="animate-spin"/> : <Camera size={16} />}
            <span>Загрузить</span>
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept="image/*" 
        />
      </div>

      {/* СЕТКА ФОТОГРАФИЙ */}
      <div className="columns-2 gap-4 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="break-inside-avoid bg-[#111] rounded-xl overflow-hidden border border-white/5 group relative">
            
            <img 
                src={getImgUrl(review.image_path)} 
                className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            
            <div className="p-3 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
                <div className="flex items-center justify-between">
                    {/* 🔥 ВОТ ЗДЕСЬ ВЫВОД НИКА */}
                    <div className="text-[10px] font-bold text-white truncate pr-2">
                        {review.author_username ? (
                            <a 
                                href={`https://t.me/${review.author_username}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()} // Чтобы клик не открывал фото (если будет модалка)
                            >
                                @{review.author_username}
                            </a>
                        ) : (
                            <span className="text-gray-300">{review.author_name}</span>
                        )}
                    </div>
                    <span className="text-[9px] font-mono text-gray-500">{review.created_at}</span>
                </div>
            </div>

          </div>
        ))}
      </div>

      {reviews.length === 0 && (
          <div className="text-center py-20 text-gray-600 font-mono text-xs uppercase">
              Лента пока пуста.<br/>Стань первым!
          </div>
      )}

    </div>
  );
};

export default Community;
