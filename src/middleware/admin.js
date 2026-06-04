exports.isAdmin = (req, res, next) => {
    const roles = req.user.roles || [];
    if (!roles.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};