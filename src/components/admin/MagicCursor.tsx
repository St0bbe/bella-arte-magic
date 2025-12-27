import { useEffect, useState, useCallback } from "react";

type EffectType = 
  | "none" 
  | "sparkles" 
  | "bubbles" 
  | "hearts" 
  | "stars" 
  | "confetti" 
  | "fire" 
  | "snow" 
  | "rainbow" 
  | "magic-dust" 
  | "neon-trail";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
}

interface MagicCursorProps {
  effect: EffectType;
}

const effectColors: Record<EffectType, string[]> = {
  none: [],
  sparkles: ["#FFD700", "#FFA500", "#FFFF00", "#FFE4B5"],
  bubbles: ["#87CEEB", "#B0E0E6", "#ADD8E6", "#E0FFFF"],
  hearts: ["#FF69B4", "#FF1493", "#FF6B9D", "#FFB6C1"],
  stars: ["#FFD700", "#FFA500", "#FF69B4", "#9370DB"],
  confetti: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"],
  fire: ["#FF4500", "#FF6347", "#FF7F50", "#FFD700", "#FFA500"],
  snow: ["#FFFFFF", "#F0F8FF", "#E6E6FA", "#F5F5F5"],
  rainbow: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"],
  "magic-dust": ["#9370DB", "#8A2BE2", "#BA55D3", "#DDA0DD", "#EE82EE"],
  "neon-trail": ["#00FFFF", "#FF00FF", "#00FF00", "#FFFF00", "#FF6600"],
};

const effectShapes: Record<EffectType, string> = {
  none: "",
  sparkles: "✨",
  bubbles: "●",
  hearts: "❤",
  stars: "★",
  confetti: "■",
  fire: "🔥",
  snow: "❄",
  rainbow: "●",
  "magic-dust": "✦",
  "neon-trail": "◆",
};

export const MagicCursor = ({ effect }: MagicCursorProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const createParticle = useCallback((x: number, y: number): Particle => {
    const colors = effectColors[effect];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      id: Date.now() + Math.random(),
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      size: Math.random() * 12 + 8,
      color,
      rotation: Math.random() * 360,
      opacity: 1,
      velocityX: (Math.random() - 0.5) * 3,
      velocityY: effect === "fire" ? -Math.random() * 3 - 1 : 
                 effect === "snow" ? Math.random() * 1 + 0.5 :
                 effect === "bubbles" ? -Math.random() * 2 - 0.5 :
                 (Math.random() - 0.5) * 2,
    };
  }, [effect]);

  useEffect(() => {
    if (effect === "none") {
      setParticles([]);
      return;
    }

    let lastTime = 0;
    const throttleMs = 50;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < throttleMs) return;
      lastTime = now;

      setMousePos({ x: e.clientX, y: e.clientY });
      
      const newParticles = Array.from({ length: 2 }, () => 
        createParticle(e.clientX, e.clientY)
      );
      
      setParticles(prev => [...prev.slice(-30), ...newParticles]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [effect, createParticle]);

  useEffect(() => {
    if (effect === "none" || particles.length === 0) return;

    const animationFrame = requestAnimationFrame(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            opacity: p.opacity - 0.02,
            rotation: p.rotation + 5,
            size: effect === "bubbles" ? p.size + 0.1 : p.size * 0.98,
          }))
          .filter(p => p.opacity > 0)
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [particles, effect]);

  if (effect === "none") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute transition-none"
          style={{
            left: particle.x,
            top: particle.y,
            fontSize: particle.size,
            color: particle.color,
            opacity: particle.opacity,
            transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            textShadow: effect === "neon-trail" 
              ? `0 0 10px ${particle.color}, 0 0 20px ${particle.color}, 0 0 30px ${particle.color}` 
              : effect === "fire" 
              ? `0 0 5px ${particle.color}` 
              : "none",
            filter: effect === "rainbow" 
              ? `drop-shadow(0 0 3px ${particle.color})` 
              : "none",
          }}
        >
          {effectShapes[effect]}
        </div>
      ))}
      
      {/* Main cursor glow */}
      <div
        className="absolute w-6 h-6 rounded-full pointer-events-none transition-all duration-75"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          transform: "translate(-50%, -50%)",
          background: effect === "neon-trail" 
            ? `radial-gradient(circle, ${effectColors[effect][0]}40 0%, transparent 70%)`
            : effect === "fire"
            ? `radial-gradient(circle, #FF450060 0%, transparent 70%)`
            : effect === "magic-dust"
            ? `radial-gradient(circle, #9370DB40 0%, transparent 70%)`
            : "transparent",
          boxShadow: effect === "neon-trail" 
            ? `0 0 20px ${effectColors[effect][0]}60`
            : "none",
        }}
      />
    </div>
  );
};

export const effectLabels: Record<EffectType, string> = {
  none: "Desativado",
  sparkles: "✨ Brilhos",
  bubbles: "🫧 Bolhas",
  hearts: "❤️ Corações",
  stars: "⭐ Estrelas",
  confetti: "🎊 Confete",
  fire: "🔥 Fogo",
  snow: "❄️ Neve",
  rainbow: "🌈 Arco-íris",
  "magic-dust": "✨ Pó Mágico",
  "neon-trail": "💫 Rastro Neon",
};

export const effectOptions = Object.keys(effectLabels) as EffectType[];

export type { EffectType };
