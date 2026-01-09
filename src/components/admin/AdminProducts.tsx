import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, Pencil, Trash2, Upload, Package, Download, 
  Loader2, ImageIcon, DollarSign, ShoppingBag 
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  subcategory: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  digital_file_url: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: "physical", label: "Produto Físico", icon: Package },
  { value: "digital", label: "Produto Digital", icon: Download },
];

const SUBCATEGORIES = [
  "Temas de Festa",
  "Topos de Bolo",
  "Kits Digitais",
  "Convites",
  "Decoração",
  "Lembrancinhas",
];

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDigital, setUploadingDigital] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compare_at_price: "",
    category: "physical",
    subcategory: "",
    image_url: "",
    is_active: true,
    is_featured: false,
    stock_quantity: "0",
    digital_file_url: "",
  });

  // Fetch tenant ID
  const { data: tenantId } = useQuery({
    queryKey: ["user-tenant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data } = await supabase.rpc("get_user_tenant", { _user_id: user.id });
      return data;
    },
  });

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenantId,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const productData = {
        tenant_id: tenantId,
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        compare_at_price: data.compare_at_price ? parseFloat(data.compare_at_price) : null,
        category: data.category,
        subcategory: data.subcategory || null,
        image_url: data.image_url || null,
        is_active: data.is_active,
        is_featured: data.is_featured,
        stock_quantity: data.category === "digital" ? 999 : parseInt(data.stock_quantity) || 0,
        digital_file_url: data.digital_file_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao salvar produto");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto removido!");
    },
    onError: () => {
      toast.error("Erro ao remover produto");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${tenantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(filePath);
      setFormData({ ...formData, image_url: data.publicUrl });
      toast.success("Imagem enviada!");
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleDigitalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDigital(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${tenantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("digital-products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setFormData({ ...formData, digital_file_url: filePath });
      toast.success("Arquivo digital enviado!");
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploadingDigital(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      compare_at_price: "",
      category: "physical",
      subcategory: "",
      image_url: "",
      is_active: true,
      is_featured: false,
      stock_quantity: "0",
      digital_file_url: "",
    });
    setEditingProduct(null);
    setDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || "",
      category: product.category,
      subcategory: product.subcategory || "",
      image_url: product.image_url || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      stock_quantity: product.stock_quantity.toString(),
      digital_file_url: product.digital_file_url || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error("Preencha nome e preço");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Produtos
          </CardTitle>
          <CardDescription>
            Gerencie seus produtos para venda online
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Imagem do Produto</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="product-image"
                    />
                    <Label htmlFor="product-image" className="cursor-pointer">
                      <Button type="button" variant="outline" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploading ? "Enviando..." : "Upload"}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoria</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBCATEGORIES.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Pricing */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_at_price">Preço anterior (R$)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="compare_at_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.compare_at_price}
                      onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                      className="pl-9"
                      placeholder="Para mostrar desconto"
                    />
                  </div>
                </div>
                {formData.category === "physical" && (
                  <div className="space-y-2">
                    <Label htmlFor="stock">Estoque</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Digital File Upload */}
              {formData.category === "digital" && (
                <div className="space-y-2">
                  <Label>Arquivo Digital</Label>
                  <div className="flex items-center gap-4">
                    {formData.digital_file_url && (
                      <Badge variant="secondary" className="gap-1">
                        <Download className="w-3 h-3" />
                        Arquivo enviado
                      </Badge>
                    )}
                    <Input
                      type="file"
                      onChange={handleDigitalFileUpload}
                      disabled={uploadingDigital}
                      className="hidden"
                      id="digital-file"
                    />
                    <Label htmlFor="digital-file" className="cursor-pointer">
                      <Button type="button" variant="outline" disabled={uploadingDigital} asChild>
                        <span>
                          {uploadingDigital ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploadingDigital ? "Enviando..." : "Upload Arquivo"}
                        </span>
                      </Button>
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este arquivo será enviado ao cliente após a compra
                  </p>
                </div>
              )}

              {/* Switches */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Destaque</Label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {editingProduct ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : products && products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.subcategory && (
                          <p className="text-xs text-muted-foreground">{product.subcategory}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {product.category === "digital" ? (
                        <Download className="w-3 h-3" />
                      ) : (
                        <Package className="w-3 h-3" />
                      )}
                      {product.category === "digital" ? "Digital" : "Físico"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">
                        R$ {product.price.toFixed(2).replace(".", ",")}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          R$ {product.compare_at_price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category === "digital" ? (
                      <span className="text-muted-foreground">∞</span>
                    ) : (
                      <span className={product.stock_quantity <= 0 ? "text-destructive" : ""}>
                        {product.stock_quantity}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.is_active ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                      {product.is_featured && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Remover este produto?")) {
                            deleteMutation.mutate(product.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto cadastrado</p>
            <p className="text-sm">Clique em "Novo Produto" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
