import React, { useState } from 'react';
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
  UserCheck, 
  UserPlus, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Search, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { User, Customer, Address } from '../types';
import { BrandLogo } from './BrandLogo';
import { api } from '../services/syncService';

interface AuthScreenProps {
  customers: Customer[];
  onLoginSuccess: (user: User, newCustomerProfile?: Customer, newAddress?: Address) => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const AuthScreen: React.FC<AuthScreenProps> = ({
  customers,
  onLoginSuccess
}) => {
  // Mode: register by default so new customers complete requirements
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(true);
  
  // Basic info
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  
  // Delivery Address fields
  const [cep, setCep] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [complement, setComplement] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [city, setCity] = useState<string>('São Paulo');
  const [state, setState] = useState<string>('SP');
  const [referencePoint, setReferencePoint] = useState<string>('');
  const [isSearchingCep, setIsSearchingCep] = useState<boolean>(false);
  const [cepSuccessMsg, setCepSuccessMsg] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [socialModalOpen, setSocialModalOpen] = useState<'Google' | 'Apple' | null>(null);
  const [socialName, setSocialName] = useState<string>('');
  const [socialEmail, setSocialEmail] = useState<string>('');

  // Dedicated admin credentials
  const ADMIN_EMAILS = [
    'admin@felicitadoces.com.br',
    'admin@felicita.com',
    'admin@lucycandy.com',
    'admin@admin.com'
  ];
  const ADMIN_PASSWORDS = ['admin', 'admin123', 'admin2024', '123456'];

  const normalizedEmail = email.toLowerCase().trim();
  const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.startsWith('admin@');
  const matchingCustomer = customers.find(c => c.email.toLowerCase() === normalizedEmail);

  // Live validation helpers
  const cleanPhoneDigits = phone.replace(/\D/g, '');
  const cleanCepDigits = cep.replace(/\D/g, '');
  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);
  const isPhoneValid = cleanPhoneDigits.length >= 10 && cleanPhoneDigits.length <= 11;
  const isCepValid = cleanCepDigits.length === 8;

  // Phone input formatting with mask
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 6 && raw.length <= 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    } else if (raw.length > 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setPhone(formatted);
  };

  // CEP search with ViaCEP
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
          setTimeout(() => setCepSuccessMsg(null), 4500);
        } else {
          setCepSuccessMsg('CEP não localizado nos Correios. Preencha os campos manualmente.');
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
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    setCep(formatted);
    if (raw.length === 8) {
      handleCepSearch(raw);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      // 1. Mandatory Valid Email for both Login & Register
      if (!normalizedEmail) {
        setFormError('Por favor informe seu e-mail.');
        setIsSubmitting(false);
        return;
      }

      if (!isEmailValid) {
        setFormError('Por favor informe um e-mail válido (exemplo: usuario@email.com).');
        setIsSubmitting(false);
        return;
      }

      if (!password) {
        setFormError('Por favor informe sua senha.');
        setIsSubmitting(false);
        return;
      }

      // 2. Administrator Access
      if (isAdminEmail) {
        if (!ADMIN_PASSWORDS.includes(password) && password !== 'admin') {
          setFormError('Senha de administrador incorreta.');
          setIsSubmitting(false);
          return;
        }

        try {
          const res = await api.login(normalizedEmail, password);
          if (res && res.success && res.user) {
            onLoginSuccess(res.user, undefined, res.address);
            return;
          }
        } catch (e) {}

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

      // 3. Register Mode: Strictly validate Name, Valid Email, Valid Phone and Complete Address
      if (isRegisterMode) {
        if (!name.trim() || name.trim().length < 2) {
          setFormError('Por favor informe seu nome completo.');
          setIsSubmitting(false);
          return;
        }

        if (!isPhoneValid) {
          setFormError('O telefone / WhatsApp é obrigatório e deve conter DDD válido com 10 ou 11 dígitos (ex: (11) 98765-4321).');
          setIsSubmitting(false);
          return;
        }

        if (!isCepValid) {
          setFormError('O CEP de entrega é obrigatório e deve possuir 8 dígitos.');
          setIsSubmitting(false);
          return;
        }

        if (!street.trim()) {
          setFormError('A rua / logradouro do endereço de entrega é obrigatória.');
          setIsSubmitting(false);
          return;
        }

        if (!number.trim()) {
          setFormError('O número do endereço de entrega é obrigatório.');
          setIsSubmitting(false);
          return;
        }

        if (!neighborhood.trim()) {
          setFormError('O bairro do endereço de entrega é obrigatório.');
          setIsSubmitting(false);
          return;
        }

        if (!city.trim()) {
          setFormError('A cidade do endereço de entrega é obrigatória.');
          setIsSubmitting(false);
          return;
        }

        if (!state.trim()) {
          setFormError('O estado (UF) do endereço de entrega é obrigatório.');
          setIsSubmitting(false);
          return;
        }

        if (password.length < 6) {
          setFormError('A senha deve ter no mínimo 6 caracteres.');
          setIsSubmitting(false);
          return;
        }

        const newAddress: Address = {
          id: 'addr-' + Date.now(),
          title: 'Endereço Principal',
          postalCode: cep.trim(),
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          referencePoint: referencePoint.trim(),
          isDefault: true
        };

        const res = await api.register({
          name: name.trim(),
          email: normalizedEmail,
          password,
          phone: phone.trim(),
          address: newAddress
        });

        if (res && res.success && res.user) {
          onLoginSuccess(res.user, res.customer, res.address || newAddress);
          return;
        } else if (res && res.message) {
          setFormError(res.message);
          setIsSubmitting(false);
          return;
        }

        // Fallback for offline mode if all mandatory fields were verified
        const newCust: Customer = {
          id: 'cust-' + Date.now(),
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          city: `${neighborhood.trim()} • ${city.trim()}`,
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

      // 4. Login Mode (Already registered users)
      const res = await api.login(normalizedEmail, password);

      if (res && res.success && res.user) {
        // Verify customer has phone and address
        if (res.user.role === 'customer') {
          const resolvedAddress = res.address || res.customer?.address;
          if (!resolvedAddress || !resolvedAddress.street || !res.user.phone) {
            setFormError('Seu cadastro precisa ser atualizado com telefone e endereço completo de entrega.');
            setIsRegisterMode(true);
            setIsSubmitting(false);
            return;
          }
        }
        onLoginSuccess(res.user, res.customer, res.address);
        return;
      } else if (res && (res.requiresRegistration || res.status === 404)) {
        setFormError('Cadastro não localizado para este e-mail. A entrada só é permitida após cadastro como cliente com e-mail válido, telefone e endereço completo.');
        setIsSubmitting(false);
        return;
      } else if (res && res.message) {
        setFormError(res.message);
        setIsSubmitting(false);
        return;
      }

      // Local customer check if server is unreachable
      if (matchingCustomer && matchingCustomer.address && matchingCustomer.phone) {
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

      // Unregistered user in login mode: BLOCK ACCESS and demand registration
      setFormError('E-mail não cadastrado. É obrigatório criar uma conta com e-mail válido, telefone e endereço completo para ter acesso ao sistema.');
      setIsSubmitting(false);
    } catch (err) {
      setFormError('Ocorreu um erro ao processar sua requisição. Verifique seus dados.');
      setIsSubmitting(false);
    }
  };

  // Social Login handler: fills in name and email, then guides user to complete mandatory phone and address
  const handleSocialConnect = (provider: 'Google' | 'Apple') => {
    setSocialModalOpen(provider);
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialEmail || !socialName) return;

    const emailNorm = socialEmail.toLowerCase().trim();
    if (!EMAIL_REGEX.test(emailNorm)) {
      alert('Por favor informe um e-mail válido.');
      return;
    }

    const existing = customers.find(c => c.email.toLowerCase() === emailNorm);
    if (existing && existing.address && existing.phone) {
      onLoginSuccess({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: 'customer',
        createdAt: existing.createdAt
      }, existing, existing.address);
      setSocialModalOpen(null);
      return;
    }

    // Pre-fill registration form with Social account data
    setName(socialName.trim());
    setEmail(emailNorm);
    setIsRegisterMode(true);
    setSocialModalOpen(null);
    setFormError('Conta conectada! Para autorizar sua entrada no sistema, preencha agora seu telefone/WhatsApp e endereço completo de entrega.');
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Bakery Atmosphere, Balanced Proportion Image & Value Card */}
        <div className="lg:col-span-5 flex flex-col gap-5 rounded-3xl bg-[#fdf6f0] p-6 sm:p-7 relative overflow-hidden shadow-sm border border-[#fec4b4]/30 lg:sticky lg:top-6">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#fec4b4]/35 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-[#ffd9de]/40 blur-3xl pointer-events-none"></div>

          {/* Heading block */}
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#fec4b4]/80 text-[#7a4f42] text-[10px] tracking-wider uppercase font-bold">
                Confeitaria Artesanal
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl text-[#1d1b19] font-bold leading-tight font-heading">
              Dolce Felicitá
            </h2>
            <p className="text-xs text-[#7f5347] leading-relaxed">
              Cookies dourados, recheios nobres e doces artesanais feitos todos os dias com afeto.
            </p>
          </div>

          {/* Adjusted Image with Natural 16:10 Ratio & Balanced Framing */}
          <div className="relative z-10 flex flex-col gap-3">
            <div className="relative group rounded-2xl overflow-hidden shadow-sm border border-[#fec4b4]/40 aspect-[16/10] w-full bg-stone-100">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuDTYkU83Hf_Q97jAHGMf2F4eQgXy3ro-H9gb6zusTtxsLmZoOAhdO-zLXitOdr4BT73P_FaaDcQ_j02q3sOHUsGV5d248v_t-uQWG_yihpQKmirY2JyBQof_yokUk5J2nlCsJnz8_2_8XLztL2s2ZkYcBCdm5GsZgP_wvRDLsfszE1J7mjNlCvHQm9CaCJWPGPmPtK9xW1jKRXcNwG59x72B3ccryMe2FAsr4NLPkbrdkeAAt09Fs6A"
                alt="Fornada de cookies frescos artesanais saindo do forno"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-3.5">
                <div className="flex items-center gap-2.5 text-white">
                  <div className="w-7 h-7 rounded-full bg-[#e87a90]/30 backdrop-blur-md flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#ffd9de] text-[18px]">local_fire_department</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Fornada do Dia</p>
                    <p className="text-[10px] text-white/80">Cookies e brownies quentinhos artesanais</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Quote Card */}
            <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-3.5 shadow-xs flex items-start gap-3 border border-[#fec4b4]/25">
              <div className="w-8 h-8 rounded-full bg-[#fec4b4]/60 text-[#9c3e54] flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-3.5 h-3.5 fill-current text-[#9c3e54]" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-[11px] text-[#1d1b19] italic leading-snug">
                  "O melhor cookie com chocolate belga de São Paulo. A embalagem e o capricho são impecáveis."
                </p>
                <span className="text-[9px] text-[#7f5347] uppercase font-bold tracking-wide">
                  Cliente Clube Felicitá
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Features */}
          <div className="relative z-10 grid grid-cols-2 gap-2 pt-2 border-t border-[#fec4b4]/30 text-[#7f5347] text-[11px] font-semibold">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9c3e54] shrink-0" />
              <span>Cacau & Manteiga Nobre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9c3e54] shrink-0" />
              <span>Entrega Climatizada</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Streamlined Registration & Login Form (No Maps iframe) */}
        <div className="lg:col-span-7 flex flex-col justify-center items-center w-full">
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_-8px_rgba(61,28,18,0.08)] border border-pink-100/60 flex flex-col">
            
            {/* LOGO */}
            <div className="flex flex-col items-center text-center mb-3">
              <BrandLogo variant="badge" className="mb-2" />
              <h1 className="text-xl sm:text-2xl font-bold text-[#1d1b19] font-heading">
                {isRegisterMode ? 'Cadastro Obrigatório de Cliente' : 'Acessar Conta de Cliente'}
              </h1>
              <p className="text-xs text-[#554245] mt-1 max-w-md">
                {isRegisterMode
                  ? 'Cadastre-se com e-mail válido, telefone e endereço para liberar a entrada no cardápio.'
                  : 'Entre com seu e-mail cadastrado e senha para acessar o cardápio e seus pedidos.'}
              </p>
            </div>

            {/* MANDATORY ACCESS BANNER */}
            <div className="mb-4 p-3 rounded-2xl bg-[#fff7ed] border border-amber-200 text-[#844018] text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold block text-amber-900">Acesso Restrito: Cadastro Obrigatório</span>
                Para garantir a correta entrega e rastreamento dos pedidos, apenas clientes com e-mail válido, telefone e endereço cadastrados podem acessar o sistema.
              </div>
            </div>

            {/* TAB TOGGLE */}
            <div className="flex p-1 rounded-2xl bg-[#f8f3ee] border border-[#dac0c3]/40 mb-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setFormError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isRegisterMode
                    ? 'bg-white text-[#9c3e54] shadow-sm'
                    : 'text-[#7f5347] hover:text-[#1d1b19]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>1. Criar Cadastro (Obrigatório)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setFormError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isRegisterMode
                    ? 'bg-white text-[#9c3e54] shadow-sm'
                    : 'text-[#7f5347] hover:text-[#1d1b19]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>2. Já sou Cadastrado</span>
              </button>
            </div>

            {/* Error Message with Call to Action */}
            {formError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="font-medium leading-relaxed">{formError}</span>
                </div>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setFormError(null);
                    }}
                    className="self-start mt-1 px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Fazer cadastro completo agora →
                  </button>
                )}
              </div>
            )}

            {/* Admin or Profile indicator */}
            {normalizedEmail && (
              <div className="mb-3 px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-2">
                {isAdminEmail ? (
                  <span className="text-[#311309] bg-[#ffd9de]/80 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 w-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9c3e54]" />
                    🔑 Acesso Administrativo Felicitá
                  </span>
                ) : matchingCustomer ? (
                  <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 w-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Cliente localizado: <strong>{matchingCustomer.name}</strong> ({matchingCustomer.phone})
                  </span>
                ) : null}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* NOME COMPLETO (Cadastro) */}
              {isRegisterMode && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1d1b19] flex items-center justify-between">
                    <span>Nome Completo <span className="text-rose-600">*</span></span>
                    {name.trim().length >= 2 && (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required={isRegisterMode}
                    placeholder="Ex: Maria Carolina da Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                  />
                </div>
              )}

              {/* EMAIL & TELEFONE / SENHA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Field with live format validation */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#1d1b19] flex items-center justify-between">
                    <span>E-mail <span className="text-rose-600">*</span></span>
                    {normalizedEmail && (
                      isEmailValid ? (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-semibold">Formato inválido</span>
                      )
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#7f5347] absolute left-3 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="seuemail@exemplo.com"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border ${
                        normalizedEmail && !isEmailValid ? 'border-rose-400 ring-1 ring-rose-200' : 'border-[#dac0c3]/40'
                      } focus:outline-none focus:ring-1 focus:ring-[#9c3e54] transition-all`}
                    />
                  </div>
                </div>

                {/* Telefone/WhatsApp (Obrigatório com validação) */}
                {isRegisterMode ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#1d1b19] flex items-center justify-between">
                      <span>WhatsApp / Telefone <span className="text-rose-600">*</span></span>
                      {cleanPhoneDigits.length > 0 && (
                        isPhoneValid ? (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-semibold">DDD + número</span>
                        )
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-[#7f5347] absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={phone}
                        onChange={handlePhoneChange}
                        required={isRegisterMode}
                        placeholder="(11) 98765-4321"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border ${
                          phone && !isPhoneValid ? 'border-rose-400' : 'border-[#dac0c3]/40'
                        } focus:outline-none focus:ring-1 focus:ring-[#9c3e54]`}
                      />
                    </div>
                  </div>
                ) : (
                  /* Password in login mode */
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#1d1b19] flex items-center justify-between">
                      <span>Senha <span className="text-rose-600">*</span></span>
                      {isAdminEmail && (
                        <span className="text-[10px] text-[#9c3e54] font-bold">Admin: admin</span>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-[#7f5347] absolute left-3 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="Digite sua senha"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#7f5347] hover:text-[#9c3e54] cursor-pointer"
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
                  <label className="text-xs font-bold text-[#1d1b19] flex items-center justify-between">
                    <span>Crie uma Senha de Acesso <span className="text-rose-600">*</span></span>
                    <span className="text-[10px] text-[#7f5347]">Mínimo 6 caracteres</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#7f5347] absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required={isRegisterMode}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#7f5347] hover:text-[#9c3e54] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  SEÇÃO DE ENDEREÇO OBRIGATÓRIO (SEM MAPS)
                 ========================================================================= */}
              {isRegisterMode && (
                <div className="mt-1 pt-3 border-t border-[#f2ede8] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#ffd9de] text-[#9c3e54] flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#1d1b19] uppercase tracking-wider flex items-center gap-1.5">
                          <span>Endereço de Entrega</span>
                          <span className="text-rose-600 font-extrabold">* Obrigatório</span>
                        </h3>
                        <p className="text-[11px] text-[#7f5347]">
                          Utilizado para entrega rápida e cálculo do frete.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CEP Input with ViaCEP Search */}
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19] uppercase flex items-center justify-between">
                        <span>CEP <span className="text-rose-600">*</span></span>
                        {isCepValid && (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                          </span>
                        )}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={cep}
                          onChange={handleCepChange}
                          required={isRegisterMode}
                          placeholder="00000-000"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
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
                      <label className="text-[11px] font-bold text-[#1d1b19]">
                        Rua / Logradouro <span className="text-rose-600">*</span>
                      </label>
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
                      <label className="text-[11px] font-bold text-[#1d1b19]">
                        Número <span className="text-rose-600">*</span>
                      </label>
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
                        placeholder="Apto 82, Bloco B (opcional)"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">
                        Bairro <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={e => setNeighborhood(e.target.value)}
                        required={isRegisterMode}
                        placeholder="Bela Vista"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">
                        Cidade <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        required={isRegisterMode}
                        placeholder="São Paulo"
                        className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#1d1b19]">
                        Estado (UF) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={e => setState(e.target.value.toUpperCase())}
                        required={isRegisterMode}
                        maxLength={2}
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
                      placeholder="Ex: Próximo ao metrô, portaria 24h (opcional)"
                      className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs text-[#1d1b19] border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                    />
                  </div>

                  {/* Clean Address Summary Confirmation Badge */}
                  {street.trim() && number.trim() && (
                    <div className="mt-1 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-[11px] font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Entrega em: <strong>{street}, {number}</strong> {complement ? `(${complement})` : ''} - {neighborhood}, {city}/{state}
                      </span>
                    </div>
                  )}
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
                  <span className="text-xs text-[#554245]">Lembrar meus dados</span>
                </label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={() => alert('Link de recuperação enviado para o e-mail cadastrado.')}
                    className="text-xs text-[#9c3e54] font-semibold hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-2 py-3 px-6 rounded-full bg-[#9c3e54] hover:bg-[#64132b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_-2px_rgba(156,62,84,0.4)] active:scale-[0.99] transition-all cursor-pointer ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <span>
                  {isSubmitting
                    ? 'Validando dados...'
                    : isAdminEmail
                    ? 'Acessar Painel do Administrador'
                    : isRegisterMode
                    ? 'Cadastrar e Autorizar Acesso ao Sistema'
                    : matchingCustomer
                    ? `Entrar como ${matchingCustomer.name.split(' ')[0]}`
                    : 'Entrar na Conta'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Social Connect Divider */}
            <div className="relative flex items-center justify-center my-3.5">
              <div className="w-full h-px bg-[#f2ede8]"></div>
              <span className="absolute px-3 bg-white text-[10px] text-[#7f5347] uppercase font-bold tracking-wider">
                ou conecte com
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialConnect('Google')}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#f8f3ee] hover:bg-[#f2ede8] text-xs font-bold text-[#1d1b19] border border-[#dac0c3]/30 cursor-pointer"
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialConnect('Apple')}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#f8f3ee] hover:bg-[#f2ede8] text-xs font-bold text-[#1d1b19] border border-[#dac0c3]/30 cursor-pointer"
              >
                <span>Apple</span>
              </button>
            </div>

            <div className="mt-4 pt-4 bg-[#fcf9f6] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 px-6 py-4 rounded-b-3xl border-t border-[#f2ede8] flex flex-col items-center gap-1 text-center">
              <p className="text-xs text-[#554245]">
                {isRegisterMode ? 'Já possui cadastro completo?' : 'Ainda não é cadastrado?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setFormError(null);
                  }}
                  className="text-xs text-[#9c3e54] font-bold hover:underline ml-1.5 cursor-pointer"
                >
                  {isRegisterMode ? 'Fazer Login' : 'Cadastre-se com telefone e endereço'}
                </button>
              </p>
              <div className="flex items-center gap-1 text-[#877274] text-[10px] pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7f5347]" />
                <span>Dados protegidos e sincronizados com o servidor PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Modal to collect or verify account */}
      {socialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#dac0c3]/40 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-[#1d1b19] font-heading">
              Conectar com {socialModalOpen}
            </h3>
            <p className="text-xs text-[#554245]">
              Informe seu nome e e-mail. Para clientes novos, será necessário confirmar o telefone e endereço de entrega antes de entrar no sistema:
            </p>
            <form onSubmit={handleSocialSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#7f5347] uppercase">Seu Nome Completo</label>
                <input
                  type="text"
                  value={socialName}
                  onChange={e => setSocialName(e.target.value)}
                  required
                  placeholder="Ex: Maria Carolina"
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
                  placeholder="seuemail@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f3ee] text-xs border border-[#dac0c3]/40 focus:outline-none focus:ring-1 focus:ring-[#9c3e54]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSocialModalOpen(null)}
                  className="px-4 py-2 rounded-full bg-[#f2ede8] text-xs font-semibold text-[#554245] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#9c3e54] text-white text-xs font-bold hover:bg-[#64132b] cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
