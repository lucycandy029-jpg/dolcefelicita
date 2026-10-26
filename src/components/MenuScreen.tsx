import React, { useState } from 'react';
import { 
  Star, 
  Flame, 
  Sparkles, 
  Plus, 
  Minus, 
  Check, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Heart,
  Clock,
  Leaf,
  Cookie,
  ShoppingBag,
  Award,
  Bike
} from 'lucide-react';
import { Product, ProductAddon, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface MenuScreenProps {
  categories: Category[];
  products: Product[];
  onAddToCart: (product: Product, quantity: number, selectedAddons: ProductAddon[], notes: string) => void;
  onNavigateToCart: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  categories,
  products,
  onAddToCart,
  onNavigateToCart
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all'); // all, gluten-free, best-sellers, promos
  const [sortMode, setSortMode] = useState<string>('recommended');

  // Currently inspected product in the right customization panel
  const [activeProduct, setActiveProduct] = useState<Product>(products[0] || {} as Product);
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [selectedAddons, setSelectedAddons] = useState<{ [id: string]: boolean }>({
    'addon-calda-nutella': true,
    'addon-cartao-afetivo': true
  });
  const [customNotes, setCustomNotes] = useState<string>('');
  const [justAddedFeedback, setJustAddedFeedback] = useState<boolean>(false);

  // Keep active product in sync if updated by admin in real-time
  React.useEffect(() => {
    if (activeProduct && activeProduct.id) {
      const match = products.find(p => p.id === activeProduct.id);
      if (match) {
        setActiveProduct(match);
      } else if (products.length > 0) {
        setActiveProduct(products[0]);
      }
    } else if (products.length > 0) {
      setActiveProduct(products[0]);
    }
  }, [products]);

  // Compute live price for customization drawer
  const calculateDrawerTotal = () => {
    let addonsTotal = 0;
    if (activeProduct.addons) {
      activeProduct.addons.forEach(addon => {
        if (selectedAddons[addon.id]) {
          addonsTotal += addon.price;
        }
      });
    }
    return (activeProduct.price + addonsTotal) * customQuantity;
  };

  const handleSelectProduct = (product: Product) => {
    setActiveProduct(product);
    setCustomQuantity(1);
    // Initialize default addons
    const initialAddonState: { [id: string]: boolean } = {};
    if (product.addons) {
      product.addons.forEach(a => {
        initialAddonState[a.id] = !!a.checked;
      });
    }
    setSelectedAddons(initialAddonState);
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => ({ ...prev, [addonId]: !prev[addonId] }));
  };

  const handleAddCustomToCart = () => {
    const addonsList: ProductAddon[] = (activeProduct.addons || []).filter(a => selectedAddons[a.id]);
    onAddToCart(activeProduct, customQuantity, addonsList, customNotes);
    setJustAddedFeedback(true);
    setTimeout(() => setJustAddedFeedback(false), 2000);
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
    if (filterMode === 'gluten-free' && !p.isGlutenFree) return false;
    if (filterMode === 'best-sellers' && p.rating < 4.9) return false;
    return true;
  });

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Context & Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#fec4b4] text-[#7a4f42] text-xs font-bold uppercase tracking-wider">
                Feito Hoje às 08:30
              </span>
              <span className="w-2 h-2 rounded-full bg-[#9c3e54] animate-pulse"></span>
              <span className="text-xs text-[#7f5347] font-semibold">Cozinha em produção ao vivo</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1d1b19] tracking-tight font-heading">
              Nosso Cardápio Artesanal
            </h1>
            <p className="text-sm sm:text-base text-[#554245]">
              Doces preparados diariamente com chocolate nobre belga, manteiga de primeira e muito amor.
            </p>
          </div>

          {/* Quick Delivery Time & Rating Badge */}
          <div className="flex items-center gap-4 p-3 bg-[#f8f3ee] rounded-2xl shadow-sm self-start md:self-auto border border-[#dac0c3]/30">
            <div className="w-10 h-10 rounded-full bg-[#9c3e54]/10 flex items-center justify-center text-[#9c3e54]">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">Entrega Expressa</span>
              <span className="text-sm sm:text-base font-bold text-[#1d1b19]">35 - 45 min</span>
            </div>
            <div className="h-8 w-px bg-[#dac0c3]/40"></div>
            <div className="flex items-center gap-1 text-[#994703] px-2">
              <Star className="w-4 h-4 fill-current text-amber-500" />
              <span className="text-sm sm:text-base font-bold text-[#1d1b19]">4.9</span>
              <span className="text-xs text-[#877274]">(1.4k+)</span>
            </div>
          </div>
        </div>

        {/* Category Tabs Ribbon */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => {
              const isActive = selectedCategoryId === cat.id;
              const count = cat.id === 'all'
                ? products.length
                : products.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#9c3e54] text-white shadow-sm'
                      : 'bg-[#f2ede8] hover:bg-[#ece7e2] text-[#1d1b19]'
                  }`}
                >
                  <CategoryIcon iconName={cat.iconName} categoryId={cat.id} className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#9c3e54]'}`} />
                  <span>{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#e6e2dd] text-[#7f5347]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[#877274] uppercase tracking-wider font-bold mr-1">Filtrar por:</span>
              <button
                onClick={() => setFilterMode(filterMode === 'gluten-free' ? 'all' : 'gluten-free')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
                  filterMode === 'gluten-free'
                    ? 'bg-[#994703] text-white'
                    : 'bg-white text-[#554245] hover:bg-[#f2ede8] border border-[#dac0c3]/40'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 text-[#994703]" />
                <span>Sem Glúten / Sem Lactose</span>
              </button>
              <button
                onClick={() => setFilterMode(filterMode === 'best-sellers' ? 'all' : 'best-sellers')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
                  filterMode === 'best-sellers'
                    ? 'bg-[#9c3e54] text-white'
                    : 'bg-[#ffd9de] text-[#3f0015]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current text-[#9c3e54]" />
                <span>Mais Vendidos</span>
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#554245] text-xs font-semibold shadow-sm hover:bg-[#f2ede8] border border-[#dac0c3]/40 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#994703]" />
                <span>Promoções Especiais</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-[10px] text-[#877274] uppercase tracking-wider font-bold">Ordenar:</label>
              <select
                value={sortMode}
                onChange={e => setSortMode(e.target.value)}
                className="bg-white text-[#1d1b19] text-xs font-semibold pl-3 pr-6 py-1 rounded-full shadow-sm border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] cursor-pointer"
              >
                <option value="recommended">Recomendados</option>
                <option value="lowest-price">Menor Preço</option>
                <option value="highest-rating">Maior Avaliação</option>
                <option value="prep-time">Tempo de Preparo</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN TWO-COLUMN SPLIT VIEW: Catalog (Left) + Open Customization Drawer (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Products Catalog Grid (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#1d1b19] font-heading">Cookies & Doces Recheados</span>
                <span className="px-2 py-0.5 rounded-full bg-[#f2ede8] text-[10px] text-[#7f5347] font-bold">
                  Fornada Quentinha
                </span>
              </div>
              <span className="text-xs text-[#877274]">{filteredProducts.length} receitas disponíveis</span>
            </div>

            {/* Grid of Product Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredProducts.map(product => {
                const isSelected = activeProduct.id === product.id;
                return (
                  <div
                    key={product.id}
                    className={`relative bg-white rounded-2xl p-3 flex flex-col justify-between transition-all group ${
                      isSelected
                        ? 'shadow-[0_4px_24px_-4px_rgba(156,62,84,0.18)] ring-2 ring-[#9c3e54]'
                        : 'shadow-[0_4px_20px_-2px_rgba(61,28,18,0.05)] hover:shadow-lg border border-[#dac0c3]/30'
                    }`}
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-[#f2ede8]">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {product.badgeTag && (
                          <span className="px-2 py-0.5 rounded-full bg-[#9c3e54] text-white text-[10px] font-bold shadow-sm">
                            {product.badgeTag}
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="px-2 py-0.5 rounded-full bg-[#e6813f] text-[#572500] text-[10px] font-bold shadow-sm">
                            Mais Pedido
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm flex items-center gap-1 text-[11px] font-bold text-[#994703] shadow-sm">
                        <Star className="w-3 h-3 fill-current text-amber-500" />
                        <span>{product.rating} ({product.reviewCount})</span>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 px-1">
                      <h3 className="text-base font-bold text-[#1d1b19] leading-snug mb-1 font-heading">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#554245] line-clamp-2 mb-4 leading-relaxed">
                        {product.shortDescription}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-1 border-t border-[#f2ede8]">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#877274] uppercase font-semibold">A partir de</span>
                          <span className="text-base font-bold text-[#9c3e54]">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSelectProduct(product)}
                          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#9c3e54] text-white shadow-sm'
                              : 'bg-[#f2ede8] hover:bg-[#9c3e54] hover:text-white text-[#9c3e54]'
                          }`}
                        >
                          <span>{isSelected ? 'Customizando' : 'Personalizar'}</span>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Brownies & Highlights Section */}
            <div className="pt-4 border-t border-[#f2ede8]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1d1b19] font-heading">Brownies Molhadinhos</h2>
                <button
                  onClick={() => setSelectedCategoryId('brownies')}
                  className="text-xs font-bold text-[#9c3e54] hover:text-[#64132b] flex items-center gap-1 cursor-pointer"
                >
                  Ver todos
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.filter(p => p.categoryId === 'brownies').slice(0, 2).map(brownie => (
                  <div
                    key={brownie.id}
                    onClick={() => handleSelectProduct(brownie)}
                    className="bg-white rounded-2xl p-3 flex gap-3 items-center shadow-sm border border-[#dac0c3]/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f2ede8] shrink-0">
                      <img src={brownie.imageUrl} alt={brownie.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[10px] text-[#7f5347] font-bold uppercase">{brownie.badgeTag}</span>
                      <h4 className="text-sm font-bold text-[#1d1b19] truncate">{brownie.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-[#9c3e54]">
                          R$ {brownie.price.toFixed(2).replace('.', ',')}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[#f2ede8] text-[#9c3e54] flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Open Product Customization Modal / Persistent Side Panel (5 cols) */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="bg-white rounded-3xl shadow-[0_10px_35px_-4px_rgba(61,28,18,0.1)] p-6 flex flex-col gap-4 border border-[#dac0c3]/30 relative overflow-hidden">
              {/* Decorative pastry glow */}
              <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-[#e87a90]/20 blur-3xl pointer-events-none"></div>

              {/* Drawer header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9c3e54]"></span>
                  <span className="text-[11px] text-[#7f5347] uppercase tracking-widest font-bold">
                    Personalização do Pedido
                  </span>
                </div>
                <span className="text-xs text-[#877274] bg-[#f2ede8] px-2 py-0.5 rounded-full font-semibold">
                  {activeProduct.unitLabel}
                </span>
              </div>

              {/* Product Hero Image */}
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#f2ede8]">
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm">
                  <Cookie className="w-4 h-4 text-[#9c3e54]" />
                  <span className="text-[10px] text-[#1d1b19] uppercase font-bold">
                    {activeProduct.badgeTag || 'Artesanal'}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#32302d]/85 backdrop-blur-md text-white text-[10px] font-bold">
                  Aprox. {activeProduct.weightGrams || 130}g
                </div>
              </div>

              {/* Product Titles & Description */}
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-bold text-[#1d1b19] font-heading">{activeProduct.name}</h2>
                  <span className="text-lg font-bold text-[#9c3e54]">
                    R$ {activeProduct.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="text-xs text-[#554245] leading-relaxed">
                  {activeProduct.description}
                </p>
              </div>

              <div className="h-px w-full bg-[#f2ede8]"></div>

              {/* Quantity Stepper Block */}
              <div className="flex items-center justify-between py-2 bg-[#f8f3ee] px-4 rounded-xl border border-[#dac0c3]/20">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1d1b19]">Quantidade</span>
                  <span className="text-[11px] text-[#877274]">Unidades na caixa</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm">
                  <button
                    onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                    className="w-7 h-7 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] flex items-center justify-center text-[#1d1b19] transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-[#1d1b19] min-w-[20px] text-center">
                    {customQuantity}
                  </span>
                  <button
                    onClick={() => setCustomQuantity(customQuantity + 1)}
                    className="w-7 h-7 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Addons & Customization Checkboxes */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1d1b19]">Turbine seu Doce</span>
                  <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">Opcionais</span>
                </div>

                {(activeProduct.addons || []).map(addon => {
                  const isChecked = !!selectedAddons[addon.id];
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#ffd9de]/30 border-[#9c3e54]/50'
                          : 'bg-[#f8f3ee] border-transparent hover:bg-[#f2ede8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon.id)}
                          className="w-4 h-4 rounded text-[#9c3e54] accent-[#9c3e54] cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#1d1b19]">{addon.name}</span>
                          <span className="text-[10px] text-[#877274]">{addon.description}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#9c3e54]">
                        + R$ {addon.price.toFixed(2).replace('.', ',')}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Special Notes Textarea */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#7f5347] uppercase tracking-wider font-bold">
                    Observações Especiais
                  </label>
                  <span className="text-[10px] text-[#877274]">Opcional (máx 140)</span>
                </div>
                <textarea
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value.slice(0, 140))}
                  placeholder="Ex: Aquecer antes de enviar, sem nozes, etc."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] placeholder:text-[#877274] border border-[#dac0c3]/30 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] resize-none"
                />
              </div>

              {/* Action CTA Button with Live Dynamic Pricing */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleAddCustomToCart}
                  className={`w-full py-3 px-4 rounded-full font-bold flex items-center justify-between transition-all shadow-md active:scale-[0.99] cursor-pointer ${
                    justAddedFeedback
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#9c3e54] hover:bg-[#64132b] text-white shadow-[0_8px_20px_-3px_rgba(156,62,84,0.4)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {justAddedFeedback ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Adicionado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Adicionar ao Pedido</span>
                      </>
                    )}
                  </span>
                  <span className="text-sm tracking-tight font-extrabold">
                    R$ {calculateDrawerTotal().toFixed(2).replace('.', ',')}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[#877274] text-center text-[11px]">
                  <Lock className="w-3 h-3 text-[#9c3e54]" />
                  <span>Ingredientes 100% nobres & embalagens térmicas seguras</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Reassurance Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-[#f8f3ee] grid grid-cols-1 md:grid-cols-3 gap-6 items-center border border-[#dac0c3]/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#9c3e54]/10 flex items-center justify-center text-[#9c3e54] shrink-0">
              <Cookie className="w-6 h-6 text-[#9c3e54]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1d1b19]">Massa Fresquinha</span>
              <span className="text-xs text-[#554245]">Assamos fornadas a cada duas horas durante o dia.</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#fec4b4] flex items-center justify-center text-[#7a4f42] shrink-0">
              <Award className="w-6 h-6 text-[#7a4f42]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1d1b19]">Chocolate Belga</span>
              <span className="text-xs text-[#554245]">Utilizamos apenas cacau puro Callebaut e manteiga nobre.</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#e6813f]/20 flex items-center justify-center text-[#994703] shrink-0">
              <Bike className="w-6 h-6 text-[#994703]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1d1b19]">Envio Térmico Cuidadoso</span>
              <span className="text-xs text-[#554245]">Chega quentinho e perfeito na sua porta.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
