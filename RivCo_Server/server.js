const fs = require("fs");
const https = require("https");
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const helmet = require('helmet');
dotenv.config();
const app = express();
const IP = '0.0.0.0';
const PORT = 8080;
const path = require("path");
const { z } = require('zod');

// Import middleware and utilities
const { checkRole: createCheckRole } = require('./middleware/auth');
const { haversine_dist, TAX_RATE, BASE_DELIVERY_FEE, MIN_BILLABLE_DISTANCE_MILES, 
        toCents, centsToFixed, safeJsonParse, isSelectedIngredient, 
        formatIngredientSummary, buildUserAddress } = require('./utils/helpers');
const { ingredientBodySchema, addRestaurantSchema, updateMenuItemSchema, 
        addMenuItemSchema, changeOrderOpenSchema, selectedRestaurantParamSchema, 
        userAddressSchema, cartItemSchema, restaurantSchema } = require('./utils/schemas');

app.set('trust proxy', 1);

// Security headers via Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://maps.googleapis.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: {
        policy: "no-referrer"
    }
}));

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Access-Control-Allow-Origin', 'https://rivcodelivery.com', 'https://www.rivcodelivery.com'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['https://rivcodelivery.com', 'https://www.rivcodelivery.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
  
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize checkRole middleware with pool
const checkRole = createCheckRole(pool);

app.use(cookieParser());

const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 60 * 1000
}, pool);

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    }
  }));
  
  // CSRF protection
  app.use(csrf({
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'none'
    }
  }));
  // Expose CSRF token to clients via a cookie
  app.use((req, res, next) => {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    next();
  });
  
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

app.use(express.json());
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const orderLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 1,
    message: { error: 'Too many orders, please try again in 3 minutes' }
});

// Register modular routes
const registerRoutes = require('./routes/index');
registerRoutes(app, pool, checkRole, orderLimiter, client, passport);

// ============================================================================
// ROUTES - All routes are now in separate files under routes/
// ============================================================================
// Routes are registered via registerRoutes() call above (line 141)

// Start the server
app.listen(PORT, IP, () => {
    console.log("Server is running on " + IP + ":" + PORT);
});
