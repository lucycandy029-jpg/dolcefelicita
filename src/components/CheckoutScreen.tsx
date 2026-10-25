import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  ArrowRight, 
  QrCode, 
  CreditCard, 
  Banknote, 
  CheckCircle, 
  Info, 
  Lock, 
  Headphones, 
  Clock, 
  Sparkles,
  Check,
  Copy
} from 'lucide-react';
import { CartItem, Address, Order, StoreSettings } from '../types';

interface CheckoutScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onNavigateToMenu: () => void;
  onConfirmOrder: (orderData: Partial<Order>) => void;
  activeAddress?: Address | null;
  onUpdateAddress: (newAddress: Address) => void;
  storeSettings?: StoreSettings;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToMenu,
  onConfirmOrder,
  activeAddress,
  onUpdateAddress,
  storeSettings
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit' | 'cash'>('pix');
  const [couponCode, setCouponCode] = useState<string>('FELICITA10');
  const [couponApplied, setCouponApplied] = useState<boolean>(true);
  const [ecoUtensils, setEcoUtensils] = useState<boolean>(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  const [cashChangeNeeded, setCashChangeNeeded] = useState<string>('');
  const [pixCopied, setPixCopied] = useState<boolean>(false);

  // Credit card form state
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');

  // New address state
  const [newCep, setNewCep] = useState<string>('');
  const [newStreet, setNewStreet] = useState<string>('');
  const [newNumber, setNewNumber] = useState<string>('');
  const [newComplement, setNewComplement] = useState<string>('');
  const [newNeighborhood, setNewNeighborhood] = useState<string>('');

  // Financial computations
  const subtotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0);
  const deliveryFee = subtotal >= 50 ? 0.00 : 7.50;
  const couponDiscount = couponApplied && subtotal > 0 ? 5.00 : 0.00;
  const pixDiscount = paymentMethod === 'pix' && subtotal > 0 ? (subtotal - couponDiscount) * 0.05 : 0.00;
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount - pixDiscount);
  const totalSavings = couponDiscount + pixDiscount;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'FELICITA10') {
      setCouponApplied(true);
    } else {
      alert('Cupom inválido. Tente usar FELICITA10 para R$ 5,00 OFF!');
    }
  };

  const handleSaveAddress = () => {
    if (!newStreet || !newNumber) {
      alert('Por favor preencha rua e número.');
      return;
    }
    const updated: Address = {
      id: 'addr-' + Date.now(),
      title: 'Endereço Alternativo',
      postalCode: newCep || '01310-100',
      street: newStreet,
      number: newNumber,
      complement: newComplement,
      neighborhood: newNeighborhood || 'Centro',
      city: 'São Paulo',
      state: 'SP',
      isDefault: true
    };
    onUpdateAddress(updated);
    setShowNewAddressForm(false);
  };

  const handleFinalize = () => {
    if (cartItems.length === 0) {
      alert('Seu carrinho está vazio! Adicione doces pelo cardápio.');
      return;
    }

    onConfirmOrder({
      items: cartItems,
      subtotal,
      deliveryFee,
      discount: totalSavings,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'pix' ? 'approved' : 'pending',
      address: activeAddress || undefined,
      includeEcoUtensils: ecoUtensils,
      notes: 'Por favor tocar o interfone 82 e deixar na portaria caso não atenda de imediato. Obrigado!'
    });
  };

  return (
    <div className="w-full pb-16">
      {/* Progress Header Banner */}
      <section className="w-full bg-[#f8f3ee] py-4 border-b border-[#dac0c3]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#9c3e54] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              1
            </span>
            <span className="text-sm font-bold text-[#1d1b19]">Carrinho & Detalhes</span>
            <span className="w-6 h-0.5 bg-[#dac0c3]"></span>
            <span className="w-8 h-8 rounded-full bg-[#e6e2dd] text-[#554245] flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span className="text-sm text-[#554245]">Confirmação & Rastreio</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#7f5347] text-[11px] tracking-wider uppercase font-bold">
            <Lock className="w-4 h-4 text-[#994703]" />
            <span>Checkout Criptografado 256-bit</span>
          </div>
        </div>
      </section>

      {/* Main Checkout Grid */}
      <section className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Cart Items, Delivery Address & Payment Methods */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* STEP 1: Carrinho de Compras */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_-2px_rgba(61,28,18,0.06)] border border-[#dac0c3]/30">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fec4b4] text-[#7a4f42] flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1d1b19] font-heading">Seu Carrinho Artesanal</h2>
                      <p className="text-xs text-[#554245]">
                        {cartItems.length} {cartItems.length === 1 ? 'delícia selecionada' : 'delícias selecionadas'} feitas hoje à mão
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#9c3e54] bg-[#ffd9de] px-3 py-1 rounded-full uppercase font-bold">
                    Preparo Imediato
                  </span>
                </div>

                {/* Items List */}
                {cartItems.length === 0 ? (
                  <div className="text-center py-10 bg-[#f8f3ee] rounded-2xl">
                    <p className="text-sm text-[#554245] mb-3">Sua sacola de doces está vazia.</p>
                    <button
                      onClick={onNavigateToMenu}
                      className="px-5 py-2 bg-[#9c3e54] text-white rounded-full text-xs font-bold hover:bg-[#64132b] transition-colors"
                    >
                      Explorar Cardápio Artesanal
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cartItems.map(item => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/20"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm"
                          />
                          <div className="flex flex-col min-w-0">
                            {item.badgeTag && (
                              <span className="text-[10px] text-[#994703] bg-[#ffdbc9] px-2 py-0.5 rounded-full uppercase font-bold w-fit mb-1">
                                {item.badgeTag}
                              </span>
                            )}
                            <h3 className="text-sm sm:text-base font-bold text-[#1d1b19] truncate font-heading">
                              {item.name}
                            </h3>
                            {item.addons && item.addons.length > 0 && (
                              <div className="text-xs text-[#7f5347] flex flex-wrap gap-1 mt-0.5">
                                {item.addons.map(a => (
                                  <span key={a.id} className="flex items-center gap-0.5">
                                    + {a.name} (R$ {a.price.toFixed(2).replace('.', ',')})
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-sm font-bold text-[#9c3e54] mt-1">
                              R$ {item.itemTotal.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          <div className="flex items-center bg-white rounded-full p-1 shadow-sm border border-[#dac0c3]/30">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#1d1b19] hover:bg-[#f2ede8] transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-[#1d1b19]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#1d1b19] hover:bg-[#f2ede8] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            title="Remover item"
                            className="w-9 h-9 rounded-full bg-white text-[#877274] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Return to menu link */}
                <div className="mt-4 pt-3 flex justify-between items-center text-xs text-[#7f5347] border-t border-[#f2ede8]">
                  <button
                    onClick={onNavigateToMenu}
                    className="text-[#9c3e54] hover:text-[#64132b] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar mais delícias ao pedido
                  </button>
                  <span className="text-[#877274]">
                    Subtotal dos doces: R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* STEP 2: Onde Vamos Entregar */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_-2px_rgba(61,28,18,0.06)] border border-[#dac0c3]/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ffdbc9] text-[#572500] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#994703]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1d1b19] font-heading">Onde Vamos Entregar?</h2>
                      <p className="text-xs text-[#554245]">Entrega rápida com embalagem térmica especial</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f2ede8] rounded-full text-[#7f5347] text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#994703]" />
                    <span>Previsão: <strong>35 - 45 min</strong></span>
                  </div>
                </div>

                {/* Active Address Card */}
                {activeAddress && activeAddress.street ? (
                  <div className="p-4 rounded-2xl bg-[#f8f3ee] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#dac0c3]/20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#ffd9de] flex items-center justify-center text-[#9c3e54] shrink-0">
                        <span className="material-symbols-outlined text-[24px]">home</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1d1b19] font-heading">{activeAddress.title || 'Endereço Principal'}</span>
                          <span className="text-[10px] bg-[#9c3e54] text-white px-2 py-0.5 rounded-full uppercase font-bold">
                            Padrão
                          </span>
                        </div>
                        <p className="text-xs text-[#1d1b19] mt-0.5">
                          {activeAddress.street}, {activeAddress.number}
                          {activeAddress.complement ? ` — ${activeAddress.complement}` : ''} — {activeAddress.neighborhood}, {activeAddress.city} - {activeAddress.state}
                        </p>
                        {activeAddress.referencePoint && (
                          <p className="text-[11px] text-[#877274] mt-0.5">
                            Ref: {activeAddress.referencePoint}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                      className="px-4 py-1.5 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-[#1d1b19] text-xs font-bold transition-colors cursor-pointer self-end md:self-auto"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#f8f3ee] border border-dashed border-[#dac0c3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ffd9de] flex items-center justify-center text-[#9c3e54] shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1d1b19]">Nenhum endereço cadastrado</p>
                        <p className="text-[11px] text-[#7f5347]">Informe onde deseja receber sua encomenda.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="px-4 py-2 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b] transition-colors shadow-sm shrink-0 cursor-pointer"
                    >
                      + Cadastrar Endereço
                    </button>
                  </div>
                )}

                {/* Collapsible New Address Form */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                    className="flex items-center gap-1.5 text-[#9c3e54] text-xs font-bold hover:text-[#64132b] transition-colors cursor-pointer"
                  >
                    <span>+ Cadastrar novo endereço de entrega</span>
                  </button>

                  {showNewAddressForm && (
                    <div className="mt-4 p-4 rounded-2xl bg-[#f2ede8] flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#554245] mb-1">CEP</label>
                          <input
                            type="text"
                            value={newCep}
                            onChange={e => setNewCep(e.target.value)}
                            placeholder="01310-100"
                            className="w-full px-3 py-2 rounded-full bg-white text-xs text-[#1d1b19] focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-[#554245] mb-1">Rua / Logradouro</label>
                          <input
                            type="text"
                            value={newStreet}
                            onChange={e => setNewStreet(e.target.value)}
                            placeholder="Ex: Rua Oscar Freire"
                            className="w-full px-3 py-2 rounded-full bg-white text-xs text-[#1d1b19] focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#554245] mb-1">Número</label>
                          <input
                            type="text"
                            value={newNumber}
                            onChange={e => setNewNumber(e.target.value)}
                            placeholder="Ex: 450"
                            className="w-full px-3 py-2 rounded-full bg-white text-xs text-[#1d1b19] focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#554245] mb-1">Complemento / Apto</label>
                          <input
                            type="text"
                            value={newComplement}
                            onChange={e => setNewComplement(e.target.value)}
                            placeholder="Ex: Ap 14"
                            className="w-full px-3 py-2 rounded-full bg-white text-xs text-[#1d1b19] focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#554245] mb-1">Bairro</label>
                          <input
                            type="text"
                            value={newNeighborhood}
                            onChange={e => setNewNeighborhood(e.target.value)}
                            placeholder="Ex: Jardins"
                            className="w-full px-3 py-2 rounded-full bg-white text-xs text-[#1d1b19] focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="px-4 py-1.5 rounded-full bg-white text-[#554245] text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveAddress}
                          className="px-5 py-1.5 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b]"
                        >
                          Salvar Endereço
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: Forma de Pagamento */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_-2px_rgba(61,28,18,0.06)] border border-[#dac0c3]/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1d1b19] font-heading">Forma de Pagamento</h2>
                    <p className="text-xs text-[#554245]">Transação 100% segura com confirmação instantânea</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Option 1: PIX */}
                  <label
                    onClick={() => setPaymentMethod('pix')}
                    className={`relative flex flex-col p-4 rounded-2xl cursor-pointer border transition-all ${
                      paymentMethod === 'pix'
                        ? 'bg-[#ffd9de]/20 border-[#9c3e54] shadow-sm'
                        : 'bg-[#f8f3ee] border-transparent hover:bg-[#f2ede8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'pix'}
                          onChange={() => setPaymentMethod('pix')}
                          className="w-4 h-4 text-[#9c3e54] accent-[#9c3e54]"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#1d1b19]">PIX Dinâmico Instantâneo</span>
                            <span className="text-[10px] bg-[#9c3e54] text-white px-2 py-0.5 rounded-full uppercase font-bold">
                              5% OFF Automático
                            </span>
                          </div>
                          <p className="text-xs text-[#554245]">Aprovação imediata e envio prioritário para a cozinha</p>
                        </div>
                      </div>
                      <QrCode className="w-6 h-6 text-[#9c3e54]" />
                    </div>

                    {paymentMethod === 'pix' && (
                      <div className="mt-4 pt-4 border-t border-[#dac0c3]/30 bg-white/95 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-[#dac0c3]/60 p-2 shadow-xs">
                          {storeSettings?.pixQrCodeUrl ? (
                            <img
                              src={storeSettings.pixQrCodeUrl}
                              alt="QR Code Pix Oficial"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          ) : (
                            <QrCode className="w-20 h-20 text-[#1d1b19]" />
                          )}
                        </div>
                        <div className="flex flex-col text-center sm:text-left gap-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#1d1b19]">
                              QR Code & Chave PIX Oficial
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              {storeSettings?.pixKeyType || 'CNPJ'}
                            </span>
                          </div>

                          {storeSettings?.pixBeneficiaryName && (
                            <span className="text-[11px] text-[#554245]">
                              Beneficiário: <strong>{storeSettings.pixBeneficiaryName}</strong>
                            </span>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-[#f8f3ee] px-3 py-1.5 rounded-xl border border-[#dac0c3]/40 text-xs font-mono font-bold text-[#1d1b19] truncate select-all">
                              {storeSettings?.pixKey || '12345678000199'}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const key = storeSettings?.pixKey || '12345678000199';
                                navigator.clipboard.writeText(key);
                                setPixCopied(true);
                                setTimeout(() => setPixCopied(false), 2500);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                              title="Copiar chave PIX"
                            >
                              {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>

                          <span className="text-xs font-bold text-[#994703] flex items-center gap-1 mt-1 justify-center sm:justify-start">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Economia de 5% (R$ {pixDiscount.toFixed(2).replace('.', ',')}) garantida via PIX!
                          </span>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Option 2: Cartão de Crédito na Maquininha Física */}
                  <label
                    onClick={() => setPaymentMethod('credit')}
                    className={`flex flex-col p-4 rounded-2xl cursor-pointer border transition-all ${
                      paymentMethod === 'credit'
                        ? 'bg-[#ffd9de]/20 border-[#9c3e54] shadow-sm'
                        : 'bg-[#f8f3ee] border-transparent hover:bg-[#f2ede8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'credit'}
                          onChange={() => setPaymentMethod('credit')}
                          className="w-4 h-4 text-[#9c3e54] accent-[#9c3e54]"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#1d1b19]">Cartão de Crédito (Maquininha no Ato da Entrega)</span>
                            <span className="text-[10px] bg-[#f2ede8] text-[#7f5347] px-2 py-0.5 rounded-full font-bold">
                              Presencial
                            </span>
                          </div>
                          <p className="text-xs text-[#554245]">O motoboy levará a maquininha física (todas as bandeiras e aproximação)</p>
                        </div>
                      </div>
                      <CreditCard className="w-6 h-6 text-[#9c3e54]" />
                    </div>

                    {paymentMethod === 'credit' && (
                      <div className="mt-3 pt-3 border-t border-[#dac0c3]/30 bg-white/80 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Pagamento seguro via maquininha física no ato da entrega</span>
                        </div>
                        <p className="text-[#554245] text-[11px] leading-relaxed">
                          Nenhum dado do seu cartão é digitado online. Você passa, insere ou aproxima seu cartão diretamente na máquina física levada pelo entregador.
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-[#7f5347]">
                          <span className="px-2 py-0.5 rounded-md bg-[#f2ede8]">Visa</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#f2ede8]">Mastercard</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#f2ede8]">Elo</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#f2ede8]">Hipercard</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#f2ede8]">Amex</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#f2ede8]">Aproximação NFC</span>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Option 3: Débito na Maquininha Física */}
                  <label
                    onClick={() => setPaymentMethod('debit')}
                    className={`flex flex-col p-4 rounded-2xl cursor-pointer border transition-all ${
                      paymentMethod === 'debit'
                        ? 'bg-[#ffd9de]/20 border-[#9c3e54] shadow-sm'
                        : 'bg-[#f8f3ee] border-transparent hover:bg-[#f2ede8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'debit'}
                          onChange={() => setPaymentMethod('debit')}
                          className="w-4 h-4 text-[#9c3e54] accent-[#9c3e54]"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#1d1b19]">Cartão de Débito (Maquininha no Ato da Entrega)</span>
                            <span className="text-[10px] bg-[#f2ede8] text-[#7f5347] px-2 py-0.5 rounded-full font-bold">
                              Presencial
                            </span>
                          </div>
                          <p className="text-xs text-[#554245]">O motoboy levará a maquininha física (débito em conta ou aproximação)</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#9c3e54] text-[24px]">contactless</span>
                    </div>

                    {paymentMethod === 'debit' && (
                      <div className="mt-3 pt-3 border-t border-[#dac0c3]/30 bg-white/80 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Pagamento seguro via maquininha física no ato da entrega</span>
                        </div>
                        <p className="text-[#554245] text-[11px] leading-relaxed">
                          Pague pelo débito ao receber sua encomenda, direto com o entregador através da maquininha sem contato.
                        </p>
                      </div>
                    )}
                  </label>

                  {/* Option 4: Dinheiro */}
                  <label
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col p-4 rounded-2xl cursor-pointer border transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-[#ffd9de]/20 border-[#9c3e54] shadow-sm'
                        : 'bg-[#f8f3ee] border-transparent hover:bg-[#f2ede8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cash'}
                          onChange={() => setPaymentMethod('cash')}
                          className="w-4 h-4 text-[#9c3e54] accent-[#9c3e54]"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1d1b19]">Dinheiro Físico na Entrega</span>
                          <p className="text-xs text-[#554245]">Pague em espécie ao receber sua encomenda</p>
                        </div>
                      </div>
                      <Banknote className="w-6 h-6 text-[#7f5347]" />
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="mt-3 pt-3 border-t border-[#dac0c3]/30 flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#7f5347]">
                          Precisa de troco para quanto?
                        </span>
                        <input
                          type="text"
                          value={cashChangeNeeded}
                          onChange={e => setCashChangeNeeded(e.target.value)}
                          placeholder="Ex: R$ 50,00 ou Não preciso de troco"
                          className="w-full px-4 py-2 rounded-full bg-white text-xs border border-[#dac0c3]/40 focus:outline-none"
                        />
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky Financial Summary & Confirmation */}
            <div className="lg:col-span-4 sticky top-28 flex flex-col gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-[0_10px_28px_-4px_rgba(61,28,18,0.08)] border border-[#dac0c3]/30">
                <h3 className="text-lg font-bold text-[#1d1b19] mb-4 flex items-center justify-between font-heading">
                  <span>Resumo do Pedido</span>
                  <span className="material-symbols-outlined text-[#9c3e54] text-[20px]">receipt_long</span>
                </h3>

                {/* Subtotals Breakdown */}
                <div className="flex flex-col gap-2.5 text-xs text-[#554245] pb-4 border-b border-[#f2ede8]">
                  <div className="flex justify-between items-center">
                    <span>Subtotal dos itens ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
                    <span className="font-semibold text-[#1d1b19]">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      Taxa de Entrega
                      <span title="Distância estimada 3.2km" className="inline-flex items-center">
                        <Info className="w-3 h-3 text-[#877274]" />
                      </span>
                    </span>
                    <span className="font-semibold text-[#1d1b19]">
                      {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between items-center text-[#9c3e54] font-semibold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Cupom Lançamento
                      </span>
                      <span>- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {paymentMethod === 'pix' && pixDiscount > 0 && (
                    <div className="flex justify-between items-center text-[#994703] font-semibold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Desconto PIX (5%)
                      </span>
                      <span>- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                </div>

                {/* Total Box */}
                <div className="p-4 rounded-2xl bg-[#f2ede8] flex flex-col gap-1 my-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#1d1b19]">Total a pagar:</span>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#9c3e54] leading-none">
                        R$ {total.toFixed(2).replace('.', ',')}
                      </div>
                      {totalSavings > 0 && (
                        <span className="text-[10px] text-[#877274] line-through">
                          De R$ {(subtotal + deliveryFee).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>
                  {totalSavings > 0 && (
                    <p className="text-[10px] text-[#994703] text-right uppercase tracking-wider font-bold mt-1">
                      ✓ Você economizou R$ {totalSavings.toFixed(2).replace('.', ',')} neste pedido
                    </p>
                  )}
                </div>

                {/* Coupon Code Input */}
                <div className="flex flex-col gap-1 mb-4">
                  <label className="text-[10px] uppercase font-bold text-[#1d1b19] tracking-wider">
                    Cupom de Desconto
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-4 pr-24 py-2 rounded-full bg-[#f2ede8] text-xs font-bold text-[#1d1b19] focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="absolute right-1 px-3 py-1 rounded-full bg-[#7f5347] hover:bg-[#311309] text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponApplied && (
                    <div className="flex items-center gap-1 text-[#9c3e54] text-[10px] font-bold mt-0.5">
                      <CheckCircle className="w-3 h-3" />
                      <span>Cupom '{couponCode}' aplicado com sucesso!</span>
                    </div>
                  )}
                </div>

                {/* Eco utensils Checkbox */}
                <div className="p-3 rounded-2xl bg-[#f8f3ee] mb-4 flex items-start gap-2 border border-[#dac0c3]/20">
                  <input
                    type="checkbox"
                    id="eco-box"
                    checked={ecoUtensils}
                    onChange={e => setEcoUtensils(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#9c3e54] accent-[#9c3e54] cursor-pointer"
                  />
                  <label htmlFor="eco-box" className="text-xs text-[#1d1b19] cursor-pointer leading-tight">
                    <strong>Preciso de talheres sustentáveis & guardanapos</strong>
                    <span className="block text-[10px] text-[#877274] mt-0.5">
                      Ajude a diminuir resíduos plásticos se estiver em casa!
                    </span>
                  </label>
                </div>

                {/* Confirm & Finalize Button */}
                <button
                  onClick={handleFinalize}
                  className="w-full py-3.5 px-6 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white font-bold text-sm shadow-[0_6px_20px_rgba(156,62,84,0.35)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Confirmar e Finalizar Pedido</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Trust Markers */}
                <div className="mt-4 pt-3 flex flex-col items-center gap-1 text-center text-[#877274] border-t border-[#f2ede8]">
                  <div className="flex items-center gap-2 text-[#7f5347] text-[10px] uppercase font-bold">
                    <span className="flex items-center gap-0.5">
                      <Lock className="w-3 h-3 text-[#9c3e54]" /> Compra Segura
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px] text-[#9c3e54]">kitchen</span> Embalagem Selada
                    </span>
                  </div>
                  <p className="text-[10px]">
                    Ao finalizar, você concorda com os termos de compra e entrega da Confeitaria Felicitá Doces.
                  </p>
                </div>
              </div>

              {/* Need Help Box */}
              <div className="bg-[#f2ede8] rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-[#dac0c3]/20">
                <div className="w-9 h-9 rounded-full bg-[#e6e2dd] text-[#7f5347] flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1d1b19]">Dúvidas sobre o pedido?</span>
                  <span className="text-[11px] text-[#554245]">Fale com nossa equipe no WhatsApp: (11) 98765-4321</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
