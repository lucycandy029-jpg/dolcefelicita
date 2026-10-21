import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  MapPin, 
  MessageCircle, 
  FileText, 
  RotateCcw, 
  Star, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingScreenProps {
  order?: Order | null;
  pastOrders: Order[];
  onNavigateToMenu: () => void;
  onReorder: (order: Order) => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  order,
  pastOrders,
  onNavigateToMenu,
  onReorder
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'canceled'>('active');

  if (!order) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#dac0c3]/40 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#1d1b19] font-heading">
            Nenhum pedido ativo no momento
          </h2>
          <p className="text-xs text-[#554245] max-w-md">
            Você não possui nenhum pedido em andamento no momento. Navegue pelo nosso cardápio artesanal para escolher seus doces favoritos!
          </p>
          <button
            onClick={onNavigateToMenu}
            className="mt-2 px-6 py-2.5 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b] shadow-sm transition-all cursor-pointer"
          >
            Ver Cardápio Artesanal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      {/* Top Hero Banner */}
      <div className="relative w-full overflow-hidden bg-[#f8f3ee] py-8 border-b border-[#dac0c3]/20">
        <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-[#fec4b4]/40 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-12 w-80 h-80 rounded-full bg-[#ffd9de]/30 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#e87a90] text-white flex items-center justify-center shadow-lg shrink-0">
                <span className="material-symbols-outlined text-[32px] sm:text-[40px]">bakery_dining</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full bg-[#f2ede8] text-[10px] text-[#7f5347] uppercase font-bold">
                    Status em Tempo Real
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-[#ffd9de] text-[#3f0015] text-[10px] font-bold">
                    {order.paymentMethod === 'pix' ? 'PIX Confirmado' : 'Pagamento Aprovado'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1d1b19] mt-1 tracking-tight font-heading">
                  Pedido #{order.orderNumber} Confirmado com Sucesso! 🎉
                </h1>
                <p className="text-xs sm:text-sm text-[#554245] mt-0.5">
                  Obrigado por escolher a Felicitá Doces! Já estamos preparando tudo com carinho e ingredientes nobres.
                </p>
              </div>
            </div>

            {/* Quick Delivery Estimate Card */}
            <div className="w-full lg:w-auto p-4 rounded-2xl bg-white shadow-sm flex items-center gap-4 shrink-0 border border-[#dac0c3]/30">
              <div className="w-12 h-12 rounded-full bg-[#ffdbc9] text-[#572500] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-[#994703]" />
              </div>
              <div className="flex flex-col pr-2">
                <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                  Previsão de Entrega
                </span>
                <span className="text-sm sm:text-base font-bold text-[#1d1b19]">
                  Hoje: 16:35 – 16:50
                </span>
                <span className="text-xs text-[#9c3e54] font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#9c3e54] animate-ping inline-block"></span>
                  Aprox. 35 minutos restantes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Kitchen Stages + Delivery Map Column */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Kitchen Timeline & Package items */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Stage Progress Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#dac0c3]/30">
              <div className="flex items-center justify-between pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                    Progresso da Cozinha
                  </span>
                  <h2 className="text-xl font-bold text-[#1d1b19] font-heading">
                    Etapas do seu Doce Momento
                  </h2>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2ede8] text-[#554245] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-[#994703]">cloud_download</span>
                  <span>Atualizado há 2 min</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#f2ede8] rounded-full h-2.5 my-4 overflow-hidden">
                <div className="bg-[#9c3e54] h-full rounded-full transition-all duration-1000 ease-out w-[58%]"></div>
              </div>

              {/* Timeline steps */}
              <div className="relative flex flex-col gap-6 mt-6">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[#f2ede8]"></div>

                {/* Step 1: Pedido Realizado */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#9c3e54] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between pt-1">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1d1b19]">Pedido Realizado</h3>
                      <p className="text-xs text-[#554245]">Recebemos sua escolha no nosso ateliê central.</p>
                    </div>
                    <span className="text-[10px] text-[#7f5347] font-bold mt-1 sm:mt-0 bg-[#f2ede8] px-2.5 py-0.5 rounded-full w-fit">
                      16:05
                    </span>
                  </div>
                </div>

                {/* Step 2: Pagamento Aprovado */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#9c3e54] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between pt-1">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1d1b19]">Pagamento Aprovado</h3>
                      <p className="text-xs text-[#554245]">Autenticação instantânea via Banco Central (PIX).</p>
                    </div>
                    <span className="text-[10px] text-[#7f5347] font-bold mt-1 sm:mt-0 bg-[#f2ede8] px-2.5 py-0.5 rounded-full w-fit">
                      16:06
                    </span>
                  </div>
                </div>

                {/* Step 3: Na Cozinha (Active) */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="relative w-12 h-12 rounded-full bg-[#994703] text-white flex items-center justify-center shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-[20px]">oven_gen</span>
                    <span className="absolute -inset-1 rounded-full bg-[#e6813f]/40 animate-ping -z-10"></span>
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between pt-1 bg-[#f8f3ee] p-4 rounded-2xl border border-[#dac0c3]/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-[#994703]">
                          Na Cozinha: Fornada Fresquinha
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-[#ffdbc9] text-[#572500] text-[10px] font-bold">
                          Em Andamento
                        </span>
                      </div>
                      <p className="text-xs text-[#554245] mt-1">
                        Seus cookies e brownies estão sendo montados artesanalmente com chocolate belga e embalados em caixa térmica selada.
                      </p>
                    </div>
                    <span className="text-[10px] text-[#994703] font-bold mt-2 sm:mt-0 bg-[#ffb68c] px-2.5 py-0.5 rounded-full w-fit">
                      16:10
                    </span>
                  </div>
                </div>

                {/* Step 4: Saiu para Entrega */}
                <div className="flex items-start gap-4 relative z-10 opacity-70">
                  <div className="w-12 h-12 rounded-full bg-[#e6e2dd] text-[#554245] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">two_wheeler</span>
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between pt-1">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1d1b19]">Saiu para Entrega</h3>
                      <p className="text-xs text-[#554245]">Motoboy exclusivo Felicitá com bag térmica a caminho.</p>
                    </div>
                    <span className="text-[10px] text-[#877274] bg-[#f2ede8] px-2.5 py-0.5 rounded-full w-fit">
                      Previsão 16:30
                    </span>
                  </div>
                </div>

                {/* Step 5: Pedido Entregue */}
                <div className="flex items-start gap-4 relative z-10 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-[#e6e2dd] text-[#554245] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">home_pin</span>
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between pt-1">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1d1b19]">Pedido Entregue</h3>
                      <p className="text-xs text-[#554245]">Aproveite sua pausa doce com total felicidade!</p>
                    </div>
                    <span className="text-[10px] text-[#877274] bg-[#f2ede8] px-2.5 py-0.5 rounded-full w-fit">
                      Previsão 16:45
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itens no Pacote */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#dac0c3]/30 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1d1b19] font-heading">Itens no Pacote</span>
                <span className="text-xs text-[#7f5347] font-semibold">
                  {order.items.length} itens deliciosos
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {order.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f3ee]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover shadow-sm"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#9c3e54] font-bold">
                          {item.badgeTag || 'Receita Artesanal'}
                        </span>
                        <span className="text-sm font-bold text-[#1d1b19]">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-xs text-[#554245]">
                          {item.unitLabel} {item.addons.length > 0 ? `• com ${item.addons.map(a => a.name).join(', ')}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#1d1b19]">
                      R$ {item.itemTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#f2ede8] text-xs text-[#554245]">
                <div className="flex justify-between">
                  <span>Subtotal dos doces</span>
                  <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega especial (Jardins)</span>
                  <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1d1b19] pt-2 border-t border-[#f2ede8]">
                  <span>Total Pago</span>
                  <span className="text-lg text-[#9c3e54]">
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Map & Courier Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#dac0c3]/30 flex flex-col">
              {/* Map simulated visual */}
              <div className="relative w-full h-48 bg-[#f2ede8]">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBCECkCq6SlVLxAviGn8IGxwlJj8P-OWzTXRlnPV_gEPZzXyPZT7IOto0-Jx1Wu1New7UF6dKA5RkVrKfubPOBQ6asCgeW0bqU0a97zXQUJMDIpimAztsmCGIvnNY94cdyofqQv-iDFDxLa0gFAA8OCtl8lYojtwlc2V8GcpFadbrZqLNWpokE_bgbO2cngMwtlbC7CYlgKLfJqxsktyeUotz0U9urPsf0-wEoBvdk5sTze8kiR4meG_w')`
                  }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-white/95 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-xs text-[#1d1b19] font-bold truncate">
                    <MapPin className="w-4 h-4 text-[#9c3e54] shrink-0" />
                    <span className="truncate">Av. Paulista, 1000 - Apto 82</span>
                  </div>
                  <span className="text-[10px] text-[#7f5347] font-extrabold uppercase shrink-0">
                    3.2 km
                  </span>
                </div>
              </div>

              {/* Courier info */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={order.courier?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w"}
                      alt="Entregador"
                      className="w-14 h-14 rounded-full object-cover shadow-sm border border-[#dac0c3]/40"
                    />
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#9c3e54] border-2 border-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-white">two_wheeler</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                      Entregador Próprio
                    </span>
                    <span className="text-sm font-bold text-[#1d1b19]">
                      {order.courier?.name || 'Mateus Siqueira'}
                    </span>
                    <div className="flex items-center gap-1 text-[#994703]">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span className="text-xs font-bold text-[#1d1b19]">
                        {order.courier?.rating || 4.97} • {order.courier?.deliveriesCount || 850}+ entregas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href="https://wa.me/5511987654321"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-full bg-[#9c3e54] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-[#64132b] transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar no WhatsApp com a Loja</span>
                  </a>
                  <button
                    onClick={() => alert(`Comprovante de pagamento do Pedido #${order.orderNumber}\nValor: R$ ${order.total.toFixed(2)}\nMétodo: PIX Banco Central\nChave Autenticação: BACEN-PIX-98234-FELICITA`)}
                    className="w-full py-2.5 px-4 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-[#1d1b19] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Comprovante PIX</span>
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8f3ee] flex items-start gap-2 text-[#554245] border border-[#dac0c3]/20">
                  <ShieldCheck className="w-4 h-4 text-[#7f5347] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Embalagem com lacre de inviolabilidade aroma-safe garantindo crocância do forno até você.
                  </p>
                </div>
              </div>
            </div>

            {/* Special Instructions Box */}
            <div className="p-5 rounded-3xl bg-[#fec4b4]/30 flex flex-col gap-1 border border-[#fec4b4]/60">
              <span className="text-xs font-bold text-[#7a4f42]">Instruções do seu Pedido</span>
              <p className="text-xs text-[#7a4f42] italic leading-relaxed">
                "{order.notes || 'Por favor tocar o interfone e deixar na portaria caso não atenda.'}"
              </p>
            </div>
          </div>
        </div>

        {/* ORDER HISTORY TABS SECTION */}
        <div className="mt-12 pt-8 border-t border-[#f2ede8]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                Histórico da Sua Conta
              </span>
              <h2 className="text-xl font-bold text-[#1d1b19] font-heading">
                Meus Pedidos Felicitá
              </h2>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#f2ede8] overflow-x-auto">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-[#9c3e54] text-white shadow-sm'
                    : 'text-[#554245] hover:text-[#1d1b19]'
                }`}
              >
                Em Andamento (1)
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-[#9c3e54] text-white shadow-sm'
                    : 'text-[#554245] hover:text-[#1d1b19]'
                }`}
              >
                Concluídos ({pastOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('canceled')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'canceled'
                    ? 'bg-[#9c3e54] text-white shadow-sm'
                    : 'text-[#554245] hover:text-[#1d1b19]'
                }`}
              >
                Cancelados (0)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {pastOrders.map(pOrder => (
              <div
                key={pOrder.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-[#dac0c3]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#ffdbc9] flex items-center justify-center text-[#572500] shrink-0">
                    <span className="material-symbols-outlined text-[24px]">cake</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1d1b19]">
                        Pedido #{pOrder.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#f2ede8] text-[10px] text-[#7f5347] font-semibold">
                        {pOrder.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-[#554245] mt-0.5">{pOrder.notes}</p>
                    <span className="text-xs text-[#9c3e54] font-bold mt-0.5">
                      Total: R$ {pOrder.total.toFixed(2).replace('.', ',')} • Entregue com sucesso
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => alert(`Nota fiscal emitida para Pedido #${pOrder.orderNumber}\nNFC-e chave: 35240212345678000199550010000041021234567890`)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-[#1d1b19] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Nota Fiscal</span>
                  </button>
                  <button
                    onClick={() => onReorder(pOrder)}
                    className="flex-1 md:flex-none px-5 py-2 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pedir Novamente</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={onNavigateToMenu}
              className="px-6 py-2.5 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] text-[#1d1b19] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Página Inicial / Cardápio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
