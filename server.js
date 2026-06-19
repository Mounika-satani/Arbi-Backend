const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const { sequelize } = require('./models');

const serviceRoutes = require('./routes/serviceRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/simulations', simulationRoutes);

async function startServer() {
  try {
    await sequelize.authenticate({ logging: false });
    console.log('✅ Connection to the database has been established successfully.');

    await sequelize.sync({ alter: true, logging: false });
    console.log('✅ Database synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
