import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Type, Image as ImageIcon, X, Trash2, Save, Plus, Minus, Check } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

const Customizer = ({ bgImage, onClose, onSave }) => {
    const [elements, setElements] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeId, setActiveId] = useState(null); 
    const canvasRef = useRef(null);
    
    // 🔥 Стейт для безопасной картинки
    const [safeBg, setSafeBg] = useState(bgImage);

    const tgInitData = window.Telegram?.WebApp?.initData || '';

    // 🔥 Превращаем фон в Base64, чтобы обойти жесткие блокировки Safari/Telegram
    useEffect(() => {
        const fetchBg = async () => {
            try {
                const res = await fetch(bgImage);
                const blob = await res.blob();
                const reader = new FileReader();
                reader.onloadend = () => setSafeBg(reader.result);
                reader.readAsDataURL(blob);
            } catch (e) {
                console.error("Failed to convert bg to base64", e);
            }
        };
        if (bgImage && bgImage.startsWith('http')) fetchBg();
    }, [bgImage]);

    // Добавление текста
    const addText = () => {
        const id = Date.now();
        setElements([...elements, { id, type: 'text', content: 'ТЕКСТ', x: 100, y: 150, color: '#ffffff', size: 24 }]);
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

    // Обновление текста
    const updateText = (e, id) => {
        setElements(elements.map(el => el.id === id ? { ...el, content: e.target.value } : el));
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

            // 🔥 Убрали allowTaint: true, теперь браузер не будет ругаться!
            const canvas = await html2canvas(canvasRef.current, {
                backgroundColor: '#0a0a0a',
                useCORS: true,      
                scale: 2
            });

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("Не удалось создать файл");
                
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
                    alert("Ошибка сохранения на сервере");
                    setIsSaving(false);
                }
            }, 'image/png');

        } catch (error) {
            console.error("Canvas error:", error);
            alert(`Ошибка: ${error.message}`);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col animate-fade-in touch-none">
            
            {/* Шапка */}
            <div className="flex justify-between items-center p-4 bg-black/90 backdrop-blur border-b border-white/10 shrink-0">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
                <div className="font-black tracking-widest uppercase text-sm">Свой Дизайн</div>
                <button onClick={handleSave} disabled={isSaving || elements.length === 0} className={`p-2 rounded-full ${elements.length > 0 ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                    {isSaving ? <Loader size={20} className="animate-spin"/> : <Save size={20} />}
                </button>
            </div>

            {/* Холст */}
            <div 
                className="flex-1 relative bg-[#111] overflow-hidden flex items-center justify-center"
                onClick={() => setActiveId(null)} 
            >
                <div ref={canvasRef} className="relative w-full max-w-[350px] aspect-[4/5] bg-[#0a0a0a]">
                    {/* 🔥 Используем safeBg */}
                    <img src={safeBg} alt="product" crossOrigin="anonymous" className="w-full h-full object-cover opacity-80" />
                    
                    {/* Границы печати */}
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
                                {el.type === 'text' ? (
                                    <input 
                                        type="text" 
                                        value={el.content}
                                        onChange={(e) => updateText(e, el.id)}
                                        className="bg-transparent border-none outline-none font-black text-center whitespace-nowrap p-0 m-0 w-auto"
                                        style={{ color: el.color, fontSize: `${el.size}px` }}
                                        readOnly={!isActive} 
                                    />
                                ) : (
                                    <img src={el.content} alt="sticker" style={{ width: `${el.size}px`, height: 'auto' }} className="pointer-events-none block"/>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Нижняя панель управления */}
            <div className="bg-black border-t border-white/10 shrink-0 pb-8 pt-4 px-4 h-[120px] flex items-center justify-center">
                {activeId ? (
                    <div className="flex w-full items-center justify-between gap-4 animate-slide-up">
                        <button onClick={() => removeElement(activeId)} className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-red-500/20">
                            <Trash2 size={20}/>
                        </button>
                        
                        <div className="flex flex-1 items-center justify-center gap-4 bg-[#111] rounded-xl border border-white/10 h-12">
                            <button onClick={() => updateSize(-10)} className="w-12 h-full flex items-center justify-center active:bg-white/10 rounded-l-xl"><Minus size={18}/></button>
                            <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Размер</span>
                            <button onClick={() => updateSize(10)} className="w-12 h-full flex items-center justify-center active:bg-white/10 rounded-r-xl"><Plus size={18}/></button>
                        </div>

                        <button onClick={() => setActiveId(null)} className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center active:scale-90 transition-all font-bold">
                            <Check size={20}/>
                        </button>
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
