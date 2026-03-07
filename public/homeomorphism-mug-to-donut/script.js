const canvasContainer = document.getElementById('canvas-container');
const morphSlider = document.getElementById('morph-slider');
const playPauseBtn = document.getElementById('play-pause-btn');
const wireframeBtn = document.getElementById('wireframe-btn');

let isAutoPlaying = true;
let isWireframe = false;
let animationTime = 0;
const animationSpeed = 0.5; // rad per second

// Setup Three.js Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Dark theme background

// Setup Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0, 0);

// Setup Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

// Setup Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

// Generate Geometry
// A simple way to morph from a mug to a donut is to use a parametric surface or map a grid of vertices.
// We will use a grid of vertices (u, v) and map them to either a mug or a donut shape.
const uRes = 100; // Resolution around the shapes
const vRes = 50;  // Resolution along the profile

const geometry = new THREE.BufferGeometry();
const numVertices = (uRes + 1) * (vRes + 1);
const positions = new Float32Array(numVertices * 3);
const uvs = new Float32Array(numVertices * 2);
const indices = [];

const mugVertices = new Float32Array(numVertices * 3);
const donutVertices = new Float32Array(numVertices * 3);

// Helper function to create the grid
for (let i = 0; i <= vRes; i++) {
  const v = i / vRes;
  for (let j = 0; j <= uRes; j++) {
    const u = j / uRes;
    const index = i * (uRes + 1) + j;

    uvs[index * 2] = u;
    uvs[index * 2 + 1] = v;

    // --- Calculate Donut (Torus) Vertices ---
    const R = 1.0; // Major radius
    const r = 0.4; // Minor radius
    const thetaDonut = u * Math.PI * 2;
    const phiDonut = v * Math.PI * 2;

    const donutX = (R + r * Math.cos(phiDonut)) * Math.cos(thetaDonut);
    const donutY = r * Math.sin(phiDonut);
    const donutZ = (R + r * Math.cos(phiDonut)) * Math.sin(thetaDonut);

    donutVertices[index * 3] = donutX;
    donutVertices[index * 3 + 1] = donutY;
    donutVertices[index * 3 + 2] = donutZ;

    // --- Calculate Mug Vertices ---
    // A mug has a cup part and a handle part.
    // We can map u to the angle around the cup and the handle.
    // This is a simplified continuous mapping.
    let mugX, mugY, mugZ;

    const mugRadius = 0.8;
    const mugHeight = 2.0;
    const handleRadius = 0.4;
    const handleThickness = 0.15;

    // Map a portion of the v range to the cup and a portion to the handle
    // For a smooth transformation, we imagine the torus being squashed and stretched.
    // Let's create a continuous mapping from the torus (u, v) space to a mug shape.

    // The main body of the torus becomes the body of the cup.
    // A small section of the torus (e.g., u from 0 to 0.1) becomes the handle.
    // The rest (u from 0.1 to 1.0) becomes the cup.

    const handleUStart = 0.0;
    const handleUEnd = 0.15;

    if (u >= handleUStart && u <= handleUEnd) {
      // Handle logic
      // Map u to an angle for the handle's arc
      const normalizedU = (u - handleUStart) / (handleUEnd - handleUStart);
      const angleHandle = normalizedU * Math.PI; // Half-circle for handle

      const cx = mugRadius + handleRadius * Math.sin(angleHandle);
      const cy = handleRadius * Math.cos(angleHandle) + mugHeight / 2;

      mugX = cx + handleThickness * Math.cos(phiDonut) * Math.sin(angleHandle);
      mugY = cy + handleThickness * Math.sin(phiDonut);
      mugZ = handleThickness * Math.cos(phiDonut) * Math.cos(angleHandle);
    } else {
      // Cup logic
      const normalizedU = (u - handleUEnd) / (1.0 - handleUEnd);
      const thetaCup = normalizedU * Math.PI * 2;

      // v maps to the height of the cup and the bottom/top.
      // 0 to 0.2: bottom
      // 0.2 to 0.8: wall
      // 0.8 to 1.0: inner wall/bottom

      if (v < 0.2) {
        // Outer bottom
        const rad = mugRadius * (v / 0.2);
        mugX = rad * Math.cos(thetaCup);
        mugY = 0;
        mugZ = rad * Math.sin(thetaCup);
      } else if (v < 0.45) {
        // Outer wall
        const h = mugHeight * ((v - 0.2) / 0.25);
        mugX = mugRadius * Math.cos(thetaCup);
        mugY = h;
        mugZ = mugRadius * Math.sin(thetaCup);
      } else if (v < 0.55) {
          // Top rim
          const t = (v - 0.45) / 0.1;
          const rimAngle = t * Math.PI;
          const rimR = mugRadius - handleThickness/2 + handleThickness/2 * Math.cos(rimAngle);
          const rimY = mugHeight + handleThickness/2 * Math.sin(rimAngle);
          mugX = rimR * Math.cos(thetaCup);
          mugY = rimY;
          mugZ = rimR * Math.sin(thetaCup);
      } else if (v < 0.8) {
        // Inner wall
        const h = mugHeight * (1.0 - (v - 0.55) / 0.25);
        const innerRad = mugRadius - handleThickness;
        mugX = innerRad * Math.cos(thetaCup);
        mugY = h;
        mugZ = innerRad * Math.sin(thetaCup);
      } else {
        // Inner bottom
        const innerRad = mugRadius - handleThickness;
        const rad = innerRad * (1.0 - (v - 0.8) / 0.2);
        mugX = rad * Math.cos(thetaCup);
        mugY = handleThickness; // slightly above outer bottom
        mugZ = rad * Math.sin(thetaCup);
      }
    }

    // Center the mug
    mugY -= mugHeight / 2;

    mugVertices[index * 3] = mugX;
    mugVertices[index * 3 + 1] = mugY;
    mugVertices[index * 3 + 2] = mugZ;

    // Initial position is mug
    positions[index * 3] = mugX;
    positions[index * 3 + 1] = mugY;
    positions[index * 3 + 2] = mugZ;
  }
}

// Generate indices for faces
for (let i = 0; i < vRes; i++) {
  for (let j = 0; j < uRes; j++) {
    const a = i * (uRes + 1) + j;
    const b = i * (uRes + 1) + j + 1;
    const c = (i + 1) * (uRes + 1) + j;
    const d = (i + 1) * (uRes + 1) + j + 1;

    indices.push(a, b, d);
    indices.push(a, d, c);
  }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
geometry.setIndex(indices);
geometry.computeVertexNormals();

// Material
const material = new THREE.MeshStandardMaterial({
  color: 0x00ffcc, // Neon cyan/teal
  roughness: 0.3,
  metalness: 0.2,
  side: THREE.DoubleSide,
  wireframe: false
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Morphing Logic
function updateMorph(progress) {
  // progress: 0 is Mug, 1 is Donut
  const currentPositions = geometry.attributes.position.array;

  for (let i = 0; i < numVertices; i++) {
    const ix = i * 3;
    const iy = i * 3 + 1;
    const iz = i * 3 + 2;

    // Linear interpolation
    currentPositions[ix] = mugVertices[ix] * (1 - progress) + donutVertices[ix] * progress;
    currentPositions[iy] = mugVertices[iy] * (1 - progress) + donutVertices[iy] * progress;
    currentPositions[iz] = mugVertices[iz] * (1 - progress) + donutVertices[iz] * progress;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals(); // Recompute normals for proper lighting during morph
}

// UI Event Listeners
morphSlider.addEventListener('input', (e) => {
  if (isAutoPlaying) {
    toggleAutoPlay();
  }
  const progress = parseFloat(e.target.value);
  updateMorph(progress);
});

playPauseBtn.addEventListener('click', toggleAutoPlay);

function toggleAutoPlay() {
  isAutoPlaying = !isAutoPlaying;
  playPauseBtn.classList.toggle('active', isAutoPlaying);
  playPauseBtn.textContent = isAutoPlaying ? 'Auto-Play: ON' : 'Auto-Play: OFF';

  if (isAutoPlaying) {
    // Sync animation time to current slider value
    const currentProgress = parseFloat(morphSlider.value);
    // progress = (Math.sin(time) + 1) / 2
    // Math.asin(progress * 2 - 1) = time
    animationTime = Math.asin(currentProgress * 2 - 1) || 0;
  }
}

wireframeBtn.addEventListener('click', () => {
  isWireframe = !isWireframe;
  wireframeBtn.classList.toggle('active', isWireframe);
  wireframeBtn.textContent = isWireframe ? 'Wireframe: ON' : 'Wireframe: OFF';
  material.wireframe = isWireframe;
});

// Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (isAutoPlaying) {
    animationTime += delta * animationSpeed;
    // Oscillate between 0 and 1
    const progress = (Math.sin(animationTime) + 1) / 2;
    morphSlider.value = progress;
    updateMorph(progress);
  }

  // Slowly rotate the object
  mesh.rotation.y += delta * 0.2;
  mesh.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;

  renderer.render(scene, camera);
}

// Initial draw
updateMorph(0);
animate();