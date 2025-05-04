const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Please login to access this resource' });
};

module.exports = {
    isAuthenticated
};