require('dotenv').config();

const session = require('express-session');
const FileStore = require('session-file-store')(session);
const crypto = require('crypto');

const cookieSettings = session({
    genid: req => crypto.randomBytes(16).toString('hex'), // Generate random session IDs
    store: new FileStore(), // This should save to the user DB table??
    secret: process.env.SESSION_SECRET, // This should be a secret from an ENV variable
    resave: true,
    saveUninitialized: true,
    name: 'session',
    cookie: {
        secure: false, // This should be true in production
        maxAge: 86400000, // One day
        sameSite: true,
        httpOnly: true,
    },
});

module.exports = cookieSettings;
