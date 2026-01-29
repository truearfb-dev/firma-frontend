import React, { useEffect, useState } from 'react';
import { X, Package, Loader, Clock } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

const Orders = ({ user, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // Запрашиваем историю по telegram_id
      const res = await fetch(`${API_URL}/orders/${user.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
    } finally {
      setLoading(false);
    }
  };

  // Хелпер для цвета статуса
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'text-yellow-500 border-yellow-500/50';
      case 'paid': return 'text-green-500 border-green-500/50';
      case 'completed': return 'text-blue-500 border-blue-500/50';
      case 'canceled': return 'text-red-500 border-red-500/50';
      default: return 'text-gray-500 border-gray-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col animate-fade-in pb-safe">
      
      {/* HEADER */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/90 backdrop-blur">
        <h2 className="text-xl font-black uppercase tracking-tighter">My Orders</h2>
        <button 
          onClick={onClose}
          className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* СПИСОК */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
            <Loader className="animate-spin" />
            <span className="text-xs font-mono uppercase">Loading history...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
            <Package size={48} className="opacity-20" />
            <span className="text-xs font-mono uppercase">No orders yet</span>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-[#111] border border-white/5 p-4 rounded-xl animate-slide-up">
              
              {/* Верхняя часть: Номер и Дата */}
              <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-2">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Order #{order.id}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
                    <Clock size={10} />
                    {order.created_at}
                  </div>
                </div>
                {/* Статус (Badge) */}
                <div className={`px-2 py-1 border text-[10px] font-bold uppercase tracking-widest rounded-md ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
              </div>

              {/* Список товаров (текстом) */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-300 line-clamp-2">
                  {order.items_names || "Товары не указаны"}
                </p>
              </div>

              {/* Итого */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-mono uppercase">Total Amount</span>
                <span className="text-xl font-mono font-bold">{order.total_amount} ₽</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;