const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const passport = require("passport");

// Configure email transporter with better error handling
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "hassanzulfiqar687@gmail.com",
        pass: process.env.EMAIL_PASS || "wfxenpokribmzojw"
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter connection
transporter.verify(function(error, success) {
    if (error) {
        console.error("Email transporter error:", error);
    } else {
        console.log("Email server is ready to send messages");
    }
});

// User registration
exports.signup = async (req, res) => {
    try {
        const { name, email, password, contact, user_type } = req.body;
        // Set default profile pic to dummy.png if no file is uploaded
        const profile_pic = req.file ? "/uploads/" + req.file.filename : "/uploads/dummy.png";

        // Check if email exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const verification_token = crypto.randomBytes(32).toString("hex");
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            contact,
            profile_pic,
            user_type,
            is_verified: false,
            verification_token
        });
        
        // Save user first
        await newUser.save();

        try {
            // Send verification email using async/await instead of callbacks
            const verificationLink = `http://localhost:3000/verify/${verification_token}`;
            const mailOptions = {
                from: "FixPoint <hassanzulfiqar687@gmail.com>",
                to: email,
                subject: "Verify Your Email",
                text: `Click this link to verify your email: ${verificationLink}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #0d6efd;">Welcome to FixPoint!</h2>
                        <p>Thank you for signing up. Please click the button below to verify your email address:</p>
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="${verificationLink}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                        </div>
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p><a href="${verificationLink}">${verificationLink}</a></p>
                        <p>This link will expire in 24 hours.</p>
                        <p>Regards,<br>The FixPoint Team</p>
                    </div>
                `
            };
            
            const info = await transporter.sendMail(mailOptions);
            console.log("Verification email sent: %s", info.messageId);
            
            return res.status(200).json({ 
                success: true,
                message: "Account created successfully! Verification email sent. Please check your inbox." 
            });
            
        } catch (emailError) {
            console.error("Email sending error:", emailError);
            
            // We don't delete the user - they can request the verification email again
            return res.status(201).json({ 
                success: true,
                message: "Account created but could not send verification email. Please contact support." 
            });
        }
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Error registering user" });
    }
};

// Email verification
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Find user with the token
        const user = await User.findOne({ verification_token: token });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Mark user as verified
        user.is_verified = true;
        user.verification_token = null; // Remove token after verification
        await user.save();

        res.redirect("/login.html"); // Redirect to login page after verification
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
};

// User login
exports.login = function (req, res, next) {
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
                return res.json({ 
                    message: "Login successful!",
                    user_type: user.user_type 
                });
            });
        } catch (error) {
            console.error("Login Error:", error);
            return res.status(500).json({ message: "Login failed" });
        }
    })(req, res, next);
};

// User logout
exports.logout = function (req, res) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/login.html");
    });
};

// Password reset request
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        const resetLink = `http://localhost:3000/reset_password.html?token=${resetToken}`;
        const mailOptions = {
            from: "no-reply@fixpoint.com",
            to: user.email,
            subject: "Password Reset Request",
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="${resetLink}">link</a> to reset your password</p>
                <p>This link will expire in 1 hour</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Password reset link sent to your email" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Error processing request" });
    }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpires = null;
        await user.save();

        res.json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
};

// Check authentication
exports.checkAuth = function (req, res) {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    res.send("Welcome " + req.user.email + "!");
};
