// load all the things we need
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');

const { pool } = require('../../config');

module.exports = passport => {
    // used to serialize the user for the session
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser((id, done) => {
        pool.query(`SELECT userid, email FROM users WHERE userid = $1 LIMIT 1`, [id], (error, results) => {
            if (error) {
                done(null, false, { message: 'Could not connect to database' });
            }

            const user = results.rows[0];

            if (user != null) {
                done(null, user);
            } else {
                done(null, false, { message: 'Failed to find id' });
            }
        });
    });

    passport.use(
        'local-login',
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            pool.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email], (error, results) => {
                if (error) {
                    return done(null, false, { message: 'Could not connect to database' });
                }
                const result = results.rows[0];

                if (result == null) {
                    return done(null, false, { message: 'Invalid credentials.\n' });
                }
                if (!bcrypt.compareSync(password, result.password)) {
                    return done(null, false, { message: 'Invalid credentials.\n' });
                }
                return done(null, result.userid);
            });
        })
    );

    passport.use(
        'local-signup',
        new LocalStrategy(
            {
                // by default, local strategy uses username and password, we will override with email
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true, // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            },
            function(req, email, password, done) {
                const id = crypto.randomBytes(3).toString('hex');

                const salt = bcrypt.genSaltSync(10);
                const hashedpassword = bcrypt.hashSync(password, salt);

                pool.connect((err, client, release) => {
                    if (err) {
                        return done(null, false, { message: 'Could not connect to database' });
                    }

                    client.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email], (error, results) => {
                        if (error) {
                            return done(null, false, { message: 'Could not connect to database' });
                        }
                        const result = results.rows[0];
                        if (result == null) {
                            // Add to DB
                            client.query(
                                `INSERT INTO users VALUES ($1, $2, $3) RETURNING *`,
                                [id, email, hashedpassword],
                                (error, res) => {
                                    if (error) {
                                        return done(null, false, { message: 'Could not connect to database' });
                                    }
                                    const { userid } = res.rows[0];
                                    return done(null, userid);
                                }
                            );
                        } else {
                            // Email already exists
                            return done(null, false, 'Email is taken');
                        }
                    });
                });
            }
        )
    );
};
