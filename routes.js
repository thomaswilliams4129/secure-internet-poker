const fs = require('fs');

module.exports = function(app, passport, check, validationResult) {
    app.get('/', (req, res) => {
        if (req.isAuthenticated()) {
            res.redirect('/game');
        } else {
            res.render('home', {
                is_authenticated: false,
            });
        }
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/signup', (req, res) => {
        if (req.isAuthenticated()) {
            res.redirect('game');
        } else {
            res.render('signup', {
                is_authenticated: false,
            });
        }
    });

    app.post(
        '/signup',
        [
            check('password')
                .isLength({ min: 6 })
                .custom((value, { req, loc, path }) => {
                    if (value !== req.body.passwordconfirmation) {
                        // throw error if passwords do not match
                        throw new Error("Passwords don't match");
                    } else {
                        return value;
                    }
                }),
            check('email')
                .isEmail()
                .normalizeEmail()
                .withMessage('Please enter a valid email'),
        ],
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors.array().forEach(error => {
                    req.flash('error', error.msg);
                });
                res.redirect('signup');
            } else {
                passport.authenticate('local-signup', {
                    successRedirect: 'game', // redirect to the secure profile section
                    failureRedirect: 'signup', // redirect back to the signup page if there is an error
                    failureFlash: true, // allow flash messages
                })(req, res);
            }
        }
    );

    app.get('/login', (req, res) => {
        if (req.isAuthenticated()) {
            res.redirect('/game');
        } else {
            res.render('login', {
                is_authenticated: false,
            });
        }
    });

    app.post(
        // Add validation
        '/login',
        passport.authenticate('local-login', {
            successRedirect: 'game', // redirect to the secure profile section
            failureRedirect: 'login', // redirect back to the signup page if there is an error
            failureFlash: true, // allow flash messages
        })
    );

    app.get('/game', (req, res) => {
        const io = req.app.get('socketio');

        if (req.isAuthenticated()) {
            res.render('game', {
                is_authenticated: true,
                userid: req.user.userid,
            });

            io.sockets.on('connection', function(socket) {
                let player;
                const totalConnections = io.engine.clientsCount;
                const { userid } = req.user;
                let players;

                socket.on('register', function(userId) {
                    if (userId !== null) {
                        fs.readFile('active-players.json', (err, data) => {
                            if (err) throw err;

                            if (!isEmpty(data)) {
                                players = data;
                                if (!players.includes(userId)) {
                                    players += `${userId},`;
                                    fs.writeFile('active-players.json', players, err => {
                                        if (err) throw err;
                                    });
                                }

                                io.emit('joined', `${players}`);
                            } else {
                                console.log('here');
                                fs.writeFile('active-players.json', `${userId},`, err => {
                                    if (err) throw err;
                                });
                            }
                        });
                    }
                });

                socket.on('disconnect', function(userId) {
                    io.emit('left', `${userId}`);
                });
            });
        } else {
            res.redirect('/login');
        }
    });

    function isEmpty(obj) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) return false;
        }
        return true;
    }
};
