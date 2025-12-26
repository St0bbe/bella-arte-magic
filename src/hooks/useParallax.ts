import { useState, useEffect, useCallback } from "react";

interface ParallaxState {
  scrollY: number;
  windowHeight: number;
}

export function useParallax() {
  const [state, setState] = useState<ParallaxState>({
    scrollY: 0,
    windowHeight: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const handleScroll = useCallback(() => {
    // Use requestAnimationFrame for smooth performance
    requestAnimationFrame(() => {
      setState(prev => ({
        ...prev,
        scrollY: window.scrollY,
      }));
    });
  }, []);

  useEffect(() => {
    setState({
      scrollY: window.scrollY,
      windowHeight: window.innerHeight,
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
      setState(prev => ({
        ...prev,
        windowHeight: window.innerHeight,
      }));
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Calculate parallax offset based on scroll position
  const getParallaxStyle = (speed: number = 0.5, baseOffset: number = 0) => {
    const offset = state.scrollY * speed + baseOffset;
    return {
      transform: `translateY(${offset}px)`,
    };
  };

  // Calculate parallax for rotation effects
  const getRotateStyle = (speed: number = 0.1) => {
    const rotation = state.scrollY * speed;
    return {
      transform: `rotate(${rotation}deg)`,
    };
  };

  // Calculate scale based on scroll
  const getScaleStyle = (baseScale: number = 1, speed: number = 0.0005) => {
    const scale = baseScale + state.scrollY * speed;
    return {
      transform: `scale(${Math.max(0.5, Math.min(scale, 2))})`,
    };
  };

  return {
    scrollY: state.scrollY,
    windowHeight: state.windowHeight,
    getParallaxStyle,
    getRotateStyle,
    getScaleStyle,
  };
}
