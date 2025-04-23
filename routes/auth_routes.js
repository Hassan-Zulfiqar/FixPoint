const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const passport = require("passport");
const authController = require("../controllers/auth_controllers");
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

const transporter = nodemailer.createTransport(
    {
        service: "gmail",
        auth: 
        {
            user: "hassanzulfiqar687@gmail.com",
            pass: "wfxenpokribmzojw"
        }
    });


// Handle User Signup
router.post("/signup", upload.single("profile_pic"), async (req, res) => {
    try {
        const { name, email, password, contact, user_type } = req.body;
        const profile_pic = req.file ? "/uploads/" + req.file.filename : null;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const verification_token = crypto.randomBytes(32).toString("hex");
        const hashedPassword = await bcrypt.hash(password, 10);


        await User.create({
            name,
            email,
            password: hashedPassword,
            contact,
            profile_pic,
            user_type,
            is_verified: false,
            verification_token
        });


        const verificationLink = `http://localhost:3000/verify/${verification_token}`;
        const mailOptions = {
            from: "hassanzulfiqar687@gmail.com",
            to: email,
            subject: "Verify Your Email",
            text: `Click this link to verify your email: ${verificationLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Email sending error:", error);
                return res.status(500).json({ message: "Error sending verification email" });
            } else {
                return res.status(200).json({ message: "Verification email sent. Please check your inbox." });
            }
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

router.get("/verify/:token", async (req, res) => {
    try 
    {
        const { token } = req.params;

        // Find user with the token
        const user = await User.findOne({ where: { verification_token: token } });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Mark user as verified
        user.is_verified = true;
        user.verification_token = null; // Remove token after verification
        await user.save();

        res.redirect("/login.html"); // Redirect to login page after verification
    } 
    catch (error) 
    {
        console.error("Verification Error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
});


// Handle User Login

router.post("/login", function (req, res, next) {
    passport.authenticate("local", async function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.json({ message: info.message }); 
        }

        try {
            if (!user.is_verified) {
                return res.status(403).json({ message: "Please verify your email before logging in." });
            }

            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.json({ message: "Login successful!" });
            });
        } catch (error) {
            console.error("Login Error:", error);
            return res.status(500).json({ message: "Login failed" });
        }
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

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);


module.exports = router;
