/**
 * Tatkal Seva - DAA Project
 * File: public/js/map.js
 * 
 * Leaflet Map Controller:
 * Handles cartographic visualization, road network topology layers,
 * shortest-path polyline rendering, and animated ambulance simulation.
 */

class TatkalMap {
  constructor(containerId = 'map') {
    this.containerId = containerId;
    this.map = null;
    this.nodeMarkers = new Map(); // nodeId -> Leaflet Marker
    this.edgePolylines = new Map(); // edgeId -> Leaflet Polyline
    this.routePolyline = null;
    this.routeGlowPolyline = null;
    this.exploredCirclesLayer = L.layerGroup();
    this.simAmbulanceMarker = null;
    this.isSimulating = false;
    this.simulationTimeout = null;
    this.simSpeed = 1;
    this.comparisonLayers = null;

    // Web Audio Synthesized Siren
    this.audioCtx = null;
    this.sirenOscillator = null;
    this.sirenGain = null;
    this.sirenInterval = null;
    this.isSirenOn = false;
  }

  /**
   * Initialize Leaflet map with high-contrast dark theme
   */
  init(center = [12.965, 77.615], zoom = 12) {
    this.map = L.map(this.containerId, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    // Clean Positron light tile layer for professional map look
    const lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    });

    // Fallback standard OpenStreetMap tile layer if CartoDB is unavailable
    const osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    lightTileLayer.addTo(this.map);
    this.exploredCirclesLayer.addTo(this.map);

    // Error fallback for tile layer
    lightTileLayer.on('tileerror', () => {
      if (!this.map.hasLayer(osmTileLayer)) {
        osmTileLayer.addTo(this.map);
      }
    });

    return this.map;
  }

  /**
   * Helper to create custom HTML markers
   */
  createCustomIcon(node) {
    let pinClass = 'pin-junction';
    let iconHtml = '';

    if (node.type === 'hospital') {
      pinClass = 'pin-hospital';
      iconHtml = '<i class="fa-solid fa-plus"></i>';
    } else if (node.type === 'ambulance_station') {
      pinClass = 'pin-ambulance';
      iconHtml = '<i class="fa-solid fa-truck-medical"></i>';
    } else if (node.type === 'emergency_point') {
      pinClass = 'pin-emergency';
      iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
    }

    const html = `
      <div class="custom-leaflet-marker">
        <div class="marker-inner-pin ${pinClass}" title="${node.name}">
          ${iconHtml}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'empty-leaflet-divicon',
      html: html,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });
  }

  /**
   * Render nodes and road edges on the map
   */
  renderNetwork(nodes, edges, onNodeSelect, onTrafficToggle) {
    // 1. Render Edges (Road Segments)
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Clear previous
    this.edgePolylines.forEach(p => this.map.removeLayer(p));
    this.edgePolylines.clear();

    edges.forEach(edge => {
      const u = nodeMap.get(edge.source);
      const v = nodeMap.get(edge.target);
      if (!u || !v) return;

      const isBlocked = edge.traffic_factor >= 900;
      let color = '#10b981'; // Green (clear)
      let dashArray = null;
      let weight = 3.5;
      let opacity = 0.65;

      if (isBlocked) {
        color = '#ef4444'; // Red (blocked)
        dashArray = '5, 8';
        weight = 4;
        opacity = 0.9;
      } else if (edge.traffic_factor > 1.2) {
        color = '#f59e0b'; // Amber (heavy)
        weight = 4;
        opacity = 0.8;
      }

      const polyline = L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
        color,
        weight,
        opacity,
        dashArray,
        lineCap: 'round'
      }).addTo(this.map);

      // Popup for interactive traffic editing
      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #111;">
          <strong>${edge.road_name}</strong><br>
          <span>Length: ${edge.distance_km} km</span><br>
          <span>Speed Limit: ${edge.speed_limit_kmh} km/h</span><br>
          <span>Current Traffic: <strong>${isBlocked ? 'BLOCKED' : `${edge.traffic_factor}x`}</strong></span><br>
          <div style="margin-top: 8px;">
            <button id="toggle-edge-${edge.id}" style="background: ${isBlocked ? '#10b981' : '#ef4444'}; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
              ${isBlocked ? 'Unblock Road' : 'Simulate Road Block'}
            </button>
          </div>
        </div>
      `;

      polyline.bindPopup(popupHtml);

      polyline.on('popupopen', () => {
        const btn = document.getElementById(`toggle-edge-${edge.id}`);
        if (btn && onTrafficToggle) {
          btn.onclick = () => {
            const nextFactor = isBlocked ? 1.0 : 999.0;
            onTrafficToggle(edge.id, nextFactor);
            this.map.closePopup();
          };
        }
      });

      this.edgePolylines.set(edge.id, polyline);
    });

    // 2. Render Nodes
    this.nodeMarkers.forEach(m => this.map.removeLayer(m));
    this.nodeMarkers.clear();

    nodes.forEach(node => {
      const icon = this.createCustomIcon(node);
      const marker = L.marker([node.lat, node.lng], { icon }).addTo(this.map);

      let extraInfo = '';
      if (node.type === 'hospital') {
        extraInfo = `<div style="color: #ef4444; font-weight: bold; margin-top: 4px;"><i class="fa-solid fa-bed-pulse"></i> ICU Beds Available: ${node.capacity}</div>`;
      } else if (node.type === 'ambulance_station') {
        extraInfo = `<div style="color: #f59e0b; font-weight: bold; margin-top: 4px;"><i class="fa-solid fa-truck-medical"></i> Ambulances Stationed: ${node.capacity}</div>`;
      }

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #111;">
          <strong style="font-size: 13px;">${node.name}</strong> (${node.id})<br>
          <span style="color: #555;">Type: ${node.type.replace('_', ' ').toUpperCase()}</span><br>
          <p style="margin: 4px 0; color: #444;">${node.description || ''}</p>
          ${extraInfo}
          <div style="margin-top: 8px; display: flex; gap: 6px;">
            <button id="set-origin-${node.id}" style="background: #f59e0b; color: #000; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">Set as Start [A]</button>
            <button id="set-target-${node.id}" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">Set as Target [B]</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btnOrigin = document.getElementById(`set-origin-${node.id}`);
        const btnTarget = document.getElementById(`set-target-${node.id}`);
        if (btnOrigin && onNodeSelect) {
          btnOrigin.onclick = () => {
            onNodeSelect(node.id, 'origin');
            this.map.closePopup();
          };
        }
        if (btnTarget && onNodeSelect) {
          btnTarget.onclick = () => {
            onNodeSelect(node.id, 'target');
            this.map.closePopup();
          };
        }
      });

      this.nodeMarkers.set(node.id, marker);
    });
  }

  /**
   * Display calculated route with clean, high-contrast polyline
   */
  drawRoute(pathNodes, algorithmName = 'A*') {
    this.clearRoute();

    if (!pathNodes || pathNodes.length < 2) return;

    const latLngs = pathNodes.map(n => [n.lat, n.lng]);
    const isDijkstra = algorithmName.toLowerCase().includes('dijkstra');
    const routeColor = isDijkstra ? '#d97706' : '#2563eb';

    // White outline for crisp separation from map roads
    this.routeGlowPolyline = L.polyline(latLngs, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    // Primary solid route line
    this.routePolyline = L.polyline(latLngs, {
      color: routeColor,
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    // Fit map bounds smoothly
    this.map.fitBounds(this.routePolyline.getBounds(), {
      padding: [50, 50],
      maxZoom: 14,
      animate: true
    });
  }

  /**
   * Display both Dijkstra and A* routes simultaneously with clear, distinct styles:
   * - Dijkstra: Solid Amber Line (6px)
   * - A* Search: Dashed Royal Blue Line (3.5px)
   * Both remain perfectly readable when overlapping.
   */
  drawComparisonRoutes(dijkstraRoute, aStarRoute) {
    this.clearRoute();

    if (!dijkstraRoute || !aStarRoute) return;

    const dLatLngs = (dijkstraRoute.pathNodes || []).map(n => [n.lat, n.lng]);
    const aLatLngs = (aStarRoute.pathNodes || []).map(n => [n.lat, n.lng]);

    this.comparisonLayers = {
      dijkstra: L.layerGroup(),
      aStar: L.layerGroup()
    };

    // 1. DIJKSTRA ROUTE: Solid Warm Amber
    const dijkstraHalo = L.polyline(dLatLngs, {
      color: '#ffffff',
      weight: 9,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    });

    const dijkstraCore = L.polyline(dLatLngs, {
      color: '#d97706', // Amber 600
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });

    const dijkstraTooltip = `
      <div style="font-family: 'Inter', sans-serif; font-size: 11px; line-height: 1.4; color: #0f172a;">
        <strong style="color: #d97706;"><i class="fa-solid fa-route"></i> Dijkstra's Route (Greedy)</strong><br>
        <span>Distance: <strong>${dijkstraRoute.totalDistanceKm} km</strong></span><br>
        <span>Travel Time: <strong>${dijkstraRoute.totalTimeMins} mins</strong></span><br>
        <span>Visited Nodes: <strong>${dijkstraRoute.nodesExplored}</strong></span><br>
        <span>Edge Relaxations: <strong>${dijkstraRoute.edgeRelaxations}</strong></span><br>
        <span>Execution Time: <strong>${dijkstraRoute.executionTimeMicro} µs</strong></span>
      </div>
    `;

    dijkstraCore.bindTooltip(dijkstraTooltip, { sticky: true, opacity: 0.95 });

    this.comparisonLayers.dijkstra.addLayer(dijkstraHalo);
    this.comparisonLayers.dijkstra.addLayer(dijkstraCore);

    // 2. A* SEARCH ROUTE: Dashed Royal Blue
    const aStarOutline = L.polyline(aLatLngs, {
      color: '#ffffff',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    });

    const aStarCore = L.polyline(aLatLngs, {
      color: '#2563eb', // Royal Blue
      weight: 3.5,
      opacity: 1.0,
      dashArray: '6, 6',
      lineCap: 'round',
      lineJoin: 'round'
    });

    const aStarTooltip = `
      <div style="font-family: 'Inter', sans-serif; font-size: 11px; line-height: 1.4; color: #0f172a;">
        <strong style="color: #2563eb;"><i class="fa-solid fa-bolt"></i> A* Search Route (Heuristic)</strong><br>
        <span>Distance: <strong>${aStarRoute.totalDistanceKm} km</strong></span><br>
        <span>Travel Time: <strong>${aStarRoute.totalTimeMins} mins</strong></span><br>
        <span>Visited Nodes: <strong>${aStarRoute.nodesExplored}</strong></span><br>
        <span>Edge Relaxations: <strong>${aStarRoute.edgeRelaxations}</strong></span><br>
        <span>Execution Time: <strong>${aStarRoute.executionTimeMicro} µs</strong></span>
      </div>
    `;

    aStarCore.bindTooltip(aStarTooltip, { sticky: true, opacity: 0.95 });

    this.comparisonLayers.aStar.addLayer(aStarOutline);
    this.comparisonLayers.aStar.addLayer(aStarCore);

    // Add both layers to map
    this.comparisonLayers.dijkstra.addTo(this.map);
    this.comparisonLayers.aStar.addTo(this.map);

    // Fit map bounds smoothly
    const allCoords = dLatLngs.concat(aLatLngs);
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      this.map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true
      });
    }
  }

  /**
   * Toggle visibility of individual comparison algorithm layer
   */
  toggleComparisonLayer(algorithm, isVisible) {
    if (!this.comparisonLayers) return;
    const layer = this.comparisonLayers[algorithm];
    if (!layer) return;

    if (isVisible) {
      if (!this.map.hasLayer(layer)) {
        this.map.addLayer(layer);
      }
    } else {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    }
  }

  /**
   * Helper to draw route polyline without clearing the exploration frontier layer
   */
  drawPathOnly(pathNodes, algorithmName = 'A*') {
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    if (this.routeGlowPolyline) {
      this.map.removeLayer(this.routeGlowPolyline);
      this.routeGlowPolyline = null;
    }

    if (!pathNodes || pathNodes.length < 2) return;

    const latLngs = pathNodes.map(n => [n.lat, n.lng]);
    const isDijkstra = algorithmName.toLowerCase().includes('dijkstra');
    const routeColor = isDijkstra ? '#d97706' : '#2563eb';

    this.routeGlowPolyline = L.polyline(latLngs, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    this.routePolyline = L.polyline(latLngs, {
      color: routeColor,
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);
  }

  /**
   * Render single step or cumulative progress of search frontier
   * @param {Array} explorationTrace - Array of step objects
   * @param {number} stepIndex - Current step (1 to trace.length)
   * @param {string} algorithm - 'A*' or 'Dijkstra'
   * @param {Array} finalPathNodes - Path nodes to render when search finishes
   */
  renderFrontierStep(explorationTrace, stepIndex, algorithm = 'A*', finalPathNodes = null) {
    this.exploredCirclesLayer.clearLayers();

    if (!explorationTrace || explorationTrace.length === 0 || stepIndex <= 0) {
      if (this.routePolyline) {
        this.map.removeLayer(this.routePolyline);
        this.routePolyline = null;
      }
      if (this.routeGlowPolyline) {
        this.map.removeLayer(this.routeGlowPolyline);
        this.routeGlowPolyline = null;
      }
      return null;
    }

    const isAStar = algorithm.toLowerCase().includes('astar') || algorithm.toLowerCase().includes('a*');
    const maxStep = Math.min(stepIndex, explorationTrace.length);

    for (let i = 0; i < maxStep; i++) {
      const step = explorationTrace[i];
      const nodeMarker = this.nodeMarkers.get(step.nodeId);
      if (!nodeMarker) continue;

      const latLng = nodeMarker.getLatLng();
      const isCurrentActive = (i === maxStep - 1);

      if (isCurrentActive) {
        // Active node currently expanding in wave
        const activeCircle = L.circleMarker(latLng, {
          radius: 11,
          color: isAStar ? '#2563eb' : '#d97706',
          weight: 2.5,
          fillColor: isAStar ? '#3b82f6' : '#f59e0b',
          fillOpacity: 0.9
        });

        const tooltipContent = isAStar ? `
          <div style="font-family: 'Inter', sans-serif; font-size: 11px; color: #0f172a;">
            <strong style="color: #2563eb;">Step ${step.step}: ${step.nodeName}</strong><br>
            <span>g(n) [cost so far]: <strong>${step.gScore}</strong></span><br>
            <span>h(n) [heuristic]: <strong>${step.hScore}</strong></span><br>
            <strong style="color: #16a34a;">f(n) = ${step.fScore}</strong>
          </div>
        ` : `
          <div style="font-family: 'Inter', sans-serif; font-size: 11px; color: #0f172a;">
            <strong style="color: #d97706;">Step ${step.step}: ${step.nodeName}</strong><br>
            <strong style="color: #16a34a;">g(n) = ${step.currentCost}</strong>
          </div>
        `;

        activeCircle.bindTooltip(tooltipContent, { permanent: true, direction: 'top', offset: [0, -10] });
        this.exploredCirclesLayer.addLayer(activeCircle);
      } else {
        // Settled closed-set node
        const settledCircle = L.circleMarker(latLng, {
          radius: 6.5,
          color: '#64748b',
          weight: 1.5,
          fillColor: isAStar ? '#93c5fd' : '#fed7aa',
          fillOpacity: 0.85
        });

        settledCircle.bindTooltip(`Step ${step.step}: ${step.nodeName}`, { opacity: 0.95 });
        this.exploredCirclesLayer.addLayer(settledCircle);
      }
    }

    // If search reached the goal (last step), draw the final path
    if (stepIndex >= explorationTrace.length && finalPathNodes && finalPathNodes.length >= 2) {
      this.drawPathOnly(finalPathNodes, algorithm);
    } else if (this.routePolyline && stepIndex < explorationTrace.length) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
      if (this.routeGlowPolyline) {
        this.map.removeLayer(this.routeGlowPolyline);
        this.routeGlowPolyline = null;
      }
    }

    return {
      step: maxStep,
      total: explorationTrace.length,
      node: explorationTrace[maxStep - 1]
    };
  }

  /**
   * Highlight exploration wavefront (nodes explored during search)
   */
  drawExploredFrontier(explorationTrace, totalNodes, algorithm = 'A*') {
    this.renderFrontierStep(explorationTrace, explorationTrace ? explorationTrace.length : 0, algorithm, null);
  }

  /**
   * Clear calculated route overlays
   */
  clearRoute() {
    this.stopSimulation();
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    if (this.routeGlowPolyline) {
      this.map.removeLayer(this.routeGlowPolyline);
      this.routeGlowPolyline = null;
    }
    if (this.comparisonLayers) {
      if (this.comparisonLayers.dijkstra) {
        this.map.removeLayer(this.comparisonLayers.dijkstra);
      }
      if (this.comparisonLayers.aStar) {
        this.map.removeLayer(this.comparisonLayers.aStar);
      }
      this.comparisonLayers = null;
    }
    this.exploredCirclesLayer.clearLayers();
  }

  /**
   * Live animated ambulance moving along calculated route hops
   */
  startSimulation(pathNodes, speedMultiplier = 1, onProgress, onFinish) {
    if (!pathNodes || pathNodes.length < 2) return;

    this.stopSimulation();
    this.isSimulating = true;
    this.simSpeed = speedMultiplier;

    // Create ambulance marker
    const startPos = [pathNodes[0].lat, pathNodes[0].lng];
    const ambIcon = L.divIcon({
      className: 'empty-leaflet-divicon',
      html: `
        <div class="animated-ambulance-icon">
          <i class="fa-solid fa-truck-medical"></i>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    this.simAmbulanceMarker = L.marker(startPos, { icon: ambIcon, zIndexOffset: 1000 }).addTo(this.map);

    let hopIndex = 0;
    const baseHopTimeMs = 1500; // ms per road segment at 1x speed

    const moveToNextHop = () => {
      if (!this.isSimulating) return;

      if (hopIndex >= pathNodes.length - 1) {
        // Destination reached
        this.stopSimulation();
        if (onFinish) onFinish();
        return;
      }

      const fromNode = pathNodes[hopIndex];
      const toNode = pathNodes[hopIndex + 1];
      const targetLatLng = L.latLng(toNode.lat, toNode.lng);

      if (onProgress) {
        onProgress(hopIndex + 1, pathNodes.length, toNode);
      }

      // Smooth step
      const stepDuration = Math.max(300, baseHopTimeMs / this.simSpeed);
      this.simAmbulanceMarker.setLatLng(targetLatLng);

      hopIndex++;
      this.simulationTimeout = setTimeout(moveToNextHop, stepDuration);
    };

    moveToNextHop();
  }

  stopSimulation() {
    this.isSimulating = false;
    if (this.simulationTimeout) {
      clearTimeout(this.simulationTimeout);
      this.simulationTimeout = null;
    }
    if (this.simAmbulanceMarker) {
      this.map.removeLayer(this.simAmbulanceMarker);
      this.simAmbulanceMarker = null;
    }
    this.stopSiren();
  }

  /**
   * Web Audio API synthesized emergency siren
   */
  toggleSiren() {
    if (this.isSirenOn) {
      this.stopSiren();
      return false;
    } else {
      this.startSiren();
      return true;
    }
  }

  startSiren() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.audioCtx = new AudioContext();

      this.sirenOscillator = this.audioCtx.createOscillator();
      this.sirenGain = this.audioCtx.createGain();

      this.sirenOscillator.type = 'sawtooth';
      this.sirenGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime); // Gentle volume

      this.sirenOscillator.connect(this.sirenGain);
      this.sirenGain.connect(this.audioCtx.destination);
      this.sirenOscillator.start();

      let freqToggle = false;
      this.sirenInterval = setInterval(() => {
        if (!this.audioCtx || !this.sirenOscillator) return;
        const targetFreq = freqToggle ? 650 : 900;
        this.sirenOscillator.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.15);
        freqToggle = !freqToggle;
      }, 400);

      this.isSirenOn = true;
    } catch (e) {
      console.warn('AudioContext not allowed without user gesture', e);
    }
  }

  stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOscillator) {
      try { this.sirenOscillator.stop(); } catch(e) {}
      this.sirenOscillator = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch(e) {}
      this.audioCtx = null;
    }
    this.isSirenOn = false;
  }
}
