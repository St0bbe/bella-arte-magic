import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { MapPin } from 'lucide-react';

interface City {
  name: string;
  lat: number;
  lng: number;
}

export const ServiceAreaMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
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

    // Fix for default marker icons in Leaflet with bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Calculate center based on cities
    const avgLat = cities.reduce((sum, c) => sum + c.lat, 0) / cities.length;
    const avgLng = cities.reduce((sum, c) => sum + c.lng, 0) / cities.length;

    map.current = L.map(mapContainer.current).setView([avgLat, avgLng], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map.current);

    // Disable scroll zoom for smoother experience
    map.current.scrollWheelZoom.disable();

    // Custom icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background: linear-gradient(135deg, #ec4899, #a855f7); 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add markers for each city
    cities.forEach((city) => {
      const marker = L.marker([city.lat, city.lng], { icon: customIcon })
        .addTo(map.current!)
        .bindPopup(`<strong>${city.name}</strong>`);
      markersRef.current.push(marker);
    });

    // Fit bounds if there are multiple cities
    if (cities.length > 1) {
      const bounds = L.latLngBounds(cities.map(city => [city.lat, city.lng]));
      map.current.fitBounds(bounds, { padding: [50, 50] });
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
            Onde <span className="text-primary">Atendemos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Levamos a magia das festas para diversas cidades da região. Confira se atendemos sua localidade!
          </p>
        </div>

        <div className="relative">
          <div 
            ref={mapContainer} 
            className="h-[400px] md:h-[500px] rounded-2xl shadow-xl overflow-hidden"
          />
          <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-foreground/10" />
        </div>

        {/* Cities list */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {cities.map((city, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-sm border"
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{city.name}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </section>
  );
};
