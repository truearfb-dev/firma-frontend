import { useState, useEffect, useMemo } from 'react'
import { Loader, CheckCircle, Copy, Package, Heart, X, Search } from 'lucide-react'
import BottomNav from './BottomNav'
import ProductDetail from './ProductDetail'
import Cart from './Cart'
import Orders from './Orders'
import Community from './Community'
import Admin from './Admin' // <--- Импорт админки

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';
const BOT_USERNAME = 'firma_shop_bot'; 

function App() {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([]) 
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('shop')
  const [isLoading, setIsLoading] = useState(true)
  
  // 🔥 ADMIN STATE
  const [isAdmin, setIsAdmin] = useState(false)

  // State
  const [selectedProduct, setSelectedProduct] = useState(null) 
  const [cart, setCart] = useState([]) 
  const [favorites, setFavorites] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedBrand, setSelectedBrand] = useState(null)
  
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      const userData = tg.initDataUnsafe?.user;
      const startParam = tg.initDataUnsafe?.start_param;
      
      if (userData) {
        setUser(userData);
        loginUser(userData, startParam);
        fetchFavorites(userData.id);
      }
    }

    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => console.error("Ошибка:", err))

    fetch(`${API_URL}/brands`)
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error("Brand Error:", err))
  }, [])

  const loginUser = async (tgUser, startParam) => {
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          start_param: startParam
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // 🔥 ПРОВЕРЯЕМ: АДМИН ЛИ ЭТО?
        if (data.is_admin) {
            setIsAdmin(true);
        }
        // Обновляем баланс юзера
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
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
    if (user) {
      try {
        await fetch(`${API_URL}/favorites/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: user.id, product_id: productId })
        });
      } catch (error) { console.error("Like error:", error); }
    }
  }

  const handleAddToCart = (product, size) => {
    const itemToAdd = { ...product, selectedSize: size };
    setCart([...cart, itemToAdd]); 
    setSelectedProduct(null); 
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  const handleRemoveFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  }

  const handleCheckout = async () => {
    if (!user) { alert("Ошибка: Нет юзера"); return; }
    const orderItems = cart.map(item => ({
        product_id: item.id,
        size: item.selectedSize || null
    }));
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: user.id, items: orderItems })
        });
        if (response.ok) {
            setCart([]); setIsCartOpen(false); setOrderSuccess(true);
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    } catch (error) { console.error(error); }
  }

  // --- ФИЛЬТРАЦИЯ ---
  const categories = useMemo(() => {
    const allCats = products.map(p => p.category).filter(Boolean);
    return ['All', 'Favorites', ...new Set(allCats)];
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
    if (selectedCategory === 'Favorites') {
       result = result.filter(p => favorites.includes(p.id));
    } else if (selectedCategory !== 'All') {
       result = result.filter(p => p.category === selectedCategory);
    }
    return result;
  }, [products, selectedCategory, favorites, selectedBrand, searchQuery]);


  const handleInvite = () => {
    if (!user) return;
    const inviteLink = `https://t.me/${BOT_USERNAME}/app?startapp=ref_${user.id}`;
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
      <h2 className="text-2xl font-black uppercase mb-2">{user ? user.first_name : 'GUEST'}</h2>
      <p className="text-gray-500 font-mono text-xs mb-8">@{user ? user.username : 'guest'}</p>
      
      {/* 🔥 ADMIN BADGE 🔥 */}
      {isAdmin && (
        <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/50 rounded-full text-red-500 text-[10px] font-bold uppercase tracking-widest mb-6">
            Admin Access Granted
        </div>
      )}

      <div className="bg-[#111] border border-white/10 p-8 rounded-xl mb-6">
        <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase mb-4">Your Balance</p>
        <div className="text-5xl font-mono font-bold tracking-tight">{user?.balance || '0.00'} ₽</div>
      </div>
      <button onClick={() => setIsOrdersOpen(true)} className="w-full bg-[#111] border border-white/10 text-white font-bold py-4 mb-3 uppercase tracking-wider text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#222] transition-all"><Package size={18} /><span>My Orders</span></button>
      <button onClick={handleInvite} className={`w-full font-bold py-4 uppercase tracking-wider text-sm rounded-lg flex items-center justify-center gap-2 transition-all ${inviteCopied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}>{inviteCopied ? <><CheckCircle size={18} /><span>Link Copied!</span></> : <><Copy size={18} /><span>Invite Friend (+50₽)</span></>}</button>
    </div>
  )

  if (orderSuccess) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 animate-fade-in text-center">
            <CheckCircle size={64} className="text-white mb-6" />
            <h1 className="text-4xl font-black uppercase mb-4 tracking-tighter">Order<br/>Confirmed</h1>
            <p className="text-gray-400 font-mono text-xs max-w-xs mb-12">Ваш заказ принят. Скоро свяжемся.</p>
            <button onClick={() => setOrderSuccess(false)} className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider text-sm rounded-lg w-full max-w-xs">Continue Shopping</button>
        </div>
    )
  }

  // --- ГЛАВНЫЙ РЕНДЕР SHOP ---
  const renderShop = () => (
    <div className="animate-fade-in">
        {!searchQuery && (
          <section className="pt-32 pb-8 px-6 flex flex-col items-center justify-center text-center">
            {selectedBrand ? (
              <div className="animate-slide-up">
                  <button onClick={() => setSelectedBrand(null)} className="mb-4 text-xs font-mono text-gray-500 hover:text-white flex items-center gap-1 justify-center"><X size={12}/> CLEAR FILTER</button>
                  <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">{selectedBrand.name}</h1>
                  <p className="text-gray-400 text-sm font-light max-w-xs mx-auto">{selectedBrand.description || "Official Collection"}</p>
              </div>
            ) : (
              <>
                  <p className="text-xs font-bold tracking-[0.2em] text-gray-500 mb-4 uppercase">Spring 2026</p>
                  <h1 className="text-6xl font-black tracking-tighter leading-[0.85] mb-8">PREMIUM<br/><span className="text-gray-600">QUALITY</span></h1>
              </>
            )}
          </section>
        )}
        {searchQuery && <div className="h-32"></div>}
        {!searchQuery && !selectedBrand && brands.length > 0 && (
          <div className="px-4 mb-10 overflow-x-auto no-scrollbar">
             <div className="flex gap-4 justify-start min-w-max px-2">
                {brands.map(brand => (
                    <div key={brand.id} onClick={() => setSelectedBrand(brand)} className="flex flex-col items-center gap-2 cursor-pointer group">
                        <div className="w-16 h-16 rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden group-active:scale-90 transition-all">
                            {brand.logo_url ? <img src={brand.logo_url} className="w-full h-full object-cover" /> : <span className="font-bold text-xs uppercase">{brand.name.substring(0,2)}</span>}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-white transition-colors">{brand.name}</span>
                    </div>
                ))}
             </div>
          </div>
        )}
        {!searchQuery && (
          <div className="px-4 mb-8 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 justify-center min-w-max">
                {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}`}>
                    {cat === 'Favorites' ? `♥ Favorites` : cat} 
                </button>
                ))}
            </div>
          </div>
        )}
        <section className="px-4 pb-8">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader className="animate-spin text-white" size={32} /><span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Loading Drop...</span></div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
            {filteredProducts.map((product) => {
                const isLiked = favorites.includes(product.id);
                return (
                <div key={product.id} onClick={() => setSelectedProduct(product)} className="group bg-[#0a0a0a] border border-white/5 p-4 rounded-xl cursor-pointer active:scale-95 transition-all relative">
                    <button onClick={(e) => handleToggleFavorite(e, product.id)} className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-white/10 active:scale-75 transition-all">
                        <Heart size={18} className={`transition-all ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
                    </button>
                    <div className="aspect-square bg-[#111] mb-4 overflow-hidden rounded-lg relative">
                    {product.image_url && <img src={product.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"/>}
                    </div>
                    <div className="flex justify-between items-end">
                    <div><h3 className="text-lg font-bold uppercase mb-1">{product.name}</h3><p className="text-xs text-gray-500">{product.brand ? product.brand.name : 'Firma Archive'}</p></div>
                    <div className="text-lg font-mono font-bold">{product.price} ₽</div>
                    </div>
                    <button className="w-full mt-4 border border-white/20 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">View Details</button>
                </div>
                )
            })}
            {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-mono text-xs uppercase">{searchQuery ? `No results for "${searchQuery}"` : "No items found"}</div>
            )}
            </div>
        )}
        </section>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 selection:bg-white selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto h-16">
          {isSearchOpen ? (
            <div className="flex items-center w-full gap-2 animate-fade-in">
                <Search size={20} className="text-gray-500" />
                <input autoFocus type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-gray-600"/>
                <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2"><X size={20} className="text-white"/></button>
            </div>
          ) : (
            <>
              <div className="text-2xl font-black tracking-tighter uppercase">Firma</div>
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSearchOpen(true)} className="text-white hover:text-gray-300"><Search size={20} /></button>
                  <div className="text-xs font-mono text-gray-400">{user ? `HI, ${user.first_name.toUpperCase()}` : 'GUEST'}</div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {isOrdersOpen && user && <Orders user={user} onClose={() => setIsOrdersOpen(false)} />}
        {isCartOpen && <Cart items={cart} onClose={() => setIsCartOpen(false)} onRemove={handleRemoveFromCart} onCheckout={handleCheckout} />}
        {selectedProduct && !isCartOpen && !isOrdersOpen && <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}
        
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'shop' && renderShop()}
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'community' && (<Community user={user} />)}
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'profile' && renderProfile()}
        
        {/* 🔥 РЕНДЕР АДМИНКИ 🔥 */}
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'admin' && (
            <Admin user={user} />
        )}
      </main>

      {!selectedProduct && !isCartOpen && !isOrdersOpen && cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
           <button onClick={() => setIsCartOpen(true)} className="w-full bg-white text-black p-4 rounded-xl flex items-center justify-between shadow-xl active:scale-95 transition-all">
             <div className="flex items-center gap-3"><div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">{cart.length}</div><span className="font-bold text-sm uppercase tracking-wide">View Bag</span></div>
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