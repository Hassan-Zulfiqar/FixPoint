const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const ServiceProvider = sequelize.define("ServiceProvider", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: User,
            key: "id"
        }
    },
    service_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    licence_doc: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    approved_by_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = ServiceProvider;
