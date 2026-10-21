/**
 * Tatkal Seva - DAA Project
 * File: server/algorithms/graph.js
 * 
 * DESIGN & ANALYSIS OF ALGORITHMS (DAA) CONCEPT:
 * Weighted Graph Representation using an Adjacency List.
 * 
 * Representation:
 * - G = (V, E)
 * - V = Set of vertices (road junctions, hospitals, landmarks)
 * - E = Set of directed/undirected weighted edges (roads)
 * 
 * Space Complexity: O(V + E)
 * Adjacency List is optimal for sparse road networks (where E << V^2).
 */

class Graph {
  constructor() {
    this.nodes = new Map(); // nodeId -> Node details (lat, lng, name, type)
    this.adjacencyList = new Map(); // nodeId -> Array of outgoing edges
    this.maxSpeedLimit = 100; // km/h, used for admissible A* time heuristic
  }

  /**
   * Add a vertex/node to the graph
   */
  addNode(node) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, {
        id: node.id,
        name: node.name,
        type: node.type || 'junction',
        lat: parseFloat(node.lat),
        lng: parseFloat(node.lng),
        description: node.description || '',
        capacity: node.capacity || 0
      });
      this.adjacencyList.set(node.id, []);
    }
  }

  /**
   * Add an edge between two vertices
   * Supports one-way or bidirectional roads
   */
  addEdge(edge) {
    const {
      source,
      target,
      road_name = 'Road Segment',
      distance_km = 1.0,
      speed_limit_kmh = 50,
      traffic_factor = 1.0,
      one_way = 0,
      id = null
    } = edge;

    if (!this.nodes.has(source) || !this.nodes.has(target)) {
      return false;
    }

    const dist = parseFloat(distance_km);
    const speed = parseFloat(speed_limit_kmh) || 50;
    const traffic = parseFloat(traffic_factor) || 1.0;

    if (speed > this.maxSpeedLimit) {
      this.maxSpeedLimit = speed;
    }

    // Outward edge from source to target
    this.adjacencyList.get(source).push({
      edgeId: id,
      to: target,
      roadName: road_name,
      distanceKm: dist,
      speedLimitKmh: speed,
      trafficFactor: traffic,
      isBlocked: traffic >= 900 // Blocked road indicator
    });

    // If bidirectional, also add reverse edge
    if (!one_way) {
      this.adjacencyList.get(target).push({
        edgeId: id,
        to: source,
        roadName: road_name,
        distanceKm: dist,
        speedLimitKmh: speed,
        trafficFactor: traffic,
        isBlocked: traffic >= 900
      });
    }

    return true;
  }

  /**
   * Get all outgoing edges/neighbors for a node
   */
  getNeighbors(nodeId) {
    return this.adjacencyList.get(nodeId) || [];
  }

  /**
   * Get node metadata
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes as array
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Calculate edge cost/weight based on chosen optimization metric
   * - 'time': Travel time in minutes = (distance / speed) * 60 * traffic_factor
   * - 'distance': Physical distance in km (penalized heavily if blocked)
   */
  getWeight(edge, metric = 'time') {
    if (edge.isBlocked) {
      return Infinity; // Impassable road
    }

    if (metric === 'distance') {
      return edge.distanceKm;
    }

    // Default: 'time' (fastest emergency route in minutes)
    const baseTimeMins = (edge.distanceKm / edge.speedLimitKmh) * 60;
    return baseTimeMins * edge.trafficFactor;
  }

  /**
   * Haversine formula to compute great-circle distance between two geographic coordinates
   * Mathematical basis for the A* heuristic on a planetary sphere:
   * d = 2 * R * asin(sqrt(sin^2(Δlat/2) + cos(lat1)*cos(lat2)*sin^2(Δlon/2)))
   */
  haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * toRad) *
        Math.cos(lat2 * toRad) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Euclidean distance approximation (scaled to km)
   */
  euclideanDistanceKm(lat1, lon1, lat2, lon2) {
    const latKm = (lat2 - lat1) * 110.574;
    const avgLatRad = ((lat1 + lat2) / 2) * (Math.PI / 180);
    const lonKm = (lon2 - lon1) * 111.32 * Math.cos(avgLatRad);
    return Math.sqrt(latKm * latKm + lonKm * lonKm);
  }

  /**
   * Heuristic Function h(n) for A* Search.
   * 
   * DAA CRITICAL REQUIREMENT: ADMISSIBILITY & CONSISTENCY
   * For A* to guarantee the optimal shortest path:
   * 1. Admissibility: h(n) <= h*(n) (must never overestimate true remaining cost)
   * 2. Consistency (Monotonicity): h(u) <= c(u, v) + h(v)
   * 
   * Proof of Admissibility for Tatkal Seva:
   * - For 'distance': Straight-line aerial distance is the shortest possible path (triangle inequality).
   *   Road distance is always >= aerial distance. Hence h(n) <= h*(n).
   * - For 'time': h_time(n) = (aerial_distance / max_network_speed) * 60 minutes.
   *   Since no ambulance can travel faster than max_network_speed, this never overestimates time.
   */
  heuristic(fromNodeId, toNodeId, metric = 'time', heuristicType = 'haversine') {
    const nodeA = this.nodes.get(fromNodeId);
    const nodeB = this.nodes.get(toNodeId);

    if (!nodeA || !nodeB) return 0;

    let straightDistKm = 0;
    if (heuristicType === 'euclidean') {
      straightDistKm = this.euclideanDistanceKm(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
    } else {
      straightDistKm = this.haversineDistanceKm(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
    }

    if (metric === 'distance') {
      return straightDistKm;
    }

    // For time optimization: straight line distance / maximum possible speed on the network
    // This maintains admissibility h(n) <= h*(n)
    const minTravelTimeMins = (straightDistKm / this.maxSpeedLimit) * 60;
    return minTravelTimeMins;
  }
}

module.exports = Graph;
