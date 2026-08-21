const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

// ==========================================================
// OPENAI SPEECH TO TEXT
// ==========================================================

async function transcribeAudio(audioPath) {
  try {

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing from .env");
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error("Audio file does not exist.");
    }

    const stats = fs.statSync(audioPath);

    const form = new FormData();

form.append(
  "file",
  fs.createReadStream(audioPath),
  {
    filename: "sos-recording.webm",
    contentType: "audio/webm",
  }
);

form.append("model", "whisper-large-v3-turbo");

const response = await axios.post(
  "https://api.groq.com/openai/v1/audio/transcriptions",
  form,
  {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },

    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 120000,
  }
);

    const transcript =
      response.data?.text?.trim() || "";

    console.log("📝 TRANSCRIPT:");
    console.log(transcript);

    if (!transcript) {
      throw new Error("No speech detected in recording.");
    }

    return transcript;

  } catch (error) {

    console.error(
      "Status:",
      error.response?.status
    );

    console.error(
      "Response:",
      error.response?.data
    );

    console.error(
      "Message:",
      error.message
    );

    throw new Error(
      "Unable to convert SOS voice to text."
    );
  }
}


// ==========================================================
// OPENROUTER EMERGENCY ANALYSIS
// ==========================================================

async function analyzeEmergency(transcript) {

  try {


    if (!process.env.KEY) {
      throw new Error(
        "OpenRouter KEY is missing from .env"
      );
    }

    const systemPrompt = `
You are ResQGrid's Emergency Intelligence Engine.

Analyze the emergency transcript.

Determine the emergency type, urgency,
number of people and response priority.

Priority rules:

LOW:
Non-urgent situation.

MEDIUM:
Assistance required but no immediate
life-threatening danger.

HIGH:
Serious emergency requiring rapid response.

CRITICAL:
Immediate threat to life or severe danger.

Consider:

- Medical emergency
- Difficulty breathing
- Unconsciousness
- Severe bleeding
- Fire
- Accident
- Violence
- Trapped people
- Flooding
- Evacuation
- Number of people
- Immediate danger

DO NOT infer priority from:

- Gender
- Race
- Accent
- Nationality
- Voice characteristics
- Demographics

Use ONLY information contained in
the transcript.

Allowed emergencyType values:

MEDICAL
AMBULANCE
RESCUE
TRAPPED
EVACUATION
FIRE
ACCIDENT
VIOLENCE
WOMEN_SAFETY
CHILD_EMERGENCY
EMERGENCY
OTHER

Return ONLY valid JSON.

Required format:

{
  "emergencyType": "MEDICAL",
  "priority": "CRITICAL",
  "priorityScore": 95,
  "confidence": 0.95,
  "peopleCount": 1,
  "keywords": ["injured", "bleeding"],
  "reasoning": "Person reports severe bleeding and requires immediate medical assistance."
}

priorityScore:
0-100

confidence:
0-1
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",

      {
        model:
          process.env.OPENROUTER_SOS_MODEL ||
          "openai/gpt-4o-mini",

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },

          {
            role: "user",
            content:
              `Emergency transcript:\n\n${transcript}`,
          },
        ],

        temperature: 0.1,

        response_format: {
          type: "json_object",
        },
      },

      {
        headers: {
          Authorization:
            `Bearer ${process.env.KEY}`,

          "Content-Type":
            "application/json",

          "HTTP-Referer":
            "https://resqgrid-b1zt.onrender.com",

          "X-Title":
            "ResQGrid",
        },

        timeout: 120000,
      }
    );

    const content =
      response.data
        ?.choices?.[0]
        ?.message?.content;

    if (!content) {
      throw new Error(
        "OpenRouter returned no response."
      );
    }

    let result;

    try {

      result = JSON.parse(content);

    } catch (error) {

      console.error(
        "❌ Invalid AI JSON:",
        content
      );

      throw new Error(
        "AI returned invalid JSON."
      );
    }

    return normalizeAnalysis(result);

  } catch (error) {


    console.error(
      "Status:",
      error.response?.status
    );

    console.error(
      "Response:",
      error.response?.data
    );

    console.error(
      "Message:",
      error.message
    );

    throw new Error(
      "Unable to analyze emergency with AI."
    );
  }
}


// ==========================================================
// NORMALIZE AI RESULT
// ==========================================================

function normalizeAnalysis(data) {

  const allowedTypes = [

    "MEDICAL",
    "AMBULANCE",
    "RESCUE",
    "TRAPPED",
    "EVACUATION",
    "FIRE",
    "ACCIDENT",
    "VIOLENCE",
    "WOMEN_SAFETY",
    "CHILD_EMERGENCY",
    "EMERGENCY",
    "OTHER",

  ];

  const allowedPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ];

  let emergencyType =
    String(
      data.emergencyType ||
      "EMERGENCY"
    ).toUpperCase();

  let priority =
    String(
      data.priority ||
      "HIGH"
    ).toUpperCase();

  if (
    !allowedTypes.includes(
      emergencyType
    )
  ) {

    emergencyType =
      "EMERGENCY";
  }

  if (
    !allowedPriorities.includes(
      priority
    )
  ) {

    priority =
      "HIGH";
  }

  let priorityScore =
    Number(
      data.priorityScore
    );

  if (
    Number.isNaN(priorityScore)
  ) {

    priorityScore = 50;
  }

  priorityScore =
    Math.max(
      0,
      Math.min(
        100,
        priorityScore
      )
    );

  let confidence =
    Number(
      data.confidence
    );

  if (
    Number.isNaN(confidence)
  ) {

    confidence = 0.5;
  }

  confidence =
    Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );

  let peopleCount =
    Number(
      data.peopleCount
    );

  if (
    Number.isNaN(
      peopleCount
    ) ||
    peopleCount < 1
  ) {

    peopleCount = 1;
  }

  return {

    emergencyType,

    priority,

    priorityScore,

    confidence,

    peopleCount,

    keywords:
      Array.isArray(
        data.keywords
      )
        ? data.keywords
        : [],

    reasoning:
      data.reasoning ||
      "Emergency analyzed by ResQGrid AI.",

  };
}


// ==========================================================
// COMPLETE SOS ANALYSIS
// ==========================================================

async function analyzeSOS(audioPath) {

  try {


    const transcript =
      await transcribeAudio(
        audioPath
      );


    const analysis =
      await analyzeEmergency(
        transcript
      );


    return {

      transcript,

      ...analysis,

    };

  } finally {

    try {

      if (
        fs.existsSync(
          audioPath
        )
      ) {

        fs.unlinkSync(
          audioPath
        );

    
      }

    } catch (error) {

      console.error(
        "Audio cleanup failed:",
        error.message
      );
    }
  }
}


// ==========================================================
// EXPORT
// ==========================================================

module.exports = {

  analyzeSOS,

  transcribeAudio,

  analyzeEmergency,

};