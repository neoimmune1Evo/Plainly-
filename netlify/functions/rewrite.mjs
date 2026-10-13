
export const config = {
  path: "/api/rewrite",
};

export default async function rewrite(request) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  if (request.method !== "POST") {
    return json({ error: "Use POST for rewriting." }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: "The server is missing its GEMINI_API_KEY setting." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "The request body must be valid JSON." }, 400);
  }

  const originalText =
    body.text ?? body.content ?? body.input ?? body.originalText ?? body.prompt ?? "";

  if (typeof originalText !== "string" || !originalText.trim()) {
    return json({ error: "Please enter some text to rewrite." }, 400);
  }

  const tone = String(body.tone ?? body.style ?? body.mode ?? "clear and natural");
  const task = [
    "You are Plainly, an AI writing assistant.",
    "Improve clarity, grammar, spelling, and flow.",
    "Keep the original meaning and language. Do not invent facts.",
    "Requested tone/style: " + tone,
    "Return only the rewritten text, without quotation marks or commentary.",
    "",
    "Text to rewrite:",
    originalText,
  ].join("\n");

  let upstream;
  try {
    upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: task }] }],
          generationConfig: { temperature: 0.4 },
        }),
      }
    );
  } catch {
    return json({ error: "Could not connect to the AI service. Please try again." }, 502);
  }

  let result;
  try {
    result = await upstream.json();
  } catch {
    return json({ error: "The AI service returned an unreadable response." }, 502);
  }

  if (!upstream.ok) {
    return json(
      { error: result?.error?.message || "The AI service rejected the request." },
      502
    );
  }

  const rewrittenText = result?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!rewrittenText) {
    return json({ error: "The AI service returned no rewritten text." }, 502);
  }

  return json({
    rewrittenText,
    improvedText: rewrittenText,
    rewritten: rewrittenText,
    result: rewrittenText,
    output: rewrittenText,
    text: rewrittenText,
  });
}
