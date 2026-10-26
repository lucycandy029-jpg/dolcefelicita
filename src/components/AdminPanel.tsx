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
  MapPin,
  Phone,
  RotateCcw,
  Cake,
  QrCode
} from 'lucide-react';
import { Order, Product, OrderStatus, Category, ProductAddon, StoreSettings, Customer } from '../types';
import { CategoryIcon } from './CategoryIcon';

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
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddAddon: (addon: ProductAddon) => void;
  onDeleteAddon: (addonId: string) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onClearAllOrders?: () => void;
  onResetRevenue?: () => void;
  onRestoreRevenue?: () => void;
  isRevenueReset?: boolean;
  onSetProductStock?: (productId: string, quantity: number) => void;
  onUpdateStoreSettings: (settings: StoreSettings) => void;
  onUpdateOrderCourier?: (orderId: string, courierName: string, courierPhone: string) => void;
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
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory,
  onAddAddon,
  onDeleteAddon,
  onDeleteCustomer,
  onDeleteOrder,
  onClearAllOrders,
  onResetRevenue,
  onRestoreRevenue,
  isRevenueReset = false,
  onSetProductStock,
  onUpdateStoreSettings,
  onUpdateOrderCourier,
  onLogout
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'orders' | 'products' | 'addons' | 'categories' | 'customers' | 'inventory' | 'store' | 'finances'
  >('orders');

  // In-App Confirmation Modal state (prevents issues with browser confirm() in iframes)
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemType: 'product' | 'addon' | 'category' | 'customer' | 'stock_zero' | 'stock_delete' | 'order' | 'all_orders' | 'reset_revenue';
    itemId: string;
    itemName: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemType: 'product',
    itemId: '',
    itemName: ''
  });

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

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

  // Courier phone & name edit modal state
  const [courierEditModalOpen, setCourierEditModalOpen] = useState<boolean>(false);
  const [selectedOrderForCourierEdit, setSelectedOrderForCourierEdit] = useState<Order | null>(null);
  const [editingCourierName, setEditingCourierName] = useState<string>('');
  const [editingCourierPhone, setEditingCourierPhone] = useState<string>('');

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

  // Edit Product Modal Form State
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState<string>('');
  const [editProductCategory, setEditProductCategory] = useState<string>(categories[1]?.id || 'cookies');
  const [editProductPrice, setEditProductPrice] = useState<number>(18.00);
  const [editProductShortDesc, setEditProductShortDesc] = useState<string>('');
  const [editProductFullDesc, setEditProductFullDesc] = useState<string>('');
  const [editProductUnitLabel, setEditProductUnitLabel] = useState<string>('Unidade 130g');
  const [editProductBadge, setEditProductBadge] = useState<string>('');
  const [editProductImage, setEditProductImage] = useState<string>('');
  const [editProductStock, setEditProductStock] = useState<number>(20);
  const [editProductIsAvailable, setEditProductIsAvailable] = useState<boolean>(true);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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
  const pixFileInputRef = useRef<HTMLInputElement>(null);

  // Keep currentStoreSettings updated if storeSettings changes from server
  React.useEffect(() => {
    setCurrentStoreSettings(storeSettings);
  }, [storeSettings]);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Stock batch
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<string>(products[0]?.id || '');
  const [batchQuantity, setBatchQuantity] = useState<number>(20);

  // Status mapping
  const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pedido Realizado', color: 'bg-amber-100 text-amber-800' },
    { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Na Cozinha (Preparando)', color: 'bg-orange-100 text-orange-800' },
    { value: 'ready', label: 'Pronto para Envio', color: 'bg-purple-100 text-purple-800' },
    { value: 'out_for_delivery', label: 'Saiu para Entrega', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'delivered', label: 'Entregue', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-rose-100 text-rose-800' }
  ];

  // Dynamic Real Revenue calculation
  const totalSalesCalculated = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const totalSalesToday = isRevenueReset ? 0.00 : totalSalesCalculated;

  const pixSales = isRevenueReset
    ? 0.00
    : orders
        .filter(o => o.paymentMethod === 'pix' && o.status !== 'cancelled')
        .reduce((acc, o) => acc + o.total, 0);

  const creditSales = isRevenueReset
    ? 0.00
    : orders
        .filter(o => o.paymentMethod === 'credit' && o.status !== 'cancelled')
        .reduce((acc, o) => acc + o.total, 0);

  const debitAndCashSales = isRevenueReset
    ? 0.00
    : orders
        .filter(o => (o.paymentMethod === 'debit' || o.paymentMethod === 'cash') && o.status !== 'cancelled')
        .reduce((acc, o) => acc + o.total, 0);

  const paidOrdersCount = isRevenueReset
    ? 0
    : orders.filter(o => o.status !== 'cancelled').length;

  const averageTicket = paidOrdersCount > 0 ? totalSalesToday / paidOrdersCount : 0.00;
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

  // Handle Pix QR Code Image Upload from Admin Device
  const handlePixQrCodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCurrentStoreSettings(prev => ({
            ...prev,
            pixQrCodeUrl: reader.result as string
          }));
          showToast('Imagem do QR Code Pix carregada com sucesso! Clique em "Salvar Configurações".');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      showToast('Por favor informe o nome do doce.');
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
    showToast(`"${created.name}" adicionado ao cardápio com sucesso!`);
  };

  // Open Edit Product Modal with current values
  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductCategory(product.categoryId);
    setEditProductPrice(product.price);
    setEditProductShortDesc(product.shortDescription || '');
    setEditProductFullDesc(product.description || '');
    setEditProductUnitLabel(product.unitLabel || 'Unidade 130g');
    setEditProductBadge(product.badgeTag || '');
    setEditProductImage(product.imageUrl || '');
    setEditProductStock(product.stockAvailable ?? 20);
    setEditProductIsAvailable(product.isAvailable !== false);
    setIsEditProductModalOpen(true);
  };

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditProductImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEditedProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProductName.trim()) {
      showToast('Por favor informe o nome do doce.');
      return;
    }

    const updated: Product = {
      ...editingProduct,
      name: editProductName.trim(),
      categoryId: editProductCategory,
      price: editProductPrice,
      shortDescription: editProductShortDesc,
      description: editProductFullDesc || editProductShortDesc,
      unitLabel: editProductUnitLabel,
      badgeTag: editProductBadge.trim() ? editProductBadge.trim() : undefined,
      imageUrl: editProductImage || editingProduct.imageUrl,
      stockAvailable: editProductStock,
      isAvailable: editProductIsAvailable
    };

    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    setIsEditProductModalOpen(false);
    setEditingProduct(null);
    showToast(`"${updated.name}" foi atualizado e sincronizado em tempo real!`);
  };

  const handleCreateAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonName.trim()) {
      showToast('Informe o nome do adicional.');
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
    showToast(`Opcional "${created.name}" adicionado com sucesso!`);
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
    showToast(`Categoria "${created.name}" criada com sucesso!`);
  };

  // WhatsApp generator based on status
  const openWhatsAppModal = (order: Order) => {
    setSelectedOrderForWhatsApp(order);
    let msg = '';
    const clientFirstName = order.customerName.split(' ')[0];

    switch (order.status) {
      case 'pending':
        msg = `Olá ${clientFirstName}! 🍪 Seu pedido #${order.orderNumber} da Felicitá Doces foi realizado com sucesso e já está registrado na loja! Em instantes daremos início ao preparo.`;
        break;
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

  const openCourierEditModal = (order: Order) => {
    setSelectedOrderForCourierEdit(order);
    setEditingCourierName(order.courier?.name || 'Mateus Siqueira');
    setEditingCourierPhone(order.courier?.phone || '(11) 98765-4321');
    setCourierEditModalOpen(true);
  };

  const handleSaveCourierFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForCourierEdit) return;
    if (onUpdateOrderCourier) {
      onUpdateOrderCourier(selectedOrderForCourierEdit.id, editingCourierName, editingCourierPhone);
    }
    showToast(`Telefone do entregador atualizado para: ${editingCourierPhone}`);
    setCourierEditModalOpen(false);
  };

  const handleSaveCourierFromComanda = () => {
    if (!selectedOrderForComanda) return;
    if (onUpdateOrderCourier) {
      onUpdateOrderCourier(selectedOrderForComanda.id, courierNameInput, courierPhoneInput);
    }
    setSelectedOrderForComanda(prev => prev ? {
      ...prev,
      courier: {
        ...prev.courier,
        name: courierNameInput,
        phone: courierPhoneInput,
        avatarUrl: prev.courier?.avatarUrl || '',
        rating: prev.courier?.rating || 4.9,
        deliveriesCount: prev.courier?.deliveriesCount || 100
      }
    } : null);
    showToast(`Telefone do entregador salvo no pedido: ${courierPhoneInput}`);
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
      ? `✅ *JÁ PAGO ONLINE (PIX)* — *NÃO COBRAR NADA DO CLIENTE!*`
      : (order.paymentMethod === 'credit' || order.paymentMethod === 'debit')
      ? `⚠️ *COBRAR NA ENTREGA VIA MAQUININHA FÍSICA:* R$ ${order.total.toFixed(2).replace('.', ',')} (${order.paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Cartão de Débito'})`
      : `⚠️ *COBRAR DO CLIENTE NA ENTREGA (DINHEIRO):* R$ ${order.total.toFixed(2).replace('.', ',')}`;

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

  // In-App Deletion handlers (Reliable, no browser alert/confirm dependency)
  const requestDelete = (
    itemType: 'product' | 'addon' | 'category' | 'customer' | 'stock_zero' | 'stock_delete' | 'order' | 'all_orders' | 'reset_revenue',
    itemId: string,
    itemName: string
  ) => {
    let title = 'Confirmar Exclusão';
    let message = '';

    if (itemType === 'product') {
      title = 'Excluir Doce do Cardápio';
      message = `Tem certeza que deseja excluir "${itemName}" do cardápio? Ele deixará de ser comercializado e exibido no cardápio.`;
    } else if (itemType === 'addon') {
      title = 'Excluir Item de Personalização';
      message = `Tem certeza que deseja excluir o opcional "${itemName}"? Os clientes não poderão mais adicioná-lo.`;
    } else if (itemType === 'category') {
      title = 'Excluir Categoria';
      message = `Tem certeza que deseja excluir a categoria "${itemName}"?`;
    } else if (itemType === 'customer') {
      title = 'Excluir Cadastro do Cliente';
      message = `Tem certeza que deseja excluir o cliente "${itemName}" da lista?`;
    } else if (itemType === 'stock_zero') {
      title = 'Zerar Saldo em Estoque';
      message = `Deseja realmente zerar o estoque de "${itemName}"? O saldo disponível ficará em 0 unidades.`;
    } else if (itemType === 'stock_delete') {
      title = 'Excluir Item do Estoque';
      message = `Tem certeza que deseja excluir definitivamente "${itemName}" do estoque e do catálogo?`;
    } else if (itemType === 'order') {
      title = 'Excluir Pedido';
      message = `Tem certeza que deseja excluir o Pedido ${itemName}? Esta ação removerá o pedido permanentemente do painel e do histórico.`;
    } else if (itemType === 'all_orders') {
      title = 'Excluir Todos os Pedidos';
      message = 'Atenção: Tem certeza que deseja excluir TODOS os pedidos registrados no sistema? Esta ação é definitiva e esvaziará a lista de pedidos.';
    } else if (itemType === 'reset_revenue') {
      title = 'Zerar Faturamento da Loja';
      message = 'Tem certeza que deseja zerar o faturamento registrado? O total acumulado de vendas será reiniciado para R$ 0,00.';
    }

    setDeleteModalState({
      isOpen: true,
      title,
      message,
      itemType,
      itemId,
      itemName
    });
  };

  const handleConfirmDelete = () => {
    const { itemType, itemId, itemName } = deleteModalState;
    if (itemType === 'product' || itemType === 'stock_delete') {
      onDeleteProduct(itemId);
      showToast(`"${itemName}" foi excluído com sucesso!`);
    } else if (itemType === 'addon') {
      onDeleteAddon(itemId);
      showToast(`Opcional "${itemName}" foi excluído com sucesso!`);
    } else if (itemType === 'category') {
      onDeleteCategory(itemId);
      showToast(`Categoria "${itemName}" foi excluída com sucesso!`);
    } else if (itemType === 'customer') {
      if (onDeleteCustomer) {
        onDeleteCustomer(itemId);
        showToast(`Cliente "${itemName}" foi excluído com sucesso!`);
      }
    } else if (itemType === 'stock_zero') {
      if (onSetProductStock) {
        onSetProductStock(itemId, 0);
      } else {
        const prod = products.find(p => p.id === itemId);
        if (prod) onAddStockBatch(itemId, -(prod.stockAvailable || 0));
      }
      showToast(`Estoque de "${itemName}" foi zerado com sucesso!`);
    } else if (itemType === 'order') {
      if (onDeleteOrder) {
        onDeleteOrder(itemId);
        showToast(`Pedido ${itemName} foi excluído com sucesso!`);
      }
    } else if (itemType === 'all_orders') {
      if (onClearAllOrders) {
        onClearAllOrders();
        showToast('Todos os pedidos foram excluídos com sucesso!');
      }
    } else if (itemType === 'reset_revenue') {
      if (onResetRevenue) {
        onResetRevenue();
        showToast('Faturamento zerado com sucesso! Saldo reiniciado para R$ 0,00.');
      }
    }

    setDeleteModalState(prev => ({ ...prev, isOpen: false }));
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
            <span className="text-xs text-[#7f5347] font-bold uppercase tracking-wider">Faturamento</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1d1b19]">
              R$ {totalSalesToday.toFixed(2).replace('.', ',')}
            </div>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#dac0c3]/20">
              <span className="text-[11px] text-[#554245]">
                {isRevenueReset ? 'Saldo zerado (R$ 0,00)' : `${paidOrdersCount} pedidos faturados`}
              </span>
              {isRevenueReset && onRestoreRevenue ? (
                <button
                  type="button"
                  onClick={onRestoreRevenue}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Restaurar faturamento original baseado nos pedidos"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-600" />
                  <span>Restaurar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => requestDelete('reset_revenue', 'revenue', 'Faturamento')}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Zerar faturamento da loja"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Zerar</span>
                </button>
              )}
            </div>
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
                Altere status, envie avisos no WhatsApp, imprima comandas e gerencie os pedidos recebidos.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => requestDelete('all_orders', 'all', 'todos os pedidos')}
                  className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Excluir todos os pedidos registrados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Excluir Todos os Pedidos</span>
                </button>
              )}
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 w-fit">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Notificações WhatsApp Ativas
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#f8f3ee] border border-dashed border-[#dac0c3] text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#1d1b19]">Nenhum pedido registrado no momento</p>
                <p className="text-xs text-[#7f5347] max-w-sm">
                  Todos os pedidos foram excluídos ou ainda não foram realizados novos pedidos.
                </p>
              </div>
            ) : (
              orders.map(orderItem => (
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
                        <span className="text-[11px] bg-white px-2.5 py-0.5 rounded-full border border-[#dac0c3]/40 font-semibold text-[#1d1b19]">
                          {orderItem.paymentMethod === 'pix'
                            ? 'PIX (Online Pago)'
                            : orderItem.paymentMethod === 'credit'
                            ? 'Crédito (Maquininha na Entrega)'
                            : orderItem.paymentMethod === 'debit'
                            ? 'Débito (Maquininha na Entrega)'
                            : 'Dinheiro na Entrega'}
                        </span>
                      </div>

                      {/* Entregador designado e Telefone editável */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#dac0c3]/20 flex-wrap text-xs">
                        <span className="text-[11px] font-bold text-[#7f5347] flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5 text-[#9c3e54]" />
                          Entregador:
                        </span>
                        <strong className="text-[#1d1b19]">
                          {orderItem.courier?.name || 'Mateus Siqueira'}
                        </strong>
                        <span className="text-[#554245] flex items-center gap-1">
                          • WhatsApp/Tel: <strong>{orderItem.courier?.phone || '(11) 98765-4321'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => openCourierEditModal(orderItem)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#ffd9de]/50 border border-[#dac0c3]/50 text-[11px] font-bold text-[#9c3e54] transition-all cursor-pointer shadow-xs ml-auto"
                          title="Editar nome e telefone do entregador deste pedido"
                        >
                          <Phone className="w-3 h-3 text-[#9c3e54]" />
                          <span>Editar Telefone</span>
                        </button>
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

                    {/* Excluir Pedido Button */}
                    <div className="flex flex-col">
                      <label className="text-[10px] text-rose-700 uppercase font-bold mb-1">
                        Ação:
                      </label>
                      <button
                        type="button"
                        onClick={() => requestDelete('order', orderItem.id, `#${orderItem.orderNumber}`)}
                        className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        title="Excluir este pedido definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(product)}
                      className="p-1.5 rounded-lg text-[#9c3e54] hover:bg-[#ffd9de]/50 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                      title="Editar doce do cardápio"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete('product', product.id, product.name)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                      title="Excluir doce do cardápio"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
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
                    type="button"
                    onClick={() => requestDelete('addon', addon.id, addon.name)}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-bold cursor-pointer transition-colors p-1 rounded-lg hover:bg-rose-50"
                    title="Excluir item de personalização"
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
                  <div className="w-10 h-10 rounded-xl bg-[#ffd9de]/30 flex items-center justify-center text-[#9c3e54] font-bold shadow-sm">
                    <CategoryIcon iconName={cat.iconName} categoryId={cat.id} className="w-5 h-5 text-[#9c3e54]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1d1b19] font-heading">{cat.name}</span>
                    <span className="text-xs text-[#877274]">ID: {cat.id} • {cat.count} doces</span>
                  </div>
                </div>

                {cat.id !== 'all' && (
                  <button
                    type="button"
                    onClick={() => requestDelete('category', cat.id, cat.name)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
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
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://wa.me/${cleanPhoneForWhatsApp(cust.phone)}?text=${encodeURIComponent(`Olá ${cust.name}! Somos da Felicitá Doces e Cookies. Como podemos adoçar seu dia hoje?`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-[11px] transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => requestDelete('customer', cust.id, cust.name)}
                          className="inline-flex items-center gap-1 p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir cadastro do cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

            {/* SEÇÃO DEDICADA: DADOS DO PIX & IMAGEM DO QR CODE */}
            <div className="sm:col-span-2 mt-4 p-5 rounded-2xl bg-[#ffd9de]/20 border border-[#dac0c3]/50 flex flex-col gap-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#dac0c3]/30">
                <div className="w-8 h-8 rounded-full bg-[#9c3e54] text-white flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1d1b19] font-heading">
                    Chave PIX Oficial & Imagem do QR Code
                  </h3>
                  <p className="text-[11px] text-[#554245]">
                    Configure sua chave e envie a imagem do QR Code para os clientes escanearem no checkout.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Chave PIX Oficial</label>
                  <input
                    type="text"
                    required
                    value={currentStoreSettings.pixKey}
                    onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, pixKey: e.target.value })}
                    placeholder="Ex: 12.345.678/0001-99 ou pix@suaempresa.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#dac0c3]/50 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] font-mono text-xs font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Tipo da Chave</label>
                  <select
                    value={currentStoreSettings.pixKeyType || 'CNPJ'}
                    onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, pixKeyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#dac0c3]/50 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] text-xs font-semibold cursor-pointer"
                  >
                    <option value="CNPJ">CNPJ</option>
                    <option value="CPF">CPF</option>
                    <option value="Telefone/Celular">Telefone / Celular</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Chave Aleatória">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Nome do Titular / Beneficiário da Conta</label>
                  <input
                    type="text"
                    value={currentStoreSettings.pixBeneficiaryName || ''}
                    onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, pixBeneficiaryName: e.target.value })}
                    placeholder="Ex: Dolce Felicitá Confeitaria Ltda"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#dac0c3]/50 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Desconto no Pagamento via PIX (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={currentStoreSettings.pixDiscountPercent ?? 5}
                    onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, pixDiscountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#dac0c3]/50 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] text-xs"
                  />
                </div>
              </div>

              {/* UPLOAD & PRÉ-VISUALIZAÇÃO DA IMAGEM DO QR CODE */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#dac0c3]/30">
                <label className="font-bold text-[#1d1b19] flex items-center gap-1.5">
                  <span>Imagem do QR Code PIX (Exibida para o Cliente no Checkout):</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-[#dac0c3]/40">
                  {currentStoreSettings.pixQrCodeUrl ? (
                    <div className="relative w-36 h-36 bg-white rounded-xl border-2 border-[#9c3e54]/30 p-2 shadow-xs shrink-0 flex items-center justify-center group">
                      <img
                        src={currentStoreSettings.pixQrCodeUrl}
                        alt="QR Code Pix"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setCurrentStoreSettings({ ...currentStoreSettings, pixQrCodeUrl: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                        title="Remover imagem do QR Code"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => pixFileInputRef.current?.click()}
                      className="w-36 h-36 rounded-xl border-2 border-dashed border-[#dac0c3] bg-[#f8f3ee] flex flex-col items-center justify-center text-[#877274] hover:border-[#9c3e54] cursor-pointer shrink-0 transition-colors p-3 text-center"
                    >
                      <Upload className="w-6 h-6 text-[#9c3e54] mb-1" />
                      <span className="text-[10px] font-bold text-[#1d1b19]">Enviar QR Code</span>
                      <span className="text-[9px] text-[#7f5347] mt-0.5">PNG, JPG ou WEBP</span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1 gap-2 w-full">
                    <input
                      type="file"
                      ref={pixFileInputRef}
                      accept="image/*"
                      onChange={handlePixQrCodeFileChange}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => pixFileInputRef.current?.click()}
                        className="px-4 py-2 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{currentStoreSettings.pixQrCodeUrl ? 'Substituir Imagem do QR Code' : 'Selecionar Imagem do QR Code'}</span>
                      </button>

                      {currentStoreSettings.pixQrCodeUrl && (
                        <button
                          type="button"
                          onClick={() => setCurrentStoreSettings({ ...currentStoreSettings, pixQrCodeUrl: '' })}
                          className="px-3 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer border border-rose-200"
                        >
                          Remover Imagem
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[10px] text-[#7f5347] font-semibold">
                        Ou cole diretamente uma URL da imagem do QR Code:
                      </span>
                      <input
                        type="url"
                        value={currentStoreSettings.pixQrCodeUrl || ''}
                        onChange={e => setCurrentStoreSettings({ ...currentStoreSettings, pixQrCodeUrl: e.target.value })}
                        placeholder="https://exemplo.com/qrcode.png"
                        className="w-full px-3 py-1.5 rounded-xl bg-[#f8f3ee] text-xs border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
                              type="button"
                              onClick={() => requestDelete('stock_zero', product.id, product.name)}
                              className="px-2 py-1 rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold text-[11px] border border-amber-200 transition-colors cursor-pointer"
                              title="Zerar quantidade em estoque"
                            >
                              Zerar
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete('stock_delete', product.id, product.name)}
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
                showToast(`Fornada de +${batchQuantity} unidades registrada com sucesso!`);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1d1b19] font-heading">
                Relatório Financeiro & Métodos de Pagamento
              </h2>
              <p className="text-xs text-[#554245]">
                Diferenciação clara entre valores faturados e recebidos instantaneamente (PIX / Cartões / Dinheiro).
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isRevenueReset && onRestoreRevenue && (
                <button
                  type="button"
                  onClick={onRestoreRevenue}
                  className="px-3.5 py-2 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Restaurar faturamento original baseado nos pedidos atuais"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Restaurar Vendas</span>
                </button>
              )}
              {onResetRevenue && (
                <button
                  type="button"
                  onClick={() => requestDelete('reset_revenue', 'revenue', 'Faturamento da Loja')}
                  className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Zerar o faturamento da loja para R$ 0,00"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Zerar Faturamento (R$ 0,00)</span>
                </button>
              )}
            </div>
          </div>

          {isRevenueReset && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>O faturamento da loja foi zerado manualmente para R$ 0,00 pelo administrador. Você pode restaurar o valor calculado a qualquer momento.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#ffd9de]/30 border border-[#dac0c3]/40">
              <span className="text-[10px] uppercase font-bold text-[#7f5347]">Faturamento Total</span>
              <div className="text-2xl font-bold text-[#9c3e54] mt-1">
                R$ {totalSalesToday.toFixed(2).replace('.', ',')}
              </div>
              <span className="text-[11px] text-[#554245]">
                {paidOrdersCount} {paidOrdersCount === 1 ? 'pedido faturado' : 'pedidos faturados'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
              <span className="text-[10px] uppercase font-bold text-[#7f5347]">Ticket Médio</span>
              <div className="text-2xl font-bold text-[#1d1b19] mt-1">
                R$ {averageTicket.toFixed(2).replace('.', ',')}
              </div>
              <span className="text-[11px] text-[#7f5347]">Por pedido concluído</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
              <span className="text-[10px] uppercase font-bold text-[#7f5347]">PIX Instantâneo</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                R$ {pixSales.toFixed(2).replace('.', ',')}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">100% Liquidado em conta</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
              <span className="text-[10px] uppercase font-bold text-[#7f5347]">Cartão Crédito / Débito / Dinheiro</span>
              <div className="text-2xl font-bold text-[#1d1b19] mt-1">
                R$ {(creditSales + debitAndCashSales).toFixed(2).replace('.', ',')}
              </div>
              <span className="text-[11px] text-[#554245]">Maquininha física / entrega</span>
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
          MODAL 2.5: EDIÇÃO DE DOCE DO CARDÁPIO (SINCRONIZAÇÃO EM TEMPO REAL)
         ========================================================================= */}
      {isEditProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4 relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditProductModalOpen(false)}
              className="absolute top-4 right-4 text-[#877274] hover:text-[#1d1b19] p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                Atualização em Tempo Real
              </span>
              <h3 className="text-xl font-bold text-[#1d1b19] font-heading mt-0.5">
                Editar Doce do Cardápio
              </h3>
              <p className="text-xs text-[#554245]">
                As alterações feitas aqui refletem instantaneamente no cardápio de todos os clientes sem necessidade de recarregar a página.
              </p>
            </div>

            <form onSubmit={handleSaveEditedProduct} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Nome do Doce</label>
                  <input
                    type="text"
                    required
                    value={editProductName}
                    onChange={e => setEditProductName(e.target.value)}
                    placeholder="Ex: Cookie Tortinha de Nutella"
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Categoria</label>
                  <select
                    value={editProductCategory}
                    onChange={e => setEditProductCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
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
                    value={editProductPrice}
                    onChange={e => setEditProductPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Gramatura / Unidade</label>
                  <input
                    type="text"
                    value={editProductUnitLabel}
                    onChange={e => setEditProductUnitLabel(e.target.value)}
                    placeholder="Ex: Unidade 130g"
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Estoque Atual (un)</label>
                  <input
                    type="number"
                    min="0"
                    value={editProductStock}
                    onChange={e => setEditProductStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Tag em Destaque</label>
                  <select
                    value={editProductBadge}
                    onChange={e => setEditProductBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  >
                    <option value="">Nenhuma</option>
                    <option value="Mais Amado">Mais Amado</option>
                    <option value="Fornada do Dia">Fornada do Dia</option>
                    <option value="Mais Pedido">Mais Pedido</option>
                    <option value="Edição Limitada">Edição Limitada</option>
                    <option value="Novo">Novo</option>
                    <option value="Cacau 70%">Cacau 70%</option>
                    <option value="Sem Glúten">Sem Glúten</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#1d1b19]">Disponibilidade no Cardápio</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="editAvailability"
                        checked={editProductIsAvailable}
                        onChange={() => setEditProductIsAvailable(true)}
                        className="text-[#9c3e54] focus:ring-[#9c3e54]"
                      />
                      <span className="font-medium text-[#1d1b19]">Disponível</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="editAvailability"
                        checked={!editProductIsAvailable}
                        onChange={() => setEditProductIsAvailable(false)}
                        className="text-[#9c3e54] focus:ring-[#9c3e54]"
                      />
                      <span className="font-medium text-rose-600">Pausado (Esgotado)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Descrição Curta</label>
                <input
                  type="text"
                  value={editProductShortDesc}
                  onChange={e => setEditProductShortDesc(e.target.value)}
                  placeholder="Ex: Massa crocante e centro recheado de caramelo"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#1d1b19]">Descrição Completa (Ingredientes e Detalhes)</label>
                <textarea
                  rows={2}
                  value={editProductFullDesc}
                  onChange={e => setEditProductFullDesc(e.target.value)}
                  placeholder="Detalhes dos ingredientes nobres, procedência do cacau, etc."
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>

              {/* FOTO DIRETO DO DISPOSITIVO */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/30">
                <label className="font-bold text-[#1d1b19] flex items-center justify-between">
                  <span>Foto do Doce</span>
                  <span className="text-[10px] text-[#7f5347] uppercase font-bold">Upload / Trocar Imagem</span>
                </label>

                <div className="flex items-center gap-4">
                  {editProductImage ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#dac0c3]/50 shrink-0">
                      <img src={editProductImage} alt="Prévia" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditProductImage('')}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                        title="Remover imagem"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-[#dac0c3] bg-white flex flex-col items-center justify-center text-[#877274] hover:border-[#9c3e54] cursor-pointer shrink-0 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-[#9c3e54]" />
                      <span className="text-[9px] mt-1 font-bold">Enviar foto</span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/*"
                      onChange={handleEditImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-white hover:bg-[#ece7e2] text-xs font-bold text-[#1d1b19] border border-[#dac0c3] flex items-center gap-1.5 w-fit cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#9c3e54]" />
                      <span>{editProductImage ? 'Substituir Foto Atual' : 'Escolher Imagem do Dispositivo'}</span>
                    </button>
                    <span className="text-[10px] text-[#877274] mt-1">
                      Aceita JPG, PNG ou WEBP em alta resolução.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f2ede8]">
                <button
                  type="button"
                  onClick={() => setIsEditProductModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#f2ede8] text-xs font-semibold text-[#554245] hover:bg-[#ece7e2] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b] shadow-sm cursor-pointer"
                >
                  Salvar Alterações
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

      {/* =========================================================================
          MODAL 5: COMANDA DO ENTREGADOR (IMPRESSÃO TÉRMICA & ENVIO WHATSAPP)
         ========================================================================= */}
      {comandaModalOpen && selectedOrderForComanda && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col my-auto max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Top Bar (hidden during print) */}
            <div className="p-4 sm:p-5 border-b border-[#f2ede8] flex items-center justify-between bg-[#fcf9f6] no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5 text-[#9c3e54]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1d1b19] font-heading flex items-center gap-2">
                    <span>Comanda de Entrega para o Entregador</span>
                    <span className="text-xs bg-[#9c3e54] text-white px-2.5 py-0.5 rounded-full font-bold">
                      #{selectedOrderForComanda.orderNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-[#554245]">
                    Imprima para fixar na embalagem ou envie todos os dados prontos no WhatsApp do motoboy.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComandaModalOpen(false)}
                className="text-[#877274] hover:text-[#1d1b19] p-1.5 rounded-full hover:bg-white cursor-pointer transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Courier configuration bar (no-print) */}
            <div className="p-4 bg-[#f8f3ee] border-b border-[#dac0c3]/30 flex flex-col sm:flex-row items-end gap-3 text-xs no-print">
              <div className="flex-1 w-full flex flex-col gap-1">
                <label className="font-bold text-[#7f5347] uppercase text-[10px]">
                  Nome do Entregador (Motoboy):
                </label>
                <input
                  type="text"
                  value={courierNameInput}
                  onChange={e => setCourierNameInput(e.target.value)}
                  placeholder="Nome do motoboy"
                  className="w-full px-3 py-1.5 rounded-xl bg-white text-xs border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>
              <div className="flex-1 w-full flex flex-col gap-1">
                <label className="font-bold text-[#7f5347] uppercase text-[10px]">
                  WhatsApp / Telefone do Entregador:
                </label>
                <input
                  type="text"
                  value={courierPhoneInput}
                  onChange={e => setCourierPhoneInput(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-1.5 rounded-xl bg-white text-xs border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveCourierFromComanda}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                title="Salvar alterações de nome e telefone do entregador no pedido"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Telefone</span>
              </button>
            </div>

            {/* Scrollable Ticket Area & Printable View */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">
              {/* THE COMANDA TICKET */}
              <div className="printable-comanda-container max-w-lg mx-auto bg-white border-2 border-dashed border-[#dac0c3] p-5 sm:p-6 rounded-2xl font-mono text-xs text-[#1d1b19] shadow-sm">
                {/* Bakery Branding Header */}
                <div className="text-center pb-3 border-b-2 border-dashed border-gray-300">
                  <h4 className="text-base font-black tracking-wider uppercase font-sans text-[#311309]">
                    DOLCE FELICITÁ DOCES E COOKIES
                  </h4>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Confeitaria Artesanal • CNPJ: {storeSettings.cnpj || '45.892.102/0001-44'}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {storeSettings.address} • Tel: {storeSettings.phone}
                  </p>
                  <div className="mt-2 py-1 px-3 bg-[#f2ede8] rounded-md font-bold text-xs inline-block">
                    ★ COMANDA DO ENTREGADOR / DELIVERY SLIP ★
                  </div>
                </div>

                {/* Order & Courier Meta */}
                <div className="py-3 border-b border-dashed border-gray-300 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Pedido:</span>
                    <strong className="text-sm font-black text-[#9c3e54]">#{selectedOrderForComanda.orderNumber}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Data / Horário:</span>
                    <span className="font-semibold">{selectedOrderForComanda.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Entregador Designado:</span>
                    <strong className="font-bold text-gray-900">{courierNameInput}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Contato Motoboy:</span>
                    <span className="font-semibold">{courierPhoneInput}</span>
                  </div>
                </div>

                {/* Customer & Destination Info */}
                <div className="py-3 border-b border-dashed border-gray-300 flex flex-col gap-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[9px] uppercase font-bold">Dados do Cliente:</span>
                    <span className="font-bold text-gray-800">{selectedOrderForComanda.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-[9px] uppercase font-bold">Telefone do Cliente:</span>
                    <span className="font-bold text-[#9c3e54]">{selectedOrderForComanda.customerPhone || '(11) 98765-4321'}</span>
                  </div>
                  <div className="mt-2 p-2.5 bg-[#f8f3ee] rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold uppercase text-gray-700 block mb-1">
                      📍 Endereço de Entrega:
                    </span>
                    <p className="text-xs font-black text-gray-900 leading-tight">
                      {selectedOrderForComanda.address.street}, {selectedOrderForComanda.address.number}
                      {selectedOrderForComanda.address.complement ? ` - ${selectedOrderForComanda.address.complement}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-700 mt-0.5">
                      Bairro: {selectedOrderForComanda.address.neighborhood} • {selectedOrderForComanda.address.city}/{selectedOrderForComanda.address.state}
                    </p>
                    <p className="text-[10px] text-gray-600">CEP: {selectedOrderForComanda.address.postalCode}</p>
                    {selectedOrderForComanda.address.referencePoint && (
                      <p className="text-[11px] text-amber-900 font-bold mt-1 bg-amber-50 p-1 rounded border border-amber-200">
                        🚩 Ponto de Referência: {selectedOrderForComanda.address.referencePoint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items to verify by courier */}
                <div className="py-3 border-b border-dashed border-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-700">
                      Itens do Pacote (Conferência):
                    </span>
                    <span className="text-[9px] text-gray-500">Conferido [ ✓ ]</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedOrderForComanda.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 text-[11px]">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded border border-gray-400 shrink-0 inline-block mt-0.5"></span>
                          <div>
                            <span className="font-bold text-gray-900">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-500 text-[10px] block">
                              {item.unitLabel}
                            </span>
                            {item.addons && item.addons.length > 0 && (
                              <span className="text-[10px] text-[#9c3e54] block">
                                + {item.addons.map(a => a.name).join(', ')}
                              </span>
                            )}
                            {item.notes && (
                              <span className="text-[10px] text-gray-600 italic block">
                                Obs: {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-gray-800 shrink-0">
                          R$ {item.itemTotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedOrderForComanda.notes && (
                    <div className="mt-2.5 p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-[10px] text-yellow-900 font-sans">
                      <strong>Observações do Pedido:</strong> {selectedOrderForComanda.notes}
                    </div>
                  )}
                </div>

                {/* Financial Summary & Payment Box */}
                <div className="py-3 border-b-2 border-dashed border-gray-300">
                  <div className="flex justify-between text-[11px] text-gray-700">
                    <span>Subtotal:</span>
                    <span>R$ {selectedOrderForComanda.subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-700 mt-0.5">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {selectedOrderForComanda.deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {selectedOrderForComanda.discount > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-700 mt-0.5">
                      <span>Desconto Especial:</span>
                      <span>- R$ {selectedOrderForComanda.discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-900 mt-1 pt-1 border-t border-gray-200">
                    <span>VALOR TOTAL DO PEDIDO:</span>
                    <span className="text-[#9c3e54]">
                      R$ {selectedOrderForComanda.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {/* Payment instruction for courier */}
                  <div className="mt-3 p-3 rounded-xl border-2 text-center text-xs font-bold leading-tight font-sans">
                    {selectedOrderForComanda.paymentStatus === 'approved' ? (
                      <div className="bg-emerald-50 border-emerald-400 text-emerald-900 p-2 rounded-lg">
                        <span className="block text-sm font-black uppercase text-emerald-700">
                          ✅ PEDIDO JÁ PAGO ONLINE (PIX)
                        </span>
                        <span className="text-[11px] block mt-0.5">
                          NÃO COBRAR NADA DO CLIENTE. APENAS ENTREGAR O PACOTE COM AFETO!
                        </span>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border-amber-400 text-amber-900 p-2.5 rounded-lg">
                        <span className="block text-sm font-black uppercase text-amber-800">
                          ⚠️ COBRAR NA ENTREGA: R$ {selectedOrderForComanda.total.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[11px] block mt-1 font-bold text-amber-900">
                          {selectedOrderForComanda.paymentMethod === 'credit'
                            ? '👉 LEVAR MAQUININHA FÍSICA • CARTÃO DE CRÉDITO'
                            : selectedOrderForComanda.paymentMethod === 'debit'
                            ? '👉 LEVAR MAQUININHA FÍSICA • CARTÃO DE DÉBITO'
                            : '👉 COBRANÇA EM DINHEIRO FÍSICO'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature / Receipt Slip */}
                <div className="pt-3 text-[10px] text-gray-500 flex flex-col gap-2">
                  <div className="flex justify-between items-center pt-2">
                    <span>Assinatura do Recebedor: ________________________</span>
                    <span>Hora: ____:____</span>
                  </div>
                  <p className="text-center text-[9px] text-gray-400 mt-1 font-sans">
                    Obrigado pela preferência! Confeitaria Artesanal Dolce Felicitá.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar (no-print) */}
            <div className="p-4 sm:p-5 border-t border-[#f2ede8] bg-[#fcf9f6] flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyCourierComanda}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-xs font-bold text-[#554245] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar texto formatado para área de transferência"
                >
                  {comandaCopiedFeedback ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{comandaCopiedFeedback ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedOrderForComanda.address.street}, ${selectedOrderForComanda.address.number}, ${selectedOrderForComanda.address.neighborhood}, ${selectedOrderForComanda.address.city}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Ver no Maps</span>
                </a>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendCourierWhatsApp}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  title="Enviar mensagem comanda para o WhatsApp do entregador"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar p/ WhatsApp do Entregador</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintComanda}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  title="Imprimir comanda térmica para o entregador"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Comanda</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: IN-APP CONFIRMATION MODAL (DELEÇÃO SEGURA SEM BROWSER ALERT)
         ========================================================================= */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1d1b19] font-heading">
                  {deleteModalState.title}
                </h3>
                <p className="text-xs text-[#7f5347]">
                  Ação administrativa na confeitaria
                </p>
              </div>
            </div>

            <p className="text-xs text-[#554245] leading-relaxed bg-[#f8f3ee] p-3 rounded-xl border border-[#dac0c3]/30">
              {deleteModalState.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-xs font-bold text-[#554245] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {deleteModalState.itemType === 'reset_revenue' ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirmar e Zerar Faturamento</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar e Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 7: EDITAR TELEFONE E DADOS DO ENTREGADOR (ADMINISTRADOR)
         ========================================================================= */}
      {courierEditModalOpen && selectedOrderForCourierEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#f2ede8] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-[#9c3e54]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1b19] font-heading">
                    Editar Telefone do Entregador
                  </h3>
                  <p className="text-xs text-[#7f5347]">
                    Pedido #{selectedOrderForCourierEdit.orderNumber} • {selectedOrderForCourierEdit.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCourierEditModalOpen(false)}
                className="text-[#877274] hover:text-[#1d1b19] p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourierFromModal} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1d1b19]">Nome do Entregador (Motoboy)</label>
                <input
                  type="text"
                  value={editingCourierName}
                  onChange={e => setEditingCourierName(e.target.value)}
                  required
                  placeholder="Nome do entregador"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1d1b19]">WhatsApp / Telefone do Entregador</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-[#7f5347] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={editingCourierPhone}
                    onChange={e => setEditingCourierPhone(e.target.value)}
                    required
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>
                <p className="text-[10px] text-[#7f5347] mt-0.5">
                  Este número será usado para envio direto da comanda de entrega via WhatsApp.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f2ede8]">
                <button
                  type="button"
                  onClick={() => setCourierEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-xs font-bold text-[#554245] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Telefone do Entregador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1d1b19] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 border border-[#dac0c3]/30">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}
    </div>
  );
};
