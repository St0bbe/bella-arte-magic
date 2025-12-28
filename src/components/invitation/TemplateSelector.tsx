import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TextTemplate {
  id: string;
  name: string;
  preview: string;
  elements: {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
    textShadow: boolean;
  }[];
}

const TEMPLATES: TextTemplate[] = [
  {
    id: "classic",
    name: "Clássico",
    preview: "📜",
    elements: [
      { id: "title", text: "Você está convidado!", x: 50, y: 10, fontSize: 28, fontFamily: "'Georgia', serif", color: "#FFFFFF", fontWeight: "bold", textShadow: true },
      { id: "name", text: "{nome} faz {idade} anos!", x: 50, y: 45, fontSize: 32, fontFamily: "'Georgia', serif", color: "#FFD700", fontWeight: "bold", textShadow: true },
      { id: "date", text: "📅 {data} às {hora}", x: 50, y: 75, fontSize: 20, fontFamily: "'Georgia', serif", color: "#FFFFFF", fontWeight: "normal", textShadow: true },
      { id: "location", text: "📍 {local}", x: 50, y: 85, fontSize: 18, fontFamily: "'Georgia', serif", color: "#FFFFFF", fontWeight: "normal", textShadow: true },
    ],
  },
  {
    id: "fun",
    name: "Divertido",
    preview: "🎉",
    elements: [
      { id: "title", text: "🎈 VENHA FESTEJAR! 🎈", x: 50, y: 8, fontSize: 26, fontFamily: "'Comic Sans MS', cursive", color: "#FF69B4", fontWeight: "bold", textShadow: true },
      { id: "name", text: "🎂 {nome} está fazendo {idade} aninhos! 🎂", x: 50, y: 40, fontSize: 28, fontFamily: "'Comic Sans MS', cursive", color: "#FFE66D", fontWeight: "bold", textShadow: true },
      { id: "subtitle", text: "Não perca essa festa incrível!", x: 50, y: 55, fontSize: 18, fontFamily: "'Comic Sans MS', cursive", color: "#FFFFFF", fontWeight: "normal", textShadow: true },
      { id: "date", text: "🗓️ {data} às {hora}", x: 50, y: 75, fontSize: 20, fontFamily: "'Comic Sans MS', cursive", color: "#4ECDC4", fontWeight: "bold", textShadow: true },
      { id: "location", text: "📍 {local}", x: 50, y: 87, fontSize: 16, fontFamily: "'Comic Sans MS', cursive", color: "#FFFFFF", fontWeight: "normal", textShadow: true },
    ],
  },
  {
    id: "elegant",
    name: "Elegante",
    preview: "✨",
    elements: [
      { id: "title", text: "Convite Especial", x: 50, y: 12, fontSize: 24, fontFamily: "'Georgia', serif", color: "#F8E8D4", fontWeight: "normal", textShadow: true },
      { id: "name", text: "{nome}", x: 50, y: 38, fontSize: 42, fontFamily: "'Georgia', serif", color: "#FFFFFF", fontWeight: "bold", textShadow: true },
      { id: "age", text: "celebra {idade} anos", x: 50, y: 52, fontSize: 22, fontFamily: "'Georgia', serif", color: "#F8E8D4", fontWeight: "normal", textShadow: true },
      { id: "date", text: "{data} • {hora}", x: 50, y: 75, fontSize: 20, fontFamily: "'Georgia', serif", color: "#FFFFFF", fontWeight: "normal", textShadow: true },
      { id: "location", text: "{local}", x: 50, y: 87, fontSize: 18, fontFamily: "'Georgia', serif", color: "#F8E8D4", fontWeight: "normal", textShadow: true },
    ],
  },
  {
    id: "bold",
    name: "Impactante",
    preview: "💥",
    elements: [
      { id: "wow", text: "WOW!", x: 50, y: 8, fontSize: 36, fontFamily: "'Trebuchet MS', sans-serif", color: "#FF6B6B", fontWeight: "bold", textShadow: true },
      { id: "name", text: "{nome}", x: 50, y: 35, fontSize: 48, fontFamily: "'Trebuchet MS', sans-serif", color: "#FFFFFF", fontWeight: "bold", textShadow: true },
      { id: "age", text: "{idade} ANOS!", x: 50, y: 55, fontSize: 32, fontFamily: "'Trebuchet MS', sans-serif", color: "#FFE66D", fontWeight: "bold", textShadow: true },
      { id: "date", text: "{data} | {hora}", x: 50, y: 78, fontSize: 22, fontFamily: "'Trebuchet MS', sans-serif", color: "#FFFFFF", fontWeight: "bold", textShadow: true },
      { id: "location", text: "📍 {local}", x: 50, y: 90, fontSize: 18, fontFamily: "'Trebuchet MS', sans-serif", color: "#4ECDC4", fontWeight: "normal", textShadow: true },
    ],
  },
  {
    id: "minimal",
    name: "Minimalista",
    preview: "◾",
    elements: [
      { id: "name", text: "{nome}", x: 50, y: 35, fontSize: 38, fontFamily: "'Verdana', sans-serif", color: "#FFFFFF", fontWeight: "bold", textShadow: true },
      { id: "age", text: "{idade} anos", x: 50, y: 50, fontSize: 24, fontFamily: "'Verdana', sans-serif", color: "#FFFFFF", fontWeight: "normal", textShadow: true },
      { id: "info", text: "{data} • {hora} • {local}", x: 50, y: 85, fontSize: 16, fontFamily: "'Verdana', sans-serif", color: "#FFFFFF", fontWeight: "normal", textShadow: true },
    ],
  },
];

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  onSelectTemplate: (template: TextTemplate) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Templates de Layout</Label>
      <div className="grid grid-cols-5 gap-2">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "p-3 cursor-pointer transition-all hover:scale-105 text-center",
              selectedTemplate === template.id
                ? "ring-2 ring-primary bg-primary/10"
                : "hover:bg-muted"
            )}
            onClick={() => onSelectTemplate(template)}
          >
            <span className="text-2xl block mb-1">{template.preview}</span>
            <span className="text-xs font-medium">{template.name}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { TEMPLATES };
