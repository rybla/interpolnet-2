
import * as CANNON from './cannon-es.js';

// --- Constants & Config ---
const COIN_RADIUS = 0.5;
const COIN_THICKNESS = 0.1;
const JAR_RADIUS = 1.8;
const JAR_HEIGHT = 4;
const TABLE_SIZE = 30;

// --- Globals ---
let scene, camera, renderer;
let world;
let raycaster, mouse;
let lastCallTime = 0;
const timeStep = 1 / 60;

const coins = []; // { mesh, body, value }
const jars = []; // { mesh, body, label, categoryId, value, el, pos }

// Interaction globals
let dragConstraint = null;
let dragBody = null; // The kinematic body the mouse controls
let isDragging = false;
let dragPlane = new THREE.Plane();
let dragOffset = new THREE.Vector3();
let intersectionPoint = new THREE.Vector3();

// Audio Context
let audioCtx;

// --- Initialization ---

function init() {
    // 1. Three.js Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    scene.fog = new THREE.Fog(0xf0f4f8, 10, 50);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 2. Cannon.js Setup
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.SAPBroadphase(world);

    // Materials
    const defaultMaterial = new CANNON.Material('default');
    const coinMaterial = new CANNON.Material('coin');
    const glassMaterial = new CANNON.Material('glass');

    const coinTableContact = new CANNON.ContactMaterial(coinMaterial, defaultMaterial, {
        friction: 0.3,
        restitution: 0.3,
    });
    const coinCoinContact = new CANNON.ContactMaterial(coinMaterial, coinMaterial, {
        friction: 0.3,
        restitution: 0.2,
    });
    const coinGlassContact = new CANNON.ContactMaterial(coinMaterial, glassMaterial, {
        friction: 0.1,
        restitution: 0.5,
    });

    world.addContactMaterial(coinTableContact);
    world.addContactMaterial(coinCoinContact);
    world.addContactMaterial(coinGlassContact);

    // 3. Helpers
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 4. Create Objects
    createTable(defaultMaterial);

    // Jars
    createJar(-5, 0, 'Vacation', 'cat-vacation', glassMaterial);
    createJar(0, 0, 'Emergency', 'cat-emergency', glassMaterial);
    createJar(5, 0, 'Gadgets', 'cat-gadgets', glassMaterial);

    // Coins
    spawnCoins(30, coinMaterial);

    // Mouse Interaction Body (Kinematic)
    // Shape is not strictly needed for constraint but helps debug
    const shape = new CANNON.Sphere(0.1);
    dragBody = new CANNON.Body({ mass: 0 });
    dragBody.addShape(shape);
    dragBody.collisionFilterGroup = 0;
    dragBody.collisionFilterMask = 0;
    world.addBody(dragBody);

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    document.getElementById('reset-btn').addEventListener('click', resetCoins);

    // Audio init
    window.addEventListener('click', initAudio, { once: true });

    // Start Loop
    animate();
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playCollisionSound(velocity) {
    if (!audioCtx) return;
    if (velocity < 1) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.value = 1200 + Math.random() * 600;
    osc.type = 'sine';

    const vol = Math.min(velocity / 15, 0.5);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// --- Object Creation ---

function createTable(material) {
    // Physics
    const groundBody = new CANNON.Body({
        mass: 0,
        material: material
    });
    const groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Visual
    const geometry = new THREE.PlaneGeometry(TABLE_SIZE, TABLE_SIZE);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.8,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

function createJar(x, z, labelText, categoryId, material) {
    const jarGroup = new THREE.Group();
    jarGroup.position.set(x, JAR_HEIGHT / 2, z);
    scene.add(jarGroup);

    // Visuals
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.95,
        transparent: true,
        thickness: 0.5,
        side: THREE.DoubleSide
    });

    const bottomGeo = new THREE.CylinderGeometry(JAR_RADIUS, JAR_RADIUS, 0.2, 32);
    const bottomMesh = new THREE.Mesh(bottomGeo, glassMat);
    bottomMesh.position.y = -JAR_HEIGHT / 2 + 0.1;
    bottomMesh.castShadow = true;
    bottomMesh.receiveShadow = true;
    jarGroup.add(bottomMesh);

    const wallGeo = new THREE.CylinderGeometry(JAR_RADIUS, JAR_RADIUS, JAR_HEIGHT, 32, 1, true);
    const wallMesh = new THREE.Mesh(wallGeo, glassMat);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    jarGroup.add(wallMesh);

    // Physics
    const jarBody = new CANNON.Body({ mass: 0, material: material });
    jarBody.position.set(x, JAR_HEIGHT / 2, z);

    // Bottom cylinder
    const cylinderShape = new CANNON.Cylinder(JAR_RADIUS, JAR_RADIUS, 0.2, 16);
    const quat = new CANNON.Quaternion();
    quat.setFromEuler(-Math.PI/2, 0, 0);
    jarBody.addShape(cylinderShape, new CANNON.Vec3(0, -JAR_HEIGHT/2 + 0.1, 0), quat);

    // Walls (approximated)
    const numSegments = 12;
    const wallThickness = 0.2;
    // We place boxes around the perimeter
    const wallHeight = JAR_HEIGHT;
    const perimeter = 2 * Math.PI * JAR_RADIUS;
    const segmentWidth = (perimeter / numSegments) + 0.2; // Slight overlap

    for (let i = 0; i < numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        const wx = Math.cos(angle) * JAR_RADIUS;
        const wz = Math.sin(angle) * JAR_RADIUS;

        const boxShape = new CANNON.Box(new CANNON.Vec3(segmentWidth / 2, wallHeight / 2, wallThickness / 2));
        const boxQuat = new CANNON.Quaternion();
        boxQuat.setFromEuler(0, -angle, 0); // Face inward/outward

        jarBody.addShape(boxShape, new CANNON.Vec3(wx, 0, wz), boxQuat);
    }

    world.addBody(jarBody);

    // Label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'jar-label';
    labelDiv.innerText = labelText;
    document.body.appendChild(labelDiv);

    jars.push({
        mesh: jarGroup,
        body: jarBody,
        label: labelText,
        categoryId: categoryId,
        value: 0,
        el: labelDiv,
        pos: new THREE.Vector3(x, JAR_HEIGHT, z)
    });
}

function spawnCoins(count, material) {
    const coinGeo = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 24);
    const coinMatGold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const coinMatSilver = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });

    // Rotate geometry to match physics (Y-up visual -> Z-up physics, wait physics Cylinder is Z-axis aligned?)
    // Cannon Cylinder is Z-axis aligned.
    // Three Cylinder is Y-axis aligned.
    // If we want coin to lie flat on table (normal up Y):
    // Physics: Cylinder axis Z. Rotate body -90 X -> Cylinder axis Y.
    // Visual: Cylinder axis Y. Matches body orientation.
    // BUT Cannon Cylinder shape is defined with axis along Z.
    // So if body has no rotation, cylinder points Z (lying on side).
    // If we want flat on table, we rotate Body -90 X.
    // Then visual mesh (Y-axis) also rotates -90 X, so it points Z (lying on side).
    // Wait. Visual cylinder is Y-axis. If we rotate mesh -90X, it becomes Z-axis (lying on side).
    // So if Physics Body is rotated -90X to be upright (wait, Z axis becomes Y axis?), then shape is upright.
    // Let's verify Cannon Cylinder axis.
    // Cannon Cylinder: "The cylinder axis is parallel to the z-axis."
    // So if body is identity rotation, cylinder is horizontal (rolling).
    // To make it upright (like a coin on a table face up), we need axis to be Y.
    // Rotate -90 deg around X: Z becomes Y. Y becomes -Z.
    // So yes, -90 X rotation makes Cannon Cylinder upright.
    // Three Cylinder is Y axis by default.
    // If we attach Three Mesh to Cannon Body directly:
    // Body Rot = -90 X. Mesh Rot = -90 X.
    // Mesh Y axis (up) becomes Z axis (forward).
    // So Mesh lies on side? No.
    // Mesh Y axis points to Body Y axis (which is World Z axis before rotation? No).
    // Coordinate systems:
    // Body Local Z (Cylinder Axis) -> World Y (Up) after -90X rot.
    // Mesh Local Y (Cylinder Axis) -> needs to map to Body Local Z?
    // If Mesh is child of Body (conceptually):
    // Mesh quaternion should rotate Mesh Y to Body Z.
    // Rotate Mesh 90 X relative to Body?
    // Let's just fix Mesh to Body.
    // If Body is upright (coin flat), its local Z is World Y.
    // Visual Mesh is Y-aligned. We want Visual Y to be World Y.
    // So Visual Y should align with Body Z.
    // Rotation X +90 (PI/2) maps Y to Z.
    // So Mesh should have X+90 relative to Body.
    // OR we can just create the mesh such that it aligns with Z.
    // createMesh() -> rotate geometry 90 X.

    coinGeo.rotateX(Math.PI / 2); // Now mesh axis is Z.
    // Now mesh and physics shape match (both Z axis).

    for (let i = 0; i < count; i++) {
        const isGold = Math.random() > 0.5;
        const mesh = new THREE.Mesh(coinGeo, isGold ? coinMatGold : coinMatSilver);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const body = new CANNON.Body({ mass: 1, material: material });
        const shape = new CANNON.Cylinder(COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 16);
        body.addShape(shape); // Shape is Z-aligned

        // Position in pile
        body.position.set((Math.random() - 0.5) * 6, 2 + i * 0.2, (Math.random() - 0.5) * 6 + 6);
        // Random rotation (some flat, some on edge)
        body.quaternion.setFromEuler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

        body.linearDamping = 0.5;
        body.angularDamping = 0.5;

        world.addBody(body);

        body.addEventListener('collide', (e) => {
            const relVel = e.contact.getImpactVelocityAlongNormal();
            if (Math.abs(relVel) > 0.5) {
                playCollisionSound(Math.abs(relVel));
            }
        });

        coins.push({
            mesh: mesh,
            body: body,
            value: isGold ? 10 : 5
        });
    }
}

function resetCoins() {
    coins.forEach((c, i) => {
        c.body.position.set((Math.random() - 0.5) * 6, 2 + i * 0.2, (Math.random() - 0.5) * 6 + 6);
        c.body.velocity.set(0, 0, 0);
        c.body.angularVelocity.set(0, 0, 0);
        c.body.quaternion.setFromEuler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        c.body.wakeUp();
    });
}

// --- Interaction ---

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Intersect with coins meshes
    const intersects = raycaster.intersectObjects(coins.map(c => c.mesh));

    if (intersects.length > 0) {
        isDragging = true;
        const hit = intersects[0];
        const coin = coins.find(c => c.mesh === hit.object);

        if (coin) {
            // Define drag plane
            // Plane passes through hit point, normal to camera direction (billboard)
            dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), hit.point);

            // Calculate offset (not strictly needed if we snap, but good for relative drag)
            // For PointToPoint, we need to know where on the body we clicked (local pivot)
            const localPivot = new CANNON.Vec3();
            // Vector from body center to hit point (world)
            const worldPivot = new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z);
            coin.body.pointToLocalFrame(worldPivot, localPivot);

            // Setup constraint
            addMouseConstraint(hit.point.x, hit.point.y, hit.point.z, coin.body, localPivot);
            coin.body.wakeUp();

            // Disable damping while dragging for responsiveness?
            // coin.body.linearDamping = 0;
            // coin.body.angularDamping = 0;
        }
    }
}

function onPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDragging && dragConstraint) {
        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
            // Move drag body to intersection point
            dragBody.position.set(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
        }
    }
}

function onPointerUp(event) {
    isDragging = false;
    removeMouseConstraint();
}

function addMouseConstraint(x, y, z, body, localPivot) {
    dragBody.position.set(x, y, z);

    // Constraint from body-local-pivot to dragBody-center
    // pivotB is 0,0,0 (center of dragBody)
    dragConstraint = new CANNON.PointToPointConstraint(body, localPivot, dragBody, new CANNON.Vec3(0,0,0));
    world.addConstraint(dragConstraint);
}

function removeMouseConstraint() {
    if (dragConstraint) {
        world.removeConstraint(dragConstraint);
        dragConstraint = null;
    }
}

// --- Loop ---

let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() / 1000;
    const dt = time - lastCallTime;
    lastCallTime = time;

    // Step Physics
    // Fixed time step for stability
    world.step(timeStep, dt, 3);

    // Sync Visuals
    for (const coin of coins) {
        coin.mesh.position.copy(coin.body.position);
        coin.mesh.quaternion.copy(coin.body.quaternion);
    }

    // Update Label Positions (every frame is fine, simple arithmetic)
    for (const jar of jars) {
        const pos = jar.pos.clone();
        pos.project(camera);
        // pos is -1 to 1
        // Convert to screen
        if (pos.z < 1) { // Only if in front of camera
             const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
             const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
             jar.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
             jar.el.style.display = 'block';
        } else {
             jar.el.style.display = 'none';
        }
    }

    // Game Logic: Check Jars (Throttle)
    frameCount++;
    if (frameCount % 10 === 0) {
        updateDashboard();
    }

    renderer.render(scene, camera);
}

function updateDashboard() {
    // Reset values
    jars.forEach(j => j.value = 0);
    let total = 0;

    for (const coin of coins) {
        const p = coin.body.position;
        // Check if inside any jar
        for (const jar of jars) {
            const dx = p.x - jar.body.position.x;
            const dz = p.z - jar.body.position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);

            // Jar radius 1.8.
            if (dist < JAR_RADIUS - 0.2 && p.y > 0 && p.y < JAR_HEIGHT) {
                jar.value += coin.value;
            }
        }
    }

    // Update DOM
    jars.forEach(j => {
        const el = document.getElementById(j.categoryId);
        if (el) el.innerText = `${j.label}: $${j.value}`;
        total += j.value;
    });
    const totalEl = document.getElementById('total-saved');
    if (totalEl) totalEl.innerText = `$${total}`;
}

// Start
init();
