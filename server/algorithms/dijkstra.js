/**
 * Tatkal Seva - DAA Project
 * File: server/algorithms/dijkstra.js
 * 
 * DESIGN & ANALYSIS OF ALGORITHMS (DAA) MANUAL IMPLEMENTATION:
 * Dijkstra's Single-Source Shortest Path Algorithm
 * 
 * Paradigm: Greedy Method
 * Data Structure: Min-Heap Priority Queue + Adjacency List
 * 
 * Time Complexity:
 * - With Min-Heap: O((V + E) log V)
 *   - V extractions of minimum: V * O(log V)
 *   - At most E key decrease / enqueues: E * O(log V)
 * Space Complexity:
 * - O(V) for distances array, predecessor map, and visited set
 * 
 * Optimality:
 * Always produces optimal shortest paths for graphs with non-negative edge weights (w(u, v) >= 0).
 */

const MinPriorityQueue = require('./priorityQueue');

/**
 * Runs Dijkstra's Algorithm from startNodeId to targetNodeId
 * 
 * @param {Graph} graph - Weighted graph instance
 * @param {string} startNodeId - Source node ID (Ambulance location)
 * @param {string} targetNodeId - Destination node ID (Emergency/Hospital location)
 * @param {string} metric - 'time' or 'distance'
 * @returns {Object} Result containing route, metrics, and exploration log
 */
function runDijkstra(graph, startNodeId, targetNodeId, metric = 'time') {
  const hrStart = process.hrtime.bigint(); // High-resolution timer

  const startNode = graph.getNode(startNodeId);
  const targetNode = graph.getNode(targetNodeId);

  if (!startNode || !targetNode) {
    throw new Error(`Invalid start (${startNodeId}) or target (${targetNodeId}) node.`);
  }

  // Data structures for DAA state
  const distances = new Map(); // dist[u] = shortest known distance/time from start to u
  const predecessors = new Map(); // u -> { fromNode, edge }
  const visited = new Set(); // Closed set of settled vertices
  const pq = new MinPriorityQueue();

  // Exploration trace for live visualization in UI and DAA analysis
  const explorationTrace = [];
  let edgeRelaxations = 0;

  // Initialize all vertex distances to Infinity
  for (const node of graph.getAllNodes()) {
    distances.set(node.id, Infinity);
  }

  // Source distance is zero
  distances.set(startNodeId, 0);
  pq.enqueue(startNodeId, 0);

  let targetReached = false;

  while (!pq.isEmpty()) {
    const currentId = pq.dequeue();

    // If already settled, skip (standard lazy deletion handling in Min-Heap)
    if (visited.has(currentId)) continue;

    visited.add(currentId);
    const currentDist = distances.get(currentId);

    // Record exploration step
    explorationTrace.push({
      step: explorationTrace.length + 1,
      nodeId: currentId,
      nodeName: graph.getNode(currentId).name,
      currentCost: Number(currentDist.toFixed(2)),
      visitedCount: visited.size
    });

    // Destination reached: early termination for single-pair shortest path
    if (currentId === targetNodeId) {
      targetReached = true;
      break;
    }

    // Relaxation step: inspect all adjacent edges
    const neighbors = graph.getNeighbors(currentId);
    for (const edge of neighbors) {
      const neighborId = edge.to;

      if (visited.has(neighborId)) continue;

      const weight = graph.getWeight(edge, metric);
      if (weight === Infinity) continue; // Blocked road

      edgeRelaxations++;
      const alternateDist = currentDist + weight;

      // Relaxation condition: if found shorter path to neighbor
      if (alternateDist < distances.get(neighborId)) {
        distances.set(neighborId, alternateDist);
        predecessors.set(neighborId, {
          from: currentId,
          edge
        });
        pq.enqueue(neighborId, alternateDist);
      }
    }
  }

  const hrEnd = process.hrtime.bigint();
  const executionTimeMs = Number(hrEnd - hrStart) / 1_000_000; // Nanoseconds to Milliseconds
  const executionTimeMicro = Number(hrEnd - hrStart) / 1_000; // Microseconds

  // Reconstruct path from predecessors map (backtracking)
  if (!targetReached && distances.get(targetNodeId) === Infinity) {
    return {
      success: false,
      algorithm: 'Dijkstra',
      startNodeId,
      targetNodeId,
      message: 'No passable route found between source and destination.',
      nodesExplored: visited.size,
      edgeRelaxations,
      executionTimeMs,
      executionTimeMicro
    };
  }

  const path = [];
  const edgesUsed = [];
  let curr = targetNodeId;
  let totalDistanceKm = 0;
  let totalTimeMins = 0;

  while (curr !== startNodeId) {
    path.unshift(curr);
    const pred = predecessors.get(curr);
    if (!pred) break;
    edgesUsed.unshift(pred.edge);
    totalDistanceKm += pred.edge.distanceKm;
    totalTimeMins += graph.getWeight(pred.edge, 'time');
    curr = pred.from;
  }
  path.unshift(startNodeId);

  // Collect full node objects for route coordinates
  const pathNodes = path.map(id => graph.getNode(id));

  return {
    success: true,
    algorithm: 'Dijkstra',
    metric,
    startNode: startNode,
    targetNode: targetNode,
    pathNodeIds: path,
    pathNodes,
    edgesUsed,
    totalCost: Number(distances.get(targetNodeId).toFixed(3)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalTimeMins: Number(totalTimeMins.toFixed(1)),
    nodesExplored: visited.size,
    totalNodesInGraph: graph.getAllNodes().length,
    edgeRelaxations,
    heapComparisons: pq.comparisonCount,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    executionTimeMicro: Number(executionTimeMicro.toFixed(1)),
    explorationTrace,
    complexity: {
      time: 'O((V + E) log V)',
      space: 'O(V)',
      optimality: 'Guaranteed optimal for non-negative edge weights'
    }
  };
}

module.exports = { runDijkstra };
