'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate(models) {

      Service.hasMany(models.Dependency, { as: 'outgoingDependencies', foreignKey: 'serviceId' });
      Service.hasMany(models.Dependency, { as: 'incomingDependencies', foreignKey: 'dependsOnId' });
    }
  }
  Service.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT,
    owner: DataTypes.STRING,
    criticality: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      defaultValue: 'Medium'
    }
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};
