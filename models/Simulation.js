'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Simulation extends Model {
        static associate(models) {

        }
    }
    Simulation.init({
        failedServiceIds: {
            type: DataTypes.JSON,
            allowNull: false
        },
        impactedServiceIds: {
            type: DataTypes.JSON,
            allowNull: false
        },
        totalImpacted: DataTypes.INTEGER,
        severityScore: DataTypes.FLOAT
    }, {
        sequelize,
        modelName: 'Simulation',
    });
    return Simulation;
};
