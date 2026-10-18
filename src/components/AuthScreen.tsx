import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Heart, Star, Sparkles, Store } from 'lucide-react';
import { User } from '../types';
import { BrandLogo } from './BrandLogo';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onContinueAsGuest
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('mariana.vasconcellos@exemplo.com');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('Mariana Vasconcellos');
  const [phone, setPhone] = useState<string>('(11) 98765-4321');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Dedicated admin credentials
  const ADMIN_EMAIL = 'admin@felicitadoces.com.br';
  const ADMIN_PASSWORD_1 = 'admin123';
  const ADMIN_PASSWORD_2 = 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Por favor, informe seu e-mail e senha.');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the credentials correspond to the administrator
    if (
      normalizedEmail === ADMIN_EMAIL &&
      (password === ADMIN_PASSWORD_1 || password === ADMIN_PASSWORD_2)
    ) {
      const adminUser: User = {
        id: 'usr-admin-master',
        name: 'Administrador Felicitá',
        email: ADMIN_EMAIL,
        phone: '(11) 98765-4321',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(adminUser);
      return;
    }

    // Otherwise, log in as regular customer
    const customerUser: User = {
      id: 'usr-client-' + Date.now(),
      name: isRegisterMode ? name : 'Mariana Vasconcellos',
      email: normalizedEmail,
      phone,
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    onLoginSuccess(customerUser);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* LEFT COLUMN: Warm Branding & Sensory Bakery Atmosphere */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-[#fdf6f0] p-8 sm:p-10 relative overflow-hidden shadow-sm border border-[#fec4b4]/30">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#fec4b4]/40 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[#ffd9de]/50 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#fec4b4]/80 text-[#7a4f42] text-[10px] tracking-wider uppercase font-bold">
                Momentos de Afeto
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl text-[#1d1b19] font-bold leading-tight font-heading">
              O doce momento do seu dia começa aqui.
            </h2>
            <p className="text-xs sm:text-sm text-[#7f5347] leading-relaxed">
              Receitas de família, chocolates de origem nobre e o aroma reconfortante de forno aceso te esperando.
            </p>
          </div>

          <div className="relative z-10 my-6 flex flex-col gap-4">
            <div className="relative group rounded-2xl overflow-hidden shadow-md">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuDTYkU83Hf_Q97jAHGMf2F4eQgXy3ro-H9gb6zusTtxsLmZoOAhdO-zLXitOdr4BT73P_FaaDcQ_j02q3sOHUsGV5d248v_t-uQWG_yihpQKmirY2JyBQof_yokUk5J2nlCsJnz8_2_8XLztL2s2ZkYcBCdm5GsZgP_wvRDLsfszE1J7mjNlCvHQm9CaCJWPGPmPtK9xW1jKRXcNwG59x72B3ccryMe2FAsr4NLPkbrdkeAAt09Fs6A"
                alt="Fornada de cookies saindo do forno"
                className="w-full h-52 sm:h-60 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-4">
                <div className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-[#e87a90] text-[26px]">local_fire_department</span>
                  <div>
                    <p className="text-sm font-bold leading-tight">Fornada da Tarde</p>
                    <p className="text-[11px] text-white/80">Cookies recheados saindo quentinhos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-sm flex items-start gap-3 border border-[#fec4b4]/20">
              <div className="w-9 h-9 rounded-full bg-[#fec4b4]/60 text-[#9c3e54] flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 fill-current text-[#9c3e54]" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-[#1d1b19] italic leading-relaxed">
                  "O melhor brownie com caramelo salgado de São Paulo. A textura e o carinho na embalagem são mágicos."
                </p>
                <span className="text-[10px] text-[#7f5347] uppercase font-bold">
                  Mariana Vasconcellos • Cliente Clube Felicitá
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between pt-2 gap-3 text-[#7f5347] border-t border-[#fec4b4]/30 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#9c3e54]" />
              <span>100% Manteiga & Cacau Puro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#9c3e54] text-[18px]">moped</span>
              <span>Entrega Rápida Climatizada</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Single, Unified Login & Register Form */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center">
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-[0_12px_40px_-8px_rgba(61,28,18,0.08)] border border-pink-100/60 flex flex-col">
            
            {/* OFFICIAL LOGO */}
            <div className="flex flex-col items-center text-center mb-6">
              <BrandLogo variant="badge" className="mb-2" />
              <h1 className="text-2xl font-bold text-[#1d1b19] font-heading">
                {isRegisterMode ? 'Crie sua Conta Felicitá' : 'Bem-vindo à Felicitá!'}
              </h1>
              <p className="text-xs text-[#554245] mt-1 max-w-xs">
                {isRegisterMode
                  ? 'Cadastre-se para receber novidades exclusivas e acompanhar suas entregas.'
                  : 'Entre para pedir seus doces favoritos, salvar itens especiais e acompanhar seus pedidos em tempo real.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {isRegisterMode && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#1d1b19]">Nome Completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Mariana Vasconcellos"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#1d1b19]">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#1d1b19] flex items-center justify-between">
                  <span>E-mail</span>
                  <span className="text-[10px] text-[#7f5347] uppercase font-normal tracking-wider">
                    Acesso
                  </span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#7f5347] absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#1d1b19]">Senha</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#7f5347] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#7f5347] hover:text-[#9c3e54] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#9c3e54] accent-[#9c3e54] cursor-pointer"
                  />
                  <span className="text-xs text-[#554245]">Lembrar de mim</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Um link de redefinição segura de senha foi enviado para o seu e-mail cadastrado.')}
                  className="text-xs text-[#9c3e54] font-semibold hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-6 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_-2px_rgba(156,62,84,0.4)] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>{isRegisterMode ? 'Criar Conta' : 'Entrar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full h-px bg-[#f2ede8]"></div>
              <span className="absolute px-3 bg-white text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                ou continue com
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onLoginSuccess({
                    id: 'usr-google-1',
                    name: 'Mariana Vasconcellos',
                    email: 'mariana.vasconcellos@gmail.com',
                    role: 'customer',
                    createdAt: new Date().toISOString()
                  });
                }}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#f8f3ee] hover:bg-[#f2ede8] text-xs font-bold text-[#1d1b19] border border-[#dac0c3]/30 cursor-pointer"
              >
                <span>Google</span>
              </button>
              <button
                onClick={() => {
                  onLoginSuccess({
                    id: 'usr-apple-1',
                    name: 'Mariana Vasconcellos',
                    email: 'mariana.vasconcellos@icloud.com',
                    role: 'customer',
                    createdAt: new Date().toISOString()
                  });
                }}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#f8f3ee] hover:bg-[#f2ede8] text-xs font-bold text-[#1d1b19] border border-[#dac0c3]/30 cursor-pointer"
              >
                <span>Apple</span>
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={onContinueAsGuest}
                className="inline-flex items-center gap-1.5 text-xs text-[#7f5347] hover:text-[#1d1b19] font-semibold py-1 px-3 rounded-full hover:bg-[#f8f3ee] transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Continuar como visitante</span>
              </button>
            </div>

            <div className="mt-5 pt-4 bg-[#fcf9f6] -mx-8 -mb-8 sm:-mx-10 sm:-mb-10 px-6 py-4 rounded-b-3xl border-t border-[#f2ede8] flex flex-col items-center gap-1 text-center">
              <p className="text-xs text-[#554245]">
                {isRegisterMode ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs text-[#9c3e54] font-bold hover:underline ml-1.5 cursor-pointer"
                >
                  {isRegisterMode ? 'Fazer Login' : 'Criar minha conta'}
                </button>
              </p>
              <div className="flex items-center gap-1 text-[#877274] text-[10px] pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7f5347]" />
                <span>Ambiente 100% seguro • Seus dados protegidos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
