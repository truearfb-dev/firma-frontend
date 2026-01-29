import React, { useState, useEffect, useRef } from 'react';
import { Loader, Camera, Plus, Image as ImageIcon } from 'lucide-react';

// Используем тот же домен API
const API_URL = 'https://firmashop-truear.waw0.amvera.tech';

const Community = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  // Скрытый инпут для выбора файла
  const fileInputRef = useRef(null);

  // Загружаем ленту при открытии
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews`);
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error("Ошибка загрузки ленты:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Клик по кнопке -> клик по скрытому инпуту
  const triggerFileSelect = () => {
    if (!user) {
        alert("Please log in via Telegram to post.");
        return;
    }
    fileInputRef.current.click();
  };

  // Файл выбран -> загружаем на сервер
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    // Создаем FormData для отправки файла
    const formData = new FormData();
    formData.append('file', file);
    // Добавляем ID юзера в URL параметры (как ждет бэкенд)
    const uploadUrl = new URL(`${API_URL}/api/reviews/upload`);
    uploadUrl.searchParams.append('telegram_id', user.id);

    try {
        const response = await fetch(uploadUrl.toString(), {
            method: 'POST',
            body: formData, // Браузер сам поставит нужные заголовки
        });

        if (response.ok) {
            // Вибрация успеха
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            // Перезагружаем ленту, чтобы увидеть свое фото
            fetchReviews();
            alert("Photo uploaded! It will appear soon.");
        } else {
            alert("Upload failed.");
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("Network error.");
    } finally {
        setIsUploading(false);
        // Очищаем инпут, чтобы можно было выбрать тот же файл снова
        event.target.value = null;
    }
  };

  return (
    <div className="pt-24 pb-24 animate-fade-in min-h-screen">
        {/* HEADER */}
        <div className="px-6 mb-8 text-center">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
                Firma<br/><span className="text-gray-500">Community</span>
            </h1>
            <p className="text-gray-400 text-xs max-w-xs mx-auto font-mono uppercase tracking-widest">
                Real people. Real style.
            </p>
        </div>

        {/* ЛЕНТА */}
        <div className="px-4">
            {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <Loader className="animate-spin text-white" size={32} />
                   <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Loading Feed...</span>
                 </div>
            ) : reviews.length === 0 ? (
                 // Пустое состояние
                 <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500 opacity-50">
                    <ImageIcon size={48} />
                    <span className="text-xs font-mono uppercase tracking-widest">Be the first to post</span>
                 </div>
            ) : (
                // Сетка фотографий (Masonry-like, 2 колонки)
                <div className="columns-2 gap-4 space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="break-inside-avoid rounded-xl overflow-hidden bg-[#111] border border-white/5 animate-slide-up">
                            {/* Важно: Добавляем домен API к пути картинки */}
                            <img src={`${API_URL}${review.image_path}`} className="w-full h-auto object-cover" loading="lazy" />
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* КНОПКА ЗАГРУЗКИ (Плавающая) */}
        <div className="fixed bottom-24 right-6 z-40">
            <button
                onClick={triggerFileSelect}
                disabled={isUploading}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all disabled:opacity-50"
            >
                {isUploading ? <Loader className="animate-spin" size={24} /> : <Camera size={24} />}
            </button>
            {/* Скрытый инпут для файлов (принимает только картинки) */}
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
            />
        </div>
    </div>
  );
};

export default Community;