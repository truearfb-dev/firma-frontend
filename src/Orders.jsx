import React, { useState, useEffect } from 'react';
import { X, Package, Loader } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

const Orders = ({ user, initData, onClose }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const tgId = user.telegram_id || user.id;
                const encodedInit = encodeURIComponent(initData);
                const res = await fetch(`${API_URL}/orders/${tgId}?initData=${encodedInit}`);

                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                } else {
                    console.error("Ошибка загрузки заказов");
                }
            } catch (e) {
                console.error("Network error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        if (user && initData) {
            fetchOrders();
        }
    }, [user, initData]);

    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'sent': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'done': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-white/10 text-gray-400 border-white/20';
        }
    };

    const getStatusText = (status) => {
        switch(status?.toLowerCase()) {
            case 'new': return 'Новый';
            case 'processing': return 'В обработке';
            case 'sent': return 'Отправлен';
            case 'done': return 'Выполнен';
            default: return status || 'Неизвестно';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black animate-fade-in flex flex-col pb-safe">
            {/* 🔥 ИСПРАВЛЕНИЕ: Отступ увеличен до pt-24 */}
            <div className="px-6 pb-4 pt-24 flex items-center justify-between border-b border-white/10 shrink-0">
                <h2 className="text-xl font-black uppercase tracking-tighter">Мои заказы</h2>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90">
                    <X size={20} />
                </button>
            </div>

            {/* Список заказов */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-purple-500 gap-4">
                        <Loader className="animate-spin" size={32} />
                        <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Поиск заказов...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <Package size={48} className="opacity-50" />
                        <p className="font-mono text-xs uppercase tracking-widest">История заказов пуста</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-[#111] border border-white/10 rounded-2xl p-5 animate-slide-up shadow-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-mono mb-1">{order.created_at}</div>
                                    <div className="text-sm font-black uppercase tracking-wider">Заказ #{order.id}</div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="font-mono font-bold text-lg leading-none">{order.total_amount} ₽</div>
                                    <div className={`mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-white/5">
                                <span className="text-[9px] uppercase font-bold text-gray-600 tracking-widest block mb-2">Состав заказа:</span>
                                <div className="text-xs text-gray-300 font-mono leading-relaxed space-y-1">
                                    {order.items_names ? order.items_names.split(', ').map((item, idx) => {
                                        const isCustom = item.includes('🎨');
                                        const cleanName = item.replace(' 🎨 (Кастом)', '');
                                        
                                        return (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="text-gray-600">-</span> 
                                                <span className={isCustom ? 'text-white' : ''}>{cleanName}</span>
                                                {isCustom && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded ml-1 font-bold">КАСТОМ</span>}
                                            </div>
                                        )
                                    }) : 'Товары не найдены'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Orders;
