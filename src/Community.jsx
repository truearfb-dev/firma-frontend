import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, Loader, Heart } from 'lucide-react';

const BASE_URL = 'https://firmashop-truear.waw0.amvera.tech'; // ТВОЙ URL
const API_URL = `${BASE_URL}/api`;

const Community = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Умная ссылка для картинок
  const getImgUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Валидация размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой (макс 5MB)");
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    // 🔥 ВАЖНО: Добавляем initData
    const initData = window.Telegram?.WebApp?.initData || "";
    formData.append('initData', initData);
    
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/reviews/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        alert("Фото загружено! Оно появится в ленте после проверки модератором.");
      } else {
        alert("Ошибка загрузки. Попробуйте другое фото.");
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка сети");
    } finally {
      setIsUploading(false);
      // Сбрасываем инпут
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="pt-24 pb-24 px-4 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 leading-none">
          Firma<br/><span className="text-gray-600">Community</span>
        </h1>
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Реальные люди. Реальный стиль.
        </p>
      </div>

      {/* КНОПКА ЗАГРУЗКИ */}
      <div 
        onClick={() => fileInputRef.current.click()}
        className="bg-[#111] border border-dashed border-white/20 rounded-xl p-6 mb-8 flex flex-col items-center justify-center gap-3 cursor-pointer active:scale-95 transition-all"
      >
        {isUploading ? (
            <Loader className="animate-spin text-white" />
        ) : (
            <>
                <Camera size={32} className="text-white" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Загрузить свой лук
                </span>
            </>
        )}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*" 
        />
      </div>

      {/* ЛЕНТА */}
      <div className="masonry-grid space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-[#111] rounded-xl overflow-hidden border border-white/5 animate-slide-up">
            <img 
                src={getImgUrl(review.image_path)} 
                className="w-full h-auto object-cover" 
                loading="lazy"
            />
            <div className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px]">👤</div>
                    <span className="text-xs font-bold text-gray-400">Пользователь #{review.user_id}</span>
                </div>
                {/* Здесь можно добавить лайки в будущем */}
            </div>
          </div>
        ))}
        
        {reviews.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-xs font-mono uppercase">
                Лента пока пуста.<br/>Стань первым!
            </div>
        )}
      </div>
    </div>
  );
};

export default Community;