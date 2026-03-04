import React, { useState, useEffect, useRef } from 'react';
import { Camera, Loader, X, Heart, Trash2 } from 'lucide-react'; 

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api'; 

const Community = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null); 
  const fileInputRef = useRef(null);

  const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || user?.id;

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

  const handleLike = async (reviewId, e) => {
    e.stopPropagation(); 

    setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
            const hasLiked = r.liked_by.includes(tgUserId);
            const newLikedBy = hasLiked 
                ? r.liked_by.filter(id => id !== tgUserId) 
                : [...r.liked_by, tgUserId]; 
            return { ...r, liked_by: newLikedBy, likes_count: newLikedBy.length };
        }
        return r;
    }));

    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    const tgInitData = window.Telegram?.WebApp?.initData || '';
    try {
        await fetch(`${API_URL}/reviews/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tgInitData, review_id: reviewId })
        });
    } catch (err) { console.error(err); }
  };

  // 🔥 НОВОЕ: Обработчик удаления своего фото
  const handleDeleteOwnReview = async (reviewId, e) => {
      e.stopPropagation();
      if (!window.confirm("Удалить вашу фотографию из ленты?")) return;

      const tgInitData = window.Telegram?.WebApp?.initData || '';
      try {
          const res = await fetch(`${API_URL}/reviews/delete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData: tgInitData, review_id: reviewId })
          });
          if (res.ok) {
              setReviews(prev => prev.filter(r => r.id !== reviewId));
              if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
              }
          } else {
              alert("Не удалось удалить фотографию.");
          }
      } catch (err) { console.error(err); }
  }

  const getImgUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `https://firmashop-truear.waw0.amvera.tech${url}`;
  }

  return (
    <div className="pt-20 pb-24 px-4 animate-fade-in min-h-screen">
      
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

      <div className="columns-2 gap-4 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="break-inside-avoid bg-[#111] rounded-xl overflow-hidden border border-white/5 group relative">
            
            {/* 🔥 НОВОЕ: Кнопка удаления (появляется только на своих фото) */}
            {review.author_tg_id === tgUserId && (
                <button 
                    onClick={(e) => handleDeleteOwnReview(review.id, e)}
                    className="absolute top-2 right-2 z-10 p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white/50 hover:text-red-500 active:scale-90 transition-all"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <img 
                src={getImgUrl(review.image_path)} 
                onClick={() => setFullscreenImage(review.image_path)}
                className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-500 cursor-pointer"
            />
            
            <div className="p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent absolute bottom-0 left-0 right-0 pointer-events-none">
                <div className="flex items-end justify-between pointer-events-auto">
                    
                    <div className="flex flex-col gap-0.5">
                        <div className="text-[10px] font-bold text-white truncate pr-2">
                            {review.author_username ? (
                                <a 
                                    href={`https://t.me/${review.author_username}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()} 
                                >
                                    @{review.author_username}
                                </a>
                            ) : (
                                <span className="text-gray-300">{review.author_name}</span>
                            )}
                        </div>
                        <span className="text-[9px] font-mono text-gray-400">{review.created_at}</span>
                    </div>

                    <button 
                        onClick={(e) => handleLike(review.id, e)}
                        className="flex items-center gap-1.5 active:scale-90 transition-transform bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-full"
                    >
                        <Heart 
                            size={14} 
                            className={review.liked_by?.includes(tgUserId) ? "fill-red-500 text-red-500" : "text-white"} 
                        />
                        <span className="text-[10px] font-mono font-bold text-white">
                            {review.likes_count > 0 ? review.likes_count : ''}
                        </span>
                    </button>

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

      {fullscreenImage && (
          <div 
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
              onClick={() => setFullscreenImage(null)}
          >
              <button 
                  className="absolute top-24 right-6 z-[101] p-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white shadow-xl hover:bg-black/70 active:scale-90 transition-all"
                  onClick={() => setFullscreenImage(null)}
              >
                  <X size={24} />
              </button>
              
              <img 
                  src={getImgUrl(fullscreenImage)} 
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl animate-slide-up mt-8"
                  onClick={(e) => e.stopPropagation()} 
              />
          </div>
      )}

    </div>
  );
};

export default Community;
