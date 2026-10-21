/**
 * Tatkal Seva - DAA Project
 * File: server/database/db.js
 * 
 * SQLite Database Manager using Node.js built-in 'node:sqlite'
 * Provides high-performance persistent storage for nodes, edges, ambulances, and route telemetry.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'tatkal_seva.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

class DatabaseManager {
  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.initSchema();
  }

  initSchema() {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    this.db.exec(schemaSql);
  }

  // --- NODES ---
  getAllNodes() {
    return this.db.prepare('SELECT * FROM nodes ORDER BY type, name').all();
  }

  getNodeById(id) {
    return this.db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
  }

  getNodesByType(type) {
    return this.db.prepare('SELECT * FROM nodes WHERE type = ?').all(type);
  }

  insertNode(node) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO nodes (id, name, type, lat, lng, description, capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      node.id,
      node.name,
      node.type,
      node.lat,
      node.lng,
      node.description || '',
      node.capacity || 0
    );
  }

  // --- EDGES ---
  getAllEdges() {
    return this.db.prepare('SELECT * FROM edges').all();
  }

  getEdgeById(id) {
    return this.db.prepare('SELECT * FROM edges WHERE id = ?').get(id);
  }

  insertEdge(edge) {
    const stmt = this.db.prepare(`
      INSERT INTO edges (source, target, road_name, distance_km, speed_limit_kmh, traffic_factor, one_way)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      edge.source,
      edge.target,
      edge.road_name,
      edge.distance_km,
      edge.speed_limit_kmh || 50,
      edge.traffic_factor || 1.0,
      edge.one_way || 0
    );
  }

  updateEdgeTraffic(edgeId, trafficFactor) {
    const stmt = this.db.prepare('UPDATE edges SET traffic_factor = ? WHERE id = ?');
    return stmt.run(trafficFactor, edgeId);
  }

  resetAllTraffic() {
    this.db.prepare('UPDATE edges SET traffic_factor = 1.0').run();
  }

  // --- AMBULANCES ---
  getAllAmbulances() {
    return this.db.prepare(`
      SELECT a.*, n.name as location_name, n.lat, n.lng 
      FROM ambulances a
      JOIN nodes n ON a.current_node_id = n.id
    `).all();
  }

  insertAmbulance(amb) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ambulances (id, callsign, current_node_id, status, driver_name, contact)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(amb.id, amb.callsign, amb.current_node_id, amb.status || 'available', amb.driver_name, amb.contact);
  }

  updateAmbulanceLocation(id, nodeId, status = 'available') {
    const stmt = this.db.prepare('UPDATE ambulances SET current_node_id = ?, status = ? WHERE id = ?');
    return stmt.run(nodeId, status, id);
  }

  // --- ROUTE LOGS ---
  logRoute(data) {
    const stmt = this.db.prepare(`
      INSERT INTO route_logs (algorithm, metric, start_node_id, target_node_id, distance_km, time_mins, nodes_explored, execution_time_ms, path_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.algorithm,
      data.metric,
      data.start_node_id,
      data.target_node_id,
      data.distance_km,
      data.time_mins,
      data.nodes_explored,
      data.execution_time_ms,
      data.path_summary
    );
  }

  getRecentLogs(limit = 10) {
    return this.db.prepare('SELECT * FROM route_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  }

  clearLogs() {
    this.db.prepare('DELETE FROM route_logs').run();
  }
}

const dbManager = new DatabaseManager();
module.exports = dbManager;
