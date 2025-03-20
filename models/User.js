const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import DB connection

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    contact: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    profile_pic: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    user_type: {
        type: DataTypes.ENUM("customer", "service_provider"),
        allowNull: false
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = User;
