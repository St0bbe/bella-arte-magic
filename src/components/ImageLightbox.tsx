import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightboxImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightbox = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
          break;
        case "ArrowRight":
          setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
          break;
      }
    },
    [isOpen, images.length, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
        aria-label="Fechar"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Zoom button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleZoom();
        }}
        className="absolute top-4 right-16 z-50 p-2 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
        aria-label={isZoomed ? "Reduzir" : "Ampliar"}
      >
        {isZoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
      </button>

      {/* Navigation - Previous */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 z-50 p-3 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Navigation - Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 z-50 p-3 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image container */}
      <div
        className={cn(
          "relative max-w-[90vw] max-h-[85vh] transition-transform duration-300",
          isZoomed && "cursor-zoom-out"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (isZoomed) setIsZoomed(false);
        }}
      >
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className={cn(
            "max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300",
            isZoomed && "scale-150 cursor-zoom-out"
          )}
        />

        {/* Image info */}
        {(currentImage.title || currentImage.description) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent rounded-b-lg">
            {currentImage.title && (
              <h3 className="text-xl font-bold text-foreground mb-1">
                {currentImage.title}
              </h3>
            )}
            {currentImage.description && (
              <p className="text-foreground/80">{currentImage.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 text-foreground text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-lg bg-background/80 max-w-[80vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setIsZoomed(false);
              }}
              className={cn(
                "w-16 h-16 rounded overflow-hidden flex-shrink-0 transition-all",
                index === currentIndex
                  ? "ring-2 ring-primary"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Hook for easy lightbox state management
export const useLightbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const open = (index: number = 0) => {
    setInitialIndex(index);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return { isOpen, initialIndex, open, close };
};
