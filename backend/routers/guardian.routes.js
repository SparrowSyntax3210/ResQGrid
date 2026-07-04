const express = require("express");
const router = express.Router();
const Application = require("../models/application.schema");
const upload = require("../config/multer");

router.post("/application",upload.single("Photo"), async (req, res) => {
        try {
            const {
                Name, Age, Gender, Height, Clothing, MedicalConditions, LastSeen, dateTime, Description, GuardianContact } = req.body;

            const Photo = req.file ? req.file.filename : "";

            if ( !Name || !Age || !Gender || !Height || !Clothing || !LastSeen || !dateTime || !Description || !GuardianContact) 
                {
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

            return res.status(201).json({
                success: true,
                message: "Application submitted successfully.",
                application: newApplication
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
);

router.patch("/application/close", async (req, res) => {
        console.log(req.session);
        console.log(req.session.user);
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        const application = await Application.findOneAndUpdate(
            {
                guardianId: req.session.user.id,
                status: "active"
            },
            {
                status: "closed"
            },
            {
                returnDocument: "after"
            }
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "No active application found."
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
    const applications = await Application.find({ status: "active" });
    res.json(applications);
});
module.exports = router;