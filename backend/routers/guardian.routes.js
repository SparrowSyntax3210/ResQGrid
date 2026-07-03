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
                GuardianContact
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

module.exports = router;