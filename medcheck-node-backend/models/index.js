const { Sequelize } = require('sequelize');
const dbConfig = {
  name: process.env.DB_NAME || 'medcheck_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres'
};

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false
  }
);

const User = require('./User')(sequelize);
const Medicine = require('./Medicine')(sequelize);
const Report = require('./Report')(sequelize);
const Profile = require('./Profile')(sequelize);
const MedicineLog = require('./MedicineLog')(sequelize);

User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Medicine, { foreignKey: 'userId', as: 'medicines' });
Medicine.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(MedicineLog, { foreignKey: 'userId', as: 'medicineLogs' });
MedicineLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Medicine.hasMany(MedicineLog, { foreignKey: 'medicineId', as: 'logs' });
MedicineLog.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });
module.exports = {
  sequelize,
  User,
  Medicine,
  Report,
  Profile,
  MedicineLog
};
