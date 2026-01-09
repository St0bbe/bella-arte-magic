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
      // 1 a 3 anos
      baby_shark: "A cute Baby Shark themed birthday party background with friendly cartoon sharks, underwater ocean scene, bubbles, colorful fish, and cheerful ocean atmosphere with blue and yellow colors.",
      galinha_pintadinha: "A colorful Galinha Pintadinha (Blue Hen) themed birthday party background with the famous blue hen character, farm elements, musical notes, bright blue and yellow colors, Brazilian cartoon style.",
      mundo_bita: "A magical Mundo Bita themed birthday party background with colorful rainbow elements, cute cartoon animals, musical notes, Brazilian kids show style, vibrant and cheerful colors.",
      pocoyo: "A cute Pocoyo themed birthday party background with the blue character Pocoyo, colorful geometric shapes, simple and clean design, blue background with bright accents.",
      peppa_pig: "A cute Peppa Pig themed birthday party background with muddy puddles, colorful houses, blue sky with clouds, green grass, pink and bright cheerful colors.",
      bob_zoom: "A fun Bob Zoom themed birthday party background with the cute cartoon characters, musical elements, colorful and playful atmosphere, Brazilian kids show style.",
      bolofofos: "A cute Bolofofos themed birthday party background with adorable fluffy animal characters, soft pastel colors, hearts, stars, and cozy friendly atmosphere.",
      cocomelon: "A colorful CoComelon themed birthday party background with JJ and family characters, farm elements, watermelon motifs, bright cheerful colors, educational kids show style.",
      patati_patata: "A colorful Patati Patatá clown themed birthday party background with circus elements, red and blue colors, balloons, stars, Brazilian children entertainment style.",
      mickey_baby: "A cute Baby Mickey Mouse themed birthday party background with baby Mickey, soft pastel colors, stars, moons, blocks, and adorable Disney baby style decorations.",
      
      // 4 a 6 anos - Meninos
      homem_aranha: "An amazing Spider-Man themed birthday party background with spider webs, red and blue colors, city skyline, action poses, Marvel superhero style with dynamic energy.",
      batman: "A dark and cool Batman themed birthday party background with Gotham city skyline, bat signal, black and yellow colors, heroic DC Comics atmosphere.",
      super_homem: "An epic Superman themed birthday party background with the Superman logo, red cape elements, blue sky, Metropolis skyline, powerful and heroic atmosphere.",
      hot_wheels: "A Hot Wheels themed birthday party background with racing tracks, flames, fast cars, orange and blue colors, speed and action atmosphere.",
      sonic: "A fast and exciting Sonic the Hedgehog themed birthday party background with Sonic, golden rings, green hills, blue and gold colors, speed effects.",
      patrulha_canina: "A Paw Patrol themed birthday party background with rescue vehicles, badges, blue sky, Adventure Bay, colorful and heroic puppy adventure theme.",
      carros: "A racing Cars movie themed birthday party background with race track, checkered flags, Lightning McQueen style, red colors, exciting motorsport atmosphere.",
      jurassic_world: "A thrilling Jurassic World dinosaur themed birthday party background with T-Rex, jungle environment, adventure atmosphere, green and orange colors.",
      pj_masks: "A heroic PJ Masks themed birthday party background with Catboy, Owlette, Gekko, nighttime cityscape, blue green and red colors, superhero kids adventure.",
      
      // 4 a 6 anos - Meninas
      frozen: "A magical Frozen ice kingdom birthday party background with ice castle, snowflakes, aurora borealis, ice crystals, blue and white winter wonderland with sparkles.",
      princesas_disney: "A magical Disney Princess themed birthday party background with castles, crowns, tiaras, pink and purple colors, sparkles, and enchanting fairy tale atmosphere.",
      barbie: "A Barbie themed birthday party background with pink and sparkly elements, fashion accessories, glamour, stars, and dreamy pink fantasy world.",
      minnie: "A Minnie Mouse themed birthday party background with polka dots, bows, pink and black colors, hearts, flowers, and cute Disney style decorations.",
      encanto: "A magical Encanto themed birthday party background with Colombian flowers, butterflies, the magical casita, vibrant colors, and magical family atmosphere.",
      my_little_pony: "A magical My Little Pony themed birthday party background with colorful ponies, rainbows, clouds, hearts, sparkles, and Equestria fantasy world.",
      unicornio: "A magical unicorn rainbow birthday party background with pastel colors, rainbows, clouds, stars, sparkles, and cute unicorns. Dreamy and magical atmosphere.",
      lol_surprise: "A glamorous LOL Surprise themed birthday party background with glitter, dolls, pink and purple colors, fashion elements, and trendy pop style.",
      
      // 7 a 9 anos
      roblox: "A cool Roblox themed birthday party background with block-style characters, gaming elements, red colors, digital world atmosphere, gaming adventure style.",
      minecraft: "A Minecraft themed birthday party background with blocky pixel art style, Steve character, creepers, TNT, green grass blocks, and gaming adventure.",
      pokemon: "An exciting Pokémon themed birthday party background with Pikachu, pokéballs, colorful Pokémon, yellow and red colors, and adventure atmosphere.",
      mario_bros: "A fun Super Mario Bros themed birthday party background with Mario, mushrooms, coins, green pipes, question blocks, and colorful Nintendo style.",
      sonic_7_9: "A fast and exciting Sonic the Hedgehog themed birthday party background with Sonic, golden rings, green hills, blue and gold colors, speed effects.",
      among_us: "A fun Among Us themed birthday party background with crewmates, spaceship interior, space background, colorful characters, and suspicious mystery atmosphere.",
      fortnite: "An epic Fortnite themed birthday party background with battle royale elements, llamas, purple and blue colors, gaming action, and victory royale style.",
      naruto_7_9: "An exciting Naruto anime themed birthday party background with ninja elements, Konoha village, orange and black colors, Japanese anime style.",
      avengers: "An epic Avengers Marvel themed birthday party background with superhero elements, Avengers logo, red blue and gold colors, heroic team atmosphere.",
      harry_potter_7_9: "A magical Harry Potter themed birthday party background with Hogwarts castle, magic wands, golden snitch, house colors, and wizarding world atmosphere.",
      
      // 10+ anos
      wandinha: "A gothic Wednesday (Wandinha) themed birthday party background with dark aesthetic, black and white colors, spooky mansion, vintage gothic style, and mysterious atmosphere.",
      stranger_things: "A retro Stranger Things themed birthday party background with 80s style, Upside Down elements, neon lights, red and dark colors, supernatural mystery.",
      harry_potter: "A magical Harry Potter themed birthday party background with Hogwarts castle, magic wands, golden snitch, house colors, and wizarding world atmosphere.",
      naruto: "An exciting Naruto/Dragon Ball anime themed birthday party background with ninja and martial arts elements, orange colors, Japanese anime action style.",
      one_piece: "An adventurous One Piece anime themed birthday party background with pirate elements, Straw Hat crew vibes, ocean and treasure, Japanese anime style.",
      fortnite_10: "An epic Fortnite themed birthday party background with battle royale elements, llamas, purple and blue colors, gaming action, and victory royale style.",
      tiktok: "A trendy TikTok themed birthday party background with neon colors, pink and cyan gradients, social media elements, influencer vibes, and modern digital style.",
      kpop: "A glamorous K-Pop BTS themed birthday party background with purple and pink colors, hearts, stars, concert stage elements, and fan culture style.",
      futebol: "A soccer/football themed birthday party background with soccer balls, goal posts, green field, stadium lights, and energetic sports atmosphere.",
      
      // Legacy themes for backward compatibility
      princesas: "A magical princess fairy tale birthday party background with a beautiful castle, pink and purple colors, sparkles, crowns, and butterflies.",
      herois: "An epic superhero birthday party background with comic book style, bold colors like red, blue and yellow, dynamic action lines, city skyline.",
      dinossauros: "A prehistoric dinosaur adventure birthday party background with friendly cartoon dinosaurs, jungle vegetation, volcanoes, green and orange colors.",
      unicornios: "A magical unicorn rainbow birthday party background with pastel colors, rainbows, clouds, stars, sparkles, and cute unicorns.",
      safari: "An African safari adventure birthday party background with cute cartoon animals like lions, elephants, giraffes, zebras, jungle trees.",
      espacial: "A cosmic space adventure birthday party background with rockets, planets, stars, galaxies, astronauts, and deep blue/purple colors.",
      fundo_do_mar: "An underwater ocean adventure birthday party background with colorful fish, coral reefs, sea turtles, bubbles, and blue ocean colors.",
      fazendinha: "A cute farm themed birthday party background with barn, friendly farm animals like cows, pigs, chickens, tractors, and sunny countryside.",
      circo: "A colorful circus themed birthday party background with big top tent, balloons, stars, stripes in red and white, carnival atmosphere.",
      mickey: "A Mickey Mouse themed birthday party background with red, black and yellow colors, polka dots, stars, and classic Disney magic.",
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
