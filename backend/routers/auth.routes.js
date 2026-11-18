const express = require("express");
const router = express.Router();
const User = require("../models/user.schema");
const bcrypt = require("bcrypt");
const expresssession = require("express-session");
const jwt = require("jsonwebtoken");
const Application = require("../models/application.schema");

// Let direct browser visits open the corresponding form pages.
router.get("/login", (req, res) => res.redirect("/login.html"));
router.get("/register", (req, res) => res.redirect("/register.html"));

router.post("/register", async (req, res) => {
  try {
    const { Name, Email, Password, ContactNumber, Role } = req.body;

    if (!Name || !Email || !Password || !ContactNumber || !Role) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const role = Role.trim().toLowerCase();
    if (!["guardian", "volunteer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid account role.",
      });
    }

    const normalizedEmail = Email.trim().toLowerCase();
    const existingUser = await User.findOne({ Email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = await User.create({
      Name,
      Email: normalizedEmail,
      Password: hashedPassword,
      ContactNumber,
      Role: role,
    });

    // Auto login after registration
    req.session.user = {
      id: newUser._id,
      name: newUser.Name,
      email: newUser.Email,
      role: newUser.Role,
      coins: newUser.Coins,
    };

    req.session.save((err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Session error");
      }

      res.redirect(`/${newUser.Role}.html?id=${newUser._id}`);
    });
  } catch (error) {
    console.error("Registration Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

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

    const existingUser = await User.findOne({ Email: Email.trim().toLowerCase() });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(
      Password,
      existingUser.Password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // ==========================
    // CHECK ROLE
    // ==========================

    if (!existingUser.Role) {
      console.error(
        "LOGIN ERROR: User has no Role:",
        existingUser._id
      );

      return res.status(500).json({
        success: false,
        message: "User role is missing.",
      });
    }

    // ==========================
    // CREATE SESSION
    // ==========================

    req.session.user = {
      id: existingUser._id,
      name: existingUser.Name,
      email: existingUser.Email,
      role: existingUser.Role,
      coins: existingUser.Coins || 0,
    };

    console.log("SESSION CREATED:", req.session.user);

    req.session.save((err) => {
      if (err) {
        console.error("SESSION SAVE ERROR:", err);

        return res.status(500).json({
          success: false,
          message: "Session error",
        });
      }

      const role = existingUser.Role.toLowerCase();

      const redirectUrl = `/${role}.html?id=${existingUser._id}`;

      console.log("LOGIN SUCCESS");
      console.log("ROLE:", role);
      console.log("REDIRECT:", redirectUrl);

      return res.redirect(redirectUrl);
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

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
