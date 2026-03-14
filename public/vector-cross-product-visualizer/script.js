import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

// Setup Scene, Camera, Renderer
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 5, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Add Grid and Axes
const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0x444455);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Variables
const origin = new THREE.Vector3(0, 0, 0);

// Colors
const COLOR_A = 0x3b82f6; // Blue
const COLOR_B = 0xef4444; // Red
const COLOR_C = 0x10b981; // Green
const COLOR_AREA = 0xf59e0b; // Amber

// Vector Data
const vecA = new THREE.Vector3(2, 0, 0);
const vecB = new THREE.Vector3(1, 2, 0);
const vecC = new THREE.Vector3(); // A x B

// Arrow Helpers
const arrowA = new THREE.ArrowHelper(vecA.clone().normalize(), origin, vecA.length(), COLOR_A, 0.3, 0.2);
const arrowB = new THREE.ArrowHelper(vecB.clone().normalize(), origin, vecB.length(), COLOR_B, 0.3, 0.2);
const arrowC = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 1, COLOR_C, 0.3, 0.2);

scene.add(arrowA);
scene.add(arrowB);
scene.add(arrowC);

// Interactive Handles
const handleGeo = new THREE.SphereGeometry(0.2, 16, 16);
const handleMatA = new THREE.MeshStandardMaterial({ color: COLOR_A, roughness: 0.2, metalness: 0.1 });
const handleMatB = new THREE.MeshStandardMaterial({ color: COLOR_B, roughness: 0.2, metalness: 0.1 });

const handleA = new THREE.Mesh(handleGeo, handleMatA);
handleA.position.copy(vecA);
scene.add(handleA);

const handleB = new THREE.Mesh(handleGeo, handleMatB);
handleB.position.copy(vecB);
scene.add(handleB);

// Parallelogram Area
const areaGeo = new THREE.BufferGeometry();
const areaMat = new THREE.MeshBasicMaterial({ color: COLOR_AREA, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
const areaMesh = new THREE.Mesh(areaGeo, areaMat);
scene.add(areaMesh);

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

const dragControls = new DragControls([handleA, handleB], camera, renderer.domElement);

dragControls.addEventListener('dragstart', function (event) {
  orbitControls.enabled = false;

  if (event.object === handleA) document.getElementById('val-a').classList.add('glowing');
  if (event.object === handleB) document.getElementById('val-b').classList.add('glowing');
  document.getElementById('val-c').classList.add('glowing');
  document.getElementById('val-area').classList.add('glowing');
});

dragControls.addEventListener('drag', function (event) {
  updateVectors();
});

dragControls.addEventListener('dragend', function (event) {
  orbitControls.enabled = true;

  document.getElementById('val-a').classList.remove('glowing');
  document.getElementById('val-b').classList.remove('glowing');
  document.getElementById('val-c').classList.remove('glowing');
  document.getElementById('val-area').classList.remove('glowing');
});

// UI Elements
const uiValA = document.getElementById('val-a');
const uiValB = document.getElementById('val-b');
const uiValC = document.getElementById('val-c');
const uiValArea = document.getElementById('val-area');

function formatVec(v) {
  return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
}

function updateVectors() {
  vecA.copy(handleA.position);
  vecB.copy(handleB.position);

  // Calculate Cross Product
  vecC.crossVectors(vecA, vecB);

  // Update Arrows
  const lenA = vecA.length();
  if (lenA > 0.001) {
    arrowA.setDirection(vecA.clone().normalize());
    arrowA.setLength(lenA, 0.3, 0.2);
  }

  const lenB = vecB.length();
  if (lenB > 0.001) {
    arrowB.setDirection(vecB.clone().normalize());
    arrowB.setLength(lenB, 0.3, 0.2);
  }

  const lenC = vecC.length();
  if (lenC > 0.001) {
    arrowC.setDirection(vecC.clone().normalize());
    arrowC.setLength(lenC, 0.3, 0.2);
    arrowC.visible = true;
  } else {
    arrowC.visible = false;
  }

  // Update Area Parallelogram
  // Vertices: (0,0,0), A, A+B, B
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = vecA.clone();
  const p2 = vecA.clone().add(vecB);
  const p3 = vecB.clone();

  // Define triangles for the quad (p0, p1, p2) and (p0, p2, p3)
  const vertices = new Float32Array([
    p0.x, p0.y, p0.z,
    p1.x, p1.y, p1.z,
    p2.x, p2.y, p2.z,

    p0.x, p0.y, p0.z,
    p2.x, p2.y, p2.z,
    p3.x, p3.y, p3.z
  ]);

  areaGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  areaGeo.computeVertexNormals();

  // Update UI
  uiValA.innerText = formatVec(vecA);
  uiValB.innerText = formatVec(vecB);
  uiValC.innerText = formatVec(vecC);
  uiValArea.innerText = lenC.toFixed(2);
}

// Initial update
updateVectors();

// Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
}

animate();
