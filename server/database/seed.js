/**
 * Tatkal Seva - DAA Project
 * File: server/database/seed.js
 * 
 * Pre-populates the database with a realistic urban road network:
 * - 6 Super-Specialty Hospitals (with real ICU capacities)
 * - 4 24/7 Rapid Ambulance Depots
 * - 4 Emergency Hotspots (accident points / critical cases)
 * - 16 Key Road Junctions, Flyovers, and Expressways
 * - 55+ Interconnected Road Edges with realistic speeds and traffic factors
 * - 4 Active Ambulances with assigned drivers and callsigns
 */

const db = require('./db');

function seedDatabase() {
  console.log('[Tatkal Seva DB] Starting database seed...');

  // 1. Seed Nodes
  const nodes = [
    // Hospitals
    {
      id: 'H1',
      name: 'Apollo Multi-Specialty Hospital',
      type: 'hospital',
      lat: 12.8954,
      lng: 77.5988,
      description: 'Tier-1 Emergency Center, 24/7 Cardiac Cath Lab, Level 1 Trauma Care',
      capacity: 18
    },
    {
      id: 'H2',
      name: 'Fortis Emergency Healthcare',
      type: 'hospital',
      lat: 12.8931,
      lng: 77.5975,
      description: 'Super-Specialty Trauma & Neuro ICU, Rapid Stroke Unit',
      capacity: 14
    },
    {
      id: 'H3',
      name: 'Manipal Hospital Trauma Center',
      type: 'hospital',
      lat: 12.9592,
      lng: 77.6499,
      description: 'HAL Airport Road Regional Trauma Hub, 24/7 Pediatric ICU',
      capacity: 22
    },
    {
      id: 'H4',
      name: 'St. Johns Medical College & Hospital',
      type: 'hospital',
      lat: 12.9309,
      lng: 77.6189,
      description: 'Tertiary Medical Center with 40-bed Emergency Ward',
      capacity: 28
    },
    {
      id: 'H5',
      name: 'Victoria Hospital (Govt Trauma Center)',
      type: 'hospital',
      lat: 12.9634,
      lng: 77.5755,
      description: 'Central Government Emergency Ward, Specialized Burns & Plastic Surgery',
      capacity: 35
    },
    {
      id: 'H6',
      name: 'Aster CMI Hospital Emergency Wing',
      type: 'hospital',
      lat: 13.0456,
      lng: 77.5925,
      description: 'North Corridor Regional Emergency Care, Advanced Life Support',
      capacity: 16
    },

    // Ambulance Stations / Depots
    {
      id: 'AMB_BASE_1',
      name: 'South Metro Ambulance Hub',
      type: 'ambulance_station',
      lat: 12.9285,
      lng: 77.5834,
      description: 'Jayanagar Quick Response Depot, 4 Advanced Life Support Ambulances',
      capacity: 4
    },
    {
      id: 'AMB_BASE_2',
      name: 'Central Emergency Rapid Dispatch Base',
      type: 'ambulance_station',
      lat: 12.9754,
      lng: 77.6094,
      description: 'MG Road Central Command, 24/7 Tele-medicine Dispatch',
      capacity: 6
    },
    {
      id: 'AMB_BASE_3',
      name: 'East Tech Corridor Ambulance Hub',
      type: 'ambulance_station',
      lat: 12.9280,
      lng: 77.6740,
      description: 'Outer Ring Road Bellandur Fast-Response Unit',
      capacity: 5
    },
    {
      id: 'AMB_BASE_4',
      name: 'North City Highway Rapid Rescue Base',
      type: 'ambulance_station',
      lat: 13.0232,
      lng: 77.5501,
      description: 'Yeshwanthpur Expressway Medical Depot',
      capacity: 4
    },

    // Emergency Hotspots / Patient Pickups
    {
      id: 'EM1',
      name: 'Bellandur ORR Multi-Vehicle Crash',
      type: 'emergency_point',
      lat: 12.9354,
      lng: 77.6812,
      description: 'High-impact collision on expressway, 2 critical trauma patients reported',
      capacity: 0
    },
    {
      id: 'EM2',
      name: 'City Market Heritage Gate Emergency',
      type: 'emergency_point',
      lat: 12.9620,
      lng: 77.5780,
      description: 'Elderly patient with acute myocardial infarction, narrow street access',
      capacity: 0
    },
    {
      id: 'EM3',
      name: 'Airport Express Highway Crash Site',
      type: 'emergency_point',
      lat: 13.0520,
      lng: 77.6105,
      description: 'Vehicle rollover on North Expressway, urgent head injury triage needed',
      capacity: 0
    },
    {
      id: 'EM4',
      name: 'Koramangala Commercial Hub Fire Alert',
      type: 'emergency_point',
      lat: 12.9340,
      lng: 77.6150,
      description: 'Smoke inhalation & severe burns reported in commercial building',
      capacity: 0
    },

    // Key Junctions, Flyovers, and Intersections
    { id: 'J1', name: 'Dairy Circle Flyover', type: 'junction', lat: 12.9372, lng: 77.6012, description: 'Major 3-way intersection connecting Bannerghatta to Central City' },
    { id: 'J2', name: 'Koramangala Sony World Signal', type: 'junction', lat: 12.9351, lng: 77.6245, description: 'Key arterial crossing connecting Inner Ring to Outer Ring' },
    { id: 'J3', name: 'Silk Board Mega Interchange', type: 'junction', lat: 12.9174, lng: 77.6238, description: 'High-density arterial interchange connecting Hosur Road & ORR' },
    { id: 'J4', name: 'BTM Layout 2nd Stage Ring Road', type: 'junction', lat: 12.9135, lng: 77.6072, description: 'Multi-lane junction between Bannerghatta & Silk Board' },
    { id: 'J5', name: 'Richmond Circle Junction', type: 'junction', lat: 12.9663, lng: 77.5992, description: 'Central business district flyover connecting north-south avenues' },
    { id: 'J6', name: 'Indiranagar 100ft Road Crossing', type: 'junction', lat: 12.9698, lng: 77.6425, description: 'Vibrant east corridor avenue with dedicated bus lanes' },
    { id: 'J7', name: 'Domlur Flyover Cloverleaf', type: 'junction', lat: 12.9610, lng: 77.6387, description: 'Key grade separator connecting Inner Ring Road to Old Airport Road' },
    { id: 'J8', name: 'Mekhri Circle Underpass', type: 'junction', lat: 13.0118, lng: 77.5855, description: 'Gateway underpass connecting central city to Airport Corridor' },
    { id: 'J9', name: 'Hebbal Flyover Expressway Junction', type: 'junction', lat: 13.0358, lng: 77.5971, description: 'Multi-tier flyover connecting NH-44, Bellary Road & Outer Ring' },
    { id: 'J10', name: 'Shivajinagar Bus Terminal Junction', type: 'junction', lat: 12.9860, lng: 77.6042, description: 'Dense commercial intersection with hospital priority corridor' },
    { id: 'J11', name: 'Majestic Central Railway Junction', type: 'junction', lat: 12.9774, lng: 77.5713, description: 'City transit focal point with high pedestrian and vehicular traffic' },
    { id: 'J12', name: 'Malleswaram 8th Cross', type: 'junction', lat: 12.9984, lng: 77.5695, description: 'North-west historical arterial corridor' },
    { id: 'J13', name: 'Rajajinagar Industrial Corridor', type: 'junction', lat: 12.9897, lng: 77.5532, description: 'Industrial link connecting western suburbs' },
    { id: 'J14', name: 'Marathahalli Bridge Junction', type: 'junction', lat: 12.9562, lng: 77.7011, description: 'Crucial bridge over railway linking ORR to Whitefield tech zone' },
    { id: 'J15', name: 'HSR Layout BDA Complex Roundabout', type: 'junction', lat: 12.9116, lng: 77.6445, description: 'Wide grid arterial connecting Silk Board to Sarjapur Road' },
    { id: 'J16', name: 'Electronic City Elevated Tollway Entry', type: 'junction', lat: 12.8452, lng: 77.6601, description: 'Access ramp to high-speed 10km elevated highway' }
  ];

  for (const node of nodes) {
    db.insertNode(node);
  }
  console.log(`[Tatkal Seva DB] Inserted ${nodes.length} road network nodes.`);

  // 2. Clear old edges and seed interconnected weighted edges
  db.db.exec('DELETE FROM edges');

  const edges = [
    // South Corridor
    { source: 'H1', target: 'H2', road_name: 'Bannerghatta Medical Link', distance_km: 0.3, speed_limit_kmh: 40, traffic_factor: 1.0 },
    { source: 'H1', target: 'J4', road_name: 'Bannerghatta Main Road', distance_km: 2.2, speed_limit_kmh: 45, traffic_factor: 1.2 },
    { source: 'J4', target: 'J3', road_name: 'BTM Outer Ring Road', distance_km: 2.0, speed_limit_kmh: 50, traffic_factor: 1.5 },
    { source: 'J4', target: 'J1', road_name: 'Dairy Circle Connector', distance_km: 2.8, speed_limit_kmh: 45, traffic_factor: 1.1 },
    { source: 'AMB_BASE_1', target: 'J1', road_name: 'Jayanagar 9th Main Road', distance_km: 2.1, speed_limit_kmh: 40, traffic_factor: 1.0 },
    { source: 'AMB_BASE_1', target: 'J4', road_name: 'MICO Layout Road', distance_km: 3.1, speed_limit_kmh: 45, traffic_factor: 1.0 },
    { source: 'J3', target: 'H4', road_name: 'Hosur Main Road', distance_km: 1.8, speed_limit_kmh: 50, traffic_factor: 1.4 },
    { source: 'H4', target: 'EM4', road_name: 'Koramangala 80ft Road', distance_km: 0.6, speed_limit_kmh: 40, traffic_factor: 1.0 },
    { source: 'EM4', target: 'J2', road_name: 'Sony World Link', distance_km: 1.1, speed_limit_kmh: 40, traffic_factor: 1.2 },
    { source: 'H4', target: 'J2', road_name: 'Koramangala 100ft Road', distance_km: 1.2, speed_limit_kmh: 45, traffic_factor: 1.3 },
    { source: 'J1', target: 'H4', road_name: 'Adugodi Hosur Corridor', distance_km: 2.1, speed_limit_kmh: 45, traffic_factor: 1.3 },
    { source: 'J3', target: 'J15', road_name: 'Outer Ring Road (Silk Board to HSR)', distance_km: 2.4, speed_limit_kmh: 60, traffic_factor: 1.4 },
    { source: 'J3', target: 'J16', road_name: 'Electronic City Elevated Expressway', distance_km: 9.2, speed_limit_kmh: 80, traffic_factor: 1.0 },
    { source: 'J15', target: 'AMB_BASE_3', road_name: 'HSR-Bellandur Access Road', distance_km: 3.5, speed_limit_kmh: 50, traffic_factor: 1.1 },

    // Central - Richmond - Majestic
    { source: 'J1', target: 'J5', road_name: 'Hosur Road Flyover to Richmond', distance_km: 3.4, speed_limit_kmh: 50, traffic_factor: 1.2 },
    { source: 'J5', target: 'AMB_BASE_2', road_name: 'Residency Road Corridor', distance_km: 1.5, speed_limit_kmh: 40, traffic_factor: 1.1 },
    { source: 'AMB_BASE_2', target: 'J10', road_name: 'Cavalry Road to Shivajinagar', distance_km: 1.6, speed_limit_kmh: 40, traffic_factor: 1.3 },
    { source: 'J5', target: 'H5', road_name: 'Kalasipalya Medical Avenue', distance_km: 2.6, speed_limit_kmh: 35, traffic_factor: 1.5 },
    { source: 'H5', target: 'EM2', road_name: 'City Market Internal Lane', distance_km: 0.3, speed_limit_kmh: 25, traffic_factor: 1.6 },
    { source: 'H5', target: 'J11', road_name: 'Cottonpet - Majestic Link', distance_km: 1.8, speed_limit_kmh: 35, traffic_factor: 1.7 },
    { source: 'J11', target: 'AMB_BASE_2', road_name: 'Seshadri Road to MG Road', distance_km: 3.9, speed_limit_kmh: 45, traffic_factor: 1.3 },
    { source: 'J11', target: 'J10', road_name: 'Cunningham Road Connector', distance_km: 3.2, speed_limit_kmh: 45, traffic_factor: 1.2 },

    // East Corridor (Domlur, Indiranagar, Bellandur, Marathahalli)
    { source: 'J2', target: 'J7', road_name: 'Inner Ring Road (Koramangala to Domlur)', distance_km: 3.2, speed_limit_kmh: 55, traffic_factor: 1.1 },
    { source: 'AMB_BASE_2', target: 'J7', road_name: 'Old Airport Road Express Way', distance_km: 3.6, speed_limit_kmh: 50, traffic_factor: 1.3 },
    { source: 'J7', target: 'J6', road_name: '100ft Road Domlur to Indiranagar', distance_km: 1.4, speed_limit_kmh: 40, traffic_factor: 1.2 },
    { source: 'J7', target: 'H3', road_name: 'Old Airport Road to Manipal Hospital', distance_km: 1.3, speed_limit_kmh: 45, traffic_factor: 1.0 },
    { source: 'H3', target: 'J14', road_name: 'HAL Airport Road to Marathahalli', distance_km: 5.6, speed_limit_kmh: 60, traffic_factor: 1.2 },
    { source: 'J6', target: 'J10', road_name: 'CMH Road to Shivajinagar', distance_km: 4.5, speed_limit_kmh: 40, traffic_factor: 1.4 },
    { source: 'J15', target: 'EM1', road_name: 'ORR Outer Ring Rapid Lane', distance_km: 4.8, speed_limit_kmh: 65, traffic_factor: 1.3 },
    { source: 'AMB_BASE_3', target: 'EM1', road_name: 'Bellandur Station Link', distance_km: 1.1, speed_limit_kmh: 45, traffic_factor: 1.1 },
    { source: 'EM1', target: 'J14', road_name: 'Outer Ring Road (Bellandur to Marathahalli)', distance_km: 3.1, speed_limit_kmh: 65, traffic_factor: 1.3 },

    // North & West Corridor (Majestic, Malleswaram, Mekhri, Hebbal, Aster)
    { source: 'J11', target: 'J12', road_name: 'Platform Road to Malleswaram', distance_km: 2.4, speed_limit_kmh: 40, traffic_factor: 1.2 },
    { source: 'J12', target: 'J13', road_name: 'Rajajinagar Link Road', distance_km: 2.1, speed_limit_kmh: 40, traffic_factor: 1.0 },
    { source: 'J12', target: 'AMB_BASE_4', road_name: 'Yeshwanthpur Industrial Way', distance_km: 3.3, speed_limit_kmh: 50, traffic_factor: 1.1 },
    { source: 'AMB_BASE_4', target: 'J8', road_name: 'Sankey Tank High Corridor', distance_km: 4.2, speed_limit_kmh: 55, traffic_factor: 1.1 },
    { source: 'J10', target: 'J8', road_name: 'Palace Road to Mekhri Circle', distance_km: 3.6, speed_limit_kmh: 55, traffic_factor: 1.1 },
    { source: 'J8', target: 'J9', road_name: 'Bellary Road Expressway', distance_km: 3.0, speed_limit_kmh: 70, traffic_factor: 1.0 },
    { source: 'J9', target: 'H6', road_name: 'Hebbal Hospital Service Road', distance_km: 1.2, speed_limit_kmh: 45, traffic_factor: 1.0 },
    { source: 'H6', target: 'EM3', road_name: 'Airport NH-44 Fast Lane', distance_km: 1.9, speed_limit_kmh: 80, traffic_factor: 1.0 },
    { source: 'J9', target: 'EM3', road_name: 'NH-44 International Highway', distance_km: 2.4, speed_limit_kmh: 80, traffic_factor: 1.1 },
    { source: 'AMB_BASE_4', target: 'J9', road_name: 'Ring Road from Yeshwanthpur to Hebbal', distance_km: 5.4, speed_limit_kmh: 65, traffic_factor: 1.2 },

    // Cross-City Interconnecting Arterials
    { source: 'J5', target: 'J10', road_name: 'Cubbon Park Peripheral Corridor', distance_km: 2.3, speed_limit_kmh: 45, traffic_factor: 1.1 },
    { source: 'J1', target: 'AMB_BASE_1', road_name: 'Lalbagh South Gate Link', distance_km: 2.0, speed_limit_kmh: 40, traffic_factor: 1.0 },
    { source: 'H5', target: 'J1', road_name: 'Kalasipalya to Dairy Circle', distance_km: 3.6, speed_limit_kmh: 40, traffic_factor: 1.4 },
    { source: 'J2', target: 'J15', road_name: 'Sarjapur Main Road Connection', distance_km: 3.2, speed_limit_kmh: 45, traffic_factor: 1.3 }
  ];

  for (const edge of edges) {
    db.insertEdge(edge);
  }
  console.log(`[Tatkal Seva DB] Inserted ${edges.length} road edges.`);

  // 3. Seed Ambulances
  const ambulances = [
    {
      id: 'AMB-101',
      callsign: 'Tatkal Rapid 101 (Cardiac Care)',
      current_node_id: 'AMB_BASE_1',
      status: 'available',
      driver_name: 'Rajesh Kumar',
      contact: '+91 98450 11001'
    },
    {
      id: 'AMB-102',
      callsign: 'Tatkal Trauma 102 (Advanced Life Support)',
      current_node_id: 'AMB_BASE_2',
      status: 'available',
      driver_name: 'Suresh Gowda',
      contact: '+91 98450 11002'
    },
    {
      id: 'AMB-103',
      callsign: 'Tatkal Express 103 (Pediatric Intensive)',
      current_node_id: 'AMB_BASE_3',
      status: 'available',
      driver_name: 'Mohammed Asif',
      contact: '+91 98450 11003'
    },
    {
      id: 'AMB-104',
      callsign: 'Tatkal Airway 104 (Highway Rescue)',
      current_node_id: 'AMB_BASE_4',
      status: 'available',
      driver_name: 'Deepak Nayak',
      contact: '+91 98450 11004'
    }
  ];

  for (const amb of ambulances) {
    db.insertAmbulance(amb);
  }
  console.log(`[Tatkal Seva DB] Inserted ${ambulances.length} emergency ambulances.`);
  console.log('[Tatkal Seva DB] Database seed completed successfully.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
