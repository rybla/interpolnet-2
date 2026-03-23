// Initialize Scene, Camera, and Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Move camera back further and up so we can see the whole surface
camera.position.set(5, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Setup OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0); // Ensure it orbits around the origin

// Surface Math Parameters
const A = 1.0; // x^2 coefficient
const B = 1.0; // z^2 coefficient
const SCALE = 2.0;

function saddleFunction(u, v, target) {
  // Map u, v from [0, 1] to [-2, 2]
  const x = (u - 0.5) * 4 * SCALE;
  const z = (v - 0.5) * 4 * SCALE;
  // f(x, z) = A * x^2 - B * z^2 (scaled down for visualization)
  const y = (A * x * x - B * z * z) * 0.5; // INCREASED scale for y to make it more visible!
  target.set(x, y, z);
}

// Create Saddle Surface
const geometry = new THREE.ParametricGeometry(saddleFunction, 40, 40);

// Use a distinct "blueprint" aesthetic: wireframe overlay on a solid dark material
const material = new THREE.MeshPhongMaterial({
  color: 0x111b2b,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.9,
  shininess: 50
});
const surfaceMesh = new THREE.Mesh(geometry, material);
scene.add(surfaceMesh);

const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffcc,
  wireframe: true,
  transparent: true,
  opacity: 0.8 // Increased opacity to make sure it shows
});
const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
scene.add(wireframeMesh);

// Create the Rolling Ball
const ballRadius = 0.4;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({
  color: 0xff00ff,
  emissive: 0x440044,
  shininess: 100
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Highlight the saddle point
const centerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const centerPoint = new THREE.Mesh(centerGeometry, centerMaterial);
scene.add(centerPoint);

// Interaction State
let isDragging = false;
// Start the ball off-center so we can watch it roll
let currentX = 3.0;
let currentZ = 0.5;

// Raycasting for Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Temporary plane for dragging

function updateMouse(event) {
  let clientX = event.clientX;
  let clientY = event.clientY;

  // Handle touch events
  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
  }

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(ball);

  if (intersects.length > 0) {
    isDragging = true;
    controls.enabled = false; // Disable camera rotation while dragging ball
  }
}

function onPointerMove(event) {
  if (!isDragging) return;

  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);

  // Create a plane that faces the camera and passes through the ball to intersect against
  const ballPosition = new THREE.Vector3(currentX, ball.position.y, currentZ);
  plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), ballPosition);

  const targetPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, targetPoint);

  if (targetPoint) {
      // Limit dragging bounds to the surface
      currentX = Math.max(-2 * SCALE, Math.min(2 * SCALE, targetPoint.x));
      currentZ = Math.max(-2 * SCALE, Math.min(2 * SCALE, targetPoint.z));
  }
}

function onPointerUp() {
  isDragging = false;
  controls.enabled = true;
}

// Add event listeners for both mouse and touch
window.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

window.addEventListener('touchstart', onPointerDown, { passive: false });
window.addEventListener('touchmove', onPointerMove, { passive: false });
window.addEventListener('touchend', onPointerUp);

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Physics parameters
const learningRate = 0.05; // Increased speed for testing
const friction = 0.90; // Dampening factor
let vx = 0;
let vz = 0;

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  if (!isDragging) {
    // Minimax Physics Loop:
    // f(x, z) = A*x^2 - B*z^2

    // Gradient Descent on X (roll towards x=0)
    const forceX = -2 * A * currentX;

    // Gradient Ascent on Z (roll towards z=0)
    // -2 * B * z is negative when z is positive, so it pushes z towards 0.
    const forceZ = -2 * B * currentZ;

    vx += forceX * learningRate;
    vz += forceZ * learningRate;

    // Apply friction to settle
    vx *= friction;
    vz *= friction;

    currentX += vx;
    currentZ += vz;

    // Simple boundary clamping to avoid flying off the screen infinitely
    if (Math.abs(currentX) > 2 * SCALE) {
        currentX = Math.sign(currentX) * 2 * SCALE;
        vx = -vx * 0.5;
    }
    if (Math.abs(currentZ) > 2 * SCALE) {
        currentZ = Math.sign(currentZ) * 2 * SCALE;
        vz = -vz * 0.5;
    }
  } else {
      // Reset velocities if dragged
      vx = 0;
      vz = 0;
  }

  // Calculate new Y position based on the surface equation
  const currentY = (A * currentX * currentX - B * currentZ * currentZ) * 0.5;

  // Update ball position, offset slightly by radius so it sits ON the surface
  ball.position.set(currentX, currentY + ballRadius * 0.8, currentZ);

  controls.update();
  renderer.render(scene, camera);
}

animate();
