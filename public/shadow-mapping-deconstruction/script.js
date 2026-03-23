const cameraViewEl = document.getElementById('camera-view');
const lightViewEl = document.getElementById('light-view');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Cameras
const mainCamera = new THREE.PerspectiveCamera(45, cameraViewEl.clientWidth / cameraViewEl.clientHeight, 0.1, 100);
mainCamera.position.set(0, 10, 20);
mainCamera.lookAt(0, 0, 0);

const lightCamera = new THREE.OrthographicCamera(-15, 15, 15, -15, 1, 30);
// lightCamera is positioned exactly where the directional light is

// Renderers
const rendererCamera = new THREE.WebGLRenderer({ antialias: true });
rendererCamera.setSize(cameraViewEl.clientWidth, cameraViewEl.clientHeight);
rendererCamera.shadowMap.enabled = true;
rendererCamera.shadowMap.type = THREE.PCFSoftShadowMap;
cameraViewEl.appendChild(rendererCamera.domElement);

const rendererLight = new THREE.WebGLRenderer({ antialias: true });
rendererLight.setSize(lightViewEl.clientWidth, lightViewEl.clientHeight);
lightViewEl.appendChild(rendererLight.domElement);

// Depth Material for Light View
const depthMaterial = new THREE.MeshDepthMaterial();

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 15, 5);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 30;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

// Synchronize lightCamera with dirLight
lightCamera.position.copy(dirLight.position);
lightCamera.lookAt(0, 0, 0);

// Helper to visualize the light camera in the main view
const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
scene.add(cameraHelper);

// Objects
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

const objects = [];

const torusGeometry = new THREE.TorusGeometry(3, 1, 16, 64);
const torusMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.2, metalness: 0.8 });
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.set(-2, 4, 0);
torus.castShadow = true;
torus.receiveShadow = true;
scene.add(torus);
objects.push(torus);

const boxGeometry = new THREE.BoxGeometry(2, 4, 2);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, roughness: 0.5, metalness: 0.1 });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(4, 2, 2);
box.castShadow = true;
box.receiveShadow = true;
scene.add(box);
objects.push(box);

const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.1, metalness: 0.9 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(2, 6, -4);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);
objects.push(sphere);


// Animation Loop
let time = 0;
function animate() {
  requestAnimationFrame(animate);

  time += 0.01;

  // Animate objects
  torus.rotation.x += 0.01;
  torus.rotation.y += 0.02;

  box.rotation.y += 0.01;
  box.position.y = 2 + Math.sin(time * 2) * 1;

  sphere.position.x = 2 + Math.cos(time) * 3;
  sphere.position.z = -4 + Math.sin(time) * 3;

  // Render Main View
  rendererCamera.render(scene, mainCamera);

  // Render Light View with Depth Material
  scene.overrideMaterial = depthMaterial;
  // Hide the camera helper from the depth map
  cameraHelper.visible = false;
  rendererLight.render(scene, lightCamera);
  // Restore scene materials
  scene.overrideMaterial = null;
  cameraHelper.visible = true;
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
  mainCamera.aspect = cameraViewEl.clientWidth / cameraViewEl.clientHeight;
  mainCamera.updateProjectionMatrix();
  rendererCamera.setSize(cameraViewEl.clientWidth, cameraViewEl.clientHeight);

  lightCamera.updateProjectionMatrix();
  rendererLight.setSize(lightViewEl.clientWidth, lightViewEl.clientHeight);
});
