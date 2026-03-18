import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
const objects = [];

function init() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f4f8);
  scene.fog = new THREE.FogExp2(0xf0f4f8, 0.02);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(15, 15, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 50;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  setupLighting();
  createGeometry();

  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  animate();
}

function onPointerDown(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const hit = intersects[0];
    // Offset slightly along the normal to prevent self-intersection
    const origin = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.01));
    calculateSSAO(origin, hit.face.normal);
  }
}

let activeRays = [];

function calculateSSAO(origin, normal) {
  // Clear previous rays
  activeRays.forEach(ray => scene.remove(ray));
  activeRays = [];

  const sampleCount = 64;
  const radius = 5.0;
  let blockedCount = 0;
  let unblockedCount = 0;

  const raycaster = new THREE.Raycaster();

  // Create an orientation matrix for the hemisphere
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(up, normal).normalize();
  if (tangent.lengthSq() < 0.001) {
    tangent.set(1, 0, 0); // fallback if normal is straight up/down
  }
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

  const rotationMatrix = new THREE.Matrix4().makeBasis(tangent, normal, bitangent);

  for (let i = 0; i < sampleCount; i++) {
    // Generate a random sample vector in a hemisphere
    // r1 and r2 are random numbers between 0 and 1
    const r1 = Math.random();
    const r2 = Math.random();

    // Uniformly sample points on the hemisphere surface
    const theta = 2 * Math.PI * r1;
    const phi = Math.acos(r2); // This creates a cosine-weighted distribution, favoring the normal

    let x = Math.sin(phi) * Math.cos(theta);
    let y = Math.cos(phi); // y is up in the local hemisphere coordinate system
    let z = Math.sin(phi) * Math.sin(theta);

    const localSample = new THREE.Vector3(x, y, z);

    // Transform local sample to world space based on the surface normal
    const worldSample = localSample.applyMatrix4(rotationMatrix).normalize();

    raycaster.set(origin, worldSample);

    // Check for intersections
    const intersects = raycaster.intersectObjects(objects);

    let isBlocked = false;
    let distance = radius;

    if (intersects.length > 0 && intersects[0].distance < radius) {
      isBlocked = true;
      blockedCount++;
      distance = intersects[0].distance;
    } else {
      unblockedCount++;
    }

    // Draw the ray
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isBlocked ? 0xef4444 : 0x10b981,
      transparent: true,
      opacity: 0.6
    });

    const points = [
      origin,
      origin.clone().add(worldSample.clone().multiplyScalar(distance))
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);

    scene.add(line);
    activeRays.push(line);
  }

  updateUI(blockedCount, unblockedCount, sampleCount);
}

function updateUI(blocked, unblocked, total) {
  const resultPanel = document.getElementById('occlusion-result');
  resultPanel.classList.remove('hidden');

  const aoValue = unblocked / total;

  document.getElementById('ao-value').textContent = aoValue.toFixed(2);
  document.getElementById('unblocked-count').textContent = unblocked;
  document.getElementById('blocked-count').textContent = blocked;
}

function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
  fillLight.position.set(-10, 10, -10);
  scene.add(fillLight);
}

function createGeometry() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Ground plane
  const planeGeo = new THREE.PlaneGeometry(40, 40);
  const plane = new THREE.Mesh(planeGeo, material);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);
  objects.push(plane);

  // Main corner walls
  const wall1Geo = new THREE.BoxGeometry(20, 10, 2);
  const wall1 = new THREE.Mesh(wall1Geo, material);
  wall1.position.set(0, 5, -10);
  wall1.castShadow = true;
  wall1.receiveShadow = true;
  scene.add(wall1);
  objects.push(wall1);

  const wall2Geo = new THREE.BoxGeometry(2, 10, 20);
  const wall2 = new THREE.Mesh(wall2Geo, material);
  wall2.position.set(-10, 5, 0);
  wall2.castShadow = true;
  wall2.receiveShadow = true;
  scene.add(wall2);
  objects.push(wall2);

  // Crevice/Corner blocks
  const blockGeo1 = new THREE.BoxGeometry(4, 4, 4);
  const block1 = new THREE.Mesh(blockGeo1, material);
  block1.position.set(-6, 2, -6);
  block1.castShadow = true;
  block1.receiveShadow = true;
  scene.add(block1);
  objects.push(block1);

  const blockGeo2 = new THREE.BoxGeometry(6, 2, 6);
  const block2 = new THREE.Mesh(blockGeo2, material);
  block2.position.set(2, 1, -5);
  block2.castShadow = true;
  block2.receiveShadow = true;
  scene.add(block2);
  objects.push(block2);

  const blockGeo3 = new THREE.BoxGeometry(3, 6, 3);
  const block3 = new THREE.Mesh(blockGeo3, material);
  block3.position.set(-7, 3, 2);
  block3.castShadow = true;
  block3.receiveShadow = true;
  scene.add(block3);
  objects.push(block3);

  // A narrow crevice
  const blockGeo4 = new THREE.BoxGeometry(8, 4, 1);
  const block4 = new THREE.Mesh(blockGeo4, material);
  block4.position.set(2, 2, 0);
  block4.castShadow = true;
  block4.receiveShadow = true;
  scene.add(block4);
  objects.push(block4);

  const blockGeo5 = new THREE.BoxGeometry(8, 4, 1);
  const block5 = new THREE.Mesh(blockGeo5, material);
  block5.position.set(2, 2, 1.5);
  block5.castShadow = true;
  block5.receiveShadow = true;
  scene.add(block5);
  objects.push(block5);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

init();
