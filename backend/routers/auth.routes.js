const express = require("express");
const router = express.Router();
const User = require("../models/user.schema");
const bcrypt = require("bcrypt");
const expresssession = require("express-session")
const jwt = require("jsonwebtoken");

// Register User
router.post("/register", async (req, res) => {
    try {
        const { Name, Email, Password, ContactNumber, Role } = req.body;

        if (!Name || !Email || !Password || !ContactNumber || !Role) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });
        }

        const existingUser = await User.findOne({ Email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
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

return res.redirect(`/${newUser.Role.toLowerCase()}.html`);

    } catch (error) {
        console.error("Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { Email, Password } = req.body;

        if (!Email || !Password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });
        }

        const existingUser = await User.findOne({ Email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const isMatch = await bcrypt.compare(
            Password,
            existingUser.Password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });
        }
        req.session.user = {
            id: existingUser._id,
            name: existingUser.Name,
            email: existingUser.Email,
            role: existingUser.Role,
        };
        
        // return res.status(200).json({
        //     success: true,
        //     message: "Login successful.",
        //     user: req.session.user,
        // });

        return res.redirect(`/${existingUser.Role.toLowerCase()}.html`);


    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Logout failed",
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    });
});

router.get("/status", (req, res) => {
    if (req.session.user) {
        return res.status(200).json({
            loggedIn: true,
            user: req.session.user,
        });
    }

    return res.status(200).json({
        loggedIn: false,
    });
});

router.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }

    res.json(req.session.user);
});

module.exports = router
