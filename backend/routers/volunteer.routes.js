const express = require("express");
const router = express.Router();
const Application = require("../models/application.schema");

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
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// ----------------------------------------------------
// GET ALL CASES (Volunteer)
// ----------------------------------------------------
router.get("/volunteer", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    const applications = await Application.find().sort({
      priorityScore: -1,
    });

    console.log("Sending Cases:", applications.length);

    res.json(applications);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// ----------------------------------------------------
// GET SINGLE APPLICATION
// ----------------------------------------------------
router.get("/application/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

module.exports = router;