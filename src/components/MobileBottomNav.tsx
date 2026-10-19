import React from 'react';
import { 
  ShoppingBag, 
  Flame, 
  Clock, 
  User, 
  ShieldCheck, 
  UtensilsCrossed 
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  cartCount: number;
  isLoggedIn: boolean;
  userRole: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  cartCount,
  isLoggedIn,
  userRole
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#dac0c3]/30 px-3 py-1.5 lg:hidden shadow-[0_-4px_24px_rgba(61,28,18,0.08)]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Cardápio */}
        <button
          onClick={() => {
            onNavigate('cardapio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'cardapio'
              ? 'text-[#9c3e54] font-bold scale-105'
              : 'text-[#877274] hover:text-[#1d1b19]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'cardapio' ? 'bg-[#ffd9de]' : ''}`}>
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Cardápio</span>
        </button>

        {/* Mais Pedidos */}
        <button
          onClick={() => {
            onNavigate('mais-pedidos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'mais-pedidos'
              ? 'text-[#9c3e54] font-bold scale-105'
              : 'text-[#877274] hover:text-[#1d1b19]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'mais-pedidos' ? 'bg-[#ffd9de]' : ''}`}>
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Destaques</span>
        </button>

        {/* Carrinho / Sacola */}
        <button
          onClick={() => {
            onNavigate('carrinho');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'carrinho'
              ? 'text-[#9c3e54] font-bold scale-105'
              : 'text-[#877274] hover:text-[#1d1b19]'
          }`}
        >
          <div className={`relative p-1 rounded-lg ${currentTab === 'carrinho' ? 'bg-[#ffd9de]' : ''}`}>
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#9c3e54] text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Sacola</span>
        </button>

        {/* Meus Pedidos */}
        <button
          onClick={() => {
            onNavigate('rastreio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'rastreio'
              ? 'text-[#9c3e54] font-bold scale-105'
              : 'text-[#877274] hover:text-[#1d1b19]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentTab === 'rastreio' ? 'bg-[#ffd9de]' : ''}`}>
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Pedidos</span>
        </button>

        {/* Admin or Perfil */}
        {userRole === 'admin' ? (
          <button
            onClick={() => {
              onNavigate('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'admin'
                ? 'text-[#311309] font-bold scale-105'
                : 'text-[#877274] hover:text-[#1d1b19]'
            }`}
          >
            <div className={`relative p-1 rounded-lg ${currentTab === 'admin' ? 'bg-[#311309] text-[#ffd9de]' : 'bg-[#ffd9de]/50 text-[#9c3e54]'}`}>
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => {
              onNavigate('auth');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'auth'
                ? 'text-[#9c3e54] font-bold scale-105'
                : 'text-[#877274] hover:text-[#1d1b19]'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentTab === 'auth' ? 'bg-[#ffd9de]' : ''}`}>
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">
              {isLoggedIn ? 'Perfil' : 'Entrar'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
