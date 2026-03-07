// Let's use standard Three.js geometry and modify vertex positions on the CPU
// to make it easier to debug and ensure it renders properly without raw shader compilation issues.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Global variables ---
let scene, camera, renderer, controls;
let mesh;
let time = 0;
let morphState = 0;

// --- DOM Elements ---
const canvasContainer = document.getElementById('canvas-container');
const morphSlider = document.getElementById('morph-slider');
const morphValueDisplay = document.getElementById('morph-value');
const wireframeToggle = document.getElementById('wireframe-toggle');

// --- Initialization ---
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);
  scene.fog = new THREE.FogExp2(0x0b0f19, 0.04);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 5, 12);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasContainer.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;
  controls.target.set(0, 0, 0);

  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });

  const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xff00ff, 3.0);
  dirLight1.position.set(5, 5, 5);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x00ffff, 2.0);
  dirLight2.position.set(-5, 5, -5);
  scene.add(dirLight2);

  const dirLight3 = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight3.position.set(0, -5, 5);
  scene.add(dirLight3);

  createMorphingObject();

  window.addEventListener('resize', onWindowResize);

  morphSlider.addEventListener('input', (e) => {
    morphState = parseFloat(e.target.value);
    morphValueDisplay.textContent = Math.round(morphState * 100) + '%';
    updateGeometry(morphState);
  });

  wireframeToggle.addEventListener('change', (e) => {
    mesh.material.wireframe = e.target.checked;
  });

  animate();
}

// Parametric function to map (u, v) -> (x, y, z) for morph t
function getShape(u, v, t) {
  const PI = Math.PI;
  const theta = u * 2.0 * PI;
  const phi = v * 2.0 * PI;

  const R = 1.8;
  const r = 0.6;

  let angle = theta;
  if (angle > PI) angle -= 2.0 * PI;

  const handleMask = Math.exp(-Math.pow(angle / 0.4, 4.0));
  const bodyMask = 1.0 - handleMask;

  const c_phi = Math.cos(phi);
  const s_phi = Math.sin(phi);

  const smoothstep = (edge0, edge1, x) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };

  const innerMask = smoothstep(0.2, -0.2, c_phi);
  const outerMask = 1.0 - innerMask;

  const posTorus = new THREE.Vector3(
    (R + r * c_phi) * Math.cos(theta),
    r * s_phi,
    (R + r * c_phi) * Math.sin(theta)
  );

  const y_stretch = 3.0;
  let y_cup = s_phi * y_stretch;

  if (s_phi < -0.3) {
     y_cup = y_cup * (1 - smoothstep(-0.3, -0.8, s_phi)) + (-y_stretch * 0.3 - 0.5 * (s_phi + 0.3)) * smoothstep(-0.3, -0.8, s_phi);
  }

  let rad_cup = R + r * c_phi * 0.3;

  if (c_phi < 0.0 && s_phi > -0.5) {
     y_cup -= 2.5 * (-c_phi);
  }

  const handleOut = handleMask * outerMask * 1.5;
  rad_cup += handleOut;

  y_cup = y_cup * (1 - handleMask) + (s_phi * 1.5) * handleMask;

  const posCup = new THREE.Vector3(
    rad_cup * Math.cos(theta),
    y_cup,
    rad_cup * Math.sin(theta)
  );

  return posCup.lerp(posTorus, t);
}

function createMorphingObject() {
  const radialSegments = 120;
  const tubularSegments = 120;

  const geometry = new THREE.PlaneGeometry(1, 1, radialSegments, tubularSegments);

  // Create a material
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x222233,
    metalness: 0.1,
    roughness: 0.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
    wireframe: false
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Store original uv for the update loop
  const uvs = geometry.attributes.uv.array;
  geometry.userData.uvs = new Float32Array(uvs);

  updateGeometry(0);
}

function updateGeometry(t) {
  const positionAttr = mesh.geometry.attributes.position;
  const uvs = mesh.geometry.userData.uvs;

  for (let i = 0; i < positionAttr.count; i++) {
    const u = uvs[i * 2];
    const v = uvs[i * 2 + 1];

    // Smoothstep t for easing
    const easedT = t * t * (3 - 2 * t);

    const pos = getShape(u, v, easedT);

    positionAttr.setXYZ(i, pos.x, pos.y, pos.z);
  }

  positionAttr.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

function animate() {
  requestAnimationFrame(animate);

  time += 0.016;

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
