// =========================================================
// AZURE SPEECH SERVICE
// DisasterOS / ResQGrid
// =========================================================

const DEMO_MODE = process.env.AZURE_SPEECH_DEMO_MODE !== "false";

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || "";

const AZURE_SPEECH_REGION =
  process.env.AZURE_SPEECH_REGION || "centralindia";


// =========================================================
// SPEECH TO TEXT
// =========================================================

async function speechToText(audioBuffer) {
  if (!audioBuffer) {
    throw new Error("Audio data is required");
  }

  // -------------------------------------------------------
  // DEMO MODE
  // -------------------------------------------------------

  if (DEMO_MODE) {
    console.log("🎙 Azure Speech → DEMO transcription");

    return {
      success: true,

      provider: "Azure Speech",

      mode: "DEMO",

      text: "I need emergency help. I am trapped and cannot get out.",

      language: "en-IN",

      confidence: 0.94,
    };
  }

  // -------------------------------------------------------
  // REAL AZURE SPEECH API
  // -------------------------------------------------------

  if (!AZURE_SPEECH_KEY) {
    throw new Error("AZURE_SPEECH_KEY is not configured");
  }

  const endpoint =
    `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com` +
    "/speech/recognition/conversation/cognitiveservices/v1";

  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,

      "Content-Type":
        "audio/wav; codecs=audio/pcm; samplerate=16000",

      Accept: "application/json",
    },

    body: audioBuffer,
  });

  if (!response.ok) {
    throw new Error(`Azure Speech error: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: true,

    provider: "Azure Speech",

    mode: "LIVE",

    text: data.DisplayText || "",

    raw: data,
  };
}


// =========================================================
// EXPORT
// =========================================================

module.exports = {
  speechToText,
};