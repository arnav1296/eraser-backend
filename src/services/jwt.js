// --- src/services/jwt.js ---
// This utility file contains functions for generating and verifying JWTs.
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const generateToken = (payload) => {return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "7d" });};
const verifyToken = (token) => {return jwt.verify(token, config.JWT_SECRET);};
module.exports = { generateToken, verifyToken };