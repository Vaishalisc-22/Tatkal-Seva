/**
 * Tatkal Seva - DAA Project
 * File: server/server.js
 * 
 * Express Web Server entry point.
 * Serves the modern emergency route planning frontend and the DAA API.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/api');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Mount DAA REST API
app.use('/api', apiRoutes);

// Fallback to index.html for single-page application navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start listening
const server = app.listen(config.PORT, () => {
  console.log('===============================================================');
  console.log(`🚑  TATKAL SEVA - EMERGENCY ROUTE PLANNER (DAA PROJECT)        `);
  console.log(`📡  Server active at: http://localhost:${config.PORT}           `);
  console.log(`🗺️   Interactive Leaflet Map & DAA Algorithm Visualizer Online  `);
  console.log('===============================================================');
});

module.exports = { app, server };
