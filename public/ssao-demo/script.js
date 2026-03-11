/**
 * Screen Space Ambient Occlusion (SSAO) Demo
 * Visualizes how test rays are cast from a specific point
 * to determine ambient occlusion shading.
 */

const init = () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(5, 5, 8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 10, 5);
  scene.add(dirLight);

  // Geometry group to hold the room/objects
  const roomGroup = new THREE.Group();
  scene.add(roomGroup);

  // Material for the room/objects
  const material = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    roughness: 0.8,
    metalness: 0.2,
  });

  // Create a "room" corner
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 10), material);
  floor.position.y = -0.25;
  roomGroup.add(floor);

  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.5), material);
  wall1.position.set(0, 2.5, -4.75);
  roomGroup.add(wall1);

  const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 10), material);
  wall2.position.set(-4.75, 2.5, 0);
  roomGroup.add(wall2);

  // Add some intersecting boxes to create crevices
  const box1 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
  box1.position.set(-1, 1, -1);
  box1.rotation.y = Math.PI / 4;
  roomGroup.add(box1);

  const box2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), material);
  box2.position.set(2, 1.5, -3);
  roomGroup.add(box2);

  // Ray visualization elements
  const raysGroup = new THREE.Group();
  scene.add(raysGroup);

  const numRays = 64;
  const rayRadius = 1.5;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // UI Elements
  const statTotal = document.getElementById('stat-total');
  const statOccluded = document.getElementById('stat-occluded');
  const statAO = document.getElementById('stat-ao');

  // Helpers for visualizing intersection
  const hitMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  hitMarker.visible = false;
  scene.add(hitMarker);

  // Generate random points on a hemisphere
  const generateHemisphereRays = (normal) => {
    const rays = [];
    const up = new THREE.Vector3(0, 1, 0);
    // Find a rotation matrix that aligns 'up' with 'normal'
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

    for (let i = 0; i < numRays; i++) {
      // Random direction in a hemisphere (upwards)
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(v); // mostly pointing "up"

      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi), // y is up
        Math.sin(phi) * Math.sin(theta)
      );

      // Rotate the hemisphere to align with the surface normal
      dir.applyQuaternion(quaternion).normalize();

      // Bias slightly to avoid self-intersection acne
      rays.push(dir);
    }
    return rays;
  };

  const drawRays = (origin, normal) => {
    // Clear previous rays
    while (raysGroup.children.length > 0) {
      const child = raysGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      raysGroup.remove(child);
    }

    const directions = generateHemisphereRays(normal);
    let occludedCount = 0;

    // Slight offset to avoid hitting the surface itself immediately
    const startPoint = origin.clone().add(normal.clone().multiplyScalar(0.01));

    directions.forEach((dir) => {
      raycaster.set(startPoint, dir);
      raycaster.far = rayRadius;

      const intersects = raycaster.intersectObjects(roomGroup.children);

      let isOccluded = false;
      let endPoint = startPoint.clone().add(dir.clone().multiplyScalar(rayRadius));

      if (intersects.length > 0) {
        isOccluded = true;
        occludedCount++;
        endPoint = intersects[0].point;
      }

      // Draw the ray line
      const lineMaterial = new THREE.LineBasicMaterial({
        color: isOccluded ? 0xff00ff : 0x00ffcc,
        transparent: true,
        opacity: 0.8
      });

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      raysGroup.add(line);

      if (isOccluded) {
        // Add a small point where it hit
        const hitPointGeometry = new THREE.BufferGeometry().setFromPoints([endPoint]);
        const hitPointMat = new THREE.PointsMaterial({ color: 0xff00ff, size: 0.05 });
        const hitPoint = new THREE.Points(hitPointGeometry, hitPointMat);
        raysGroup.add(hitPoint);
      }
    });

    // Update UI
    statTotal.innerText = numRays;
    statOccluded.innerText = occludedCount;
    // Ambient Occlusion is the ratio of unoccluded rays.
    // 1.0 means fully bright, 0.0 means fully dark.
    // Darkness is ratio of occluded to total.
    const occlusion = occludedCount / numRays;
    const aoValue = 1.0 - occlusion;
    statAO.innerText = aoValue.toFixed(2);
  };

  // Interaction
  const onPointerDown = (event) => {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.far = 1000; // Reset far for initial hit detection

    const intersects = raycaster.intersectObjects(roomGroup.children);

    if (intersects.length > 0) {
      const hit = intersects[0];
      hitMarker.position.copy(hit.point);
      hitMarker.visible = true;

      // Ensure we have a normal
      if (hit.face && hit.face.normal) {
        // Transform the normal to world space if necessary
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
        const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();

        drawRays(hit.point, worldNormal);
      }
    }
  };

  window.addEventListener('pointerdown', onPointerDown);

  // Resize handler
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onWindowResize);

  // Animation Loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Instead of rotating the room, orbit the camera slowly around it
    // so rays correctly align with world space points on hit objects
    const time = Date.now() * 0.0001;
    camera.position.x = Math.sin(time) * 8;
    camera.position.z = Math.cos(time) * 8;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  animate();

  // Trigger initial raycast in the corner after a slight delay
  setTimeout(() => {
    // Manually trigger a raycast at a specific point
    const startObj = box1;
    drawRays(new THREE.Vector3(-0.5, 0.5, -0.5), new THREE.Vector3(1, 1, 1).normalize());
    hitMarker.position.set(-0.5, 0.5, -0.5);
    hitMarker.visible = true;
  }, 500);
};

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
