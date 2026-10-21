/**
 * Tatkal Seva - DAA Project
 * File: server/algorithms/comparator.js
 * 
 * DESIGN & ANALYSIS OF ALGORITHMS (DAA) COMPARISON ENGINE:
 * Compares Dijkstra's Algorithm vs A* Search on identical inputs.
 * 
 * Core Viva Discussion Points Provided:
 * 1. Search Direction: Dijkstra is uniform/uninformed (expands in all radial directions).
 *    A* is heuristic-guided/informed (steers directly toward the goal).
 * 2. Nodes Explored: A* visits significantly fewer nodes when an admissible heuristic is used.
 * 3. Optimality: Both yield the exact same optimal path cost when h(n) is admissible.
 * 4. Computational Overhead: A* calculates heuristic values at each step, but saves time by pruning search tree.
 */

const { runDijkstra } = require('./dijkstra');
const { runAStar } = require('./astar');

function compareAlgorithms(graph, startNodeId, targetNodeId, metric = 'time', heuristicType = 'haversine') {
  const dijkstraResult = runDijkstra(graph, startNodeId, targetNodeId, metric);
  const aStarResult = runAStar(graph, startNodeId, targetNodeId, metric, heuristicType);

  if (!dijkstraResult.success || !aStarResult.success) {
    return {
      success: false,
      message: 'Route calculation failed for one or both algorithms.',
      dijkstra: dijkstraResult,
      aStar: aStarResult
    };
  }

  // Calculate search space reduction
  const nodesDijkstra = dijkstraResult.nodesExplored;
  const nodesAStar = aStarResult.nodesExplored;
  const nodesSaved = Math.max(0, nodesDijkstra - nodesAStar);
  const searchReductionPct = nodesDijkstra > 0 
    ? Number(((nodesSaved / nodesDijkstra) * 100).toFixed(1))
    : 0;

  // Verify path cost consistency (both should find optimal route)
  const costDiff = Math.abs(dijkstraResult.totalCost - aStarResult.totalCost);
  const bothOptimal = costDiff < 0.001;

  return {
    success: true,
    meta: {
      startNode: dijkstraResult.startNode,
      targetNode: dijkstraResult.targetNode,
      metric,
      heuristicType,
      timestamp: new Date().toISOString()
    },
    comparison: {
      nodesExplored: {
        dijkstra: nodesDijkstra,
        aStar: nodesAStar,
        nodesSaved,
        percentageReduction: searchReductionPct,
        winner: nodesAStar <= nodesDijkstra ? 'A*' : 'Dijkstra'
      },
      executionTimeMicro: {
        dijkstra: dijkstraResult.executionTimeMicro,
        aStar: aStarResult.executionTimeMicro,
        differenceMicro: Number((dijkstraResult.executionTimeMicro - aStarResult.executionTimeMicro).toFixed(1)),
        winner: aStarResult.executionTimeMicro <= dijkstraResult.executionTimeMicro ? 'A*' : 'Dijkstra'
      },
      edgeRelaxations: {
        dijkstra: dijkstraResult.edgeRelaxations,
        aStar: aStarResult.edgeRelaxations,
        difference: dijkstraResult.edgeRelaxations - aStarResult.edgeRelaxations
      },
      heapComparisons: {
        dijkstra: dijkstraResult.heapComparisons,
        aStar: aStarResult.heapComparisons
      },
      routeDistanceKm: {
        dijkstra: dijkstraResult.totalDistanceKm,
        aStar: aStarResult.totalDistanceKm,
        identical: dijkstraResult.totalDistanceKm === aStarResult.totalDistanceKm
      },
      estimatedTimeMins: {
        dijkstra: dijkstraResult.totalTimeMins,
        aStar: aStarResult.totalTimeMins,
        identical: dijkstraResult.totalTimeMins === aStarResult.totalTimeMins
      },
      optimalityVerified: bothOptimal,
      costDifference: Number(costDiff.toFixed(4))
    },
    theoreticalMatrix: {
      paradigm: {
        dijkstra: 'Greedy Method (Uniform-Cost Search)',
        aStar: 'Informed Search / Best-First Branch & Bound'
      },
      evaluationFunction: {
        dijkstra: 'f(n) = g(n) (Only past path cost)',
        aStar: 'f(n) = g(n) + h(n) (Past cost + estimated future cost)'
      },
      timeComplexity: {
        dijkstra: 'O((V + E) log V)',
        aStar: 'O((V + E) log V) worst-case; directed search in practice'
      },
      spaceComplexity: {
        dijkstra: 'O(V) for distances & priority queue',
        aStar: 'O(V) for Open & Closed sets'
      },
      explorationShape: {
        dijkstra: 'Concentric circles/ripples in all directions',
        aStar: 'Elliptical beam directed towards the destination'
      },
      heuristicRequirement: {
        dijkstra: 'None (Uninformed)',
        aStar: 'Requires Admissible & Consistent Heuristic (Haversine/Euclidean)'
      }
    },
    routes: {
      dijkstra: dijkstraResult,
      aStar: aStarResult
    }
  };
}

module.exports = { compareAlgorithms };
