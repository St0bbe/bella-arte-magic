import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Plus, Trash2, Upload, MessageSquare, User } from "lucide-react";

interface Testimonial {
  id: string;
  client_name: string;
  client_photo_url: string | null;
  rating: number;
  comment: string;
  event_type: string | null;
  is_active: boolean;
  created_at: string;
}

export function AdminTestimonials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_name: "",
    rating: 5,
    comment: "",
    event_type: "",
  });

  // Fetch tenant
  const { data: tenant } = useQuery({
    queryKey: ["my-tenant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      return data;
    },
  });

  // Fetch testimonials
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Testimonial[];
    },
    enabled: !!tenant?.id,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${tenant?.id}/testimonials/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("gallery")
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    
    const { data } = supabase.storage.from("gallery").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Tenant não encontrado");
      
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      const { error } = await supabase.from("testimonials").insert({
        tenant_id: tenant.id,
        client_name: formData.client_name,
        client_photo_url: photoUrl,
        rating: formData.rating,
        comment: formData.comment,
        event_type: formData.event_type || null,
        is_active: true,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Depoimento adicionado!" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      let photoUrl = undefined;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      const updateData: any = {
        client_name: formData.client_name,
        rating: formData.rating,
        comment: formData.comment,
        event_type: formData.event_type || null,
      };
      
      if (photoUrl) {
        updateData.client_photo_url = photoUrl;
      }

      const { error } = await supabase
        .from("testimonials")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Depoimento atualizado!" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Depoimento removido!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ client_name: "", rating: 5, comment: "", event_type: "" });
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (testimonial: Testimonial) => {
    setFormData({
      client_name: testimonial.client_name,
      rating: testimonial.rating,
      comment: testimonial.comment,
      event_type: testimonial.event_type || "",
    });
    setPhotoPreview(testimonial.client_photo_url);
    setEditingId(testimonial.id);
    setIsAdding(true);
  };

  const handleSubmit = () => {
    if (!formData.client_name || !formData.comment) {
      toast({ title: "Preencha nome e depoimento", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      addMutation.mutate();
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setFormData({ ...formData, rating: star })}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Depoimentos de Clientes
          </CardTitle>
          <CardDescription>
            Gerencie os depoimentos que aparecem no site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAdding ? (
            <Button onClick={() => setIsAdding(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Depoimento
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Maria Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Evento</Label>
                  <Input
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    placeholder="Aniversário, Batizado..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Avaliação</Label>
                {renderStars(formData.rating, true)}
              </div>

              <div className="space-y-2">
                <Label>Depoimento</Label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="O que o cliente disse sobre o serviço..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto do Cliente (opcional)</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Escolher foto
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Salvar Alterações" : "Adicionar"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List of testimonials */}
      <div className="grid gap-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className={!testimonial.is_active ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {testimonial.client_photo_url ? (
                  <img
                    src={testimonial.client_photo_url}
                    alt={testimonial.client_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {testimonial.client_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{testimonial.client_name}</h4>
                      {testimonial.event_type && (
                        <p className="text-sm text-muted-foreground">{testimonial.event_type}</p>
                      )}
                    </div>
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="mt-2 text-muted-foreground italic">"{testimonial.comment}"</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={testimonial.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: testimonial.id, is_active: checked })
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {testimonial.is_active ? "Visível" : "Oculto"}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => startEdit(testimonial)}>
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(testimonial.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {testimonials.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum depoimento cadastrado ainda.</p>
              <p className="text-sm text-muted-foreground">Adicione depoimentos dos seus clientes satisfeitos!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}