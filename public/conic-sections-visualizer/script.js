// Conic Sections Visualizer
const container = document.getElementById('container');
const angleSlider = document.getElementById('angle-slider');
const angleValue = document.getElementById('angle-value');
const offsetSlider = document.getElementById('offset-slider');
const offsetValue = document.getElementById('offset-value');
const conicTypeLabel = document.getElementById('conic-type');

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19); // Dark violet background

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 3, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Enable local clipping
renderer.localClippingEnabled = true;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xff00ff, 1, 10);
pointLight.position.set(-2, 2, -2);
scene.add(pointLight);

// Constants
const coneHeight = 4;
const coneRadius = 2;
// The angle the cone makes with its vertical axis (in radians)
const coneGeneratorAngle = Math.atan2(coneRadius, coneHeight / 2);

// Slicing Plane Normal (initially pointing straight down, representing a horizontal slice)
let planeNormal = new THREE.Vector3(0, -1, 0);
let planeOffset = 0.5; // Starts in the upper cone
const clippingPlane = new THREE.Plane(planeNormal, planeOffset);

// Materials
// Translucent double cone
const coneMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00ffcc, // Neon cyan
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.8, // glass-like
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    clippingPlanes: [clippingPlane],
    clipIntersection: false
});

// To show the 'solid' interior of the cut, we use a stencil-like effect or simple backface rendering.
// A common trick is to render the back faces with a solid material.
const backFaceMaterial = new THREE.MeshBasicMaterial({
    color: 0x005544,
    side: THREE.BackSide,
    clippingPlanes: [clippingPlane],
});

// Geometry: Double Cone
const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight / 2, 64, 1, true);

// Upper cone
const upperCone = new THREE.Mesh(coneGeometry, coneMaterial);
upperCone.position.y = coneHeight / 4;
scene.add(upperCone);

const upperConeBack = new THREE.Mesh(coneGeometry, backFaceMaterial);
upperConeBack.position.y = coneHeight / 4;
scene.add(upperConeBack);

// Lower cone (inverted)
const lowerCone = new THREE.Mesh(coneGeometry, coneMaterial);
lowerCone.rotation.x = Math.PI;
lowerCone.position.y = -coneHeight / 4;
scene.add(lowerCone);

const lowerConeBack = new THREE.Mesh(coneGeometry, backFaceMaterial);
lowerConeBack.rotation.x = Math.PI;
lowerConeBack.position.y = -coneHeight / 4;
scene.add(lowerConeBack);

// Visual Representation of the Slicing Plane
const visiblePlaneGeo = new THREE.PlaneGeometry(20, 20);
const visiblePlaneMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff, // Neon magenta
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false
});
const visiblePlane = new THREE.Mesh(visiblePlaneGeo, visiblePlaneMat);
scene.add(visiblePlane);

// Helper line to show the normal of the plane (optional, can be commented out)
// const normalHelper = new THREE.ArrowHelper(planeNormal, new THREE.Vector3(0,0,0), 2, 0xffaa00);
// scene.add(normalHelper);


// Add a subtle rotation to the scene for passive animation
const sceneGroup = new THREE.Group();
sceneGroup.add(upperCone);
sceneGroup.add(upperConeBack);
sceneGroup.add(lowerCone);
sceneGroup.add(lowerConeBack);
scene.add(sceneGroup);


// UI Interaction & Logic
function updatePlane() {
    // Read slider values
    const angleDeg = parseFloat(angleSlider.value);
    const offsetVal = parseFloat(offsetSlider.value);

    // Update UI text
    angleValue.innerText = angleDeg;
    offsetValue.innerText = offsetVal.toFixed(2);

    // Convert angle to radians.
    // 0 degrees = horizontal plane (normal is [0, -1, 0])
    // 90 degrees = vertical plane (normal is [1, 0, 0])
    const angleRad = THREE.MathUtils.degToRad(angleDeg);

    // The normal rotates from pointing down (0, -1, 0) towards the x-axis.
    planeNormal.set(Math.sin(angleRad), -Math.cos(angleRad), 0).normalize();

    // The offset for THREE.Plane is the distance from the origin in the direction of the normal.
    // We map our offset slider to the vertical distance along the Y axis.
    // If the plane is horizontal (normal 0,-1,0), offset = y_val means distance = -y_val.
    // We adjust it so that slider offset corresponds roughly to vertical height.
    // Distance D = origin to plane. If plane passes through (0, offsetVal, 0),
    // then D = normal.dot(point) = (sin, -cos, 0) . (0, offsetVal, 0) = -offsetVal * cos(angleRad).

    const d = -offsetVal * Math.cos(angleRad);
    clippingPlane.constant = d;

    // Update visual plane to match
    // Default plane normal is (0, 0, 1). We need a quaternion to rotate it to `planeNormal` (which faces 'into' the cut).
    // Actually, the visible plane should lay ON the clipping plane.
    const axis = new THREE.Vector3(0, 0, 1).cross(planeNormal).normalize();
    const angle = Math.acos(new THREE.Vector3(0, 0, 1).dot(planeNormal));

    if (axis.lengthSq() > 0.0001) {
        visiblePlane.quaternion.setFromAxisAngle(axis, angle);
    } else {
        // If normal is (0,0,-1)
        if (planeNormal.z < 0) {
            visiblePlane.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI);
        } else {
            visiblePlane.quaternion.identity();
        }
    }

    // Position the visible plane. It needs to be somewhere on the plane.
    // The closest point to origin on the plane is normal * distance.
    // But our clippingPlane definition: normal.dot(p) = constant  --> wait, Three.js Plane is: normal.dot(p) + constant = 0
    // So p = normal * (-constant)
    visiblePlane.position.copy(planeNormal).multiplyScalar(-clippingPlane.constant);

    determineConicSection(angleRad, offsetVal);
}

// Logic to determine conic section type
let lastConicType = '';

function determineConicSection(planeAngleRad, offsetVal) {
    let type = '';

    // The angle of the slicing plane (alpha) relative to the horizontal.
    // The generating angle of the cone (theta) relative to the vertical axis.
    // Here, we measure plane angle from horizontal. So alpha = planeAngleRad.
    // Cone side angle from horizontal = PI/2 - coneGeneratorAngle.

    const alpha = planeAngleRad;
    const beta = Math.PI / 2 - coneGeneratorAngle; // Angle of cone side from horizontal

    // Epsilon for floating point comparisons
    const eps = 0.02;

    // Special case: passing through apex (offset = 0)
    if (Math.abs(offsetVal) < 0.05) {
        if (alpha < beta - eps) {
            type = "Point";
        } else if (Math.abs(alpha - beta) <= eps) {
            type = "Line";
        } else {
            type = "Intersecting Lines";
        }
    } else {
        // Standard cases
        if (alpha < eps) {
            type = "Circle";
        } else if (alpha < beta - eps) {
            type = "Ellipse";
        } else if (Math.abs(alpha - beta) <= eps) {
            type = "Parabola";
        } else {
            type = "Hyperbola";
        }
    }

    if (type !== lastConicType) {
        conicTypeLabel.innerText = type;
        // Trigger active pulse animation
        conicTypeLabel.classList.remove('pulse-active');
        void conicTypeLabel.offsetWidth; // trigger reflow
        conicTypeLabel.classList.add('pulse-active');
        lastConicType = type;
    }
}

// Event Listeners
angleSlider.addEventListener('input', updatePlane);
offsetSlider.addEventListener('input', updatePlane);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Simple mouse interaction to rotate the scene
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

document.addEventListener('mousedown', () => { isDragging = true; });
document.addEventListener('mouseup', () => { isDragging = false; });
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaMove = {
            x: e.offsetX - previousMousePosition.x,
            y: e.offsetY - previousMousePosition.y
        };

        sceneGroup.rotation.y += deltaMove.x * 0.01;
        // Optional: vertical rotation
        // sceneGroup.rotation.x += deltaMove.y * 0.01;
    }
    previousMousePosition = { x: e.offsetX, y: e.offsetY };
});

// Touch support for mobile
document.addEventListener('touchstart', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
document.addEventListener('touchend', () => { isDragging = false; });
document.addEventListener('touchmove', (e) => {
    if (isDragging) {
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };
        sceneGroup.rotation.y += deltaMove.x * 0.01;
    }
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

// Initialization
updatePlane();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Passive slow rotation if not dragging
    if (!isDragging) {
        sceneGroup.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
}

animate();
