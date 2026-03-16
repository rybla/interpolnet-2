const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 20, 100);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(25, 25, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 10;
controls.maxDistance = 80;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0x0f3460, 1);
dirLight2.position.set(-10, 10, -10);
scene.add(dirLight2);

// Surface Definition: generic minimax saddle point (e.g. z = x^2 - y^2)
const scale = 0.15;
const surfaceSize = 25;

function getSurfaceHeight(x, y) {
    return (x * x - y * y) * scale;
}

function getSurfaceGradient(x, y) {
    // dz/dx = 2x * scale
    // dz/dy = -2y * scale
    return {
        dx: 2 * x * scale,
        dy: -2 * y * scale
    };
}

// Create Surface Mesh
const segments = 80;
const surfaceGeometry = new THREE.PlaneGeometry(surfaceSize, surfaceSize, segments, segments);

const positions = surfaceGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = getSurfaceHeight(x, y);
    positions.setZ(i, z);
}

surfaceGeometry.computeVertexNormals();
surfaceGeometry.rotateX(-Math.PI / 2); // Flat on x-z plane

const surfaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x16213e,
    roughness: 0.6,
    metalness: 0.4,
    side: THREE.DoubleSide,
    wireframe: true,
    wireframeLinewidth: 2
});

const surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
scene.add(surfaceMesh);

const solidMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f3460,
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
});

const solidSurface = new THREE.Mesh(surfaceGeometry, solidMaterial);
scene.add(solidSurface);

// The Ball
const ballRadius = 0.6;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe94560,
    metalness: 0.7,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: 0x4a0e1c
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

// Physics State
const ballState = {
    x: 8,
    y: 8,
    vx: 0,
    vy: 0
};

function updateBallPosition() {
    // Math: (x, y) map to 3D: (x, z), since z is up in math, y is up in Three.js
    // Also, y in Math maps to -z in Three.js for proper orientation
    const height = getSurfaceHeight(ballState.x, ballState.y);
    ball.position.set(ballState.x, height + ballRadius, -ballState.y);
}

// Trajectory Trail
const maxTrailPoints = 400;
const trailGeometry = new THREE.BufferGeometry();
const trailPositions = new Float32Array(maxTrailPoints * 3);
trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xe94560,
    transparent: true,
    opacity: 0.6,
    linewidth: 2
});
const trailLine = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trailLine);

let trailIndex = 0;
let pointsAdded = 0;

function resetBall(x, y) {
    ballState.x = x;
    ballState.y = y;
    ballState.vx = 0;
    ballState.vy = 0;

    trailIndex = 0;
    pointsAdded = 0;
    for (let i = 0; i < maxTrailPoints * 3; i++) {
        trailPositions[i] = 0;
    }
    trailLine.geometry.attributes.position.needsUpdate = true;

    updateBallPosition();
}

// Interaction - Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;

renderer.domElement.addEventListener('pointerdown', (e) => {
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


// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);

    if (!isDragging) {
        // Constants for the simulation
        const gravityParam = 20;
        const dampingParam = 10;

        const gravity = gravityParam * 0.5;
        const friction = dampingParam * 0.05;

        // Get slope at current position
        const grad = getSurfaceGradient(ballState.x, ballState.y);

        // Acceleration:
        // Gradient descent in x (moves toward x=0 minimum)
        // Gradient ascent in y (moves toward y=0 maximum, preventing it from falling off the sides)
        const ax = -gravity * grad.dx;
        const ay = gravity * grad.dy;

        // Apply friction
        const fx = -friction * ballState.vx;
        const fy = -friction * ballState.vy;

        ballState.vx += (ax + fx) * dt;
        ballState.vy += (ay + fy) * dt;

        ballState.x += ballState.vx * dt;
        ballState.y += ballState.vy * dt;

        // Boundary reflection
        const halfSize = surfaceSize / 2;
        if (Math.abs(ballState.x) > halfSize) {
            ballState.x = Math.sign(ballState.x) * halfSize;
            ballState.vx *= -0.5;
        }
        if (Math.abs(ballState.y) > halfSize) {
            ballState.y = Math.sign(ballState.y) * halfSize;
            ballState.vy *= -0.5;
        }
    }

    updateBallPosition();

    // Update Trail using shift-register approach
    if (!isDragging) {
        if (Math.random() < 0.6) {
            pointsAdded = Math.min(pointsAdded + 1, maxTrailPoints);

            for(let i = maxTrailPoints - 1; i > 0; i--) {
                trailPositions[i * 3] = trailPositions[(i-1) * 3];
                trailPositions[i * 3 + 1] = trailPositions[(i-1) * 3 + 1];
                trailPositions[i * 3 + 2] = trailPositions[(i-1) * 3 + 2];
            }

            trailPositions[0] = ball.position.x;
            trailPositions[1] = ball.position.y - ballRadius + 0.1;
            trailPositions[2] = ball.position.z;

            trailLine.geometry.setDrawRange(0, pointsAdded);
            trailLine.geometry.attributes.position.needsUpdate = true;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

// Start simulation
resetBall(8, 8);
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
