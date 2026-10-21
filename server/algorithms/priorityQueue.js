/**
 * Tatkal Seva - DAA Project
 * File: server/algorithms/priorityQueue.js
 * 
 * DESIGN & ANALYSIS OF ALGORITHMS (DAA) CONCEPT:
 * Min-Priority Queue implemented using a Binary Min-Heap.
 * 
 * Theoretical Complexity:
 * - Insertion (Enqueue): O(log N)
 * - Extract Minimum (Dequeue): O(log N)
 * - Peek (Find Min): O(1)
 * - Space Complexity: O(N)
 * 
 * Role in Shortest Path:
 * Enables Dijkstra's and A* to achieve O((V + E) log V) time complexity
 * rather than the unoptimized O(V^2) array scan.
 */

class MinPriorityQueue {
  constructor() {
    this.heap = [];
    this.comparisonCount = 0; // Metric for algorithm efficiency analysis
  }

  /**
   * Returns index of parent node
   */
  parentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  /**
   * Returns index of left child
   */
  leftChildIndex(index) {
    return 2 * index + 1;
  }

  /**
   * Returns index of right child
   */
  rightChildIndex(index) {
    return 2 * index + 2;
  }

  /**
   * Swap two elements in the heap
   */
  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  /**
   * Check if queue is empty
   * Complexity: O(1)
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Return size of priority queue
   * Complexity: O(1)
   */
  size() {
    return this.heap.length;
  }

  /**
   * Peek minimum priority element without removing
   * Complexity: O(1)
   */
  peek() {
    if (this.isEmpty()) return null;
    return this.heap[0];
  }

  /**
   * Insert element with an associated numeric priority.
   * Lower numeric value = higher priority (Min-Heap).
   * Complexity: O(log N)
   */
  enqueue(item, priority) {
    const node = { item, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Restore min-heap property by bubbling upward
   */
  bubbleUp(index) {
    while (index > 0) {
      const parentIdx = this.parentIndex(index);
      this.comparisonCount++;
      if (this.heap[index].priority < this.heap[parentIdx].priority) {
        this.swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  /**
   * Remove and return element with smallest priority.
   * Complexity: O(log N)
   */
  dequeue() {
    if (this.isEmpty()) return null;
    if (this.heap.length === 1) return this.heap.pop().item;

    const root = this.heap[0].item;
    // Move last element to root and sink down
    this.heap[0] = this.heap.pop();
    this.sinkDown(0);
    return root;
  }

  /**
   * Restore min-heap property by sinking downward
   */
  sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      const leftIdx = this.leftChildIndex(index);
      const rightIdx = this.rightChildIndex(index);
      let smallestIdx = index;

      if (leftIdx < length) {
        this.comparisonCount++;
        if (this.heap[leftIdx].priority < this.heap[smallestIdx].priority) {
          smallestIdx = leftIdx;
        }
      }

      if (rightIdx < length) {
        this.comparisonCount++;
        if (this.heap[rightIdx].priority < this.heap[smallestIdx].priority) {
          smallestIdx = rightIdx;
        }
      }

      if (smallestIdx !== index) {
        this.swap(index, smallestIdx);
        index = smallestIdx;
      } else {
        break;
      }
    }
  }

  /**
   * Clear the priority queue
   */
  clear() {
    this.heap = [];
    this.comparisonCount = 0;
  }
}

module.exports = MinPriorityQueue;
