import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  Star, 
  Sparkles, 
  Store,
  UserCheck,
  UserPlus,
  MapPin,
  Phone,
  AlertCircle,
  Search,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { User, Customer, Address } from '../types';
import { BrandLogo } from './BrandLogo';

interface AuthScreenProps {
  customers: Customer[];
  onLoginSuccess: (user: User, newCustomerProfile?: Customer, newAddress?: Address) => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  customers,
  onLoginSuccess,
  onContinueAsGuest
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  
  // Basic info
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  
  // Complete Delivery Address fields for registration
  const [cep, setCep] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [complement, setComplement] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [referencePoint, setReferencePoint] = useState<string>('');
  const [isSearchingCep, setIsSearchingCep] = useState<boolean>(false);
  const [cepSuccessMsg, setCepSuccessMsg] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [socialModalOpen, setSocialModalOpen] = useState<'Google' | 'Apple' | null>(null);
  const [socialName, setSocialName] = useState<string>('');
  const [socialEmail, setSocialEmail] = useState<string>('');

  // Dedicated admin credentials
  const ADMIN_EMAILS = [
    'admin@felicitadoces.com.br',
    'admin@lucycandy.com',
    'admin@admin.com'
  ];
  const ADMIN_PASSWORDS = ['admin', 'admin123', 'admin2024', '123456'];

  const normalizedEmail = email.toLowerCase().trim();
  const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.startsWith('admin@');
  const matchingCustomer = customers.find(c => c.email.toLowerCase() === normalizedEmail);

  // Address string for dynamic real-time map preview
  const hasTypedAddress = Boolean(street || neighborhood || city || cep);
  const formattedAddressForMap = hasTypedAddress
    ? `${street || ''} ${number || ''}, ${neighborhood || ''}, ${city || 'São Paulo'} - ${state || 'SP'}, Brasil`
    : 'São Paulo, SP, Brasil';
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(formattedAddressForMap)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  // Automatic ViaCEP lookup when user types 8 digits
  const handleCepSearch = async (cepValue: string) => {
    const clean = cepValue.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      setCepSuccessMsg(null);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) setCity(data.localidade);
          if (data.uf) setState(data.uf);
          setCepSuccessMsg(`Endereço localizado: ${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
          setTimeout(() => setCepSuccessMsg(null), 4000);
        }
      } catch (err) {
        // silent fail on network error
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCep(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      handleCepSearch(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!normalizedEmail) {
      setFormError('Por favor informe seu e-mail.');
      return;
    }

    if (!password) {
      setFormError('Por favor informe sua senha.');
      return;
    }

    // 1. Check if it is the Administrator
    if (isAdminEmail) {
      if (!ADMIN_PASSWORDS.includes(password) && password !== 'admin') {
        setFormError('Senha de administrador incorreta.');
        return;
      }

      const adminUser: User = {
        id: 'usr-admin-master',
        name: 'Administrador Felicitá',
        email: normalizedEmail,
        phone: '(11) 98765-4321',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(adminUser);
      return;
    }

    // 2. Register Mode: Create brand new customer profile with complete delivery address and map location
    if (isRegisterMode) {
      if (!name.trim()) {
        setFormError('Por favor informe seu nome completo.');
        return;
      }

      if (!street.trim() || !number.trim()) {
        setFormError('Por favor preencha rua e número para entrega dos seus pedidos.');
        return;
      }

      const newAddress: Address = {
        id: 'addr-' + Date.now(),
        title: 'Endereço Principal',
        postalCode: cep.trim() || '01310-100',
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim() || 'Centro',
        city: city.trim() || 'São Paulo',
        state: state.trim() || 'SP',
        referencePoint: referencePoint.trim(),
        isDefault: true
      };

      const newCust: Customer = {
        id: 'cust-' + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim() || '(11) 99999-0000',
        city: `${neighborhood.trim() ? `${neighborhood.trim()} • ` : ''}${city.trim() || 'São Paulo'}`,
        address: newAddress,
        ordersCount: 0,
        totalSpent: 0,
        isActive: true,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };

      const newUser: User = {
        id: newCust.id,
        name: newCust.name,
        email: newCust.email,
        phone: newCust.phone,
        role: 'customer',
        createdAt: new Date().toISOString()
      };

      onLoginSuccess(newUser, newCust, newAddress);
      return;
    }

    // 3. Login Mode
    // If email matches existing customer
    if (matchingCustomer) {
      const loggedUser: User = {
        id: matchingCustomer.id,
        name: matchingCustomer.name,
        email: matchingCustomer.email,
        phone: matchingCustomer.phone,
        role: 'customer',
        createdAt: matchingCustomer.createdAt
      };
      onLoginSuccess(loggedUser, matchingCustomer, matchingCustomer.address);
      return;
    }

    // If new email logged in without register tab:
    const displayName = name.trim() || (
      normalizedEmail.split('@')[0]
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    );

    const fallbackAddress: Address = {
      id: 'addr-' + Date.now(),
      title: 'Endereço Principal',
      postalCode: cep || '01310-100',
      street: street || 'Av. Paulista',
      number: number || '1000',
      complement: complement || 'Apto 82',
      neighborhood: neighborhood || 'Bela Vista',
      city: city || 'São Paulo',
      state: state || 'SP',
      referencePoint: referencePoint || '',
      isDefault: true
    };

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: displayName,
      email: normalizedEmail,
      phone: phone.trim() || '(11) 99999-0000',
      city: `${neighborhood ? `${neighborhood} • ` : ''}${city || 'São Paulo'}`,
      address: fallbackAddress,
      ordersCount: 0,
      totalSpent: 0,
      isActive: true,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    const newUser: User = {
      id: newCust.id,
      name: newCust.name,
      email: newCust.email,
      phone: newCust.phone,
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    onLoginSuccess(newUser, newCust, fallbackAddress);
  };

  const handleSocialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialEmail || !socialName) return;

    const emailNorm = socialEmail.toLowerCase().trim();
    const existing = customers.find(c => c.email.toLowerCase() === emailNorm);

    if (existing) {
      onLoginSuccess({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: 'customer',
        createdAt: existing.createdAt
      }, existing, existing.address);
    } else {
      const defAddr: Address = {
        id: 'addr-' + Date.now(),
        title: 'Endereço Principal',
        postalCode: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        complement: '',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        isDefault: true
      };

      const newCust: Customer = {
        id: 'cust-' + Date.now(),
        name: socialName.trim(),
        email: emailNorm,
        phone: '(11) 99999-0000',
        city: 'São Paulo - SP',
        address: defAddr,
        ordersCount: 0,
        totalSpent: 0,
        isActive: true,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      onLoginSuccess({
        id: newCust.id,
        name: newCust.name,
        email: newCust.email,
        phone: newCust.phone,
        role: 'customer',
        createdAt: new Date().toISOString()
      }, newCust, defAddr);
    }
    setSocialModalOpen(null);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        
        {/* LEFT COLUMN: Sensory Bakery Atmosphere & Testimonial */}
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
                className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-4">
                <div className="flex items-center gap-3 text-white">
                  <span className="material-symbols-outlined text-[#e87a90] text-[26px]">local_fire_department</span>
                  <div>
                    <p className="text-sm font-bold leading-tight">Fornada do Dia</p>
                    <p className="text-[11px] text-white/80">Cookies e brownies quentinhos artesanais</p>
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
                  Clube de Clientes Felicitá
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

        {/* RIGHT COLUMN: Real Dynamic Login & Register with Live Map Address */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center">
          <div className="w-full max-w-xl bg-white rounded-3xl p-7 sm:p-9 shadow-[0_12px_40px_-8px_rgba(61,28,18,0.08)] border border-pink-100/60 flex flex-col">
            
            {/* OFFICIAL LOGO */}
            <div className="flex flex-col items-center text-center mb-5">
              <BrandLogo variant="badge" className="mb-2" />
              <h1 className="text-2xl font-bold text-[#1d1b19] font-heading">
                {isRegisterMode ? 'Criar Conta com Endereço' : 'Entrar na sua Conta'}
              </h1>
              <p className="text-xs text-[#554245] mt-1 max-w-sm">
                {isRegisterMode
                  ? 'Informe seus dados e endereço completo. O mapa será atualizado automaticamente com a sua localização!'
                  : 'Acesse com seu e-mail cadastrado ou faça login administrativo.'}
              </p>
            </div>

            {/* TAB TOGGLE: ENTRAR / CRIAR CONTA */}
            <div className="flex p-1 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/40 mb-5">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setFormError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isRegisterMode
                    ? 'bg-white text-[#9c3e54] shadow-sm'
                    : 'text-[#7f5347] hover:text-[#1d1b19]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar na Conta</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setFormError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isRegisterMode
                    ? 'bg-white text-[#9c3e54] shadow-sm'
                    : 'text-[#7f5347] hover:text-[#1d1b19]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Nova Conta</span>
              </button>
            </div>

            {/* Form Error Notice */}
            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Dynamic Live Notice about entered email */}
            {normalizedEmail && (
              <div className="mb-3 px-3 py-2 rounded-xl text-[11px] font-medium flex items-center gap-2">
                {isAdminEmail ? (
                  <span className="text-[#311309] bg-[#ffd9de]/80 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 w-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9c3e54]" />
                    🔑 Acesso de Administrador (abre o Painel de Gestão)
                  </span>
                ) : matchingCustomer ? (
                  <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 w-full border border-emerald-200">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Perfil cadastrado: <strong>{matchingCustomer.name}</strong> ({matchingCustomer.city})
                  </span>
                ) : null}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* DADOS BÁSICOS */}
              {isRegisterMode && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#1d1b19]">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required={isRegisterMode}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#1d1b19]">E-mail</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#7f5347] absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="seuemail@exemplo.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] transition-all"
                    />
                  </div>
                </div>

                {/* Telefone/WhatsApp */}
                {isRegisterMode ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#1d1b19]">WhatsApp / Telefone</label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-[#7f5347] absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        placeholder="(11) 98765-4321"
                        className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                  </div>
                ) : (
                  /* Password in login mode */
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#1d1b19] flex items-center justify-between">
                      <span>Senha</span>
                      {isAdminEmail && (
                        <span className="text-[10px] text-[#9c3e54] font-bold">Admin: admin</span>
                      )}
                    </label>
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
                )}
              </div>

              {/* Password in Register Mode */}
              {isRegisterMode && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#1d1b19]">Crie uma Senha de Acesso</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#7f5347] absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
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
              )}

              {/* =========================================================================
                  SEÇÃO DE ENDEREÇO COM MAPA INTERATIVO EM TEMPO REAL
                 ========================================================================= */}
              {isRegisterMode && (
                <div className="mt-2 pt-4 border-t border-[#f2ede8] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#1d1b19] uppercase tracking-wider">
                          Endereço para Entregas & Localização no Mapa
                        </h3>
                        <p className="text-[11px] text-[#7f5347]">
                          O mapa abaixo se atualiza em tempo real enquanto você digita seu endereço.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CEP Input with search */}
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19] uppercase">
                        CEP (Busca Automática)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={cep}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="w-full px-4 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                        />
                        {isSearchingCep && (
                          <span className="absolute right-3 text-[10px] text-[#9c3e54] font-bold animate-pulse">
                            Buscando...
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCepSearch(cep)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#f2ede8] hover:bg-[#ece7e2] text-xs font-bold text-[#554245] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 text-[#7f5347]" />
                      <span>Buscar CEP</span>
                    </button>
                  </div>

                  {cepSuccessMsg && (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                      {cepSuccessMsg}
                    </div>
                  )}

                  {/* Street & Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        required={isRegisterMode}
                        placeholder="Ex: Av. Paulista"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={e => setNumber(e.target.value)}
                        required={isRegisterMode}
                        placeholder="1000"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                  </div>

                  {/* Complement & Neighborhood */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">Complemento / Apto</label>
                      <input
                        type="text"
                        value={complement}
                        onChange={e => setComplement(e.target.value)}
                        placeholder="Apto 82, Bloco B"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">Bairro</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={e => setNeighborhood(e.target.value)}
                        placeholder="Bela Vista"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">Cidade</label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">Estado (UF)</label>
                      <input
                        type="text"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        placeholder="SP"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                  </div>

                  {/* Reference Point */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#1d1b19]">Ponto de Referência</label>
                    <input
                      type="text"
                      value={referencePoint}
                      onChange={e => setReferencePoint(e.target.value)}
                      placeholder="Ex: Próximo à estação do metrô, portaria 24h"
                      className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                    />
                  </div>

                  {/* =========================================================================
                      MAP PREVIEW CONTAINER (UPDATES IN REAL TIME)
                     ========================================================================= */}
                  <div className="mt-2 rounded-2xl overflow-hidden border-2 border-[#dac0c3]/50 bg-[#f8f3ee] shadow-sm flex flex-col">
                    <div className="p-2.5 bg-white border-b border-[#dac0c3]/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#9c3e54] font-bold">
                        <Navigation className="w-3.5 h-3.5 animate-bounce" />
                        <span className="truncate max-w-[280px] sm:max-w-md">
                          {formattedAddressForMap}
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddressForMap)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline shrink-0"
                      >
                        <span>Abrir Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="relative w-full h-44 sm:h-52 bg-stone-100">
                      <iframe
                        key={formattedAddressForMap}
                        title="Mapa de Localização do Endereço de Entrega"
                        src={mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-stone-200 text-[10px] text-[#1d1b19] font-bold flex items-center gap-1 pointer-events-none">
                        <MapPin className="w-3 h-3 text-[#9c3e54]" />
                        <span>Ponto de entrega atualizado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={() => alert('Link de recuperação enviado para o e-mail informado.')}
                    className="text-xs text-[#9c3e54] font-semibold hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-6 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_-2px_rgba(156,62,84,0.4)] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>
                  {isAdminEmail
                    ? 'Acessar Painel do Administrador'
                    : isRegisterMode
                    ? 'Criar Conta com Endereço'
                    : matchingCustomer
                    ? `Entrar como ${matchingCustomer.name.split(' ')[0]}`
                    : 'Entrar na Conta'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full h-px bg-[#f2ede8]"></div>
              <span className="absolute px-3 bg-white text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                ou acesse com
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSocialModalOpen('Google')}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#f8f3ee] hover:bg-[#f2ede8] text-xs font-bold text-[#1d1b19] border border-[#dac0c3]/30 cursor-pointer"
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => setSocialModalOpen('Apple')}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#f8f3ee] hover:bg-[#f2ede8] text-xs font-bold text-[#1d1b19] border border-[#dac0c3]/30 cursor-pointer"
              >
                <span>Apple</span>
              </button>
            </div>

            {onContinueAsGuest && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="inline-flex items-center gap-1.5 text-xs text-[#7f5347] hover:text-[#1d1b19] font-semibold py-1 px-3 rounded-full hover:bg-[#f8f3ee] transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Continuar navegando sem login</span>
                </button>
              </div>
            )}

            <div className="mt-5 pt-4 bg-[#fcf9f6] -mx-7 -mb-7 sm:-mx-9 sm:-mb-9 px-6 py-4 rounded-b-3xl border-t border-[#f2ede8] flex flex-col items-center gap-1 text-center">
              <p className="text-xs text-[#554245]">
                {isRegisterMode ? 'Já possui cadastro?' : 'Ainda não tem cadastro?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setFormError(null);
                  }}
                  className="text-xs text-[#9c3e54] font-bold hover:underline ml-1.5 cursor-pointer"
                >
                  {isRegisterMode ? 'Fazer Login' : 'Cadastrar novo cliente com endereço'}
                </button>
              </p>
              <div className="flex items-center gap-1 text-[#877274] text-[10px] pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7f5347]" />
                <span>Vinculado em tempo real ao cadastro do Painel Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Login Modal */}
      {socialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-[#1d1b19] font-heading">
              Acessar com {socialModalOpen}
            </h3>
            <p className="text-xs text-[#554245]">
              Informe seu nome e e-mail para conectar sua conta {socialModalOpen} e salvar seus pedidos no painel:
            </p>
            <form onSubmit={handleSocialSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#7f5347] uppercase">Seu Nome</label>
                <input
                  type="text"
                  value={socialName}
                  onChange={e => setSocialName(e.target.value)}
                  required
                  placeholder="Ex: Seu Nome Completo"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#7f5347] uppercase">E-mail {socialModalOpen}</label>
                <input
                  type="email"
                  value={socialEmail}
                  onChange={e => setSocialEmail(e.target.value)}
                  required
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSocialModalOpen(null)}
                  className="px-4 py-2 rounded-full bg-[#f2ede8] text-xs font-semibold text-[#554245]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b]"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
