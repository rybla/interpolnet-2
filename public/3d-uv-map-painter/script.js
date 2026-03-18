import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, cube;
let canvas, ctx, texture;

init();
animate();

function init() {
  // 1. Set up the 2D Canvas (UV Map)
  canvas = document.getElementById('uv-canvas');
  ctx = canvas.getContext('2d');

  // Fill initial background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw basic UV map layout (cross shape for a cube)
  drawUVLayout();

  // 2. Set up Three.js 3D View
  const container = document.getElementById('webgl-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#1e293b');

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 2.5;
  camera.position.y = 1.5;
  camera.position.x = 1.5;
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Create CanvasTexture from the 2D canvas
  texture = new THREE.CanvasTexture(canvas);
  // Optional: better filtering for painting
  texture.minFilter = THREE.LinearFilter;

  // Create Cube
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

  // Custom UV mapping for an unrolled cross layout
  // 4 columns, 3 rows
  // col 1: Left
  // col 2: Top, Front, Bottom
  // col 3: Right
  // col 4: Back

  const uvs = geometry.attributes.uv.array;

  // Each face has 4 vertices, 2 UV coords each -> 8 floats per face
  // Faces order: Right (0), Left (1), Top (2), Bottom (3), Front (4), Back (5)
  // Our grid: x in [0, 0.25, 0.5, 0.75, 1.0], y in [0, 0.333, 0.666, 1.0]
  // In UV space (0,0) is bottom-left

  const colSize = 1/4;
  const rowSize = 1/3;

  // Helper to set UVs for a face
  // tl: top-left, bl: bottom-left, tr: top-right, br: bottom-right
  // For three.js BoxGeometry, vertices per face are: [top-left, bottom-left, top-right, bottom-right]
  function setUVs(faceIndex, col, row) {
    const offset = faceIndex * 8;
    const x = col * colSize;
    const y = row * rowSize;
    // BoxGeometry uses triangle strips implicitly via indices, but the vertices are listed
    // TL, BL, TR, BR
    // Top-left
    uvs[offset + 0] = x;
    uvs[offset + 1] = y + rowSize;
    // Bottom-left
    uvs[offset + 2] = x;
    uvs[offset + 3] = y;
    // Top-right
    uvs[offset + 4] = x + colSize;
    uvs[offset + 5] = y + rowSize;
    // Bottom-right
    uvs[offset + 6] = x + colSize;
    uvs[offset + 7] = y;
  }

  // Map each face to the correct grid cell
  // The layout visually:
  // row 2 (top):        Top
  // row 1 (middle): Left Front Right Back
  // row 0 (bottom):     Bottom

  setUVs(0, 2, 1); // Right
  setUVs(1, 0, 1); // Left
  setUVs(2, 1, 2); // Top
  setUVs(3, 1, 0); // Bottom
  setUVs(4, 1, 1); // Front
  setUVs(5, 3, 1); // Back

  geometry.attributes.uv.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.1
  });

  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Set up 2D Canvas Drawing Logic
  setupDrawing();
  setupControls();
}

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let brushColor = '#ff00cc'; // Initial hot pink color
let brushSize = 10;

function setupControls() {
  const colorPicker = document.getElementById('colorPicker');
  const sizePicker = document.getElementById('brushSize');
  const clearBtn = document.getElementById('clearBtn');

  colorPicker.addEventListener('input', (e) => {
    brushColor = e.target.value;
  });

  sizePicker.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
  });

  clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawUVLayout();
    texture.needsUpdate = true;
  });
}

function setupDrawing() {
  canvas.addEventListener('pointerdown', startDrawing);
  canvas.addEventListener('pointermove', draw);
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointerout', stopDrawing);
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  // Calculate scale to account for responsive resizing of the canvas
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function startDrawing(e) {
  isDrawing = true;
  const pos = getPos(e);
  lastX = pos.x;
  lastY = pos.y;

  // Draw a dot on click
  ctx.beginPath();
  ctx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = brushColor;
  ctx.fill();

  texture.needsUpdate = true;
}

function draw(e) {
  if (!isDrawing) return;
  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = brushColor;
  ctx.lineWidth = brushSize;
  ctx.stroke();

  lastX = pos.x;
  lastY = pos.y;

  texture.needsUpdate = true;
}

function stopDrawing() {
  isDrawing = false;
}

function drawUVLayout() {
  const w = canvas.width;
  const h = canvas.height;
  const cw = w / 4;
  const ch = h / 3;

  // Draw the grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(i * cw, 0);
    ctx.lineTo(i * cw, h);
  }
  for (let i = 1; i < 3; i++) {
    ctx.moveTo(0, i * ch);
    ctx.lineTo(w, i * ch);
  }
  ctx.stroke();

  // Draw thick borders around the active faces
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;

  // row 2 (top):        Top (col 1)
  // row 1 (middle): Left(0) Front(1) Right(2) Back(3)
  // row 0 (bottom):     Bottom(col 1)
  // Canvas y goes down, UV y goes up.
  // So visually:
  // (col, row) where row 0 is top of canvas

  const faces = [
    { c: 1, r: 0, label: 'TOP' },
    { c: 0, r: 1, label: 'LEFT' },
    { c: 1, r: 1, label: 'FRONT' },
    { c: 2, r: 1, label: 'RIGHT' },
    { c: 3, r: 1, label: 'BACK' },
    { c: 1, r: 2, label: 'BOTTOM' }
  ];

  ctx.fillStyle = '#f1f5f9';

  // Gray out unused areas
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillRect(cw*2, 0, cw*2, ch);
  ctx.fillRect(0, ch*2, cw, ch);
  ctx.fillRect(cw*2, ch*2, cw*2, ch);

  faces.forEach(face => {
    ctx.strokeRect(face.c * cw, face.r * ch, cw, ch);

    // Add text labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(face.label, face.c * cw + cw/2, face.r * ch + ch/2);
  });
}

function onWindowResize() {
  const container = document.getElementById('webgl-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Slowly rotate the cube if the user isn't interacting
  // cube.rotation.x += 0.005;
  // cube.rotation.y += 0.005;

  controls.update();
  renderer.render(scene, camera);
}
