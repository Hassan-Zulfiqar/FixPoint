const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static init(sequelize) {
    super.init({
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
        unique: { name: "unique_email", msg: "Email must be unique" }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      contact: {
        type: DataTypes.STRING(11),
        allowNull: false
      },
      profile_pic: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "/uploads/default.jpg"
      },
      user_type: {
        type: DataTypes.ENUM("customer", "service_provider"),
        allowNull: false
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      verification_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resetTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      timestamps: true
    });
  }

  static associate(models) {
    this.hasMany(models.ServiceRequest, {
      foreignKey: 'userId',
      as: 'serviceRequests'
    });
    
    this.hasOne(models.ServiceProvider, {
      foreignKey: 'user_id',
      as: 'serviceProvider'
    });
  }
}

module.exports = User;