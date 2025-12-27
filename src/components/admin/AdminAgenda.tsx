import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Calendar, Clock, User, Phone, MapPin, CalendarDays, List, MessageCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
  location: string | null;
  notes: string | null;
  status: string | null;
  tenant_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-700 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function AdminAgenda() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    event_date: "",
    event_time: "",
    event_type: "",
    location: "",
    notes: "",
    status: "pending",
  });

  // Get tenant ID
  const { data: tenantId } = useQuery({
    queryKey: ["my-tenant-id"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      return data?.id;
    },
  });

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-appointments", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!tenantId,
  });

  // Get tenant info for WhatsApp
  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-whatsapp"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("tenants")
        .select("whatsapp_number, name")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  // Send WhatsApp notification
  const sendWhatsAppNotification = (appointment: typeof formData) => {
    if (!tenant?.whatsapp_number) return;
    
    const formattedDate = format(new Date(appointment.event_date), "dd/MM/yyyy", { locale: ptBR });
    const message = `🎉 *Novo Agendamento - ${tenant.name || 'Bella Arte'}*\n\n` +
      `👤 Cliente: ${appointment.client_name}\n` +
      `📅 Data: ${formattedDate}\n` +
      `⏰ Horário: ${appointment.event_time || 'A definir'}\n` +
      `🎊 Tipo: ${appointment.event_type || 'Não especificado'}\n` +
      `📍 Local: ${appointment.location || 'A definir'}\n` +
      `📝 Obs: ${appointment.notes || 'Nenhuma'}`;
    
    const whatsappUrl = `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const appointmentData = {
        ...data,
        tenant_id: tenantId,
        event_time: data.event_time || null,
        client_phone: data.client_phone || null,
        event_type: data.event_type || null,
        location: data.location || null,
        notes: data.notes || null,
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", editingAppointment.id);
        if (error) throw error;
        return { isNew: false, data: appointmentData };
      } else {
        const { error } = await supabase
          .from("appointments")
          .insert(appointmentData);
        if (error) throw error;
        return { isNew: true, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      
      if (result?.isNew && tenant?.whatsapp_number) {
        toast({
          title: "Agendamento criado!",
          description: "Deseja enviar notificação via WhatsApp?",
          action: (
            <Button 
              size="sm" 
              onClick={() => sendWhatsAppNotification(result.data)}
              className="gap-1"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar
            </Button>
          ),
        });
      } else {
        toast({
          title: editingAppointment ? "Agendamento atualizado!" : "Agendamento criado!",
          description: "As alterações foram salvas com sucesso.",
        });
      }
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast({
        title: "Agendamento removido",
        description: "O agendamento foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_phone: "",
      event_date: "",
      event_time: "",
      event_type: "",
      location: "",
      notes: "",
      status: "pending",
    });
    setEditingAppointment(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      client_name: appointment.client_name,
      client_phone: appointment.client_phone || "",
      event_date: appointment.event_date,
      event_time: appointment.event_time || "",
      event_type: appointment.event_type || "",
      location: appointment.location || "",
      notes: appointment.notes || "",
      status: appointment.status || "pending",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.client_name || !formData.event_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do cliente e a data do evento.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return appointments?.filter(apt => 
      isSameDay(parseISO(apt.event_date), date)
    ) || [];
  };

  // Get all dates that have events
  const eventDates = appointments?.map(apt => parseISO(apt.event_date)) || [];

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData(prev => ({ ...prev, event_date: format(date, 'yyyy-MM-dd') }));
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Agenda de Eventos
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Cliente *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>Data do Evento *</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Tipo de Evento</Label>
                  <Input
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    placeholder="Aniversário, Casamento, etc."
                  />
                </div>
                <div className="col-span-2">
                  <Label>Local</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Endereço do evento"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                Calendário
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                Lista
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    locale={ptBR}
                    className="rounded-md border"
                    modifiers={{
                      hasEvent: eventDates,
                    }}
                    modifiersStyles={{
                      hasEvent: {
                        backgroundColor: 'hsl(var(--primary) / 0.2)',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </div>

                {/* Selected Date Events */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">
                    {selectedDate
                      ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "Selecione uma data"}
                  </h3>
                  
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                <span className="font-medium">{appointment.client_name}</span>
                              </div>
                              {appointment.event_time && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {appointment.event_time.slice(0, 5)}
                                </div>
                              )}
                              {appointment.event_type && (
                                <div className="text-sm text-muted-foreground">
                                  🎊 {appointment.event_type}
                                </div>
                              )}
                              {appointment.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {appointment.location}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant="outline" 
                                className={statusColors[appointment.status || "pending"]}
                              >
                                {statusLabels[appointment.status || "pending"]}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(appointment)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => deleteMutation.mutate(appointment.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum evento nesta data</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            event_date: format(selectedDate, 'yyyy-MM-dd')
                          }));
                          setIsDialogOpen(true);
                        }}
                      >
                        + Adicionar agendamento
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="list">
              {appointments && appointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {appointment.client_name}
                            </span>
                            {appointment.client_phone && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {appointment.client_phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(appointment.event_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {appointment.event_time && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {appointment.event_time.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{appointment.event_type || "-"}</TableCell>
                        <TableCell>
                          {appointment.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {appointment.location}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={statusColors[appointment.status || "pending"]}
                          >
                            {statusLabels[appointment.status || "pending"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(appointment)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(appointment.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum agendamento encontrado.</p>
                  <p className="text-sm">Clique em "Novo Agendamento" para adicionar.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}