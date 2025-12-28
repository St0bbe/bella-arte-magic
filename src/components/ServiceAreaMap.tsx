import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { MapPin } from 'lucide-react';

interface City {
  name: string;
  lat: number;
  lng: number;
}

export const ServiceAreaMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { data: settings } = useSiteSettings();
  const [cities, setCities] = useState<City[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

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
    if (!mapContainer.current || !mapboxToken || cities.length === 0) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate center based on cities
    const avgLat = cities.reduce((sum, c) => sum + c.lat, 0) / cities.length;
    const avgLng = cities.reduce((sum, c) => sum + c.lng, 0) / cities.length;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [avgLng, avgLat],
      zoom: 7,
      pitch: 20,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.scrollZoom.disable();

    // Add markers for each city
    map.current.on('load', () => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      cities.forEach((city) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'city-marker';
        el.innerHTML = `
          <div class="relative">
            <div class="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-foreground/90 text-background text-xs px-2 py-1 rounded shadow">
              ${city.name}
            </div>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([city.lng, city.lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers
      if (cities.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        cities.forEach(city => bounds.extend([city.lng, city.lat]));
        map.current?.fitBounds(bounds, { padding: 80 });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, cities]);

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

  if (!mapboxToken) {
    return null;
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
    </section>
  );
};
