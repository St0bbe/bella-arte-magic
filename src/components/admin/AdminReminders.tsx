import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bell, MessageCircle, Clock, User, MapPin, Calendar, Check, History, RefreshCw, Loader2 } from "lucide-react";
import { format, addDays, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
  location: string | null;
  status: string | null;
}

interface ReminderLog {
  id: string;
  appointment_id: string;
  client_name: string;
  client_phone: string | null;
  event_date: string;
  event_time: string | null;
  message: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export function AdminReminders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRunningCron, setIsRunningCron] = useState(false);

  // Get tenant ID and info
  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-reminders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("tenants")
        .select("id, name, whatsapp_number")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  // Fetch upcoming appointments (next 48 hours)
  const { data: upcomingAppointments, isLoading } = useQuery({
    queryKey: ["upcoming-reminders", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const today = new Date();
      const twoDaysLater = addDays(today, 2);
      
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("tenant_id", tenant.id)
        .gte("event_date", format(today, 'yyyy-MM-dd'))
        .lte("event_date", format(twoDaysLater, 'yyyy-MM-dd'))
        .in("status", ["pendente", "confirmado"])
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!tenant?.id,
    refetchInterval: 60000,
  });

  // Fetch reminder logs
  const { data: reminderLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["reminder-logs", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from("reminder_logs")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ReminderLog[];
    },
    enabled: !!tenant?.id,
  });

  // Run the automated reminders
  const runAutomatedReminders = async () => {
    setIsRunningCron(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-reminders');
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["reminder-logs"] });
      
      toast({
        title: "Lembretes processados",
        description: `${data.reminders_sent || 0} lembretes foram registrados.`,
      });
    } catch (error: any) {
      console.error("Error running reminders:", error);
      toast({
        title: "Erro ao processar lembretes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunningCron(false);
    }
  };

  // Categorize appointments
  const categorizeAppointments = () => {
    if (!upcomingAppointments) return { today: [], tomorrow: [], in48h: [] };
    
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfter = startOfDay(addDays(now, 2));

    const todayEvents = upcomingAppointments.filter(apt => {
      const date = parseISO(apt.event_date);
      return isWithinInterval(date, { start: today, end: endOfDay(today) });
    });

    const tomorrowEvents = upcomingAppointments.filter(apt => {
      const date = parseISO(apt.event_date);
      return isWithinInterval(date, { start: tomorrow, end: endOfDay(tomorrow) });
    });

    const in48hEvents = upcomingAppointments.filter(apt => {
      const date = parseISO(apt.event_date);
      return isWithinInterval(date, { start: dayAfter, end: endOfDay(dayAfter) });
    });

    return { today: todayEvents, tomorrow: tomorrowEvents, in48h: in48hEvents };
  };

  const { today, tomorrow, in48h } = categorizeAppointments();

  // Check if reminder was already sent
  const wasReminderSent = (appointmentId: string) => {
    return reminderLogs?.some(log => 
      log.appointment_id === appointmentId && log.status === 'sent'
    );
  };

  // Send reminder via WhatsApp
  const sendReminder = async (appointment: Appointment, type: 'today' | 'tomorrow' | '48h') => {
    if (!appointment.client_phone) {
      toast({
        title: "Telefone não informado",
        description: "O cliente não tem telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    const formattedDate = format(parseISO(appointment.event_date), "EEEE, dd 'de' MMMM", { locale: ptBR });
    
    let timeText = '';
    if (type === 'today') {
      timeText = 'HOJE';
    } else if (type === 'tomorrow') {
      timeText = 'AMANHÃ';
    } else {
      timeText = 'em 2 dias';
    }

    const message = `⏰ *Lembrete - ${tenant?.name || 'Bella Arte'}*\n\n` +
      `Olá ${appointment.client_name}! 👋\n\n` +
      `Estamos passando para lembrar do seu evento ${timeText}!\n\n` +
      `📅 *Data:* ${formattedDate}\n` +
      `⏰ *Horário:* ${appointment.event_time ? appointment.event_time.slice(0, 5) : 'A confirmar'}\n` +
      `🎊 *Tipo:* ${appointment.event_type || 'Evento'}\n` +
      (appointment.location ? `📍 *Local:* ${appointment.location}\n` : '') +
      `\nQualquer dúvida, estamos à disposição! 😊`;

    // Log the reminder
    try {
      await supabase.from("reminder_logs").insert({
        appointment_id: appointment.id,
        tenant_id: tenant?.id,
        client_name: appointment.client_name,
        client_phone: appointment.client_phone,
        event_date: appointment.event_date,
        event_time: appointment.event_time,
        message: message,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      
      queryClient.invalidateQueries({ queryKey: ["reminder-logs"] });
    } catch (error) {
      console.error("Error logging reminder:", error);
    }

    const whatsappUrl = `https://wa.me/${appointment.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "Lembrete enviado!",
      description: `Lembrete para ${appointment.client_name} foi aberto no WhatsApp.`,
    });
  };

  const ReminderCard = ({ 
    appointments, 
    title, 
    type, 
    variant 
  }: { 
    appointments: Appointment[]; 
    title: string; 
    type: 'today' | 'tomorrow' | '48h';
    variant: 'destructive' | 'warning' | 'default';
  }) => {
    const bgColor = variant === 'destructive' 
      ? 'bg-red-500/10 border-red-500/30' 
      : variant === 'warning' 
        ? 'bg-yellow-500/10 border-yellow-500/30'
        : 'bg-blue-500/10 border-blue-500/30';

    if (appointments.length === 0) return null;

    return (
      <div className={`rounded-lg border p-4 ${bgColor}`}>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {title} ({appointments.length})
        </h3>
        <div className="space-y-3">
          {appointments.map((apt) => {
            const alreadySent = wasReminderSent(apt.id);
            return (
              <div key={apt.id} className="bg-background rounded-lg p-3 border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">{apt.client_name}</span>
                      {alreadySent && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Enviado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {apt.event_time ? apt.event_time.slice(0, 5) : 'Horário a confirmar'}
                    </div>
                    {apt.event_type && (
                      <div className="text-sm text-muted-foreground">
                        🎊 {apt.event_type}
                      </div>
                    )}
                    {apt.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {apt.location}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={alreadySent ? "outline" : "default"}
                    onClick={() => sendReminder(apt, type)}
                    disabled={!apt.client_phone}
                    className="gap-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {alreadySent ? "Reenviar" : "Enviar"}
                  </Button>
                </div>
                {!apt.client_phone && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Telefone não cadastrado
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReminders = today.length + tomorrow.length + in48h.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Lembretes de Eventos
              {totalReminders > 0 && (
                <Badge variant="secondary">{totalReminders}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Envie lembretes via WhatsApp para clientes com eventos próximos
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runAutomatedReminders}
            disabled={isRunningCron}
            className="gap-2"
          >
            {isRunningCron ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Executar Automático
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Bell className="w-4 h-4" />
              Próximos Eventos
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Histórico de Envios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {totalReminders === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>Nenhum evento próximo!</p>
                <p className="text-sm">Todos os lembretes estão em dia.</p>
              </div>
            ) : (
              <>
                <ReminderCard 
                  appointments={today} 
                  title="Eventos HOJE" 
                  type="today"
                  variant="destructive" 
                />
                <ReminderCard 
                  appointments={tomorrow} 
                  title="Eventos AMANHÃ" 
                  type="tomorrow"
                  variant="warning" 
                />
                <ReminderCard 
                  appointments={in48h} 
                  title="Eventos em 2 dias" 
                  type="48h"
                  variant="default" 
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="history">
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              </div>
            ) : !reminderLogs || reminderLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum lembrete enviado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reminderLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'sent' ? 'bg-green-500' : 
                        log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">{log.client_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(log.event_date), "dd/MM/yyyy")}
                          {log.event_time && ` às ${log.event_time.slice(0, 5)}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                        {log.status === 'sent' ? 'Enviado' : 
                         log.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </Badge>
                      {log.sent_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(log.sent_at), "dd/MM HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
