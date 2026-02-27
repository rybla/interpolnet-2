// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.Fog(0x050510, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00f0ff, 1, 100);
pointLight1.position.set(10, 10, 10);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff0055, 1, 100);
pointLight2.position.set(-10, -10, 10);
scene.add(pointLight2);

// Cube Construction
const cubeSize = 1;
const gap = 0.05;
const cubies = []; // Array to hold all 27 cubies
const pivot = new THREE.Group(); // Pivot for rotating slices
scene.add(pivot);

// We need a parent group that holds all cubies when they are not being rotated
const mainGroup = new THREE.Group();
scene.add(mainGroup);

const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

// Materials
const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
});

const edgeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.3
});

// Create 3x3x3 grid
function initCube() {
    // Clear existing if any
    while(mainGroup.children.length > 0){
        mainGroup.remove(mainGroup.children[0]);
    }
    cubies.length = 0;

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const cubieGroup = new THREE.Group();

                // Core mesh
                const mesh = new THREE.Mesh(geometry, baseMaterial);
                mesh.userData = { isCubieMesh: true }; // Mark for raycasting
                cubieGroup.add(mesh);

                // Wireframe glow
                const wireframe = new THREE.Mesh(geometry, edgeMaterial);
                wireframe.scale.set(1.01, 1.01, 1.01);
                cubieGroup.add(wireframe);

                cubieGroup.position.set(
                    x * (cubeSize + gap),
                    y * (cubeSize + gap),
                    z * (cubeSize + gap)
                );

                // Store logical coordinates for identification
                cubieGroup.userData = {
                    x, y, z,
                    id: `${x},${y},${z}` // Initial position ID
                };

                mainGroup.add(cubieGroup);
                cubies.push(cubieGroup);
            }
        }
    }
    updateHashDisplay();
}

initCube();


// Interaction State
let isDragging = false;
let startMouse = new THREE.Vector2();
let currentMouse = new THREE.Vector2();
let intersectedFaceNormal = null;
let intersectedCubie = null;
let isRotating = false; // Animation lock

// Camera Orbit State
let isOrbiting = false;
let cameraAngleX = Math.PI / 4;
let cameraAngleY = Math.PI / 4;
let cameraRadius = Math.sqrt(5*5 + 5*5 + 5*5); // Distance from center

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// DOM Elements
const hashValueEl = document.getElementById('hash-value');
const statusMessageEl = document.getElementById('status-message');
const setModeBtn = document.getElementById('mode-set');
const unlockModeBtn = document.getElementById('mode-unlock');
const actionBtn = document.getElementById('action-btn');
const resetBtn = document.getElementById('reset-btn');

// App Logic State
let savedPasswordHash = null;
let mode = 'SET'; // 'SET' or 'UNLOCK'

// --- Utility Functions ---

function getMousePosition(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    return new THREE.Vector2(x, y);
}

function updateCameraPosition() {
    // Convert spherical to cartesian
    // y is up.
    // theta is horizontal angle (around y)
    // phi is vertical angle (from y axis)

    // Clamp vertical angle to avoid flipping
    const epsilon = 0.1;
    cameraAngleY = Math.max(epsilon, Math.min(Math.PI - epsilon, cameraAngleY));

    const x = cameraRadius * Math.sin(cameraAngleY) * Math.sin(cameraAngleX);
    const y = cameraRadius * Math.cos(cameraAngleY);
    const z = cameraRadius * Math.sin(cameraAngleY) * Math.cos(cameraAngleX);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
}
// Initialize camera
updateCameraPosition();


function getCubieCurrentPosition(cubie) {
    // Returns the world position rounded to nearest grid coordinate
    const pos = new THREE.Vector3();
    cubie.getWorldPosition(pos);
    const gridX = Math.round(pos.x / (cubeSize + gap));
    const gridY = Math.round(pos.y / (cubeSize + gap));
    const gridZ = Math.round(pos.z / (cubeSize + gap));
    return { x: gridX, y: gridY, z: gridZ };
}

function generateHash() {
    // Simple hash: concatenate the ID of the cubie at each grid position
    // We iterate through grid positions -1 to 1
    let stateString = "";

    // Create a map of current grid pos -> cubie ID
    const gridMap = {};
    cubies.forEach(c => {
        const pos = getCubieCurrentPosition(c);
        const key = `${pos.x},${pos.y},${pos.z}`;
        gridMap[key] = c.userData.id;
    });

    // Iterate in fixed order to generate string
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                stateString += gridMap[`${x},${y},${z}`] || "ERR";
            }
        }
    }

    // Convert to a hex-like string for display (simple djb2 variant)
    let hash = 5381;
    for (let i = 0; i < stateString.length; i++) {
        hash = ((hash << 5) + hash) + stateString.charCodeAt(i); /* hash * 33 + c */
    }
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

function updateHashDisplay() {
    const hash = generateHash();
    hashValueEl.textContent = hash;
    hashValueEl.style.color = mode === 'SET' ? '#00f0ff' : '#ff0055';
    return hash;
}

// --- Interaction Handlers ---

window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);

function onMouseDown(event) {
    if (isRotating) return;

    startMouse = getMousePosition(event);
    mouse.copy(startMouse);
    raycaster.setFromCamera(mouse, camera);

    // Check intersection with cubies
    // Note: We need to traverse down to find the mesh inside the group
    const intersects = raycaster.intersectObjects(mainGroup.children, true);

    const cubieMesh = intersects.find(hit => hit.object.userData.isCubieMesh);

    if (cubieMesh) {
        // Clicked on a cubie
        isDragging = true;
        isOrbiting = false;
        intersectedCubie = cubieMesh.object.parent; // The Group
        intersectedFaceNormal = cubieMesh.face.normal.clone();
        // Transform normal to world space (since cubie might be rotated)
        intersectedFaceNormal.transformDirection(intersectedCubie.matrixWorld).round();
    } else {
        // Clicked background -> Orbit camera
        isDragging = true;
        isOrbiting = true;
    }
}

function onMouseMove(event) {
    if (!isDragging || isRotating) return;
    currentMouse = getMousePosition(event);

    if (isOrbiting) {
        const deltaX = (currentMouse.x - startMouse.x) * Math.PI; // horizontal sensitivity
        const deltaY = (currentMouse.y - startMouse.y) * Math.PI; // vertical sensitivity

        cameraAngleX -= deltaX;
        cameraAngleY -= deltaY;

        updateCameraPosition();
        startMouse.copy(currentMouse); // Reset for continuous drag
    }
    // Note: We don't handle cube rotation in mouseMove, we wait for mouseUp or a threshold
    // Actually, for a rubik's cube, 'drag to rotate' usually triggers once a direction is established.
    // Let's implement a simple version: drag threshold -> determine axis -> animate.
}

function onMouseUp(event) {
    if (!isDragging || isRotating) {
        isDragging = false;
        return;
    }

    currentMouse = getMousePosition(event);

    if (!isOrbiting && intersectedCubie) {
        // Calculate drag vector in screen space
        const dragVec = new THREE.Vector2().subVectors(currentMouse, startMouse);

        if (dragVec.length() > 0.05) { // Drag threshold
             handleSliceRotation(intersectedCubie, intersectedFaceNormal, dragVec);
        }
    }

    isDragging = false;
    intersectedCubie = null;
    intersectedFaceNormal = null;
}

function handleSliceRotation(cubie, normal, dragVec) {
    isRotating = true;

    // Determine the axis of rotation based on normal and drag direction relative to camera
    // This is the tricky part of 3D UI.

    // Simplify: Raycast again at current mouse pos to find drag direction in 3D? No.
    // Project the 3D axes (tangent to the face) onto the screen and compare with dragVec.

    // 1. Get the world position of the cubie
    const pos = new THREE.Vector3();
    cubie.getWorldPosition(pos);

    // 2. Identify possible rotation axes.
    // If normal is X (1,0,0), possible axes are Y and Z.
    // If normal is Y (0,1,0), possible axes are X and Z.
    // If normal is Z (0,0,1), possible axes are X and Y.

    const axes = [];
    if (Math.abs(normal.x) > 0.5) { axes.push(new THREE.Vector3(0, 1, 0)); axes.push(new THREE.Vector3(0, 0, 1)); }
    else if (Math.abs(normal.y) > 0.5) { axes.push(new THREE.Vector3(1, 0, 0)); axes.push(new THREE.Vector3(0, 0, 1)); }
    else { axes.push(new THREE.Vector3(1, 0, 0)); axes.push(new THREE.Vector3(0, 1, 0)); }

    // 3. Project these axes onto screen space to see which one aligns with dragVec
    let bestAxis = null;
    let maxDot = -1;
    let rotationDir = 1;

    axes.forEach(axis => {
        // Get start point in screen space
        const p1 = pos.clone().project(camera);
        // Get end point (axis direction) in screen space
        const p2 = pos.clone().add(axis).project(camera);

        const screenAxis = new THREE.Vector2(p2.x - p1.x, p2.y - p1.y).normalize();

        const dot = Math.abs(dragVec.clone().normalize().dot(screenAxis));
        if (dot > maxDot) {
            maxDot = dot;
            bestAxis = axis;
            // Determine direction (CW or CCW) based on dot product sign
            const rawDot = dragVec.clone().normalize().dot(screenAxis);
            rotationDir = rawDot > 0 ? 1 : -1;
        }
    });

    if (bestAxis) {
        // Now identify which cubies to rotate.
        // We rotate a "slice".
        // The slice is defined by the plane perpendicular to the rotation axis that contains the clicked cubie.

        // E.g. if rotation axis is Y (0,1,0), we look at the cubie's Y position.
        // All cubies with approx same Y are in the slice.

        // Wait, rotation axis here describes the MOVEMENT direction of the face,
        // which implies rotation is around the THIRD axis (Cross product of normal and movement).

        // Example: Normal is Z (front face). Drag is X (horizontal).
        // Movement is along X. Rotation is around Y axis.

        const rotationAxis = new THREE.Vector3().crossVectors(normal, bestAxis).normalize();

        // Correct rotation direction logic might be needed here based on the cross product
        // but let's just stick to the discovered direction for now and flip if needed visually.
        // Actually, dragging "Right" on "Front" face should rotate around Y.
        // bestAxis=X. Cross(Z, X) = Y.

        // We need to coordinate the sign.
        // Screen drag X+ aligns with World X+ (roughly).
        // Rotation around Y+ moves Z+ face towards X+. So correct.

        // However, we need to invert direction if we are looking from "behind"?
        // Let's rely on the math.

        rotateSlice(rotationAxis, getCubieCurrentPosition(cubie), rotationDir * -1);
        // * -1 was determined empirically to match intuition (dragging right rotates face right)
    } else {
        isRotating = false;
    }
}


function rotateSlice(axis, cubiePos, direction) {
    const targetAngle = (Math.PI / 2) * direction;
    const duration = 500; // ms
    const startTime = Date.now();

    // 1. Identify cubies in the slice
    const sliceCubies = [];

    // Round axis components to integers (should be 0, 1, -1)
    const ax = Math.round(axis.x);
    const ay = Math.round(axis.y);
    const az = Math.round(axis.z);

    cubies.forEach(c => {
        const pos = getCubieCurrentPosition(c);
        // Check if cubie lies on the same plane relative to the axis
        // If axis is X, we check X coordinate.
        if (ax !== 0 && pos.x === cubiePos.x) sliceCubies.push(c);
        else if (ay !== 0 && pos.y === cubiePos.y) sliceCubies.push(c);
        else if (az !== 0 && pos.z === cubiePos.z) sliceCubies.push(c);
    });

    // 2. Attach them to pivot
    // We need to detach from scene/mainGroup and attach to pivot WITHOUT changing world transform
    // Pivot should be at (0,0,0) with identity rotation initially.
    pivot.rotation.set(0, 0, 0);
    pivot.position.set(0, 0, 0);

    sliceCubies.forEach(c => {
        // Three.js attach utility handles transform conversion
        pivot.attach(c);
    });

    // 3. Animate pivot
    function animateRotation() {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        // Ease out quad
        const ease = 1 - (1 - progress) * (1 - progress);

        if (ax !== 0) pivot.rotation.x = targetAngle * ease;
        if (ay !== 0) pivot.rotation.y = targetAngle * ease;
        if (az !== 0) pivot.rotation.z = targetAngle * ease;

        if (progress < 1) {
            requestAnimationFrame(animateRotation);
        } else {
            // Finish
            pivot.rotation.set(
                ax !== 0 ? targetAngle : 0,
                ay !== 0 ? targetAngle : 0,
                az !== 0 ? targetAngle : 0
            );
            pivot.updateMatrixWorld();

            // Detach back to mainGroup
            // We need to iterate backwards or clone the array because attach/detach modifies the children array
            [...pivot.children].forEach(c => {
                mainGroup.attach(c);
                // Round positions/rotations to prevent drift
                const p = new THREE.Vector3();
                const q = new THREE.Quaternion();
                const s = new THREE.Vector3();
                c.matrixWorld.decompose(p, q, s);

                // Snap position to grid
                p.x = Math.round(p.x / (cubeSize+gap)) * (cubeSize+gap);
                p.y = Math.round(p.y / (cubeSize+gap)) * (cubeSize+gap);
                p.z = Math.round(p.z / (cubeSize+gap)) * (cubeSize+gap);

                // Snap rotation to 90 degrees
                const e = new THREE.Euler().setFromQuaternion(q);
                e.x = Math.round(e.x / (Math.PI/2)) * (Math.PI/2);
                e.y = Math.round(e.y / (Math.PI/2)) * (Math.PI/2);
                e.z = Math.round(e.z / (Math.PI/2)) * (Math.PI/2);

                c.position.copy(p);
                c.rotation.copy(e);
                c.updateMatrix();
            });

            isRotating = false;
            updateHashDisplay();
        }
    }
    animateRotation();
}


// --- App Logic ---

setModeBtn.addEventListener('click', () => {
    mode = 'SET';
    setModeBtn.classList.add('active');
    unlockModeBtn.classList.remove('active');
    actionBtn.textContent = "SAVE PASSWORD";
    statusMessageEl.style.opacity = '0';
    updateHashDisplay();
    // Reset colors
    document.documentElement.style.setProperty('--primary', '#00f0ff');
});

unlockModeBtn.addEventListener('click', () => {
    mode = 'UNLOCK';
    unlockModeBtn.classList.add('active');
    setModeBtn.classList.remove('active');
    actionBtn.textContent = "ATTEMPT UNLOCK";
    statusMessageEl.style.opacity = '0';
    updateHashDisplay();
    // Change theme color to warn/action
    document.documentElement.style.setProperty('--primary', '#ff0055');
});

resetBtn.addEventListener('click', () => {
    initCube();
    statusMessageEl.style.opacity = '0';
});

actionBtn.addEventListener('click', () => {
    const currentHash = updateHashDisplay();

    if (mode === 'SET') {
        savedPasswordHash = currentHash;
        showStatus("PASSWORD SAVED", true);

        // Auto switch to unlock mode for convenience
        setTimeout(() => {
            initCube(); // Reset cube to scrambled state? No, reset to solved state usually.
            // Or maybe scramble it?
            // For a password demo, "Reset" means putting it back to neutral so user can enter pw.

            // Let's just reset the cube visually so they can try to unlock
            initCube();
            unlockModeBtn.click();
        }, 1500);

    } else {
        if (!savedPasswordHash) {
            showStatus("NO PASSWORD SET", false);
            return;
        }

        if (currentHash === savedPasswordHash) {
            showStatus("ACCESS GRANTED", true);
        } else {
            showStatus("ACCESS DENIED", false);
        }
    }
});

function showStatus(msg, isSuccess) {
    statusMessageEl.textContent = msg;
    statusMessageEl.className = isSuccess ? 'success' : 'failure';
    statusMessageEl.style.opacity = '1';

    // Hide after a few seconds
    setTimeout(() => {
        statusMessageEl.style.opacity = '0';
    }, 2000);
}

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
