const { verifyToken } = require('../services/jwt'); // Correct path to src/services/jwt.js
const prisma = require('../services/prisma'); // Correct path to src/services/prisma.js

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided or invalid format' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) { return res.status(401).json({ message: 'User not found' }); }
        req.user = user; // Attach user object to request
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        if (error.name === 'TokenExpiredError') { return res.status(401).json({ message: 'Token expired' }); }
        return res.status(401).json({ message: 'Invalid token' });
    }
};
module.exports = authMiddleware;