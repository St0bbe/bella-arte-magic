import { MessageCircle, Phone } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

// 8 different WhatsApp button styles
export const whatsappStyles = [
  {
    id: "classic",
    name: "Clássico",
    className: "bg-[#25D366] hover:bg-[#20BA5C] text-white rounded-full shadow-lg hover:shadow-xl",
    icon: "message",
    animation: "hover:scale-110",
  },
  {
    id: "pulse",
    name: "Pulsante",
    className: "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-full shadow-lg animate-pulse",
    icon: "message",
    animation: "hover:animate-none hover:scale-110",
  },
  {
    id: "rounded",
    name: "Arredondado",
    className: "bg-[#25D366] hover:bg-[#20BA5C] text-white rounded-2xl shadow-lg px-4",
    icon: "phone",
    animation: "hover:scale-105",
    showText: true,
    text: "WhatsApp",
  },
  {
    id: "gradient",
    name: "Gradiente",
    className: "bg-gradient-to-br from-[#25D366] via-[#128C7E] to-[#075E54] text-white rounded-full shadow-xl",
    icon: "message",
    animation: "hover:scale-110 hover:rotate-12",
  },
  {
    id: "bounce",
    name: "Saltitante",
    className: "bg-[#25D366] hover:bg-[#20BA5C] text-white rounded-full shadow-lg",
    icon: "message",
    animation: "animate-bounce hover:animate-none",
  },
  {
    id: "glow",
    name: "Brilhante",
    className: "bg-[#25D366] text-white rounded-full shadow-[0_0_20px_rgba(37,211,102,0.6)] hover:shadow-[0_0_30px_rgba(37,211,102,0.8)]",
    icon: "message",
    animation: "hover:scale-110",
  },
  {
    id: "pill",
    name: "Pílula",
    className: "bg-[#25D366] hover:bg-[#20BA5C] text-white rounded-full shadow-lg pl-3 pr-5",
    icon: "message",
    animation: "hover:scale-105",
    showText: true,
    text: "Fale Conosco",
  },
  {
    id: "elegant",
    name: "Elegante",
    className: "bg-white text-[#25D366] border-2 border-[#25D366] hover:bg-[#25D366] hover:text-white rounded-full shadow-lg",
    icon: "message",
    animation: "hover:scale-110 transition-colors",
  },
];

export const WhatsAppButton = () => {
  const { data: settings } = useSiteSettings();
  const whatsappNumber = settings?.whatsapp_number;
  const styleId = settings?.whatsapp_button_style || "classic";
  
  const style = whatsappStyles.find(s => s.id === styleId) || whatsappStyles[0];

  if (!whatsappNumber) return null;

  const handleClick = () => {
    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };

  const IconComponent = style.icon === "phone" ? Phone : MessageCircle;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 p-4 transition-all duration-300 flex items-center gap-2",
        style.className,
        style.animation
      )}
      aria-label="Contato via WhatsApp"
    >
      <IconComponent className="w-7 h-7" />
      {style.showText && (
        <span className="font-medium hidden sm:inline">{style.text}</span>
      )}
    </button>
  );
};
