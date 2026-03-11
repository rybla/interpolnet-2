/**
 * 3D Facial Expression Morphing
 * Demonstrates vertex interpolation between a neutral base mesh and a smiling target mesh.
 */

const init = () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // 1. Setup Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 2. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x00ffcc, 0.3);
  fillLight.position.set(-5, 0, 5);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0xff00ff, 0.4);
  backLight.position.set(0, 5, -5);
  scene.add(backLight);

  // 3. Generate Base Geometry (Neutral Face)
  // We'll use a modified sphere to act as a stylized face.
  const radius = 1.5;
  const widthSegments = 32;
  const heightSegments = 32;
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

  // Convert to BufferGeometry if not already (SphereGeometry in r128 is BufferGeometry)
  // Store the original positions for the neutral face
  const positionAttribute = geometry.attributes.position;

  // We will deform the front part of the sphere to look more like a face
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    // Front of the face is roughly z > 0.5
    if (z > 0.5) {
      // Flatten the face slightly
      positionAttribute.setZ(i, z * 0.8);

      // Indent eyes
      if (y > 0.2 && y < 0.8 && Math.abs(x) > 0.3 && Math.abs(x) < 0.8) {
        positionAttribute.setZ(i, positionAttribute.getZ(i) - 0.2);
      }

      // Protrude nose
      if (y > -0.2 && y < 0.3 && Math.abs(x) < 0.2) {
        positionAttribute.setZ(i, positionAttribute.getZ(i) + 0.3);
      }
    }
  }

  // Recompute normals after our manual base deformation
  geometry.computeVertexNormals();

  // Create an array to hold the morph target positions (the smile)
  const smilePositions = [];

  // 4. Create Morph Target (Smile)
  for (let i = 0; i < positionAttribute.count; i++) {
    let x = positionAttribute.getX(i);
    let y = positionAttribute.getY(i);
    let z = positionAttribute.getZ(i);

    // Identify mouth region: roughly bottom front
    if (z > 0.5 && y > -1.0 && y < -0.2 && Math.abs(x) < 0.8) {
      // Pull corners of the mouth up and out to create a smile
      const isCorner = Math.abs(x) > 0.3;
      if (isCorner) {
        y += 0.3; // Pull up
        z -= 0.1; // Pull back into cheeks
      } else {
        y -= 0.1; // Drop center slightly
        z -= 0.05; // Pull back slightly
      }

      // Bulge cheeks slightly
      if (y > -0.3 && y < 0.1 && Math.abs(x) > 0.6 && Math.abs(x) < 1.2) {
        z += 0.1;
        y += 0.1;
      }
    }

    smilePositions.push(x, y, z);
  }

  // Add the morph attribute to the geometry
  geometry.morphAttributes.position = [];
  geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(smilePositions, 3);

  // 5. Material & Mesh
  const material = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.4,
    metalness: 0.1,
    morphTargets: true, // Enable morph targets in material
    wireframe: true, // Show wireframe to clearly see vertex interpolation
    transparent: true,
    opacity: 0.8
  });

  const faceMesh = new THREE.Mesh(geometry, material);
  scene.add(faceMesh);

  // Add a faint solid inner mesh for better visual depth
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    morphTargets: true,
  });
  const innerMesh = new THREE.Mesh(geometry, innerMaterial);
  innerMesh.scale.set(0.98, 0.98, 0.98);
  scene.add(innerMesh);

  // 6. UI Interaction
  const morphSlider = document.getElementById('morph-weight');
  const morphValueDisplay = document.getElementById('morph-weight-value');

  if (morphSlider && morphValueDisplay) {
    morphSlider.addEventListener('input', (event) => {
      const weight = parseFloat(event.target.value);
      morphValueDisplay.textContent = weight.toFixed(2);

      // Apply weight to the morph target (index 0 is our smile)
      faceMesh.morphTargetInfluences[0] = weight;
      innerMesh.morphTargetInfluences[0] = weight;
    });
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 7. Animation Loop
  const clock = new THREE.Clock();

  const animate = () => {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Gentle floating rotation
    faceMesh.rotation.y = Math.sin(time * 0.5) * 0.2;
    faceMesh.rotation.x = Math.sin(time * 0.3) * 0.1;

    innerMesh.rotation.copy(faceMesh.rotation);

    renderer.render(scene, camera);
  };

  animate();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
