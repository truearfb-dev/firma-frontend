import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Users, Plus, Upload, Loader, Package, Tag, Shield, Check, X, Edit2, RotateCcw, Search, Trash2, Eye, EyeOff } from 'lucide-react';

const API_URL = 'https://firmashop-truear.waw0.amvera.tech/api'; 

const Admin = ({ user, initData }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0 });
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); 
  const [pendingReviews, setPendingReviews] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PRODUCT FORM
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productOldPrice, setProductOldPrice] = useState(''); 
  const [productCategory, setProductCategory] = useState('Clothing');
  const [productSizes, setProductSizes] = useState('S,M,L');
  const [productDescription, setProductDescription] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [productFiles, setProductFiles] = useState([]); 
  
  const [productSearch, setProductSearch] = useState('');
  const [filterBrandId, setFilterBrandId] = useState(''); 

  const [editingProduct, setEditingProduct] = useState(null);

  // BRAND FORM
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandFile, setBrandFile] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);

  const fileInputRef = useRef(null);
  const brandInputRef = useRef(null);

  // 🔥 НОВОЕ: Стейт для хранения выбранных товаров при модерации
  const [linkProductIds, setLinkProductIds] = useState({});

  const safeId = user.telegram_id || user.id;

  useEffect(() => {
    fetchStats();
    fetchBrands();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeSection === 'orders') fetchOrders();
    if (activeSection === 'moderation') fetchPendingReviews();
  }, [activeSection]);

  const fetchStats = async () => {
    try {
      const encodedInit = encodeURIComponent(initData);
      const res = await fetch(`${API_URL}/admin/stats?telegram_id=${safeId}&initData=${encodedInit}`);
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/brands`);
      if (res.ok) setBrands(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const encodedInit = encodeURIComponent(initData);
      const res = await fetch(`${API_URL}/admin/products/all?initData=${encodedInit}`);
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchOrders = async () => {
    try {
      const encodedInit = encodeURIComponent(initData);
      const res = await fetch(`${API_URL}/admin/orders?initData=${encodedInit}`);
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPendingReviews = async () => {
    try {
        const encodedInit = encodeURIComponent(initData);
        const res = await fetch(`${API_URL}/admin/reviews/pending?initData=${encodedInit}`);
        if (res.ok) setPendingReviews(await res.json());
    } catch (e) { console.error(e); }
  }

  const handleToggleVisibility = async (productId, e) => {
    e.stopPropagation();
    const formData = new FormData();
    formData.append('initData', initData);
    formData.append('product_id', productId);

    try {
        const res = await fetch(`${API_URL}/admin/products/toggle-visibility`, { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            setProducts(products.map(p => p.id === productId ? { ...p, is_active: data.is_active } : p));
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
        }
    } catch (err) { alert("Ошибка сети"); }
  }

  const handleDeleteProduct = async (productId, e) => {
    e.stopPropagation(); 
    if (!window.confirm("Удалить этот товар навсегда?")) return;
    const formData = new FormData();
    formData.append('initData', initData);
    formData.append('product_id', productId);
    try {
        const res = await fetch(`${API_URL}/admin/products/delete`, { method: 'POST', body: formData });
        if (res.ok) {
            setProducts(products.filter(p => p.id !== productId));
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        } else { alert("Ошибка при удалении"); }
    } catch (err) { alert("Ошибка сети"); }
  }

  const handleDeleteBrand = async (brandId, e) => {
    e.stopPropagation();
    if (!window.confirm("Удалить этот бренд? (Товары станут 'Без бренда')")) return;
    const formData = new FormData();
    formData.append('initData', initData);
    formData.append('brand_id', brandId);
    try {
        const res = await fetch(`${API_URL}/admin/brands/delete`, { method: 'POST', body: formData });
        if (res.ok) {
            setBrands(brands.filter(b => b.id !== brandId));
            fetchProducts();
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        } else { alert("Ошибка при удалении"); }
    } catch (err) { alert("Ошибка сети"); }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productName || !productPrice) return alert("Заполните название и цену");
    if (!editingProduct && productFiles.length === 0) return alert("Загрузите фото товара");

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('initData', initData); 
    formData.append('name', productName);
    formData.append('price', productPrice);
    if (productOldPrice) formData.append('old_price', productOldPrice); 
    formData.append('category', productCategory);
    formData.append('sizes', productSizes);
    formData.append('description', productDescription);
    if (selectedBrandId) formData.append('brand_id', selectedBrandId);
    
    if (productFiles.length > 0) {
        for (let i = 0; i < productFiles.length; i++) {
            formData.append('files', productFiles[i]);
        }
    }

    let url = `${API_URL}/admin/products`;
    if (editingProduct) {
        url = `${API_URL}/admin/products/update`;
        formData.append('product_id', editingProduct.id);
    }

    try {
        const res = await fetch(url, { method: 'POST', body: formData });
        if (res.ok) {
            alert(editingProduct ? "Товар обновлен!" : "Товар создан!");
            cancelEditProduct();
            fetchProducts();
        } else {
            const err = await res.json();
            alert("Ошибка: " + (err.detail || "Неизвестная ошибка"));
        }
    } catch (e) { alert("Ошибка сети"); }
    setIsSubmitting(false);
  };

  const startEditProduct = (prod) => {
      setEditingProduct(prod);
      setProductName(prod.name);
      setProductPrice(prod.price);
      setProductOldPrice(prod.old_price || ''); 
      setProductCategory(prod.category || 'Clothing');
      setProductSizes(prod.sizes || 'S,M,L');
      setProductDescription(prod.description || '');
      setSelectedBrandId(prod.brand_id || '');
      setProductFiles([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const cancelEditProduct = () => {
      setEditingProduct(null);
      setProductName(''); setProductPrice(''); setProductOldPrice(''); setProductFiles([]); setProductSizes('S,M,L'); setProductDescription('');
  }

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    if (!brandName) return alert("Введите название бренда");
    if (!editingBrand && !brandFile) return alert("Загрузите логотип");

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('initData', initData); 
    formData.append('name', brandName);
    formData.append('description', brandDescription); 
    if (brandFile) formData.append('file', brandFile); 

    let url = `${API_URL}/admin/brands`;
    if (editingBrand) {
        url = `${API_URL}/admin/brands/update`;
        formData.append('brand_id', editingBrand.id);
    }

    try {
        const res = await fetch(url, { method: 'POST', body: formData });
        if (res.ok) {
            alert(editingBrand ? "Бренд обновлен!" : "Бренд создан!");
            cancelEditBrand();
            fetchBrands();
        } else {
            const err = await res.json();
            alert("Ошибка: " + (err.detail || "Неизвестная ошибка"));
        }
    } catch (e) { alert("Ошибка сети"); }
    setIsSubmitting(false);
  };

  const startEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandDescription(brand.description || ''); 
    setBrandFile(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandDescription('');
    setBrandFile(null);
  };

  const handleStatusChange = async (orderId, newStatus) => {
      try {
          const res = await fetch(`${API_URL}/admin/orders/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData: initData, order_id: orderId, status: newStatus }) 
          });
          if (res.ok) {
              fetchOrders();
              if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
      } catch (e) { console.error(e); }
  }

  // 🔥 ОБНОВЛЕНО: Отправляем выбранный товар при аппруве
  const handleReviewAction = async (reviewId, action) => {
    try {
        const payload = { initData: initData, review_id: reviewId };
        
        // Если одобряем фото и выбран товар, прикрепляем его
        if (action === 'approve' && linkProductIds[reviewId]) {
            payload.product_id = parseInt(linkProductIds[reviewId]);
        }

        const res = await fetch(`${API_URL}/admin/reviews/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    } catch (e) { console.error(e); }
  }

  const getImgUrl = (url) => {
    if (!url) return null;
    if (url.includes(',')) url = url.split(',')[0]; 
    return url.startsWith('http') ? url : `https://firmashop-truear.waw0.amvera.tech${url}`;
  }

  const filteredProducts = products.filter(p => {
    const term = productSearch.toLowerCase();
    const name = p.name ? p.name.toLowerCase() : '';
    const desc = p.description ? p.description.toLowerCase() : '';
    const cat = p.category ? p.category.toLowerCase() : '';
    const matchesSearch = name.includes(term) || desc.includes(term) || cat.includes(term);
    const matchesBrand = filterBrandId ? String(p.brand_id) === String(filterBrandId) : true;
    
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="pt-32 pb-24 animate-fade-in px-4">
      <h1 className="text-3xl font-black uppercase mb-6">РЕЖИМ БОГА <span className="text-red-500">.</span></h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
        {[
            { id: 'dashboard', icon: DollarSign, label: 'Статистика' },
            { id: 'products', icon: Plus, label: 'Товар' },
            { id: 'brands', icon: Tag, label: 'Бренд' },
            { id: 'orders', icon: Package, label: 'Заказы' },
            { id: 'moderation', icon: Shield, label: 'Модерация' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${
                    activeSection === tab.id 
                    ? 'bg-white text-black border-white' 
                    : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/30'
                }`}
            >
                <tab.icon size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                {tab.id === 'moderation' && pendingReviews.length > 0 && activeSection !== 'moderation' && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>
        ))}
      </div>

      {activeSection === 'dashboard' && (
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
            <div className="bg-[#111] border border-white/10 p-4 rounded-xl col-span-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Выручка</span>
                <div className="text-4xl font-mono font-bold text-green-400 mt-1">{stats.revenue.toLocaleString()} ₽</div>
            </div>
            <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 uppercase">Заказы</span>
                <div className="text-2xl font-mono font-bold mt-1">{stats.orders}</div>
            </div>
            <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 uppercase">Клиенты</span>
                <div className="text-2xl font-mono font-bold mt-1">{stats.users}</div>
            </div>
        </div>
      )}

      {activeSection === 'products' && (
        <div className="space-y-6 animate-slide-up">
            <form onSubmit={handleProductSubmit} className={`space-y-4 p-4 rounded-xl border ${editingProduct ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-transparent border-transparent'}`}>
                {editingProduct && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-yellow-500 uppercase">Редактирование: {editingProduct.name}</span>
                        <button type="button" onClick={cancelEditProduct} className="text-xs text-gray-500 flex items-center gap-1 hover:text-white"><RotateCcw size={12}/> Отмена</button>
                    </div>
                )}
                
                <div onClick={() => fileInputRef.current.click()} className="w-full h-40 bg-[#111] border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
                    {productFiles.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                           {Array.from(productFiles).slice(0,4).map((f, i) => (
                             <img key={i} src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                           ))}
                        </div>
                    ) : (
                        editingProduct ? (
                            <img src={getImgUrl(editingProduct.image_url)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="text-gray-500" />
                                <span className="text-[10px] text-gray-500">Выбрать фото товара</span>
                            </div>
                        )
                    )}
                    <input type="file" multiple ref={fileInputRef} onChange={e => setProductFiles(e.target.files)} className="hidden" accept="image/*" />
                </div>

                <input type="text" placeholder="Название товара" value={productName} onChange={e => setProductName(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none"/>
                
                <div className="flex gap-4">
                    <input type="number" placeholder="Новая цена (₽)" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="w-1/2 bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none"/>
                    <input type="number" placeholder="Старая цена" value={productOldPrice} onChange={e => setProductOldPrice(e.target.value)} className="w-1/2 bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none text-gray-400"/>
                </div>

                <div className="flex gap-4">
                    <input type="text" placeholder="Размеры (S,M,L)" value={productSizes} onChange={e => setProductSizes(e.target.value)} className="w-1/2 bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none"/>
                    <select value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)} className="bg-[#111] border border-white/10 rounded-xl px-4 text-white outline-none w-1/2">
                        <option value="">Без бренда</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <textarea 
                    placeholder="Описание товара (материал, посадка, детали...)" 
                    value={productDescription} 
                    onChange={e => setProductDescription(e.target.value)} 
                    className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none min-h-[100px] resize-none"
                />

                <button disabled={isSubmitting} className={`w-full font-bold py-4 rounded-xl uppercase ${editingProduct ? 'bg-yellow-500 text-black' : 'bg-white text-black'}`}>
                    {isSubmitting ? <Loader className="animate-spin mx-auto"/> : (editingProduct ? "Сохранить изменения" : "Создать товар")}
                </button>
            </form>

            <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase">Список товаров ({filteredProducts.length})</h3>
                </div>
                
                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Найти товар..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all"
                        />
                    </div>
                    <select 
                        value={filterBrandId} 
                        onChange={(e) => setFilterBrandId(e.target.value)}
                        className="bg-[#111] border border-white/10 rounded-xl px-3 text-[10px] uppercase font-bold text-white outline-none w-1/3"
                    >
                        <option value="">Все бренды</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(p => (
                            <div key={p.id} className={`bg-[#111] rounded-lg p-2 border border-white/5 relative group animate-slide-up transition-all ${!p.is_active ? 'opacity-40 grayscale' : ''}`}>
                                <div className="aspect-square bg-black rounded overflow-hidden mb-2">
                                    <img src={getImgUrl(p.image_url)} className="w-full h-full object-cover"/>
                                </div>
                                <div className="text-[10px] font-bold uppercase truncate">{p.name}</div>
                                <div className="text-xs font-mono text-gray-400">
                                    {p.old_price && <span className="line-through text-gray-600 mr-1">{p.old_price}</span>}
                                    {p.price} ₽
                                </div>
                                
                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                    <button 
                                        onClick={(e) => handleToggleVisibility(p.id, e)}
                                        className={`p-2 bg-black/50 backdrop-blur rounded-full transition-all ${p.is_active ? 'text-white hover:text-yellow-500' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {p.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); startEditProduct(p); }}
                                        className="p-2 bg-black/50 backdrop-blur rounded-full text-white hover:text-yellow-500 transition-all"
                                    >
                                        <Edit2 size={12} />
                                    </button>

                                    <button 
                                        onClick={(e) => handleDeleteProduct(p.id, e)}
                                        className="p-2 bg-black/50 backdrop-blur rounded-full text-white hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-8 text-gray-500 font-mono text-xs">
                            Ничего не найдено
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {activeSection === 'brands' && (
        <div className="space-y-6 animate-slide-up">
            <form onSubmit={handleBrandSubmit} className={`space-y-4 p-4 rounded-xl border ${editingBrand ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-transparent border-transparent'}`}>
                {editingBrand && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-yellow-500 uppercase">Редактирование: {editingBrand.name}</span>
                        <button type="button" onClick={cancelEditBrand} className="text-xs text-gray-500 flex items-center gap-1 hover:text-white"><RotateCcw size={12}/> Отмена</button>
                    </div>
                )}

                <div onClick={() => brandInputRef.current.click()} className="w-24 h-24 mx-auto bg-[#111] border border-dashed border-white/20 rounded-full flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                    {brandFile ? (
                        <img src={URL.createObjectURL(brandFile)} className="w-full h-full object-cover" />
                    ) : (
                        editingBrand ? (
                             <img src={`https://firmashop-truear.waw0.amvera.tech${editingBrand.logo_url}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                             <Tag className="text-gray-500" />
                        )
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Upload size={16} className="text-white"/>
                    </div>
                    <input type="file" ref={brandInputRef} onChange={e => setBrandFile(e.target.files[0])} className="hidden" accept="image/*" />
                </div>

                <input type="text" placeholder="Название бренда" value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none text-center"/>
                
                <textarea 
                    placeholder="Описание бренда (история, стиль...)" 
                    value={brandDescription} 
                    onChange={e => setBrandDescription(e.target.value)} 
                    className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none min-h-[80px] resize-none"
                />

                <button disabled={isSubmitting} className={`w-full font-bold py-4 rounded-xl uppercase ${editingBrand ? 'bg-yellow-500 text-black' : 'bg-white text-black'}`}>
                    {isSubmitting ? <Loader className="animate-spin mx-auto"/> : (editingBrand ? "Сохранить изменения" : "Создать бренд")}
                </button>
            </form>
            
            <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Существующие бренды</h3>
                <div className="flex gap-3 flex-wrap">
                    {brands.map(b => (
                        <div key={b.id} className="group relative flex items-center gap-2 bg-[#111] px-3 py-2 rounded-lg border border-white/5 pr-14">
                            <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden"><img src={`https://firmashop-truear.waw0.amvera.tech${b.logo_url}`} className="w-full h-full object-cover"/></div>
                            <span className="text-xs font-bold uppercase">{b.name}</span>
                            
                            <div className="absolute right-1 flex gap-0.5">
                                <button 
                                    onClick={() => startEditBrand(b)}
                                    className="p-1.5 text-gray-600 hover:text-white transition-colors"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteBrand(b.id, e)}
                                    className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {activeSection === 'orders' && (
        <div className="space-y-4 animate-slide-up">
            {orders.map(order => (
                <div key={order.id} className="bg-[#111] border border-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">Заказ #{order.id}</span>
                            <div className="text-sm font-bold text-white">{order.customer}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold">{order.total_amount} ₽</div>
                            <div className="text-[10px] text-gray-500">{order.created_at}</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-4 pb-4 border-b border-white/5 font-mono leading-relaxed">
                        {order.items}
                    </div>
                    <div className="flex gap-2">
                        {['new', 'processing', 'sent', 'done'].map(st => (
                            <button 
                                key={st}
                                onClick={() => handleStatusChange(order.id, st)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                    order.status === st 
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-transparent text-gray-600 border-white/10 hover:border-white/30'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}

      {activeSection === 'moderation' && (
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
            {pendingReviews.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-gray-500 font-mono text-xs uppercase">
                    Все чисто.<br/>Новых фото нет.
                </div>
            ) : (
                pendingReviews.map(review => (
                    <div key={review.id} className="bg-[#111] rounded-xl overflow-hidden border border-white/10 relative flex flex-col">
                        <img 
                            src={`https://firmashop-truear.waw0.amvera.tech${review.image_path}`} 
                            className="w-full h-40 object-cover" 
                        />
                        
                        {/* 🔥 НОВОЕ: Блок привязки товара */}
                        <div className="p-2 border-b border-white/10 bg-black/50">
                            <select 
                                value={linkProductIds[review.id] || ''}
                                onChange={(e) => setLinkProductIds({...linkProductIds, [review.id]: e.target.value})}
                                className="w-full bg-[#111] border border-white/20 text-white text-[10px] uppercase font-bold p-2 rounded outline-none"
                            >
                                <option value="">Не прикреплять товар</option>
                                {/* Показываем только активные товары */}
                                {products.filter(p => p.is_active).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.price}₽)</option>
                                ))}
                            </select>
                        </div>

                        <div className="p-3 flex justify-between items-center bg-[#111]">
                            <div className="text-[10px] text-gray-500 font-mono">
                                User #{review.user_id}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleReviewAction(review.id, 'reject')}
                                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                >
                                    <X size={16} strokeWidth={3} />
                                </button>
                                <button 
                                    onClick={() => handleReviewAction(review.id, 'approve')}
                                    className="w-8 h-8 bg-green-500 text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                >
                                    <Check size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      )}

    </div>
  );
};

export default Admin;
