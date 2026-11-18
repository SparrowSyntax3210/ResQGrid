// =========================================================
// HUME AI SERVICE
// DisasterOS / ResQGrid
// =========================================================

const DEMO_MODE = process.env.HUME_DEMO_MODE !== "false";

const HUME_API_KEY = process.env.HUME_API_KEY || "";
const HUME_API_URL = "https://api.hume.ai/v0";

// =========================================================
// ANALYZE SOS EMOTION / URGENCY
// =========================================================

async function analyzeSOS(text) {
  if (!text) {
    throw new Error("SOS text is required");
  }

  // -------------------------------------------------------
  // DEMO MODE
  // -------------------------------------------------------

  if (DEMO_MODE) {
    console.log("🧠 Hume AI → DEMO analysis");

    const lowerText = text.toLowerCase();

    let urgency = "MEDIUM";
    let emotion = "DISTRESSED";
    let confidence = 0.91;

    if (
      lowerText.includes("help") ||
      lowerText.includes("emergency") ||
      lowerText.includes("trapped") ||
      lowerText.includes("danger")
    ) {
      urgency = "CRITICAL";
      emotion = "PANIC";
      confidence = 0.96;
    }

    return {
      success: true,
      provider: "Hume AI",
      mode: "DEMO",

      emotion,
      urgency,
      confidence,

      analysis: {
        distress: confidence,
        fear: urgency === "CRITICAL" ? 0.94 : 0.62,
        calm: urgency === "CRITICAL" ? 0.08 : 0.42,
      },
    };
  }

  // -------------------------------------------------------
  // REAL HUME API
  // -------------------------------------------------------

  if (!HUME_API_KEY) {
    throw new Error("HUME_API_KEY is not configured");
  }

  const response = await fetch(`${HUME_API_URL}/analyze`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "X-Hume-Api-Key": HUME_API_KEY,
    },

    body: JSON.stringify({
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Hume API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: true,
    provider: "Hume AI",
    mode: "LIVE",
    data,
  };
}

// =========================================================
// EXPORT
// =========================================================

module.exports = {
  analyzeSOS,
};
