const express = require("express");
const User = require("../models/user");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { Name, Email, Password } = req.body;

    const newUser = new User({
      Name,
      Email,
      Password,
    });

    await newUser.save();

    console.log("User created successfully");

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { Email } = req.body;

    const user = await User.findOne({ Email });

    if (user) {
      res.send("Login Successful");
    } else {
      res.redirect("./register.html");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
