import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus, Trash2, Search, Loader2 } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface City {
  name: string;
  lat: number;
  lng: number;
}

export const AdminServiceArea = () => {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

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
            setCities(JSON.parse(settings.value));
          } catch {}
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Fix for default marker icons in Leaflet with bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

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

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

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

    // Fit bounds if there are cities
    if (cities.length > 0) {
      const bounds = L.latLngBounds(cities.map(city => [city.lat, city.lng]));
      map.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [cities]);

  // Search for cities using Nominatim (free OpenStreetMap geocoding)
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
    };

    // Check if city already exists
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
            Adicione as cidades onde você atende. Elas aparecerão no mapa do site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label>Buscar Cidade</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Digite o nome da cidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCities()}
                />
              </div>
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
                      <div className="text-sm text-muted-foreground">
                        {result.display_name}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
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
              className="h-[300px] rounded-lg overflow-hidden border"
            />
          </div>

          {/* Cities List */}
          <div className="space-y-2">
            <Label>Cidades Adicionadas ({cities.length})</Label>
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                Nenhuma cidade adicionada ainda.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {cities.map((city, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{city.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
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
