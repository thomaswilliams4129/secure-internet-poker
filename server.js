// server.js

require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const express = require('express');

const bodyParser = require('body-parser');

const passport = require('passport');

const exphbs = require('express-handlebars');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const { check, validationResult } = require('express-validator');
const RateLimiter = require('./middleware/rate-limiter').apiLimiter;
const CookieSettings = require('./middleware/session');

require('./config/passport/passport')(passport);

// create the server
const app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.static('views/public'));

// Middleware

app.use(helmet());
app.use(RateLimiter);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(CookieSettings);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(flash());
app.use((req, res, next) => {
    res.locals.error_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    next();
});

// Start server
const server = app.listen(3000, () => {
    console.log('Listening on localhost:3000');
});
const io = require('socket.io')(server);

let connectCounter = 0;

io.on('connect', function() {
    connectCounter++;
    console.log(connectCounter);
});
io.on('disconnect', function() {
    connectCounter--;
    console.log(connectCounter);
});

app.set('socketio', io);

// Routes
require('./routes.js')(app, passport, check, validationResult, flash); // load our routes and pass in our app and fully configured passport
