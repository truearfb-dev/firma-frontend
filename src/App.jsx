import { useState, useEffect } from 'react'

function App() {
  const [products, setProducts] = useState([])
  // Состояние для хранения имени пользователя
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 1. Инициализируем Телеграм
    const tg = window.Telegram.WebApp;
    tg.ready();
    
    // 2. Пробуем достать данные юзера
    // (initDataUnsafe - это объект, который Телеграм отдает сразу)
    if (tg.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
    }

    // 3. Загружаем товары (как и раньше)
    fetch('https://firmashop-truear.waw0.amvera.tech/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Ошибка:", err))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto">
          <div className="text-2xl font-black tracking-tighter uppercase">Firma</div>
          <div className="text-xs font-mono text-gray-400">
            {/* Вот здесь магия: если юзер есть, пишем имя, иначе GUEST */}
            {user ? `HI, ${user.first_name.toUpperCase()}` : 'GUEST MODE'}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-12 px-6 flex flex-col items-center justify-center text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-gray-500 mb-4 uppercase">Spring 2026 Collection</p>
        <h1 className="text-6xl font-black tracking-tighter leading-[0.85] mb-8">
          SILENCE<br/><span className="text-gray-600">IS LOUD</span>
        </h1>
        <button className="bg-white text-black px-8 py-4 font-bold tracking-wider uppercase text-sm hover:bg-gray-200 transition-all">
          Explore Drop
        </button>
      </section>

      {/* PRODUCTS GRID */}
      <section className="px-4 pb-20 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
          <h2 className="text-2xl font-bold tracking-tight">LATEST ARRIVALS</h2>
          <span className="text-xs text-gray-500 font-mono">{products.length} ITEMS</span>
        </div>

        {products.length === 0 ? (
           <div className="text-center py-20 text-gray-600 font-mono text-xs uppercase tracking-widest">
             Loading / Database Empty
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                {/* Image Container */}
                <div className="aspect-square bg-[#111] mb-4 overflow-hidden relative">
                   {product.image_url && (
                     <img 
                       src={product.image_url} 
                       alt={product.name}
                       className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                     />
                   )}
                   {!product.image_url && (
                     <div className="w-full h-full flex items-center justify-center text-gray-700 font-mono text-xs">
                       NO IMAGE
                     </div>
                   )}
                </div>
                
                {/* Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold leading-none mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 font-mono uppercase">
                      {product.brand ? product.brand.name : 'Firma Archive'}
                    </p>
                  </div>
                  <span className="text-lg font-bold font-mono">
                    {Math.floor(product.price).toLocaleString()} ₽
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/10 text-center">
        <p className="text-[10px] text-gray-600 font-mono tracking-widest uppercase mb-4">
          © 2026 FIRMA. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 text-[10px] font-bold tracking-widest text-gray-400">
           <span>INSTAGRAM</span>
           <span>TELEGRAM</span>
        </div>
      </footer>
    </div>
  )
}

export default App