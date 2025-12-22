import { useEffect, useState } from "react";

interface FloatingElement {
  id: number;
  type: "balloon" | "confetti" | "star" | "circle";
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--party-pink))",
  "hsl(var(--party-purple))",
  "hsl(var(--party-yellow))",
  "hsl(var(--party-blue))",
  "hsl(var(--party-green))",
];

export const PartyBackground = () => {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const generated: FloatingElement[] = [];
    
    // Balloons
    for (let i = 0; i < 8; i++) {
      generated.push({
        id: i,
        type: "balloon",
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 10,
        size: 30 + Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    
    // Confetti
    for (let i = 8; i < 30; i++) {
      generated.push({
        id: i,
        type: "confetti",
        x: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 8 + Math.random() * 7,
        size: 8 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    
    // Stars
    for (let i = 30; i < 45; i++) {
      generated.push({
        id: i,
        type: "star",
        x: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 20 + Math.random() * 10,
        size: 10 + Math.random() * 15,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    // Circles
    for (let i = 45; i < 55; i++) {
      generated.push({
        id: i,
        type: "circle",
        x: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 12 + Math.random() * 8,
        size: 15 + Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    setElements(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute animate-float-up"
          style={{
            left: `${el.x}%`,
            animationDelay: `${el.delay}s`,
            animationDuration: `${el.duration}s`,
          }}
        >
          {el.type === "balloon" && (
            <svg
              width={el.size}
              height={el.size * 1.3}
              viewBox="0 0 40 52"
              style={{ opacity: 0.6 }}
            >
              <ellipse cx="20" cy="18" rx="18" ry="18" fill={el.color} />
              <path
                d="M20 36 Q20 42 18 52"
                stroke={el.color}
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          )}
          {el.type === "confetti" && (
            <div
              className="animate-spin-slow"
              style={{
                width: el.size,
                height: el.size * 0.4,
                backgroundColor: el.color,
                opacity: 0.7,
                borderRadius: "2px",
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          )}
          {el.type === "star" && (
            <svg
              width={el.size}
              height={el.size}
              viewBox="0 0 24 24"
              style={{ opacity: 0.5 }}
              className="animate-pulse"
            >
              <path
                d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
                fill={el.color}
              />
            </svg>
          )}
          {el.type === "circle" && (
            <div
              className="rounded-full animate-pulse"
              style={{
                width: el.size,
                height: el.size,
                backgroundColor: el.color,
                opacity: 0.4,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
