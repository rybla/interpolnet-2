import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvasContainer = document.getElementById('canvas-container');
const autoTessellationCheckbox = document.getElementById('auto-tessellation');
const tessellationSlider = document.getElementById('tessellation-slider');
const tessellationValue = document.getElementById('tessellation-value');
const wireframeToggle = document.getElementById('wireframe-toggle');
const polygonCountDisplay = document.getElementById('polygon-count');
const cameraDistanceDisplay = document.getElementById('camera-distance');

// Basic Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0d0e15, 0.05);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3.5;
controls.maxDistance = 20;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00ffcc, 1, 50);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff00ff, 1, 50);
pointLight2.position.set(-5, -5, 5);
scene.add(pointLight2);

// Geometry Object
let currentDetail = 0;
const baseRadius = 3;
let mesh;

const material = new THREE.MeshStandardMaterial({
  color: 0x222233,
  emissive: 0x111122,
  roughness: 0.5,
  metalness: 0.8,
  wireframe: wireframeToggle.checked,
  flatShading: true
});

function createGeometry(detailLevel) {
  // Free old geometry from memory
  if (mesh && mesh.geometry) {
    mesh.geometry.dispose();
  }

  const geometry = new THREE.IcosahedronGeometry(baseRadius, detailLevel);

  if (!mesh) {
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  } else {
    mesh.geometry = geometry;
  }

  // Update UI stats
  let triangles = 0;
  if (geometry.index) {
    triangles = geometry.index.count / 3;
  } else {
    triangles = geometry.attributes.position.count / 3;
  }
  polygonCountDisplay.textContent = triangles.toLocaleString();
}

// Initial setup
createGeometry(currentDetail);

// UI Event Listeners
autoTessellationCheckbox.addEventListener('change', (e) => {
  tessellationSlider.disabled = e.target.checked;
  if (!e.target.checked) {
    const manualVal = parseInt(tessellationSlider.value, 10);
    if (currentDetail !== manualVal) {
      currentDetail = manualVal;
      createGeometry(currentDetail);
    }
  }
});

tessellationSlider.addEventListener('input', (e) => {
  tessellationValue.textContent = e.target.value;
  if (!autoTessellationCheckbox.checked) {
    const val = parseInt(e.target.value, 10);
    if (currentDetail !== val) {
      currentDetail = val;
      createGeometry(currentDetail);
    }
  }
});

wireframeToggle.addEventListener('change', (e) => {
  material.wireframe = e.target.checked;
  material.needsUpdate = true;
});

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation and dynamic logic
function calculateAutoTessellation(distance) {
  // Map distance to detail level (0-6)
  // Closer distance = higher detail
  let targetDetail = 0;

  if (distance < 4) targetDetail = 6;
  else if (distance < 5.5) targetDetail = 5;
  else if (distance < 7) targetDetail = 4;
  else if (distance < 9) targetDetail = 3;
  else if (distance < 11.5) targetDetail = 2;
  else if (distance < 15) targetDetail = 1;
  else targetDetail = 0;

  return targetDetail;
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  // Calculate distance from camera to mesh center
  const distance = camera.position.distanceTo(mesh.position);
  cameraDistanceDisplay.textContent = distance.toFixed(2);

  if (autoTessellationCheckbox.checked) {
    const newDetail = calculateAutoTessellation(distance);

    // Update slider UI for visual feedback
    if (parseInt(tessellationSlider.value, 10) !== newDetail) {
      tessellationSlider.value = newDetail;
      tessellationValue.textContent = newDetail;
    }

    // Only recreate if detail level actually changed
    if (currentDetail !== newDetail) {
      currentDetail = newDetail;
      createGeometry(currentDetail);
    }
  }

  // Gentle auto-rotation for aesthetics
  mesh.rotation.x += 0.001;
  mesh.rotation.y += 0.002;

  renderer.render(scene, camera);
}

animate();
