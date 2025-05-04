const { Model, DataTypes } = require('sequelize');

class ServiceProvider extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
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
      sequelize,
      modelName: 'ServiceProvider',
      tableName: 'ServiceProviders',
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

module.exports = ServiceProvider;