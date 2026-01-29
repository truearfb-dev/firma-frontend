import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Users, Plus, Upload, Loader, CheckCircle } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

const Admin = ({ user }) => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Форма товара
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Clothing');
  const [productFile, setProductFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats?telegram_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Stats error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProductFile(e.target.files[0]);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!productFile || !productName || !productPrice) {
      alert("Please fill all fields and select image");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('telegram_id', user.id);
    formData.append('name', productName);
    formData.append('price', productPrice);
    formData.append('category', productCategory);
    formData.append('sizes', 'S,M,L,XL'); // Дефолтные размеры
    formData.append('file', productFile);

    try {
      const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        alert("Product Created!");
        // Сброс формы
        setProductName('');
        setProductPrice('');
        setProductFile(null);
      } else {
        alert("Error creating product");
      }
    } catch (error) {
      console.error(error);
      alert("Network Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-24 animate-fade-in px-6">
      <h1 className="text-4xl font-black uppercase mb-8">God Mode <span className="text-red-500">.</span></h1>

      {/* 📊 СТАТИСТИКА */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl col-span-2">
           <div className="flex items-center gap-2 text-gray-500 mb-2">
             <DollarSign size={16} />
             <span className="text-xs font-bold uppercase tracking-widest">Total Revenue</span>
           </div>
           <div className="text-4xl font-mono font-bold text-green-400">
             {stats.revenue.toLocaleString()} ₽
           </div>
        </div>
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
           <div className="flex items-center gap-2 text-gray-500 mb-2">
             <ShoppingBag size={16} />
             <span className="text-xs font-bold uppercase tracking-widest">Orders</span>
           </div>
           <div className="text-2xl font-mono font-bold">{stats.orders}</div>
        </div>
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
           <div className="flex items-center gap-2 text-gray-500 mb-2">
             <Users size={16} />
             <span className="text-xs font-bold uppercase tracking-widest">Users</span>
           </div>
           <div className="text-2xl font-mono font-bold">{stats.users}</div>
        </div>
      </div>

      {/* ➕ ДОБАВЛЕНИЕ ТОВАРА */}
      <div className="mb-4 flex items-center gap-2">
        <Plus className="text-red-500" size={20} />
        <h2 className="text-xl font-bold uppercase">Add Product</h2>
      </div>

      <form onSubmit={handleCreateProduct} className="space-y-4">
        {/* Загрузка фото */}
        <div 
            onClick={() => fileInputRef.current.click()}
            className="w-full h-48 bg-[#111] border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer active:bg-[#222] transition-colors overflow-hidden"
        >
            {productFile ? (
                <img src={URL.createObjectURL(productFile)} className="w-full h-full object-cover" />
            ) : (
                <>
                    <Upload className="text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Tap to Upload Image</span>
                </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>

        <input 
            type="text" 
            placeholder="Product Name (e.g. Hoodie)" 
            value={productName}
            onChange={e => setProductName(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-white transition-all outline-none"
        />

        <div className="flex gap-4">
            <input 
                type="number" 
                placeholder="Price (₽)" 
                value={productPrice}
                onChange={e => setProductPrice(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-white transition-all outline-none font-mono"
            />
            <select 
                value={productCategory}
                onChange={e => setProductCategory(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-xl px-4 text-white outline-none"
            >
                <option value="Clothing">Clothing</option>
                <option value="Accessories">Accessories</option>
                <option value="Shoes">Shoes</option>
            </select>
        </div>

        <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
            {isSubmitting ? <Loader className="animate-spin" /> : "Create Product"}
        </button>
      </form>

    </div>
  );
};

export default Admin;