const express = require("express");
const router = express.Router();
const Application = require("../models/application.schema");
const Sighting = require("../models/sightings.schema");

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

router.post("/sightings", async (req, res) => {
  console.log("Received Sighting Data:", req.body);
  try {
    const { caseId ,Name, Description, Location, Date, Time, Photo, CompanionDetails } = req.body;  
    const sighting = new Sighting({
      caseId,
      Name,
      Description,
      Location,
      Date,
      Time,
      Photo,
      CompanionDetails
    });

    await sighting.save();
    req.io.to(req.body.caseId).emit("new_sighting",sighting);

    res.status(201).json({
      success: true,
      sighting
    });
    res.redirect("/volunteer.html")
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
});

router.get("/sightings/:caseId",async(req,res)=>{

    try{

        const sightings = await Sighting.find({

            caseId:req.params.caseId

        }).sort({

            createdAt:-1

        });

        res.json({

            success:true,

            sightings

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false

        });

    }

});

module.exports = router;