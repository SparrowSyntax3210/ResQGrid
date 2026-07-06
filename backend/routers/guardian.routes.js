const express = require("express");
const router = express.Router();
const Application = require("../models/application.schema");
const upload = require("../config/multer");

router.post("/application", upload.single("Photo"), async (req, res) => {

    try {

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
            GuardianContact
        } = req.body;

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
                message: "Please fill all required fields."
            });
        }

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

            status: "active"

        });

        // Socket.IO
        const io = req.app.get("io");

        io.to("volunteers").emit("new_case", newApplication);

        console.log("Broadcasted new case");

        return res.status(201).json({

            success: true,

            application: newApplication

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

});

router.patch("/application/close/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        const application = await Application.findOneAndUpdate(
            {
                _id: req.params.id,
                guardianId: req.session.user.id,
                status: "active"
            },
            {
                status: "closed"
            },
            {
                new: true
            }
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found or already closed."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Application closed successfully.",
            application
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

router.get("/application", async (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({
            message: "Please login first"
        });
    }

        const applications = await Application.find({
            guardianId: req.session.user.id,
            status: "active"
        });

    res.json(applications);
});


module.exports = router;