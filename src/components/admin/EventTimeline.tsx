import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MapPin, User, Phone, PartyPopper, DollarSign, CheckCircle, AlertCircle, XCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  estimated_value: number | null;
}

interface EventTimelineProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
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

export function EventTimeline({ appointments, onEdit }: EventTimelineProps) {
  // Group appointments by month
  const groupedByMonth = appointments.reduce((acc, apt) => {
    const monthKey = format(parseISO(apt.event_date), "yyyy-MM");
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedMonths = Object.keys(groupedByMonth).sort();

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return { label: "Hoje", highlight: true };
    if (isTomorrow(date)) return { label: "Amanhã", highlight: true };
    const days = differenceInDays(date, new Date());
    if (days > 0 && days <= 7) return { label: `Em ${days} dias`, highlight: false };
    if (isPast(date)) return { label: "Passado", highlight: false };
    return { label: format(date, "EEEE", { locale: ptBR }), highlight: false };
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <PartyPopper className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg">Nenhum evento encontrado</p>
        <p className="text-sm">Adicione seu primeiro evento para ver a timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedMonths.map((monthKey) => {
        const monthAppointments = groupedByMonth[monthKey];
        const monthDate = parseISO(`${monthKey}-01`);
        
        return (
          <div key={monthKey} className="relative">
            {/* Month Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                {format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}
                <Badge variant="secondary" className="ml-2">
                  {monthAppointments.length} evento{monthAppointments.length > 1 ? 's' : ''}
                </Badge>
              </h3>
            </div>

            {/* Timeline */}
            <div className="relative pl-8">
              {/* Vertical Line */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

              {/* Events */}
              <div className="space-y-4">
                {monthAppointments
                  .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                  .map((appointment, index) => {
                    const status = appointment.status || "pending";
                    const StatusIcon = statusIcons[status];
                    const dateInfo = getDateLabel(appointment.event_date);
                    const eventDate = parseISO(appointment.event_date);
                    const isPastEvent = isPast(eventDate) && !isToday(eventDate);

                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          "relative group",
                          isPastEvent && status !== "completed" && "opacity-60"
                        )}
                      >
                        {/* Timeline Dot */}
                        <div className={cn(
                          "absolute -left-5 w-4 h-4 rounded-full border-2 border-background transition-transform group-hover:scale-125",
                          statusColors[status]
                        )}>
                          {dateInfo.highlight && (
                            <div className="absolute inset-0 rounded-full animate-ping bg-primary/50" />
                          )}
                        </div>

                        {/* Event Card */}
                        <div
                          className={cn(
                            "ml-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                            "hover:shadow-lg hover:border-primary/50",
                            dateInfo.highlight 
                              ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30"
                              : "bg-card border-border"
                          )}
                          onClick={() => onEdit(appointment)}
                        >
                          {/* Date Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold",
                                dateInfo.highlight 
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {format(eventDate, "dd MMM", { locale: ptBR }).toUpperCase()}
                              </div>
                              {dateInfo.highlight && (
                                <Badge variant="default" className="animate-pulse">
                                  {dateInfo.label}
                                </Badge>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "gap-1",
                                status === "confirmed" && "border-green-500 text-green-600",
                                status === "pending" && "border-yellow-500 text-yellow-600",
                                status === "completed" && "border-blue-500 text-blue-600",
                                status === "cancelled" && "border-red-500 text-red-600"
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[status]}
                            </Badge>
                          </div>

                          {/* Event Details */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-lg">{appointment.client_name}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {appointment.event_time && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{appointment.event_time.slice(0, 5)}</span>
                                </div>
                              )}
                              {appointment.event_type && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <PartyPopper className="w-3 h-3" />
                                  <span>{appointment.event_type}</span>
                                </div>
                              )}
                              {appointment.location && (
                                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{appointment.location}</span>
                                </div>
                              )}
                              {appointment.client_phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>{appointment.client_phone}</span>
                                </div>
                              )}
                            </div>

                            {appointment.estimated_value && appointment.estimated_value > 0 && (
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                <span className="font-bold text-emerald-600">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.estimated_value)}
                                </span>
                              </div>
                            )}

                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground italic mt-2 line-clamp-2">
                                "{appointment.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
