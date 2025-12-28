import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Sticker {
  id: string;
  emoji: string;
  category: string;
}

const STICKER_CATEGORIES = [
  {
    id: "party",
    label: "Festa",
    icon: "🎉",
    stickers: ["🎉", "🎈", "🎊", "🎁", "🎂", "🧁", "🍰", "🕯️", "🪅", "🎀", "🎇", "🎆", "🪩", "✨", "💫", "⭐"],
  },
  {
    id: "princess",
    label: "Princesas",
    icon: "👑",
    stickers: ["👸", "👑", "🏰", "💎", "🪄", "🦋", "🌸", "🌺", "🌷", "💐", "🎀", "💝", "🩰", "🪞", "✨", "🌟"],
  },
  {
    id: "heroes",
    label: "Heróis",
    icon: "🦸",
    stickers: ["🦸", "🦸‍♂️", "🦸‍♀️", "🦹", "💪", "⚡", "🔥", "💥", "🛡️", "⭐", "🌟", "🎯", "🏆", "🥇", "💫", "✨"],
  },
  {
    id: "animals",
    label: "Animais",
    icon: "🦁",
    stickers: ["🦁", "🐯", "🐘", "🦒", "🐵", "🐻", "🦄", "🐶", "🐱", "🐰", "🐷", "🐮", "🦖", "🐲", "🐠", "🐬"],
  },
  {
    id: "food",
    label: "Comidas",
    icon: "🍕",
    stickers: ["🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🍬", "🍭", "🍫", "🧃", "🥤", "🍦", "🎂", "🧁", "🍰"],
  },
  {
    id: "nature",
    label: "Natureza",
    icon: "🌈",
    stickers: ["🌈", "☀️", "🌙", "⭐", "☁️", "🌸", "🌺", "🌻", "🌼", "🍀", "🌴", "🌵", "❄️", "🔥", "💧", "🌊"],
  },
  {
    id: "hearts",
    label: "Corações",
    icon: "❤️",
    stickers: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💗", "💓", "💕", "💞", "💝", "💘", "💟"],
  },
  {
    id: "faces",
    label: "Carinhas",
    icon: "😊",
    stickers: ["😊", "😃", "🥳", "😍", "🤩", "😎", "🥰", "😘", "🤗", "😇", "🤪", "😜", "😋", "😻", "🙌", "👏"],
  },
];

interface StickerPickerProps {
  onSelectSticker: (emoji: string) => void;
}

export function StickerPicker({ onSelectSticker }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState("party");

  return (
    <div className="space-y-2">
      <Label>Adesivos Decorativos</Label>
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <ScrollArea className="w-full">
          <TabsList className="flex w-max gap-1 p-1">
            {STICKER_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex items-center gap-1 px-3"
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline text-xs">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {STICKER_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-2">
            <div className="grid grid-cols-8 gap-1">
              {cat.stickers.map((emoji, idx) => (
                <Button
                  key={`${cat.id}-${idx}`}
                  variant="ghost"
                  size="sm"
                  className="text-2xl h-10 w-10 p-0 hover:scale-125 transition-transform"
                  onClick={() => onSelectSticker(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
