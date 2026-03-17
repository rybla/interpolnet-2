// Marching Cubes Isosurface Main Script

let scene, camera, renderer;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let effect;
let resolution = 40;
let time = 0;

function init() {
  const container = document.getElementById('canvas-container');

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a); // Match the dark background

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 80);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(1, 1, 1);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0x0ea5e9, 0.6); // Cyan accent light
  directionalLight2.position.set(-1, -0.5, -1);
  scene.add(directionalLight2);

  const pointLight = new THREE.PointLight(0xff00ff, 0.5); // Magenta accent light
  pointLight.position.set(0, 50, 0);
  scene.add(pointLight);

  // Camera interaction (Orbit Controls replacement)
  setupInteraction(container);

  // Marching Cubes Setup
  setupMarchingCubes();

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);

  // Handle threshold slider changes
  const thresholdSlider = document.getElementById('threshold');
  const thresholdValueDisplay = document.getElementById('threshold-value');

  if (thresholdSlider && thresholdValueDisplay) {
    // We reverse the math here for intuition:
    // Higher threshold value usually means smaller blobs on screen,
    // which in MarchingCubes is achieved by higher isolation.
    // However, the user range is 0 to 1.
    // Let's map 0 -> 100 and 1 -> 10 isolation

    thresholdSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        thresholdValueDisplay.textContent = val.toFixed(2);

        // isolation goes from large (thin blobs) to small (thick blobs)
        effect.isolation = 10 + (1 - val) * 90;
    });

    // Set initial
    effect.isolation = 10 + (1 - parseFloat(thresholdSlider.value)) * 90;
  }

  // Start animation loop
  animate();
}

function setupMarchingCubes() {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9, // Cyan color
    metalness: 0.1,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });

  effect = new THREE.MarchingCubes(resolution, material, true, true, 100000);
  effect.position.set(0, 0, 0);
  effect.scale.set(30, 30, 30);

  // Initial threshold setup
  const thresholdSlider = document.getElementById('threshold');
  if(thresholdSlider) {
    effect.isolation = parseFloat(thresholdSlider.value);
  } else {
    effect.isolation = 50; // default mapped isolation
  }

  scene.add(effect);
}

function updateCubes(object, time, numblobs) {
  object.reset();

  const subtract = 12;
  const strength = 1.2 / ((Math.sqrt(numblobs) - 1) / 4 + 1);

  // Define a few moving points (blobs) that populate the 3D scalar field
  for (let i = 0; i < numblobs; i++) {
    const ballx = Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5;
    const bally = Math.abs(Math.cos(i + 1.12 * time * Math.cos(1.22 + 0.1424 * i))) * 0.77 + 0.2; // bouncy
    const ballz = Math.cos(i + 1.32 * time * 0.1 * Math.sin(0.92 + 0.53 * i)) * 0.27 + 0.5;

    // Evaluate the scalar field values based on grid coordinates over time
    object.addBall(ballx, bally, ballz, strength, subtract);
  }

  // Update the mesh
  // The MarchingCubes script updates geometry automatically after adding balls if isolation changes or via geometry computation
  // `update` is a method on geometry, but `addBall` triggers internal flag.
  // There is no `update()` on the MarchingCubes object itself in r128.
  // We can just rely on `addBall` setting the `has_blobs` flag and `update` logic inside `render`.
}

function setupInteraction(element) {
  element.addEventListener('pointerdown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  element.addEventListener('pointermove', (e) => {
    if (isDragging) {
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      // Simple rotation around origin
      const rotationSpeed = 0.005;

      // Calculate new camera position around the origin
      const radius = camera.position.length();

      // Convert to spherical coordinates roughly
      let theta = Math.atan2(camera.position.x, camera.position.z);
      let phi = Math.acos(camera.position.y / radius);

      theta -= deltaMove.x * rotationSpeed;
      phi -= deltaMove.y * rotationSpeed;

      // Clamp phi to avoid flipping
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);

      camera.lookAt(scene.position);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  document.addEventListener('pointerup', () => {
    isDragging = false;
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  time += 0.01;

  if (effect) {
    // Update scalar field (e.g. 10 moving blobs)
    updateCubes(effect, time, 10);
  }

  renderer.render(scene, camera);
}

// Ensure the code runs after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
});
