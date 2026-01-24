import { Download, Clock, FileText, Shield, CreditCard, Sparkles } from "lucide-react";

const BADGES = [
  {
    icon: Download,
    title: "Produto Digital",
    description: "Arquivo em PDF de alta qualidade",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Clock,
    title: "3 Dias Úteis",
    description: "Prazo de produção personalizada",
    color: "text-store-rose",
    bgColor: "bg-store-rose/10",
  },
  {
    icon: FileText,
    title: "Entrega em PDF",
    description: "Pronto para impressão ou digital",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Compra Segura",
    description: "Pagamento 100% protegido",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    icon: CreditCard,
    title: "Pix ou Cartão",
    description: "Diversas formas de pagamento",
    color: "text-store-gold",
    bgColor: "bg-amber-50",
  },
  {
    icon: Sparkles,
    title: "Personalizado",
    description: "Feito especialmente para você",
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {BADGES.map((badge, index) => (
        <div
          key={index}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-store-rose/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className={`w-12 h-12 rounded-full ${badge.bgColor} flex items-center justify-center mb-3`}>
            <badge.icon className={`w-6 h-6 ${badge.color}`} />
          </div>
          <h3 className="font-semibold text-sm text-store-text mb-1">{badge.title}</h3>
          <p className="text-xs text-store-text/60">{badge.description}</p>
        </div>
      ))}
    </div>
  );
}

export function ProductBadges({ isDigital }: { isDigital: boolean }) {
  if (!isDigital) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
        <Download className="w-3.5 h-3.5" />
        Produto Digital
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-store-rose/10 text-store-rose text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        3 Dias Úteis
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
        <FileText className="w-3.5 h-3.5" />
        Entrega em PDF
      </span>
    </div>
  );
}
