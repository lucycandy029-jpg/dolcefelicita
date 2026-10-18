import React, { useState } from 'react';
import { Header } from './components/Header';
import { MenuScreen } from './components/MenuScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { OrderTrackingScreen } from './components/OrderTrackingScreen';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  DEFAULT_ADDRESS, 
  INITIAL_ORDERS, 
  INITIAL_USER,
  DEFAULT_STORE_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_GLOBAL_ADDONS
} from './data/initialData';
import { 
  Product, 
  ProductAddon, 
  CartItem, 
  Address, 
  Order, 
  OrderStatus, 
  User, 
  Category, 
  StoreSettings, 
  Customer 
} from './types';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('cardapio');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [addons, setAddons] = useState<ProductAddon[]>(INITIAL_GLOBAL_ADDONS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [activeAddress, setActiveAddress] = useState<Address>(DEFAULT_ADDRESS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Initial cart with items matching the user's uploaded screen
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'cart-init-1',
      productId: 'prod-cookie-nutella',
      name: 'Cookie Tortinha de Nutella',
      unitLabel: 'Unidade 130g',
      unitPrice: 16.00,
      quantity: 1,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI9Q2Q983DUN78ApFjsf6giUl5bNQw43hicPMNuQdfluHfpxDWQnPMwyexvuvkGoMti9NDD_gC8YvkEi_VgvHyTi7gkcta7R7V7yNP-WFjTOBRBqSprkpCCh0amzAIONLS0SawvXJWEXo1-8vKn0rJ6MMVwtj29R7ugGXBHgyfNzUOH7PzIy5XagYcXz0XUN7Gpt4s1wfUfOpiRYJZGxAM9E2yyubWUWv_QpNYA_oOx9u0tGvSpYf9Iw',
      badgeTag: 'Mais Amado',
      addons: [{ id: 'a1', name: 'Calda extra de Nutella', price: 4.50 }],
      itemTotal: 20.50
    },
    {
      id: 'cart-init-2',
      productId: 'prod-brownie-morango',
      name: 'Brownie Supremo com Morangos',
      unitLabel: 'Fatia Gourmet 180g',
      unitPrice: 22.00,
      quantity: 1,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBs1caCTh-nlqHXNCodqC0YrOJFbVT_rFjOiVqApJTV0LMyLR5nCHTNnesHoVQn6yovH4Gyg_0kXUgpSpmBkcWWLnoEn-RCF1TTZxUintBRTYi79e44NM9jJvqiIBC5vgGOg_UUrsXFCNEo5Q9QPVTWLWrG2n5v-g4njg382GNCP-bRShRpgNP8GiBGLg6DLtGhgj2_Kt78_w9GZh2Z5fTbOrLvg3zL89kLPn-Ui-q53AS_YH98XnWHIQ',
      badgeTag: 'Cacau Belga 70%',
      addons: [],
      itemTotal: 22.00
    }
  ]);

  // Active tracking order & order history
  const [activeOrder, setActiveOrder] = useState<Order>(INITIAL_ORDERS[0]);
  const [pastOrders, setPastOrders] = useState<Order[]>(INITIAL_ORDERS.slice(1));

  // Compute cart counts and totals
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0);

  // Cart actions
  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedAddons: ProductAddon[],
    notes: string
  ) => {
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const itemTotal = (product.price + addonsTotal) * quantity;

    const newItem: CartItem = {
      id: 'cart-item-' + Date.now(),
      productId: product.id,
      name: product.name,
      unitLabel: product.unitLabel,
      unitPrice: product.price,
      quantity,
      imageUrl: product.imageUrl,
      badgeTag: product.badgeTag,
      addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
      notes,
      itemTotal
    };

    setCartItems(prev => [newItem, ...prev]);
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
          return {
            ...item,
            quantity: newQty,
            itemTotal: (item.unitPrice + addonsTotal) * newQty
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Order finalization
  const handleConfirmOrder = (orderData: Partial<Order>) => {
    const newOrderNumber = Math.floor(4830 + Math.random() * 50);
    const createdOrder: Order = {
      id: 'ord-' + newOrderNumber,
      orderNumber: newOrderNumber,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      customerPhone: currentUser.phone,
      status: 'preparing',
      items: orderData.items || cartItems,
      subtotal: orderData.subtotal || cartTotal,
      deliveryFee: orderData.deliveryFee ?? storeSettings.baseDeliveryFee,
      discount: orderData.discount ?? 7.25,
      total: orderData.total || (cartTotal + storeSettings.baseDeliveryFee - 7.25),
      paymentMethod: orderData.paymentMethod || 'pix',
      paymentStatus: 'approved',
      address: orderData.address || activeAddress,
      courier: {
        name: 'Mateus Siqueira',
        phone: '(11) 98765-4321',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w',
        rating: 4.97,
        deliveriesCount: 852
      },
      notes: orderData.notes || 'Por favor tocar o interfone 82 e deixar na portaria caso não atenda.',
      includeEcoUtensils: orderData.includeEcoUtensils ?? true,
      estimatedDeliveryTime: 'Hoje: 30 – 45 min',
      createdAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: 'Agora'
    };

    setActiveOrder(createdOrder);
    setCartItems([]); // Reset cart
    setCurrentTab('rastreio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReorder = (order: Order) => {
    if (order.items && order.items.length > 0) {
      setCartItems(order.items);
      setCurrentTab('carrinho');
    } else {
      handleAddToCart(products[0], 1, [], '');
      setCurrentTab('carrinho');
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    if (activeOrder.id === orderId) {
      setActiveOrder(prev => ({ ...prev, status: newStatus }));
    }
    setPastOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleAddStockBatch = (productId: string, quantity: number) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, stockAvailable: (p.stockAvailable || 0) + quantity } : p
      )
    );
  };

  // Administrator CRUD actions
  const handleAddProduct = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
    // update category count
    setCategories(prev =>
      prev.map(c => (c.id === newProd.categoryId || c.id === 'all' ? { ...c, count: c.count + 1 } : c))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (prod) {
      setCategories(prev =>
        prev.map(c => (c.id === prod.categoryId || c.id === 'all' ? { ...c, count: Math.max(0, c.count - 1) } : c))
      );
    }
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories(prev => [...prev, newCat]);
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const handleAddAddon = (newAddon: ProductAddon) => {
    setAddons(prev => [...prev, newAddon]);
  };

  const handleDeleteAddon = (addonId: string) => {
    setAddons(prev => prev.filter(a => a.id !== addonId));
  };

  const handleUpdateStoreSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
  };

  const handleLogout = () => {
    setCurrentUser(INITIAL_USER);
    if (currentTab === 'admin') {
      setCurrentTab('cardapio');
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('cardapio');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fef8f3] text-[#1d1b19] font-sans antialiased selection:bg-[#ffd9de] selection:text-[#3f0015]">
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        onNavigate={tab => {
          if (tab === 'admin' && currentUser.role !== 'admin') {
            setCurrentTab('auth');
          } else {
            setCurrentTab(tab);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cartCount}
        cartTotal={cartTotal}
        activeAddress={activeAddress}
        isLoggedIn={isLoggedIn}
        userName={currentUser.name}
        userRole={currentUser.role}
        onOpenAuth={() => setCurrentTab('auth')}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="w-full pt-28 flex-1">
        {(currentTab === 'cardapio' || currentTab === 'mais-pedidos' || currentTab === 'combos') && (
          <MenuScreen
            categories={categories}
            products={products}
            onAddToCart={handleAddToCart}
            onNavigateToCart={() => setCurrentTab('carrinho')}
          />
        )}

        {currentTab === 'carrinho' && (
          <CheckoutScreen
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNavigateToMenu={() => setCurrentTab('cardapio')}
            onConfirmOrder={handleConfirmOrder}
            activeAddress={activeAddress}
            onUpdateAddress={setActiveAddress}
          />
        )}

        {currentTab === 'rastreio' && (
          <OrderTrackingScreen
            order={activeOrder}
            pastOrders={pastOrders}
            onNavigateToMenu={() => setCurrentTab('cardapio')}
            onReorder={handleReorder}
          />
        )}

        {currentTab === 'auth' && (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setCurrentTab('cardapio')}
          />
        )}

        {/* PAINEL ADMINISTRATIVO: Só aparece depois de logado como administrador */}
        {currentTab === 'admin' && (
          currentUser.role === 'admin' ? (
            <AdminPanel
              orders={[activeOrder, ...pastOrders]}
              products={products}
              categories={categories}
              addons={addons}
              storeSettings={storeSettings}
              customers={customers}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAddStockBatch={handleAddStockBatch}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddAddon={handleAddAddon}
              onDeleteAddon={handleDeleteAddon}
              onUpdateStoreSettings={handleUpdateStoreSettings}
            />
          ) : (
            <div className="max-w-xl mx-auto px-4 py-16 text-center">
              <div className="bg-white p-8 rounded-3xl shadow-md border border-[#dac0c3]/40 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">lock</span>
                </div>
                <h2 className="text-xl font-bold text-[#1d1b19] font-heading">
                  Acesso Restrito ao Administrador
                </h2>
                <p className="text-xs text-[#554245]">
                  O painel administrativo da confeitaria só fica visível e acessível após você se autenticar com o e-mail e senha de administrador.
                </p>
                <div className="flex gap-3 mt-2 w-full">
                  <button
                    onClick={() => setCurrentTab('cardapio')}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#f2ede8] text-xs font-bold text-[#554245] hover:bg-[#ece7e2]"
                  >
                    Voltar ao Cardápio
                  </button>
                  <button
                    onClick={() => setCurrentTab('auth')}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b] shadow-sm"
                  >
                    Fazer Login de Acesso
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Floating Quick Cart Notification Widget (on Cardapio screen) */}
      {(currentTab === 'cardapio' || currentTab === 'mais-pedidos') && cartCount > 0 && (
        <aside className="fixed bottom-6 right-6 z-40 max-w-sm w-[calc(100%-3rem)] bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(61,28,18,0.18)] flex items-center justify-between gap-3 border border-[#dac0c3]/40 transition-transform duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-full bg-[#ffd9de] flex items-center justify-center text-[#9c3e54] shrink-0 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#9c3e54] text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider truncate">
                Seu Pedido Rápido
              </span>
              <span className="text-sm font-bold text-[#1d1b19] truncate font-heading">
                R$ {cartTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentTab('carrinho');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold transition-colors shrink-0 shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Sacola</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
