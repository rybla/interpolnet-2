import * as THREE from 'three';
import { Evaluator, Brush, SUBTRACTION, INTERSECTION, ADDITION } from 'three-bvh-csg';

// 1. Scene Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a); // Match CSS --color-bg

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// 2. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5); // Primary color tint
dirLight2.position.set(-5, 5, -5);
scene.add(dirLight2);

// Add a floor grid
const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x334155);
gridHelper.position.y = -1;
scene.add(gridHelper);

// 3. CSG Setup
let brush1, brush2;
let resultMesh, wireframeMesh;
let evaluator;
let currentOperation = SUBTRACTION;
let showWireframe = false;
let showBaseShapes = true;

const materialBase1 = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.3,
  roughness: 0.2,
  metalness: 0.5,
  side: THREE.DoubleSide
});

const materialBase2 = new THREE.MeshStandardMaterial({
  color: 0xf472b6, // Pinkish accent
  transparent: true,
  opacity: 0.3,
  roughness: 0.2,
  metalness: 0.5,
  side: THREE.DoubleSide
});

const materialResult = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.1,
  metalness: 0.8,
  side: THREE.DoubleSide
});

const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.15
});

function initCSG() {
  // Create Base Brushes
  brush1 = new Brush(new THREE.BoxGeometry(2, 2, 2), materialBase1);
  brush2 = new Brush(new THREE.SphereGeometry(1.2, 32, 32), materialBase2);

  // Initial positions
  brush1.position.set(0, 0, 0);
  brush2.position.set(1, 1, 1);

  brush1.updateMatrixWorld();
  brush2.updateMatrixWorld();

  scene.add(brush1);
  scene.add(brush2);

  // Setup Evaluator and Result Mesh
  evaluator = new Evaluator();
  evaluator.attributes = ['position', 'normal'];
  evaluator.useGroups = false;

  resultMesh = new THREE.Mesh(new THREE.BufferGeometry(), materialResult);
  resultMesh.castShadow = true;
  resultMesh.receiveShadow = true;
  scene.add(resultMesh);

  wireframeMesh = new THREE.Mesh(resultMesh.geometry, wireframeMaterial);
  scene.add(wireframeMesh);
  wireframeMesh.visible = showWireframe;

  updateCSG();
}

function updateCSG() {
  brush1.updateMatrixWorld();
  brush2.updateMatrixWorld();

  let operation;
  switch (currentOperation) {
    case 'SUBTRACTION': operation = SUBTRACTION; break;
    case 'INTERSECTION': operation = INTERSECTION; break;
    case 'ADDITION': operation = ADDITION; break;
    default: operation = SUBTRACTION;
  }

  const result = evaluator.evaluate(brush1, brush2, operation);
  resultMesh.geometry.dispose();
  resultMesh.geometry = result.geometry;

  // Wireframe shares the same geometry instance logically but let's re-assign just in case
  wireframeMesh.geometry = result.geometry;
}

initCSG();

// 4. UI Controls
document.querySelectorAll('input[name="operation"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentOperation = e.target.value;
    updateCSG();
  });
});

document.getElementById('show-wireframe').addEventListener('change', (e) => {
  showWireframe = e.target.checked;
  wireframeMesh.visible = showWireframe;
});

document.getElementById('show-base-shapes').addEventListener('change', (e) => {
  showBaseShapes = e.target.checked;
  brush1.visible = showBaseShapes;
  brush2.visible = showBaseShapes;
});

// 5. Interaction (Drag and Drop)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggingBrush = null;
let offset = new THREE.Vector3();
let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let intersection = new THREE.Vector3();

function onPointerDown(event) {
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([brush1, brush2]);

  if (intersects.length > 0 && showBaseShapes) {
    // Only allow dragging if base shapes are visible/interactable
    draggingBrush = intersects[0].object;

    // Create a plane passing through the object parallel to the camera
    plane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(plane.normal),
      draggingBrush.position
    );

    if (raycaster.ray.intersectPlane(plane, intersection)) {
      offset.copy(intersection).sub(draggingBrush.position);
    }

    // Optional: make it pop or glow
    draggingBrush.material.opacity = 0.5;
  }
}

function onPointerMove(event) {
  if (!draggingBrush) return;

  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (raycaster.ray.intersectPlane(plane, intersection)) {
    draggingBrush.position.copy(intersection.sub(offset));
    updateCSG(); // Re-evaluate in real-time
  }
}

function onPointerUp() {
  if (draggingBrush) {
    draggingBrush.material.opacity = 0.3;
    draggingBrush = null;
  }
}

container.addEventListener('pointerdown', onPointerDown);
container.addEventListener('pointermove', onPointerMove);
container.addEventListener('pointerup', onPointerUp);
container.addEventListener('pointerleave', onPointerUp);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
