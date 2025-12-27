import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Image, Upload, Filter, X, Tag, Calendar, ChevronDown, Save } from "lucide-react";
import { useFilterOptions, useUpdateFilterOptions } from "@/hooks/useFilterOptions";

interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  theme: string;
  event_type: string;
  is_active: boolean;
  tenant_id: string | null;
}

export function AdminGallery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { themes, eventTypes } = useFilterOptions();
  const { updateThemes, updateEventTypes, isPending: isFiltersPending } = useUpdateFilterOptions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localThemes, setLocalThemes] = useState<string[]>([]);
  const [localEventTypes, setLocalEventTypes] = useState<string[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    theme: "",
    event_type: "",
    is_active: true,
  });

  // Sync filter options
  useEffect(() => {
    if (themes) setLocalThemes(themes);
    if (eventTypes) setLocalEventTypes(eventTypes);
  }, [themes, eventTypes]);

  // Filter management functions
  const addTheme = () => {
    if (newTheme.trim() && !localThemes.includes(newTheme.trim())) {
      setLocalThemes([...localThemes, newTheme.trim()]);
      setNewTheme("");
    }
  };

  const removeTheme = (theme: string) => {
    setLocalThemes(localThemes.filter((t) => t !== theme));
  };

  const addEventType = () => {
    if (newEventType.trim() && !localEventTypes.includes(newEventType.trim())) {
      setLocalEventTypes([...localEventTypes, newEventType.trim()]);
      setNewEventType("");
    }
  };

  const removeEventType = (type: string) => {
    setLocalEventTypes(localEventTypes.filter((t) => t !== type));
  };

  const handleSaveFilters = async () => {
    try {
      await updateThemes(localThemes);
      await updateEventTypes(localEventTypes);
      toast({
        title: "Filtros salvos!",
        description: "As opções de filtro foram atualizadas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get user's tenant
  const { data: userTenant } = useQuery({
    queryKey: ["user-tenant"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      return data;
    },
  });

  const { data: galleryItems, isLoading } = useQuery({
    queryKey: ["admin-gallery", userTenant?.id],
    queryFn: async () => {
      if (!userTenant?.id) return [];
      
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("tenant_id", userTenant.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryItem[];
    },
    enabled: !!userTenant?.id,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast({
        title: "Imagem enviada!",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (!userTenant?.id) throw new Error("Tenant não encontrado");

      const payload = {
        title: data.title,
        image_url: data.image_url,
        theme: data.theme,
        event_type: data.event_type,
        is_active: data.is_active,
        tenant_id: userTenant.id,
      };

      if (data.id) {
        const { error } = await supabase
          .from("gallery_items")
          .update(payload)
          .eq("id", data.id)
          .eq("tenant_id", userTenant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gallery_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast({
        title: editingItem ? "Item atualizado!" : "Item criado!",
        description: "As alterações foram salvas com sucesso.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userTenant?.id) throw new Error("Tenant não encontrado");
      
      // Soft delete - move to trash instead of permanent delete
      const { error } = await supabase
        .from("gallery_items")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", userTenant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-trash"] });
      toast({
        title: "Item movido para lixeira!",
        description: "Você pode restaurar ou excluir permanentemente na aba de lixeira.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      image_url: "",
      theme: "",
      event_type: "",
      is_active: true,
    });
    setEditingItem(null);
    setPreviewUrl(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      image_url: item.image_url,
      theme: item.theme,
      event_type: item.event_type,
      is_active: item.is_active,
    });
    setPreviewUrl(item.image_url);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast({
        title: "Imagem obrigatória",
        description: "Por favor, faça upload de uma imagem.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({
      ...formData,
      id: editingItem?.id,
    });
  };

  return (
    <div className="space-y-6">
      {/* Seção de Filtros - Destacada */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Editar Filtros da Galeria
                  <Badge variant="secondary" className="ml-2">
                    {localThemes.length + localEventTypes.length} opções
                  </Badge>
                </CardTitle>
                <ChevronDown className={`w-5 h-5 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Temas */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
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
                  {localThemes.length === 0 && (
                    <span className="text-sm text-muted-foreground">Nenhum tema cadastrado</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    placeholder="Adicionar tema..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTheme())}
                    className="max-w-xs"
                  />
                  <Button variant="outline" onClick={addTheme} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tipos de Evento */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
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
                  {localEventTypes.length === 0 && (
                    <span className="text-sm text-muted-foreground">Nenhum tipo de evento cadastrado</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    placeholder="Adicionar tipo de evento..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEventType())}
                    className="max-w-xs"
                  />
                  <Button variant="outline" onClick={addEventType} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Botão Salvar Filtros */}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveFilters} disabled={isFiltersPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {isFiltersPending ? "Salvando..." : "Salvar Filtros"}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Card da Galeria */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Fotos da Galeria
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Foto
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Foto" : "Nova Foto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Imagem</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p>Clique para enviar uma imagem</p>
                    </div>
                  )}
                </div>
                {isUploading && (
                  <p className="text-sm text-muted-foreground text-center">
                    Enviando...
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Festa Princesa Maria"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value) =>
                      setFormData({ ...formData, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Evento</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, event_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Visível na galeria</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saveMutation.isPending || isUploading}
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : galleryItems?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma foto na galeria ainda.</p>
            <p className="text-sm">Clique em "Adicionar Foto" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems?.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden border"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div>
                    <p className="text-white font-semibold text-sm truncate">
                      {item.title}
                    </p>
                    <p className="text-white/70 text-xs">{item.theme}</p>
                    <p className="text-white/70 text-xs">{item.event_type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(item)}
                      className="flex-1"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {!item.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Oculto
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
