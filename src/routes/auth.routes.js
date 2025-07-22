// src/routes/auth.routes.js
const express = require("express");
const prisma = require("../services/prisma"); // Import prisma
const { generateToken } = require("../services/jwt"); // Import jwt utility
const bcrypt = require("bcrypt");

const router = express.Router();

// Temporary route to get a test JWT for local development (UNPROTECTED)
// This is the /api/auth/test-token endpoint
router.get("/test-token", async (req, res, next) => {
  try {
    let user = await prisma.user.findFirst(); // Try to find any existing user

    if (!user) {
      // If no user exists, create a dummy one for testing
      user = await prisma.user.create({
        data: {
          email: "testuser@example.com",
          name: "Test User",
          password: "Test123",
        },
      });
      console.log("Created a dummy user for testing:", user.email);
    }

    const token = generateToken({ userId: user.id, email: user.email });
    res.json({
      message: "Test token generated successfully",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Error generating test token:", error);
    next(error); // Pass error to global error handler
  }
});


//register route
router.post("/register", async (req, res) => {
  try {
    //regex for valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide valid email" });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name || "New User",
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken({ userId: newUser.id, email: newUser.email });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error("Error registering: ", err);
  }
});


//login route
router.post("/login", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: "Please provide credentials" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invaild Credentials Email not registered" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.err("Error: ", err);
  }
});

module.exports = router;