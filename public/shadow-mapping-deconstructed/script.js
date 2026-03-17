// Initialize Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.Fog(0x0f172a, 10, 50);

// Initialize Main Camera
const cameraContainer = document.getElementById('camera-container');
const mainCamera = new THREE.PerspectiveCamera(50, cameraContainer.clientWidth / cameraContainer.clientHeight, 0.1, 100);
mainCamera.position.set(0, 10, 20);
mainCamera.lookAt(0, 0, 0);

// Initialize Main Renderer
const mainRenderer = new THREE.WebGLRenderer({ antialias: true });
mainRenderer.setSize(cameraContainer.clientWidth, cameraContainer.clientHeight);
mainRenderer.setPixelRatio(window.devicePixelRatio);
mainRenderer.shadowMap.enabled = true;
mainRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
cameraContainer.appendChild(mainRenderer.domElement);

// Geometry and Materials
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.2
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Objects
const objects = [];
const material = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.1
});

// Center Torus
const torus = new THREE.Mesh(new THREE.TorusGeometry(2, 0.5, 16, 100), material);
torus.position.y = 3;
torus.castShadow = true;
torus.receiveShadow = true;
scene.add(torus);
objects.push(torus);

// Orbiting Spheres
for(let i=0; i<3; i++) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);
    objects.push({
        mesh: sphere,
        offset: (i / 3) * Math.PI * 2
    });
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x334155, 1);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;

// Configure Shadow Map
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 25;
const d = 10;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// Light Helpers
const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 2, 0xfacc15);
scene.add(dirLightHelper);

const shadowCameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
scene.add(shadowCameraHelper);

// Target for the light
const targetObj = new THREE.Object3D();
scene.add(targetObj);
dirLight.target = targetObj;

// Initialize Light Depth Renderer
const lightContainer = document.getElementById('light-container');
const lightRenderer = new THREE.WebGLRenderer({ antialias: true });
lightRenderer.setSize(lightContainer.clientWidth, lightContainer.clientHeight);
lightRenderer.setPixelRatio(window.devicePixelRatio);
lightContainer.appendChild(lightRenderer.domElement);

// Depth Material for Light View
const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.BasicDepthPacking
});

// Interaction State
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Spherical Coordinates for Light Position
const lightSpherical = new THREE.Spherical(15, Math.PI / 4, Math.PI / 4);

function updateLightPosition() {
    lightSpherical.makeSafe();
    dirLight.position.setFromSpherical(lightSpherical);
    dirLight.lookAt(targetObj.position);
    dirLightHelper.update();
    shadowCameraHelper.update();
}
updateLightPosition();

// Pointer Events
window.addEventListener('pointerdown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    lightSpherical.theta -= deltaX * 0.01;
    lightSpherical.phi -= deltaY * 0.01;

    updateLightPosition();

    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointerup', () => {
    isDragging = false;
});

// Animation State
let time = 0;

// Render Loop
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // Animate Objects
    objects[0].rotation.x = time * 0.5;
    objects[0].rotation.y = time * 0.3;

    for (let i = 1; i < objects.length; i++) {
        const obj = objects[i];
        const angle = time + obj.offset;
        const radius = 6;
        obj.mesh.position.x = Math.cos(angle) * radius;
        obj.mesh.position.z = Math.sin(angle) * radius;
        obj.mesh.position.y = 2 + Math.sin(time * 2 + obj.offset);
    }

    // Update Light Helpers
    dirLightHelper.update();
    shadowCameraHelper.update();

    // Render Main View (Camera View)
    // Make sure helpers are visible only in the main view
    dirLightHelper.visible = true;
    shadowCameraHelper.visible = true;
    mainRenderer.render(scene, mainCamera);

    // Render Light Depth View
    // Hide helpers in depth view
    dirLightHelper.visible = false;
    shadowCameraHelper.visible = false;

    // Override scene material with depth material
    scene.overrideMaterial = depthMaterial;
    lightRenderer.render(scene, dirLight.shadow.camera);
    scene.overrideMaterial = null; // Restore materials
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
    // Update Main View
    const mainWidth = cameraContainer.clientWidth;
    const mainHeight = cameraContainer.clientHeight;
    mainCamera.aspect = mainWidth / mainHeight;
    mainCamera.updateProjectionMatrix();
    mainRenderer.setSize(mainWidth, mainHeight);

    // Update Light View
    const lightWidth = lightContainer.clientWidth;
    const lightHeight = lightContainer.clientHeight;

    // Ensure shadow camera maintains a roughly correct aspect if needed,
    // though orthographic cameras use left/right/top/bottom,
    // we'll just update renderer size to fit container cleanly.
    lightRenderer.setSize(lightWidth, lightHeight);
});
