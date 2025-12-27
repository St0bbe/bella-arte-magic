import { useEffect, useState, useCallback, useRef } from "react";

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
  | "neon-trail"
  | "plasma"
  | "gold-particles"
  | "rainbow-trail";

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
  hue?: number;
}

interface MagicCursorSettings {
  intensity: number; // 1-10
  speed: number; // 1-10
  soundEnabled: boolean;
  volume: number; // 0-1
}

interface MagicCursorProps {
  effect: EffectType;
  settings: MagicCursorSettings;
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
  plasma: ["#FF00FF", "#00FFFF", "#FF0080", "#8000FF", "#0080FF"],
  "gold-particles": ["#FFD700", "#FFC107", "#FFAA00", "#FFE44D", "#B8860B"],
  "rainbow-trail": ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"],
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
  plasma: "◉",
  "gold-particles": "✦",
  "rainbow-trail": "━",
};

// Sound frequencies for different effects
const effectSounds: Record<EffectType, { frequency: number; type: OscillatorType; duration: number }> = {
  none: { frequency: 0, type: "sine", duration: 0 },
  sparkles: { frequency: 800, type: "sine", duration: 0.05 },
  bubbles: { frequency: 400, type: "sine", duration: 0.08 },
  hearts: { frequency: 600, type: "triangle", duration: 0.06 },
  stars: { frequency: 700, type: "sine", duration: 0.04 },
  confetti: { frequency: 500, type: "square", duration: 0.03 },
  fire: { frequency: 150, type: "sawtooth", duration: 0.1 },
  snow: { frequency: 1200, type: "sine", duration: 0.02 },
  rainbow: { frequency: 600, type: "triangle", duration: 0.05 },
  "magic-dust": { frequency: 900, type: "sine", duration: 0.04 },
  "neon-trail": { frequency: 300, type: "square", duration: 0.06 },
  plasma: { frequency: 200, type: "sawtooth", duration: 0.08 },
  "gold-particles": { frequency: 1000, type: "sine", duration: 0.03 },
  "rainbow-trail": { frequency: 500, type: "triangle", duration: 0.05 },
};

export const MagicCursor = ({ effect, settings }: MagicCursorProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [trailPoints, setTrailPoints] = useState<{ x: number; y: number; hue: number }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);
  const hueRef = useRef(0);

  // Initialize audio context
  useEffect(() => {
    if (settings.soundEnabled) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, [settings.soundEnabled]);

  const playSound = useCallback(() => {
    if (!settings.soundEnabled || effect === "none" || !audioContextRef.current) return;
    
    const now = Date.now();
    const minInterval = 100 / settings.speed; // Faster speed = more frequent sounds
    if (now - lastSoundTimeRef.current < minInterval) return;
    lastSoundTimeRef.current = now;

    const ctx = audioContextRef.current;
    const { frequency, type, duration } = effectSounds[effect];
    
    if (frequency === 0) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency + (Math.random() - 0.5) * 100, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(settings.volume * 0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [effect, settings.soundEnabled, settings.speed, settings.volume]);

  const createParticle = useCallback((x: number, y: number): Particle => {
    const colors = effectColors[effect];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const speedMultiplier = settings.speed / 5;
    
    return {
      id: Date.now() + Math.random(),
      x: x + (Math.random() - 0.5) * 20 * (settings.intensity / 5),
      y: y + (Math.random() - 0.5) * 20 * (settings.intensity / 5),
      size: (Math.random() * 12 + 8) * (settings.intensity / 5),
      color,
      rotation: Math.random() * 360,
      opacity: 1,
      velocityX: (Math.random() - 0.5) * 3 * speedMultiplier,
      velocityY: effect === "fire" ? -Math.random() * 3 * speedMultiplier - 1 : 
                 effect === "snow" ? Math.random() * speedMultiplier + 0.5 :
                 effect === "bubbles" ? -Math.random() * 2 * speedMultiplier - 0.5 :
                 effect === "plasma" ? (Math.random() - 0.5) * 4 * speedMultiplier :
                 effect === "gold-particles" ? -Math.random() * 2 * speedMultiplier :
                 (Math.random() - 0.5) * 2 * speedMultiplier,
      hue: hueRef.current,
    };
  }, [effect, settings.intensity, settings.speed]);

  useEffect(() => {
    if (effect === "none") {
      setParticles([]);
      setTrailPoints([]);
      return;
    }

    const throttleMs = Math.max(20, 80 - settings.speed * 6);
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < throttleMs) return;
      lastTime = now;

      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Update hue for rainbow effects
      hueRef.current = (hueRef.current + 5) % 360;
      
      // Rainbow trail effect
      if (effect === "rainbow-trail") {
        setTrailPoints(prev => [
          ...prev.slice(-30),
          { x: e.clientX, y: e.clientY, hue: hueRef.current }
        ]);
      }
      
      const particleCount = Math.ceil(settings.intensity / 3);
      const newParticles = Array.from({ length: particleCount }, () => 
        createParticle(e.clientX, e.clientY)
      );
      
      const maxParticles = 20 + settings.intensity * 5;
      setParticles(prev => [...prev.slice(-maxParticles), ...newParticles]);
      
      playSound();
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [effect, createParticle, playSound, settings.intensity, settings.speed]);

  useEffect(() => {
    if (effect === "none" || particles.length === 0) return;

    const decayRate = 0.015 + (settings.speed / 100);
    const animationFrame = requestAnimationFrame(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            opacity: p.opacity - decayRate,
            rotation: p.rotation + 5 * (settings.speed / 5),
            size: effect === "bubbles" ? p.size + 0.1 : 
                  effect === "plasma" ? p.size * (0.97 + Math.sin(Date.now() / 100) * 0.02) :
                  p.size * 0.98,
          }))
          .filter(p => p.opacity > 0)
      );
      
      // Decay trail points for rainbow trail
      if (effect === "rainbow-trail") {
        setTrailPoints(prev => prev.slice(-25));
      }
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [particles, effect, settings.speed]);

  if (effect === "none") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Rainbow trail effect */}
      {effect === "rainbow-trail" && trailPoints.length > 1 && (
        <svg className="absolute inset-0 w-full h-full">
          {trailPoints.map((point, i) => {
            if (i === 0) return null;
            const prev = trailPoints[i - 1];
            const opacity = i / trailPoints.length;
            return (
              <line
                key={i}
                x1={prev.x}
                y1={prev.y}
                x2={point.x}
                y2={point.y}
                stroke={`hsl(${point.hue}, 100%, 50%)`}
                strokeWidth={4 * (settings.intensity / 5)}
                strokeLinecap="round"
                opacity={opacity}
                style={{
                  filter: `drop-shadow(0 0 ${5 * (settings.intensity / 5)}px hsl(${point.hue}, 100%, 50%))`,
                }}
              />
            );
          })}
        </svg>
      )}

      {/* Regular particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute transition-none"
          style={{
            left: particle.x,
            top: particle.y,
            fontSize: particle.size,
            color: effect === "plasma" 
              ? `hsl(${(particle.hue || 0) + Date.now() / 20 % 360}, 100%, 60%)`
              : effect === "rainbow-trail"
              ? `hsl(${particle.hue || 0}, 100%, 50%)`
              : particle.color,
            opacity: particle.opacity,
            transform: `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${
              effect === "plasma" ? 1 + Math.sin(Date.now() / 100) * 0.2 : 1
            })`,
            textShadow: effect === "neon-trail" 
              ? `0 0 10px ${particle.color}, 0 0 20px ${particle.color}, 0 0 30px ${particle.color}` 
              : effect === "fire" 
              ? `0 0 5px ${particle.color}` 
              : effect === "plasma"
              ? `0 0 15px currentColor, 0 0 30px currentColor`
              : effect === "gold-particles"
              ? `0 0 8px ${particle.color}, 0 0 15px ${particle.color}`
              : "none",
            filter: effect === "rainbow" || effect === "rainbow-trail"
              ? `drop-shadow(0 0 3px ${particle.color})` 
              : effect === "plasma"
              ? `blur(${Math.sin(Date.now() / 200) * 0.5 + 0.5}px)`
              : "none",
          }}
        >
          {effectShapes[effect]}
        </div>
      ))}
      
      {/* Main cursor glow */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-75"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: 24 * (settings.intensity / 5),
          height: 24 * (settings.intensity / 5),
          transform: "translate(-50%, -50%)",
          background: effect === "neon-trail" 
            ? `radial-gradient(circle, ${effectColors[effect][0]}40 0%, transparent 70%)`
            : effect === "fire"
            ? `radial-gradient(circle, #FF450060 0%, transparent 70%)`
            : effect === "magic-dust"
            ? `radial-gradient(circle, #9370DB40 0%, transparent 70%)`
            : effect === "plasma"
            ? `radial-gradient(circle, hsl(${hueRef.current}, 100%, 50%)50 0%, transparent 70%)`
            : effect === "gold-particles"
            ? `radial-gradient(circle, #FFD70050 0%, transparent 70%)`
            : effect === "rainbow-trail"
            ? `radial-gradient(circle, hsl(${hueRef.current}, 100%, 50%)40 0%, transparent 70%)`
            : "transparent",
          boxShadow: effect === "neon-trail" 
            ? `0 0 20px ${effectColors[effect][0]}60`
            : effect === "plasma"
            ? `0 0 30px hsl(${hueRef.current}, 100%, 50%)`
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
  plasma: "🔮 Plasma",
  "gold-particles": "✦ Partículas de Ouro",
  "rainbow-trail": "🌈 Trilha Arco-íris",
};

export const effectOptions = Object.keys(effectLabels) as EffectType[];

export const defaultSettings: MagicCursorSettings = {
  intensity: 5,
  speed: 5,
  soundEnabled: false,
  volume: 0.3,
};

export type { EffectType, MagicCursorSettings };
