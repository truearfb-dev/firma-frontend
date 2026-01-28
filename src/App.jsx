import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, ArrowRight, Loader2 } from 'lucide-react';

// Твой реальный адрес сервера
const API_URL = "https://firmashop-truear.waw0.amvera.tech";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Эта магия происходит при загрузке сайта
  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        console.log("Товары получены:", data);
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка связи с сервером:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* HEADER */}
      <nav className="fixed w-full z-50 mix-blend-difference px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter uppercase cursor-pointer">Firma</div>
        
        <div className="hidden md:flex gap-8 text-sm font-medium tracking-widest uppercase">
          <a href="#" className="hover:underline underline-offset-4">Shop</a>
          <a href="#" className="hover:underline underline-offset-4">Drop</a>
          <a href="#" className="hover:underline underline-offset-4">About</a>
        </div>

        <div className="flex items-center gap-6">
          <span className="hidden md:block text-sm font-medium tracking-widest uppercase cursor-pointer">Cart (0)</span>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8 text-2xl font-bold uppercase tracking-tighter">
          <a href="#" onClick={() => setIsMenuOpen(false)}>Shop</a>
          <a href="#" onClick={() => setIsMenuOpen(false)}>Drop</a>
          <a href="#" onClick={() => setIsMenuOpen(false)}>Cart</a>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black opacity-50 pointer-events-none" />
        <p className="text-xs md:text-sm text-neutral-500 tracking-[0.3em] uppercase mb-4 animate-pulse">
          Spring 2026 Collection
        </p>
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-none">
          SILENCE<br/>IS LOUD
        </h1>
        <button className="bg-white text-black px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-neutral-200 transition-colors">
          Explore Drop
        </button>
      </section>

      {/* PRODUCTS GRID */}
      <section className="px-6 py-24 bg-black">
        <div className="flex justify-between items-end mb-12 border-b border-neutral-800 pb-4">
          <h2 className="text-3xl font-bold tracking-tighter uppercase">Latest Arrivals</h2>
          <span className="text-neutral-500 text-sm tracking-widest">{products.length} ITEMS</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-neutral-600 animate-spin">
            <Loader2 size={40} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-neutral-500 uppercase tracking-widest">
            Sold Out / Database Empty
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="aspect-[3/4] bg-neutral-900 mb-4 overflow-hidden relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-700 font-bold text-6xl opacity-20 rotate-45">
                      FIRMA
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white text-black text-xs font-bold px-2 py-1 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    Quick Add
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium tracking-tight mb-1">{product.name}</h3>
                    <p className="text-neutral-500 text-xs tracking-widest uppercase">
                      {product.brand_id ? "FIRMA ARCHIVE" : "BASIC"}
                    </p>
                  </div>
                  <span className="text-lg font-bold">{Number(product.price).toLocaleString()} ₽</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-12 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center text-neutral-600 text-xs tracking-widest uppercase">
        <p>© 2026 FIRMA. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">Telegram</a>
        </div>
      </footer>
    </div>
  );
}