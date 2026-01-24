import { Link } from "react-router-dom";
import { Sparkles, Instagram, Mail, Phone, Heart } from "lucide-react";

export function StoreFooter() {
  return (
    <footer className="bg-store-text text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-store-rose to-store-pink flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-serif font-bold">Loja Bella Arte</span>
              </div>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Produtos personalizados para festas infantis. 
              Transformamos sua celebração em momentos mágicos.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-store-rose transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-store-rose transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-store-rose transition-colors">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Loja</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/loja" className="hover:text-store-rose transition-colors">Início</Link></li>
              <li><Link to="/loja/digitais" className="hover:text-store-rose transition-colors">Produtos Digitais</Link></li>
              <li><Link to="/loja/fisicos" className="hover:text-store-rose transition-colors">Produtos Físicos</Link></li>
              <li><Link to="/checkout" className="hover:text-store-rose transition-colors">Carrinho</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Ajuda</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#faq" className="hover:text-store-rose transition-colors">Dúvidas Frequentes</a></li>
              <li><Link to="/rastrear" className="hover:text-store-rose transition-colors">Rastrear Pedido</Link></li>
              <li><a href="#" className="hover:text-store-rose transition-colors">Política de Troca</a></li>
              <li><a href="#" className="hover:text-store-rose transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Produtos Digitais</h3>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-white/80 mb-2">
                <strong className="text-store-rose">Prazo de produção:</strong>
              </p>
              <p className="text-sm text-white/60 mb-3">
                Até 3 dias úteis após a confirmação do pagamento.
              </p>
              <p className="text-sm text-white/80 mb-2">
                <strong className="text-store-rose">Entrega:</strong>
              </p>
              <p className="text-sm text-white/60">
                Arquivo PDF de alta qualidade enviado por email ou WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Bella Arte. Todos os direitos reservados.
          </p>
          <p className="text-sm text-white/40 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-store-rose fill-store-rose" /> para festas inesquecíveis
          </p>
        </div>
      </div>
    </footer>
  );
}
