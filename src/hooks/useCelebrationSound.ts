import { useCallback, useRef } from "react";

export function useCelebrationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Create a cheerful celebration sound sequence
      const playTone = (frequency: number, startTime: number, duration: number, type: OscillatorType = "sine") => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        // Envelope for a nice pop sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play a cheerful ascending arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((note, i) => {
        playTone(note, now + i * 0.1, 0.3, "sine");
      });

      // Add some sparkle sounds
      for (let i = 0; i < 6; i++) {
        const freq = 1000 + Math.random() * 2000;
        playTone(freq, now + 0.3 + i * 0.05, 0.1, "triangle");
      }

      // Final triumphant chord
      [523.25, 659.25, 783.99].forEach(freq => {
        playTone(freq, now + 0.6, 0.5, "sine");
      });

    } catch (error) {
      console.error("Error playing celebration sound:", error);
    }
  }, []);

  return { playSound };
}
