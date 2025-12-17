import { Heart, Settings } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h3 className="text-3xl font-bold">Bella Arte</h3>
          <p className="text-background/80 max-w-2xl mx-auto">
            Transformando festas em obras de arte desde 2020
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-background/60 pt-8">
            <span>Feito com</span>
            <Heart className="w-4 h-4 fill-primary text-primary animate-pulse" />
            <span>para você</span>
          </div>
          <div className="flex items-center justify-center gap-4 pt-4">
            <p className="text-xs text-background/60">
              © {new Date().getFullYear()} Bella Arte. Todos os direitos reservados.
            </p>
            <a href="/admin/login" className="text-xs text-background/40 hover:text-background/60 transition-colors flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
