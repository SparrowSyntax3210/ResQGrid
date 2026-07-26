const express = require("express");
const router = express.Router();
const User = require("../models/user.schema");
const bcrypt = require("bcrypt");
const expresssession = require("express-session");
const jwt = require("jsonwebtoken");
const Application = require("../models/application.schema");

router.post("/register", async (req, res) => {
  try {
    const { Name, Email, Password, ContactNumber, Role } = req.body;

    if (!Name || !Email || !Password || !ContactNumber || !Role) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const existingUser = await User.findOne({ Email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = await User.create({
      Name,
      Email,
      Password: hashedPassword,
      ContactNumber,
      Role,
    });

    // Auto login after registration
    req.session.user = {
      id: newUser._id,
      name: newUser.Name,
      email: newUser.Email,
      role: newUser.Role,
      coins: newUser.coins,
    };

    req.session.save((err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Session error");
      }

      res.redirect(
        `https://res-q-grid.vercel.app/${newUser.Role.toLowerCase()}.html?id=${newUser._id}`,
      );
    });
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const existingUser = await User.findOne({ Email });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(Password, existingUser.Password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    req.session.user = {
      id: existingUser._id,
      name: existingUser.Name,
      email: existingUser.Email,
      role: existingUser.Role,
      coins: existingUser.coins,
    };

    console.log("SESSION CREATED:", req.session.user);

    req.session.save(async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Session error");
      }

      let redirectUrl = `https://res-q-grid.vercel.app/${existingUser.Role.toLowerCase()}.html?id=${existingUser._id}`;

      if (existingUser.Role.toLowerCase() === "guardian") {
        const latestCase = await Application.findOne({
          guardianId: existingUser._id,
          status: "active",
        }).sort({ createdAt: -1 });
      }

      res.redirect(redirectUrl);
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
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
    return res.status(401).json({
      success: false,
      message: "Not logged in",
    });
  }

  return res.json(req.session.user);
});

module.exports = router;
