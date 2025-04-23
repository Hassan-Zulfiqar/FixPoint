const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import DB connection


const User = sequelize.define("User", {
    id: 
    {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: 
    {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: 
    {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: { name: "unique_email", msg: "Email must be unique" }
    },
    password: 
    {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    contact: 
    {
        type: DataTypes.STRING(11),
        allowNull: false
    },
    profile_pic: 
    {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "/uploads/default.jpg"
    },
    user_type: 
    {
        type: DataTypes.ENUM("customer", "service_provider"),
        allowNull: false
    },
    is_verified: 
    { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false // For email verification 
    },
    verification_token: 
    { 
        type: DataTypes.STRING, 
        allowNull: true // Store token for email verification
    },
    resetToken: 
    { type: DataTypes.STRING, allowNull: true },
    resetTokenExpires: 
    { type: DataTypes.DATE, allowNull: true }
}, 
{
    timestamps: true
});

module.exports = User;
