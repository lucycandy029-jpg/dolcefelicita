import React, { useState } from 'react';
import { ShoppingBag, Heart, Bell, MapPin, Search, ChevronDown, User, ShieldCheck, Shield, LogOut, Check, ArrowRight } from 'lucide-react';
import { Address } from '../types';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  cartCount: number;
  cartTotal: number;
  activeAddress?: Address | null;
  isLoggedIn: boolean;
  userName: string;
  userRole: string;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  cartCount,
  cartTotal,
  activeAddress,
  isLoggedIn,
  userName,
  userRole,
  onOpenAuth,
  onLogout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fef8f3]/95 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(61,28,18,0.06)] border-b border-[#f2ede8]">
      {/* Top status bar */}
      <div className="bg-[#9c3e54] text-white py-1.5 px-4 text-xs font-semibold tracking-wider flex items-center justify-between max-w-7xl mx-auto select-none">
        <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Loja Aberta hoje até 22h
          </span>
          <span className="text-pink-200 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Entrega rápida em 30–45 min</span>
          <span className="text-pink-200 hidden md:inline">•</span>
          <span className="hidden md:inline">Frete Grátis acima de R$ 50,00</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-amber-300">
          <span>★ 4.9</span>
          <span className="text-white/80 font-normal">(+1.2k avaliações no delivery)</span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand & Address */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <button
            onClick={() => onNavigate('cardapio')}
            className="group text-left cursor-pointer transition-transform hover:scale-[1.02]"
            title="Felicitá Cookies - Ir para o início"
          >
            <BrandLogo variant="compact" />
          </button>

          {/* Delivery location selector - só aparece quando o usuário estiver logado e tiver endereço */}
          {isLoggedIn && activeAddress && activeAddress.street ? (
            <button
              onClick={() => onNavigate('carrinho')}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f2ede8] hover:bg-[#ece7e2] transition-colors text-left border border-[#dac0c3]/40 cursor-pointer animate-fadeIn"
            >
              <MapPin className="w-4 h-4 text-[#9c3e54] shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase text-[#7f5347] font-semibold tracking-wider">Entregar em</span>
                <span className="text-xs font-semibold text-[#1d1b19] truncate max-w-[170px]">
                  {activeAddress.street}, {activeAddress.number}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#877274]" />
            </button>
          ) : null}
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0 whitespace-nowrap">
          <button
            onClick={() => onNavigate('cardapio')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              currentTab === 'cardapio'
                ? 'bg-[#9c3e54] text-white shadow-sm'
                : 'text-[#554245] hover:text-[#9c3e54] hover:bg-[#f2ede8]'
            }`}
          >
            Cardápio
          </button>
          <button
            onClick={() => onNavigate('mais-pedidos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              currentTab === 'mais-pedidos'
                ? 'bg-[#9c3e54] text-white shadow-sm'
                : 'text-[#554245] hover:text-[#9c3e54] hover:bg-[#f2ede8]'
            }`}
          >
            Mais Pedidos
          </button>
          <button
            onClick={() => onNavigate('combos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              currentTab === 'combos'
                ? 'bg-[#9c3e54] text-white shadow-sm'
                : 'text-[#554245] hover:text-[#9c3e54] hover:bg-[#f2ede8]'
            }`}
          >
            Combos
          </button>
          <button
            onClick={() => onNavigate('rastreio')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              currentTab === 'rastreio'
                ? 'bg-[#9c3e54] text-white shadow-sm'
                : 'text-[#554245] hover:text-[#9c3e54] hover:bg-[#f2ede8]'
            }`}
          >
            Meus Pedidos
          </button>

          {/* PAINEL ADMINISTRATIVO: Só aparece quando logado como administrador */}
          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-[#311309] text-white shadow-md ring-2 ring-[#ffd9de]'
                  : 'bg-[#ffd9de] text-[#3f0015] hover:bg-[#fec4b4]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#9c3e54]" />
              <span>Painel Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}
        </nav>

        {/* Action icons & Cart button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
          <button
            onClick={() => onNavigate('rastreio')}
            title="Notificações do pedido"
            className="relative w-9 h-9 rounded-full flex items-center justify-center bg-[#f2ede8] hover:bg-[#ece7e2] text-[#1d1b19] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#9c3e54] ring-2 ring-[#fef8f3]"></span>
          </button>

          <button
            onClick={() => onNavigate('cardapio')}
            title="Favoritos"
            className="relative w-9 h-9 rounded-full flex items-center justify-center bg-[#f2ede8] hover:bg-[#ece7e2] text-[#1d1b19] transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#fec4b4] text-[#7a4f42] text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {/* Checkout Bag button */}
          <button
            onClick={() => onNavigate('carrinho')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white transition-all shadow-[0_4px_16px_-2px_rgba(156,62,84,0.35)] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-bold whitespace-nowrap">
              {cartCount} {cartCount === 1 ? 'item' : 'itens'} • R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          </button>

          {/* User profile toggle / Login button */}
          {!isLoggedIn ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Fazer Login na Conta"
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`h-9 px-2.5 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer transition-all ${
                  userRole === 'admin'
                    ? 'bg-[#311309] text-[#ffd9de] ring-2 ring-[#9c3e54]'
                    : 'bg-[#9c3e54] text-white hover:bg-[#64132b]'
                }`}
                title={userRole === 'admin' ? 'Administrador Conectado' : `Conectado como ${userName}`}
              >
                {userRole === 'admin' ? <Shield className="w-3.5 h-3.5 text-[#ffd9de]" /> : <User className="w-3.5 h-3.5 text-white" />}
                <span className="text-xs font-bold max-w-[85px] truncate">
                  {userRole === 'admin' ? 'Admin' : userName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {/* Profile Dropdown Popover */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-xl border border-[#dac0c3]/40 p-3 z-50 flex flex-col gap-2">
                  <div className="flex items-center gap-2.5 p-2 bg-[#f8f3ee] rounded-xl border border-[#dac0c3]/20">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      userRole === 'admin' ? 'bg-[#311309] text-white' : 'bg-[#ffd9de] text-[#9c3e54]'
                    }`}>
                      {userRole === 'admin' ? 'AD' : (userName ? userName.slice(0, 2).toUpperCase() : 'CL')}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#1d1b19] truncate">{userName}</span>
                      <span className="text-[10px] text-[#7f5347] font-semibold flex items-center gap-1">
                        {userRole === 'admin' ? (
                          <span className="text-[#9c3e54] font-bold flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Perfil Administrador
                          </span>
                        ) : (
                          'Perfil Cliente'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 border-t border-[#f2ede8] pt-2">
                    {userRole === 'admin' && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setIsProfileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-[#9c3e54] bg-[#ffd9de]/30 hover:bg-[#ffd9de]/60 transition-colors cursor-pointer text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#9c3e54]" />
                        <span>Abrir Painel Admin</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onOpenAuth();
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs text-[#554245] hover:bg-[#f2ede8] transition-colors cursor-pointer text-left"
                    >
                      <User className="w-3.5 h-3.5 text-[#877274]" />
                      <span>Trocar de Conta</span>
                    </button>

                    <button
                      onClick={() => {
                        onLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sair da conta (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
