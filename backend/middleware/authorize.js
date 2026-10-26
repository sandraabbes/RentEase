/**
 * Middleware to restrict access to specific user roles
 * Example usage: authorize('owner', 'admin')
 */
module.exports = function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ msg: 'Authorization denied: no user token' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                msg: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};
