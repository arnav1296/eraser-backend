// --- src/config/config.js ---
// This file centralizes application configuration, loading environment variables.
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
};