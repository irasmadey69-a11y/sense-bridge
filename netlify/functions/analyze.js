// netlify/functions/analyze.js
export default async (req) => {
  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Use POST" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing OPENAI_API_KEY in environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = (body.text || "").toString().trim();
    const uiLang = (body.uiLang || "PL").toString().trim();

    if (!text) {
      return new Response(
        JSON.stringify({ ok: false, error: "Empty text input." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Model – możesz zmienić na gpt-5-mini jeśli chcesz taniej
    const model = process.env.AI_MODEL || "gpt-5-mini";

    // >>> KLUCZOWE: słowo JSON MUSI być w prompt, gdy używamy json_object <<<
    const system = `
You are Sense Bridge. You MUST output a single valid JSON object and NOTHING else.
The response format is JSON. Do not wrap it in markdown. Do not add extra text.
If you are unsure, still return a valid JSON object with best effort.
Language of explanations should match uiLang.
`.trim();

    const user = `
Analyze the following official message/letter. Return ONLY JSON.

uiLang: ${uiLang}

TEXT:
${text}
`.trim();

    const payload = {
      model,
      // Wymuszamy JSON
      text: { format: { type: "json_object" } },
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.text();

    if (!r.ok) {
      // Przepuszczamy czytelny błąd do UI
      return new Response(
        JSON.stringify({
          ok: false,
          status: r.status,
          error: "OpenAI error",
          details: raw,
        }),
        {
          status: 200, // UI dostaje JSON, a nie twardy 500
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = JSON.parse(raw);

    // Extract output text safely
    const outText =
      (data.output_text && data.output_text.toString()) ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap((o) => (o.content ? o.content : []))
            .filter((c) => c && c.type === "output_text" && c.text)
            .map((c) => c.text)
            .join("\n")
        : "");

    // Ponieważ żądamy json_object, outText ma być JSON-stringiem
    let resultJson = null;
    try {
      resultJson = JSON.parse(outText);
    } catch (e) {
      // Awaryjnie: zwróć surowy tekst do debug
      resultJson = { ok: false, error: "Failed to parse JSON from model.", raw: outText };
    }

    return new Response(
      JSON.stringify({ ok: true, result: resultJson }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Function crash",
        details: String(err?.message || err),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};
