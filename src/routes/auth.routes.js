// --- src/routes/auth.routes.js ---
// This file contains all public authentication routes, including login and registration.
// It is explicitly for unprotected endpoints.
const express = require("express");
const prisma = require("../services/prisma");
const { generateToken } = require("../services/jwt");
const bcrypt = require("bcrypt");

const router = express.Router();

router.get("/test-token", async (req, res, next) => {
  try {
    let user = await prisma.user.findFirst();

    if (!user) {
      const hashedPassword = await bcrypt.hash("Test1234", 10);
      user = await prisma.user.create({
        data: {
          email: "testuser@example.com",
          name: "Test User",
          hashedPassword,
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
    res.status(500).json({ message: "Failed to generate test token", error: error.message });
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name || "New User",
        email,
        hashedPassword,
      },
    });

    const token = generateToken({ userId: newUser.id, email: newUser.email });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error("Error registering:", err);
    res.status(500).json({ message: "Failed to register user" });
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: "Please provide credentials" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials: Email not registered" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
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
    console.error("Error during login:", err);
    res.status(500).json({ message: "Failed to login" });
  }
});
module.exports = router;