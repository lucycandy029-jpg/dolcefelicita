import React, { useState, useRef } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  RefreshCw, 
  Plus, 
  ShieldAlert,
  BarChart3,
  Store,
  Layers,
  Sparkles,
  Users,
  Truck,
  Trash2,
  Edit3,
  Upload,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Search,
  Sliders,
  X,
  Printer,
  FileText,
  LogOut,
  Navigation,
  MapPin
} from 'lucide-react';
import { Order, Product, OrderStatus, Category, ProductAddon, StoreSettings, Customer } from '../types';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  addons: ProductAddon[];
  storeSettings: StoreSettings;
  customers: Customer[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onAddStockBatch: (productId: string, quantity: number) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddAddon: (addon: ProductAddon) => void;
  onDeleteAddon: (addonId: string) => void;
  onUpdateStoreSettings: (settings: StoreSettings) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  products,
  categories,
  addons,
  storeSettings,
  customers,
  onUpdateOrderStatus,
  onAddStockBatch,
  onAddProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  onAddAddon,
  onDeleteAddon,
  onUpdateStoreSettings,
  onLogout
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'orders' | 'products' | 'addons' | 'categories' | 'customers' | 'inventory' | 'store' | 'finances'
  >('orders');

  // WhatsApp modal state for client
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [selectedOrderForWhatsApp, setSelectedOrderForWhatsApp] = useState<Order | null>(null);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Comanda Modal State for courier (Entregador)
  const [comandaModalOpen, setComandaModalOpen] = useState<boolean>(false);
  const [selectedOrderForComanda, setSelectedOrderForComanda] = useState<Order | null>(null);
  const [courierNameInput, setCourierNameInput] = useState<string>('Mateus Siqueira');
  const [courierPhoneInput, setCourierPhoneInput] = useState<string>('(11) 98765-4321');
  const [comandaCopiedFeedback, setComandaCopiedFeedback] = useState<boolean>(false);

  // New Product Modal Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>(categories[1]?.id || 'cookies');
  const [newProductPrice, setNewProductPrice] = useState<number>(18.00);
  const [newProductShortDesc, setNewProductShortDesc] = useState<string>('');
  const [newProductFullDesc, setNewProductFullDesc] = useState<string>('');
  const [newProductUnitLabel, setNewProductUnitLabel] = useState<string>('Unidade 130g');
  const [newProductBadge, setNewProductBadge] = useState<string>('Fornada do Dia');
  const [newProductImage, setNewProductImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Addon Form State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState<boolean>(false);
  const [newAddonName, setNewAddonName] = useState<string>('');
  const [newAddonDesc, setNewAddonDesc] = useState<string>('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(4.00);

  // New Category Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryId, setNewCategoryId] = useState<string>('');

  // Store Settings Form State
  const [currentStoreSettings, setCurrentStoreSettings] = useState<StoreSettings>(storeSettings);
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState<boolean>(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Stock batch
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<string>(products[0]?.id || '');
  const [batchQuantity, setBatchQuantity] = useState<number>(20);

  // Status mapping
  const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Aguardando Confirmação', color: 'bg-amber-100 text-amber-800' },
    { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Na Cozinha (Preparando)', color: 'bg-orange-100 text-orange-800' },
    { value: 'ready', label: 'Pronto para Envio', color: 'bg-purple-100 text-purple-800' },
    { value: 'out_for_delivery', label: 'Saiu para Entrega', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered', label: 'Entregue', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-rose-100 text-rose-800' }
  ];

  const totalSalesToday = orders.reduce((acc, o) => acc + o.total, 0) + 1240.00;
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  // Handle Image Upload from User's Device
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewProductImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      alert('Por favor informe o nome do doce.');
      return;
    }

    const created: Product = {
      id: 'prod-' + Date.now(),
      categoryId: newProductCategory,
      name: newProductName,
      slug: newProductName.toLowerCase().replace(/\s+/g, '-'),
      shortDescription: newProductShortDesc || 'Doce artesanal preparado com chocolate belga e amor.',
      description: newProductFullDesc || newProductShortDesc || 'Receita autoral fresca da Confeitaria Felicitá.',
      price: newProductPrice,
      unitLabel: newProductUnitLabel,
      badgeTag: newProductBadge || undefined,
      isAvailable: true,
      isFeatured: false,
      rating: 5.0,
      reviewCount: 1,
      imageUrl: newProductImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI9Q2Q983DUN78ApFjsf6giUl5bNQw43hicPMNuQdfluHfpxDWQnPMwyexvuvkGoMti9NDD_gC8YvkEi_VgvHyTi7gkcta7R7V7yNP-WFjTOBRBqSprkpCCh0amzAIONLS0SawvXJWEXo1-8vKn0rJ6MMVwtj29R7ugGXBHgyfNzUOH7PzIy5XagYcXz0XUN7Gpt4s1wfUfOpiRYJZGxAM9E2yyubWUWv_QpNYA_oOx9u0tGvSpYf9Iw',
      stockAvailable: 25,
      addons: addons.slice(0, 3)
    };

    onAddProduct(created);
    setIsProductModalOpen(false);
    // Reset form
    setNewProductName('');
    setNewProductShortDesc('');
    setNewProductFullDesc('');
    setNewProductImage('');
    alert('Novo doce adicionado ao cardápio com sucesso!');
  };

  const handleCreateAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonName.trim()) {
      alert('Informe o nome do adicional.');
      return;
    }
    const created: ProductAddon = {
      id: 'addon-' + Date.now(),
      name: newAddonName,
      description: newAddonDesc,
      price: newAddonPrice
    };
    onAddAddon(created);
    setIsAddonModalOpen(false);
    setNewAddonName('');
    setNewAddonDesc('');
    alert('Item de personalização adicionado com sucesso!');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const catId = newCategoryId.trim() || newCategoryName.toLowerCase().replace(/\s+/g, '-');
    const created: Category = {
      id: catId,
      name: newCategoryName,
      iconName: 'cake',
      count: 0
    };
    onAddCategory(created);
    setIsCategoryModalOpen(false);
    setNewCategoryName('');
    setNewCategoryId('');
    alert('Nova categoria criada com sucesso!');
  };

  // WhatsApp generator based on status
  const openWhatsAppModal = (order: Order) => {
    setSelectedOrderForWhatsApp(order);
    let msg = '';
    const clientFirstName = order.customerName.split(' ')[0];

    switch (order.status) {
      case 'confirmed':
        msg = `Olá ${clientFirstName}! 🍪 Seu pedido #${order.orderNumber} da Felicitá Doces foi confirmado e já está na fila do nosso ateliê! Logo enviaremos novas atualizações.`;
        break;
      case 'preparing':
        msg = `Olá ${clientFirstName}! 👩‍🍳 Uma fornada fresquinha com seu pedido #${order.orderNumber} está no forno agora mesmo! Nossas confeiteiras estão cuidando de cada detalhe com chocolate nobre e amor. Previsão: 35-45 min.`;
        break;
      case 'ready':
        msg = `Olá ${clientFirstName}! ✨ Seu pedido #${order.orderNumber} da Felicitá Doces já está prontinho, embalado com lacre térmico aroma-safe e aguardando o entregador.`;
        break;
      case 'out_for_delivery':
        msg = `Olá ${clientFirstName}! 🛵 Seu pedido #${order.orderNumber} da Felicitá Doces acabou de sair para entrega com nosso motoboy ${order.courier?.name || 'Mateus Siqueira'}. Previsão de chegada: 15 a 25 minutos no endereço ${order.address.street}, ${order.address.number}. Bom apetite!`;
        break;
      case 'delivered':
        msg = `Olá ${clientFirstName}! 🎉 Seu pedido #${order.orderNumber} foi entregue com sucesso! Esperamos que adoce e traga muita felicidade ao seu dia. Se puder, conte para nós o que achou dos cookies e brownies! ♥ Felicitá Doces.`;
        break;
      case 'cancelled':
        msg = `Olá ${clientFirstName}, informamos que seu pedido #${order.orderNumber} da Felicitá Doces foi cancelado. Se tiver dúvidas, estamos à total disposição aqui no WhatsApp.`;
        break;
      default:
        msg = `Olá ${clientFirstName}! Atualização do seu pedido #${order.orderNumber} na Felicitá Doces.`;
    }

    setCustomWhatsAppMsg(msg);
    setWhatsAppModalOpen(true);
    setCopiedSuccess(false);
  };

  const cleanPhoneForWhatsApp = (phone?: string) => {
    if (!phone) return '5511987654321';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      return '55' + digits;
    }
    return digits;
  };

  const handleSendWhatsApp = () => {
    if (!selectedOrderForWhatsApp) return;
    const phone = cleanPhoneForWhatsApp(selectedOrderForWhatsApp.customerPhone);
    const encoded = encodeURIComponent(customWhatsAppMsg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customWhatsAppMsg);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Courier Comanda handlers
  const openComandaModal = (order: Order) => {
    setSelectedOrderForComanda(order);
    setCourierNameInput(order.courier?.name || 'Mateus Siqueira');
    setCourierPhoneInput(order.courier?.phone || '(11) 98765-4321');
    setComandaModalOpen(true);
    setComandaCopiedFeedback(false);
  };

  const getCourierWhatsAppMessage = (order: Order, courierName: string): string => {
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address.street}, ${order.address.number}, ${order.address.neighborhood}, ${order.address.city}`)}`;
    const itemsList = order.items
      .map((item, idx) => {
        const addonsText = item.addons.length > 0 ? ` (+ ${item.addons.map(a => a.name).join(', ')})` : '';
        const notesText = item.notes ? ` [Obs: ${item.notes}]` : '';
        return `  ${idx + 1}. *${item.quantity}x ${item.name}* (${item.unitLabel})${addonsText}${notesText}`;
      })
      .join('\n');

    const paymentInfo = order.paymentStatus === 'approved'
      ? `✅ *JÁ PAGO ONLINE VIA ${order.paymentMethod.toUpperCase()}* — *NÃO COBRAR NADA DO CLIENTE!*`
      : `⚠️ *COBRAR DO CLIENTE NA ENTREGA:* R$ ${order.total.toFixed(2).replace('.', ',')} (${order.paymentMethod.toUpperCase()})`;

    return `🧁 *DOLCE FELICITÁ DOCES E COOKIES* 🛵
*COMANDA DE ENTREGA — PEDIDO #${order.orderNumber}*
📅 Data: ${order.createdAt} | ⏱️ Previsão: ${order.estimatedDeliveryTime}

👤 *DADOS DO CLIENTE:*
• Nome: ${order.customerName}
• WhatsApp: ${order.customerPhone || '(11) 98765-4321'}

📍 *ENDEREÇO DE ENTREGA:*
${order.address.street}, ${order.address.number}${order.address.complement ? ' - ' + order.address.complement : ''}
Bairro: ${order.address.neighborhood}
Cidade: ${order.address.city} - ${order.address.state}
CEP: ${order.address.postalCode}
${order.address.referencePoint ? `🚩 *Ponto de Ref:* ${order.address.referencePoint}\n` : ''}🗺️ *Rota Google Maps:*
${mapsLink}

📦 *PACOTE DE DOCES:*
${itemsList}

📝 *OBSERVAÇÕES DO CLIENTE:*
${order.notes || 'Nenhuma observação especial informada.'}

💰 *VALORES & COBRANÇA:*
• Subtotal: R$ ${order.subtotal.toFixed(2).replace('.', ',')}
• Taxa Entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}
• Total Geral: *R$ ${order.total.toFixed(2).replace('.', ',')}*
👉 *SITUAÇÃO DO PAGAMENTO:*
${paymentInfo}

🛵 *ENTREGADOR DESIGNADO:* ${courierName}
Tenha uma excelente entrega e vá com segurança! 🚴💨`;
  };

  const handleSendCourierWhatsApp = () => {
    if (!selectedOrderForComanda) return;
    const cleanDigits = courierPhoneInput.replace(/\D/g, '');
    const phoneWithCountry = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
    const message = getCourierWhatsAppMessage(selectedOrderForComanda, courierNameInput);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyCourierComanda = () => {
    if (!selectedOrderForComanda) return;
    const message = getCourierWhatsAppMessage(selectedOrderForComanda, courierNameInput);
    navigator.clipboard.writeText(message);
    setComandaCopiedFeedback(true);
    setTimeout(() => setComandaCopiedFeedback(false), 2500);
  };

  const handlePrintComanda = () => {
    window.print();
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreSettings(currentStoreSettings);
    setSettingsSavedFeedback(true);
    setTimeout(() => setSettingsSavedFeedback(false), 2500);
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-[#311309] text-white text-[10px] uppercase font-bold tracking-wider">
              Painel Administrativo Autorizado
            </span>
            <span className="text-xs text-[#7f5347] font-semibold">PostgreSQL 17 • dolce_felicita</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1d1b19] font-heading mt-1">
            Gestão da Confeitaria Felicitá
          </h1>
          <p className="text-xs text-[#554245]">
            Gerencie cardápio, imagens, opcionais, pedidos, entregas, clientes, estoque e configurações da loja.
          </p>
        </div>

        {onLogout && (
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 border border-rose-200 transition-colors cursor-pointer shadow-sm"
              title="Encerrar sessão e fazer logout do painel administrativo"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sair da Conta (Logout)</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#f2ede8] overflow-x-auto self-start lg:self-auto max-w-full">
          <button
            onClick={() => setActiveAdminTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'orders' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Pedidos & Entregas ({activeOrdersCount})
          </button>
          <button
            onClick={() => setActiveAdminTab('products')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'products' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Itens do Cardápio ({products.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('addons')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'addons' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Personalização ({addons.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('categories')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'categories' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Categorias ({categories.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('customers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'customers' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Clientes ({customers.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('inventory')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'inventory' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Estoque
          </button>
          <button
            onClick={() => setActiveAdminTab('store')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'store' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Dados da Loja
          </button>
          <button
            onClick={() => setActiveAdminTab('finances')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'finances' ? 'bg-[#9c3e54] text-white shadow-sm' : 'text-[#554245] hover:text-[#1d1b19]'
            }`}
          >
            Faturamento
          </button>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#dac0c3]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7f5347] font-bold uppercase tracking-wider">Faturamento Hoje</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1d1b19]">
              R$ {totalSalesToday.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs ontem
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#dac0c3]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7f5347] font-bold uppercase tracking-wider">Pedidos Ativos</span>
            <div className="w-8 h-8 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#9c3e54]">
              {activeOrdersCount} em andamento
            </div>
            <span className="text-[11px] text-[#554245] mt-0.5 block">
              Notificação WhatsApp habilitada
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#dac0c3]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7f5347] font-bold uppercase tracking-wider">Itens no Catálogo</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1d1b19]">{products.length} produtos</div>
            <span className="text-[11px] text-[#554245] mt-0.5 block">
              Em {categories.length} categorias
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#dac0c3]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#7f5347] font-bold uppercase tracking-wider">Base de Clientes</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1d1b19]">{customers.length} cadastrados</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              100% com WhatsApp ativo
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: GESTÃO DE PEDIDOS E ENTREGAS COM WHATSAPP
         ========================================================================= */}
      {activeAdminTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#dac0c3]/30 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d1b19] font-heading">
                Gestão de Pedidos & Rastreio de Entregas
              </h2>
              <p className="text-xs text-[#554245]">
                Altere status e envie mensagens automáticas de aviso para o WhatsApp do cliente com 1 clique.
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 w-fit">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Notificações WhatsApp Ativas
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {orders.map(orderItem => (
              <div
                key={orderItem.id}
                className="p-5 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#9c3e54] shrink-0 font-bold text-sm border border-[#dac0c3]/30">
                    #{orderItem.orderNumber}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1d1b19] font-heading">
                        {orderItem.customerName}
                      </span>
                      <span className="text-xs text-[#7f5347] font-semibold">
                        • {orderItem.customerPhone || '(11) 98765-4321'}
                      </span>
                      <span className="text-xs text-[#877274]">
                        • {orderItem.createdAt}
                      </span>
                    </div>

                    <p className="text-xs text-[#554245] mt-1">
                      {orderItem.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                      <span className="font-bold text-[#9c3e54]">
                        Total: R$ {orderItem.total.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[#7f5347]">
                        Entrega: {orderItem.address.street}, {orderItem.address.number} ({orderItem.address.neighborhood})
                      </span>
                      <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-[#dac0c3]/40">
                        {orderItem.paymentMethod.toUpperCase()} ({orderItem.paymentStatus})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                  {/* Status Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-[10px] text-[#7f5347] uppercase font-bold mb-1">
                      Alterar Status:
                    </label>
                    <select
                      value={orderItem.status}
                      onChange={e => onUpdateOrderStatus(orderItem.id, e.target.value as OrderStatus)}
                      className="px-3 py-1.5 rounded-full bg-white text-xs font-bold text-[#1d1b19] border border-[#dac0c3] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#9c3e54] cursor-pointer"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* WhatsApp Notify Button */}
                  <div className="flex flex-col">
                    <label className="text-[10px] text-[#7f5347] uppercase font-bold mb-1">
                      Aviso ao Cliente:
                    </label>
                    <button
                      onClick={() => openWhatsAppModal(orderItem)}
                      className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      title="Enviar status no WhatsApp do cliente"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Notificar WhatsApp</span>
                    </button>
                  </div>

                  {/* Comanda do Entregador Button */}
                  <div className="flex flex-col">
                    <label className="text-[10px] text-[#7f5347] uppercase font-bold mb-1">
                      Para o Entregador:
                    </label>
                    <button
                      onClick={() => openComandaModal(orderItem)}
                      className="px-3.5 py-1.5 rounded-full bg-[#311309] hover:bg-[#1d1b19] text-[#ffd9de] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ring-1 ring-[#ffd9de]/30"
                      title="Abrir comanda para imprimir ou enviar no WhatsApp do entregador"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#ffd9de]" />
                      <span>Comanda Entregador</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ITENS DO CARDÁPIO (INCLUSÃO, EXCLUSÃO E FOTOS DO DISPOSITIVO)
         ========================================================================= */}
      {activeAdminTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#dac0c3]/30 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d1b19] font-heading">
                Gerenciador de Itens do Cardápio
              </h2>
              <p className="text-xs text-[#554245]">
                Adicione novos doces com fotos diretamente do seu dispositivo ou remova itens descontinuados.
              </p>
            </div>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Novo Doce ao Cardápio</span>
            </button>
          </div>

          {/* Products List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div
                key={product.id}
                className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30 flex flex-col justify-between relative group hover:shadow-md transition-all"
              >
                <div className="flex gap-3 items-start">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-[#dac0c3]/30">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#7f5347] uppercase font-bold">
                        {product.categoryId}
                      </span>
                      {product.badgeTag && (
                        <span className="text-[9px] bg-[#ffd9de] text-[#9c3e54] px-2 py-0.5 rounded-full font-bold">
                          {product.badgeTag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#1d1b19] font-heading truncate mt-0.5">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-[#554245] line-clamp-2 mt-1">
                      {product.shortDescription}
                    </p>
                    <span className="text-xs font-bold text-[#9c3e54] mt-2">
                      R$ {product.price.toFixed(2).replace('.', ',')} • {product.unitLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#dac0c3]/30 text-xs">
                  <span className="text-[#7f5347] font-semibold text-[11px]">
                    Estoque: <strong>{product.stockAvailable || 20} un</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir "${product.name}" do cardápio?`)) {
                        onDeleteProduct(product.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                    title="Excluir produto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ITENS PARA PERSONALIZAÇÃO DE PEDIDOS (ADDONS)
         ========================================================================= */}
      {activeAdminTab === 'addons' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#dac0c3]/30 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d1b19] font-heading">
                Opcionais de Personalização do Pedido ("Turbine seu Doce")
              </h2>
              <p className="text-xs text-[#554245]">
                Itens e adicionais que o cliente pode selecionar no painel de personalização (ex: caldas, coberturas, embalagens de presente).
              </p>
            </div>
            <button
              onClick={() => setIsAddonModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Item de Personalização</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map(addon => (
              <div
                key={addon.id}
                className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1b19] font-heading">{addon.name}</span>
                    <span className="text-xs font-extrabold text-[#9c3e54]">
                      + R$ {addon.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs text-[#554245] mt-1">{addon.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#dac0c3]/30 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm(`Remover o opcional "${addon.name}"?`)) {
                        onDeleteAddon(addon.id);
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CATEGORIAS DO SISTEMA
         ========================================================================= */}
      {activeAdminTab === 'categories' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#dac0c3]/30 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d1b19] font-heading">
                Gestão de Categorias
              </h2>
              <p className="text-xs text-[#554245]">
                Organize seu cardápio em seções (Cookies, Brownies, Bolos, Doces Finos, etc.).
              </p>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Categoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#9c3e54] font-bold shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">{cat.iconName || 'cake'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1d1b19] font-heading">{cat.name}</span>
                    <span className="text-xs text-[#877274]">ID: {cat.id} • {cat.count} doces</span>
                  </div>
                </div>

                {cat.id !== 'all' && (
                  <button
                    onClick={() => {
                      if (confirm(`Excluir a categoria "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CLIENTES & HISTÓRICO DE COMPRAS
         ========================================================================= */}
      {activeAdminTab === 'customers' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#dac0c3]/30 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d1b19] font-heading">
                Gestão de Clientes Felicitá
              </h2>
              <p className="text-xs text-[#554245]">
                Consulte dados cadastrais, histórico de pedidos e inicie contato direto no WhatsApp.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#877274] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente por nome..."
                className="w-full pl-9 pr-3 py-1.5 rounded-full bg-[#f8f3ee] text-xs border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f2ede8] text-[#7f5347] uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">WhatsApp / Telefone</th>
                  <th className="py-2.5 px-3">Localização</th>
                  <th className="py-2.5 px-3">Total Pedidos</th>
                  <th className="py-2.5 px-3">Total Gasto</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8f3ee]">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-[#f8f3ee]/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1d1b19]">{cust.name}</span>
                        <span className="text-[11px] text-[#877274]">{cust.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#1d1b19]">{cust.phone}</td>
                    <td className="py-3 px-3 text-[#554245]">{cust.city}</td>
                    <td className="py-3 px-3 font-bold text-[#1d1b19]">{cust.ordersCount} compras</td>
                    <td className="py-3 px-3 font-bold text-[#9c3e54]">
                      R$ {cust.totalSpent.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(cust.phone)}?text=${encodeURIComponent(`Olá ${cust.name}! Somos da Felicitá Doces e Cookies. Como podemos adoçar seu dia hoje?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-[11px] transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: DADOS SOBRE A LOJA (CONFIGURAÇÕES)
         ========================================================================= */}
      {activeAdminTab === 'store' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#dac0c3]/30 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fec4b4] text-[#7a4f42] flex items-center justify-center">
                <Store className="w-5 h-5 text-[#9c3e54]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1d1b19] font-heading">
                  Dados & Configurações da Loja
                </h2>
                <p className="text-xs text-[#554245]">
                  Informações institucionais, horários de atendimento, regras de frete e dados de pagamento.
                </p>
              </div>
            </div>
            {settingsSavedFeedback && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 animate-bounce">
                <Check className="w-3.5 h-3.5" /> Salvo com Sucesso!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveStoreSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Nome da Loja</label>
              <input
                type="text"
                value={currentStoreSettings.storeName}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Slogan / Subtítulo</label>
              <input
                type="text"
                value={currentStoreSettings.slogan}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, slogan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">CNPJ</label>
              <input
                type="text"
                value={currentStoreSettings.cnpj}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, cnpj: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Telefone / WhatsApp Comercial</label>
              <input
                type="text"
                value={currentStoreSettings.phone}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Instagram Oficial</label>
              <input
                type="text"
                value={currentStoreSettings.instagram}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, instagram: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Chave PIX Oficial</label>
              <input
                type="text"
                value={currentStoreSettings.pixKey}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, pixKey: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Endereço Físico do Ateliê</label>
              <input
                type="text"
                value={currentStoreSettings.address}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Horário de Funcionamento</label>
              <input
                type="text"
                value={currentStoreSettings.openingHours}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, openingHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Dias Fechados</label>
              <input
                type="text"
                value={currentStoreSettings.closedDays}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, closedDays: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Taxa Base de Entrega (R$)</label>
              <input
                type="number"
                step="0.50"
                value={currentStoreSettings.baseDeliveryFee}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, baseDeliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#1d1b19]">Frete Grátis a partir de (R$)</label>
              <input
                type="number"
                step="1.00"
                value={currentStoreSettings.freeShippingThreshold}
                onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
              />
            </div>

            <div className="sm:col-span-2 pt-4 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-8 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Salvar Configurações da Loja
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 7: CONTROLE DE ESTOQUE
         ========================================================================= */}
      {activeAdminTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border border-[#dac0c3]/30">
            <h2 className="text-lg font-bold text-[#1d1b19] mb-4 font-heading">
              Saldos Atuais em Estoque (PostgreSQL 17 - inventory)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f2ede8] text-[#7f5347] uppercase font-bold text-[10px]">
                    <th className="py-2.5 px-3">Doce</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Preço</th>
                    <th className="py-2.5 px-3">Disponível</th>
                    <th className="py-2.5 px-3">Situação</th>
                    <th className="py-2.5 px-3 text-right">Ações no Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8f3ee]">
                  {products.map(product => {
                    const stock = product.stockAvailable || 20;
                    const isLow = stock < 10;
                    return (
                      <tr key={product.id} className="hover:bg-[#f8f3ee]/60 transition-colors">
                        <td className="py-3 px-3 flex items-center gap-2">
                          <img src={product.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          <span className="font-bold text-[#1d1b19]">{product.name}</span>
                        </td>
                        <td className="py-3 px-3 text-[#554245] capitalize">{product.categoryId}</td>
                        <td className="py-3 px-3 font-semibold text-[#9c3e54]">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3 px-3 font-bold text-sm text-[#1d1b19]">{stock} un</td>
                        <td className="py-3 px-3">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> Baixo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" /> Normal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                if (window.confirm(`Deseja zerar a quantidade em estoque de "${product.name}"?`)) {
                                  onAddStockBatch(product.id, -(product.stockAvailable || 0));
                                }
                              }}
                              className="px-2 py-1 rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold text-[11px] border border-amber-200 transition-colors cursor-pointer"
                              title="Zerar quantidade em estoque"
                            >
                              Zerar
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir "${product.name}" do estoque? Este doce deixará de constar no estoque e no catálogo.`)) {
                                  onDeleteProduct(product.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-[11px] border border-rose-200 transition-colors cursor-pointer shadow-sm"
                              title="Excluir item definitivamente do estoque"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir do Estoque</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Batch Entry Box */}
          <div className="lg:col-span-4 bg-[#f8f3ee] rounded-3xl p-6 border border-[#dac0c3]/30 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#9c3e54] text-white flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1d1b19] font-heading">
                Registrar Nova Fornada Fresca
              </h3>
            </div>
            <p className="text-xs text-[#554245]">
              Insere registro com tipo <code>production_entry</code> no histórico de movimentações.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase text-[#7f5347]">Produto Fornecido</label>
              <select
                value={selectedProductForBatch}
                onChange={e => setSelectedProductForBatch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white text-xs border border-[#dac0c3]/50 focus:outline-none"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase text-[#7f5347]">Quantidade Assada</label>
              <input
                type="number"
                min={1}
                value={batchQuantity}
                onChange={e => setBatchQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-white text-xs border border-[#dac0c3]/50 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                onAddStockBatch(selectedProductForBatch, batchQuantity);
                alert(`Fornada de +${batchQuantity} unidades registrada com sucesso!`);
              }}
              className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b] shadow-sm transition-all cursor-pointer"
            >
              Confirmar Fornada no Estoque
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: FATURAMENTO & RELATÓRIOS
         ========================================================================= */}
      {activeAdminTab === 'finances' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#dac0c3]/30 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-[#1d1b19] font-heading">
              Relatório Financeiro & Métodos de Pagamento
            </h2>
            <p className="text-xs text-[#554245]">
              Diferenciação clara entre valores faturados e recebidos instantaneamente (PIX / Cartões).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
              <span className="text-[10px] uppercase font-bold text-[#7f5347]">PIX Instantâneo (68%)</span>
              <div className="text-xl font-bold text-[#9c3e54] mt-1">R$ 1.250,00</div>
              <span className="text-[11px] text-emerald-600 font-semibold">100% Liquidado em conta</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
              <span className="text-[10px] uppercase font-bold text-[#7f5347]">Cartão de Crédito (26%)</span>
              <div className="text-xl font-bold text-[#1d1b19] mt-1">R$ 480,00</div>
              <span className="text-[11px] text-blue-600 font-semibold">Recebimento D+1 Gateway</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
              <span className="text-[10px] uppercase font-bold text-[#7f5347]">Débito / Dinheiro (6%)</span>
              <div className="text-xl font-bold text-[#1d1b19] mt-1">R$ 110,00</div>
              <span className="text-[11px] text-[#554245]">Na entrega com motoboy</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: WHATSAPP NOTIFICATION SENDER
         ========================================================================= */}
      {whatsAppModalOpen && selectedOrderForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setWhatsAppModalOpen(false)}
              className="absolute top-4 right-4 text-[#877274] hover:text-[#1d1b19] p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1d1b19] font-heading">
                  Enviar Mensagem via WhatsApp
                </h3>
                <p className="text-xs text-[#554245]">
                  Cliente: <strong>{selectedOrderForWhatsApp.customerName}</strong> • {selectedOrderForWhatsApp.customerPhone || '(11) 98765-4321'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#7f5347] uppercase tracking-wider">
                Texto da Notificação de Entrega:
              </label>
              <textarea
                rows={5}
                value={customWhatsAppMsg}
                onChange={e => setCustomWhatsAppMsg(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-xs font-bold text-[#554245] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSuccess ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp do Cliente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: INCLUSÃO DE NOVO PRODUTO COM UPLOAD DIRETO DO DISPOSITIVO
         ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4 relative animate-in fade-in zoom-in-95 my-8">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-[#877274] hover:text-[#1d1b19] p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1d1b19] font-heading">
                  Novo Doce no Cardápio
                </h3>
                <p className="text-xs text-[#554245]">
                  Cadastre uma receita com foto direto da galeria ou câmera do seu dispositivo.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Nome do Doce / Cookie</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                    placeholder="Ex: Cookie Caramelo Salgado"
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Categoria</label>
                  <select
                    value={newProductCategory}
                    onChange={e => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={newProductPrice}
                    onChange={e => setNewProductPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Gramatura / Unidade</label>
                  <input
                    type="text"
                    value={newProductUnitLabel}
                    onChange={e => setNewProductUnitLabel(e.target.value)}
                    placeholder="Ex: Unidade 130g"
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Tag em Destaque</label>
                  <select
                    value={newProductBadge}
                    onChange={e => setNewProductBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                  >
                    <option value="Fornada do Dia">Fornada do Dia</option>
                    <option value="Mais Pedido">Mais Pedido</option>
                    <option value="Edição Limitada">Edição Limitada</option>
                    <option value="Novo">Novo</option>
                    <option value="Cacau 70%">Cacau 70%</option>
                    <option value="">Nenhuma</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Descrição Curta</label>
                <input
                  type="text"
                  value={newProductShortDesc}
                  onChange={e => setNewProductShortDesc(e.target.value)}
                  placeholder="Ex: Massa crocante e centro recheado de caramelo"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                />
              </div>

              {/* FOTO DIRETO DO DISPOSITIVO */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
                <label className="font-bold text-[#1d1b19] flex items-center justify-between">
                  <span>Foto do Doce (Direto do seu Computador ou Celular)</span>
                  <span className="text-[10px] text-[#7f5347] uppercase">Upload de Arquivo</span>
                </label>

                <div className="flex items-center gap-4">
                  {newProductImage ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#dac0c3]/50 shrink-0">
                      <img src={newProductImage} alt="Prévia" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProductImage('')}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-[#dac0c3] bg-white flex flex-col items-center justify-center text-[#877274] hover:border-[#9c3e54] cursor-pointer shrink-0 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-[#9c3e54]" />
                      <span className="text-[9px] mt-1 font-bold">Enviar foto</span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-white hover:bg-[#ece7e2] text-xs font-bold text-[#1d1b19] border border-[#dac0c3] flex items-center gap-1.5 w-fit cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#9c3e54]" />
                      <span>{newProductImage ? 'Substituir Imagem' : 'Escolher Imagem do Dispositivo'}</span>
                    </button>
                    <span className="text-[10px] text-[#877274] mt-1">
                      Aceita JPG, PNG ou WEBP em alta resolução.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#f2ede8] text-xs font-semibold text-[#554245]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b] shadow-sm"
                >
                  Salvar no Cardápio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: INCLUSÃO DE NOVO OPCIONAL (ADDON)
         ========================================================================= */}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4 relative">
            <button
              onClick={() => setIsAddonModalOpen(false)}
              className="absolute top-4 right-4 text-[#877274] hover:text-[#1d1b19] p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#1d1b19] font-heading">
              Novo Opcional de Personalização
            </h3>

            <form onSubmit={handleCreateAddon} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Nome do Opcional</label>
                <input
                  type="text"
                  required
                  value={newAddonName}
                  onChange={e => setNewAddonName(e.target.value)}
                  placeholder="Ex: Pote de Caramelo Salgado 30ml"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Preço Adicional (R$)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={newAddonPrice}
                  onChange={e => setNewAddonPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Descrição / Modo de Envio</label>
                <input
                  type="text"
                  value={newAddonDesc}
                  onChange={e => setNewAddonDesc(e.target.value)}
                  placeholder="Ex: Pote térmico separado para regar"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddonModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#f2ede8] text-xs font-semibold text-[#554245]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b]"
                >
                  Salvar Opcional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: INCLUSÃO DE NOVA CATEGORIA
         ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4 relative">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-[#877274] hover:text-[#1d1b19] p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#1d1b19] font-heading">
              Criar Nova Categoria
            </h3>

            <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Gelatos & Sorvetes"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Identificador (Slug)</label>
                <input
                  type="text"
                  value={newCategoryId}
                  onChange={e => setNewCategoryId(e.target.value)}
                  placeholder="Ex: gelatos-sorvetes"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#f2ede8] text-xs font-semibold text-[#554245]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b]"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
