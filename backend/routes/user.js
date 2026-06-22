const express = require("express");
const User = require("../models/user");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { Name, Email, Password } = req.body;

    const existingUser = await User.findOne({ Email });

    if (existingUser) {
      return res.redirect("/");
    }

    const newUser = new User({
      Name,
      Email,
      Password
    });

    await newUser.save();

    req.session.user = {
      id: user._id,
      Name: user.Name,
      Email: user.Email
    };
    
    console.log("Session Created:");
    console.log(req.session);

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;

    const user = await User.findOne({ Email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.Password !== Password) {
      return res.status(401).send("Invalid Password");
    }

    req.session.user = {
      id: user._id,
      Name: user.Name,
      Email: user.Email,
    };

    console.log("SESSION BEFORE SAVE:");
    console.log(req.session);

    req.session.save((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Session Save Error");
      }

      console.log("SESSION SAVED");
      res.redirect("/");
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// router.post("/login", async (req, res) => {
//   try {
//     const { Email, Password } = req.body;

//     const user = await User.findOne({ Email });

//     if (!user) {
//       return res.status(404).send("User not found");
//     }

//     if (user.Password !== Password) {
//       return res.status(401).send("Invalid Password");
//     }

//     req.session.user = {
//       id: user._id,
//       Name: user.Name,
//       Email: user.Email
//     };
    
//     console.log("After setting session:");
//     console.log(req.session);
    
//     req.session.save((err) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).send("Session error");
//       }
    
//       console.log("Session saved");
//       res.redirect("/");
//     });
// });

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout Failed");
    }

    res.send("Logout Successful");
  });
});

router.get("/status", (req, res) => {
  console.log("Session ID:", req.sessionID);
  console.log("Session:", req.session);

  res.json({
    loggedIn: !!req.session.user,
    user: req.session.user || null,
  });
});

module.exports = router;
