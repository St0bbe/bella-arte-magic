import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Pencil, Trash2, Calendar, Clock, User, Phone, MapPin, 
  CalendarDays, List, MessageCircle, Repeat, DollarSign, 
  TrendingUp, CheckCircle, AlertCircle, XCircle, Eye,
  ChevronRight, Sparkles, PartyPopper, GitBranch
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, addDays, addWeeks, addMonths, isToday, isTomorrow, isThisWeek, isThisMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventTimeline } from "./EventTimeline";
import { EventNotifications } from "./EventNotifications";

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
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  parent_appointment_id: string | null;
  estimated_value: number | null;
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

const statusIcons: Record<string, any> = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  completed: Sparkles,
  cancelled: XCircle,
};

const recurrenceLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
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
    recurrence_type: "",
    recurrence_end_date: "",
    estimated_value: "",
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
  const sendWhatsAppNotification = (appointment: { 
    client_name: string; 
    event_date: string; 
    event_time: string; 
    event_type: string; 
    location: string; 
    notes: string;
    estimated_value?: string | number;
  }) => {
    if (!tenant?.whatsapp_number) return;
    
    const formattedDate = format(new Date(appointment.event_date), "dd/MM/yyyy", { locale: ptBR });
    const estimatedValue = appointment.estimated_value 
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(appointment.estimated_value))
      : 'A definir';
    const message = `🎉 *Novo Agendamento - ${tenant.name || 'Bella Arte'}*\n\n` +
      `👤 Cliente: ${appointment.client_name}\n` +
      `📅 Data: ${formattedDate}\n` +
      `⏰ Horário: ${appointment.event_time || 'A definir'}\n` +
      `🎊 Tipo: ${appointment.event_type || 'Não especificado'}\n` +
      `📍 Local: ${appointment.location || 'A definir'}\n` +
      `💰 Valor: ${estimatedValue}\n` +
      `📝 Obs: ${appointment.notes || 'Nenhuma'}`;
    
    const whatsappUrl = `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const appointmentData = {
        client_name: data.client_name,
        client_phone: data.client_phone || null,
        event_date: data.event_date,
        event_time: data.event_time || null,
        event_type: data.event_type || null,
        location: data.location || null,
        notes: data.notes || null,
        status: data.status,
        tenant_id: tenantId,
        recurrence_type: data.recurrence_type || null,
        recurrence_end_date: data.recurrence_end_date || null,
        estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : 0,
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", editingAppointment.id);
        if (error) throw error;
        return { isNew: false, data: appointmentData };
      } else {
        // Insert the main appointment
        const { data: insertedAppointment, error } = await supabase
          .from("appointments")
          .insert(appointmentData)
          .select()
          .single();
        if (error) throw error;

        // Create recurring appointments if recurrence is set
        if (data.recurrence_type && data.recurrence_end_date) {
          const recurringAppointments = [];
          let currentDate = parseISO(data.event_date);
          const endDate = parseISO(data.recurrence_end_date);

          while (currentDate <= endDate) {
            // Get next date based on recurrence type
            if (data.recurrence_type === 'weekly') {
              currentDate = addWeeks(currentDate, 1);
            } else if (data.recurrence_type === 'biweekly') {
              currentDate = addWeeks(currentDate, 2);
            } else if (data.recurrence_type === 'monthly') {
              currentDate = addMonths(currentDate, 1);
            }

            if (currentDate <= endDate) {
              recurringAppointments.push({
                ...appointmentData,
                event_date: format(currentDate, 'yyyy-MM-dd'),
                parent_appointment_id: insertedAppointment.id,
              });
            }
          }

          if (recurringAppointments.length > 0) {
            const { error: recError } = await supabase
              .from("appointments")
              .insert(recurringAppointments);
            if (recError) throw recError;
          }
        }

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
      recurrence_type: "",
      recurrence_end_date: "",
      estimated_value: "",
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
      recurrence_type: appointment.recurrence_type || "",
      recurrence_end_date: appointment.recurrence_end_date || "",
      estimated_value: appointment.estimated_value?.toString() || "",
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

  // Stats calculations
  const stats = useMemo(() => {
    if (!appointments) return { total: 0, pending: 0, confirmed: 0, thisWeek: 0, thisMonth: 0, revenue: 0 };
    
    const now = new Date();
    const futureEvents = appointments.filter(a => new Date(a.event_date) >= now && a.status !== "cancelled");
    
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === "pending").length,
      confirmed: appointments.filter(a => a.status === "confirmed").length,
      thisWeek: futureEvents.filter(a => isThisWeek(parseISO(a.event_date), { locale: ptBR })).length,
      thisMonth: futureEvents.filter(a => isThisMonth(parseISO(a.event_date))).length,
      revenue: appointments
        .filter(a => a.status === "completed" || a.status === "confirmed")
        .reduce((sum, a) => sum + (a.estimated_value || 0), 0),
    };
  }, [appointments]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    if (!appointments) return [];
    const now = new Date();
    return appointments
      .filter(a => {
        const eventDate = parseISO(a.event_date);
        const daysDiff = differenceInDays(eventDate, now);
        return daysDiff >= 0 && daysDiff <= 7 && a.status !== "cancelled";
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 5);
  }, [appointments]);

  const getEventDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total de Eventos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Confirmados</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
              </div>
              <PartyPopper className="w-8 h-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="text-lg font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.revenue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Quick View */}
      {upcomingEvents.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Eventos nos próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const StatusIcon = statusIcons[event.status || "pending"];
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/80 border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleEdit(event)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                        isToday(parseISO(event.event_date)) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <span className="text-xs font-medium">
                          {format(parseISO(event.event_date), "MMM", { locale: ptBR }).toUpperCase()}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {format(parseISO(event.event_date), "dd")}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.client_name}</span>
                          <Badge variant="outline" className={`text-xs ${statusColors[event.status || "pending"]}`}>
                            {statusLabels[event.status || "pending"]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {event.event_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.event_time}
                            </span>
                          )}
                          {event.event_type && (
                            <span className="flex items-center gap-1">
                              <PartyPopper className="w-3 h-3" />
                              {event.event_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.estimated_value && event.estimated_value > 0 && (
                        <span className="text-sm font-medium text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.estimated_value)}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Agenda Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Agenda de Eventos
            </CardTitle>
            <CardDescription>Gerencie todos os seus agendamentos</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {appointments && (
              <EventNotifications 
                appointments={appointments} 
                onEventClick={handleEdit}
              />
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="bg-gradient-to-r from-primary to-secondary">
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
                <div>
                  <Label className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Valor Estimado
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
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
                {!editingAppointment && (
                  <>
                    <div>
                      <Label className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        Recorrência
                      </Label>
                      <Select
                        value={formData.recurrence_type}
                        onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sem recorrência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem recorrência</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.recurrence_type && formData.recurrence_type !== "none" && (
                      <div>
                        <Label>Até quando?</Label>
                        <Input
                          type="date"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                        />
                      </div>
                    )}
                  </>
                )}
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
          </div>
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
              <TabsTrigger value="timeline" className="gap-2">
                <GitBranch className="w-4 h-4" />
                Timeline
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

            <TabsContent value="timeline">
              {appointments && (
                <EventTimeline 
                  appointments={appointments} 
                  onEdit={handleEdit}
                />
              )}
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
    </div>
  );
}