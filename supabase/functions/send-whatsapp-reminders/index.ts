import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting WhatsApp reminder check...");

    // Get current date/time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(now.getHours() + 24);
    
    // Format dates for comparison
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Checking appointments between ${todayStr} and ${tomorrowStr}`);

    // Find appointments in the next 24 hours that haven't been reminded yet
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        *,
        tenants!inner(
          id,
          name,
          whatsapp_number
        )
      `)
      .gte("event_date", todayStr)
      .lte("event_date", tomorrowStr)
      .in("status", ["confirmado", "pendente"])
      .order("event_date", { ascending: true });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    console.log(`Found ${appointments?.length || 0} appointments in the next 24 hours`);

    const results = [];

    for (const appointment of appointments || []) {
      // Check if reminder was already sent for this appointment
      const { data: existingReminder } = await supabase
        .from("reminder_logs")
        .select("id")
        .eq("appointment_id", appointment.id)
        .eq("status", "sent")
        .maybeSingle();

      if (existingReminder) {
        console.log(`Reminder already sent for appointment ${appointment.id}`);
        continue;
      }

      // Skip if no phone number
      if (!appointment.client_phone) {
        console.log(`No phone number for appointment ${appointment.id}`);
        continue;
      }

      // Format the reminder message
      const eventDate = new Date(appointment.event_date);
      const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const message = `🎉 Olá ${appointment.client_name}!\n\n` +
        `Lembramos que sua festa está agendada para *${formattedDate}*` +
        (appointment.event_time ? ` às *${appointment.event_time}*` : '') +
        (appointment.location ? `\n📍 Local: ${appointment.location}` : '') +
        (appointment.event_type ? `\n🎈 Evento: ${appointment.event_type}` : '') +
        `\n\nQualquer dúvida, entre em contato conosco!` +
        `\n\n${appointment.tenants?.name || 'Equipe'}`;

      // Create the reminder log
      const { data: reminderLog, error: insertError } = await supabase
        .from("reminder_logs")
        .insert({
          appointment_id: appointment.id,
          tenant_id: appointment.tenant_id,
          client_name: appointment.client_name,
          client_phone: appointment.client_phone,
          event_date: appointment.event_date,
          event_time: appointment.event_time,
          message: message,
          status: "sent",
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Error creating reminder log for appointment ${appointment.id}:`, insertError);
        continue;
      }

      // Generate WhatsApp link (the actual sending would require WhatsApp Business API)
      const phoneNumber = appointment.client_phone.replace(/\D/g, '');
      const whatsappLink = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;

      results.push({
        appointment_id: appointment.id,
        client_name: appointment.client_name,
        event_date: appointment.event_date,
        whatsapp_link: whatsappLink,
        reminder_id: reminderLog?.id
      });

      console.log(`Reminder logged for appointment ${appointment.id} - ${appointment.client_name}`);
    }

    console.log(`Processed ${results.length} reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: results.length,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
