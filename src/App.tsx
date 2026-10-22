import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MenuScreen } from './components/MenuScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { OrderTrackingScreen } from './components/OrderTrackingScreen';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
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
import { subscribeToSync, broadcastSync } from './services/syncService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('felicita_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return parsed.role === 'admin' ? 'admin' : 'cardapio';
        }
      }
    } catch (e) {}
    return 'auth';
  });
  // Categories - persisted in localStorage
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('felicita_categories_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CATEGORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('felicita_categories_list', JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  // Products - persisted in localStorage (deleted items stay deleted on reload)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('felicita_products_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('felicita_products_list', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  // Addons - persisted in localStorage
  const [addons, setAddons] = useState<ProductAddon[]>(() => {
    try {
      const saved = localStorage.getItem('felicita_addons_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_GLOBAL_ADDONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('felicita_addons_list', JSON.stringify(addons));
    } catch (e) {}
  }, [addons]);

  // Store Settings - persisted in localStorage
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('felicita_store_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_STORE_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('felicita_store_settings', JSON.stringify(storeSettings));
    } catch (e) {}
  }, [storeSettings]);

  // Persistent customers list linked to Admin Panel
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('felicita_customers_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CUSTOMERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('felicita_customers_list', JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  // Current logged in user (or guest). Never default to Mariana if not logged in.
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('felicita_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {}
    return {
      id: '',
      name: 'Visitante',
      email: '',
      role: 'customer',
      createdAt: ''
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('felicita_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed && parsed.email);
      }
    } catch (e) {}
    return false;
  });

  // Active delivery address: only present if user is logged in with address
  const [activeAddress, setActiveAddress] = useState<Address | null>(() => {
    try {
      const savedUser = localStorage.getItem('felicita_current_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.email) {
          const savedAddr = localStorage.getItem('felicita_active_address');
          if (savedAddr) return JSON.parse(savedAddr);
        }
      }
    } catch (e) {}
    return null;
  });

  // Cart items - persisted in session
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('felicita_cart_items');
      if (savedCart) return JSON.parse(savedCart);
    } catch (e) {}
    return [
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
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('felicita_cart_items', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  // Orders list - persisted in localStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('felicita_orders_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('felicita_orders_list', JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  // Real-Time Cross-Tab / Cross-Device State Synchronization
  useEffect(() => {
    const unsubscribe = subscribeToSync((payload) => {
      if (payload.type === 'ORDERS_UPDATED' && Array.isArray(payload.data)) {
        setOrders(payload.data);
      } else if (payload.type === 'PRODUCTS_UPDATED' && Array.isArray(payload.data)) {
        setProducts(payload.data);
      } else if (payload.type === 'CATEGORIES_UPDATED' && Array.isArray(payload.data)) {
        setCategories(payload.data);
      } else if (payload.type === 'ADDONS_UPDATED' && Array.isArray(payload.data)) {
        setAddons(payload.data);
      } else if (payload.type === 'STORE_SETTINGS_UPDATED' && payload.data) {
        setStoreSettings(payload.data);
      } else if (payload.type === 'CUSTOMERS_UPDATED' && Array.isArray(payload.data)) {
        setCustomers(payload.data);
      }
    });
    return () => unsubscribe();
  }, []);

  // isRevenueReset state - persisted in localStorage
  const [isRevenueReset, setIsRevenueReset] = useState<boolean>(() => {
    try {
      return localStorage.getItem('felicita_revenue_reset') === 'true';
    } catch (e) {}
    return false;
  });

  const handleResetRevenue = () => {
    setIsRevenueReset(true);
    try {
      localStorage.setItem('felicita_revenue_reset', 'true');
    } catch (e) {}
  };

  const handleRestoreRevenue = () => {
    setIsRevenueReset(false);
    try {
      localStorage.removeItem('felicita_revenue_reset');
    } catch (e) {}
  };

  const handleDeleteOrder = (orderId: string) => {
    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    try {
      localStorage.setItem('felicita_orders_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('ORDERS_UPDATED', updated);
  };

  const handleClearAllOrders = () => {
    setOrders([]);
    try {
      localStorage.setItem('felicita_orders_list', JSON.stringify([]));
    } catch (e) {}
    broadcastSync('ORDERS_UPDATED', []);
  };

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
      customerName: currentUser.name && currentUser.name !== 'Visitante' ? currentUser.name : (orderData.customerName || 'Cliente Felicitá'),
      customerEmail: currentUser.email || orderData.customerEmail || 'cliente@exemplo.com',
      customerPhone: currentUser.phone || orderData.customerPhone || '(11) 99999-0000',
      status: 'preparing',
      items: orderData.items || cartItems,
      subtotal: orderData.subtotal || cartTotal,
      deliveryFee: orderData.deliveryFee ?? storeSettings.baseDeliveryFee,
      discount: orderData.discount ?? 7.25,
      total: orderData.total || (cartTotal + storeSettings.baseDeliveryFee - 7.25),
      paymentMethod: orderData.paymentMethod || 'pix',
      paymentStatus: 'approved',
      address: orderData.address || activeAddress || DEFAULT_ADDRESS,
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

    // Update customer's order history metrics in customers list
    if (currentUser.email) {
      setCustomers(prev => {
        const updated = prev.map(c => {
          if (c.email.toLowerCase() === currentUser.email.toLowerCase()) {
            return {
              ...c,
              ordersCount: (c.ordersCount || 0) + 1,
              totalSpent: (c.totalSpent || 0) + createdOrder.total
            };
          }
          return c;
        });
        try {
          localStorage.setItem('felicita_customers_list', JSON.stringify(updated));
        } catch (e) {}
        broadcastSync('CUSTOMERS_UPDATED', updated);
        return updated;
      });
    }

    const updatedOrders = [createdOrder, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem('felicita_orders_list', JSON.stringify(updatedOrders));
    } catch (e) {}
    broadcastSync('ORDERS_UPDATED', updatedOrders);

    setCartItems([]); // Reset cart
    try {
      localStorage.removeItem('felicita_cart_items');
    } catch (e) {}
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
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: newStatus, updatedAt: 'Agora' } : o
    );
    setOrders(updated);
    try {
      localStorage.setItem('felicita_orders_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('ORDERS_UPDATED', updated);
  };

  const handleAddStockBatch = (productId: string, quantity: number) => {
    const updated = products.map(p =>
      p.id === productId ? { ...p, stockAvailable: Math.max(0, (p.stockAvailable || 0) + quantity) } : p
    );
    setProducts(updated);
    try {
      localStorage.setItem('felicita_products_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('PRODUCTS_UPDATED', updated);
  };

  const handleSetProductStock = (productId: string, quantity: number) => {
    const updated = products.map(p =>
      p.id === productId ? { ...p, stockAvailable: Math.max(0, quantity) } : p
    );
    setProducts(updated);
    try {
      localStorage.setItem('felicita_products_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('PRODUCTS_UPDATED', updated);
  };

  // Administrator CRUD actions
  const handleAddProduct = (newProd: Product) => {
    const updatedProducts = [newProd, ...products];
    setProducts(updatedProducts);
    try {
      localStorage.setItem('felicita_products_list', JSON.stringify(updatedProducts));
    } catch (e) {}
    broadcastSync('PRODUCTS_UPDATED', updatedProducts);

    // update category count
    const updatedCategories = categories.map(c =>
      c.id === newProd.categoryId || c.id === 'all' ? { ...c, count: c.count + 1 } : c
    );
    setCategories(updatedCategories);
    try {
      localStorage.setItem('felicita_categories_list', JSON.stringify(updatedCategories));
    } catch (e) {}
    broadcastSync('CATEGORIES_UPDATED', updatedCategories);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const updatedProducts = products.map(p => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updatedProducts);
    try {
      localStorage.setItem('felicita_products_list', JSON.stringify(updatedProducts));
    } catch (e) {}
    broadcastSync('PRODUCTS_UPDATED', updatedProducts);
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    try {
      localStorage.setItem('felicita_products_list', JSON.stringify(updatedProducts));
    } catch (e) {}
    broadcastSync('PRODUCTS_UPDATED', updatedProducts);

    if (prod) {
      const updatedCategories = categories.map(c =>
        c.id === prod.categoryId || c.id === 'all' ? { ...c, count: Math.max(0, c.count - 1) } : c
      );
      setCategories(updatedCategories);
      try {
        localStorage.setItem('felicita_categories_list', JSON.stringify(updatedCategories));
      } catch (e) {}
      broadcastSync('CATEGORIES_UPDATED', updatedCategories);
    }
  };

  const handleAddCategory = (newCat: Category) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    try {
      localStorage.setItem('felicita_categories_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('CATEGORIES_UPDATED', updated);
  };

  const handleDeleteCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    try {
      localStorage.setItem('felicita_categories_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('CATEGORIES_UPDATED', updated);
  };

  const handleAddAddon = (newAddon: ProductAddon) => {
    const updated = [...addons, newAddon];
    setAddons(updated);
    try {
      localStorage.setItem('felicita_addons_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('ADDONS_UPDATED', updated);
  };

  const handleDeleteAddon = (addonId: string) => {
    const updated = addons.filter(a => a.id !== addonId);
    setAddons(updated);
    try {
      localStorage.setItem('felicita_addons_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('ADDONS_UPDATED', updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    try {
      localStorage.setItem('felicita_customers_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('CUSTOMERS_UPDATED', updated);
  };

  const handleUpdateStoreSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    try {
      localStorage.setItem('felicita_store_settings', JSON.stringify(newSettings));
    } catch (e) {}
    broadcastSync('STORE_SETTINGS_UPDATED', newSettings);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser({
      id: '',
      name: 'Visitante',
      email: '',
      role: 'customer',
      createdAt: ''
    });
    setActiveAddress(null);
    setCartItems([]);
    try {
      localStorage.removeItem('felicita_current_user');
      localStorage.removeItem('felicita_active_address');
      localStorage.removeItem('felicita_cart_items');
    } catch (e) {}
    setCurrentTab('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: User, newCustomerProfile?: Customer, newAddress?: Address) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('felicita_current_user', JSON.stringify(user));
    } catch (e) {}

    // If new address was entered during registration or customer already had one, update active address
    const resolvedAddress = newAddress || newCustomerProfile?.address || (customers.find(c => c.email.toLowerCase() === user.email.toLowerCase())?.address) || DEFAULT_ADDRESS;
    setActiveAddress(resolvedAddress);
    try {
      localStorage.setItem('felicita_active_address', JSON.stringify(resolvedAddress));
    } catch (e) {}

    // Link login to customer profile and ensure new profile appears in the Admin Panel
    if (user.role === 'customer' && user.email) {
      setCustomers(prev => {
        const existingIndex = prev.findIndex(c => c.email.toLowerCase() === user.email.toLowerCase());
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            name: user.name || updated[existingIndex].name,
            phone: user.phone || updated[existingIndex].phone,
            address: resolvedAddress || updated[existingIndex].address
          };
          return updated;
        }

        const newCust: Customer = newCustomerProfile || {
          id: user.id || 'cust-' + Date.now(),
          name: user.name || 'Novo Cliente',
          email: user.email,
          phone: user.phone || '(11) 99999-0000',
          city: resolvedAddress ? `${resolvedAddress.neighborhood} • ${resolvedAddress.city}` : 'São Paulo - SP',
          address: resolvedAddress,
          ordersCount: 0,
          totalSpent: 0,
          isActive: true,
          createdAt: new Date().toLocaleDateString('pt-BR')
        };
        return [newCust, ...prev];
      });
    }

    if (user.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('cardapio');
    }
  };

  const handleUpdateOrderCourier = (orderId: string, courierName: string, courierPhone: string) => {
    const fallbackCourier = {
      name: 'Mateus Siqueira',
      phone: '(11) 98765-4321',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w',
      rating: 4.97,
      deliveriesCount: 852
    };

    const updated = orders.map(o =>
      o.id === orderId
        ? {
            ...o,
            courier: {
              ...(o.courier || fallbackCourier),
              name: courierName || o.courier?.name || 'Mateus Siqueira',
              phone: courierPhone
            }
          }
        : o
    );
    setOrders(updated);
    try {
      localStorage.setItem('felicita_orders_list', JSON.stringify(updated));
    } catch (e) {}
    broadcastSync('ORDERS_UPDATED', updated);
  };

  // Filter orders for active user: customers only see their orders, while admin sees all
  const customerOrders = (currentUser.role === 'customer' && currentUser.email)
    ? orders.filter(o => o.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase())
    : orders;
  const activeCustomerOrder = customerOrders[0] || (currentUser.role === 'admin' ? orders[0] : null);
  const pastCustomerOrders = customerOrders.slice(1);

  // Ao iniciar o sistema sem estar logado em nenhuma conta, abre APENAS a tela de login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fef8f3] text-[#1d1b19] font-sans antialiased flex flex-col justify-center items-center py-6 sm:py-10 px-4 selection:bg-[#ffd9de] selection:text-[#3f0015]">
        <AuthScreen
          customers={customers}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

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
      <main className="w-full pt-24 sm:pt-28 pb-20 lg:pb-8 flex-1">
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
            onUpdateAddress={addr => {
              setActiveAddress(addr);
              try {
                localStorage.setItem('felicita_active_address', JSON.stringify(addr));
              } catch (e) {}
            }}
          />
        )}

        {currentTab === 'rastreio' && (
          <OrderTrackingScreen
            order={activeCustomerOrder}
            pastOrders={pastCustomerOrders}
            onNavigateToMenu={() => setCurrentTab('cardapio')}
            onReorder={handleReorder}
          />
        )}

        {currentTab === 'auth' && (
          <AuthScreen
            customers={customers}
            onLoginSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setCurrentTab('cardapio')}
          />
        )}

        {/* PAINEL ADMINISTRATIVO: Só aparece depois de logado como administrador */}
        {currentTab === 'admin' && (
          currentUser.role === 'admin' ? (
            <AdminPanel
              orders={orders}
              products={products}
              categories={categories}
              addons={addons}
              storeSettings={storeSettings}
              customers={customers}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAddStockBatch={handleAddStockBatch}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddAddon={handleAddAddon}
              onDeleteAddon={handleDeleteAddon}
              onDeleteCustomer={handleDeleteCustomer}
              onSetProductStock={handleSetProductStock}
              onUpdateStoreSettings={handleUpdateStoreSettings}
              onUpdateOrderCourier={handleUpdateOrderCourier}
              onDeleteOrder={handleDeleteOrder}
              onClearAllOrders={handleClearAllOrders}
              onResetRevenue={handleResetRevenue}
              onRestoreRevenue={handleRestoreRevenue}
              isRevenueReset={isRevenueReset}
              onLogout={handleLogout}
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
        <aside className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(61,28,18,0.18)] flex items-center justify-between gap-3 border border-[#dac0c3]/40 transition-transform duration-300">
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

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
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
        isLoggedIn={isLoggedIn}
        userRole={currentUser.role}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
