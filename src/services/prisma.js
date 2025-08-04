// --- src/services/prisma.js ---
// This file exports a single, shared Prisma client instance for the entire application.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
