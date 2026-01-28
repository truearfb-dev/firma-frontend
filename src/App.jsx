import { useState, useEffect } from 'react'
import { Loader } from 'lucide-react'
import BottomNav from './BottomNav'
import ProductDetail from './ProductDetail' // <--- Импорт нового экрана

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

function App() {
  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('shop')
  const [isLoading, setIsLoading] = useState(true)
  
  // --- НОВОЕ СОСТОЯНИЕ: Выбранный товар ---
  const [selectedProduct, setSelectedProduct] = useState(null) 

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      const userData = tg.initDataUnsafe?.user;
      
      if (userData) {
        setUser(userData);
        loginUser(userData);
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

  const loginUser = async (tgUser) => {
    try {
      await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
        }),
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  // Заглушка для добавления в корзину (реализуем в следующем шаге)
  const handleAddToCart = (product) => {
    console.log("Added to cart:", product.name);
    // Тут будет анимация и логика корзины
    setSelectedProduct(null); // Закрываем карточку после добавления (опционально)
  }

  const renderProfile = () => (
    <div className="pt-32 px-6 text-center animate-fade-in">
      <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl border border-white/5">
        {user?.photo_url ? (
           <img src={user.photo_url} className="w-full h-full rounded-full" />
        ) : (
           <span>👤</span>
        )}
      </div>
      <h2 className="text-2xl font-black uppercase mb-2">
        {user ? user.first_name : 'GUEST'}
      </h2>
      <p className="text-gray-500 font-mono text-xs mb-8">
        @{user ? user.username : 'guest'}
      </p>
      <div className="bg-[#111] border border-white/10 p-8 rounded-xl mb-8">
        <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase mb-4">Your Balance</p>
        <div className="text-5xl font-mono font-bold tracking-tight">0.00 ₽</div>
      </div>
      <button className="w-full bg-white text-black font-bold py-4 uppercase tracking-wider text-sm hover:bg-gray-200 transition-all rounded-lg">
        Invite Friend (+500₽)
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 selection:bg-white selection:text-black">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto">
          <div className="text-2xl font-black tracking-tighter uppercase">Firma</div>
          <div className="text-xs font-mono text-gray-400">
            {user ? `HI, ${user.first_name.toUpperCase()}` : 'GUEST MODE'}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {/* --- ПОКАЗЫВАЕМ ЛИБО МАГАЗИН, ЛИБО ПРОДУКТ, ЛИБО ПРОФИЛЬ --- */}
        
        {/* Если открыт продукт - показываем его поверх всего */}
        {selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            onBack={() => setSelectedProduct(null)} 
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Если продукт НЕ открыт и таб SHOP - показываем витрину */}
        {!selectedProduct && activeTab === 'shop' && (
           <div className="animate-fade-in">
             <section className="pt-32 pb-12 px-6 flex flex-col items-center justify-center text-center border-b border-white/5">
                <p className="text-xs font-bold tracking-[0.2em] text-gray-500 mb-4 uppercase">Spring 2026</p>
                <h1 className="text-6xl font-black tracking-tighter leading-[0.85] mb-8">
                  PREMIUM<br/><span className="text-gray-600">QUALITY</span>
                </h1>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-light">
                  Эксклюзивные товары для истинных ценителей
                </p>
             </section>

             <section className="px-4 py-8">
               {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <Loader className="animate-spin text-white" size={32} />
                   <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Loading Drop...</span>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                   {products.map((product) => (
                     <div 
                        key={product.id} 
                        // --- ДОБАВИЛИ КЛИК ПО ТОВАРУ ---
                        onClick={() => setSelectedProduct(product)}
                        className="group bg-[#0a0a0a] border border-white/5 p-4 rounded-xl cursor-pointer active:scale-95 transition-all"
                     >
                       <div className="aspect-square bg-[#111] mb-4 overflow-hidden rounded-lg relative">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                          )}
                       </div>
                       <div className="flex justify-between items-end">
                         <div>
                           <h3 className="text-lg font-bold uppercase mb-1">{product.name}</h3>
                           <p className="text-xs text-gray-500">{product.brand ? product.brand.name : 'Firma Archive'}</p>
                         </div>
                         <div className="text-lg font-mono font-bold">
                           {product.price} ₽
                         </div>
                       </div>
                       <button className="w-full mt-4 border border-white/20 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                         View Details
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </section>
           </div>
        )}

        {/* Профиль показываем только если не выбран продукт и активен таб profile */}
        {!selectedProduct && activeTab === 'profile' && renderProfile()}
      </main>

      {/* Меню скрываем, если открыт товар (чтобы не мешало) */}
      {!selectedProduct && <BottomNav currentTab={activeTab} onChange={setActiveTab} />}
    </div>
  )
}

export default App