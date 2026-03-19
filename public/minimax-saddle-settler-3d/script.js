import * as THREE from 'three';

// Configuration
const CONFIG = {
  surfaceColor: 0x3b82f6,
  ballColor: 0xef4444,
  trailColor: 0x8b5cf6,
  gridColor: 0xffffff,
  bgColor: 0xf0f4f8,

  // Math bounds for the surface: [-range, range]
  range: 5,
  segments: 50,

  // Physics parameters
  learningRate: 0.05,
  damping: 0.95,

  // Max trailing line points
  maxTrailPoints: 200,
};

// Global variables
let scene, camera, renderer;
let surfaceMesh;
let ballMesh;
let trailLine;
let trailPositions;
let trailPointsCount = 0;

// Physics state
let currentPos = { x: 3, y: 3 };
let velocity = { x: 0, y: 0 };
let isDragging = false;

// Helpers
let raycaster, mouse;
let dragPlane;

init();
animate();

function init() {
  const container = document.getElementById('canvas-container');

  // 1. Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.bgColor);

  // 2. Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  // Position camera to look down at the saddle
  camera.position.set(10, 8, 10);
  camera.lookAt(0, 0, 0);

  // 3. Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-10, -20, -10);
  scene.add(directionalLight2);

  // 5. Build geometry
  buildSurface();
  buildBall();

  // 6. Interaction
  setupInteraction();

  // Resize handler
  window.addEventListener('resize', onWindowResize, false);
}

function setupInteraction() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Drag plane horizontal through the origin, just for raycasting
  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function onPointerDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // See if we clicked the ball
  const intersects = raycaster.intersectObject(ballMesh);
  if (intersects.length > 0) {
    isDragging = true;
    velocity = { x: 0, y: 0 }; // stop movement
    trailPointsCount = 0; // Clear trail
    trailLine.geometry.setDrawRange(0, 0);
    document.body.style.cursor = 'grabbing';
  } else {
    // Alternatively, if they click the surface, instantly move the ball
    const surfaceIntersects = raycaster.intersectObject(surfaceMesh);
    if (surfaceIntersects.length > 0) {
      const point = surfaceIntersects[0].point;
      currentPos.x = point.x;
      currentPos.y = point.z; // mapping calculus y -> 3D z
      velocity = { x: 0, y: 0 };
      trailPointsCount = 0; // Clear trail
      trailLine.geometry.setDrawRange(0, 0);

      // Also start drag
      isDragging = true;
      document.body.style.cursor = 'grabbing';
    }
  }
}

function onPointerMove(event) {
  if (!isDragging) {
    // Hover effect check
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([ballMesh, surfaceMesh]);
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
    return;
  }

  // Dragging logic
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Intersect the invisible plane to drag the ball along XZ freely
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, target);

  if (target) {
    // Clamp to surface bounds
    currentPos.x = Math.max(-CONFIG.range, Math.min(CONFIG.range, target.x));
    currentPos.y = Math.max(-CONFIG.range, Math.min(CONFIG.range, target.z));
    updateBallPosition();
  }
}

function onPointerUp() {
  isDragging = false;
  document.body.style.cursor = 'default';
}

// Function that defines the saddle surface mathematically (e.g., z = 0.1 * (x^2 - y^2))
function calcZ(x, y) {
  // We use a small scalar so the z values don't shoot up too fast within the range
  return 0.1 * (x * x - y * y);
}

function buildSurface() {
  const { range, segments } = CONFIG;

  const geometry = new THREE.BufferGeometry();

  // Create vertices, normals, and indices
  const vertices = [];
  const indices = [];

  const step = (range * 2) / segments;

  for (let i = 0; i <= segments; i++) {
    const y = i * step - range;
    for (let j = 0; j <= segments; j++) {
      const x = j * step - range;
      const z = calcZ(x, y);

      // In Three.js, Y is typically up, but we'll map our calculus (x,y)->z to 3D space:
      // x -> x
      // z -> y
      // y -> z
      vertices.push(x, z, y);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = i * (segments + 1) + j + 1;
      const c = (i + 1) * (segments + 1) + j;
      const d = (i + 1) * (segments + 1) + j + 1;

      // two triangles per quad
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: CONFIG.surfaceColor,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  surfaceMesh = new THREE.Mesh(geometry, material);
  scene.add(surfaceMesh);
}

function buildBall() {
  const geometry = new THREE.SphereGeometry(0.3, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: CONFIG.ballColor,
    roughness: 0.2,
    metalness: 0.5
  });

  ballMesh = new THREE.Mesh(geometry, material);
  scene.add(ballMesh);

  // Trail setup
  trailPositions = new Float32Array(CONFIG.maxTrailPoints * 3);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

  const trailMaterial = new THREE.LineBasicMaterial({
    color: CONFIG.trailColor,
    linewidth: 2,
    transparent: true,
    opacity: 0.7
  });

  trailLine = new THREE.Line(trailGeometry, trailMaterial);
  trailLine.frustumCulled = false; // Prevent disappearing if origin goes off screen
  scene.add(trailLine);

  updateBallPosition();
}

function updateBallPosition() {
  const z = calcZ(currentPos.x, currentPos.y);
  // Ball's radius is 0.3, so add a small offset so it "rolls" on top
  const newY = z + 0.3;
  ballMesh.position.set(currentPos.x, newY, currentPos.y);

  // Update trail
  if (!isDragging) {
    if (trailPointsCount < CONFIG.maxTrailPoints) {
      trailPositions[trailPointsCount * 3] = currentPos.x;
      trailPositions[trailPointsCount * 3 + 1] = newY;
      trailPositions[trailPointsCount * 3 + 2] = currentPos.y;
      trailPointsCount++;
    } else {
      // Shift array
      for (let i = 0; i < CONFIG.maxTrailPoints - 1; i++) {
        trailPositions[i * 3] = trailPositions[(i + 1) * 3];
        trailPositions[i * 3 + 1] = trailPositions[(i + 1) * 3 + 1];
        trailPositions[i * 3 + 2] = trailPositions[(i + 1) * 3 + 2];
      }
      trailPositions[(CONFIG.maxTrailPoints - 1) * 3] = currentPos.x;
      trailPositions[(CONFIG.maxTrailPoints - 1) * 3 + 1] = newY;
      trailPositions[(CONFIG.maxTrailPoints - 1) * 3 + 2] = currentPos.y;
    }

    // Tell Three.js we updated the buffer
    trailLine.geometry.setDrawRange(0, trailPointsCount);
    trailLine.geometry.attributes.position.needsUpdate = true;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Gradient calculation: [dz/dx, dz/dy]
// For z = 0.1 * (x^2 - y^2),
// dz/dx = 0.2 * x
// dz/dy = -0.2 * y
function calcGradient(x, y) {
  return {
    gx: 0.2 * x,
    gy: -0.2 * y
  };
}

function updatePhysics() {
  if (isDragging) return;

  const { gx, gy } = calcGradient(currentPos.x, currentPos.y);

  // Simultaneous gradient descent/ascent
  // Descent along x (move opposite to gradient)
  const forceX = -gx * CONFIG.learningRate;

  // Ascent along y (move along gradient)
  // Since gy is negative for positive y, ascending it pushes towards 0.
  // We want it to settle at (0,0). So if gy = -0.2y, we want to go opposite to the "valley" direction
  // For the saddle z=x^2-y^2, the gradient points away from 0 along x, and towards 0 along y.
  // Wait, dz/dx = 2x, dz/dy = -2y.
  // Gradient descent: x -= a * 2x (goes to 0)
  // Gradient ascent: y += a * (-2y) (goes to 0)
  const forceY = gy * CONFIG.learningRate;

  velocity.x += forceX;
  velocity.y += forceY;

  // Apply damping (friction)
  velocity.x *= CONFIG.damping;
  velocity.y *= CONFIG.damping;

  currentPos.x += velocity.x;
  currentPos.y += velocity.y;

  // Boundary checks (hard bounce)
  if (currentPos.x > CONFIG.range || currentPos.x < -CONFIG.range) {
    velocity.x *= -0.5;
    currentPos.x = Math.max(-CONFIG.range, Math.min(CONFIG.range, currentPos.x));
  }
  if (currentPos.y > CONFIG.range || currentPos.y < -CONFIG.range) {
    velocity.y *= -0.5;
    currentPos.y = Math.max(-CONFIG.range, Math.min(CONFIG.range, currentPos.y));
  }

  updateBallPosition();
}

function animate() {
  requestAnimationFrame(animate);

  updatePhysics();

  renderer.render(scene, camera);
}
