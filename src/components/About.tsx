import { Button } from "@/components/ui/button";
import { Heart, Star, Users } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTenant } from "@/contexts/TenantContext";

const features = [
  {
    icon: Star,
    title: "Qualidade Premium",
    description: "Equipamentos novos e seguros, sempre higienizados",
  },
  {
    icon: Users,
    title: "Equipe Especializada",
    description: "Profissionais experientes e dedicados",
  },
  {
    icon: Heart,
    title: "Atendimento Personalizado",
    description: "Cada festa é única e especial para nós",
  },
];

export const About = () => {
  const { data: settings } = useSiteSettings();
  const { tenant } = useTenant();

  const businessName = tenant?.name || "Decoradora";
  const title = settings?.about_title || `Sobre a ${businessName}`;
  const description = settings?.about_description || 
    `Somos especialistas em transformar sonhos em realidade! Com anos de experiência em decoração de festas e locação de brinquedos, a ${businessName} se dedica a criar momentos mágicos e inesquecíveis para você e sua família.`;
  const mission = settings?.about_mission || 
    "Nossa paixão é ver o sorriso das crianças e a satisfação dos pais em cada evento que realizamos. Trabalhamos com dedicação, criatividade e muito carinho em cada detalhe.";

  // Parse the title to highlight the business name dynamically
  const titleParts = businessName ? title.split(new RegExp(`(${businessName})`, 'i')) : [title];

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-muted/30 to-background">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                {titleParts.map((part, index) => 
                  part.toLowerCase() === businessName.toLowerCase() ? (
                    <span key={index} className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {part}
                    </span>
                  ) : (
                    <span key={index}>{part}</span>
                  )
                )}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {description}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {mission}
              </p>
              <Button 
                size="lg" 
                className="mt-4 bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--shadow-glow)] transition-all duration-300"
                onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
              >
                Entre em Contato
              </Button>
            </div>

            <div className="grid gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-4 p-6 rounded-2xl bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
