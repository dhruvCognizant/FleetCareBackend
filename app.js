const express = require('express')
const app = express();
require('dotenv').config();
const connectDB = require("./config/db.config")
const vehicleRoute = require('./routes/vehicleRoutes')
const odometerRoute = require('./routes/odometerRoutes')
const schedulingRoutes  = require('./routes/schedulingRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const historyRoutes=  require("./routes/historyRoutes")
const registerRoutes = require('./routes/registerRoutes')
const getSummary = require("./routes/dashboardRoutes")
const { logger } = require('./middlewares/logger');
const { headerSet } = require('./middlewares/header');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(headerSet);
require('./config/passport')(passport);
app.use(passport.initialize());

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200', credentials: true }));

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fleetProject';

if (mongoUri) {
  connectDB(mongoUri);
} else {
  console.warn('MONGO_URI not set — skipping DB connection');
}

// Public routes
app.use('/auth', authRoutes);
app.use('/api/register', registerRoutes);

app.use('/api', passport.authenticate('jwt', { session: false }));

// Protected routes
app.use('/api', vehicleRoute);
app.use('/api/vehicles', odometerRoute);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/dashboard', getSummary);

app.use(errorHandler);

module.exports = app;