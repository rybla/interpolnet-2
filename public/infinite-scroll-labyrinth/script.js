const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Path Generation ---
function createLabyrinthPath() {
    const points = [];
    const loopCount = 5;
    const radius = 50;
    const height = 200;

    for (let i = 0; i <= 500; i++) {
        const t = i / 500;
        const angle = t * Math.PI * 2 * loopCount;

        // A spiral that twists and turns
        const x = Math.cos(angle) * radius * (1 + Math.sin(t * Math.PI * 4) * 0.5);
        const y = t * height - height / 2 + Math.sin(angle * 3) * 20;
        const z = Math.sin(angle) * radius * (1 + Math.cos(t * Math.PI * 3) * 0.5);

        points.push(new THREE.Vector3(x, y, z));
    }

    // Close the loop smoothly for infinite feeling (though we just oscillate back and forth or reset)
    // Actually, let's just make it a long path and bounce back or loop.
    return new THREE.CatmullRomCurve3(points);
}

const path = createLabyrinthPath();
// Helper for visualization (debug)
// const tubeGeometry = new THREE.TubeGeometry(path, 500, 2, 8, false);
// const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, opacity: 0.1, transparent: true });
// const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
// scene.add(tube);


// --- Text Content ---
const storySegments = [
    "In the beginning,", "there was the void.", "A silence so deep", "it echoed forever.",
    "Then, a spark.", "A flicker of light", "in the endless dark.", "It grew brighter,",
    "hotter,", "until it burst", "into a billion stars.", "Galaxies spiraled,",
    "nebulae bloomed,", "and time began", "its relentless march.", "We are stardust,",
    "wandering through", "the labyrinth of existence.", "Seeking meaning", "in the chaos.",
    "Every turn", "a new mystery.", "Every shadow", "a hidden truth.", "The path is long,",
    "twisting and turning.", "Do not look back.", "Keep moving forward.", "The end is",
    "just another beginning.", "Infinite cycles,", "eternal returns.", "Lost in the scroll,",
    "found in the flow.", "The labyrinth awaits.", "Will you enter?", "Or will you",
    "remain on the edge?", "Step into the unknown.", "Embrace the vertigo.", "Let the words",
    "guide your way.", "Through the spiral", "of consciousness.", "Deeper,", "and deeper.",
    "Until the self", "dissolves into", "pure information.", "Welcome to", "the infinite."
];

// --- Font Loading and Text Generation ---
const loader = new THREE.FontLoader();
let textMeshes = [];

loader.load('lib/helvetiker_regular.typeface.json', function (font) {
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

    storySegments.forEach((text, index) => {
        const textGeo = new THREE.TextGeometry(text, {
            font: font,
            size: 3,
            height: 0.5,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 3
        });

        textGeo.center(); // Center the geometry

        const mesh = new THREE.Mesh(textGeo, material);

        // Position along the curve
        const t = (index / storySegments.length) % 1;
        const point = path.getPointAt(t);
        const tangent = path.getTangentAt(t).normalize();

        mesh.position.copy(point);

        // Orient the text to face slightly towards the camera path but mostly upright relative to curve
        // We look at the next point on the curve
        const nextPoint = path.getPointAt((t + 0.01) % 1);
        mesh.lookAt(nextPoint);

        // Add some random rotation for chaos
        // mesh.rotateZ(Math.random() * 0.5 - 0.25);

        scene.add(mesh);
        textMeshes.push({ mesh, t });
    });

    // Generate Stars
    addStars();

    // Hide loading, show instructions
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('instruction').classList.add('visible');

    animate();
});

function addStars() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);

    for(let i = 0; i < starCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 500; // Spread out far
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({
        size: 0.5,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });

    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);
}


// --- Scroll Interaction ---
let scrollProgress = 0;
let targetProgress = 0;
const dampening = 0.05;

window.addEventListener('wheel', (event) => {
    // Adjust sensitivity
    const delta = event.deltaY * 0.0001;
    targetProgress += delta;

    // Clamp or loop? Let's loop for "Infinite" feel
    // Actually, looping might be jarring if the end doesn't meet the start perfectly.
    // But let's just keep incrementing and use modulo for curve sampling.
});

// Touch support for mobile
let touchStartY = 0;
window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});
window.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const delta = (touchStartY - touchY) * 0.0002;
    targetProgress += delta;
    touchStartY = touchY;
});


// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    // Smooth scroll
    scrollProgress += (targetProgress - scrollProgress) * dampening;

    // Camera Movement
    // We map scrollProgress to t (0..1) on the curve
    // We use modulo 1 to loop the path forever
    const t = Math.abs(scrollProgress) % 1;
    const lookAhead = (t + 0.05) % 1;

    const camPos = path.getPointAt(t);
    const camTarget = path.getPointAt(lookAhead);

    // Add some offset to camera so we are not INSIDE the curve/text
    // We need the normal vector.
    // Ideally we compute Frenet frames but simpler is to offset by Up or cross product

    // Simple offset logic:
    // Move slightly "up" relative to the spiral
    // Or just follow the point exactly but look ahead?
    // If we are on the path, we might clip through text.
    // Let's offset slightly perpendicular to the tangent.

    const tangent = path.getTangentAt(t).normalize();
    // approximate normal (not robust but okay for this)
    const axis = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, axis).normalize();

    // If tangent is vertical, normal might be zero. Handle that?
    if (normal.lengthSq() < 0.001) {
        normal.set(1, 0, 0);
    }

    // Dynamic camera offset based on time or position for "swooping"
    const time = clock.getElapsedTime();
    const swoop = Math.sin(time * 0.5) * 2;

    const offset = normal.multiplyScalar(5 + swoop);

    camera.position.copy(camPos).add(offset);
    camera.lookAt(camTarget);

    // Roll the camera slightly based on turn
    // camera.up.set(0, 1, 0); // Default up
    // Or twist with the curve:
    // const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    // camera.up.copy(binormal); // intense rolling

    // Let's stick to default up for now to avoid too much nausea,
    // but maybe tilt slightly
    camera.up.set(0, 1, 0).applyAxisAngle(tangent, Math.sin(time * 0.2) * 0.5);

    // Color cycling for text
    const hue = (time * 0.1) % 1;
    textMeshes.forEach((item) => {
        // item.mesh.material.color.setHSL((hue + item.t) % 1, 0.8, 0.5);
        // Actually, let's keep it simple neon cyan/magenta
        // Or distance based opacity?

        const dist = item.mesh.position.distanceTo(camera.position);
        // Fade out if too close or too far
        // Material needs to be transparent for opacity to work
        // But we used BasicMaterial without transparent: true.
    });

    renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
