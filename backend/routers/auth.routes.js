const express = require("express");
const router = express.Router();
const User = require("../models/user.schema");
const bcrypt = require("bcrypt");
const expresssession = require("express-session")

// Register User
router.post("/register", async (req, res) => {
    try {
        const { Name, Email, Password, ContactNumber, Role } = req.body;

        if (!Name || !Email || !Password || !ContactNumber) {
            return res.status(400).json({
                message: "Please provide all required fields."
            });
        }
        
        const existingUser = await User.findOne({ Email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(Password, 10);

        const newUser = new User({
            Name,
            Email,
            Password: hashedPassword,
            ContactNumber,
            Role
        });

        await newUser.save();

        console.log(newUser)

        return res.status(201).json({
            message: "User registered successfully."
            
        });

    } catch (error) {
        console.error("Registration Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

router.post("/login" , (req,res)=> {
    const {Email , Password} = req.body;
    const existingUser = User.findOne({Email});

    if(!existingUser){
        res.redirect("/register.html")
    }

    if (!Email || !Password) {
        return res.status(400).json({
            message: "Please provide all required fields."
        });
    }

    if(Email == User.Email && Password==User.Password){
        res.redirect("index.html");
        res.send(Email , hashedPassword)
    }

})

module.exports = router
