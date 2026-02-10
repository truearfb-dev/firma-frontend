import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, X, Loader, User, Heart } from 'lucide-react'; // Вернул User и Heart
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import Admin from './Admin';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

// Функция исправления картинок (ОСТАВЛЯЕМ, она важна!)
const getImgUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/300x300?text=No+Image';
  const firstImage = url.includes(',') ? url.split(',')[0] : url;
  return firstImage.startsWith('http') 
    ? firstImage 
    : `https://firmashop-truear.waw0.amvera.tech${firstImage}`;
};

const App = () => {
  const [activeTab, setActiveTab] = useState('shop'); // shop | cart | profile | admin
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [initData, setInitData] = useState('');
  const [loading, setLoading] = useState(true);

  // Дополнительные экраны (Избранное, История заказов)
  const [userOrders, setUserOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
        
        setInitData(tg.initData);
        
        fetch(`${API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                initData: tg.initData,
                start_param: tg.initDataUnsafe?.start_param 
            })
        })
        .then(res => res.json())
        .then(data => {
            setUser(data);
            fetchUserData(data.telegram_id, tg.initData); // Грузим данные юзера
        })
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

  const fetchUserData = async (tgId, initStr) => {
      try {
          const encodedInit = encodeURIComponent(initStr);
          const [oRes, fRes] = await Promise.all([
              fetch(`${API_URL}/orders/${tgId}?initData=${encodedInit}`),
              fetch(`${API_URL}/favorites/${tgId}?initData=${encodedInit}`) // Если есть такой эндпоинт
          ]);
          if (oRes.ok) setUserOrders(await oRes.json());
          // favorites можно добавить позже если есть API
      } catch (e) { console.error(e); }
  }

  const addToCart = (product, size) => {
    const newItem = { ...product, selectedSize: size, cartId: Date.now() };
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
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

  // АДМИНКА
  if (activeTab === 'admin') {
      return (
        <div className="bg-black min-h-screen text-white">
            <button onClick={() => setActiveTab('shop')} className="fixed top-4 left-4 z-50 bg-white/10 p-2 rounded-full"><X /></button>
            <Admin user={user} initData={initData} />
        </div>
      );
  }

  // ПРОФИЛЬ (Личный кабинет)
  if (activeTab === 'profile') {
      return (
          <div className="min-h-screen bg-black text-white p-6 pb-24 animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-black uppercase">Профиль</h1>
                  {user?.is_admin && (
                      <button onClick={() => setActiveTab('admin')} className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase">
                          Admin Panel
                      </button>
                  )}
              </div>
              
              <div className="bg-[#111] p-6 rounded-2xl mb-6 border border-white/10 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">
                      {user?.first_name?.[0]}
                  </div>
                  <div>
                      <div className="font-bold text-lg">{user?.first_name}</div>
                      <div className="text-gray-500 text-xs">ID: {user?.telegram_id}</div>
                  </div>
              </div>

              <h2 className="text-xl font-bold uppercase mb-4">Мои заказы</h2>
              <div className="space-y-4">
                  {userOrders.length > 0 ? userOrders.map(order => (
                      <div key={order.id} className="bg-[#111] p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between mb-2">
                              <span className="font-mono text-xs text-gray-500">#{order.id}</span>
                              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                  order.status === 'done' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                              }`}>{order.status}</span>
                          </div>
                          <div className="text-sm font-bold mb-1">{order.items_names}</div>
                          <div className="text-xs text-gray-400">{order.created_at} — {order.total_amount} ₽</div>
                      </div>
                  )) : (
                      <div className="text-gray-500 text-center py-8">Истории заказов пока нет</div>
                  )}
              </div>
          </div>
      );
  }

  // КОРЗИНА
  if (activeTab === 'cart') {
    return <Cart cart={cart} onBack={() => setActiveTab('shop')} onRemove={removeFromCart} initData={initData} />;
  }

  // ДЕТАЛЬНАЯ КАРТОЧКА
  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={addToCart} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pb-24">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-4 h-14">
          <div className="text-xl font-black tracking-tighter">FIRMA</div>
          <div className="flex gap-4">
            <Search className="text-gray-400" size={20} />
            {/* Вместо текста ПРИВЕТ - показываем баланс или ничего, чтобы не мелькал GUEST */}
            {user && <div className="text-xs font-bold text-green-500 flex items-center">{user.balance} ₽</div>}
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
                        {/* 🔥 ТУТ ИСПРАВЛЕНИЕ КАРТИНКИ */}
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

      {/* 🔥 ВОЗВРАЩАЕМ ПРАВИЛЬНУЮ НИЖНЮЮ ПАНЕЛЬ */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center px-6 z-50">
        
        {/* Кнопка Магазин */}
        <button onClick={() => setActiveTab('shop')} className={`p-2 transition-colors ${activeTab === 'shop' ? 'text-white' : 'text-gray-600'}`}>
            <ShoppingBag size={24} strokeWidth={activeTab === 'shop' ? 2.5 : 2} />
        </button>
        
        {/* Кнопка Корзины (с цифрой) */}
        <button onClick={() => setActiveTab('cart')} className="relative p-2">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${cart.length > 0 ? 'bg-white border-white text-black' : 'border-white/20 text-white'}`}>
                <span className="font-mono font-bold text-lg">{cart.length}</span>
            </div>
        </button>

        {/* Кнопка Профиль (Человечек) */}
        <button onClick={() => setActiveTab('profile')} className={`p-2 transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-gray-600'}`}>
             <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
        </button>

      </div>

    </div>
  );
};

export default App;