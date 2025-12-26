import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PartyPopper,
  Sparkles,
  Palette,
  Globe,
  MessageCircle,
  Camera,
  Calculator,
  CheckCircle,
  Crown,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Zap,
  Heart,
  Gift,
  Cake,
  Music,
  
} from "lucide-react";

// Floating confetti component
const Confetti = () => {
  const confettiColors = [
    "bg-pink-400",
    "bg-purple-400",
    "bg-yellow-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-orange-400",
  ];
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-3 h-3 ${confettiColors[i % confettiColors.length]} rounded-sm opacity-60`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animation: `confetti-fall ${8 + Math.random() * 6}s linear infinite`,
            animationDelay: `${Math.random() * 8}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// Floating balloons component
const FloatingBalloons = () => {
  const balloonColors = [
    "from-pink-400 to-pink-500",
    "from-purple-400 to-purple-500",
    "from-yellow-400 to-yellow-500",
    "from-blue-400 to-blue-500",
    "from-green-400 to-green-500",
  ];
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-12 h-16 bg-gradient-to-b ${balloonColors[i % balloonColors.length]} rounded-full opacity-30`}
          style={{
            left: `${10 + (i * 12)}%`,
            bottom: `-100px`,
            animation: `balloon-float ${15 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${i * 2}s`,
          }}
        >
          <div className="absolute bottom-0 left-1/2 w-px h-8 bg-current opacity-50 transform -translate-x-1/2" />
        </div>
      ))}
    </div>
  );
};

const FEATURES = [
  {
    icon: Globe,
    title: "Site Profissional",
    description: "Tenha seu próprio site personalizado com seu domínio exclusivo para impressionar seus clientes",
    emoji: "🌐",
  },
  {
    icon: Palette,
    title: "100% Personalizável",
    description: "Cores, logo, textos - tudo do seu jeito, sem precisar de programador",
    emoji: "🎨",
  },
  {
    icon: Camera,
    title: "Galeria de Fotos",
    description: "Mostre seus melhores trabalhos com uma galeria profissional e encantadora",
    emoji: "📸",
  },
  {
    icon: Calculator,
    title: "Orçamento Automático",
    description: "Seus clientes fazem orçamentos direto pelo site, sem complicação",
    emoji: "💰",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integrado",
    description: "Receba pedidos de orçamento direto no seu WhatsApp instantaneamente",
    emoji: "💬",
  },
  {
    icon: Zap,
    title: "Pronto em Minutos",
    description: "Cadastre-se e tenha seu site no ar em menos de 5 minutos!",
    emoji: "⚡",
  },
];

const TESTIMONIALS = [
  {
    name: "Thais Alves",
    company: "Bella Arte Decorações",
    quote: "Desde que comecei a usar o Celebrai, meus pedidos triplicaram! Agora meus clientes me encontram pelo Google.",
    rating: 5,
    avatar: "🎀",
  },
  {
    name: "Maria Santos",
    company: "Festa dos Sonhos",
    quote: "Nunca imaginei que seria tão fácil ter um site profissional. O suporte é incrível!",
    rating: 5,
    avatar: "🎈",
  },
  {
    name: "Ana Clara",
    company: "Doce Celebração",
    quote: "O orçamento automático mudou minha vida. Economizo horas toda semana!",
    rating: 5,
    avatar: "🎂",
  },
];

const PLANS = [
  {
    id: "monthly",
    name: "Mensal",
    price: "49,90",
    period: "/mês",
    features: [
      "Site profissional personalizado",
      "Galeria de fotos ilimitada",
      "Calculadora de orçamento",
      "WhatsApp integrado",
      "Suporte por email",
    ],
  },
  {
    id: "yearly",
    name: "Anual",
    price: "479,00",
    period: "/ano",
    savings: "Economize R$ 119,80",
    popular: true,
    features: [
      "Tudo do plano mensal",
      "2 meses grátis",
      "Suporte prioritário",
      "Domínio personalizado",
      "SEO otimizado",
    ],
  },
];

const PARTY_EMOJIS = ["🎉", "🎊", "🎈", "🎁", "🎂", "🍰", "🎀", "✨", "🌟", "💫"];

export default function LandingPage() {
  const [currentEmoji, setCurrentEmoji] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % PARTY_EMOJIS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-background overflow-hidden relative">
      {/* Animated background elements */}
      <Confetti />
      <FloatingBalloons />
      
      {/* Decorative shapes */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-[10%] w-32 h-32 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-[15%] w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-40 left-[20%] w-36 h-36 bg-purple-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 right-[10%] w-44 h-44 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <PartyPopper className="w-8 h-8 text-primary animate-bounce" style={{ animationDuration: "2s" }} />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Celebrai
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#funcionalidades" className="hidden md:block text-muted-foreground hover:text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="hidden md:block text-muted-foreground hover:text-primary transition-colors">
              Preços
            </a>
            <Link to="/admin/login">
              <Button variant="ghost" className="hover:bg-pink-50">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:opacity-90 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:scale-105">
                <Sparkles className="w-4 h-4 mr-2" />
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="container mx-auto text-center relative z-10">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full border border-pink-200 shadow-lg animate-fade-in">
            <span className="text-2xl animate-bounce">{PARTY_EMOJIS[currentEmoji]}</span>
            <span className="text-primary font-medium">A plataforma #1 para decoradoras de festas</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: "0.5s" }}>{PARTY_EMOJIS[(currentEmoji + 5) % PARTY_EMOJIS.length]}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <span className="inline-block">Seu negócio de</span>
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 bg-clip-text text-transparent">
                decoração de festas
              </span>
              <Sparkles className="absolute -top-4 -right-6 w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: "3s" }} />
            </span>
            <br />
            <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              online em minutos!
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            Crie seu site profissional, receba orçamentos pelo WhatsApp e conquiste 
            mais clientes <span className="text-primary font-semibold">sem precisar entender de tecnologia</span> 🎉
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <Link to="/cadastro">
              <Button size="lg" className="group bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:opacity-90 text-lg px-8 py-6 h-auto shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:scale-105">
                <Gift className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Criar Meu Site Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#funcionalidades">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300">
                <PartyPopper className="w-5 h-5 mr-2" />
                Ver Como Funciona
              </Button>
            </a>
          </div>

          {/* Stats with party theme */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.8s" }}>
            {[
              { value: "500+", label: "Decoradoras", emoji: "🎀" },
              { value: "10k+", label: "Orçamentos", emoji: "📋" },
              { value: "98%", label: "Satisfação", emoji: "💖" },
            ].map((stat, index) => (
              <div key={index} className="text-center group hover:scale-110 transition-transform cursor-default">
                <div className="text-3xl mb-1">{stat.emoji}</div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Decorative party elements */}
          <div className="mt-16 flex justify-center gap-4 opacity-60">
            {["🎈", "🎊", "🎁", "🎂", "🎈"].map((emoji, i) => (
              <span
                key={i}
                className="text-4xl animate-bounce"
                style={{ animationDelay: `${i * 0.2}s`, animationDuration: "2s" }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-100 rounded-full">
              <span className="text-xl">✨</span>
              <span className="text-purple-600 font-medium">Funcionalidades</span>
              <span className="text-xl">✨</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tudo que você precisa para
              <br />
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 bg-clip-text text-transparent">
                fazer a festa acontecer! 🎉
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais pensadas especialmente para decoradoras de festas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 hover:-translate-y-2 border-2 border-pink-100 hover:border-pink-300 bg-white/80 backdrop-blur-sm overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-100 to-transparent rounded-bl-full" />
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl group-hover:animate-bounce">{feature.emoji}</span>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-pink-100 rounded-full">
              <span className="text-xl">🎈</span>
              <span className="text-pink-600 font-medium">Como Funciona</span>
              <span className="text-xl">🎈</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              3 passos simples para
              <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                começar a vender 🚀
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Crie sua conta",
                description: "Cadastre-se em menos de 2 minutos com seus dados básicos",
                icon: Users,
                emoji: "📝",
                color: "from-pink-400 to-pink-500",
              },
              {
                step: "2",
                title: "Personalize seu site",
                description: "Adicione sua logo, cores, serviços e fotos dos seus trabalhos",
                icon: Palette,
                emoji: "🎨",
                color: "from-purple-400 to-purple-500",
              },
              {
                step: "3",
                title: "Comece a receber clientes",
                description: "Divulgue seu link e receba orçamentos direto no WhatsApp",
                icon: TrendingUp,
                emoji: "💰",
                color: "from-yellow-400 to-orange-500",
              },
            ].map((item, index) => (
              <div key={index} className="text-center relative group">
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-1 bg-gradient-to-r from-pink-300 via-purple-300 to-transparent rounded-full" />
                )}
                <div className={`w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-xl shadow-pink-500/30 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-12 h-12" />
                </div>
                <div className="text-4xl mb-2">{item.emoji}</div>
                <div className="inline-block px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-sm font-bold mb-3">
                  Passo {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-yellow-100 rounded-full">
              <span className="text-xl">⭐</span>
              <span className="text-yellow-700 font-medium">Depoimentos</span>
              <span className="text-xl">⭐</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Decoradoras que
              <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                amam o Celebrai 💖
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="border-2 border-pink-100 hover:border-pink-300 bg-white shadow-lg hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4 text-center">{testimonial.avatar}</div>
                  <div className="flex gap-1 mb-4 justify-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic text-center">"{testimonial.quote}"</p>
                  <div className="text-center">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-primary">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-green-100 rounded-full">
              <span className="text-xl">💎</span>
              <span className="text-green-700 font-medium">Preços Especiais</span>
              <span className="text-xl">💎</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Planos que cabem
              <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                no seu bolso 💰
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Invista menos do que o custo de uma decoração simples e conquiste dezenas de novos clientes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular 
                    ? "border-pink-400 shadow-2xl shadow-pink-500/20 bg-gradient-to-b from-white to-pink-50" 
                    : "border-pink-100 hover:border-pink-300 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg px-4 py-1">
                      <Crown className="w-4 h-4 mr-1" />
                      Mais Popular 🎉
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      {plan.price.split(",")[0]}
                    </span>
                    <span className="text-xl text-primary">,{plan.price.split(",")[1]}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 border-green-200">
                      🎁 {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/cadastro" className="block">
                    <Button
                      className={`w-full h-12 text-lg ${
                        plan.popular
                          ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 shadow-lg shadow-pink-500/30"
                          : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                      }`}
                      size="lg"
                    >
                      {plan.popular ? "🎉 " : ""}Começar Agora{plan.popular ? " 🎉" : ""}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8 flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            Teste grátis por 7 dias. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 relative overflow-hidden z-10">
        {/* Party pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Floating emojis */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["🎉", "🎊", "🎈", "🎁", "⭐", "✨", "🎂", "🎀"].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-4xl opacity-40 animate-bounce"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: "3s",
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pronta para transformar
            <br />
            seu negócio?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10">
            Junte-se a centenas de decoradoras que já estão vendendo mais com o Celebrai
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="bg-white text-pink-600 hover:bg-pink-50 text-lg px-10 py-6 h-auto shadow-2xl hover:scale-105 transition-all">
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Minha Conta Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-pink-100 bg-white relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PartyPopper className="w-6 h-6 text-pink-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Celebrai
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                A plataforma completa para decoradoras de festas venderem mais. 🎉
              </p>
              <div className="flex gap-2 mt-4 text-2xl">
                🎈🎀🎂🎁
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>Produto</span> <Sparkles className="w-4 h-4 text-yellow-400" />
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="hover:text-primary transition-colors">Preços</a></li>
                <li><Link to="/cadastro" className="hover:text-primary transition-colors">Cadastrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>Suporte</span> <Heart className="w-4 h-4 text-pink-500" />
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span>Legal</span> <CheckCircle className="w-4 h-4 text-green-500" />
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-pink-100 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Celebrai. Feito com 💖 para decoradoras de festas.</p>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes balloon-float {
          0%, 100% {
            transform: translateY(0) rotate(-5deg);
          }
          50% {
            transform: translateY(-100vh) rotate(5deg);
          }
        }
        
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
