'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Dependency extends Model {
        static associate(models) {
            Dependency.belongsTo(models.Service, { as: 'service', foreignKey: 'serviceId' });
            Dependency.belongsTo(models.Service, { as: 'dependsOn', foreignKey: 'dependsOnId' });
        }
    }
    Dependency.init({
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Services',
                key: 'id'
            }
        },
        dependsOnId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Services',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'Dependency',
    });
    return Dependency;
};
