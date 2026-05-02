const jwt = require('jsonwebtoken');

// Verify token and attach user payload to req
const auth = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const isAdmin = (req, res, next) => {
    auth(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ msg: 'Access denied: Admin privileges required' });
        }
    });
};

const isTeacher = (req, res, next) => {
    auth(req, res, () => {
        if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
            next();
        } else {
            res.status(403).json({ msg: 'Access denied: Teacher privileges required' });
        }
    });
};

module.exports = { auth, isAdmin, isTeacher };
