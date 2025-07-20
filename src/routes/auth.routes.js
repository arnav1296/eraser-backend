// src/routes/auth.routes.js
const express = require("express");
const prisma = require("../services/prisma"); // Import prisma
const { generateToken } = require("../services/jwt"); // Import jwt utility

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

module.exports = router;