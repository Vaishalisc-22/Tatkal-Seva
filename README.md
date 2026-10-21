# 🚑 Tatkal Seva: Emergency Ambulance Route Planner
> **College Design & Analysis of Algorithms (DAA) Capstone Project**  
> An intelligent emergency ambulance route-planning and algorithmic benchmarking web application that finds the shortest/fastest route to critical medical facilities using manual implementations of **Dijkstra's Algorithm** and **A\* (A-Star) Search**.

---

## 📌 Project Overview
**Tatkal Seva** addresses the critical challenge of emergency patient transit in congested metropolitan areas. By modelling city roads as a **Weighted Directed/Bidirectional Graph** $G = (V, E)$, the system optimizes ambulance transit time dynamically while considering road lengths, speed limits, live traffic congestion, and impassable road blocks (e.g., floods, VIP motorcades).

### 🎯 Key Highlights for DAA Demonstration & Viva
- **100% Manual Algorithm Implementations**: No external routing black-boxes (such as Google Directions or OSRM) are used for route calculation. All shortest-path logic is implemented from algorithmic first principles.
- **Binary Min-Heap Priority Queue**: Custom-built min-priority queue achieves the optimal $O((V + E) \log V)$ time complexity rather than the naive $O(V^2)$ array search.
- **Side-by-Side Algorithm Benchmark**: Direct comparison of **Dijkstra (Greedy Uniform-Cost)** vs **A\* (Informed Heuristic Search)** with execution times in microseconds ($\mu s$), node expansion counts, edge relaxations, and heap comparisons.
- **Admissible Heuristic**: Employs the **Haversine Great-Circle Distance** formula, mathematically proving the admissibility criterion $h(n) \le h^*(n)$ for guaranteed optimality.
- **Dynamic Traffic & Road Block Simulation**: Real-time traffic alteration to showcase adaptive re-routing around bottlenecks.
- **Emergency 108 Smart Hospital Triage**: Automatically evaluates all regional trauma centers based on transit time and live ICU bed availability.
- **Interactive Simulation**: Step-by-step animated ambulance drive along the calculated route with synthesized emergency siren audio.

---

## 🏛️ Architecture & Separation of Concerns

```
Tatkal-Seva/
├── package.json               # Project manifest & npm scripts
├── README.md                  # Comprehensive project & viva documentation
├── server/
│   ├── server.js              # Express REST server & static file host
│   ├── config.js              # Application constants & configuration
│   ├── database/
│   │   ├── db.js              # SQLite database manager (using Node.js built-in node:sqlite)
│   │   ├── schema.sql         # SQL schema for nodes, edges, ambulances, route logs
│   │   └── seed.js            # Urban road network seeder (30 nodes, 45 weighted edges)
│   ├── algorithms/
│   │   ├── priorityQueue.js   # Binary Min-Heap Priority Queue (O(log N))
│   │   ├── graph.js           # Weighted Graph representation & Haversine heuristic
│   │   ├── dijkstra.js        # Dijkstra's Algorithm implementation with metrics
│   │   ├── astar.js           # A* Algorithm with f(n) = g(n) + h(n) evaluation
│   │   └── comparator.js      # Side-by-side DAA comparison & verification engine
│   └── routes/
│       └── api.js             # REST API routes (/api/route, /api/compare, etc.)
├── public/                    # Frontend client
│   ├── index.html             # Emergency Command Center HUD & map interface
│   ├── css/
│   │   └── style.css          # Glassmorphic dark theme, animations, HUD widgets
│   └── js/
│       ├── api.js             # Client API caller
│       ├── map.js             # Leaflet map, animated route polylines & vehicle simulation
│       ├── viva-guide.js      # Viva Voce study guide & theoretical matrix renderer
│       └── app.js             # Application orchestrator & event handling
└── test/
    └── test-algorithms.js     # Standalone CLI test suite for terminal viva demo
```

---

## ⚙️ Theoretical DAA Complexity Analysis

| Metric / Property | Dijkstra's Algorithm | A\* (A-Star) Search |
| :--- | :--- | :--- |
| **Algorithmic Paradigm** | Greedy Method (Uniform-Cost) | Informed Search / Best-First Search |
| **Evaluation Function** | $f(n) = g(n)$ (Past path cost) | $f(n) = g(n) + h(n)$ (Past cost + Heuristic) |
| **Time Complexity (Min-Heap)** | $O((V + E) \log V)$ | Worst-case: $O((V + E) \log V)$; directed $O(b^d)$ in practice |
| **Space Complexity** | $O(V)$ for distances & priority queue | $O(V)$ for Open and Closed sets |
| **Search Space Shape** | Concentric circular wave in all directions | Directed elliptical beam focused toward destination |
| **Heuristic Requirement** | None (Uninformed) | Requires Admissible & Consistent Heuristic ($h(n) \le h^*(n)$) |
| **Optimality Guarantee** | Guaranteed for all $w(u, v) \ge 0$ | Guaranteed when $h(n)$ is admissible |

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- **Node.js** (v18 or higher recommended; Node v22+ has `node:sqlite` built in)
- Modern web browser (Chrome, Edge, Firefox, Brave)

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database (Road Network & Hospitals)
```bash
npm run seed
```

### 3. Run Standalone CLI Algorithm Test (For viva demonstration)
```bash
npm test
```
*This executes Dijkstra and A\* directly in the terminal, outputting execution times in microseconds, path nodes, and search reduction percentages.*

### 4. Start the Web Application
```bash
npm start
```
Open your web browser and navigate to:  
👉 **`http://localhost:3000`**

---

## 🎓 Viva Voce Questions & Answers

### Q1: Why does A* explore fewer nodes than Dijkstra?
**Answer:** Dijkstra is an uninformed search that explores uniformly in all directions regardless of where the destination is located. A* utilizes a heuristic function $h(n)$ estimating the remaining distance to the destination. By prioritizing nodes with smaller $f(n) = g(n) + h(n)$, A* directs its search towards the goal, effectively pruning vertices that lead away from the destination.

### Q2: What is an Admissible Heuristic and how is it satisfied here?
**Answer:** A heuristic $h(n)$ is admissible if it never overestimates the true remaining cost ($h(n) \le h^*(n)$). In Tatkal Seva, we use the **Haversine aerial straight-line distance**. By the triangle inequality on a sphere, the straight-line distance is the shortest possible path between two coordinates. Real road paths must turn and weave, meaning `Road Distance >= Aerial Distance`. Hence, $h(n)$ is strictly admissible and A* is guaranteed to be optimal.

### Q3: What is the significance of the Binary Min-Heap?
**Answer:** Without a priority queue, finding the minimum distance node takes $O(V)$ time, leading to an overall time complexity of $O(V^2)$. With a Binary Min-Heap, finding and extracting the minimum takes $O(\log V)$, and updating an edge (decrease-key/insert) takes $O(\log V)$. This yields the optimal $O((V + E) \log V)$ running time.

### Q4: Can negative edge weights exist in road networks?
**Answer:** No. Physical road lengths and travel times are strictly positive ($w(u, v) > 0$). Neither standard Dijkstra nor standard A* can be used with negative edge weights because their greedy invariant would be violated. If negative weights were present, the Bellman-Ford algorithm ($O(V \cdot E)$) would be required.

---

## 👨‍💻 Project Information
- **Project Name:** Tatkal Seva (Emergency Ambulance Route Planning System)
- **Domain:** Design and Analysis of Algorithms (DAA) / Graph Theory
- **Author:** College DAA Project Team
- **Stack:** Node.js, Express, SQLite (`node:sqlite`), Leaflet.js, HTML5, Vanilla CSS3
