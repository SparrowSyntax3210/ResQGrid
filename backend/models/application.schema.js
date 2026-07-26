const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    caseType: {
      type: String,
      required: true,
      trim: true,
    },

    Name: {
      type: String,
      required: true,
      trim: true,
    },

    Age: {
      type: Number,
      required: true,
      min: 0,
    },

    Gender: {
      type: String,
      required: true,
      trim: true,
    },

    Height: {
      type: String,
      required: true,
      trim: true,
    },

    Clothing: {
      type: String,
      required: true,
    },

    MedicalConditions: {
      type: String,
      default: "",
    },

    LastSeen: {
      type: String,
      required: true,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    dateTime: {
      type: Date,
      required: true,
    },

    Description: {
      type: String,
      required: true,
    },

    GuardianContact: {
      type: String,
      required: true,
      trim: true,
    },

    Photo: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    priorityScore: {
      type: Number,
      default: 0,
    },

    priorityLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },

    priorityReason: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("application", applicationSchema);