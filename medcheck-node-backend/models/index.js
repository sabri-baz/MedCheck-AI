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

User.hasMany(Medicine, { foreignKey: 'userId', as: 'medicines' });
Medicine.belongsTo(User, { foreignKey: 'userId', as: 'user' });
module.exports = {
  sequelize,
  User,
  Medicine
};
