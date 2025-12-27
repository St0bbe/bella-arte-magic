import { useEffect, useRef, useState } from "react";

export type BackgroundEffectType = 
  | "none" 
  | "confetti" 
  | "balloons" 
  | "stars" 
  | "bubbles" 
  | "sparkles"
  | "hearts"
  | "streamers";

export interface PartyBackgroundSettings {
  intensity: number;
  speed: number;
  colorful: boolean;
}

export const backgroundEffectOptions: BackgroundEffectType[] = [
  "none",
  "confetti",
  "balloons",
  "stars",
  "bubbles",
  "sparkles",
  "hearts",
  "streamers",
];

export const backgroundEffectLabels: Record<BackgroundEffectType, string> = {
  none: "Sem efeito",
  confetti: "🎊 Confetes",
  balloons: "🎈 Balões",
  stars: "⭐ Estrelas",
  bubbles: "🫧 Bolhas",
  sparkles: "✨ Brilhos",
  hearts: "💕 Corações",
  streamers: "🎀 Serpentinas",
};

export const defaultBackgroundSettings: PartyBackgroundSettings = {
  intensity: 5,
  speed: 5,
  colorful: true,
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  opacity: number;
  shape?: string;
}

const PARTY_COLORS = [
  "#FF6B9D", // Pink
  "#C084FC", // Purple
  "#60A5FA", // Blue
  "#34D399", // Green
  "#FBBF24", // Yellow
  "#F97316", // Orange
  "#EF4444", // Red
  "#EC4899", // Magenta
];

const getRandomColor = (colorful: boolean) => {
  if (!colorful) return "#FF6B9D";
  return PARTY_COLORS[Math.floor(Math.random() * PARTY_COLORS.length)];
};

interface Props {
  effect: BackgroundEffectType;
  settings: PartyBackgroundSettings;
}

export function PartyBackground({ effect, settings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (effect === "none") {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = settings.intensity * 8;
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle(i, canvas.width, canvas.height, effect, settings));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        updateParticle(particle, canvas.width, canvas.height, effect, settings);
        drawParticle(ctx, particle, effect);

        // Reset particle if it goes off screen
        if (particle.y > canvas.height + 50 || particle.y < -50 || 
            particle.x > canvas.width + 50 || particle.x < -50) {
          particlesRef.current[index] = createParticle(
            particle.id,
            canvas.width,
            canvas.height,
            effect,
            settings,
            true
          );
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [effect, settings]);

  if (effect === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

function createParticle(
  id: number,
  width: number,
  height: number,
  effect: BackgroundEffectType,
  settings: PartyBackgroundSettings,
  fromTop = false
): Particle {
  const baseSpeed = settings.speed * 0.3;

  const particle: Particle = {
    id,
    x: Math.random() * width,
    y: fromTop ? -20 : Math.random() * height,
    size: 8 + Math.random() * 16,
    color: getRandomColor(settings.colorful),
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 4,
    speedX: (Math.random() - 0.5) * baseSpeed,
    speedY: baseSpeed + Math.random() * baseSpeed,
    opacity: 0.6 + Math.random() * 0.4,
  };

  // Customize based on effect type
  switch (effect) {
    case "balloons":
      particle.speedY = -(baseSpeed + Math.random() * baseSpeed); // Float up
      particle.size = 20 + Math.random() * 15;
      particle.y = fromTop ? height + 20 : Math.random() * height;
      break;
    case "bubbles":
      particle.speedY = -(baseSpeed * 0.5 + Math.random() * baseSpeed * 0.5);
      particle.size = 10 + Math.random() * 20;
      particle.opacity = 0.3 + Math.random() * 0.3;
      particle.y = fromTop ? height + 20 : Math.random() * height;
      break;
    case "stars":
      particle.size = 6 + Math.random() * 10;
      particle.rotationSpeed = (Math.random() - 0.5) * 2;
      break;
    case "sparkles":
      particle.size = 4 + Math.random() * 8;
      particle.opacity = Math.random();
      break;
    case "hearts":
      particle.size = 12 + Math.random() * 12;
      particle.color = settings.colorful 
        ? ["#FF6B9D", "#EC4899", "#EF4444", "#F97316"][Math.floor(Math.random() * 4)]
        : "#FF6B9D";
      break;
    case "streamers":
      particle.size = 4 + Math.random() * 6;
      particle.speedX = (Math.random() - 0.5) * baseSpeed * 2;
      break;
  }

  return particle;
}

function updateParticle(
  particle: Particle,
  width: number,
  height: number,
  effect: BackgroundEffectType,
  settings: PartyBackgroundSettings
) {
  particle.x += particle.speedX;
  particle.y += particle.speedY;
  particle.rotation += particle.rotationSpeed;

  // Add some waviness
  if (effect === "confetti" || effect === "streamers") {
    particle.speedX += (Math.random() - 0.5) * 0.2;
    particle.speedX = Math.max(-2, Math.min(2, particle.speedX));
  }

  if (effect === "bubbles" || effect === "balloons") {
    particle.speedX = Math.sin(particle.y * 0.01) * 0.5;
  }

  if (effect === "sparkles") {
    particle.opacity = 0.3 + Math.abs(Math.sin(Date.now() * 0.005 + particle.id)) * 0.7;
  }
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  effect: BackgroundEffectType
) {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate((particle.rotation * Math.PI) / 180);
  ctx.globalAlpha = particle.opacity;

  switch (effect) {
    case "confetti":
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      break;

    case "balloons":
      // Balloon body
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, particle.size * 0.6, particle.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Balloon knot
      ctx.beginPath();
      ctx.moveTo(-3, particle.size * 0.8);
      ctx.lineTo(3, particle.size * 0.8);
      ctx.lineTo(0, particle.size * 0.9);
      ctx.fill();
      // String
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, particle.size * 0.9);
      ctx.quadraticCurveTo(5, particle.size * 1.2, 0, particle.size * 1.5);
      ctx.stroke();
      break;

    case "stars":
      ctx.fillStyle = particle.color;
      drawStar(ctx, 0, 0, 5, particle.size, particle.size / 2);
      break;

    case "bubbles":
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(-particle.size / 4, -particle.size / 4, particle.size / 6, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "sparkles":
      ctx.fillStyle = particle.color;
      // Draw 4-point star
      ctx.beginPath();
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(particle.size / 4, 0);
      ctx.lineTo(0, particle.size);
      ctx.lineTo(-particle.size / 4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-particle.size, 0);
      ctx.lineTo(0, particle.size / 4);
      ctx.lineTo(particle.size, 0);
      ctx.lineTo(0, -particle.size / 4);
      ctx.closePath();
      ctx.fill();
      break;

    case "hearts":
      ctx.fillStyle = particle.color;
      drawHeart(ctx, 0, 0, particle.size);
      break;

    case "streamers":
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        particle.size * 2,
        particle.size * 3,
        0,
        particle.size * 6
      );
      ctx.stroke();
      break;
  }

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }

  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  const topCurveHeight = size * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y + topCurveHeight);
  // Left curve
  ctx.bezierCurveTo(
    x - size / 2,
    y - topCurveHeight,
    x - size,
    y + topCurveHeight,
    x,
    y + size
  );
  // Right curve
  ctx.bezierCurveTo(
    x + size,
    y + topCurveHeight,
    x + size / 2,
    y - topCurveHeight,
    x,
    y + topCurveHeight
  );
  ctx.closePath();
  ctx.fill();
}
