const express = require("express");
const router = express.Router();

const SOS = require("../models/sos.schema");

const socketService = require("../socket/sos.socket.js");
const chatService = require("../socket/chat.socket.js")

const upload = require("../config/multer.js");

const { analyzeSOS } = require("../src/services/ai/sosAnalysis.service.js");

// ==========================================================
// HELPERS
// ==========================================================

function generateSOSId() {
  const timestamp = Date.now().toString(36).toUpperCase();

  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `SOS-${timestamp}-${random}`;
}

router.post(
  "/analyze",
  upload.single("audio"),

  async (req, res) => {
    try {
      console.log("🚨 RESQGRID AI SOS RECEIVED");

      // --------------------------------------------------
      // AUDIO
      // --------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,

          message: "SOS voice recording is required.",
        });
      }

      // --------------------------------------------------
      // LOCATION
      // --------------------------------------------------

      const { reporter, latitude, longitude, description } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,

          message: "Location is required.",
        });
      }

      const lat = Number(latitude);

      const lng = Number(longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({
          success: false,

          message: "Invalid location.",
        });
      }

      // --------------------------------------------------
      // AI ANALYSIS
      // --------------------------------------------------

      console.log("🎙️ Audio received:", req.file.filename);

      const analysis = await analyzeSOS(req.file.path);

      console.log("🤖 AI ANALYSIS:", analysis);

      // --------------------------------------------------
      // CREATE DATABASE RECORD
      // --------------------------------------------------

      const sos = await SOS.create({
        sosId: generateSOSId(),

        reporter: reporter || null,

        latitude: lat,

        longitude: lng,

        type: analysis.emergencyType,

        priority: analysis.priority,

        description: description || analysis.transcript,

        peopleCount: analysis.peopleCount,

        status: "PENDING",

        aiAnalysis: {
          transcript: analysis.transcript,

          priorityScore: analysis.priorityScore,

          confidence: analysis.confidence,

          keywords: analysis.keywords,

          reasoning: analysis.reasoning,
        },

        createdAt: new Date(),
      });

      // --------------------------------------------------
      // LOG
      // --------------------------------------------------

      console.log(`🚨 SOS CREATED: ${sos.sosId}`);

      console.log(`Type: ${sos.type}`);

      console.log(`Priority: ${sos.priority}`);

      console.log(`Score: ${analysis.priorityScore}`);

      // --------------------------------------------------
      // SOCKET.IO
      // --------------------------------------------------

      socketService.broadcast("sos:created", {
        sos,

        ai: {
          emergencyType: analysis.emergencyType,

          priority: analysis.priority,

          priorityScore: analysis.priorityScore,

          confidence: analysis.confidence,
        },
      });

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(201).json({
        success: true,

        message: "SOS analyzed and created successfully.",

        data: sos,

        analysis,
      });
    } catch (error) {
      console.error("❌ AI SOS ERROR:", error);

      return res.status(500).json({
        success: false,

        message: error.message || "Unable to process SOS.",
      });
    }
  },
);

router.post("/", async (req, res) => {
  try {
    const {
      reporter,
      latitude,
      longitude,
      description,
      peopleCount,
      aiAnalysis,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,

        message: "Location is required.",
      });
    }

    const analysis = aiAnalysis || {};

    const {
      transcript = "",
      emergencyType = "EMERGENCY",
      priorityScore = 50,
      priority = "HIGH",
      confidence = 0,
      keywords = [],
      reasoning = "",
    } = analysis;

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

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    if (!allowedTypes.includes(emergencyType)) {
      return res.status(400).json({
        success: false,

        message: `Invalid emergency type: ${emergencyType}`,
      });
    }

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,

        message: `Invalid priority: ${priority}`,
      });
    }

    const sos = await SOS.create({
      sosId: generateSOSId(),

      reporter: reporter || null,

      latitude: Number(latitude),

      longitude: Number(longitude),

      type: emergencyType,

      priority,

      description: description || transcript,

      peopleCount: Number(peopleCount) || 1,

      status: "PENDING",

      aiAnalysis: {
        transcript,

        priorityScore,

        confidence,

        keywords,

        reasoning,
      },

      createdAt: new Date(),
    });

    socketService.broadcast("sos:created", {
      sos,

      ai: {
        priority,

        priorityScore,

        confidence,

        emergencyType,
      },
    });

    return res.status(201).json({
      success: true,

      message: "SOS created successfully.",

      data: sos,
    });
  } catch (error) {
    console.error("Manual SOS Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
});

// ==========================================================
// GET ALL SOS
// GET /api/sos
// ==========================================================

router.get("/", async (req, res) => {
  try {
    const requests = await SOS.find()

      .populate("reporter", "name email")

      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,

      count: requests.length,

      data: requests,
    });
  } catch (error) {
    console.error("Get SOS Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
});

// ==========================================================
// GET SINGLE SOS
// GET /api/sos/:id
// ==========================================================

router.get("/:id", async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id)

      .populate("reporter", "name email")

    if (!sos) {
      return res.status(404).json({
        success: false,

        message: "SOS request not found.",
      });
    }

    return res.json({
      success: true,

      data: sos,
    });
  } catch (error) {
    console.error("Get SOS Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const allowedFields = [
  "type",
  "priority",
  "status",
  "description",
  "peopleCount",
  "incident",
  "resolvedAt",
];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const sos = await SOS.findByIdAndUpdate(
      req.params.id,

      updates,

      {
        new: true,
        runValidators: true,
      },
    );

    if (!sos) {
      return res.status(404).json({
        success: false,

        message: "SOS request not found.",
      });
    }

    socketService.broadcast("sos:updated", { sos });

    return res.json({
      success: true,

      message: "SOS updated successfully.",

      data: sos,
    });
  } catch (error) {
    console.error("Update SOS Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
});

// ==========================================================
// DELETE SOS
// DELETE /api/sos/:id
// ==========================================================

router.delete("/:id", async (req, res) => {
  try {
    const sos = await SOS.findByIdAndDelete(req.params.id);

    if (!sos) {
      return res.status(404).json({
        success: false,

        message: "SOS request not found.",
      });
    }

    socketService.broadcast("sos:deleted", {
      sosId: sos._id,

      customSosId: sos.sosId,
    });

    return res.json({
      success: true,

      message: "SOS deleted successfully.",

      data: sos,
    });
  } catch (error) {
    console.error("Delete SOS Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
});

module.exports = router;
