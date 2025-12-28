import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Type, Move, Trash2, Plus, Settings, Sticker, Layout } from "lucide-react";
import html2canvas from "html2canvas";
import { TemplateSelector, TEMPLATES, type TextTemplate } from "./invitation/TemplateSelector";
import { StickerPicker } from "./invitation/StickerPicker";

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  textShadow: boolean;
  type: "text" | "sticker";
}

interface InvitationEditorProps {
  imageUrl: string;
  childName: string;
  childAge: number | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  onDownload?: (dataUrl: string) => void;
}

const FONT_FAMILIES = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Comic Sans MS', cursive", label: "Comic Sans" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
  { value: "'Verdana', sans-serif", label: "Verdana" },
  { value: "'Courier New', monospace", label: "Courier" },
];

const COLORS = [
  "#FFFFFF", "#000000", "#FF6B6B", "#4ECDC4", "#FFE66D", 
  "#FF69B4", "#9B59B6", "#3498DB", "#2ECC71", "#F39C12"
];

function applyTemplateVariables(
  text: string, 
  childName: string, 
  childAge: number | null, 
  eventDate: string | null, 
  eventTime: string | null, 
  eventLocation: string | null
): string {
  let result = text;
  result = result.replace("{nome}", childName);
  result = result.replace("{idade}", childAge?.toString() || "");
  result = result.replace("{data}", eventDate ? new Date(eventDate).toLocaleDateString("pt-BR") : "");
  result = result.replace("{hora}", eventTime || "");
  result = result.replace("{local}", eventLocation || "");
  return result;
}

export function InvitationEditor({
  imageUrl,
  childName,
  childAge,
  eventDate,
  eventTime,
  eventLocation,
  onDownload,
}: InvitationEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("templates");

  // Initialize with default text elements
  const [textElements, setTextElements] = useState<TextElement[]>(() => {
    const elements: TextElement[] = [
      {
        id: "title",
        text: "Você está convidado!",
        x: 50,
        y: 10,
        fontSize: 28,
        fontFamily: "'Trebuchet MS', sans-serif",
        color: "#FFFFFF",
        fontWeight: "bold",
        textShadow: true,
        type: "text",
      },
      {
        id: "name",
        text: childName + (childAge ? ` faz ${childAge} anos!` : ""),
        x: 50,
        y: 45,
        fontSize: 32,
        fontFamily: "'Trebuchet MS', sans-serif",
        color: "#FFE66D",
        fontWeight: "bold",
        textShadow: true,
        type: "text",
      },
    ];

    if (eventDate) {
      elements.push({
        id: "date",
        text: `📅 ${new Date(eventDate).toLocaleDateString("pt-BR")}${eventTime ? ` às ${eventTime}` : ""}`,
        x: 50,
        y: 75,
        fontSize: 20,
        fontFamily: "Arial, sans-serif",
        color: "#FFFFFF",
        fontWeight: "normal",
        textShadow: true,
        type: "text",
      });
    }

    if (eventLocation) {
      elements.push({
        id: "location",
        text: `📍 ${eventLocation}`,
        x: 50,
        y: 85,
        fontSize: 18,
        fontFamily: "Arial, sans-serif",
        color: "#FFFFFF",
        fontWeight: "normal",
        textShadow: true,
        type: "text",
      });
    }

    return elements;
  });

  const applyTemplate = (template: TextTemplate) => {
    setSelectedTemplate(template.id);
    const newElements: TextElement[] = template.elements.map((el) => ({
      ...el,
      text: applyTemplateVariables(el.text, childName, childAge, eventDate, eventTime, eventLocation),
      type: "text" as const,
    }));
    setTextElements(newElements);
    setSelectedId(null);
  };

  const addSticker = (emoji: string) => {
    const newElement: TextElement = {
      id: `sticker-${Date.now()}`,
      text: emoji,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      fontSize: 48,
      fontFamily: "Arial, sans-serif",
      color: "#FFFFFF",
      fontWeight: "normal",
      textShadow: false,
      type: "sticker",
    };
    setTextElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const addTextElement = () => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: "Novo texto",
      x: 50,
      y: 50,
      fontSize: 20,
      fontFamily: "Arial, sans-serif",
      color: "#FFFFFF",
      fontWeight: "normal",
      textShadow: true,
      type: "text",
    };
    setTextElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
  };

  const removeElement = (id: string) => {
    setTextElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const element = textElements.find((el) => el.id === id);
    if (!element) return;

    const elementX = (element.x / 100) * rect.width;
    const elementY = (element.y / 100) * rect.height;

    setDragOffset({
      x: e.clientX - rect.left - elementX,
      y: e.clientY - rect.top - elementY,
    });
    setSelectedId(id);
    setDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !selectedId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
      updateElement(selectedId, {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(95, y)),
      });
    },
    [dragging, selectedId, dragOffset]
  );

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleDownload = async () => {
    if (!containerRef.current) return;
    
    // Hide selection indicator for capture
    setSelectedId(null);
    
    // Wait for re-render
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(containerRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL("image/png");
      
      if (onDownload) {
        onDownload(dataUrl);
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `convite-${childName.replace(/\s+/g, "-").toLowerCase()}.png`;
        a.click();
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  const selectedElement = textElements.find((el) => el.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Tools Panel */}
      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="templates" className="flex items-center gap-1">
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="stickers" className="flex items-center gap-1">
              <Sticker className="w-4 h-4" />
              <span className="hidden sm:inline">Adesivos</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Texto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={applyTemplate}
            />
          </TabsContent>

          <TabsContent value="stickers">
            <StickerPicker onSelectSticker={addSticker} />
          </TabsContent>

          <TabsContent value="text">
            <div className="space-y-4">
              <Button variant="outline" className="w-full" onClick={addTextElement}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Texto
              </Button>

              {selectedElement && selectedElement.type === "text" && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Texto</Label>
                    <Input
                      value={selectedElement.text}
                      onChange={(e) => updateElement(selectedId!, { text: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tamanho: {selectedElement.fontSize}px</Label>
                    <Slider
                      value={[selectedElement.fontSize]}
                      onValueChange={([v]) => updateElement(selectedId!, { fontSize: v })}
                      min={12}
                      max={60}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fonte</Label>
                    <Select
                      value={selectedElement.fontFamily}
                      onValueChange={(v) => updateElement(selectedId!, { fontFamily: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            selectedElement.color === color ? "border-primary" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateElement(selectedId!, { color })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedElement.fontWeight === "bold" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        updateElement(selectedId!, {
                          fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold",
                        })
                      }
                    >
                      <strong>B</strong>
                    </Button>
                    <Button
                      variant={selectedElement.textShadow ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        updateElement(selectedId!, { textShadow: !selectedElement.textShadow })
                      }
                    >
                      Sombra
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeElement(selectedId!)}
                      className="text-destructive ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedElement && selectedElement.type === "sticker" && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Adesivo selecionado</Label>
                    <span className="text-3xl">{selectedElement.text}</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Tamanho: {selectedElement.fontSize}px</Label>
                    <Slider
                      value={[selectedElement.fontSize]}
                      onValueChange={([v]) => updateElement(selectedId!, { fontSize: v })}
                      min={24}
                      max={96}
                      step={4}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeElement(selectedId!)}
                    className="text-destructive w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover Adesivo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Download Button */}
      <Button className="w-full" size="lg" onClick={handleDownload}>
        <Download className="w-4 h-4 mr-2" />
        Baixar Convite Personalizado
      </Button>

      {/* Editor Canvas */}
      <Card className="overflow-hidden">
        <div
          ref={containerRef}
          className="relative select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Fundo do convite"
            className="w-full h-auto"
            crossOrigin="anonymous"
          />
          
          {textElements.map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-move transition-all ${
                selectedId === element.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent"
                  : ""
              }`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                transform: "translate(-50%, 0)",
                fontSize: `${element.fontSize}px`,
                fontFamily: element.type === "sticker" ? "inherit" : element.fontFamily,
                color: element.color,
                fontWeight: element.fontWeight,
                textShadow: element.textShadow
                  ? "2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)"
                  : "none",
                whiteSpace: "nowrap",
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(element.id);
              }}
            >
              {element.text}
            </div>
          ))}
        </div>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        <Move className="w-4 h-4 inline mr-1" />
        Clique e arraste os elementos para reposicionar. Clique em um elemento para editar.
      </p>
    </div>
  );
}
