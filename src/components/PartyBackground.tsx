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
    
    // Balloons - fewer and slower
    for (let i = 0; i < 5; i++) {
      generated.push({
        id: i,
        type: "balloon",
        x: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 35 + Math.random() * 15,
        size: 25 + Math.random() * 15,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    
    // Confetti - fewer and slower
    for (let i = 5; i < 15; i++) {
      generated.push({
        id: i,
        type: "confetti",
        x: Math.random() * 100,
        delay: Math.random() * 25,
        duration: 20 + Math.random() * 10,
        size: 6 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    
    // Stars - fewer
    for (let i = 15; i < 22; i++) {
      generated.push({
        id: i,
        type: "star",
        x: Math.random() * 100,
        delay: Math.random() * 30,
        duration: 40 + Math.random() * 15,
        size: 8 + Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    // Circles - fewer
    for (let i = 22; i < 28; i++) {
      generated.push({
        id: i,
        type: "circle",
        x: Math.random() * 100,
        delay: Math.random() * 18,
        duration: 25 + Math.random() * 12,
        size: 12 + Math.random() * 15,
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
              style={{ opacity: 0.35 }}
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
                opacity: 0.4,
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
              style={{ opacity: 0.3 }}
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
                opacity: 0.25,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
