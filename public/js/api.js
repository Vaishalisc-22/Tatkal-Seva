/**
 * Tatkal Seva - DAA Project
 * File: public/js/api.js
 * 
 * Client API Client for communicating with the Tatkal Seva backend
 */

const API = {
  baseUrl: '/api',

  async getNetwork() {
    const res = await fetch(`${this.baseUrl}/network`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  async calculateRoute({ startNodeId, targetNodeId, algorithm = 'astar', metric = 'time', heuristicType = 'haversine' }) {
    const res = await fetch(`${this.baseUrl}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startNodeId, targetNodeId, algorithm, metric, heuristicType })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  async compareAlgorithms({ startNodeId, targetNodeId, metric = 'time', heuristicType = 'haversine' }) {
    const res = await fetch(`${this.baseUrl}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startNodeId, targetNodeId, metric, heuristicType })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  async findNearestHospital({ patientNodeId, metric = 'time' }) {
    const res = await fetch(`${this.baseUrl}/find-nearest-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientNodeId, metric })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  async updateTraffic({ edgeId, trafficFactor }) {
    const res = await fetch(`${this.baseUrl}/traffic/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edgeId, trafficFactor })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  async applyTrafficScenario(scenario) {
    const res = await fetch(`${this.baseUrl}/traffic/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  async resetTraffic() {
    const res = await fetch(`${this.baseUrl}/traffic/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  async getLogs() {
    const res = await fetch(`${this.baseUrl}/logs`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }
};
