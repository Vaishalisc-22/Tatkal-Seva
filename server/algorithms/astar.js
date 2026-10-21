/**
 * Tatkal Seva - DAA Project
 * File: server/algorithms/astar.js
 * 
 * DESIGN & ANALYSIS OF ALGORITHMS (DAA) MANUAL IMPLEMENTATION:
 * A* (A-Star) Heuristic Shortest Path Algorithm
 * 
 * Paradigm: Informed Search / Best-First Search with Heuristics
 * Evaluation Function: f(n) = g(n) + h(n)
 * - g(n): Exact cost from start node to node n
 * - h(n): Admissible heuristic estimate from node n to destination
 * - f(n): Estimated total cost of path passing through node n
 * 
 * Heuristic Function Used:
 * - Haversine Great-Circle Distance (or Euclidean distance)
 * - Admissibility: h(n) <= h*(n) (guaranteed by aerial distance <= road distance)
 * - Consistency (Monotonicity): h(u) <= c(u, v) + h(v)
 * 
 * Time Complexity:
 * - Worst case: O(b^d) or O((V + E) log V)
 * - In practice: Far faster than Dijkstra because the search is directed towards the goal
 * Space Complexity:
 * - O(V) to store open and closed sets
 */

const MinPriorityQueue = require('./priorityQueue');

/**
 * Runs A* Shortest Path Algorithm from startNodeId to targetNodeId
 * 
 * @param {Graph} graph - Weighted graph instance
 * @param {string} startNodeId - Source node ID (Ambulance location)
 * @param {string} targetNodeId - Destination node ID (Emergency/Hospital location)
 * @param {string} metric - 'time' or 'distance'
 * @param {string} heuristicType - 'haversine' or 'euclidean'
 * @returns {Object} Result containing route, metrics, and exploration log
 */
function runAStar(graph, startNodeId, targetNodeId, metric = 'time', heuristicType = 'haversine') {
  const hrStart = process.hrtime.bigint(); // High-resolution timer

  const startNode = graph.getNode(startNodeId);
  const targetNode = graph.getNode(targetNodeId);

  if (!startNode || !targetNode) {
    throw new Error(`Invalid start (${startNodeId}) or target (${targetNodeId}) node.`);
  }

  // Maps for g-score, f-score, and path reconstruction
  const gScore = new Map(); // Cost from start to current node
  const fScore = new Map(); // Estimated total cost: g(n) + h(n)
  const predecessors = new Map(); // u -> { fromNode, edge }
  const closedSet = new Set(); // Settled nodes
  const openSetTracker = new Set(); // Nodes currently in open set (Min-Heap)

  const openQueue = new MinPriorityQueue();
  const explorationTrace = [];
  let edgeRelaxations = 0;

  // Initialize all nodes with Infinity
  for (const node of graph.getAllNodes()) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  }

  // Start node initialization
  const initialH = graph.heuristic(startNodeId, targetNodeId, metric, heuristicType);
  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, initialH);

  // Enqueue start node with priority = f(start)
  openQueue.enqueue(startNodeId, initialH);
  openSetTracker.add(startNodeId);

  let targetReached = false;

  while (!openQueue.isEmpty()) {
    // Select node in open set with lowest f(n)
    const currentId = openQueue.dequeue();
    openSetTracker.delete(currentId);

    // If node was already evaluated via shorter route, skip
    if (closedSet.has(currentId)) continue;

    closedSet.add(currentId);

    const currentG = gScore.get(currentId);
    const currentH = graph.heuristic(currentId, targetNodeId, metric, heuristicType);
    const currentF = fScore.get(currentId);

    // Record trace for visualizer & DAA analysis
    explorationTrace.push({
      step: explorationTrace.length + 1,
      nodeId: currentId,
      nodeName: graph.getNode(currentId).name,
      gScore: Number(currentG.toFixed(2)),
      hScore: Number(currentH.toFixed(2)),
      fScore: Number(currentF.toFixed(2)),
      visitedCount: closedSet.size
    });

    // Goal test: Target reached!
    if (currentId === targetNodeId) {
      targetReached = true;
      break;
    }

    // Inspect neighbors
    const neighbors = graph.getNeighbors(currentId);
    for (const edge of neighbors) {
      const neighborId = edge.to;

      if (closedSet.has(neighborId)) continue; // Already evaluated

      const weight = graph.getWeight(edge, metric);
      if (weight === Infinity) continue; // Blocked road

      edgeRelaxations++;
      const tentativeG = currentG + weight;

      // If discovered a superior path to neighbor
      if (tentativeG < gScore.get(neighborId)) {
        predecessors.set(neighborId, {
          from: currentId,
          edge
        });

        gScore.set(neighborId, tentativeG);
        const h = graph.heuristic(neighborId, targetNodeId, metric, heuristicType);
        const f = tentativeG + h;
        fScore.set(neighborId, f);

        // Add to priority queue ordered by f(n)
        openQueue.enqueue(neighborId, f);
        openSetTracker.add(neighborId);
      }
    }
  }

  const hrEnd = process.hrtime.bigint();
  const executionTimeMs = Number(hrEnd - hrStart) / 1_000_000;
  const executionTimeMicro = Number(hrEnd - hrStart) / 1_000;

  if (!targetReached && gScore.get(targetNodeId) === Infinity) {
    return {
      success: false,
      algorithm: 'A*',
      startNodeId,
      targetNodeId,
      message: 'No passable route found between source and destination.',
      nodesExplored: closedSet.size,
      edgeRelaxations,
      executionTimeMs,
      executionTimeMicro
    };
  }

  // Reconstruct path
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

  const pathNodes = path.map(id => graph.getNode(id));

  return {
    success: true,
    algorithm: 'A*',
    metric,
    heuristicType,
    startNode: startNode,
    targetNode: targetNode,
    pathNodeIds: path,
    pathNodes,
    edgesUsed,
    totalCost: Number(gScore.get(targetNodeId).toFixed(3)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalTimeMins: Number(totalTimeMins.toFixed(1)),
    nodesExplored: closedSet.size,
    totalNodesInGraph: graph.getAllNodes().length,
    edgeRelaxations,
    heapComparisons: openQueue.comparisonCount,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    executionTimeMicro: Number(executionTimeMicro.toFixed(1)),
    explorationTrace,
    complexity: {
      time: 'O((V + E) log V) worst-case, directed O(b^d) effective',
      space: 'O(V)',
      optimality: 'Guaranteed optimal when heuristic is admissible and consistent'
    }
  };
}

module.exports = { runAStar };
