import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, ShoppingBag, Loader, Camera, Download, Sparkles, X, AlertCircle, Send, Palette } from 'lucide-react';
import Customizer from './Customizer'; // 🔥 Импортируем наш Конструктор

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';
// 🔥 УКАЖИ ЗДЕСЬ ССЫЛКУ НА ТВОЙ КАНАЛ (куда пойдет человек при клике)
const TG_CHANNEL_LINK = 'https://t.me/firma_project'; 

const ProductDetail = ({ product, onBack, onAddToCart }) => {
    const [selectedSize, setSelectedSize] = useState('');
    const [isAdded, setIsAdded] = useState(false);
    
    // Стейты примерочной
    const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
    const [tryonStatus, setTryonStatus] = useState(null);
    const [userPhoto, setUserPhoto] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tryonResult, setTryonResult] = useState(null);
    const [tryonError, setTryonError] = useState(null);
    
    // Стейт проверки подписки
    const [isVerifyingSub, setIsVerifyingSub] = useState(false);

    // 🔥 Стейт Конструктора
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    
    const fileInputRef = useRef(null);
    const tgInitData = window.Telegram?.WebApp?.initData || '';

    const sizes = product.sizes ? product.sizes.split(',') : ['S', 'M', 'L'];
    const images = product.image_url ? product.image_url.split(',') : [];

    const getImgUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `https://firmashop-truear.waw0.amvera.tech${url}`;
    };

    // Обычное добавление в корзину
    const handleAddToCartClick = () => {
        if (!selectedSize) {
            alert("Пожалуйста, выберите размер");
            return;
        }
        onAddToCart(product, selectedSize); // Вызов без кастомного URL
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    // --- ЛОГИКА КОНСТРУКТОРА ---
    const openCustomizer = () => {
        if (!selectedSize) {
            alert("Пожалуйста, выберите размер перед созданием дизайна");
            return;
        }
        setIsCustomizerOpen(true);
    };

    const handleCustomDesignSave = (customUrl) => {
        setIsCustomizerOpen(false);
        onAddToCart(product, selectedSize, customUrl); // 🔥 Передаем макет в корзину!
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    // --- ЛОГИКА ПРИМЕРОЧНОЙ ---
    const fetchLimits = async () => {
        try {
            const res = await fetch(`${API_URL}/try-on/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tgInitData })
            });
            if (res.ok) setTryonStatus(await res.json());
        } catch (e) { console.error(e); }
    };

    const openTryOnModal = async () => {
        setIsTryOnModalOpen(true);
        setUserPhoto(null);
        setTryonResult(null);
        setTryonError(null);
        await fetchLimits();
    };

    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUserPhoto(e.target.files[0]);
        }
    };

    const handleGenerateTryOn = async () => {
        if (!userPhoto) return;
        setIsGenerating(true);
        setTryonError(null);

        const formData = new FormData();
        formData.append('initData', tgInitData);
        formData.append('product_id', product.id);
        formData.append('file', userPhoto);

        try {
            const res = await fetch(`${API_URL}/try-on/generate`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                setTryonResult(data.result_url);
                setTryonStatus(prev => ({...prev, remaining: prev.remaining - 1}));
                if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            } else {
                setTryonError(data.detail || "Произошла ошибка при генерации");
            }
        } catch (e) {
            setTryonError("Ошибка сети. Попробуйте еще раз.");
        }
        setIsGenerating(false);
    };

    const handleVerifySubscription = async () => {
        setIsVerifyingSub(true);
        try {
            const res = await fetch(`${API_URL}/try-on/verify-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tgInitData })
            });
            const data = await res.json();
            
            if (res.ok && data.status === 'success') {
                if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                await fetchLimits();
            } else {
                if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                alert(data.message || "Подписка не найдена. Попробуйте еще раз через пару секунд.");
            }
        } catch(e) {
            alert("Ошибка сети");
        }
        setIsVerifyingSub(false);
    };

    const handleDownload = () => {
        if (!tryonResult) return;
        const link = document.createElement('a');
        link.href = tryonResult;
        link.download = `firma_tryon_${product.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-black min-h-screen text-white animate-slide-up pb-32">
            
            {/* ШАПКА ТОВАРА */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-center max-w-md mx-auto pointer-events-none">
                <button onClick={onBack} className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 pointer-events-auto active:scale-90 transition-all">
                    <ArrowLeft size={20} />
                </button>
            </div>

            {/* ГАЛЕРЕЯ */}
            <div className="w-full aspect-[4/5] bg-[#111] relative overflow-x-auto snap-x snap-mandatory flex no-scrollbar">
                {images.map((img, idx) => (
                    <img key={idx} src={getImgUrl(img)} className="w-full h-full object-cover shrink-0 snap-center" alt={`Slide ${idx}`}/>
                ))}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        {images.map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
                        ))}
                    </div>
                )}
            </div>

            {/* ИНФО О ТОВАРЕ */}
            <div className="p-4 relative">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{product.brand ? product.brand.name : 'FIRMA ARCHIVE'}</p>
                        <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{product.name}</h1>
                    </div>
                    <div className="text-right">
                        {product.old_price && <div className="text-[10px] text-gray-500 line-through">{product.old_price} ₽</div>}
                        <div className="text-xl font-mono font-bold">{product.price} ₽</div>
                    </div>
                </div>

                <p className="text-xs text-gray-400 font-mono leading-relaxed mt-4 whitespace-pre-line">
                    {product.description || "Классический силуэт, переосмысленный в рамках архивной коллекции."}
                </p>

                {/* ВЫБОР РАЗМЕРА */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Размер</span>
                    </div>
                    <div className="flex gap-2">
                        {sizes.map(size => (
                            <button 
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`flex-1 py-3 rounded-xl border font-mono text-sm uppercase transition-all active:scale-95 ${
                                    selectedSize === size 
                                    ? 'bg-white text-black border-white font-bold' 
                                    : 'bg-[#111] text-white border-white/10 hover:border-white/30'
                                }`}
                            >
                                {size.trim()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ПЛАВАЮЩИЕ КНОПКИ ВНИЗУ */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent max-w-md mx-auto z-40">
                <div className="flex flex-col gap-2">
                    {/* Ряд с доп. функциями */}
                    <div className="flex gap-2">
                        <button 
                            onClick={openTryOnModal}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-purple-500/50"
                        >
                            <Sparkles size={14} />
                            Примерить ИИ
                        </button>

                        <button 
                            onClick={openCustomizer}
                            className="flex-1 bg-[#111] border border-white/20 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-white/10"
                        >
                            <Palette size={14} />
                            Свой дизайн
                        </button>
                    </div>

                    <button 
                        onClick={handleAddToCartClick}
                        className={`w-full font-bold py-4 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
                            isAdded ? 'bg-green-500 text-white' : 'bg-white text-black'
                        }`}
                    >
                        {isAdded ? <><Heart size={18} className="fill-white"/> Добавлено</> : <><ShoppingBag size={18}/> В корзину</>}
                    </button>
                </div>
            </div>

            {/* 🔥 МОДАЛЬНОЕ ОКНО КОНСТРУКТОРА */}
            {isCustomizerOpen && (
                <Customizer 
                    bgImage={getImgUrl(images[0])} // Передаем первое фото товара как фон
                    onClose={() => setIsCustomizerOpen(false)}
                    onSave={handleCustomDesignSave}
                />
            )}

            {/* МОДАЛЬНОЕ ОКНО ПРИМЕРОЧНОЙ */}
            {isTryOnModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
                    <button onClick={() => setIsTryOnModalOpen(false)} className="absolute top-10 right-6 p-2 bg-white/10 rounded-full text-white z-[101]">
                        <X size={20} />
                    </button>

                    <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center">
                        {tryonStatus && (
                            <div className="absolute top-0 left-0 right-0 bg-white/5 border-b border-white/10 py-2 text-center text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                                Доступно примерок: <span className="text-white font-bold">{tryonStatus.remaining} из {tryonStatus.total_limit}</span>
                            </div>
                        )}

                        <div className="mt-8 mb-6 flex flex-col items-center">
                            <Sparkles size={32} className="text-purple-500 mb-2" />
                            <h2 className="text-xl font-black uppercase tracking-tighter">AI Fitting Room</h2>
                            <p className="text-[10px] text-gray-500 text-center mt-2 font-mono px-4">
                                Загрузи свое фото прямо, в полный рост или по пояс, при хорошем освещении.
                            </p>
                        </div>

                        {/* РОУТИНГ СОСТОЯНИЙ ЛИМИТОВ */}
                        {tryonStatus?.remaining === 0 ? (
                            tryonStatus?.is_subscribed ? (
                                <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center mb-4 animate-scale-in">
                                    <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-white mb-1">Лимиты исчерпаны</p>
                                    <p className="text-[10px] text-gray-400 font-mono">Вы потратили все {tryonStatus.total_limit} примерок на сегодня. Возвращайтесь завтра!</p>
                                </div>
                            ) : (
                                <div className="w-full bg-blue-900/20 border border-blue-500/30 rounded-2xl p-5 text-center mb-2 animate-scale-in">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-500/50">
                                        <Send size={20} className="text-blue-400 -ml-1" />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Хочешь еще?</h3>
                                    <p className="text-[10px] text-gray-400 font-mono mb-5 leading-relaxed">
                                        Базовые примерки закончились. Подпишись на наш Telegram-канал и получи <span className="text-blue-400 font-bold">+5 генераций</span> бесплатно!
                                    </p>
                                    
                                    <a 
                                        href={TG_CHANNEL_LINK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center mb-3 active:scale-95 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                    >
                                        Подписаться на канал
                                    </a>
                                    
                                    <button 
                                        onClick={handleVerifySubscription}
                                        disabled={isVerifyingSub}
                                        className="w-full bg-transparent border border-white/20 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center active:scale-95 transition-all hover:bg-white/5"
                                    >
                                        {isVerifyingSub ? <Loader size={14} className="animate-spin" /> : 'Я подписался (Проверить)'}
                                    </button>
                                </div>
                            )
                        ) : (
                            <>
                                {!tryonResult && !isGenerating && (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full aspect-[3/4] bg-black border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden mb-6 group"
                                    >
                                        {userPhoto ? (
                                            <>
                                                <img src={URL.createObjectURL(userPhoto)} className="w-full h-full object-cover opacity-50" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl">Изменить фото</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <Camera size={24} className="text-gray-400" />
                                                </div>
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Выбрать фото</span>
                                            </>
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                                    </div>
                                )}

                                {isGenerating && (
                                    <div className="w-full aspect-[3/4] bg-black border border-purple-500/30 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden mb-6 shadow-[0_0_30px_rgba(147,51,234,0.1)]">
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent animate-pulse"></div>
                                        <Loader size={40} className="text-purple-500 animate-spin mb-4" />
                                        <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">ИИ создает лук...</p>
                                        <p className="text-[9px] text-gray-500 font-mono mt-2">Это займет 10-20 секунд</p>
                                    </div>
                                )}

                                {tryonResult && (
                                    <div className="w-full aspect-[3/4] relative rounded-2xl overflow-hidden mb-6 border border-white/10 group">
                                        <img src={tryonResult} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={handleDownload}
                                            className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all active:scale-90"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                )}

                                {tryonError && (
                                    <p className="text-xs text-red-500 font-mono text-center mb-4">{tryonError}</p>
                                )}

                                {!tryonResult ? (
                                    <button 
                                        onClick={handleGenerateTryOn}
                                        disabled={!userPhoto || isGenerating}
                                        className={`w-full font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                                            userPhoto && !isGenerating ? 'bg-white text-black hover:scale-[0.98]' : 'bg-white/10 text-gray-500'
                                        }`}
                                    >
                                        {isGenerating ? 'Обработка...' : 'Надеть вещь'}
                                    </button>
                                ) : (
                                    <div className="flex gap-2 w-full">
                                        <button 
                                            onClick={() => {
                                                setTryonResult(null);
                                                setUserPhoto(null);
                                            }}
                                            className="w-1/3 bg-white/10 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center transition-all hover:bg-white/20"
                                        >
                                            Заново
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsTryOnModalOpen(false);
                                                handleAddToCartClick();
                                            }}
                                            className="w-2/3 bg-white text-black font-bold py-4 rounded-xl uppercase tracking-widest text-[10px] flex items-center justify-center transition-all hover:scale-[0.98]"
                                        >
                                            В корзину
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProductDetail;
