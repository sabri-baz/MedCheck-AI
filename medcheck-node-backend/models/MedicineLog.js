const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MedicineLog = sequelize.define('MedicineLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medicineId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('taken', 'missed'),
      defaultValue: 'taken'
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    takenTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return MedicineLog;
};
