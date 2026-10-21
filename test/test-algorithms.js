/**
 * Tatkal Seva - DAA Project
 * File: test/test-algorithms.js
 * 
 * Standalone algorithm verification & CLI demonstration script.
 * Can be run by students during viva to show terminal-based algorithm execution!
 */

const db = require('../server/database/db');
const Graph = require('../server/algorithms/graph');
const { runDijkstra } = require('../server/algorithms/dijkstra');
const { runAStar } = require('../server/algorithms/astar');
const { compareAlgorithms } = require('../server/algorithms/comparator');

function buildGraphFromDatabase() {
  const graph = new Graph();
  const nodes = db.getAllNodes();
  const edges = db.getAllEdges();

  for (const node of nodes) {
    graph.addNode(node);
  }

  for (const edge of edges) {
    graph.addEdge(edge);
  }

  return graph;
}

function runCliDemo() {
  console.log('===============================================================');
  console.log('   TATKAL SEVA - EMERGENCY AMBULANCE DAA ALGORITHM SUITE      ');
  console.log('===============================================================');

  const graph = buildGraphFromDatabase();
  console.log(`Loaded Graph with |V| = ${graph.getAllNodes().length} nodes, |E| = ${db.getAllEdges().length} road edges.`);

  const startId = 'AMB_BASE_1'; // South Metro Base (Jayanagar)
  const targetId = 'H3'; // Manipal Hospital (HAL Airport Road)

  console.log(`\nScenario: Ambulance at [${graph.getNode(startId).name}] dispatched to [${graph.getNode(targetId).name}]`);
  console.log('---------------------------------------------------------------');

  // 1. Run Dijkstra
  console.log('\n[1] RUNNING DIJKSTRA\'S ALGORITHM (Greedy / Uniform-Cost):');
  const dResult = runDijkstra(graph, startId, targetId, 'time');
  console.log(`- Path Found: ${dResult.pathNodeIds.join(' -> ')}`);
  console.log(`- Total Distance: ${dResult.totalDistanceKm} km`);
  console.log(`- Estimated Time: ${dResult.totalTimeMins} minutes`);
  console.log(`- Nodes Explored: ${dResult.nodesExplored} / ${dResult.totalNodesInGraph}`);
  console.log(`- Edge Relaxations: ${dResult.edgeRelaxations}`);
  console.log(`- Heap Comparisons: ${dResult.heapComparisons}`);
  console.log(`- Execution Time: ${dResult.executionTimeMicro} µs (${dResult.executionTimeMs} ms)`);
  console.log(`- Time Complexity: ${dResult.complexity.time}`);

  // 2. Run A*
  console.log('\n[2] RUNNING A* ALGORITHM (Heuristic / Best-First Search):');
  const aResult = runAStar(graph, startId, targetId, 'time', 'haversine');
  console.log(`- Path Found: ${aResult.pathNodeIds.join(' -> ')}`);
  console.log(`- Total Distance: ${aResult.totalDistanceKm} km`);
  console.log(`- Estimated Time: ${aResult.totalTimeMins} minutes`);
  console.log(`- Nodes Explored: ${aResult.nodesExplored} / ${aResult.totalNodesInGraph}`);
  console.log(`- Edge Relaxations: ${aResult.edgeRelaxations}`);
  console.log(`- Heap Comparisons: ${aResult.heapComparisons}`);
  console.log(`- Execution Time: ${aResult.executionTimeMicro} µs (${aResult.executionTimeMs} ms)`);
  console.log(`- Heuristic: Haversine Admissible Distance`);

  // 3. Comparison Summary
  console.log('\n[3] DAA ALGORITHM COMPARATIVE METRICS:');
  const comparison = compareAlgorithms(graph, startId, targetId, 'time', 'haversine');
  console.log(`- Search Space Reduction by A*: ${comparison.comparison.nodesExplored.percentageReduction}% fewer nodes explored!`);
  console.log(`- Nodes Explored: Dijkstra (${comparison.comparison.nodesExplored.dijkstra}) vs A* (${comparison.comparison.nodesExplored.aStar})`);
  console.log(`- Optimality Verified: ${comparison.comparison.optimalityVerified ? 'YES (Both found identical optimal cost)' : 'NO'}`);
  console.log('===============================================================\n');
}

if (require.main === module) {
  runCliDemo();
}

module.exports = { buildGraphFromDatabase, runCliDemo };
