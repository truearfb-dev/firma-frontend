import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, X, Loader } from 'lucide-react';
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import Admin from './Admin';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api'; // ТВОЙ URL

// 🔥 ФУНКЦИЯ-ПОМОЩНИК: БЕРЕТ ТОЛЬКО ПЕРВУЮ КАРТИНКУ
const getImgUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/300x300?text=No+Image';
  // Если есть запятая - берем первую часть
  const firstImage = url.includes(',') ? url.split(',')[0] : url;
  // Если ссылка не полная - добавляем домен
  return firstImage.startsWith('http') 
    ? firstImage 
    : `https://firmashop-truear.waw0.amvera.tech${firstImage}`;
};

const App = () => {
  const [activeTab, setActiveTab] = useState('shop');
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Инициализация Telegram
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        // ВАЖНО: Убираем белый фон, делаем черный
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
        
        setInitData(tg.initData);
        
        // Авторизация
        fetch(`${API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                initData: tg.initData,
                start_param: tg.initDataUnsafe?.start_param 
            })
        })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(err => console.error("Auth error:", err));
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [pRes, bRes] = await Promise.all([
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/brands`)
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (bRes.ok) setBrands(await bRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addToCart = (product, size) => {
    const newItem = { ...product, selectedSize: size, cartId: Date.now() };
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Все' || 
       (selectedCategory === 'Clothing' && p.category === 'Clothing') ||
       (selectedCategory === 'Shoes' && p.category === 'Shoes') ||
       (p.brand && p.brand.name === selectedCategory);
    
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader className="animate-spin text-white" /></div>;

  // Если открыта Админка
  if (activeTab === 'admin') {
      return (
        <div className="bg-black min-h-screen text-white">
            <button onClick={() => setActiveTab('shop')} className="fixed top-4 left-4 z-50 bg-white/10 p-2 rounded-full"><X /></button>
            <Admin user={user} initData={initData} />
        </div>
      );
  }

  // Если открыт Товар
  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={addToCart} />;
  }

  // Если открыта Корзина
  if (activeTab === 'cart') {
    return <Cart cart={cart} onBack={() => setActiveTab('shop')} onRemove={removeFromCart} initData={initData} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pb-24">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-4 h-14">
          <div className="text-xl font-black tracking-tighter">FIRMA</div>
          <div className="flex gap-4">
            <Search className="text-gray-400" size={20} />
            <div className="text-xs font-bold text-gray-500 uppercase flex items-center">
                ПРИВЕТ, {user?.first_name || 'GUEST'}
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <div className="mt-14 relative h-[40vh] bg-[#111] overflow-hidden flex items-center justify-center border-b border-white/10">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1550614000-4b9519e02a23?q=80&w=2000&auto=format&fit=crop')] bg-center bg-cover grayscale mix-blend-screen"></div>
        <div className="relative z-10 text-center">
            <div className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-2">ВЕСНА 2026</div>
            <div className="text-6xl font-black uppercase leading-[0.85] tracking-tighter">
                НОВАЯ<br/><span className="text-gray-600">КОЛЛЕКЦИЯ</span>
            </div>
        </div>
      </div>

      {/* BRANDS SCROLL */}
      <div className="py-8 overflow-x-auto no-scrollbar pl-4">
        <div className="flex gap-6">
            {brands.map(brand => (
                <button key={brand.id} onClick={() => setSelectedCategory(brand.name)} className="flex flex-col items-center gap-2 min-w-[70px] group">
                    <div className={`w-16 h-16 rounded-full border border-white/20 p-1 ${selectedCategory === brand.name ? 'border-white bg-white' : ''}`}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-black">
                             <img src={`https://firmashop-truear.waw0.amvera.tech${brand.logo_url}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory === brand.name ? 'text-white' : 'text-gray-500'}`}>{brand.name}</span>
                </button>
            ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="px-4 mb-8 flex gap-2 overflow-x-auto no-scrollbar">
        {['Все', 'Clothing', 'Shoes'].map(cat => (
            <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                    ? 'bg-white text-black border-white' 
                    : 'bg-transparent text-gray-500 border-white/20 hover:border-white'
                }`}
            >
                {cat}
            </button>
        ))}
      </div>

      {/* PRODUCTS GRID */}
      <div className="px-2 grid grid-cols-2 gap-2">
        {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
                <div 
                    key={product.id} 
                    onClick={() => setSelectedProduct(product)}
                    className="group relative bg-[#0a0a0a] rounded-xl overflow-hidden active:scale-95 transition-all duration-300"
                >
                    <div className="aspect-[3/4] overflow-hidden relative">
                        {/* 🔥 ВОТ ЗДЕСЬ ИСПОЛЬЗУЕМ getImgUrl */}
                        <img 
                            src={getImgUrl(product.image_url)} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur p-2 rounded-full">
                            <ShoppingBag size={14} className="text-white"/>
                        </div>
                    </div>
                    <div className="p-3">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {product.brand ? product.brand.name : 'FIRMA'}
                        </div>
                        <div className="text-xs font-bold uppercase text-white truncate mb-1">
                            {product.name}
                        </div>
                        <div className="text-sm font-mono font-bold text-white">
                            {product.price} ₽
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="col-span-2 text-center py-20 text-gray-600 font-mono text-xs uppercase tracking-widest">
                Товары не найдены
            </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center px-6 z-50">
        <button onClick={() => setActiveTab('shop')} className={`p-2 ${activeTab === 'shop' ? 'text-white' : 'text-gray-600'}`}>
            <ShoppingBag size={24} strokeWidth={activeTab === 'shop' ? 2.5 : 2} />
        </button>
        <button className="p-2 text-gray-600">
             <Search size={24} />
        </button>
        <button onClick={() => setActiveTab('cart')} className="relative p-2">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${cart.length > 0 ? 'bg-white border-white text-black' : 'border-white/20 text-white'}`}>
                <span className="font-mono font-bold text-lg">{cart.length}</span>
            </div>
        </button>
        {/* КНОПКА АДМИНКИ (ТОЛЬКО ДЛЯ АДМИНА) */}
        {user?.is_admin && (
             <button onClick={() => setActiveTab('admin')} className={`p-2 ${activeTab === 'admin' ? 'text-white' : 'text-gray-600'}`}>
                <span className="text-xl">⚙️</span>
             </button>
        )}
      </div>

    </div>
  );
};

export default App;