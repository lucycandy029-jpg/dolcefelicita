import React from 'react';
import { ShieldCheck, Clock, Instagram, MessageCircle, Facebook } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#f8f3ee] text-[#554245] mt-16 border-t border-[#dac0c3]/30 shadow-[0_-8px_30px_rgba(61,28,18,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="flex flex-col gap-3">
            <BrandLogo variant="compact" />
            <p className="text-xs text-[#554245] leading-relaxed">
              Doceria artesanal inspirada no afeto, sabor autêntico e momentos doces inesquecíveis.
            </p>
            <div className="flex items-center gap-1.5 text-[#9c3e54] text-xs font-bold pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Confeitaria Artesanal Premium</span>
            </div>
          </div>

          {/* Business Hours */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-[#1d1b19] font-heading mb-1">Horário de Funcionamento</span>
            <p className="text-xs">Terça a Domingo: 11h às 22h</p>
            <p className="text-xs">Feriados: 12h às 20h</p>
            <p className="text-xs text-[#7f5347] font-semibold">Fechado às Segundas</p>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-[#1d1b19] font-heading mb-1">Redes Sociais</span>
            <a
              href="https://instagram.com/felicitadoces"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-[#554245] hover:text-[#9c3e54] transition-colors py-0.5"
            >
              <Instagram className="w-3.5 h-3.5 text-[#9c3e54]" />
              <span>@felicitadoces</span>
            </a>
            <a
              href="https://wa.me/5511987654321"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-[#554245] hover:text-[#9c3e54] transition-colors py-0.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#9c3e54]" />
              <span>(11) 98765-4321</span>
            </a>
            <a
              href="https://facebook.com/felicitadoces"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-[#554245] hover:text-[#9c3e54] transition-colors py-0.5"
            >
              <Facebook className="w-3.5 h-3.5 text-[#9c3e54]" />
              <span>/felicitadoces</span>
            </a>
          </div>

          {/* Payment Methods Accepted */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-[#1d1b19] font-heading mb-1">Formas de Pagamento</span>
            <p className="text-xs mb-2">Aceitamos pagamento online e na entrega com total segurança:</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-white text-[#1d1b19] text-[10px] font-bold border border-[#dac0c3]/40">
                PIX Instantâneo
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#1d1b19] text-[10px] font-bold border border-[#dac0c3]/40">
                Cartão de Crédito
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#1d1b19] text-[10px] font-bold border border-[#dac0c3]/40">
                Débito
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#1d1b19] text-[10px] font-bold border border-[#dac0c3]/40">
                Vale Refeição
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-[#dac0c3]/30 text-xs text-[#877274]">
          <p>© 2024 Felicitá Doces Confeitaria Ltda. Todos os direitos reservados.</p>
          <p>Feito com amor e ingredientes nobres.</p>
        </div>
      </div>
    </footer>
  );
};
