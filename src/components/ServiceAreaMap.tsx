import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { MapPin } from 'lucide-react';

interface City {
  name: string;
  lat: number;
  lng: number;
  radius?: number;
  color?: string;
}

const DEFAULT_COLOR = '#ec4899';
const DEFAULT_RADIUS = 30;

export const ServiceAreaMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const { data: settings, isLoading } = useSiteSettings();
  const [cities, setCities] = useState<City[]>([]);

  // Parse cities from settings
  useEffect(() => {
    if (settings?.service_cities) {
      try {
        const parsedCities = JSON.parse(settings.service_cities);
        setCities(parsedCities);
      } catch {
        setCities([]);
      }
    }
  }, [settings?.service_cities]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || cities.length === 0 || map.current) return;

    // Calculate center based on cities
    const avgLat = cities.reduce((sum, c) => sum + c.lat, 0) / cities.length;
    const avgLng = cities.reduce((sum, c) => sum + c.lng, 0) / cities.length;

    map.current = L.map(mapContainer.current, {
      scrollWheelZoom: false,
    }).setView([avgLat, avgLng], 7);

    // Use a more stylish tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(map.current);

    // Add markers and circles for each city
    cities.forEach((city) => {
      const color = city.color || DEFAULT_COLOR;
      const radius = (city.radius || DEFAULT_RADIUS) * 1000;

      // Add circle for radius with gradient effect
      const circle = L.circle([city.lat, city.lng], {
        radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map.current!);
      circlesRef.current.push(circle);

      // Custom icon with animation
      const customIcon = L.divIcon({
        className: 'custom-marker-wrapper',
        html: `
          <div class="city-marker-container">
            <div class="city-marker-pulse" style="background: ${color};"></div>
            <div class="city-marker" style="background: ${color};">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="city-marker-label">${city.name}</div>
          </div>
        `,
        iconSize: [120, 80],
        iconAnchor: [60, 60],
      });

      // Add marker with popup
      const marker = L.marker([city.lat, city.lng], { icon: customIcon })
        .addTo(map.current!)
        .bindPopup(`
          <div style="text-align: center; padding: 8px; min-width: 140px;">
            <div style="
              width: 40px; 
              height: 40px; 
              background: ${color}; 
              border-radius: 50%; 
              margin: 0 auto 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <strong style="font-size: 15px; display: block; margin-bottom: 4px;">${city.name}</strong>
            <div style="color: #666; font-size: 12px;">
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                Raio de ${city.radius || DEFAULT_RADIUS} km
              </span>
            </div>
          </div>
        `, { className: 'custom-popup' });
      markersRef.current.push(marker);
    });

    // Fit bounds if there are multiple cities
    if (cities.length > 1) {
      const bounds = L.latLngBounds(cities.map(city => [city.lat, city.lng]));
      map.current.fitBounds(bounds, { padding: [80, 80] });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [cities]);

  if (isLoading) {
    return (
      <section id="area-atendimento" className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Onde <span className="text-primary">Atendemos</span>
            </h2>
          </div>
          <div className="h-[400px] rounded-2xl bg-muted animate-pulse flex items-center justify-center">
            <div className="text-muted-foreground">Carregando mapa...</div>
          </div>
        </div>
      </section>
    );
  }

  if (cities.length === 0) {
    return null;
  }

  return (
    <section id="area-atendimento" className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4 inline mr-2" />
            Área de Atendimento
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Atendemos <span className="text-primary">Piraquara</span> e Região
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Levamos a magia das festas para Piraquara, Pinhais, São José dos Pinhais, Colombo e toda a região metropolitana de Curitiba!
          </p>
        </div>

        <div className="relative">
          <div 
            ref={mapContainer} 
            className="h-[400px] md:h-[500px] rounded-2xl shadow-xl overflow-hidden"
          />
          <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-foreground/10" />
        </div>

        {/* Cities list with radius info */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {cities.map((city, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-sm border transition-transform hover:scale-105"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: city.color || DEFAULT_COLOR }}
              />
              <span className="text-sm font-medium">{city.name}</span>
              <span className="text-xs text-muted-foreground">
                ({city.radius || DEFAULT_RADIUS} km)
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .custom-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }
        
        .city-marker-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .city-marker-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          opacity: 0.4;
          animation: marker-pulse 2s infinite;
        }
        
        .city-marker {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
          position: relative;
          z-index: 1;
        }
        
        .city-marker-label {
          margin-top: 4px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        @keyframes marker-pulse {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </section>
  );
};
