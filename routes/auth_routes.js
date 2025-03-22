const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const passport = require("passport");

const User = require("../models/User");

const router = express.Router();

const path = require("path");

const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, path.parse(file.originalname).name + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Handle User Signup
router.post("/signup", upload.single("profile_pic"), async (req, res) => {
    try 
    {
        const { name, email, password, contact, user_type } = req.body;
        const profile_pic = req.file ? "/uploads/" + req.file.filename : null; // Save file path

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await User.create({
            name,
            email,
            password: hashedPassword,
            contact,
            profile_pic,
            user_type, // Store user type in DB
        });

        res.redirect("/login"); 
    } 
    catch (error) 
    {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

// Handle User Login

router.post("/login", function (req, res, next) {
    passport.authenticate("local", function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.json({ message: info.message }); 
        }

        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.json({ message: "Login successful!" });
        });
    })(req, res, next);
});


router.get("/dashboard", function (req, res) {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    res.send("Welcome " + req.user.email + "!");
});


router.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/login");
    });
});

module.exports = router;
