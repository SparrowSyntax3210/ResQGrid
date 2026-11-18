const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");

const { analyzeSimilarity } = require("./src/services/openrouter1.service");

dotenv.config();

const app = express();

app.use(express.json({ limit: "20mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const PORT = process.env.PORT || 3000;

// ------------------------------------
// HOME
// ------------------------------------

app.get("/", (req, res) => {
  res.json({
    service: "Academic Similarity Analysis API",
    status: "running",
    version: "2.0.0",
  });
});

// ------------------------------------
// ANALYZE TEXT
// ------------------------------------

app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    if (text.length > 500000) {
      return res.status(400).json({
        success: false,
        error: "Text is too large. Maximum 500,000 characters.",
      });
    }

    console.log(`Received ${text.length} characters`);

    const result = await analyzeSimilarity(text);

    return res.json({
      success: true,
      original_length: text.length,
      word_count: text.trim().split(/\s+/).length,
      result,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze text",
      message: error.message,
    });
  }
});

// ------------------------------------
// ANALYZE FILE
// ------------------------------------

app.post("/api/analyze-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File is required",
      });
    }

    const filename = req.file.originalname.toLowerCase();

    let text = "";

    // TXT
    if (filename.endsWith(".txt")) {
      text = req.file.buffer.toString("utf8");
    }

    // DOCX
    else if (filename.endsWith(".docx")) {
      const mammoth = require("mammoth");

      const result = await mammoth.extractRawText({
        buffer: req.file.buffer,
      });

      text = result.value;
    }

    // PDF
    else if (filename.endsWith(".pdf")) {
      const pdfParse = require("pdf-parse");

      const result = await pdfParse(req.file.buffer);

      text = result.text;
    } else {
      return res.status(400).json({
        success: false,
        error: "Supported files: PDF, DOCX, TXT",
      });
    }

    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Could not extract text from the document",
      });
    }

    console.log(
      `Extracted ${text.length} characters from ${req.file.originalname}`,
    );

    const result = await analyzeSimilarity(text);

    return res.json({
      success: true,
      filename: req.file.originalname,
      original_length: text.length,
      word_count: text.trim().split(/\s+/).length,
      result,
    });
  } catch (error) {
    console.error("File analysis error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze file",
      message: error.message,
    });
  }
});

// ------------------------------------
// START SERVER
// ------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
