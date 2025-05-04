const { Model, DataTypes } = require('sequelize');

class ServiceRequest extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['Electrical', 'Plumbing', 'Cleaning', 'Painting', 'Carpentry', 'AC Repair']]
        }
      },
      serviceType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      serviceTitle: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      scheduledDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      preferredTime: {
        type: DataTypes.STRING,
        allowNull: false
      },
      alternateDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      urgencyLevel: {
        type: DataTypes.ENUM('Standard (3-5 days)', 'Priority (1-2 days)', 'Emergency (Same day)'),
        defaultValue: 'Standard (3-5 days)'
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false
      },
      photos: {
        type: DataTypes.JSON,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'ServiceRequest',
      tableName: 'ServiceRequests'
    });
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
}

module.exports = ServiceRequest;