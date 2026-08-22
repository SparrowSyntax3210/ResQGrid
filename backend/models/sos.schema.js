const mongoose = require("mongoose");

// ==========================================================
// AI ANALYSIS
// ==========================================================

const AIAnalysisSchema = new mongoose.Schema(
  {
    transcript: {
      type: String,
      default: "",
    },
    priorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },

    keywords: {
      type: [String],
      default: [],
    },

    reasoning: {
      type: String,
      default: "",
    },
  },

  {
    _id: false,
  },
);

// ==========================================================
// SOS SCHEMA
// ==========================================================

const SosSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------
    // CUSTOM SOS ID
    // ------------------------------------------------------

    sosId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ------------------------------------------------------
    // REPORTER
    // ------------------------------------------------------

    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ------------------------------------------------------
    // LOCATION
    // ------------------------------------------------------

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    // ------------------------------------------------------
    // EMERGENCY TYPE
    // ------------------------------------------------------

    type: {
      type: String,

      enum: [
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
      ],

      default: "EMERGENCY",

      required: true,
    },

    // ------------------------------------------------------
    // PRIORITY
    // ------------------------------------------------------

    priority: {
      type: String,

      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],

      default: "HIGH",

      required: true,
    },

    // ------------------------------------------------------
    // DESCRIPTION
    // ------------------------------------------------------

    description: {
      type: String,
      default: "",
    },

    // ------------------------------------------------------
    // NUMBER OF PEOPLE
    // ------------------------------------------------------

    peopleCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    status: {
      type: String,

      enum: [
        "PENDING",
        "ACKNOWLEDGED",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CANCELLED",
      ],

      default: "PENDING",
    },

    // ------------------------------------------------------
    // ASSIGNED TEAM
    // ------------------------------------------------------

    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    // ------------------------------------------------------
    // INCIDENT
    // ------------------------------------------------------

    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      default: null,
    },

    // ------------------------------------------------------
    // AI ANALYSIS
    // ------------------------------------------------------

    aiAnalysis: {
      type: AIAnalysisSchema,
      default: () => ({}),
    },

    // ------------------------------------------------------
    // RESOLVED TIME
    // ------------------------------------------------------

    resolvedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

// ==========================================================
// INDEXES
// ==========================================================

SosSchema.index({
  latitude: 1,
  longitude: 1,
});

SosSchema.index({
  priority: 1,
  status: 1,
});

SosSchema.index({
  createdAt: -1,
});

// ==========================================================
// EXPORT
// ==========================================================

module.exports = mongoose.model("Sos", SosSchema);
