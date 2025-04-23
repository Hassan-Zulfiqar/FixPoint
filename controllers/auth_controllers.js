const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize"); // Ensure Sequelize Op is imported
const User = require("../models/User");

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes
    await user.save();

    // Send email with reset link
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: "hassanzulfiqar687@gmail.com", pass: "wfxenpokribmzojw" }
    });

    const mailOptions = {
        to: user.email,
        from: "no-reply@Fixpoint.com",
        subject: "Password Reset",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset link sent to your email" });
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
        where: { resetToken: token, resetTokenExpires: { [Op.gt]: Date.now() } } // Ensure Sequelize.Op is correctly used
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
};
