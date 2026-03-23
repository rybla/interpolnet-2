import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 2D Canvas Painting Logic ---
const canvas = document.getElementById('uv-canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const clearBtn = document.getElementById('clear-btn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let textureNeedsUpdate = false;

// Initial setup: draw the UV grid layout
function drawUVLayout() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cellSize = canvas.width / 4; // 4 columns
  // Grid pattern for a standard unrolled cube (cross shape)
  // [ ][T][ ][ ]
  // [L][F][R][B]
  // [ ][Bo][ ][ ]
  // T=Top, L=Left, F=Front, R=Right, B=Back, Bo=Bottom

  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;

  // Draw outlines for the 6 faces
  const faces = [
    { x: 1, y: 0, label: 'Top' },
    { x: 0, y: 1, label: 'Left' },
    { x: 1, y: 1, label: 'Front' },
    { x: 2, y: 1, label: 'Right' },
    { x: 3, y: 1, label: 'Back' },
    { x: 1, y: 2, label: 'Bottom' }
  ];

  faces.forEach(face => {
    ctx.strokeRect(face.x * cellSize, face.y * cellSize, cellSize, cellSize);

    // Add light label
    ctx.fillStyle = '#eeeeee';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(face.label, face.x * cellSize + cellSize / 2, face.y * cellSize + cellSize / 2);
  });

  // Grey out unused areas to make it clear where to paint
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  const unused = [
    { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
    { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
    { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }
  ];
  unused.forEach(cell => {
    ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
  });

  textureNeedsUpdate = true;
}

drawUVLayout();

// Painting functionality
function getCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function startDrawing(e) {
  isDrawing = true;
  const coords = getCoordinates(e);
  lastX = coords.x;
  lastY = coords.y;
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault(); // Prevent scrolling on touch

  const coords = getCoordinates(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(coords.x, coords.y);
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = brushSize.value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  lastX = coords.x;
  lastY = coords.y;

  textureNeedsUpdate = true;
}

function stopDrawing() {
  isDrawing = false;
}

// Event listeners for painting
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);

clearBtn.addEventListener('click', () => {
  drawUVLayout();
});

// --- Three.js 3D Logic ---
const container = document.getElementById('three-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a35); // Match panel background

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(2, 2, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;

// Create texture from the 2D canvas
const texture = new THREE.CanvasTexture(canvas);
// Ensure crisp pixel rendering if desired, or smooth. Using smooth for painting.
texture.colorSpace = THREE.SRGBColorSpace;
// Adjust texture mapping to match our UV layout
// We need to remap UVs of a BoxGeometry to match our layout
// However, the simplest way is to create a custom geometry or manually edit BoxGeometry UVs.
// Since BoxGeometry default UVs map the whole texture to each face, we need to customize it.

const geometry = new THREE.BoxGeometry(1, 1, 1);
const uvAttribute = geometry.attributes.uv;

// Standard layout mapping:
// We defined 4 columns, 4 rows (1024x1024 total, each face 256x256).
// Row 0 (top): empty, Top, empty, empty
// Row 1: Left, Front, Right, Back
// Row 2: empty, Bottom, empty, empty
// Note: WebGL UVs (0,0) is bottom-left, (1,1) is top-right.
// Our canvas layout (0,0) is top-left.
// So we need to invert Y coordinates.

const cSize = 0.25; // cell size in UV space
const uvs = new Float32Array(geometry.attributes.uv.array.length);

// Face order in BoxGeometry: Right(0), Left(1), Top(2), Bottom(3), Front(4), Back(5)
// Let's define the cells (x, y from bottom-left)
// Top: x=1, y=3
// Bottom: x=1, y=1
// Left: x=0, y=2
// Front: x=1, y=2
// Right: x=2, y=2
// Back: x=3, y=2
const faceCoords = [
  { x: 2, y: 2 }, // Right
  { x: 0, y: 2 }, // Left
  { x: 1, y: 3 }, // Top
  { x: 1, y: 1 }, // Bottom
  { x: 1, y: 2 }, // Front
  { x: 3, y: 2 }  // Back
];

for (let i = 0; i < 6; i++) {
  const offset = i * 8;
  const fc = faceCoords[i];
  // 4 vertices per face. Standard UVs are: (0,1), (1,1), (0,0), (1,0)
  // Let's map them to our grid

  // Vertex 0: bottom-left (wait, threejs BoxGeometry order is usually different)
  // Let's rely on modifying the existing 0-1 range to the specific cell
  for (let j = 0; j < 4; j++) {
    const origU = uvAttribute.array[offset + j * 2];
    const origV = uvAttribute.array[offset + j * 2 + 1];

    uvs[offset + j * 2] = fc.x * cSize + origU * cSize;
    uvs[offset + j * 2 + 1] = fc.y * cSize + origV * cSize;
  }
}

geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

const material = new THREE.MeshStandardMaterial({
  map: texture,
  roughness: 0.5,
  metalness: 0.1
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // If the user painted on the canvas, update the texture
  if (textureNeedsUpdate) {
    texture.needsUpdate = true;
    textureNeedsUpdate = false;
  }

  controls.update(); // Required for damping and autoRotate

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Stop auto-rotation when user interacts with the 3D view
controls.addEventListener('start', () => {
  controls.autoRotate = false;
});
