import { useState, useEffect, useMemo } from 'react'
import { Loader, CheckCircle, Copy, Package, Heart, X, Search, Square, LayoutGrid, Tag, ArrowLeft } from 'lucide-react'
import BottomNav from './BottomNav'
import ProductDetail from './ProductDetail'
import Cart from './Cart'
import Orders from './Orders'
import Community from './Community'
import Admin from './Admin'

const BASE_URL = 'https://firmashop-truear.waw0.amvera.tech'; 
const API_URL = `${BASE_URL}/api`;
const BOT_USERNAME = 'Firma_projectBot'; 

function App() {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([]) 
  const [user, setUser] = useState(null)
  const [initData, setInitData] = useState('') 
  const [activeTab, setActiveTab] = useState('shop')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [selectedProduct, setSelectedProduct] = useState(null) 
  const [cart, setCart] = useState([]) 
  const [favorites, setFavorites] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Все')
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [gridView, setGridView] = useState('single'); 

  const safeUserId = user?.telegram_id || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  const getImageUrl = (url) => {
    if (!url) return null;
    const cleanUrl = url.includes(',') ? url.split(',')[0] : url;
    if (cleanUrl.startsWith('http')) return cleanUrl;
    return `${BASE_URL}${cleanUrl}`;
  }

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation(); 
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); 
      
      const rawInitData = tg.initData; 
      setInitData(rawInitData);

      const userData = tg.initDataUnsafe?.user;
      const startParam = tg.initDataUnsafe?.start_param;
      
      if (userData && rawInitData) {
        setUser(userData);
        loginUser(rawInitData, startParam); 
        fetchFavorites(userData.id); 
      }
    }

    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => { setProducts(data); setIsLoading(false); })
      .catch(err => console.error("Ошибка:", err))
    fetch(`${API_URL}/brands`)
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error("Brand Error:", err))
  }, [])

  const loginUser = async (initDataStr, startParam) => {
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initDataStr, start_param: startParam }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.is_admin) setIsAdmin(true);
        setUser(prev => ({...prev, ...data})); 
      }
    } catch (error) { console.error("Login failed:", error); }
  }

  const fetchFavorites = async (tgId) => {
    try {
      const res = await fetch(`${API_URL}/favorites/${tgId}`);
      const data = await res.json();
      setFavorites(data);
    } catch (error) { console.error("Fav load error:", error); }
  }

  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    const isLiked = favorites.includes(productId);
    if (isLiked) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
    
    if (user && initData) {
      try {
        await fetch(`${API_URL}/favorites/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initData, product_id: productId }) 
        });
      } catch (error) { console.error("Like error:", error); }
    }
  }

  const handleToggleBrandLike = async (e, brandId) => {
    e.stopPropagation(); 
    if (!safeUserId) return;

    setBrands(prev => prev.map(b => {
        if (b.id === brandId) {
            const hasLiked = b.liked_by?.includes(safeUserId);
            const newLikedBy = hasLiked
                ? b.liked_by.filter(id => id !== safeUserId)
                : [...(b.liked_by || []), safeUserId];
            return { ...b, liked_by: newLikedBy, likes_count: newLikedBy.length };
        }
        return b;
    }));

    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');

    if (initData) {
        try {
            await fetch(`${API_URL}/brands/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: initData, brand_id: brandId })
            });
        } catch (error) { console.error("Brand like error:", error); }
    }
  };

  const handleAddToCart = (product, size, customDesignUrl = null) => {
    const itemToAdd = { ...product, selectedSize: size, customDesignUrl };
    setCart([...cart, itemToAdd]); 
    setSelectedProduct(null); 
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  const handleRemoveFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  }

  const handleCheckout = async () => {
    if (!user || !initData) { alert("Ошибка: Нет авторизации"); return; }
    
    const orderItems = cart.map(item => ({ 
        product_id: item.id, 
        size: item.selectedSize || null,
        custom_design_url: item.customDesignUrl || null 
    }));

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initData, items: orderItems }) 
        });
        if (response.ok) {
            setCart([]); setIsCartOpen(false); setOrderSuccess(true);
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        } else {
            alert("Ошибка при создании заказа");
        }
    } catch (error) { console.error(error); }
  }

  const handleOpenProductFromCommunity = (productId) => {
      const fullProduct = products.find(p => p.id === productId);
      if (fullProduct) {
          setSelectedProduct(fullProduct);
      }
  }

  const categories = useMemo(() => {
    const allCats = products.map(p => p.category).filter(Boolean);
    return ['Все', 'Избранное', ...new Set(allCats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.brand && p.brand.name.toLowerCase().includes(query))
        );
    }
    if (selectedBrand) {
        result = result.filter(p => p.brand_id === selectedBrand.id);
    }
    if (selectedCategory === 'Избранное') {
       result = result.filter(p => favorites.includes(p.id));
    } else if (selectedCategory !== 'Все') {
       result = result.filter(p => p.category === selectedCategory);
    }
    return result;
  }, [products, selectedCategory, favorites, selectedBrand, searchQuery]);

  const handleInvite = () => {
    if (!user) return;
    const safeId = user.telegram_id || user.id; 
    const inviteLink = `https://t.me/${BOT_USERNAME}/app?startapp=ref_${safeId}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const renderProfile = () => (
    <div className="pt-32 px-6 text-center animate-fade-in pb-20">
      <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl border border-white/5">
        {user?.photo_url ? <img src={user.photo_url} className="w-full h-full rounded-full" /> : <span>👤</span>}
      </div>
      <h2 className="text-2xl font-black uppercase mb-2">{user ? user.first_name : 'ГОСТЬ'}</h2>
      <p className="text-gray-500 font-mono text-xs mb-8">@{user ? user.username : 'guest'}</p>
      {isAdmin && <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/50 rounded-full text-red-500 text-[10px] font-bold uppercase tracking-widest mb-6">Доступ Администратора</div>}
      <div className="bg-[#111] border border-white/10 p-8 rounded-xl mb-6">
        <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase mb-4">Твой Баланс</p>
        <div className="text-5xl font-mono font-bold tracking-tight">{user?.balance || '0.00'} ₽</div>
      </div>
      <button onClick={() => setIsOrdersOpen(true)} className="w-full bg-[#111] border border-white/10 text-white font-bold py-4 mb-3 uppercase tracking-wider text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#222] transition-all"><Package size={18} /><span>Мои Заказы</span></button>
      <button onClick={handleInvite} className={`w-full font-bold py-4 uppercase tracking-wider text-sm rounded-lg flex items-center justify-center gap-2 transition-all ${inviteCopied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}>{inviteCopied ? <><CheckCircle size={18} /><span>Ссылка скопирована!</span></> : <><Copy size={18} /><span>Пригласи Друга (+50₽)</span></>}</button>
    </div>
  )

  if (orderSuccess) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 animate-fade-in text-center">
            <CheckCircle size={64} className="text-white mb-6" />
            <h1 className="text-4xl font-black uppercase mb-4 tracking-tighter">Заказ<br/>Оформлен</h1>
            <p className="text-gray-400 font-mono text-xs max-w-xs mb-12">Мы свяжемся с вами в ближайшее время для подтверждения.</p>
            <button onClick={() => setOrderSuccess(false)} className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider text-sm rounded-lg w-full max-w-xs">Продолжить покупки</button>
        </div>
    )
  }

  const renderShop = () => (
    <div className="animate-fade-in">
        {!searchQuery && (
          <section className="pt-32 pb-6 px-4 flex flex-col items-center justify-center text-center">
            {selectedBrand ? (
              <div className="animate-slide-up">
                  {/* 🔥 ИСПРАВЛЕНИЕ: Кнопка "ГЛАВНОЕ МЕНЮ" красного цвета */}
                  <button onClick={() => setSelectedBrand(null)} className="mb-4 text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 justify-center tracking-widest uppercase transition-colors">
                      <ArrowLeft size={14}/> ГЛАВНОЕ МЕНЮ
                  </button>
                  <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">{selectedBrand.name}</h1>
                  <p className="text-gray-400 text-sm font-light max-w-xs mx-auto">{selectedBrand.description || "Официальная коллекция"}</p>
              </div>
            ) : (
              <div className="relative w-full py-12 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-white/5 bg-[#0a0a0a] shadow-[0_0_40px_rgba(255,255,255,0.02)]">
                  <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-white/10 rounded-full blur-[40px] animate-float pointer-events-none"></div>
                  <div className="absolute bottom-[-20%] right-[-10%] w-56 h-56 bg-white/5 rounded-full blur-[50px] animate-float-delayed pointer-events-none"></div>
                  <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent animate-scanline shadow-[0_0_15px_rgba(255,255,255,0.3)] z-20 pointer-events-none"></div>

                  <p className="text-[10px] font-bold tracking-[0.3em] text-gray-500 mb-4 uppercase relative z-10">OFFICIAL</p>
                  <h1 className="text-6xl font-black tracking-tighter leading-[0.85] relative z-10">
                      <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">FIRMA</span><br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-700">ARCHIVE</span>
                  </h1>
              </div>
            )}
          </section>
        )}
        
        {searchQuery && <div className="h-32"></div>}
        
        {!searchQuery && !selectedBrand && brands.length > 0 && (
          <div className="px-4 mb-8 overflow-x-auto no-scrollbar">
             <div className="flex gap-4 justify-start min-w-max px-2 pt-2 pb-1">
                {brands.map(brand => {
                    const isLiked = brand.liked_by?.includes(safeUserId);
                    return (
                        <div key={brand.id} onClick={() => setSelectedBrand(brand)} className="flex flex-col items-center gap-2 cursor-pointer group relative mt-1">
                            <button 
                                onClick={(e) => handleToggleBrandLike(e, brand.id)}
                                className="absolute -top-2 -right-3 bg-[#1a1a1a] border border-white/10 rounded-full px-1.5 py-1 flex items-center gap-1 z-10 hover:scale-110 active:scale-90 transition-all shadow-xl"
                            >
                                <Heart size={10} className={isLiked ? "fill-red-500 text-red-500" : "text-gray-400"} />
                                {brand.likes_count > 0 && (
                                    <span className="text-[9px] font-mono font-bold text-white leading-none pr-0.5">{brand.likes_count}</span>
                                )}
                            </button>
                            <div className="w-16 h-16 rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden group-active:scale-90 transition-all">
                                {brand.logo_url ? <img src={getImageUrl(brand.logo_url)} className="w-full h-full object-cover" /> : <span className="font-bold text-xs uppercase">{brand.name.substring(0,2)}</span>}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-white transition-colors">{brand.name}</span>
                        </div>
                    )
                })}
             </div>
          </div>
        )}

        {!searchQuery && (
          <div className="px-4 mb-8">
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Разделы</h3>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                {categories.map((cat) => (
                <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all active:scale-95 whitespace-nowrap ${
                        selectedCategory === cat 
                        ? 'bg-white text-black border-white' 
                        : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                >
                    {cat === 'Избранное' ? (
                        <Heart size={14} className={selectedCategory === cat ? "fill-black" : ""} />
                    ) : (
                        <Tag size={14} className={selectedCategory === cat ? "text-black" : "text-gray-500"} />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-[1px]">
                        {cat}
                    </span>
                </button>
                ))}
            </div>
          </div>
        )}

        <section className="px-4 pb-8">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader className="animate-spin text-white" size={32} /><span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Загрузка дропа...</span></div>
        ) : (
            <>
              {filteredProducts.length > 0 && (
                  <div className="flex justify-between items-center mb-4 px-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredProducts.length} товаров</span>
                      <div className="flex gap-1.5 bg-[#111] p-1 rounded-lg border border-white/5">
                          <button onClick={() => setGridView('single')} className={`p-1.5 rounded transition-all ${gridView === 'single' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}><Square size={14} /></button>
                          <button onClick={() => setGridView('grid')} className={`p-1.5 rounded transition-all ${gridView === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}><LayoutGrid size={14} /></button>
                      </div>
                  </div>
              )}

              <div className={`grid ${gridView === 'grid' ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-6'}`}>
              {filteredProducts.map((product) => {
                  const isLiked = favorites.includes(product.id);
                  const imgUrl = getImageUrl(product.image_url);
                  return (
                  <div key={product.id} onClick={() => setSelectedProduct(product)} className={`group bg-[#0a0a0a] border border-white/5 rounded-xl cursor-pointer active:scale-95 transition-all relative flex flex-col ${gridView === 'grid' ? 'p-2' : 'p-4'}`}>
                      
                      {product.old_price && <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full shadow-lg">Sale</div>}

                      <button onClick={(e) => handleToggleFavorite(e, product.id)} className={`absolute z-20 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-white/10 active:scale-75 transition-all ${gridView === 'grid' ? 'top-3 right-3 w-8 h-8' : 'top-6 right-6 w-10 h-10'}`}>
                          <Heart size={gridView === 'grid' ? 14 : 18} className={`transition-all ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
                      </button>
                      
                      <div className={`bg-[#111] overflow-hidden rounded-lg relative ${gridView === 'grid' ? 'aspect-[4/5] mb-3' : 'aspect-square mb-4'}`}>
                        {imgUrl && <img src={imgUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"/>}
                      </div>
                      
                      <div className="flex flex-col gap-2 flex-1 justify-between">
                          <div className="flex justify-between items-end gap-2">
                              <div className="flex-1 min-w-0">
                                  <h3 className={`${gridView === 'grid' ? 'text-[11px]' : 'text-lg'} font-bold uppercase mb-0.5 truncate`}>{product.name}</h3>
                                  <p className="text-[9px] text-gray-500 truncate">{product.brand ? product.brand.name : 'Firma Archive'}</p>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                  {product.old_price && <div className="text-[9px] text-gray-500 line-through leading-none mb-1">{product.old_price} ₽</div>}
                                  <div className={`${gridView === 'grid' ? 'text-xs' : 'text-lg'} font-mono font-bold leading-none ${product.old_price ? 'text-red-500' : 'text-white'}`}>{product.price} ₽</div>
                              </div>
                          </div>
                          
                          <button className={`w-full border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-lg ${gridView === 'grid' ? 'py-2 mt-1 text-[9px]' : 'py-3 mt-2 text-xs'}`}>
                              Смотреть
                          </button>
                      </div>
                  </div>
                  )
              })}
              </div>

              {filteredProducts.length === 0 && (
                  <div className="text-center py-12 text-gray-500 font-mono text-xs uppercase">{searchQuery ? `Ничего не найдено по запросу "${searchQuery}"` : "Товары не найдены"}</div>
              )}
            </>
        )}
        </section>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 selection:bg-white selection:text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.5; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out 3s infinite; }
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanline { animation: scanline 4s linear infinite; }
      `}} />

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="flex flex-col items-center justify-center pt-14 pb-3 max-w-md mx-auto">
          {isSearchOpen ? (
            <div className="flex items-center w-full px-6 gap-3 animate-fade-in">
                <Search size={16} className="text-gray-500" />
                <input autoFocus type="text" placeholder="Поиск товаров..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-gray-600 text-sm"/>
                <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2"><X size={16} className="text-white"/></button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 w-full animate-fade-in">
              <div className="text-xl font-black tracking-widest uppercase">Firma</div>
              
              <div className="flex items-center gap-3">
                  <div className="text-[9px] font-mono text-gray-500">{user ? `ПРИВЕТ, ${user.first_name.toUpperCase()}` : 'ГОСТЬ'}</div>
                  <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                  <button onClick={() => setIsSearchOpen(true)} className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
                      <Search size={10} />
                      <span className="text-[9px] font-mono">ПОИСК</span>
                  </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {isOrdersOpen && user && <Orders user={user} initData={initData} onClose={() => setIsOrdersOpen(false)} />}
        {isCartOpen && <Cart items={cart} onClose={() => setIsCartOpen(false)} onRemove={handleRemoveFromCart} onCheckout={handleCheckout} />}
        {selectedProduct && !isCartOpen && !isOrdersOpen && <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'shop' && renderShop()}
        
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'community' && (
            <Community user={user} onProductClick={handleOpenProductFromCommunity} />
        )}
        
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'profile' && renderProfile()}
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'admin' && (<Admin user={user} initData={initData} />)}
      </main>
      
      {!selectedProduct && !isCartOpen && !isOrdersOpen && cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
           <button onClick={() => setIsCartOpen(true)} className="w-full bg-white text-black p-4 rounded-xl flex items-center justify-between shadow-xl active:scale-95 transition-all">
             <div className="flex items-center gap-3"><div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">{cart.length}</div><span className="font-bold text-sm uppercase tracking-wide">Корзина</span></div>
             <span className="font-mono font-bold text-lg">{cartTotal} ₽</span>
           </button>
        </div>
      )}
      {!selectedProduct && !isCartOpen && !isOrdersOpen && !orderSuccess && (
         <BottomNav currentTab={activeTab} onChange={setActiveTab} isAdmin={isAdmin} /> 
      )}
    </div>
  )
}

export default App
