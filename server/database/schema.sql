-- Tatkal Seva - DAA Project Database Schema
-- SQLite schema for nodes, edges, hospitals, ambulances, and route logs

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'hospital', 'junction', 'ambulance_station', 'emergency_point'
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 0 -- For hospitals: ICU beds; For stations: Ambulances available
);

CREATE TABLE IF NOT EXISTS edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  road_name TEXT NOT NULL,
  distance_km REAL NOT NULL,
  speed_limit_kmh REAL NOT NULL DEFAULT 50,
  traffic_factor REAL NOT NULL DEFAULT 1.0, -- 1.0 = normal, 1.5 = moderate, 2.5 = heavy, 999 = blocked
  one_way INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (source) REFERENCES nodes(id),
  FOREIGN KEY (target) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS ambulances (
  id TEXT PRIMARY KEY,
  callsign TEXT NOT NULL,
  current_node_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'dispatched', 'in_transit', 'maintenance'
  driver_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  FOREIGN KEY (current_node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS route_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  algorithm TEXT NOT NULL,
  metric TEXT NOT NULL,
  start_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  distance_km REAL NOT NULL,
  time_mins REAL NOT NULL,
  nodes_explored INTEGER NOT NULL,
  execution_time_ms REAL NOT NULL,
  path_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
