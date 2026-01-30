import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Users, Plus, Upload, Loader, Package, Tag } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api'; // ТВОЙ URL

const Admin = ({ user, initData }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0 });
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PRODUCT FORM
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Clothing');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [productFile, setProductFile] = useState(null);
  
  // BRAND FORM
  const [brandName, setBrandName] = useState('');
  const [brandFile, setBrandFile] = useState(null);

  const fileInputRef = useRef(null);
  const brandInputRef = useRef(null);

  const safeId = user.telegram_id || user.id;

  useEffect(() => {
    fetchStats();
    fetchBrands();
  }, []);

  useEffect(() => {
    if (activeSection === 'orders') fetchOrders();
  }, [activeSection]);

  const fetchStats = async () => {
    try {
      const encodedInit = encodeURIComponent(initData);
      const res = await fetch(`${API_URL}/admin/stats?telegram_id=${safeId}&initData=${encodedInit}`);
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/brands`);
      if (res.ok) setBrands(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchOrders = async () => {
    try {
      const encodedInit = encodeURIComponent(initData);
      const res = await fetch(`${API_URL}/admin/orders?initData=${encodedInit}`);
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!productFile || !productName || !productPrice) return alert("Заполните все поля");
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('initData', initData); 
    formData.append('name', productName);
    formData.append('price', productPrice);
    formData.append('category', productCategory);
    if (selectedBrandId) formData.append('brand_id', selectedBrandId);
    formData.append('sizes', 'S,M,L,XL');
    formData.append('file', productFile);

    try {
        const res = await fetch(`${API_URL}/admin/products`, { method: 'POST', body: formData });
        if (res.ok) {
            alert("Товар создан!");
            setProductName(''); setProductPrice(''); setProductFile(null);
        } else {
            const err = await res.json();
            alert("Ошибка: " + (err.detail || "Неизвестная ошибка"));
        }
    } catch (e) { alert("Ошибка сети"); }
    setIsSubmitting(false);
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!brandFile || !brandName) return alert("Заполните все поля");
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('initData', initData); 
    formData.append('name', brandName);
    formData.append('file', brandFile);

    try {
        const res = await fetch(`${API_URL}/admin/brands`, { method: 'POST', body: formData });
        if (res.ok) {
            alert("Бренд создан!");
            setBrandName(''); setBrandFile(null);
            fetchBrands();
        } else {
            const err = await res.json();
            alert("Ошибка: " + (err.detail || "Неизвестная ошибка"));
        }
    } catch (e) { alert("Ошибка сети"); }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
      try {
          const res = await fetch(`${API_URL}/admin/orders/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData: initData, order_id: orderId, status: newStatus }) 
          });
          if (res.ok) {
              fetchOrders();
              if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
      } catch (e) { console.error(e); }
  }

  return (
    <div className="pt-24 pb-24 animate-fade-in px-4">
      <h1 className="text-3xl font-black uppercase mb-6">РЕЖИМ БОГА <span className="text-red-500">.</span></h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
        {[
            { id: 'dashboard', icon: DollarSign, label: 'Статистика' },
            { id: 'products', icon: Plus, label: 'Товар' },
            { id: 'brands', icon: Tag, label: 'Бренд' },
            { id: 'orders', icon: Package, label: 'Заказы' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${
                    activeSection === tab.id 
                    ? 'bg-white text-black border-white' 
                    : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/30'
                }`}
            >
                <tab.icon size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
        ))}
      </div>

      {activeSection === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
            <div className="bg-[#111] border border-white/10 p-4 rounded-xl col-span-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Выручка</span>
                <div className="text-4xl font-mono font-bold text-green-400 mt-1">{stats.revenue.toLocaleString()} ₽</div>
            </div>
            <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 uppercase">Заказы</span>
                <div className="text-2xl font-mono font-bold mt-1">{stats.orders}</div>
            </div>
            <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 uppercase">Клиенты</span>
                <div className="text-2xl font-mono font-bold mt-1">{stats.users}</div>
            </div>
        </div>
      )}

      {activeSection === 'products' && (
        <form onSubmit={handleCreateProduct} className="space-y-4 animate-slide-up">
            <div onClick={() => fileInputRef.current.click()} className="w-full h-40 bg-[#111] border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer">
                {productFile ? <img src={URL.createObjectURL(productFile)} className="w-full h-full object-cover rounded-xl" /> : <Upload className="text-gray-500" />}
                <input type="file" ref={fileInputRef} onChange={e => setProductFile(e.target.files[0])} className="hidden" accept="image/*" />
            </div>
            <input type="text" placeholder="Название товара" value={productName} onChange={e => setProductName(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none"/>
            <div className="flex gap-4">
                <input type="number" placeholder="Цена (₽)" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none"/>
                <select value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)} className="bg-[#111] border border-white/10 rounded-xl px-4 text-white outline-none w-1/2">
                    <option value="">Без бренда</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
            <button disabled={isSubmitting} className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase">{isSubmitting ? <Loader className="animate-spin mx-auto"/> : "Создать товар"}</button>
        </form>
      )}

      {activeSection === 'brands' && (
        <form onSubmit={handleCreateBrand} className="space-y-4 animate-slide-up">
            <div onClick={() => brandInputRef.current.click()} className="w-24 h-24 mx-auto bg-[#111] border border-dashed border-white/20 rounded-full flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {brandFile ? <img src={URL.createObjectURL(brandFile)} className="w-full h-full object-cover" /> : <Tag className="text-gray-500" />}
                <input type="file" ref={brandInputRef} onChange={e => setBrandFile(e.target.files[0])} className="hidden" accept="image/*" />
            </div>
            <input type="text" placeholder="Название бренда (Nike)" value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none text-center"/>
            <button disabled={isSubmitting} className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase">{isSubmitting ? <Loader className="animate-spin mx-auto"/> : "Создать бренд"}</button>
            <div className="pt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Существующие бренды</h3>
                <div className="flex gap-3 flex-wrap">
                    {brands.map(b => (
                        <div key={b.id} className="flex items-center gap-2 bg-[#111] px-3 py-2 rounded-lg border border-white/5">
                            <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden"><img src={`${API_URL.replace('/api', '')}${b.logo_url}`} className="w-full h-full object-cover"/></div>
                            <span className="text-xs font-bold uppercase">{b.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </form>
      )}

      {activeSection === 'orders' && (
        <div className="space-y-4 animate-slide-up">
            {orders.map(order => (
                <div key={order.id} className="bg-[#111] border border-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">Заказ #{order.id}</span>
                            <div className="text-sm font-bold text-white">{order.customer}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold">{order.total_amount} ₽</div>
                            <div className="text-[10px] text-gray-500">{order.created_at}</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-4 pb-4 border-b border-white/5 font-mono leading-relaxed">
                        {order.items}
                    </div>
                    <div className="flex gap-2">
                        {['new', 'processing', 'sent', 'done'].map(st => (
                            <button 
                                key={st}
                                onClick={() => handleStatusChange(order.id, st)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                    order.status === st 
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-transparent text-gray-600 border-white/10 hover:border-white/30'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}

    </div>
  );
};

export default Admin;