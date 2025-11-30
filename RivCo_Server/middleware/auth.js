const checkRole = (pool) => (requiredRole) => {
    return async (req, res, next) => {
        try {
            if (!req.session?.user?.sub) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const [results] = await pool.execute(
                'SELECT role FROM users WHERE id = ?',
                [req.session.user.sub]
            );
            if (!results.length || results[0].role < requiredRole) {
                return res.status(403).json({ message: 'Access denied' });
            }
            next();
        } catch (err) {
            console.error('Role check error:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

module.exports = { checkRole };

