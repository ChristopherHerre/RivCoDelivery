function authRoutes(app, pool, checkRole, orderLimiter, client, passport) {
    const router = require('express').Router();

    // POST /api/google-login
    router.post('/google-login', async (req, res) => {
        const { token } = req.body;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            const { sub, email, name, picture } = payload;
            const [userResults] = await pool.execute(
                'SELECT * FROM users WHERE id = ? LIMIT 1', [sub]
            );
            const role = 0;
            if (userResults.length === 0) {
                await pool.execute(
                    'INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)',
                    [sub, name, email, role]
                );
            }
            await pool.execute('DELETE FROM sessions WHERE JSON_EXTRACT(data, "$.user.sub") = ?', [sub]);
            req.session.user = { sub, email, name, picture };
            req.session.save(err => {
                if (err) console.error("Session save error:", err);
                else console.log("Session saved successfully:", req.session);
            });
            res.json({ sub, email, name, picture });
        } catch (error) {
            console.error('Error:', error);
            res.status(401).json({ error: 'Invalid token' });
        }
    });

    // GET /api/session
    router.get('/session', (req, res) => {
        console.log('Retrieving session...');
        console.log('Session in /api/session:', req.session);
        if (req.session.user) {
            res.json(req.session.user);
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    });

    // GET /api/profile
    router.get('/profile', (req, res) => {
        console.log("reached " + req.isAuthenticated());
        console.log('Session in /api/profile:', req.session);
        if (req.isAuthenticated()) {
            res.json({
                email: req.user.email
            });
        } else {
            console.log("not authenticated");
            res.redirect('/');
        }
    });

    // GET /api/auth/google
    router.get('/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    // GET /api/auth/google/callback
    router.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/', scope: ['profile', 'email'] }),
        (req, res) => {
            res.redirect('/api/profile');
        }
    );

    // GET /api/logout
    router.get('/logout', (req, res) => {
        req.logout((err) => {
            if (err) {
                console.error('Error logging out:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(500).json({ error: 'Session destruction failed' });
                }
                res.status(200).json({ message: 'Logged out successfully' });
            });
        });
    });

    return router;
}

module.exports = authRoutes;

