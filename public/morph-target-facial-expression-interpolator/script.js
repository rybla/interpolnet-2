import * as THREE from 'three';

// Global variables
let camera, scene, renderer;
let headMesh;

init();
animate();

function init() {
  const container = document.getElementById('canvas-container');

  // 1. Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1a2e');
  scene.fog = new THREE.FogExp2('#1a1a2e', 0.02);

  // 2. Camera setup
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 0, 15);

  // 3. Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xe94560, 1.2);
  dirLight1.position.set(10, 10, 10);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x0f3460, 1.5);
  dirLight2.position.set(-10, -10, -10);
  scene.add(dirLight2);

  const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
  pointLight.position.set(0, 5, 10);
  scene.add(pointLight);

  // Placeholder for Geometry logic
  createHeadMesh();

  // Resize listener
  window.addEventListener('resize', onWindowResize);
}

function createHeadMesh() {
  const geometry = new THREE.SphereGeometry(3, 32, 32);

  // Clone the base position attribute to modify it for the morph target
  const positionAttribute = geometry.attributes.position;
  const morphPositions = [];

  // Determine the vertex positions to form a "smile"
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    let dx = 0;
    let dy = 0;
    let dz = 0;

    // Smile logic: identify vertices in the lower front half representing the mouth
    // Adjust y and z positions conditionally
    const isFront = z > 1.5;
    const isLowerHalf = y < 0 && y > -2.5;

    if (isFront && isLowerHalf) {
      // Create a parabolic curve to pull the corners up and the center down slightly
      const smileCurve = Math.pow(x, 2) * 0.4;

      // Pull corners out and up, push center back
      dy = smileCurve - 0.2;
      dz = -0.5 * Math.abs(x);
      dx = x * 0.2; // widen the mouth slightly
    }

    // Apply a subtle general face fattening for the "smile" expression
    if (isFront && Math.abs(y) < 1.5) {
      dx += x * 0.1;
      dy += y * 0.05;
    }

    morphPositions.push(
      x + dx,
      y + dy,
      z + dz
    );
  }

  // Create the Float32Array from the new positions
  const morphAttribute = new THREE.Float32BufferAttribute(morphPositions, 3);

  // Add as morph attribute to the geometry
  geometry.morphAttributes.position = [];
  geometry.morphAttributes.position[0] = morphAttribute;

  // Material setup - distinct and aesthetic
  const material = new THREE.MeshStandardMaterial({
    color: 0xe2e2e2,
    roughness: 0.2,
    metalness: 0.8,
    wireframe: true, // Use wireframe to clearly show the vertex interpolations
    wireframeLinewidth: 2,
  });

  headMesh = new THREE.Mesh(geometry, material);
  headMesh.morphTargetInfluences = [0]; // Initialize morph influence

  scene.add(headMesh);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Rotate mesh slowly
  if (headMesh) {
    headMesh.rotation.y = Math.sin(time * 0.5) * 0.5;
    headMesh.rotation.x = Math.sin(time * 0.3) * 0.2;

    // Animate morph target influence
    // Sine wave normalized from [-1, 1] to [0, 1]
    const influence = (Math.sin(time * 2) + 1) / 2;
    headMesh.morphTargetInfluences[0] = influence;
  }

  renderer.render(scene, camera);
}
