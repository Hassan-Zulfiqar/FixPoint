const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

passport.use(
    new LocalStrategy({ usernameField: "email" }, async function (email, password, done) {
        try {
            const user = await User.findOne({ email });
            
            if (!user) {
                return done(null, false, { message: "User not found!" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return done(null, false, { message: "Incorrect password!" });
            }
            
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;
