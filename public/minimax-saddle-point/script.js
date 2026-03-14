const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.Fog(0x111111, 20, 100);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 10;
controls.maxDistance = 60;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0x4da6ff, 1);
dirLight2.position.set(-10, 10, -10);
scene.add(dirLight2);

// Surface definition: z = x^2 - y^2 (Saddle Point)
// Scale down the function to fit nicely in view
const scale = 0.1;
function getSurfaceHeight(x, y) {
    return (x * x - y * y) * scale;
}

function getGradient(x, y) {
    // Gradient of z = (x^2 - y^2) * scale
    // dz/dx = 2x * scale
    // dz/dy = -2y * scale
    return {
        dx: 2 * x * scale,
        dy: -2 * y * scale
    };
}

// Create Surface Mesh
const surfaceSize = 20;
const segments = 60;
const geometry = new THREE.PlaneGeometry(surfaceSize, surfaceSize, segments, segments);

// Manipulate vertices to create the saddle shape
const positions = geometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = getSurfaceHeight(x, y);
    positions.setZ(i, z);
}

geometry.computeVertexNormals();
// Rotate plane to lie flat (x-y plane)
geometry.rotateX(-Math.PI / 2);

const material = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.8,
    side: THREE.DoubleSide,
    wireframe: true,
    wireframeLinewidth: 2
});

const surfaceMesh = new THREE.Mesh(geometry, material);
scene.add(surfaceMesh);

// Add a solid ground below the wireframe for better visibility
const solidMaterial = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
});
const solidSurface = new THREE.Mesh(geometry, solidMaterial);
scene.add(solidSurface);

// The Ball
const ballRadius = 0.5;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff3366,
    metalness: 0.5,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: 0x330011
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

// Physics State
const ballState = {
    x: 8,
    y: 6,
    vx: 0,
    vy: 0
};

// Trajectory Trail
const maxTrailPoints = 300;
const trailGeometry = new THREE.BufferGeometry();
const trailPositions = new Float32Array(maxTrailPoints * 3);
trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xff3366,
    transparent: true,
    opacity: 0.5,
    linewidth: 2
});
const trailLine = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trailLine);

let trailIndex = 0;
let pointsAdded = 0;

function resetBall(x = 8, y = 6) {
    ballState.x = x;
    ballState.y = y;
    ballState.vx = 0;
    ballState.vy = 0;

    // Clear trail
    trailIndex = 0;
    pointsAdded = 0;
    for (let i = 0; i < maxTrailPoints * 3; i++) {
        trailPositions[i] = 0;
    }
    trailLine.geometry.attributes.position.needsUpdate = true;

    updateBallPosition();
}

function updateBallPosition() {
    // Note: Three.js coordinates vs Math coordinates
    // Math: x, y input, z output
    // Three.js: x is x, y is up (z in math), z is -y in math
    // We map: Math(x, y) -> Three(x, -z, getSurfaceHeight)

    const height = getSurfaceHeight(ballState.x, ballState.y);
    ball.position.set(ballState.x, height + ballRadius, -ballState.y);
}

// Interaction - Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.domElement.addEventListener('pointerdown', (e) => {
    // Only drag with left click
    if (e.button !== 0) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(solidSurface);

    if (intersects.length > 0) {
        isDragging = true;
        controls.enabled = false;
        const p = intersects[0].point;
        resetBall(p.x, -p.z);
    }
});

renderer.domElement.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(solidSurface);

    if (intersects.length > 0) {
        const p = intersects[0].point;
        resetBall(p.x, -p.z);
    }
});

window.addEventListener('pointerup', () => {
    isDragging = false;
    controls.enabled = true;
});

// UI Elements
const gravitySlider = document.getElementById('gravity-slider');
const dampingSlider = document.getElementById('damping-slider');
const posDisplay = document.getElementById('pos-display');
const velDisplay = document.getElementById('vel-display');
const resetBtn = document.getElementById('reset-btn');

resetBtn.addEventListener('click', () => {
    resetBall(8, 6);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1); // Cap dt to prevent huge jumps

    if (!isDragging) {
        const gravityParam = parseFloat(gravitySlider.value);
        const dampingParam = parseFloat(dampingSlider.value);

        // Physics logic
        const gravity = gravityParam * 0.5; // Scale to reasonable bounds
        const friction = dampingParam * 0.05;

        // Get slope at current position
        const grad = getGradient(ballState.x, ballState.y);

        // Acceleration for Gradient Descent / Ascent
        // To settle into the minimax saddle point (0, 0, 0), we need to perform simultaneous
        // gradient descent in x and gradient ascent in y.
        // For x: we want to move towards the minimum, so we go opposite to the gradient.
        // For y: we want to move towards the maximum, so we go with the gradient.
        const ax = -gravity * grad.dx;
        const ay = gravity * grad.dy; // Positive to act as a restoring force (gradient ascent)

        // Apply friction (damping)
        const fx = -friction * ballState.vx;
        const fy = -friction * ballState.vy;

        // Update velocity
        ballState.vx += (ax + fx) * dt;
        ballState.vy += (ay + fy) * dt;

        // Update position
        ballState.x += ballState.vx * dt;
        ballState.y += ballState.vy * dt;

        // Boundary check
        const halfSize = surfaceSize / 2;
        if (Math.abs(ballState.x) > halfSize) {
            ballState.x = Math.sign(ballState.x) * halfSize;
            ballState.vx *= -0.5; // bounce and lose energy
        }
        if (Math.abs(ballState.y) > halfSize) {
            ballState.y = Math.sign(ballState.y) * halfSize;
            ballState.vy *= -0.5;
        }
    }

    updateBallPosition();

    // Update Trail
    if (!isDragging) {
        // Only add point every few frames to save memory and make trail longer
        if (Math.random() < 0.5) {
            pointsAdded = Math.min(pointsAdded + 1, maxTrailPoints);

            // Simple trail logic: shift points down
            for(let i = maxTrailPoints - 1; i > 0; i--) {
                trailPositions[i * 3] = trailPositions[(i-1) * 3];
                trailPositions[i * 3 + 1] = trailPositions[(i-1) * 3 + 1];
                trailPositions[i * 3 + 2] = trailPositions[(i-1) * 3 + 2];
            }

            // Prepend new position
            trailPositions[0] = ball.position.x;
            trailPositions[1] = ball.position.y - ballRadius + 0.1; // Slightly above surface
            trailPositions[2] = ball.position.z;

            // Set proper draw range so we don't draw to origin if trail isn't full
            trailLine.geometry.setDrawRange(0, pointsAdded);
            trailLine.geometry.attributes.position.needsUpdate = true;
        }
    }

    // Update UI
    const totalVel = Math.sqrt(ballState.vx*ballState.vx + ballState.vy*ballState.vy);
    const z = getSurfaceHeight(ballState.x, ballState.y);
    posDisplay.innerText = `(${ballState.x.toFixed(2)}, ${ballState.y.toFixed(2)}, ${z.toFixed(2)})`;
    velDisplay.innerText = totalVel.toFixed(2);

    controls.update();
    renderer.render(scene, camera);
}

// Initialize
resetBall();
animate();
