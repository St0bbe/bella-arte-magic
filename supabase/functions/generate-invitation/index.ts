import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, childName, childAge, eventDate, eventTime, eventLocation, additionalInfo, tenantId } = await req.json();

    if (!theme || !childName) {
      return new Response(
        JSON.stringify({ error: "Theme and child name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate a creative prompt for the invitation background
    const themePrompts: Record<string, string> = {
      princesas: "A magical princess fairy tale birthday party background with a beautiful castle, pink and purple colors, sparkles, crowns, and butterflies. Whimsical and enchanting atmosphere.",
      herois: "An epic superhero birthday party background with comic book style, bold colors like red, blue and yellow, dynamic action lines, city skyline, and heroic symbols.",
      dinossauros: "A prehistoric dinosaur adventure birthday party background with friendly cartoon dinosaurs, jungle vegetation, volcanoes in distance, green and orange colors, fun and exciting atmosphere.",
      unicornios: "A magical unicorn rainbow birthday party background with pastel colors, rainbows, clouds, stars, sparkles, and cute unicorns. Dreamy and magical atmosphere.",
      safari: "An African safari adventure birthday party background with cute cartoon animals like lions, elephants, giraffes, zebras, jungle trees, and warm sunset colors.",
      espacial: "A cosmic space adventure birthday party background with rockets, planets, stars, galaxies, astronauts, and deep blue/purple colors. Exciting and futuristic.",
      fundo_do_mar: "An underwater ocean adventure birthday party background with colorful fish, coral reefs, sea turtles, bubbles, and beautiful blue ocean colors.",
      futebol: "A soccer/football themed birthday party background with soccer balls, goal posts, green field, stadium lights, and energetic sports atmosphere.",
      fazendinha: "A cute farm themed birthday party background with barn, friendly farm animals like cows, pigs, chickens, tractors, and sunny countryside.",
      circo: "A colorful circus themed birthday party background with big top tent, balloons, stars, stripes in red and white, fun and festive carnival atmosphere.",
    };

    const basePrompt = themePrompts[theme] || `A fun and colorful ${theme} themed birthday party invitation background. Vibrant, festive, and child-friendly.`;
    const imagePrompt = `Create a beautiful, high-quality birthday party invitation background image. ${basePrompt} The image should have space in the center for text overlay. No text in the image, just decorative elements. Professional quality, suitable for a children's birthday invitation. Ultra high resolution.`;

    console.log("Generating image with prompt:", imagePrompt);

    // Generate image using Lovable AI with image generation model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos à sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("Failed to generate image");
    }

    // Create Supabase client to save the invitation
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save invitation to database
    const { data: invitation, error: insertError } = await supabase
      .from("invitations")
      .insert({
        tenant_id: tenantId || null,
        child_name: childName,
        child_age: childAge || null,
        theme: theme,
        event_date: eventDate || null,
        event_time: eventTime || null,
        event_location: eventLocation || null,
        additional_info: additionalInfo || null,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving invitation:", insertError);
      throw new Error("Failed to save invitation");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation: invitation,
        imageUrl: imageUrl,
        shareUrl: `/convite/${invitation.share_token}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
