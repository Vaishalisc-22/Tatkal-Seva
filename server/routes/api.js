/**
 * Tatkal Seva - DAA Project
 * File: server/routes/api.js
 * 
 * REST API Endpoints for Emergency Dispatch, DAA Algorithms, and Real-time Traffic Simulation
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const Graph = require('../algorithms/graph');
const { runDijkstra } = require('../algorithms/dijkstra');
const { runAStar } = require('../algorithms/astar');
const { compareAlgorithms } = require('../algorithms/comparator');

/**
 * Helper to build an active Graph instance from SQLite
 */
function getActiveGraph() {
  const graph = new Graph();
  const nodes = db.getAllNodes();
  const edges = db.getAllEdges();

  for (const node of nodes) {
    graph.addNode(node);
  }

  for (const edge of edges) {
    graph.addEdge(edge);
  }

  return { graph, nodes, edges };
}

/**
 * GET /api/network
 * Returns full network topology: nodes, edges, ambulances, and summary stats
 */
router.get('/network', (req, res) => {
  try {
    const nodes = db.getAllNodes();
    const edges = db.getAllEdges();
    const ambulances = db.getAllAmbulances();
    const hospitals = db.getNodesByType('hospital');
    const emergencyPoints = db.getNodesByType('emergency_point');
    const stations = db.getNodesByType('ambulance_station');

    res.json({
      success: true,
      data: {
        stats: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          totalHospitals: hospitals.length,
          totalAmbulances: ambulances.length,
          emergencyPoints: emergencyPoints.length
        },
        nodes,
        edges,
        ambulances,
        hospitals,
        emergencyPoints,
        stations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/route
 * Computes shortest/fastest route using the chosen DAA algorithm
 */
router.post('/route', (req, res) => {
  try {
    const {
      startNodeId,
      targetNodeId,
      algorithm = 'astar', // 'dijkstra' | 'astar'
      metric = 'time', // 'time' | 'distance'
      heuristicType = 'haversine' // 'haversine' | 'euclidean'
    } = req.body;

    if (!startNodeId || !targetNodeId) {
      return res.status(400).json({ success: false, error: 'startNodeId and targetNodeId are required.' });
    }

    const { graph } = getActiveGraph();

    let result;
    if (algorithm.toLowerCase() === 'dijkstra') {
      result = runDijkstra(graph, startNodeId, targetNodeId, metric);
    } else {
      result = runAStar(graph, startNodeId, targetNodeId, metric, heuristicType);
    }

    if (result.success) {
      // Log to database for telemetry & audit
      db.logRoute({
        algorithm: result.algorithm,
        metric: result.metric,
        start_node_id: startNodeId,
        target_node_id: targetNodeId,
        distance_km: result.totalDistanceKm,
        time_mins: result.totalTimeMins,
        nodes_explored: result.nodesExplored,
        execution_time_ms: result.executionTimeMs,
        path_summary: result.pathNodeIds.join(' -> ')
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/compare
 * Runs both Dijkstra and A* side-by-side on identical graph state
 */
router.post('/compare', (req, res) => {
  try {
    const {
      startNodeId,
      targetNodeId,
      metric = 'time',
      heuristicType = 'haversine'
    } = req.body;

    if (!startNodeId || !targetNodeId) {
      return res.status(400).json({ success: false, error: 'startNodeId and targetNodeId are required.' });
    }

    const { graph } = getActiveGraph();
    const comparison = compareAlgorithms(graph, startNodeId, targetNodeId, metric, heuristicType);

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/find-nearest-hospital
 * Evaluates all hospitals from patient location and finds optimal destination
 */
router.post('/find-nearest-hospital', (req, res) => {
  try {
    const { patientNodeId, metric = 'time' } = req.body;

    if (!patientNodeId) {
      return res.status(400).json({ success: false, error: 'patientNodeId is required.' });
    }

    const { graph } = getActiveGraph();
    const hospitals = db.getNodesByType('hospital');

    const evaluations = [];

    for (const hosp of hospitals) {
      const routeResult = runAStar(graph, patientNodeId, hosp.id, metric);
      if (routeResult.success) {
        evaluations.push({
          hospital: hosp,
          distanceKm: routeResult.totalDistanceKm,
          timeMins: routeResult.totalTimeMins,
          icuBedsAvailable: hosp.capacity,
          pathNodeIds: routeResult.pathNodeIds,
          score: routeResult.totalTimeMins - (hosp.capacity * 0.1) // Prefer faster reachable with more ICU beds
        });
      }
    }

    evaluations.sort((a, b) => a.score - b.score);

    res.json({
      success: true,
      patientNode: graph.getNode(patientNodeId),
      recommendedHospital: evaluations.length > 0 ? evaluations[0] : null,
      allHospitalOptions: evaluations
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/traffic/update
 * Dynamically adjust edge traffic factor or block an edge
 */
router.post('/traffic/update', (req, res) => {
  try {
    const { edgeId, trafficFactor } = req.body;
    if (!edgeId || trafficFactor === undefined) {
      return res.status(400).json({ success: false, error: 'edgeId and trafficFactor are required.' });
    }

    db.updateEdgeTraffic(edgeId, parseFloat(trafficFactor));
    res.json({ success: true, message: `Edge ${edgeId} updated with traffic factor ${trafficFactor}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/traffic/scenario
 * Apply pre-configured emergency scenarios for viva live demo
 */
router.post('/traffic/scenario', (req, res) => {
  try {
    const { scenario } = req.body;
    db.resetAllTraffic();

    let description = '';

    if (scenario === 'silk_board_gridlock') {
      // Heavily congest Silk Board (J3) and Hosur Road
      const edges = db.getAllEdges();
      for (const e of edges) {
        if (e.source === 'J3' || e.target === 'J3' || e.source === 'J4' || e.target === 'J4') {
          db.updateEdgeTraffic(e.id, 4.0); // 4x delay
        }
      }
      description = 'Severe peak-hour gridlock applied around Silk Board and BTM ring road.';
    } else if (scenario === 'flooded_underpasses') {
      // Block Mekhri Underpass (J8) and Domlur (J7)
      const edges = db.getAllEdges();
      for (const e of edges) {
        if (e.source === 'J8' || e.target === 'J8' || e.source === 'J7' || e.target === 'J7') {
          db.updateEdgeTraffic(e.id, 999.0); // Completely impassable
        }
      }
      description = 'Monsoon flash flooding: Mekhri Circle and Domlur grade separators completely blocked.';
    } else if (scenario === 'vip_corridor') {
      // MG Road and Richmond restricted
      const edges = db.getAllEdges();
      for (const e of edges) {
        if (e.source === 'J5' || e.target === 'J5' || e.source === 'AMB_BASE_2' || e.target === 'AMB_BASE_2') {
          db.updateEdgeTraffic(e.id, 999.0);
        }
        if (e.road_name.includes('Elevated') || e.road_name.includes('Expressway')) {
          db.updateEdgeTraffic(e.id, 0.7); // Green corridor on expressways!
        }
      }
      description = 'VIP Motorcade Security Protocol: CBD corridors closed, elevated highway cleared as green corridor.';
    } else {
      description = 'Normal operating conditions restored across all road corridors.';
    }

    res.json({
      success: true,
      scenario,
      description,
      edges: db.getAllEdges()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/traffic/reset
 * Resets all edge traffic factors to 1.0 (Normal)
 */
router.post('/traffic/reset', (req, res) => {
  try {
    db.resetAllTraffic();
    res.json({ success: true, message: 'All road conditions reset to baseline clear traffic.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/logs
 * Fetches recent route dispatch logs
 */
router.get('/logs', (req, res) => {
  try {
    const logs = db.getRecentLogs(15);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
