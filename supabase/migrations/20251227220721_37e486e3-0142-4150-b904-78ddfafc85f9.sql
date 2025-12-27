-- Create reminder_logs table to track sent reminders
CREATE TABLE public.reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Policies for reminder_logs
CREATE POLICY "Admins can view all reminder logs for their tenant"
ON public.reminder_logs
FOR SELECT
USING (
  tenant_id IN (SELECT public.get_user_tenant(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "System can insert reminder logs"
ON public.reminder_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update reminder logs"
ON public.reminder_logs
FOR UPDATE
USING (true);

-- Create index for efficient queries
CREATE INDEX idx_reminder_logs_appointment ON public.reminder_logs(appointment_id);
CREATE INDEX idx_reminder_logs_tenant ON public.reminder_logs(tenant_id);
CREATE INDEX idx_reminder_logs_status ON public.reminder_logs(status);