import * as THREE from 'three';

let scene, camera, renderer, mesh, directionalLight, ambientLight;
let currentTexture = null;

const stepsSlider = document.getElementById('steps-slider');
const stepsValueDisplay = document.getElementById('steps-value');
const lightSlider = document.getElementById('light-slider');
const lightValueDisplay = document.getElementById('light-value');
const gradientCanvas = document.getElementById('gradient-canvas');
const gradientCtx = gradientCanvas.getContext('2d');

function init() {
  const container = document.getElementById('canvas-container');

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lights
  ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  // Geometry and initial texture
  const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
  const material = new THREE.MeshToonMaterial({
    color: 0x58a6ff,
    gradientMap: createStepTexture(parseInt(stepsSlider.value))
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Initial UI sync
  updateVisualGradientMap(parseInt(stepsSlider.value));

  // Event listeners
  stepsSlider.addEventListener('input', (e) => {
    const steps = parseInt(e.target.value);
    stepsValueDisplay.textContent = steps;

    // Dispose old texture to prevent memory leak
    if (currentTexture) {
      currentTexture.dispose();
    }

    currentTexture = createStepTexture(steps);
    mesh.material.gradientMap = currentTexture;
    mesh.material.needsUpdate = true;

    updateVisualGradientMap(steps);
  });

  lightSlider.addEventListener('input', (e) => {
    const angleDeg = parseInt(e.target.value);
    lightValueDisplay.innerHTML = `${angleDeg}&deg;`;

    const angleRad = THREE.MathUtils.degToRad(angleDeg);
    directionalLight.position.set(Math.sin(angleRad), 1, Math.cos(angleRad)).normalize();
  });

  window.addEventListener('resize', onWindowResize);

  animate();
}

function createStepTexture(steps) {
  // Create a 1D texture for toon shading
  const colors = new Uint8Array(steps);
  for (let c = 0; c < steps; c++) {
    colors[c] = Math.floor((c / (steps - 1)) * 255);
  }

  const texture = new THREE.DataTexture(colors, steps, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

function updateVisualGradientMap(steps) {
  const width = gradientCanvas.width;
  const height = gradientCanvas.height;

  gradientCtx.clearRect(0, 0, width, height);

  const stepWidth = width / steps;

  for (let i = 0; i < steps; i++) {
    const intensity = Math.floor((i / (steps - 1)) * 255);
    gradientCtx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
    gradientCtx.fillRect(i * stepWidth, 0, Math.ceil(stepWidth), height);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (mesh) {
    mesh.rotation.y += 0.005;
    mesh.rotation.x += 0.002;
  }

  renderer.render(scene, camera);
}

// Ensure the code runs after everything is loaded
init();
