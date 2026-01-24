import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Download, Clock, FileEdit, Send, Shield } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Como recebo meu produto digital?",
    answer: "Após a confirmação do pagamento e personalização, você receberá seu arquivo em PDF de alta qualidade diretamente no seu email ou WhatsApp cadastrado. O arquivo estará pronto para impressão ou compartilhamento digital.",
    icon: Download,
  },
  {
    question: "Em quanto tempo meu produto digital fica pronto?",
    answer: "O prazo de produção é de até 3 dias úteis após a confirmação do pagamento. Trabalhamos com dedicação em cada arte para garantir um resultado perfeito e personalizado para sua festa.",
    icon: Clock,
  },
  {
    question: "Posso solicitar alterações depois de pronto?",
    answer: "Oferecemos uma revisão gratuita para pequenos ajustes (como correção de texto). Alterações maiores como mudança de tema ou layout podem ter custo adicional. Por isso, pedimos atenção ao preencher as informações no momento da compra.",
    icon: FileEdit,
  },
  {
    question: "Como envio minhas informações para personalização?",
    answer: "Ao finalizar a compra, você preencherá um formulário com os dados da festa: nome do aniversariante, idade, tema, data, horário e local. Essas informações serão usadas para criar sua arte exclusiva.",
    icon: Send,
  },
  {
    question: "Os produtos físicos têm garantia?",
    answer: "Sim! Todos os produtos físicos passam por controle de qualidade antes do envio. Caso haja algum defeito de fabricação, entre em contato conosco em até 7 dias após o recebimento para troca ou reembolso.",
    icon: Shield,
  },
  {
    question: "Qual o prazo de entrega dos produtos físicos?",
    answer: "O prazo varia de acordo com sua região e a transportadora escolhida. Após o envio, você receberá um código de rastreamento para acompanhar sua encomenda. A maioria das entregas é realizada entre 5 a 15 dias úteis.",
    icon: Clock,
  },
];

export function StoreFAQ() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-store-cream/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-store-rose/10 text-store-rose mb-4">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Dúvidas Frequentes</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-store-text mb-3">
            Perguntas Frequentes
          </h2>
          <p className="text-store-text/60 max-w-xl mx-auto">
            Tire suas dúvidas sobre nossos produtos e processo de personalização
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-xl border border-store-rose/20 px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-store-rose/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-store-rose" />
                    </div>
                    <span className="font-medium text-store-text">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-store-text/70 pb-5 pl-13">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
