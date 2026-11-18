const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(prompt) {
  if (!process.env.KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${process.env.KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Academic Similarity Analyzer",
    },

    body: JSON.stringify({
      model,

      messages: [
        {
          role: "system",
          content:
            "You are an academic similarity-analysis assistant. You must analyze supplied text conservatively and must never claim that a similarity score proves plagiarism.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.1,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${responseText}`);
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error("OpenRouter returned invalid JSON");
  }

  const output = data?.choices?.[0]?.message?.content;

  if (!output) {
    throw new Error("OpenRouter returned no model output");
  }

  return parseModelJSON(output);
}

// ------------------------------------
// PARSE MODEL JSON
// ------------------------------------

function parseModelJSON(output) {
  let cleaned = output.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.substring(start, end + 1));
      } catch {}
    }

    throw new Error("Model returned invalid JSON");
  }
}

// ------------------------------------
// SIMILARITY ANALYSIS
// ------------------------------------

async function analyzeSimilarity(text) {
  const sentences = splitIntoSentences(text);

  if (sentences.length === 0) {
    throw new Error("No analyzable sentences found");
  }

  /*
   * Don't send enormous documents in a single prompt.
   * We analyze a representative set of sentences.
   */

  const MAX_SENTENCES = 150;

  const analysisSentences =
    sentences.length > MAX_SENTENCES
      ? sentences.slice(0, MAX_SENTENCES)
      : sentences;

  const numberedText = analysisSentences
    .map((sentence, index) => {
      return `${index + 1}. ${sentence}`;
    })
    .join("\n");

  const prompt = `
Analyze the following academic document for potential textual similarity.

IMPORTANT:

- Similarity is NOT proof of plagiarism.
- Do not invent sources.
- Do not invent URLs.
- Do not claim that a sentence was copied unless evidence is provided.
- Generic academic phrases should not automatically be treated as plagiarism.
- Common terminology should not automatically be treated as plagiarism.
- Citations and references should be treated differently from uncited copied text.
- Do not rewrite the document.
- Do not attempt to bypass AI or plagiarism detectors.

For each suspicious sentence, classify it as:

1. "likely_common"
2. "formulaic"
3. "potential_similarity"
4. "high_similarity_risk"

Analyze:

A. Repeated wording inside the document.
B. Formulaic academic language.
C. Potentially distinctive wording that should be checked against external sources.
D. Citation/reference problems.
E. Sentences that contain unusually specific wording.

Return ONLY valid JSON:

{
  "document_assessment": {
    "overall_assessment": "string",
    "academic_quality": "low | medium | high",
    "citation_quality": "low | medium | high"
  },

  "findings": [
    {
      "sentence_number": 1,
      "text": "exact supplied sentence",
      "classification": "likely_common | formulaic | potential_similarity | high_similarity_risk",
      "reason": "string",
      "confidence": 0
    }
  ],

  "repeated_phrases": [
    {
      "phrase": "string",
      "occurrences": 0
    }
  ],

  "citation_issues": [
    {
      "text": "string",
      "issue": "string"
    }
  ]
}

DOCUMENT:

${numberedText}
`;

  const result = await callOpenRouter(prompt);

  return calculateSimilarityEstimate(text, sentences, result);
}

// ------------------------------------
// SENTENCE SPLITTER
// ------------------------------------

function splitIntoSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40);
}

// ------------------------------------
// SIMILARITY ESTIMATE
// ------------------------------------

function calculateSimilarityEstimate(originalText, sentences, analysis) {
  const findings = Array.isArray(analysis.findings) ? analysis.findings : [];

  const repeatedPhrases = Array.isArray(analysis.repeated_phrases)
    ? analysis.repeated_phrases
    : [];

  const potential = findings.filter(
    (item) =>
      item.classification === "potential_similarity" ||
      item.classification === "high_similarity_risk",
  );

  const highRisk = findings.filter(
    (item) => item.classification === "high_similarity_risk",
  );

  const formulaic = findings.filter(
    (item) => item.classification === "formulaic",
  );

  /*
   * This is intentionally called an ESTIMATE.
   * It is NOT a Turnitin score.
   */

  const totalSentences = Math.max(sentences.length, 1);

  const potentialRatio = potential.length / totalSentences;

  const highRiskRatio = highRisk.length / totalSentences;

  /*
   * Conservative estimate.
   *
   * High-risk sentences carry more weight.
   * Potential matches carry less weight.
   */

  let estimatedSimilarity = potentialRatio * 20 + highRiskRatio * 25;

  /*
   * Repeated phrases within the same document
   * shouldn't be treated as external plagiarism.
   */

  const repetitionPenalty = Math.min(repeatedPhrases.length, 10) * 0.2;

  estimatedSimilarity = estimatedSimilarity - repetitionPenalty;

  estimatedSimilarity = Math.max(0, Math.min(100, estimatedSimilarity));

  return {
    similarity: {
      estimated_percentage: Number(estimatedSimilarity.toFixed(2)),

      interpretation: getSimilarityInterpretation(estimatedSimilarity),

      disclaimer:
        "This is an estimated similarity indicator, not a Turnitin score and not proof of plagiarism.",
    },

    document: {
      characters: originalText.length,
      words: originalText.trim().split(/\s+/).length,

      sentences: sentences.length,
    },

    analysis: {
      overall_assessment:
        analysis.document_assessment?.overall_assessment || "",

      academic_quality:
        analysis.document_assessment?.academic_quality || "unknown",

      citation_quality:
        analysis.document_assessment?.citation_quality || "unknown",
    },

    findings,

    repeated_phrases: repeatedPhrases,

    citation_issues: analysis.citation_issues || [],

    statistics: {
      potential_similarity_sentences: potential.length,

      high_risk_sentences: highRisk.length,

      formulaic_sentences: formulaic.length,
    },
  };
}

// ------------------------------------
// INTERPRETATION
// ------------------------------------

function getSimilarityInterpretation(score) {
  if (score < 10) {
    return "Low detected similarity";
  }

  if (score < 20) {
    return "Moderate detected similarity";
  }

  if (score < 30) {
    return "Noticeable detected similarity";
  }

  return "High detected similarity";
}

module.exports = {
  analyzeSimilarity,
};
