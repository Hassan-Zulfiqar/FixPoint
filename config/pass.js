const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

passport.use(
    new LocalStrategy({ usernameField: "email" }, function (email, password, done) {
        User.findOne({ where: { email: email } })
            .then(function (user) {
                if (!user) {
                    return done(null, false, { message: "User not found!" });
                }

                bcrypt.compare(password, user.password)
                    .then(function (isMatch) {
                        if (!isMatch) {
                            return done(null, false, { message: "Incorrect password!" });
                        }
                        return done(null, user);
                    });
            })
            .catch(function (err) {
                return done(err);
            });
    })
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findByPk(id)
        .then(function (user) {
            done(null, user);
        })
        .catch(function (err) {
            done(err);
        });
});

module.exports = passport;
