import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminFilterOptions, useUpdateFilterOptions } from "@/hooks/useFilterOptions";
import { Filter, Plus, X, Save, Tag, Calendar, Loader2 } from "lucide-react";

export function AdminFilters() {
  const { toast } = useToast();
  const { themes, eventTypes, isLoading } = useAdminFilterOptions();
  const { updateThemes, updateEventTypes, isPending } = useUpdateFilterOptions();
  
  const [localThemes, setLocalThemes] = useState<string[]>([]);
  const [localEventTypes, setLocalEventTypes] = useState<string[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (themes && Array.isArray(themes)) {
      setLocalThemes(themes);
    }
    if (eventTypes && Array.isArray(eventTypes)) {
      setLocalEventTypes(eventTypes);
    }
  }, [themes, eventTypes]);

  const addTheme = () => {
    const trimmed = newTheme.trim();
    if (trimmed && !localThemes.includes(trimmed)) {
      setLocalThemes([...localThemes, trimmed]);
      setNewTheme("");
      setHasChanges(true);
    }
  };

  const removeTheme = (theme: string) => {
    setLocalThemes(localThemes.filter((t) => t !== theme));
    setHasChanges(true);
  };

  const addEventType = () => {
    const trimmed = newEventType.trim();
    if (trimmed && !localEventTypes.includes(trimmed)) {
      setLocalEventTypes([...localEventTypes, trimmed]);
      setNewEventType("");
      setHasChanges(true);
    }
  };

  const removeEventType = (type: string) => {
    setLocalEventTypes(localEventTypes.filter((t) => t !== type));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      console.log("Saving themes:", localThemes);
      console.log("Saving event types:", localEventTypes);
      await updateThemes(localThemes);
      await updateEventTypes(localEventTypes);
      setHasChanges(false);
      toast({
        title: "Filtros salvos!",
        description: "As opções de filtro foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Error saving filters:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          Gerenciar Filtros da Galeria
        </CardTitle>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "Salvando..." : "Salvar Filtros"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Temas
          </h3>
          <div className="flex flex-wrap gap-2">
            {localThemes.map((theme) => (
              <Badge
                key={theme}
                variant="secondary"
                className="text-sm py-1.5 px-3 flex items-center gap-2"
              >
                {theme}
                <button
                  onClick={() => removeTheme(theme)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              placeholder="Novo tema..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTheme())}
              className="max-w-xs"
            />
            <Button variant="outline" onClick={addTheme} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tipos de Evento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Tipos de Evento
          </h3>
          <div className="flex flex-wrap gap-2">
            {localEventTypes.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className="text-sm py-1.5 px-3 flex items-center gap-2"
              >
                {type}
                <button
                  onClick={() => removeEventType(type)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
              placeholder="Novo tipo de evento..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEventType())}
              className="max-w-xs"
            />
            <Button variant="outline" onClick={addEventType} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
