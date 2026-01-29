import { useState, useEffect, useMemo } from 'react'
import { Loader, CheckCircle, Copy, Package } from 'lucide-react'
import BottomNav from './BottomNav'
import ProductDetail from './ProductDetail'
import Cart from './Cart'
import Orders from './Orders'

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';
const BOT_USERNAME = 'firma_shop_bot'; // <-- Твой бот

function App() {
  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('shop')
  const [isLoading, setIsLoading] = useState(true)
  
  // State
  const [selectedProduct, setSelectedProduct] = useState(null) 
  const [cart, setCart] = useState([]) 
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  // НОВОЕ: Выбранная категория
  const [selectedCategory, setSelectedCategory] = useState('All')

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
      }
    }

    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Ошибка:", err);
        setIsLoading(false);
      })
  }, [])

  const loginUser = async (tgUser, startParam) => {
    try {
      await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          start_param: startParam
        }),
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  // --- ЛОГИКА ФИЛЬТРАЦИИ ---
  
  // 1. Вычисляем уникальные категории из товаров
  const categories = useMemo(() => {
    const allCats = products.map(p => p.category).filter(Boolean); // Собираем все непустые категории
    return ['All', ...new Set(allCats)]; // Убираем дубликаты и добавляем 'All'
  }, [products]);

  // 2. Фильтруем товары
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);


  // ... (Остальные функции handleInvite, handleAddToCart и т.д. без изменений) ...
  const handleInvite = () => {
    if (!user) return;
    const inviteLink = `https://t.me/${BOT_USERNAME}/app?startapp=ref_${user.id}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }

  const handleAddToCart = (product) => {
    setCart([...cart, product]); 
    setSelectedProduct(null); 
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }

  const handleRemoveFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  }

  const handleCheckout = async () => {
    if (!user) { alert("Ошибка: Нет юзера"); return; }
    const itemIds = cart.map(item => item.id);
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: user.id, items: itemIds })
        });
        if (response.ok) {
            setCart([]); setIsCartOpen(false); setOrderSuccess(true);
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    } catch (error) { console.error(error); }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

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

  const renderProfile = () => (
    <div className="pt-32 px-6 text-center animate-fade-in pb-20">
      <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl border border-white/5">
        {user?.photo_url ? <img src={user.photo_url} className="w-full h-full rounded-full" /> : <span>👤</span>}
      </div>
      <h2 className="text-2xl font-black uppercase mb-2">{user ? user.first_name : 'GUEST'}</h2>
      <p className="text-gray-500 font-mono text-xs mb-8">@{user ? user.username : 'guest'}</p>
      <div className="bg-[#111] border border-white/10 p-8 rounded-xl mb-6">
        <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase mb-4">Your Balance</p>
        <div className="text-5xl font-mono font-bold tracking-tight">{user?.balance || '0.00'} ₽</div>
      </div>
      <button onClick={() => setIsOrdersOpen(true)} className="w-full bg-[#111] border border-white/10 text-white font-bold py-4 mb-3 uppercase tracking-wider text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#222] transition-all"><Package size={18} /><span>My Orders</span></button>
      <button onClick={handleInvite} className={`w-full font-bold py-4 uppercase tracking-wider text-sm rounded-lg flex items-center justify-center gap-2 transition-all ${inviteCopied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}>{inviteCopied ? <><CheckCircle size={18} /><span>Link Copied!</span></> : <><Copy size={18} /><span>Invite Friend (+50₽)</span></>}</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 selection:bg-white selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto">
          <div className="text-2xl font-black tracking-tighter uppercase">Firma</div>
          <div className="text-xs font-mono text-gray-400">{user ? `HI, ${user.first_name.toUpperCase()}` : 'GUEST MODE'}</div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {isOrdersOpen && user && <Orders user={user} onClose={() => setIsOrdersOpen(false)} />}
        {isCartOpen && <Cart items={cart} onClose={() => setIsCartOpen(false)} onRemove={handleRemoveFromCart} onCheckout={handleCheckout} />}
        {selectedProduct && !isCartOpen && !isOrdersOpen && <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}
        
        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'shop' && (
           <div className="animate-fade-in">
             {/* HERO Секция */}
             <section className="pt-32 pb-8 px-6 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold tracking-[0.2em] text-gray-500 mb-4 uppercase">Spring 2026</p>
                <h1 className="text-6xl font-black tracking-tighter leading-[0.85] mb-8">PREMIUM<br/><span className="text-gray-600">QUALITY</span></h1>
             </section>

             {/* 🔥 ФИЛЬТРЫ КАТЕГОРИЙ */}
             {categories.length > 1 && (
               <div className="px-4 mb-8 overflow-x-auto no-scrollbar">
                 <div className="flex gap-2 justify-center min-w-max">
                   {categories.map(cat => (
                     <button
                       key={cat}
                       onClick={() => setSelectedCategory(cat)}
                       className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                         selectedCategory === cat 
                           ? 'bg-white text-black border-white' 
                           : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
                       }`}
                     >
                       {cat}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {/* СПИСОК ТОВАРОВ (Фильтрованный) */}
             <section className="px-4 pb-8">
               {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader className="animate-spin text-white" size={32} /><span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Loading Drop...</span></div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                   {filteredProducts.map((product) => (
                     <div key={product.id} onClick={() => setSelectedProduct(product)} className="group bg-[#0a0a0a] border border-white/5 p-4 rounded-xl cursor-pointer active:scale-95 transition-all">
                       <div className="aspect-square bg-[#111] mb-4 overflow-hidden rounded-lg relative">
                          {product.image_url && <img src={product.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"/>}
                       </div>
                       <div className="flex justify-between items-end">
                         <div><h3 className="text-lg font-bold uppercase mb-1">{product.name}</h3><p className="text-xs text-gray-500">{product.brand ? product.brand.name : 'Firma Archive'}</p></div>
                         <div className="text-lg font-mono font-bold">{product.price} ₽</div>
                       </div>
                       <button className="w-full mt-4 border border-white/20 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">View Details</button>
                     </div>
                   ))}
                   {/* Если товаров в категории нет */}
                   {filteredProducts.length === 0 && (
                     <div className="text-center py-12 text-gray-500 font-mono text-xs uppercase">No items in {selectedCategory}</div>
                   )}
                 </div>
               )}
             </section>
           </div>
        )}

        {!selectedProduct && !isCartOpen && !isOrdersOpen && activeTab === 'profile' && renderProfile()}
      </main>

      {!selectedProduct && !isCartOpen && !isOrdersOpen && cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
           <button onClick={() => setIsCartOpen(true)} className="w-full bg-white text-black p-4 rounded-xl flex items-center justify-between shadow-xl active:scale-95 transition-all">
             <div className="flex items-center gap-3"><div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">{cart.length}</div><span className="font-bold text-sm uppercase tracking-wide">View Bag</span></div>
             <span className="font-mono font-bold text-lg">{cartTotal} ₽</span>
           </button>
        </div>
      )}

      {!selectedProduct && !isCartOpen && !isOrdersOpen && !orderSuccess && <BottomNav currentTab={activeTab} onChange={setActiveTab} />}
    </div>
  )
}

export default App