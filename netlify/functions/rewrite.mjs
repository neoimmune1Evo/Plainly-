
export const config = {
  path: "/api/rewrite",
};

export default async function rewrite(request) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });

  if (request.method !== "POST") {
    return json({ error: "Use POST for rewriting." }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return json(
      { error: "The server is missing its GEMINI_API_KEY setting." },
      500
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "The request body must be valid JSON." }, 400);
  }

  const originalText =
    body.text ??
    body.content ??
    body.input ??
    body.originalText ??
    body.prompt ??
    "";

  if (typeof originalText !== "string" || !originalText.trim()) {
    return json({ error: "Please enter some text to rewrite." }, 400);
  }

  if (originalText.length > 30000) {
    return json(
      { error: "Please keep your text under 30,000 characters." },
      400
    );
  }

  const tone = String(
    body.tone ?? body.style ?? body.mode ?? "clear and natural"
  ).slice(0, 100);

  const task = [
    "You are Plainly, a careful writing editor.",
    "",
    "Rewrite the supplied text to improve clarity, grammar, readability, and flow.",
    "Use clear, natural language appropriate for the original context.",
    "Improve awkward sentences, repetitive wording, and weak transitions when useful.",
    "Do not merely replace individual words with synonyms.",
    "Vary sentence structure when it improves readability.",
    "Preserve the original meaning, facts, intent, and level of certainty.",
    "Do not invent evidence, citations, claims, or personal experiences.",
    "Keep the original language.",
    "Keep approximately the same length unless the user requests otherwise.",
    "Respect the requested tone without making the writing exaggerated or unnatural.",
    "If the original is already clear, make only useful improvements.",
    "Return only the revised text, without quotation marks or commentary.",
    "",
    "Requested tone: " + tone,
    "",
    "Text to rewrite:",
    originalText.trim(),
  ].join("\n");

  let upstream;

  try {
    upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: task }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";

    return json(
      {
        error: timedOut
          ? "The AI service took too long to respond. Please try again."
          : "Could not connect to the AI service. Please try again.",
      },
      502
    );
  }

  let result;

  try {
    result = await upstream.json();
  } catch {
    return json(
      { error: "The AI service returned an unreadable response." },
      502
    );
  }

  if (!upstream.ok) {
    console.error("Gemini API error:", result?.error?.message);

    return json(
      {
        error:
          result?.error?.message ||
          "The AI service could not complete the rewrite. Please try again.",
      },
      502
    );
  }

  const rewrittenText = result?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!rewrittenText) {
    return json(
      {
        error:
          "The AI service returned no rewritten text. Please try again.",
      },
      502
    );
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
