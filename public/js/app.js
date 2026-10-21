/**
 * Tatkal Seva - DAA Project
 * File: public/js/app.js
 * 
 * Main Application Orchestrator:
 * Handles UI interactions, API calls, state management, and visual HUD updates.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // App State
  const state = {
    network: null,
    currentRoute: null,
    comparisonData: null,
    isComparing: false,
    simulationSpeed: 1,
    selectedStartId: 'AMB_BASE_1',
    selectedTargetId: 'H3',
    selectedAlgorithm: 'astar',
    selectedMetric: 'time',
    selectedHeuristic: 'haversine'
  };

  // Instantiate Map
  const mapController = new TatkalMap('map');
  mapController.init([12.965, 77.615], 12);

  // DOM Elements
  const selectStart = document.getElementById('select-start-node');
  const selectTarget = document.getElementById('select-target-node');
  const startDesc = document.getElementById('start-node-desc');
  const targetDesc = document.getElementById('target-node-desc');
  const selectMetric = document.getElementById('select-metric');
  const selectHeuristic = document.getElementById('select-heuristic');
  const groupHeuristic = document.getElementById('group-heuristic');

  const btnCalculate = document.getElementById('btn-calculate-route');
  const btnCompare = document.getElementById('btn-compare-algorithms');
  const btnResetMap = document.getElementById('btn-reset-map');
  const btnVivaGuide = document.getElementById('btn-viva-guide');
  const btnGraphInspect = document.getElementById('btn-graph-inspect');
  const btnPrintReport = document.getElementById('btn-print-report');

  // Conflict warning elements
  const conflictWarning = document.getElementById('node-conflict-warning');
  const conflictText = document.getElementById('node-conflict-text');

  // Floating Map Comparison HUD Elements
  const mapCompHud = document.getElementById('map-comparison-hud');
  const btnCloseMapComp = document.getElementById('btn-close-map-comparison');
  const compHudWinnerText = document.getElementById('comp-hud-winner-text');
  const compDijkstraDist = document.getElementById('comp-dijkstra-dist');
  const compDijkstraTime = document.getElementById('comp-dijkstra-time');
  const compDijkstraExec = document.getElementById('comp-dijkstra-exec');
  const compDijkstraNodes = document.getElementById('comp-dijkstra-nodes');
  const compDijkstraRelax = document.getElementById('comp-dijkstra-relax');
  const compAStarDist = document.getElementById('comp-astar-dist');
  const compAStarTime = document.getElementById('comp-astar-time');
  const compAStarExec = document.getElementById('comp-astar-exec');
  const compAStarNodes = document.getElementById('comp-astar-nodes');
  const compAStarRelax = document.getElementById('comp-astar-relax');
  const toggleDijkstraLayer = document.getElementById('toggle-dijkstra-layer');
  const toggleAStarLayer = document.getElementById('toggle-astar-layer');
  const btnOpenCompDetails = document.getElementById('btn-open-comp-details');

  // Step-by-Step Search Frontier Visualizer Elements
  const frontierVisualizerCard = document.getElementById('frontier-visualizer-card');
  const frontierStepCounter = document.getElementById('frontier-step-counter');
  const frontierCurrentNode = document.getElementById('frontier-current-node');
  const btnFrontierPrev = document.getElementById('btn-frontier-prev');
  const btnFrontierPlay = document.getElementById('btn-frontier-play');
  const btnFrontierNext = document.getElementById('btn-frontier-next');
  const btnFrontierReset = document.getElementById('btn-frontier-reset');

  // Frontier Visualizer State
  const frontierState = {
    trace: [],
    currentStep: 0,
    isPlaying: false,
    timer: null,
    algo: 'A*',
    pathNodes: null
  };

  // Global Loading Indicator
  const globalLoading = document.getElementById('global-loading-indicator');
  const globalLoadingText = document.getElementById('global-loading-text');

  function showLoading(msg = 'Computing optimal route...') {
    if (globalLoadingText) globalLoadingText.textContent = msg;
    if (globalLoading) globalLoading.classList.remove('hidden');
  }

  function hideLoading() {
    if (globalLoading) globalLoading.classList.add('hidden');
  }

  // Modals & Close buttons
  const modalComparison = document.getElementById('modal-comparison');
  const modalViva = document.getElementById('modal-viva');
  const modalGraphInspect = document.getElementById('modal-graph-inspect');
  const btnCloseComparison = document.getElementById('btn-close-comparison');
  const btnCloseViva = document.getElementById('btn-close-viva');
  const btnCloseGraphInspect = document.getElementById('btn-close-graph-inspect');

  // HUD Results Panel Elements
  const hudPanel = document.getElementById('route-results-panel');
  const badgeActiveAlgo = document.getElementById('badge-active-algo');
  const metricTime = document.getElementById('metric-time');
  const metricDistance = document.getElementById('metric-distance');
  const metricExecTime = document.getElementById('metric-exec-time');
  const metricExecMs = document.getElementById('metric-exec-ms');
  const metricNodesExplored = document.getElementById('metric-nodes-explored');
  const metricNodesTotal = document.getElementById('metric-nodes-total');
  const metricRelaxations = document.getElementById('metric-relaxations');
  const pathHopCount = document.getElementById('path-hop-count');
  const pathNodesList = document.getElementById('path-nodes-list');
  const togglePathDetails = document.getElementById('toggle-path-details');

  // Simulation Controls
  const btnStartSim = document.getElementById('btn-start-simulation');
  const btnStopSim = document.getElementById('btn-stop-simulation');
  const btnToggleSiren = document.getElementById('btn-toggle-siren');
  const speedButtons = document.querySelectorAll('.btn-speed');

  // Triage Elements
  const selectTriageIncident = document.getElementById('select-triage-incident');
  const btnRunTriage = document.getElementById('btn-run-triage');
  const triageResultsContainer = document.getElementById('triage-results-container');

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-pill');
  const tabViews = {
    plan: document.getElementById('view-plan'),
    triage: document.getElementById('view-triage'),
    traffic: document.getElementById('view-traffic')
  };

  // Toast
  const toast = document.getElementById('map-status-toast');
  const toastMsg = document.getElementById('toast-message');

  function showToast(message, duration = 3500) {
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  // --- INITIAL DATA LOAD ---
  async function loadNetworkData() {
    try {
      showToast('Loading urban road network and emergency stations...', 2000);
      const res = await API.getNetwork();
      if (!res.success) throw new Error('Failed to load network topology');

      state.network = res.data;

      // Populate Selects
      populateSelectOptions();

      // Render Network Map
      renderMapTopology();

      showToast('Emergency Road Network Ready. Select origin and target to calculate.', 3000);
    } catch (err) {
      console.error(err);
      showToast('Error loading network data: ' + err.message, 5000);
    }
  }

  function populateSelectOptions() {
    if (!state.network) return;

    selectStart.innerHTML = '';
    selectTarget.innerHTML = '';
    selectTriageIncident.innerHTML = '<option value="" disabled selected>Select emergency incident...</option>';

    // Group nodes by category
    const stations = state.network.nodes.filter(n => n.type === 'ambulance_station');
    const hospitals = state.network.nodes.filter(n => n.type === 'hospital');
    const emergencies = state.network.nodes.filter(n => n.type === 'emergency_point');
    const junctions = state.network.nodes.filter(n => n.type === 'junction');

    const addGroup = (selectEl, label, list) => {
      if (list.length === 0) return;
      const optgroup = document.createElement('optgroup');
      optgroup.label = label;
      list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.name} (${item.id})`;
        optgroup.appendChild(opt);
      });
      selectEl.appendChild(optgroup);
    };

    // Populate Start Dropdown (Ambulance stations first, then junctions & hospitals)
    addGroup(selectStart, 'Ambulance Stations', stations);
    addGroup(selectStart, 'Road Junctions & Flyovers', junctions);
    addGroup(selectStart, 'Hospitals & Medical Centers', hospitals);

    // Populate Target Dropdown (Hospitals first, then emergency points & junctions)
    addGroup(selectTarget, 'Hospitals & Trauma Centers', hospitals);
    addGroup(selectTarget, 'Emergency Hotspots / Accidents', emergencies);
    addGroup(selectTarget, 'Road Junctions & Flyovers', junctions);

    // Populate Triage Incident Dropdown
    emergencies.forEach(em => {
      const opt = document.createElement('option');
      opt.value = em.id;
      opt.textContent = `${em.name} (${em.description || em.id})`;
      selectTriageIncident.appendChild(opt);
    });

    // Default selections
    selectStart.value = state.selectedStartId;
    selectTarget.value = state.selectedTargetId;
    updateNodeDescriptions();
    validateNodeSelection();
  }

  function validateNodeSelection() {
    const startId = selectStart.value;
    const targetId = selectTarget.value;

    // Dynamically annotate matching option in the opposite select
    Array.from(selectTarget.options).forEach(opt => {
      if (!opt.value) return;
      if (!opt.dataset.origText) opt.dataset.origText = opt.textContent;
      if (opt.value === startId) {
        opt.disabled = true;
        opt.textContent = `${opt.dataset.origText} [Current Origin]`;
      } else {
        opt.disabled = false;
        opt.textContent = opt.dataset.origText;
      }
    });

    Array.from(selectStart.options).forEach(opt => {
      if (!opt.value) return;
      if (!opt.dataset.origText) opt.dataset.origText = opt.textContent;
      if (opt.value === targetId) {
        opt.disabled = true;
        opt.textContent = `${opt.dataset.origText} [Current Destination]`;
      } else {
        opt.disabled = false;
        opt.textContent = opt.dataset.origText;
      }
    });

    const isIdentical = Boolean(startId && targetId && startId === targetId);

    if (isIdentical) {
      btnCalculate.disabled = true;
      btnCompare.disabled = true;
      btnCalculate.setAttribute('title', 'Origin and Destination cannot be the same location.');
      btnCompare.setAttribute('title', 'Origin and Destination cannot be the same location.');

      selectStart.classList.add('input-conflict');
      selectTarget.classList.add('input-conflict');

      if (conflictWarning) {
        conflictWarning.classList.remove('hidden');
        const nodeObj = state.network ? state.network.nodes.find(n => n.id === startId) : null;
        const nodeName = nodeObj ? nodeObj.name : startId;
        if (conflictText) {
          conflictText.innerHTML = `<strong>Identical Selection Conflict:</strong> Origin and Destination are both set to <em>${nodeName} (${startId})</em>. Please choose distinct locations.`;
        }
      }
      return false;
    } else {
      btnCalculate.disabled = false;
      btnCompare.disabled = false;
      btnCalculate.removeAttribute('title');
      btnCompare.removeAttribute('title');

      selectStart.classList.remove('input-conflict');
      selectTarget.classList.remove('input-conflict');

      if (conflictWarning) {
        conflictWarning.classList.add('hidden');
      }
      return true;
    }
  }

  function updateNodeDescriptions() {
    if (!state.network) return;
    const startNode = state.network.nodes.find(n => n.id === selectStart.value);
    const targetNode = state.network.nodes.find(n => n.id === selectTarget.value);

    if (startNode) {
      startDesc.textContent = `${startNode.name} — ${startNode.description || startNode.type.toUpperCase()}`;
    }
    if (targetNode) {
      targetDesc.textContent = `${targetNode.name} — ${targetNode.description || targetNode.type.toUpperCase()}`;
    }
  }

  function renderMapTopology() {
    if (!state.network) return;

    mapController.renderNetwork(
      state.network.nodes,
      state.network.edges,
      // onNodeSelect callback
      (nodeId, type) => {
        if (type === 'origin') {
          selectStart.value = nodeId;
          state.selectedStartId = nodeId;
          updateNodeDescriptions();
          const isValid = validateNodeSelection();
          if (!isValid) {
            showToast(`⚠️ Origin set to ${nodeId}, which matches the current Destination. Select a different destination.`, 4000);
          } else {
            showToast(`Origin set to: ${nodeId}`);
          }
        } else {
          selectTarget.value = nodeId;
          state.selectedTargetId = nodeId;
          updateNodeDescriptions();
          const isValid = validateNodeSelection();
          if (!isValid) {
            showToast(`⚠️ Destination set to ${nodeId}, which matches the current Origin. Select a different destination.`, 4000);
          } else {
            showToast(`Destination set to: ${nodeId}`);
          }
        }
      },
      // onTrafficToggle callback
      async (edgeId, newFactor) => {
        try {
          showLoading('Updating road traffic conditions...');
          await API.updateTraffic({ edgeId, trafficFactor: newFactor });
          const res = await API.getNetwork();
          state.network = res.data;
          hideLoading();
          renderMapTopology();
          showToast(`Road segment updated. Traffic multiplier: ${newFactor >= 900 ? 'BLOCKED' : `${newFactor}x`}`);
          // Auto recalculate if route or comparison exists
          autoRecalculate();
        } catch (e) {
          hideLoading();
          showToast('Failed to update traffic condition');
        }
      }
    );
  }

  function autoRecalculate() {
    if (state.isComparing && state.comparisonData) {
      showToast('Dynamic road network changed! Recalculating Dijkstra vs A* comparison...', 2500);
      runComparison();
    } else if (state.currentRoute) {
      showToast('Dynamic road network changed! Recalculating optimal emergency route...', 2500);
      calculateRoute();
    }
  }

  // --- TAB SWITCHING ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      Object.keys(tabViews).forEach(tabKey => {
        if (tabKey === targetTab) {
          tabViews[tabKey].classList.add('active');
        } else {
          tabViews[tabKey].classList.remove('active');
        }
      });
    });
  });

  // --- ALGORITHM RADIO CHANGE ---
  document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.selectedAlgorithm = e.target.value;
      if (state.selectedAlgorithm === 'dijkstra') {
        groupHeuristic.style.display = 'none';
      } else {
        groupHeuristic.style.display = 'block';
      }
    });
  });

  selectStart.addEventListener('change', (e) => {
    state.selectedStartId = e.target.value;
    updateNodeDescriptions();
    const isValid = validateNodeSelection();
    if (!isValid) {
      showToast('⚠️ Origin and Destination cannot be identical. Please pick a distinct destination.', 3500);
    }
  });

  selectTarget.addEventListener('change', (e) => {
    state.selectedTargetId = e.target.value;
    updateNodeDescriptions();
    const isValid = validateNodeSelection();
    if (!isValid) {
      showToast('⚠️ Origin and Destination cannot be identical. Please pick a distinct destination.', 3500);
    }
  });

  selectMetric.addEventListener('change', (e) => {
    state.selectedMetric = e.target.value;
  });

  selectHeuristic.addEventListener('change', (e) => {
    state.selectedHeuristic = e.target.value;
  });

  // --- ROUTE CALCULATION ---
  async function calculateRoute() {
    if (!validateNodeSelection()) {
      showToast('Cannot calculate route: Origin and Destination are identical.', 3500);
      return;
    }

    const startId = selectStart.value;
    const targetId = selectTarget.value;

    if (!startId || !targetId) {
      showToast('Please select both Origin and Destination.');
      return;
    }

    if (startId === targetId) {
      showToast('Origin and Destination cannot be identical.');
      return;
    }

    try {
      showLoading(`Running ${state.selectedAlgorithm.toUpperCase()} Shortest Path Calculation...`);

      const result = await API.calculateRoute({
        startNodeId: startId,
        targetNodeId: targetId,
        algorithm: state.selectedAlgorithm,
        metric: selectMetric.value,
        heuristicType: selectHeuristic.value
      });

      hideLoading();

      if (!result.success) {
        showToast(result.message || 'No route found! Road might be impassable.', 4500);
        mapController.clearRoute();
        hudPanel.classList.add('hidden');
        setFrontierData([], state.selectedAlgorithm, null);
        return;
      }

      state.isComparing = false;
      state.currentRoute = result;
      if (mapCompHud) mapCompHud.classList.add('hidden');

      // Draw Route and Frontier on Leaflet Map
      mapController.drawRoute(result.pathNodes, result.algorithm);
      mapController.drawExploredFrontier(result.explorationTrace, result.totalNodesInGraph, result.algorithm);

      // Feed into Step-by-Step Search Frontier visualizer
      setFrontierData(result.explorationTrace, result.algorithm, result.pathNodes);

      // Update HUD
      updateHudTelemetry(result);

      showToast(`Route found via ${result.algorithm}! Distance: ${result.totalDistanceKm}km, Time: ${result.totalTimeMins} mins.`);
    } catch (err) {
      hideLoading();
      console.error(err);
      showToast('Calculation error: ' + err.message, 4500);
    }
  }

  btnCalculate.addEventListener('click', calculateRoute);

  function updateHudTelemetry(result) {
    hudPanel.classList.remove('hidden');

    badgeActiveAlgo.textContent = `${result.algorithm.toUpperCase()} SEARCH`;
    badgeActiveAlgo.className = `badge-chip ${result.algorithm === 'Dijkstra' ? 'chip-amber' : 'chip-cyan'}`;

    metricTime.textContent = result.totalTimeMins;
    metricDistance.textContent = result.totalDistanceKm;
    metricExecTime.textContent = result.executionTimeMicro;
    metricExecMs.textContent = `${result.executionTimeMs} ms`;
    metricNodesExplored.textContent = result.nodesExplored;
    metricNodesTotal.textContent = `/ ${result.totalNodesInGraph}`;
    metricRelaxations.textContent = `${result.edgeRelaxations} edge relaxations`;

    pathHopCount.textContent = result.pathNodeIds.length;
    pathNodesList.innerHTML = '';

    result.pathNodes.forEach((node, idx) => {
      const hopEl = document.createElement('div');
      hopEl.className = 'hop-item';
      hopEl.innerHTML = `
        <span class="hop-index">${idx + 1}.</span>
        <span class="hop-arrow"><i class="fa-solid fa-arrow-right"></i></span>
        <span class="hop-name">${node.name} (${node.id})</span>
      `;
      pathNodesList.appendChild(hopEl);
    });
  }

  // Toggle path details accordion
  togglePathDetails.addEventListener('click', () => {
    if (pathNodesList.style.display === 'none') {
      pathNodesList.style.display = 'flex';
      togglePathDetails.querySelector('.toggle-icon').className = 'fa-solid fa-chevron-up toggle-icon';
    } else {
      pathNodesList.style.display = 'none';
      togglePathDetails.querySelector('.toggle-icon').className = 'fa-solid fa-chevron-down toggle-icon';
    }
  });

  // --- COMPARE ALGORITHMS ---
  async function runComparison() {
    if (!validateNodeSelection()) {
      showToast('Cannot compare algorithms: Origin and Destination are identical.', 3500);
      return;
    }

    const startId = selectStart.value;
    const targetId = selectTarget.value;

    if (!startId || !targetId) {
      showToast('Select distinct start and destination nodes first.');
      return;
    }

    try {
      showLoading('Benchmarking Dijkstra vs. A* Search...');
      const comparisonData = await API.compareAlgorithms({
        startNodeId: startId,
        targetNodeId: targetId,
        metric: selectMetric.value,
        heuristicType: selectHeuristic.value
      });

      hideLoading();

      if (!comparisonData.success) {
        showToast('Comparison failed: ' + comparisonData.message);
        return;
      }

      state.isComparing = true;
      state.comparisonData = comparisonData;
      const { dijkstra, aStar } = comparisonData.routes;

      // 1. Draw both routes simultaneously on the Leaflet map with distinct styles
      mapController.drawComparisonRoutes(dijkstra, aStar);

      // 2. Feed A* frontier trace into the visualizer
      setFrontierData(aStar.explorationTrace, 'A*', aStar.pathNodes);

      // 1. Draw both routes simultaneously on the Leaflet map with distinct styles
      mapController.drawComparisonRoutes(dijkstra, aStar);

      // 2. Populate and display the Floating Map Comparison HUD & Legend
      if (compDijkstraDist) compDijkstraDist.textContent = dijkstra.totalDistanceKm;
      if (compDijkstraTime) compDijkstraTime.textContent = dijkstra.totalTimeMins;
      if (compDijkstraExec) compDijkstraExec.textContent = dijkstra.executionTimeMicro;
      if (compDijkstraNodes) compDijkstraNodes.textContent = dijkstra.nodesExplored;
      if (compDijkstraRelax) compDijkstraRelax.textContent = dijkstra.edgeRelaxations;

      if (compAStarDist) compAStarDist.textContent = aStar.totalDistanceKm;
      if (compAStarTime) compAStarTime.textContent = aStar.totalTimeMins;
      if (compAStarExec) compAStarExec.textContent = aStar.executionTimeMicro;
      if (compAStarNodes) compAStarNodes.textContent = aStar.nodesExplored;
      if (compAStarRelax) compAStarRelax.textContent = aStar.edgeRelaxations;

      const pct = comparisonData.comparison.nodesExplored.percentageReduction;
      if (compHudWinnerText) {
        if (pct > 0) {
          compHudWinnerText.textContent = `A* explored ${pct}% fewer nodes (${aStar.nodesExplored} vs ${dijkstra.nodesExplored} nodes)`;
        } else {
          compHudWinnerText.textContent = `Both algorithms evaluated equal node spaces (${dijkstra.nodesExplored} nodes)`;
        }
      }

      if (toggleDijkstraLayer) toggleDijkstraLayer.checked = true;
      if (toggleAStarLayer) toggleAStarLayer.checked = true;
      if (mapCompHud) mapCompHud.classList.remove('hidden');

      // 3. Update Left Sidebar Route Telemetry HUD
      hudPanel.classList.remove('hidden');
      badgeActiveAlgo.textContent = 'SIMULTANEOUS COMPARISON';
      badgeActiveAlgo.className = 'badge-chip chip-cyan';

      metricTime.textContent = `${aStar.totalTimeMins}`;
      metricDistance.textContent = `${aStar.totalDistanceKm}`;
      metricExecTime.textContent = `${aStar.executionTimeMicro}`;
      metricExecMs.textContent = `Dijkstra: ${dijkstra.executionTimeMicro}µs | A*: ${aStar.executionTimeMicro}µs`;
      metricNodesExplored.textContent = `${aStar.nodesExplored}`;
      metricNodesTotal.textContent = `(vs Dijkstra ${dijkstra.nodesExplored})`;
      metricRelaxations.textContent = `A*: ${aStar.edgeRelaxations} | Dijkstra: ${dijkstra.edgeRelaxations} relaxations`;

      pathHopCount.textContent = aStar.pathNodeIds.length;
      pathNodesList.innerHTML = '';

      aStar.pathNodes.forEach((node, idx) => {
        const hopEl = document.createElement('div');
        hopEl.className = 'hop-item';
        const dHopNode = dijkstra.pathNodes[idx];
        const isIdenticalHop = dHopNode && dHopNode.id === node.id;
        hopEl.innerHTML = `
          <span class="hop-index">${idx + 1}.</span>
          <span class="hop-arrow"><i class="fa-solid fa-arrow-right"></i></span>
          <span class="hop-name">${node.name} (${node.id}) ${isIdenticalHop ? '<span style="color:#10b981;font-size:10px;">[Shared]</span>' : '<span style="color:#f59e0b;font-size:10px;">[Diverged]</span>'}</span>
        `;
        pathNodesList.appendChild(hopEl);
      });

      showToast('Simultaneous comparison active! Solid Amber = Dijkstra | Dashed Cyan = A*', 4000);
    } catch (e) {
      console.error(e);
      showToast('Comparison error: ' + e.message);
    }
  }

  btnCompare.addEventListener('click', runComparison);

  // --- COMPARISON HUD CONTROLS ---
  if (toggleDijkstraLayer) {
    toggleDijkstraLayer.addEventListener('change', (e) => {
      mapController.toggleComparisonLayer('dijkstra', e.target.checked);
    });
  }

  if (toggleAStarLayer) {
    toggleAStarLayer.addEventListener('change', (e) => {
      mapController.toggleComparisonLayer('aStar', e.target.checked);
    });
  }

  if (btnCloseMapComp) {
    btnCloseMapComp.addEventListener('click', () => {
      if (mapCompHud) mapCompHud.classList.add('hidden');
      mapController.clearRoute();
      hudPanel.classList.add('hidden');
      showToast('Comparison view closed.');
    });
  }

  if (btnOpenCompDetails) {
    btnOpenCompDetails.addEventListener('click', () => {
      if (state.comparisonData) {
        VivaGuide.renderComparisonModal(state.comparisonData);
        modalComparison.classList.remove('hidden');
      }
    });
  }

  // --- HOSPITAL TRIAGE DISPATCH ---
  btnRunTriage.addEventListener('click', async () => {
    const incidentId = selectTriageIncident.value;
    if (!incidentId) {
      showToast('Please select an accident/incident hotspot first.');
      return;
    }

    try {
      showLoading('Evaluating regional hospitals, travel times & ICU beds...');
      const res = await API.findNearestHospital({
        patientNodeId: incidentId,
        metric: 'time'
      });
      hideLoading();

      if (!res.success || !res.recommendedHospital) {
        showToast('No reachable hospital found! Check for road blockages.', 4000);
        return;
      }

      triageResultsContainer.classList.remove('hidden');
      const rec = res.recommendedHospital;

      // ICU badge logic
      const getIcuBadge = (beds) => {
        if (beds >= 5) return `<span class="badge-icu-ready"><i class="fa-solid fa-circle-check"></i> ${beds} ICU Beds Ready</span>`;
        if (beds > 0) return `<span class="badge-icu-limited"><i class="fa-solid fa-triangle-exclamation"></i> Limited: ${beds} Beds</span>`;
        return `<span class="badge-icu-full"><i class="fa-solid fa-circle-xmark"></i> 0 ICU Beds (Full)</span>`;
      };

      let html = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1.5px solid #10b981; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #10b981; font-size: 13px;"><i class="fa-solid fa-star"></i> OPTIMAL EMERGENCY TRAUMA CENTER</strong>
            ${getIcuBadge(rec.icuBedsAvailable)}
          </div>
          <h4 style="font-family: 'Outfit'; font-size: 15px; margin: 4px 0 2px 0; color: #f1f5f9;">${rec.hospital.name}</h4>
          <p style="font-size: 11.5px; color: #94a3b8; margin: 0 0 8px 0;">${rec.hospital.description || 'Level-1 Emergency Trauma & Surgical Care'}</p>
          <div style="display: flex; gap: 16px; font-family: 'JetBrains Mono'; font-size: 12px; margin-bottom: 8px;">
            <span><i class="fa-solid fa-clock text-amber"></i> ${rec.timeMins} mins</span>
            <span><i class="fa-solid fa-route text-cyan"></i> ${rec.distanceKm} km</span>
            <span style="color: #10b981;"><i class="fa-solid fa-shield-halved"></i> Green Corridor</span>
          </div>
          <button id="btn-dispatch-to-rec" class="btn btn-primary btn-block" style="background: #10b981; border: none; font-size: 12px; padding: 8px;">
            <i class="fa-solid fa-truck-fast"></i> Instant Dispatch Ambulance to this Hospital
          </button>
        </div>

        <div style="font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Other Evaluated Hospitals in Network:</div>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto;">
      `;

      res.allHospitalOptions.slice(1).forEach((opt) => {
        html += `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 12px; color: #e2e8f0;">${opt.hospital.name}</div>
              <div style="font-size: 11px; color: #64748b; font-family: 'JetBrains Mono';">${opt.distanceKm} km &bull; ${opt.timeMins} mins</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${getIcuBadge(opt.icuBedsAvailable)}
              <button class="btn btn-sm btn-outline btn-dispatch-alt" data-target="${opt.hospital.id}" style="font-size: 10px; padding: 3px 6px;">
                Dispatch
              </button>
            </div>
          </div>
        `;
      });

      html += '</div>';
      triageResultsContainer.innerHTML = html;

      // Handle primary recommended dispatch click
      document.getElementById('btn-dispatch-to-rec').onclick = async () => {
        selectStart.value = incidentId;
        selectTarget.value = rec.hospital.id;
        state.selectedStartId = incidentId;
        state.selectedTargetId = rec.hospital.id;
        updateNodeDescriptions();
        validateNodeSelection();
        // Switch to plan tab
        tabButtons[0].click();
        showToast(`Green Corridor dispatched towards ${rec.hospital.name}!`, 3500);
        await calculateRoute();
        // Auto trigger ambulance simulation
        if (state.currentRoute && state.currentRoute.pathNodes) {
          btnStartSim.click();
        }
      };

      // Handle alternative hospital dispatch buttons
      document.querySelectorAll('.btn-dispatch-alt').forEach(btn => {
        btn.addEventListener('click', async () => {
          const targetHospId = btn.getAttribute('data-target');
          selectStart.value = incidentId;
          selectTarget.value = targetHospId;
          state.selectedStartId = incidentId;
          state.selectedTargetId = targetHospId;
          updateNodeDescriptions();
          validateNodeSelection();
          tabButtons[0].click();
          showToast(`Alternative route dispatched towards ${targetHospId}!`, 3500);
          await calculateRoute();
          if (state.currentRoute && state.currentRoute.pathNodes) {
            btnStartSim.click();
          }
        });
      });
    } catch (err) {
      hideLoading();
      showToast('Triage calculation error: ' + err.message);
    }
  });

  // --- TRAFFIC SCENARIOS ---
  document.querySelectorAll('.btn-scenario').forEach(btn => {
    btn.addEventListener('click', async () => {
      const scenario = btn.getAttribute('data-scenario');
      try {
        showLoading('Applying dynamic traffic conditions...');
        const res = await API.applyTrafficScenario(scenario);
        const netRes = await API.getNetwork();
        state.network = netRes.data;
        hideLoading();
        renderMapTopology();
        showToast(res.description, 4000);
        // Automatically recalculate active single route or comparison
        autoRecalculate();
      } catch (err) {
        hideLoading();
        showToast('Error applying scenario: ' + err.message);
      }
    });
  });

  // --- STEP-BY-STEP SEARCH FRONTIER CONTROLLER ---
  function setFrontierData(trace, algo, pathNodes) {
    stopFrontierPlayback();
    frontierState.trace = trace || [];
    frontierState.algo = algo || 'A*';
    frontierState.pathNodes = pathNodes || null;
    frontierState.currentStep = frontierState.trace.length;
    updateFrontierUI();
  }

  function updateFrontierUI() {
    const total = frontierState.trace.length;
    const step = frontierState.currentStep;

    if (frontierStepCounter) {
      frontierStepCounter.textContent = `Step ${step} / ${total}`;
    }

    if (total === 0) {
      if (frontierCurrentNode) {
        frontierCurrentNode.innerHTML = '<span>No search trace active. Compute a route or comparison to inspect.</span>';
      }
      return;
    }

    if (step === 0) {
      if (frontierCurrentNode) {
        frontierCurrentNode.innerHTML = `<span style="color:#94a3b8;"><i class="fa-solid fa-play text-cyan"></i> Search reset to origin. Click <strong>Play Search</strong> or <strong>Next Step</strong> to explore.</span>`;
      }
      mapController.renderFrontierStep(frontierState.trace, 0, frontierState.algo, frontierState.pathNodes);
    } else {
      const stepData = frontierState.trace[step - 1];
      if (frontierCurrentNode && stepData) {
        const isGoal = (step === total);
        if (isGoal) {
          frontierCurrentNode.innerHTML = `<strong style="color:#10b981;"><i class="fa-solid fa-flag-checkered"></i> Goal Reached!</strong> ${frontierState.algo} explored ${total} nodes to find the optimal path.`;
        } else if (frontierState.algo.toLowerCase().includes('dijkstra')) {
          frontierCurrentNode.innerHTML = `<span><strong>Step ${step}:</strong> Exploring <strong>${stepData.nodeName}</strong> (${stepData.nodeId}) &bull; <strong style="color:#fbbf24;">g(n) = ${stepData.currentCost}</strong></span>`;
        } else {
          frontierCurrentNode.innerHTML = `<span><strong>Step ${step}:</strong> Exploring <strong>${stepData.nodeName}</strong> (${stepData.nodeId}) &bull; <span style="color:#38bdf8;">g=${stepData.gScore}, h=${stepData.hScore} &rarr; <strong>f(n)=${stepData.fScore}</strong></span></span>`;
        }
      }
      mapController.renderFrontierStep(frontierState.trace, step, frontierState.algo, frontierState.pathNodes);
    }
  }

  function stopFrontierPlayback() {
    frontierState.isPlaying = false;
    if (frontierState.timer) {
      clearInterval(frontierState.timer);
      frontierState.timer = null;
    }
    if (btnFrontierPlay) {
      btnFrontierPlay.innerHTML = '<i class="fa-solid fa-play"></i> Play Search';
      btnFrontierPlay.className = 'btn btn-sm btn-accent';
    }
  }

  function startFrontierPlayback() {
    if (frontierState.trace.length === 0) {
      showToast('No exploration trace to play. Compute a route first.');
      return;
    }

    if (frontierState.currentStep >= frontierState.trace.length) {
      frontierState.currentStep = 0;
    }

    frontierState.isPlaying = true;
    if (btnFrontierPlay) {
      btnFrontierPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
      btnFrontierPlay.className = 'btn btn-sm btn-outline';
    }

    frontierState.timer = setInterval(() => {
      if (frontierState.currentStep < frontierState.trace.length) {
        frontierState.currentStep++;
        updateFrontierUI();
      } else {
        stopFrontierPlayback();
        showToast(`Search exploration complete! Explored ${frontierState.trace.length} nodes via ${frontierState.algo}.`, 3500);
      }
    }, 400);
  }

  if (btnFrontierPlay) {
    btnFrontierPlay.addEventListener('click', () => {
      if (frontierState.isPlaying) {
        stopFrontierPlayback();
      } else {
        startFrontierPlayback();
      }
    });
  }

  if (btnFrontierNext) {
    btnFrontierNext.addEventListener('click', () => {
      stopFrontierPlayback();
      if (frontierState.currentStep < frontierState.trace.length) {
        frontierState.currentStep++;
        updateFrontierUI();
      }
    });
  }

  if (btnFrontierPrev) {
    btnFrontierPrev.addEventListener('click', () => {
      stopFrontierPlayback();
      if (frontierState.currentStep > 0) {
        frontierState.currentStep--;
        updateFrontierUI();
      }
    });
  }

  if (btnFrontierReset) {
    btnFrontierReset.addEventListener('click', () => {
      stopFrontierPlayback();
      frontierState.currentStep = 0;
      updateFrontierUI();
      showToast('Search wave reset to origin.');
    });
  }

  // --- PRINTABLE BENCHMARK REPORT HANDLER ---
  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', async () => {
      showLoading('Generating DAA Viva Benchmark Report...');
      try {
        if (state.comparisonData) {
          hideLoading();
          VivaGuide.renderPrintableReport(null, state.comparisonData);
        } else if (state.currentRoute) {
          hideLoading();
          VivaGuide.renderPrintableReport(state.currentRoute, null);
        } else {
          // Run comparison on current selection first
          const compData = await API.compareAlgorithms({
            startNodeId: state.selectedStartId || 'AMB_BASE_1',
            targetNodeId: state.selectedTargetId || 'H3',
            metric: selectMetric.value || 'time',
            heuristicType: selectHeuristic.value || 'haversine'
          });
          state.comparisonData = compData;
          hideLoading();
          VivaGuide.renderPrintableReport(null, compData);
        }
      } catch (err) {
        hideLoading();
        showToast('Error preparing report: ' + err.message);
      }
    });
  }

  // --- SIMULATION RUNNER ---
  btnStartSim.addEventListener('click', () => {
    if (!state.currentRoute || !state.currentRoute.pathNodes) {
      showToast('Please calculate a route before running the simulation.');
      return;
    }

    btnStartSim.classList.add('hidden');
    btnStopSim.classList.remove('hidden');

    showToast('Emergency Ambulance in Transit! Simulation started.');
    mapController.startSimulation(
      state.currentRoute.pathNodes,
      state.simulationSpeed,
      (hop, total, node) => {
        showToast(`Ambulance reached hop ${hop}/${total}: ${node.name}`, 1200);
      },
      () => {
        btnStartSim.classList.remove('hidden');
        btnStopSim.classList.add('hidden');
        showToast('Ambulance successfully reached the destination emergency room!', 5000);
      }
    );
  });

  btnStopSim.addEventListener('click', () => {
    mapController.stopSimulation();
    btnStartSim.classList.remove('hidden');
    btnStopSim.classList.add('hidden');
    showToast('Simulation aborted.');
  });

  btnToggleSiren.addEventListener('click', () => {
    const isPlaying = mapController.toggleSiren();
    if (isPlaying) {
      btnToggleSiren.style.background = 'rgba(239, 68, 68, 0.4)';
      showToast('Siren Alert Active (Sound on)');
    } else {
      btnToggleSiren.style.background = '';
      showToast('Siren Muted');
    }
  });

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.simulationSpeed = parseFloat(btn.getAttribute('data-speed'));
      mapController.simSpeed = state.simulationSpeed;
    });
  });

  // --- MODAL CONTROLS ---
  btnVivaGuide.addEventListener('click', () => {
    VivaGuide.renderVivaGuide();
    modalViva.classList.remove('hidden');
  });

  btnGraphInspect.addEventListener('click', () => {
    if (state.network) {
      VivaGuide.renderGraphInspect(state.network);
      modalGraphInspect.classList.remove('hidden');
    }
  });

  btnResetMap.addEventListener('click', () => {
    mapController.clearRoute();
    stopFrontierPlayback();
    frontierState.trace = [];
    frontierState.currentStep = 0;
    updateFrontierUI();
    btnStartSim.classList.remove('hidden');
    btnStopSim.classList.add('hidden');
    hudPanel.classList.add('hidden');
    if (mapCompHud) mapCompHud.classList.add('hidden');
    state.currentRoute = null;
    state.comparisonData = null;
    state.isComparing = false;
    validateNodeSelection();
    showToast('Map route cleared.');
  });

  btnCloseComparison.onclick = () => modalComparison.classList.add('hidden');
  btnCloseViva.onclick = () => modalViva.classList.add('hidden');
  btnCloseGraphInspect.onclick = () => modalGraphInspect.classList.add('hidden');

  // Close modals on backdrop click
  [modalComparison, modalViva, modalGraphInspect].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Keyboard shortcut ESC to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalComparison.classList.add('hidden');
      modalViva.classList.add('hidden');
      modalGraphInspect.classList.add('hidden');
    }
  });

  // Start initialization
  loadNetworkData();
});
