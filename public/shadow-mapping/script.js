import * as THREE from 'three';

let scene, rendererCamera, rendererLight;
let mainCamera, lightCamera;
let directionalLight;
let cameraCanvas, lightCanvas;
let group;
let width, height;

// State variables for interaction
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let lightAngle = Math.PI / 4;
let lightRadius = 15;
let lightHeight = 10;

function init() {
  cameraCanvas = document.getElementById('camera-canvas');
  lightCanvas = document.getElementById('light-canvas');

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#121212');

  // Renderers setup
  rendererCamera = new THREE.WebGLRenderer({ canvas: cameraCanvas, antialias: true });
  rendererCamera.setPixelRatio(window.devicePixelRatio);
  rendererCamera.shadowMap.enabled = true;
  rendererCamera.shadowMap.type = THREE.PCFSoftShadowMap;

  rendererLight = new THREE.WebGLRenderer({ canvas: lightCanvas, antialias: true });
  rendererLight.setPixelRatio(window.devicePixelRatio);

  // Cameras
  mainCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  mainCamera.position.set(0, 10, 20);
  mainCamera.lookAt(0, 0, 0);

  // The light's camera
  lightCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.5, 50);

  // Lights
  scene.add(new THREE.AmbientLight(0x404040, 0.5)); // Soft white light

  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  // Sync light camera with the directional light's shadow camera
  // We'll update the lightCamera position and rotation to match the light later.

  // Geometry
  const materialPlane = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const materialBox = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
  const materialSphere = new THREE.MeshStandardMaterial({ color: 0xff00ff });
  const materialTorus = new THREE.MeshStandardMaterial({ color: 0xffff00 });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), materialPlane);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);

  group = new THREE.Group();
  scene.add(group);

  const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materialBox);
  box.position.set(-3, 1, -2);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), materialSphere);
  sphere.position.set(3, 1.5, 2);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);

  const torus = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.5, 16, 100), materialTorus);
  torus.position.set(0, 3, 0);
  torus.rotation.x = Math.PI / 4;
  torus.castShadow = true;
  torus.receiveShadow = true;
  group.add(torus);

  // Resize handler
  window.addEventListener('resize', onWindowResize);
  onWindowResize();

  // Interaction handlers
  const container = document.getElementById('split-container');
  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  updateLightPosition();
}

function updateLightPosition() {
  const x = Math.cos(lightAngle) * lightRadius;
  const z = Math.sin(lightAngle) * lightRadius;
  directionalLight.position.set(x, lightHeight, z);

  // Update lightCamera to perfectly match the directional light
  lightCamera.position.copy(directionalLight.position);
  lightCamera.lookAt(scene.position);
}

function onWindowResize() {
  const container = document.getElementById('camera-view');
  width = container.clientWidth;
  height = container.clientHeight;

  mainCamera.aspect = width / height;
  mainCamera.updateProjectionMatrix();

  // Assuming both panels are roughly the same size
  const lightContainer = document.getElementById('light-view');
  const lightWidth = lightContainer.clientWidth;
  const lightHeight = lightContainer.clientHeight;

  // The orthographic camera handles aspect differently, but we want the viewport to scale
  lightCamera.left = -10 * (lightWidth / lightHeight);
  lightCamera.right = 10 * (lightWidth / lightHeight);
  lightCamera.updateProjectionMatrix();

  rendererCamera.setSize(width, height);
  rendererLight.setSize(lightWidth, lightHeight);
}

function onPointerDown(event) {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onPointerMove(event) {
  if (!isDragging) return;
  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  lightAngle += deltaX * 0.01;
  // Also add some height variation on Y drag
  lightHeight = Math.max(5, Math.min(20, lightHeight + deltaY * 0.05));
  lightRadius = Math.max(10, Math.min(30, lightRadius + deltaY * 0.05));

  previousMousePosition = { x: event.clientX, y: event.clientY };

  updateLightPosition();
}

function onPointerUp() {
  isDragging = false;
}

// Render loop
const depthMaterial = new THREE.MeshDepthMaterial();

function animate() {
  requestAnimationFrame(animate);

  // Slowly rotate the group
  group.rotation.y += 0.005;
  group.rotation.x += 0.002;

  // Render camera view (normal)
  scene.overrideMaterial = null;
  rendererCamera.render(scene, mainCamera);

  // Render light view (depth buffer)
  scene.overrideMaterial = depthMaterial;
  rendererLight.render(scene, lightCamera);
  scene.overrideMaterial = null;
}

init();
animate();
