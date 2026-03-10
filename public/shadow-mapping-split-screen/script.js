// script.js

// === Scene Setup ===
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false; // We handle clearing manually for split screen

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

// === Cameras ===
// 1. Main Camera
const mainCamera = new THREE.PerspectiveCamera(45, (window.innerWidth / 2) / window.innerHeight, 1, 100);
mainCamera.position.set(0, 8, 20);

// Orbit Controls for main camera
const controls = new THREE.OrbitControls(mainCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
scene.add(ambientLight);

// Directional Light (The shadow caster)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;

// Shadow Map Configuration
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
const d = 15;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.bias = -0.001;

scene.add(dirLight);

// Light Helper to visualize where the light is
const lightHelper = new THREE.DirectionalLightHelper(dirLight, 2, 0xffaa00);
scene.add(lightHelper);
// Also visualize the shadow camera bounds
const shadowCameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
scene.add(shadowCameraHelper);


// === Objects ===
const group = new THREE.Group();
scene.add(group);

// Ground Plane
const planeGeo = new THREE.PlaneGeometry(100, 100);
const planeMat = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Central Sphere
const sphereGeo = new THREE.SphereGeometry(2, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.4, metalness: 0.1 });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.y = 2;
sphere.castShadow = true;
sphere.receiveShadow = true;
group.add(sphere);

// Orbiting Torus
const torusGeo = new THREE.TorusGeometry(1, 0.4, 16, 100);
const torusMat = new THREE.MeshStandardMaterial({ color: 0xe24a73, roughness: 0.5, metalness: 0.3 });
const torus = new THREE.Mesh(torusGeo, torusMat);
torus.position.set(-4, 4, 0);
torus.castShadow = true;
torus.receiveShadow = true;
group.add(torus);

// Rotating Cube
const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
const cubeMat = new THREE.MeshStandardMaterial({ color: 0x4ae293, roughness: 0.2, metalness: 0.8 });
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.set(4, 2, 2);
cube.castShadow = true;
cube.receiveShadow = true;
group.add(cube);

// Floating Cones
const coneGeo = new THREE.ConeGeometry(1, 2, 32);
const coneMat = new THREE.MeshStandardMaterial({ color: 0xe2a84a, roughness: 0.6, metalness: 0.2 });
for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(
        Math.cos(i * Math.PI * 2 / 3) * 6,
        3 + Math.sin(i),
        Math.sin(i * Math.PI * 2 / 3) * 6
    );
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);
}


// === Depth Material for Second View ===
// Instead of basic MeshDepthMaterial, we use a custom shader to pack depth linearly
// so it looks exactly like a shadow map (black = near, white = far)
// A simple MeshDepthMaterial works fine for demonstration, but let's tweak it
const depthMaterial = new THREE.MeshDepthMaterial();
depthMaterial.depthPacking = THREE.BasicDepthPacking;

// === UI Controls ===
const lightXInput = document.getElementById('light-x');
const lightYInput = document.getElementById('light-y');
const lightZInput = document.getElementById('light-z');

function updateLightPosition() {
    dirLight.position.set(
        parseFloat(lightXInput.value),
        parseFloat(lightYInput.value),
        parseFloat(lightZInput.value)
    );
    dirLight.target.position.set(0,0,0);
    dirLight.target.updateMatrixWorld();

    lightHelper.update();
    shadowCameraHelper.update();
}

lightXInput.addEventListener('input', updateLightPosition);
lightYInput.addEventListener('input', updateLightPosition);
lightZInput.addEventListener('input', updateLightPosition);


// === Resize Handler ===
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);

    // Update main camera
    mainCamera.aspect = (width / 2) / height;
    mainCamera.updateProjectionMatrix();

    // Light camera projection is handled by its bounds, but aspect ratio of viewport matters
    dirLight.shadow.camera.updateProjectionMatrix();
}

// === Animation Loop ===
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    controls.update();

    // Animate objects
    torus.position.x = Math.cos(time * 0.5) * 5;
    torus.position.z = Math.sin(time * 0.5) * 5;
    torus.rotation.x = time;
    torus.rotation.y = time * 0.5;

    cube.rotation.x = time * 0.8;
    cube.rotation.y = time * 1.2;

    group.children.forEach((child, index) => {
        if(child.geometry.type === 'ConeGeometry') {
            child.position.y = 3 + Math.sin(time * 2 + index) * 1.5;
            child.rotation.y = time;
        }
    });

    renderSplitScreen();
}

function renderSplitScreen() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfWidth = width / 2;

    renderer.clear();

    // --- LEFT VIEW: Main Camera ---
    renderer.setViewport(0, 0, halfWidth, height);
    renderer.setScissor(0, 0, halfWidth, height);
    renderer.setScissorTest(true);

    // Render normally
    scene.overrideMaterial = null;
    renderer.render(scene, mainCamera);

    // --- RIGHT VIEW: Light's Depth Camera ---
    renderer.setViewport(halfWidth, 0, halfWidth, height);
    renderer.setScissor(halfWidth, 0, halfWidth, height);
    renderer.setScissorTest(true);

    // Hide helpers in the depth view
    lightHelper.visible = false;
    shadowCameraHelper.visible = false;

    // Override materials with depth material
    scene.overrideMaterial = depthMaterial;

    // Render from the light's shadow camera perspective
    renderer.render(scene, dirLight.shadow.camera);

    // Restore helpers for next frame (left view)
    lightHelper.visible = true;
    shadowCameraHelper.visible = true;
}

// Initialize and start
updateLightPosition();
onWindowResize();
animate();
