import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Check, X, Clock, PartyPopper, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday, isTomorrow, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface EventNotificationsProps {
  appointments: Appointment[];
  onEventClick: (appointment: Appointment) => void;
}

interface Notification {
  id: string;
  type: 'today' | 'tomorrow' | 'upcoming' | 'reminder';
  appointment: Appointment;
  message: string;
  read: boolean;
  createdAt: Date;
}

export function EventNotifications({ appointments, onEventClick }: EventNotificationsProps) {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("notifications-enabled") === "true";
  });
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Check browser notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Generate notifications based on upcoming events
  useEffect(() => {
    if (!appointments || appointments.length === 0) return;

    const now = new Date();
    const newNotifications: Notification[] = [];

    appointments.forEach((apt) => {
      if (apt.status === "cancelled" || apt.status === "completed") return;

      const eventDate = parseISO(apt.event_date);
      const daysUntil = differenceInDays(eventDate, now);

      if (isToday(eventDate)) {
        newNotifications.push({
          id: `today-${apt.id}`,
          type: 'today',
          appointment: apt,
          message: `Evento HOJE: ${apt.client_name}${apt.event_time ? ` às ${apt.event_time.slice(0, 5)}` : ''}`,
          read: false,
          createdAt: now,
        });
      } else if (isTomorrow(eventDate)) {
        newNotifications.push({
          id: `tomorrow-${apt.id}`,
          type: 'tomorrow',
          appointment: apt,
          message: `Evento AMANHÃ: ${apt.client_name}${apt.event_time ? ` às ${apt.event_time.slice(0, 5)}` : ''}`,
          read: false,
          createdAt: now,
        });
      } else if (daysUntil > 0 && daysUntil <= 3) {
        newNotifications.push({
          id: `upcoming-${apt.id}`,
          type: 'upcoming',
          appointment: apt,
          message: `Em ${daysUntil} dias: ${apt.client_name} - ${format(eventDate, "dd/MM", { locale: ptBR })}`,
          read: false,
          createdAt: now,
        });
      }
    });

    // Sort by urgency (today first, then tomorrow, then upcoming)
    newNotifications.sort((a, b) => {
      const priority = { today: 0, tomorrow: 1, upcoming: 2, reminder: 3 };
      return priority[a.type] - priority[b.type];
    });

    setNotifications(newNotifications);
  }, [appointments]);

  // Send browser notification
  const sendBrowserNotification = (title: string, body: string) => {
    if (browserPermission === "granted" && notificationsEnabled) {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "event-notification",
      });
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("notifications-enabled", "true");
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas sobre eventos próximos.",
        });
        
        // Send test notification
        sendBrowserNotification(
          "🎉 Notificações Ativas!",
          "Você receberá alertas sobre eventos próximos."
        );
      }
    }
  };

  // Toggle notifications
  const toggleNotifications = (enabled: boolean) => {
    if (enabled && browserPermission !== "granted") {
      requestPermission();
    } else {
      setNotificationsEnabled(enabled);
      localStorage.setItem("notifications-enabled", enabled.toString());
      toast({
        title: enabled ? "Notificações ativadas" : "Notificações desativadas",
        description: enabled 
          ? "Você receberá alertas sobre eventos próximos."
          : "Você não receberá mais alertas.",
      });
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'today': return <BellRing className="w-4 h-4 text-red-500" />;
      case 'tomorrow': return <Bell className="w-4 h-4 text-orange-500" />;
      case 'upcoming': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationBadge = (type: Notification['type']) => {
    switch (type) {
      case 'today': return <Badge className="bg-red-500 text-white">HOJE</Badge>;
      case 'tomorrow': return <Badge className="bg-orange-500 text-white">AMANHÃ</Badge>;
      case 'upcoming': return <Badge variant="secondary">EM BREVE</Badge>;
      default: return null;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {notificationsEnabled ? (
            unreadCount > 0 ? (
              <BellRing className="w-5 h-5 animate-bounce" />
            ) : (
              <Bell className="w-5 h-5" />
            )
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-toggle" className="text-sm text-muted-foreground">
              Alertas de eventos
            </Label>
            <Switch
              id="notifications-toggle"
              checked={notificationsEnabled}
              onCheckedChange={toggleNotifications}
            />
          </div>
          {browserPermission === "denied" && (
            <p className="text-xs text-red-500 mt-2">
              Notificações bloqueadas no navegador. Permita nas configurações.
            </p>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PartyPopper className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs">Eventos próximos aparecerão aqui</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    onEventClick(notification.appointment);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {notification.appointment.client_name}
                          </span>
                        </div>
                        {getNotificationBadge(notification.type)}
                      </div>
                      {notification.appointment.event_type && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <PartyPopper className="w-3 h-3" />
                          {notification.appointment.event_type}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(notification.appointment.event_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        {notification.appointment.event_time && ` às ${notification.appointment.event_time.slice(0, 5)}`}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">
              {notifications.filter(n => n.type === 'today').length} evento(s) hoje •{" "}
              {notifications.filter(n => n.type === 'tomorrow').length} amanhã
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
