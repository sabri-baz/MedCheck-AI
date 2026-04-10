require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Sequelize } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev')); // Logger

// Import Models and Sequelize instance
const { sequelize, User, Medicine } = require('./models');

const dbConfig = {
  name: process.env.DB_NAME || 'medcheck_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres'
};

// Check & Connect to DB
async function initializeDB() {
  try {
    // try to authenticate first
    await sequelize.authenticate();
    console.log('✅ Connected to database: ' + dbConfig.name);
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ Synchronized database models (Users, Medicines).');
  } catch (error) {
    if (error.original && error.original.code === '3D000') { // Database does not exist code
      console.log(`⚠️ Database '${dbConfig.name}' doesn't exist. Attempting to create...`);
      // Try to connect to 'postgres' system db to create our target db
      const systemSequelize = new Sequelize('postgres', dbConfig.user, dbConfig.password, {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false,
      });
      try {
        await systemSequelize.query(`CREATE DATABASE "${dbConfig.name}";`);
        console.log(`✅ Database '${dbConfig.name}' created successfully.`);
        await systemSequelize.close();
        
        // Re-attempt authentication and sync
        await sequelize.authenticate();
        console.log('✅ Connected to new database successfully.');
        await sequelize.sync({ alter: true });
        console.log('✅ Synchronized database models (Users, Medicines).');
      } catch (createError) {
        console.error('❌ Failed to create database:', createError.message);
      }
    } else {
      console.error('❌ Database connection error:', error.message);
    }
  }
}

initializeDB();

// Routes
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('MedCheck AI Backend is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
