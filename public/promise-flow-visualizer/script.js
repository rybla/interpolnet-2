const SVG_NS = 'http://www.w3.org/2000/svg';

// Graph Structure Definition
const graphData = {
  nodes: [
    { id: 'start', label: 'fetchData()', x: 50, y: 150, type: 'source', initialState: 'resolved' },
    { id: 'then1', label: '.then(processData)', x: 250, y: 150, type: 'then' },
    { id: 'then2', label: '.then(displayData)', x: 450, y: 150, type: 'then' },
    { id: 'catch1', label: '.catch(handleError)', x: 350, y: 300, type: 'catch' },
    { id: 'finally1', label: '.finally(cleanup)', x: 650, y: 225, type: 'finally' }
  ],
  edges: [
    { source: 'start', target: 'then1', type: 'resolve' },
    { source: 'start', target: 'catch1', type: 'reject' },
    { source: 'then1', target: 'then2', type: 'resolve' },
    { source: 'then1', target: 'catch1', type: 'reject' },
    { source: 'then2', target: 'finally1', type: 'resolve' },
    { source: 'then2', target: 'catch1', type: 'reject' },
    { source: 'catch1', target: 'finally1', type: 'resolve' } // Catch resolves normally unless it throws
  ]
};

// State mapping to node UI
const nodeStates = {};

let isRunning = false;

function init() {
  if (typeof window === 'undefined') return;

  renderGraph();
  setupInteractivity();
  setupControls();
  resetGraph();
}

function renderGraph() {
  const nodesLayer = document.getElementById('nodes');
  const edgesLayer = document.getElementById('edges');

  // Render edges first so they are underneath nodes
  graphData.edges.forEach(edge => {
    const sourceNode = graphData.nodes.find(n => n.id === edge.source);
    const targetNode = graphData.nodes.find(n => n.id === edge.target);

    // Calculate path
    const startX = sourceNode.x + 140; // width / 2 roughly
    const startY = sourceNode.y + 25;  // height / 2 roughly
    const endX = targetNode.x;
    const endY = targetNode.y + 25;

    // Draw bezier curve
    const path = document.createElementNS(SVG_NS, 'path');
    const d = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;
    path.setAttribute('d', d);
    path.setAttribute('marker-end', 'url(#arrow-pending)');

    const edgeGroup = document.createElementNS(SVG_NS, 'g');
    edgeGroup.setAttribute('id', `edge-${edge.source}-${edge.target}`);
    edgeGroup.classList.add('edge');
    edgeGroup.appendChild(path);

    edgesLayer.appendChild(edgeGroup);
  });

  // Render nodes
  graphData.nodes.forEach(node => {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('id', `node-${node.id}`);
    group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    group.classList.add('node');

    if (node.type === 'source') {
      group.classList.add('interactive');
    }

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('width', 150);
    rect.setAttribute('height', 50);

    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', 75);
    title.setAttribute('y', 20);
    title.setAttribute('text-anchor', 'middle');
    title.classList.add('title');
    title.textContent = node.label;

    const status = document.createElementNS(SVG_NS, 'text');
    status.setAttribute('x', 75);
    status.setAttribute('y', 38);
    status.setAttribute('text-anchor', 'middle');
    status.classList.add('status');
    status.setAttribute('id', `status-${node.id}`);
    status.textContent = 'Pending';

    group.appendChild(rect);
    group.appendChild(title);
    group.appendChild(status);

    if (node.type === 'source') {
      const toggleHint = document.createElementNS(SVG_NS, 'text');
      toggleHint.setAttribute('x', 75);
      toggleHint.setAttribute('y', -5);
      toggleHint.setAttribute('text-anchor', 'middle');
      toggleHint.classList.add('node-toggle-text');
      toggleHint.textContent = '(Click to toggle state)';
      group.appendChild(toggleHint);
    }

    nodesLayer.appendChild(group);
  });

  // Initialize Code Panel
  const codeBlock = document.getElementById('code-block');
  codeBlock.innerHTML = `
<span class="code-line" id="code-start">fetchData()</span>
<span class="code-line" id="code-then1">  .then(processData)</span>
<span class="code-line" id="code-then2">  .then(displayData)</span>
<span class="code-line" id="code-catch1">  .catch(handleError)</span>
<span class="code-line" id="code-finally1">  .finally(cleanup);</span>
  `;
}

function setupInteractivity() {
  const sourceNode = graphData.nodes.find(n => n.type === 'source');
  nodeStates[sourceNode.id] = sourceNode.initialState; // 'resolved' or 'rejected'

  updateSourceNodeVisuals();

  document.getElementById(`node-${sourceNode.id}`).addEventListener('click', () => {
    if (isRunning) return;
    nodeStates[sourceNode.id] = nodeStates[sourceNode.id] === 'resolved' ? 'rejected' : 'resolved';
    updateSourceNodeVisuals();
  });
}

function updateSourceNodeVisuals() {
  const sourceId = graphData.nodes.find(n => n.type === 'source').id;
  const state = nodeStates[sourceId];
  const nodeEl = document.getElementById(`node-${sourceId}`);
  const statusEl = document.getElementById(`status-${sourceId}`);

  nodeEl.classList.remove('resolved', 'rejected', 'pending');
  nodeEl.classList.add(state);
  statusEl.textContent = state === 'resolved' ? 'Will Resolve' : 'Will Reject';
}

function setupControls() {
  document.getElementById('run-btn').addEventListener('click', startSimulation);
  document.getElementById('reset-btn').addEventListener('click', resetGraph);
}

function resetGraph() {
  isRunning = false;

  // Reset nodes except source
  graphData.nodes.forEach(node => {
    if (node.type !== 'source') {
      const nodeEl = document.getElementById(`node-${node.id}`);
      const statusEl = document.getElementById(`status-${node.id}`);
      nodeEl.classList.remove('resolved', 'rejected');
      nodeEl.classList.add('pending');
      statusEl.textContent = 'Pending';
      nodeStates[node.id] = 'pending';
    }
  });

  updateSourceNodeVisuals();

  // Reset edges
  document.querySelectorAll('.edge').forEach(edge => {
    edge.classList.remove('resolved', 'rejected');
    edge.querySelector('path').setAttribute('marker-end', 'url(#arrow-pending)');
  });

  // Reset code highlighting
  document.querySelectorAll('.code-line').forEach(line => {
    line.classList.remove('active-resolve', 'active-reject');
  });

  document.getElementById('run-btn').disabled = false;
}

async function startSimulation() {
  if (isRunning) return;
  isRunning = true;
  document.getElementById('run-btn').disabled = true;

  // Clear previous runs (except source intent)
  graphData.nodes.forEach(node => {
    if(node.type !== 'source') nodeStates[node.id] = 'pending';
  });

  let currentNodeId = 'start';
  let value = nodeStates['start'] === 'resolved' ? 'Data' : new Error('Network Error');
  let isRejection = nodeStates['start'] === 'rejected';

  await simulateNodeExecution(currentNodeId, isRejection, value);
}

async function simulateNodeExecution(nodeId, isRejection, value) {
  if (!isRunning) return;

  const nodeEl = document.getElementById(`node-${nodeId}`);
  const statusEl = document.getElementById(`status-${nodeId}`);
  const codeLine = document.getElementById(`code-${nodeId}`);
  const nodeDef = graphData.nodes.find(n => n.id === nodeId);

  // Mark node as active
  const stateClass = isRejection ? 'rejected' : 'resolved';
  nodeEl.classList.remove('pending');
  nodeEl.classList.add(stateClass);
  statusEl.textContent = isRejection ? `Rejected: ${value.message || value}` : `Fulfilled: ${value}`;

  if (codeLine) {
    document.querySelectorAll('.code-line').forEach(l => l.classList.remove('active-resolve', 'active-reject'));
    codeLine.classList.add(`active-${stateClass}`);
  }

  await sleep(1000);

  // Find next edges
  const outEdges = graphData.edges.filter(e => e.source === nodeId);
  if (outEdges.length === 0) {
    isRunning = false;
    document.getElementById('run-btn').disabled = false;
    return; // End of chain
  }

  let nextEdge = null;
  let nextIsRejection = isRejection;
  let nextValue = value;

  // Promise chaining logic simulation
  if (nodeDef.type === 'catch') {
    // Catch resolves the chain unless it explicitly throws (we simulate normal return here)
    nextIsRejection = false;
    nextValue = 'Handled Error';
    nextEdge = outEdges.find(e => e.type === 'resolve');
  } else if (nodeDef.type === 'finally') {
    // Finally passes through the previous state
    nextEdge = outEdges[0]; // Usually only one out edge
  } else {
    // Source or Then
    if (isRejection) {
      // Find catch or finally
      nextEdge = outEdges.find(e => {
        const targetDef = graphData.nodes.find(n => n.id === e.target);
        return targetDef.type === 'catch' || targetDef.type === 'finally';
      });
      if(!nextEdge) nextEdge = outEdges.find(e => e.type === 'reject'); // Fallback to reject path
    } else {
      // Find then or finally
      nextEdge = outEdges.find(e => e.type === 'resolve');
      nextValue = `${value} processed`;
    }
  }

  if (nextEdge) {
    // Animate edge
    const edgeEl = document.getElementById(`edge-${nextEdge.source}-${nextEdge.target}`);
    const edgeStateClass = nextIsRejection ? 'rejected' : 'resolved';
    edgeEl.classList.add(edgeStateClass);
    edgeEl.querySelector('path').setAttribute('marker-end', `url(#arrow-${edgeStateClass})`);

    await sleep(800); // Wait for flow animation

    await simulateNodeExecution(nextEdge.target, nextIsRejection, nextValue);
  } else {
    // Unhandled or end
    isRunning = false;
    document.getElementById('run-btn').disabled = false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

init();

// For testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { graphData, simulateNodeExecution, resetGraph };
}