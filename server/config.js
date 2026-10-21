/**
 * Tatkal Seva - DAA Project
 * File: server/config.js
 * 
 * Application configuration
 */

module.exports = {
  PORT: process.env.PORT || 3000,
  PROJECT_NAME: 'Tatkal Seva - Emergency Ambulance Route Planner',
  VERSION: '1.0.0',
  MAP_DEFAULTS: {
    CENTER: [12.965, 77.615], // Bengaluru center
    ZOOM: 12
  }
};
