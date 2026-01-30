import React, { useEffect, useState } from 'react';
import { X, Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api'; // ТВОЙ URL

const Orders = ({ user, onClose, initData }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 🔥 ОТПРАВЛЯЕМ initData (ПАСПОРТ)
        const encodedInit = encodeURIComponent(initData);
        const res = await fetch(`${API_URL}/orders/${user.id}?initData=${encodedInit}`);
        
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          console.error("Ошибка загрузки заказов");
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && initData) {
      fetchOrders();
    }
  }, [user, initData]);

  // Хелпер для статусов
  const getStatusInfo = (status) => {
    switch (status) {
      case 'new': return { label: 'ОБРАБОТКА', color: 'text-yellow-500', icon: Clock };
      case 'processing': return { label: 'СОБИРАЕТСЯ', color: 'text-blue-500', icon: Package };
      case 'sent': return { label: 'ОТПРАВЛЕН', color: 'text-purple-500', icon: Truck };
      case 'done': return { label: 'ДОСТАВЛЕН', color: 'text-green-500', icon: CheckCircle };
      default: return { label: status, color: 'text-gray-500', icon: AlertCircle };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col animate-fade-in pb-safe">
      {/* HEADER */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/90 backdrop-blur">
        <h2 className="text-xl font-black uppercase tracking-tighter">Мои Заказы</h2>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
          <X size={20} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
             <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"/>
             <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Загрузка истории...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 mt-20">
            <Package size={48} strokeWidth={1} />
            <p className="font-mono text-xs uppercase tracking-widest">История заказов пуста</p>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={order.id} className="bg-[#111] border border-white/10 p-5 rounded-xl animate-slide-up">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">
                      Заказ #{order.id}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {order.created_at}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 ${statusInfo.color} border border-white/5`}>
                    <StatusIcon size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items_names.split(', ').map((item, idx) => (
                    <div key={idx} className="text-sm font-medium leading-tight">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Итого</span>
                  <span className="text-xl font-mono font-bold">{order.total_amount} ₽</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;