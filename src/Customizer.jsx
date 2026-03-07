import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Type, Image as ImageIcon, X, Trash2, Save, Move } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

const Customizer = ({ bgImage, onClose, onSave }) => {
    const [elements, setElements] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const canvasRef = useRef(null);

    const tgInitData = window.Telegram?.WebApp?.initData || '';

    // Добавление текста
    const addText = () => {
        setElements([...elements, {
            id: Date.now(),
            type: 'text',
            content: 'ВАШ ТЕКСТ',
            x: 50,
            y: 50,
            color: '#ffffff',
            size: 20
        }]);
    };

    // Добавление картинки
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setElements([...elements, {
                id: Date.now(),
                type: 'image',
                content: url,
                x: 50,
                y: 50,
                width: 100
            }]);
        }
    };

    // Удаление элемента
    const removeElement = (id) => {
        setElements(elements.filter(el => el.id !== id));
    };

    // Простая физика перетаскивания (Drag and Drop) для мобилок
    const handleTouchStart = (e, id) => {
        const touch = e.touches[0];
        const el = elements.find(e => e.id === id);
        
        const startX = touch.clientX - el.x;
        const startY = touch.clientY - el.y;

        const handleTouchMove = (moveEvent) => {
            const moveTouch = moveEvent.touches[0];
            setElements(prev => prev.map(item => {
                if (item.id === id) {
                    return { ...item, x: moveTouch.clientX - startX, y: moveTouch.clientY - startY };
                }
                return item;
            }));
        };

        const handleTouchEnd = () => {
            document.removeElementEventListener('touchmove', handleTouchMove);
            document.removeElementEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    // Сохранение (Скриншот)
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Делаем скриншот области
            const canvas = await html2canvas(canvasRef.current, {
                backgroundColor: null,
                useCORS: true,
                scale: 2 // Для хорошего качества
            });

            // Превращаем скриншот в файл
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('initData', tgInitData);
                formData.append('file', blob, `custom_${Date.now()}.png`);

                // Отправляем на бэкенд
                const res = await fetch(`${API_URL}/custom-design/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    onSave(data.url); // Возвращаем ссылку в ProductDetail
                } else {
                    alert("Ошибка сохранения макета");
                }
                setIsSaving(false);
            }, 'image/png');

        } catch (error) {
            console.error("Canvas error:", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col animate-fade-in">
            
            {/* Шапка редактора */}
            <div className="flex justify-between items-center p-4 bg-black/90 backdrop-blur border-b border-white/10">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
                <div className="font-black tracking-widest uppercase text-sm">Свой Дизайн</div>
                <button onClick={handleSave} disabled={isSaving || elements.length === 0} className={`p-2 rounded-full ${elements.length > 0 ? 'bg-purple-600' : 'bg-white/10'}`}>
                    {isSaving ? <Loader size={20} className="animate-spin"/> : <Save size={20} />}
                </button>
            </div>

            {/* Зона Холста (Canvas) */}
            <div className="flex-1 relative bg-[#111] overflow-hidden flex items-center justify-center">
                <div ref={canvasRef} className="relative w-full max-w-[350px] aspect-[4/5] bg-black">
                    <img src={bgImage} alt="base" className="w-full h-full object-cover opacity-80" crossOrigin="anonymous"/>
                    
                    {/* Границы печати (пунктир) */}
                    <div className="absolute top-[20%] bottom-[20%] left-[20%] right-[20%] border-2 border-dashed border-white/20 pointer-events-none rounded-xl">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/50 tracking-widest uppercase">Зона печати</span>
                    </div>

                    {/* Элементы дизайна */}
                    {elements.map(el => (
                        <div 
                            key={el.id}
                            className="absolute z-10 group"
                            style={{ left: `${el.x}px`, top: `${el.y}px` }}
                        >
                            {/* Кнопка удаления (видна при клике) */}
                            <button onClick={() => removeElement(el.id)} className="absolute -top-3 -right-3 bg-red-500 rounded-full p-1 opacity-0 group-active:opacity-100 transition-opacity">
                                <Trash2 size={12}/>
                            </button>

                            {/* Ручка для перемещения */}
                            <div 
                                onTouchStart={(e) => handleTouchStart(e, el.id)}
                                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-black rounded-full p-1 opacity-0 group-active:opacity-100"
                            >
                                <Move size={12}/>
                            </div>

                            {el.type === 'text' ? (
                                <input 
                                    type="text" 
                                    value={el.content}
                                    onChange={(e) => setElements(elements.map(item => item.id === el.id ? {...item, content: e.target.value} : item))}
                                    className="bg-transparent border-none outline-none font-black text-center whitespace-nowrap p-0 m-0"
                                    style={{ color: el.color, fontSize: `${el.size}px` }}
                                />
                            ) : (
                                <img src={el.content} alt="sticker" style={{ width: `${el.width}px` }} className="pointer-events-none"/>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Панель инструментов (Тулбар) */}
            <div className="p-4 bg-black border-t border-white/10 pb-10">
                <div className="flex gap-2">
                    <button onClick={addText} className="flex-1 bg-[#111] border border-white/10 py-4 rounded-xl flex flex-col items-center gap-2 active:bg-white/5 transition-all">
                        <Type size={20} className="text-white"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Текст</span>
                    </button>
                    
                    <label className="flex-1 bg-[#111] border border-white/10 py-4 rounded-xl flex flex-col items-center gap-2 active:bg-white/5 transition-all cursor-pointer">
                        <ImageIcon size={20} className="text-white"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Стикер</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                    </label>
                </div>
                <p className="text-[9px] text-gray-500 font-mono text-center mt-4">
                    Перетаскивай элементы пальцем. Нажми, чтобы удалить.
                </p>
            </div>

        </div>
    );
};

export default Customizer;
