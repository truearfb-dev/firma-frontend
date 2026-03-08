import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Type, Image as ImageIcon, X, Trash2, Save, Plus, Minus, Check, Loader } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

// Палитра цветов для текста
const TEXT_COLORS = ['#ffffff', '#000000', '#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

const Customizer = ({ bgImage, onClose, onSave }) => {
    const [elements, setElements] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeId, setActiveId] = useState(null); 
    const canvasRef = useRef(null);
    
    const [safeBg, setSafeBg] = useState(null);
    const [isBgLoaded, setIsBgLoaded] = useState(false);

    const tgInitData = window.Telegram?.WebApp?.initData || '';

    // БЫСТРЫЙ И БЕЗОПАСНЫЙ ЗАГРУЗЧИК ФОНА
    useEffect(() => {
        const fetchBg = async () => {
            try {
                const nocacheUrl = bgImage + (bgImage.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                const res = await fetch(nocacheUrl);
                if (!res.ok) throw new Error("Direct fetch failed");

                const blob = await res.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSafeBg(reader.result); 
                    setIsBgLoaded(true);
                };
                reader.readAsDataURL(blob);
            } catch (e) {
                console.error("Direct fetch error, using fast proxy...", e);
                try {
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(bgImage)}`;
                    const resProxy = await fetch(proxyUrl);
                    const blobProxy = await resProxy.blob();
                    const readerProxy = new FileReader();
                    readerProxy.onloadend = () => {
                        setSafeBg(readerProxy.result);
                        setIsBgLoaded(true);
                    };
                    readerProxy.readAsDataURL(blobProxy);
                } catch (err) {
                    console.error("All fetches failed. Fallback to raw URL.");
                    setSafeBg(bgImage);
                    setIsBgLoaded(true);
                }
            }
        };
        if (bgImage) fetchBg();
    }, [bgImage]);

    // Добавление текста
    const addText = () => {
        const id = Date.now();
        setElements([...elements, { id, type: 'text', content: 'ВАШ ТЕКСТ', x: 100, y: 150, color: '#ffffff', size: 24 }]);
        setActiveId(id);
    };

    // Добавление картинки 
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const id = Date.now();
                setElements([...elements, { id, type: 'image', content: reader.result, x: 100, y: 150, size: 100 }]);
                setActiveId(id);
            };
            reader.readAsDataURL(file);
        }
    };

    // Удаление
    const removeElement = (id) => {
        setElements(elements.filter(el => el.id !== id));
        if (activeId === id) setActiveId(null);
    };

    // Изменение размера
    const updateSize = (delta) => {
        if (!activeId) return;
        setElements(elements.map(el => {
            if (el.id === activeId) {
                const minSize = el.type === 'text' ? 12 : 30;
                return { ...el, size: Math.max(minSize, el.size + delta) };
            }
            return el;
        }));
    };

    // Изменение текста (теперь через нижнюю панель)
    const updateText = (e) => {
        if (!activeId) return;
        setElements(elements.map(el => el.id === activeId ? { ...el, content: e.target.value } : el));
    };

    // Изменение цвета текста
    const updateColor = (color) => {
        if (!activeId) return;
        setElements(elements.map(el => el.id === activeId ? { ...el, color: color } : el));
    };

    // Физика перемещения
    const handleTouchStart = (e, id) => {
        e.stopPropagation();
        setActiveId(id);
        const touch = e.touches ? e.touches[0] : e;
        const el = elements.find(item => item.id === id);
        
        const startX = touch.clientX - el.x;
        const startY = touch.clientY - el.y;

        const handleMove = (moveEvent) => {
            const moveTouch = moveEvent.touches ? moveEvent.touches[0] : moveEvent;
            setElements(prev => prev.map(item => {
                if (item.id === id) {
                    return { ...item, x: moveTouch.clientX - startX, y: moveTouch.clientY - startY };
                }
                return item;
            }));
        };

        const handleEnd = () => {
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
        };

        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    };

    // Сохранение (Скриншот)
    const handleSave = async () => {
        setActiveId(null); 
        setIsSaving(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(canvasRef.current, {
                backgroundColor: '#0a0a0a',
                useCORS: true,
                scale: 2 
            });

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("Система заблокировала создание картинки");
                
                const formData = new FormData();
                formData.append('initData', tgInitData);
                formData.append('file', blob, `custom_${Date.now()}.png`);

                const res = await fetch(`${API_URL}/custom-design/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    onSave(data.url); 
                } else {
                    alert("Ошибка отправки на сервер. Попробуйте еще раз.");
                    setIsSaving(false);
                }
            }, 'image/png');

        } catch (error) {
            console.error("Canvas error:", error);
            alert(`Сбой сохранения: ${error?.message || error || 'Неизвестная ошибка iOS'}`);
            setIsSaving(false);
        }
    };

    const activeEl = elements.find(el => el.id === activeId);

    return (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col animate-fade-in touch-none">
            
            {/* 🔥 ИСПРАВЛЕНИЕ: Шапка опущена ниже (pt-14), чтобы не пересекаться с "челкой" iPhone */}
            <div className="flex justify-between items-center p-4 pt-14 bg-black/90 backdrop-blur border-b border-white/10 shrink-0">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
                <div className="font-black tracking-widest uppercase text-sm">Свой Дизайн</div>
                <button onClick={handleSave} disabled={isSaving || elements.length === 0 || !isBgLoaded} className={`p-2 rounded-full ${elements.length > 0 ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                    {isSaving ? <Loader size={20} className="animate-spin"/> : <Save size={20} />}
                </button>
            </div>

            {/* Холст */}
            <div 
                className="flex-1 relative bg-[#111] overflow-hidden flex items-center justify-center"
                onClick={() => setActiveId(null)} 
            >
                <div ref={canvasRef} className="relative w-full max-w-[350px] aspect-[4/5] bg-[#0a0a0a]">
                    
                    {!isBgLoaded ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
                            <Loader size={24} className="animate-spin text-purple-500" />
                            <span className="text-[10px] uppercase tracking-widest font-mono">Загрузка холста...</span>
                        </div>
                    ) : (
                        <img src={safeBg} alt="product" className="w-full h-full object-cover opacity-80" />
                    )}
                    
                    <div className="absolute top-[20%] bottom-[20%] left-[20%] right-[20%] border border-dashed border-white/20 pointer-events-none rounded-xl">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/30 tracking-widest uppercase whitespace-nowrap">Зона печати</span>
                    </div>

                    {/* Элементы */}
                    {elements.map(el => {
                        const isActive = activeId === el.id;
                        return (
                            <div 
                                key={el.id}
                                className={`absolute z-10 cursor-move ${isActive ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black rounded-sm' : ''}`}
                                style={{ left: `${el.x}px`, top: `${el.y}px`, transform: 'translate(-50%, -50%)' }} 
                                onTouchStart={(e) => handleTouchStart(e, el.id)}
                                onMouseDown={(e) => handleTouchStart(e, el.id)}
                            >
                                {/* 🔥 ИСПРАВЛЕНИЕ: Текст теперь просто текст (div), чтобы клавиатура телефона не прыгала */}
                                {el.type === 'text' ? (
                                    <div 
                                        className="font-black text-center whitespace-nowrap p-1"
                                        style={{ color: el.color, fontSize: `${el.size}px` }}
                                    >
                                        {el.content}
                                    </div>
                                ) : (
                                    <img src={el.content} alt="sticker" style={{ width: `${el.size}px`, height: 'auto' }} className="pointer-events-none block"/>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 🔥 ОБНОВЛЕННАЯ НИЖНЯЯ ПАНЕЛЬ */}
            <div className="bg-black border-t border-white/10 shrink-0 pb-8 pt-4 px-4 flex flex-col items-center justify-center gap-4">
                {activeEl ? (
                    <div className="w-full flex flex-col gap-4 animate-slide-up">
                        
                        {/* Панель редактирования текста */}
                        {activeEl.type === 'text' && (
                            <>
                                <input 
                                    type="text" 
                                    value={activeEl.content}
                                    onChange={updateText}
                                    placeholder="Введите текст"
                                    className="w-full bg-[#111] border border-white/20 text-white px-4 py-3 rounded-xl outline-none font-bold text-center"
                                />
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 justify-center">
                                    {TEXT_COLORS.map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => updateColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 shrink-0 shadow-lg transition-transform ${activeEl.color === c ? 'border-white scale-110' : 'border-white/20'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Кнопки размера и удаления */}
                        <div className="flex w-full items-center justify-between gap-4">
                            <button onClick={() => removeElement(activeId)} className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-red-500/20 shrink-0">
                                <Trash2 size={20}/>
                            </button>
                            
                            <div className="flex flex-1 items-center justify-center gap-4 bg-[#111] rounded-xl border border-white/10 h-12">
                                <button onClick={() => updateSize(-5)} className="w-12 h-full flex items-center justify-center active:bg-white/10 rounded-l-xl"><Minus size={18}/></button>
                                <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Размер</span>
                                <button onClick={() => updateSize(5)} className="w-12 h-full flex items-center justify-center active:bg-white/10 rounded-r-xl"><Plus size={18}/></button>
                            </div>

                            <button onClick={() => setActiveId(null)} className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center active:scale-90 transition-all font-bold shrink-0">
                                <Check size={20}/>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3 w-full animate-fade-in">
                        <button onClick={addText} className="flex-1 bg-[#111] border border-white/10 h-14 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                            <Type size={16} className="text-white"/>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Текст</span>
                        </button>
                        
                        <label className="flex-1 bg-[#111] border border-white/10 h-14 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer">
                            <ImageIcon size={16} className="text-white"/>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Стикер</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                        </label>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Customizer;
