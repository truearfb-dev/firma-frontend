import { useState, useEffect } from 'react'
import { Loader } from 'lucide-react'
import BottomNav from './BottomNav'

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api';

function App() {
  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('shop')
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка данных при монтировании
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      try {
        // Загружаем продукты
        console.log('🔄 Загрузка товаров с:', `${API_URL}/products`);
        const productsResponse = await fetch(`${API_URL}/products`);
        
        console.log('📦 Статус ответа:', productsResponse.status);
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          console.log('✅ Товары загружены:', productsData.length, 'шт.');
          setProducts(productsData);
        } else {
          console.error('❌ Ошибка загрузки товаров:', productsResponse.status, productsResponse.statusText);
        }

        // Автоматический вход пользователя (демо)
        const loginResponse = await fetch(`${API_URL}/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: 'testuser', 
            password: 'testpass123' 
          }),
        });

        if (loginResponse.ok) {
          const userData = await loginResponse.json();
          console.log('✅ Пользователь авторизован:', userData.username);
          setUser(userData);
        } else {
          console.error('❌ Ошибка авторизации:', loginResponse.status);
        }
      } catch (error) {
        console.error('❌ Критическая ошибка при инициализации:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Рендер магазина
  const renderShop = () => (
    <div className="animate-fade-in">
      {/* Hero секция */}
      <section className="pt-20 pb-12 px-6 text-center border-b border-white/10">
        <div className="max-w-md mx-auto">
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-4 leading-none">
            Premium<br />Quality
          </h1>
          <p className="text-sm text-gray-400 font-light tracking-wide">
            Эксклюзивные товары для истинных ценителей
          </p>
        </div>
      </section>

      {/* Список продуктов */}
      <section className="px-6 py-8">
        <div className="max-w-md mx-auto space-y-4">
          {isLoading ? (
            // Индикатор загрузки
            <div className="text-center text-gray-400 py-12">
              <Loader className="animate-spin mx-auto mb-4 text-white" size={48} />
              <p>Загрузка товаров...</p>
            </div>
          ) : products.length === 0 ? (
            // Нет товаров
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">📦</div>
              <p>Нет товаров</p>
            </div>
          ) : (
            // Список товаров
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold uppercase tracking-wide text-sm mb-1 group-hover:text-white transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-xl font-mono font-bold">
                      {product.price} ₽
                    </div>
                  </div>
                </div>
                
                <button className="w-full bg-white/10 hover:bg-white hover:text-black border border-white/20 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300">
                  Купить
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  // Рендер профиля
  const renderProfile = () => (
    <div className="pt-32 px-6 text-center animate-fade-in">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">
          👤
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">
          {user?.first_name || 'GUEST'}
        </h2>
        <p className="text-gray-500 font-mono text-xs mb-8">
          @{user?.username || 'guest'}
        </p>

        <div className="bg-white/5 border border-white/10 p-6 rounded-lg mb-8">
          <p className="text-gray-400 text-[10px] tracking-widest uppercase mb-2">
            Your Balance
          </p>
          <div className="text-4xl font-mono font-bold">
            {user?.balance || '0.00'} ₽
          </div>
        </div>

        <button className="w-full bg-white text-black font-bold py-4 uppercase tracking-wider text-sm hover:bg-gray-200 transition-colors">
          Invite Friend (+500₽)
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto">
          <div className="text-2xl font-black tracking-tighter uppercase">Firma</div>
          <div className="text-xs font-mono text-gray-400">V 2.0</div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === 'shop' && renderShop()}
        {activeTab === 'profile' && renderProfile()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}

export default App