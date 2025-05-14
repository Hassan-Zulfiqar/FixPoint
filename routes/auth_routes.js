const express = require("express");
const multer = require("multer");
const path = require("path");
const authController = require("../controllers/auth_controllers");
const userController = require("../controllers/userController");

const router = express.Router();

// Configure file upload
const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, path.parse(file.originalname).name + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Auth routes
router.post("/signup", upload.single("profile_pic"), authController.signup);
router.get("/verify/:token", authController.verifyEmail);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.get("/dashboard", authController.checkAuth);

// User profile routes
router.post("/update-profile-pic", upload.single("profilePic"), userController.updateProfilePic);

module.exports = router;
