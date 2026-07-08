const express = require("express");
const router = express.Router();

const Application = require("../models/application.schema");
const upload = require("../config/multer");

const { askAi } = require("../src/services/openrouter.service");

const axios = require("axios");

// ----------------------------------------------------
// GET MAP FEATURES USING OPENSTREETMAP OVERPASS
// ----------------------------------------------------

async function getLocationFeatures(lat, lon) {
  try {
    console.log("\n========== MAP FEATURE SEARCH ==========");
    console.log("Latitude:", lat);
    console.log("Longitude:", lon);

    const query = `

        [out:json];

        (
            node(around:1000,${lat},${lon})["amenity"];
            node(around:1000,${lat},${lon})["railway"];
            node(around:1000,${lat},${lon})["highway"];
            node(around:1000,${lat},${lon})["natural"];
            node(around:1000,${lat},${lon})["leisure"];
            way(around:1000,${lat},${lon})["waterway"];
            way(around:1000,${lat},${lon})["building"];
        );

        out tags;

        `;

    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      },
    );

    const elements = response.data.elements;

    console.log("Nearby map elements:", elements.length);

    let features = [];

    elements.forEach((item) => {
      const tags = item.tags || {};

      if (tags.railway) features.push("Railway/Metro");

      if (tags.highway) features.push("Road/Highway");

      if (tags.waterway) features.push("Water body");

      if (tags.natural) features.push(tags.natural);

      if (tags.leisure) features.push(tags.leisure);

      if (tags.amenity) features.push(tags.amenity);

      if (tags.building) features.push("Building Area");
    });

    features = [...new Set(features)];

    console.log("Detected Features:", features);

    return features;
  } catch (error) {
    console.log("Overpass Error:", error.message);

    return [];
  }
}

// ----------------------------------------------------
// AI PRIORITY ANALYSIS
// ----------------------------------------------------

async function calculatePriority(data, mapFeatures) {
  console.log("\n========== AI PRIORITY ==========");

  const messages = [
    {
      role: "system",

      content: `

You are an emergency missing person priority engine.

Analyze the case and return ONLY JSON.

Rules:

Highest priority factors:

1. Missing time
2. Children and elderly
3. Medical conditions
4. Dangerous description
5. Dangerous nearby locations

Nearby risky locations:

- Highway
- Railway/Metro
- Water bodies
- Forest
- Open areas
- Construction areas
- Industrial areas

Return:

{
 priorityScore:number,
 priorityLevel:"Low|Medium|High|Critical",
 priorityReason:string
}

Score must be between 0-100.

`,
    },

    {
      role: "user",

      content: JSON.stringify({
        case: data,

        nearbyFeatures: mapFeatures,
      }),
    },
  ];

  console.log("Sending AI Data:", JSON.stringify(messages, null, 2));

  const response = await askAi(messages);

  console.log("AI RESPONSE:", response);

  let result;

  try {
    result = JSON.parse(response);
  } catch (err) {
    console.log("AI JSON ERROR", err.message);

    result = {
      priorityScore: 50,

      priorityLevel: "Medium",

      priorityReason: "AI parsing failed",
    };
  }

  return result;
}

// ----------------------------------------------------
// CREATE APPLICATION
// ----------------------------------------------------

router.post("/application", upload.single("Photo"), async (req, res) => {
  try {
    console.log("\n========== NEW APPLICATION ==========");

    const {
      Name,
      Age,
      Gender,
      Height,
      Clothing,
      MedicalConditions,
      LastSeen,
      dateTime,
      Description,
      GuardianContact,
    } = req.body;

    console.log("Received Body:", req.body);

    const Photo = req.file ? req.file.filename : "";

    if (
      !Name ||
      !Age ||
      !Gender ||
      !Height ||
      !Clothing ||
      !LastSeen ||
      !dateTime ||
      !Description ||
      !GuardianContact
    ) {
      return res.status(400).json({
        success: false,

        message: "Please fill all required fields.",
      });
    }

    // -------------------------
    // GET COORDINATES
    // -------------------------

    console.log("Searching location:", LastSeen);

    const geoResponse = await axios.get(
      "https://nominatim.openstreetmap.org/search",

      {
        params: {
          format: "json",

          q: LastSeen,
        },

        headers: {
          "User-Agent": "ResQGrid",
        },
      },
    );

    if (!geoResponse.data.length) {
      console.log("Location not found");
    }

    let latitude = null;
    let longitude = null;

    if (geoResponse.data.length) {
      latitude = parseFloat(geoResponse.data[0].lat);

      longitude = parseFloat(geoResponse.data[0].lon);
    }

    console.log("Coordinates:", latitude, longitude);

    // -------------------------
    // MAP ANALYSIS
    // -------------------------

    let mapFeatures = [];

    if (latitude && longitude) {
      mapFeatures = await getLocationFeatures(latitude, longitude);
    }

    // -------------------------
    // AI PRIORITY
    // -------------------------

    const priority = await calculatePriority(
      {
        Name,
        Age,
        Gender,
        Height,
        Clothing,
        MedicalConditions,
        LastSeen,
        dateTime,
        Description,
      },

      mapFeatures,
    );

    // -------------------------
    // SAVE DATABASE
    // -------------------------

    const newApplication = await Application.create({
      guardianId: req.session.user.id,

      Photo,

      Name,

      Age,

      Gender,

      Height,

      Clothing,

      MedicalConditions,

      LastSeen,

      dateTime,

      Description,

      GuardianContact,

      status: "active",

      priorityScore: priority.priorityScore,

      priorityLevel: priority.priorityLevel,

      priorityReason: priority.priorityReason,
    });

    console.log("Saved Application:", newApplication);

    // -------------------------
    // SOCKET
    // -------------------------

    const io = req.app.get("io");

    io.to("volunteers").emit("new_case", newApplication);

    console.log("Broadcasted case");

    return res.status(201).json({
      success: true,

      application: newApplication,
    });
  } catch (error) {
    console.log("APPLICATION ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Internal Server Error",
    });
  }
});

// ----------------------------------------------------
// CLOSE APPLICATION
// ----------------------------------------------------

router.patch("/application/close/:id", async (req, res) => {
  try {
    console.log("Close request received");

    console.log("Application ID:", req.params.id);

    console.log("Guardian ID:", req.session.user.id);

    const check = await Application.findById(req.params.id);

    console.log("Application from DB:", check);

    if (check) {
      console.log("Database guardianId:", check.guardianId.toString());

      console.log("Database status:", check.status);
    }

    const application = await Application.findOneAndUpdate(
      {
        _id: req.params.id,

        guardianId: req.session.user.id,

        status: "active",
      },

      {
        status: "closed",
      },

      {
        returnDocument: "after",
      },
    );

    console.log("Updated Application:", application);

    if (!application) {
      return res.status(404).json({
        success: false,

        message: "Application not found. Check ID, guardianId or status.",
      });
    }

    res.json({
      success: true,

      message: "Case closed successfully",

      application,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,

      message: "Server Error",
    });
  }
});

// ----------------------------------------------------
// GET ACTIVE APPLICATIONS
// ----------------------------------------------------

router.get("/application", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    const applications = await Application.find({
      status: "active",
    }).sort({ priorityScore: -1 });

    console.log("Sending Active Cases:", applications.length);

    res.json(applications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;