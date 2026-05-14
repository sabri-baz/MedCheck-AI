const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    medicines: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    riskLevel: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'low_risk'
    },
    aiMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
    }
  }, {
    timestamps: true
  });

  return Report;
};
