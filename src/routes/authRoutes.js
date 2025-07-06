import express, { response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

import User from "../models/User.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
};

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All Fields Require",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Pass should be 6 char",
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        message: "Username should be more than 3 char",
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Error in register route", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All field required",
      });
    }

    const user = await User.findOne({ email });

    console.log(user);

    if (!user) {
      return res.status(400).json({
        message: "Invalid credential",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    console.log(isPasswordCorrect);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid credential",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Error in login", error);
    res.status(500).json({
      message: "internar server error",
    });
  }
});

router.get("/me", protectRoute, async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Error in /me:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

export default router;
