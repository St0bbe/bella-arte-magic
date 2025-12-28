import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", 
  "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA",
  "#FF9A8B", "#88D8B0", "#FFEAA7", "#DDA0DD"
];

export function ConfettiEffect({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      const newPieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < 100; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          size: 8 + Math.random() * 8,
          rotation: Math.random() * 360,
        });
      }
      
      setPieces(newPieces);

      // Clear confetti after animation
      const timer = setTimeout(() => {
        setPieces([]);
        setIsActive(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [trigger, isActive]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            width: `${piece.size}px`,
            height: `${piece.size * 0.6}px`,
            backgroundColor: piece.color,
            borderRadius: "2px",
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
