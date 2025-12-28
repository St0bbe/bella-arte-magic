import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus, Trash2, Search, Loader2, Palette } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface City {
  name: string;
  lat: number;
  lng: number;
  radius?: number; // km
  color?: string;
}

const PRESET_COLORS = [
  '#ec4899', // pink
  '#a855f7', // purple
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#8b5cf6', // violet
];

export const AdminServiceArea = () => {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [defaultRadius, setDefaultRadius] = useState(30);
  const [defaultColor, setDefaultColor] = useState('#ec4899');

  // Fetch tenant and settings
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (tenant) {
        setTenantId(tenant.id);

        // Fetch existing cities
        const { data: settings } = await supabase
          .from("site_settings")
          .select("value")
          .eq("tenant_id", tenant.id)
          .eq("key", "service_cities")
          .maybeSingle();

        if (settings?.value) {
          try {
            const parsed = JSON.parse(settings.value);
            setCities(parsed.map((c: City) => ({
              ...c,
              radius: c.radius || 30,
              color: c.color || '#ec4899'
            })));
          } catch {}
        }

        // Fetch default settings
        const { data: radiusSettings } = await supabase
          .from("site_settings")
          .select("value")
          .eq("tenant_id", tenant.id)
          .eq("key", "service_default_radius")
          .maybeSingle();
        
        if (radiusSettings?.value) {
          setDefaultRadius(parseInt(radiusSettings.value) || 30);
        }

        const { data: colorSettings } = await supabase
          .from("site_settings")
          .select("value")
          .eq("tenant_id", tenant.id)
          .eq("key", "service_default_color")
          .maybeSingle();
        
        if (colorSettings?.value) {
          setDefaultColor(colorSettings.value);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([-25.4284, -49.2733], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isLoading]);

  // Update markers when cities change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers and circles
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    circlesRef.current.forEach(circle => circle.remove());
    circlesRef.current = [];

    // Add markers and circles for each city
    cities.forEach((city) => {
      const color = city.color || defaultColor;
      
      // Custom icon
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 36px; 
            height: 36px; 
            background: ${color}; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 4px 12px ${color}66;
            border: 3px solid white;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      // Add circle for radius
      const radius = (city.radius || defaultRadius) * 1000; // Convert km to meters
      const circle = L.circle([city.lat, city.lng], {
        radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map.current!);
      circlesRef.current.push(circle);

      // Add marker
      const marker = L.marker([city.lat, city.lng], { icon: customIcon })
        .addTo(map.current!)
        .bindPopup(`
          <div style="text-align: center; min-width: 120px;">
            <strong style="font-size: 14px;">${city.name}</strong>
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              Raio: ${city.radius || defaultRadius} km
            </div>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Fit bounds if there are cities
    if (cities.length > 0) {
      const bounds = L.latLngBounds(cities.map(city => [city.lat, city.lng]));
      map.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [cities, defaultRadius, defaultColor]);

  // Search for cities using Nominatim
  const searchCities = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=br&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching cities:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar as cidades.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add city from search results
  const addCity = (result: any) => {
    const cityName = result.address?.city || result.address?.town || result.address?.village || result.display_name.split(',')[0];
    
    const newCity: City = {
      name: cityName,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      radius: defaultRadius,
      color: defaultColor,
    };

    if (cities.some(c => c.name.toLowerCase() === newCity.name.toLowerCase())) {
      toast({
        title: "Cidade já adicionada",
        description: `${newCity.name} já está na lista.`,
        variant: "destructive",
      });
      return;
    }

    setCities([...cities, newCity]);
    setSearchResults([]);
    setSearchQuery("");

    toast({
      title: "Cidade adicionada",
      description: `${newCity.name} foi adicionada à área de atendimento.`,
    });
  };

  // Update city properties
  const updateCity = (index: number, updates: Partial<City>) => {
    const newCities = [...cities];
    newCities[index] = { ...newCities[index], ...updates };
    setCities(newCities);
  };

  // Remove city
  const removeCity = (index: number) => {
    const cityName = cities[index].name;
    setCities(cities.filter((_, i) => i !== index));
    toast({
      title: "Cidade removida",
      description: `${cityName} foi removida da área de atendimento.`,
    });
  };

  // Save cities to database
  const saveCities = async () => {
    if (!tenantId) return;

    setIsSaving(true);
    try {
      // Save cities
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("key", "service_cities")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ value: JSON.stringify(cities) })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("site_settings")
          .insert({
            tenant_id: tenantId,
            key: "service_cities",
            value: JSON.stringify(cities),
          });
      }

      toast({
        title: "Salvo!",
        description: "Área de atendimento atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Área de Atendimento
          </CardTitle>
          <CardDescription>
            Adicione as cidades onde você atende e defina o raio de cobertura.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label>Raio Padrão (km)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[defaultRadius]}
                  onValueChange={(v) => setDefaultRadius(v[0])}
                  min={5}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{defaultRadius} km</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor Padrão</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${defaultColor === color ? 'ring-2 ring-offset-2 ring-foreground' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setDefaultColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Buscar Cidade</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome da cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCities()}
                className="flex-1"
              />
              <Button onClick={searchCities} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-60 overflow-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                    onClick={() => addCity(result)}
                  >
                    <div>
                      <div className="font-medium">
                        {result.address?.city || result.address?.town || result.address?.village || result.display_name.split(',')[0]}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {result.display_name}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Preview */}
          <div className="space-y-2">
            <Label>Prévia do Mapa</Label>
            <div
              ref={mapContainer}
              className="h-[350px] rounded-lg overflow-hidden border"
            />
          </div>

          {/* Cities List */}
          <div className="space-y-3">
            <Label>Cidades Adicionadas ({cities.length})</Label>
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                Nenhuma cidade adicionada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {cities.map((city, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                  >
                    <div 
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: city.color || defaultColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{city.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Raio: {city.radius || defaultRadius} km
                      </div>
                    </div>
                    
                    {/* Radius Slider */}
                    <div className="flex items-center gap-2 w-32">
                      <Slider
                        value={[city.radius || defaultRadius]}
                        onValueChange={(v) => updateCity(index, { radius: v[0] })}
                        min={5}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-xs w-8">{city.radius || defaultRadius}</span>
                    </div>

                    {/* Color Picker */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Palette className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="flex gap-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${city.color === color ? 'ring-2 ring-offset-1 ring-foreground' : ''}`}
                              style={{ backgroundColor: color }}
                              onClick={() => updateCity(index, { color })}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeCity(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button onClick={saveCities} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Área de Atendimento"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
