import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { input } = await req.json();

    if (typeof input !== "string" || input.trim().length === 0) {
      return new Response(JSON.stringify({ error: "input is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const embedding = await model.run(input.trim(), {
      mean_pool: true,
      normalize: true,
    });

    return new Response(JSON.stringify({ embedding }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Embedding generation failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
