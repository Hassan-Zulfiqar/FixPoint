const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const User = require("../models/User");

const router = express.Router();

// Simplified File Upload Configuration
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
    try {
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

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

module.exports = router;
