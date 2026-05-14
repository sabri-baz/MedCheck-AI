const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Medicine = sequelize.define('Medicine', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalPills: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    dailyDose: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    usage_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastTaken: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return Medicine;
};
