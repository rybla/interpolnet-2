import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0f19'); // matching css background

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 15, 25);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Add Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Setup Axes Helper
const axesHelper = new THREE.AxesHelper(15);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
scene.add(gridHelper);

// Vector State
let vecU = new THREE.Vector3(5, 0, 0);
let vecV = new THREE.Vector3(0, 0, 5);

// Colors matching CSS
const colorU = 0x00ffcc;
const colorV = 0xff00ff;
const colorCross = 0xffff00;

// Materials
const matU = new THREE.MeshPhongMaterial({ color: colorU, emissive: 0x003322 });
const matV = new THREE.MeshPhongMaterial({ color: colorV, emissive: 0x330033 });
const matCross = new THREE.MeshPhongMaterial({ color: colorCross, emissive: 0x333300 });
const matParallelogram = new THREE.MeshBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
});

// Arrow Helpers
const origin = new THREE.Vector3(0, 0, 0);

const arrowU = new THREE.ArrowHelper(vecU.clone().normalize(), origin, vecU.length(), colorU, 1, 0.5);
const arrowV = new THREE.ArrowHelper(vecV.clone().normalize(), origin, vecV.length(), colorV, 1, 0.5);
const crossProductVec = new THREE.Vector3().crossVectors(vecU, vecV);
const arrowCross = new THREE.ArrowHelper(crossProductVec.clone().normalize(), origin, crossProductVec.length(), colorCross, 1, 0.5);

scene.add(arrowU);
scene.add(arrowV);
scene.add(arrowCross);

// Interactive Handles (Spheres at vector endpoints)
const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32);
const handleU = new THREE.Mesh(sphereGeo, matU);
const handleV = new THREE.Mesh(sphereGeo, matV);

handleU.position.copy(vecU);
handleV.position.copy(vecV);

scene.add(handleU);
scene.add(handleV);

// Parallelogram Area
const parallelogramGeo = new THREE.BufferGeometry();
const parallelogramMesh = new THREE.Mesh(parallelogramGeo, matParallelogram);
scene.add(parallelogramMesh);

// UI Elements
const uiValU = document.getElementById('val-u');
const uiValV = document.getElementById('val-v');
const uiValCross = document.getElementById('val-cross');
const uiValArea = document.getElementById('val-area');

function formatVector(v) {
    return `[${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)}]`;
}

function updateVisualization() {
    // Update vector vectors from handle positions
    vecU.copy(handleU.position);
    vecV.copy(handleV.position);

    // Update Arrows U and V
    const lenU = vecU.length();
    if (lenU > 0.0001) {
        arrowU.setDirection(vecU.clone().normalize());
        arrowU.setLength(lenU, 1, 0.5);
    }

    const lenV = vecV.length();
    if (lenV > 0.0001) {
        arrowV.setDirection(vecV.clone().normalize());
        arrowV.setLength(lenV, 1, 0.5);
    }

    // Update Cross Product Arrow
    crossProductVec.crossVectors(vecU, vecV);
    const lenCross = crossProductVec.length();

    // Safety check for zero cross product (parallel vectors or zero vectors)
    if (lenCross > 0.0001) {
        arrowCross.setDirection(crossProductVec.clone().normalize());
        arrowCross.setLength(lenCross, 1, 0.5);
        arrowCross.visible = true;
    } else {
        arrowCross.visible = false;
    }

    // Update Parallelogram Geometry
    const p3 = new THREE.Vector3().addVectors(vecU, vecV);

    // Triangles: (0, u, v) and (u, p3, v)
    const vertices = new Float32Array([
        0, 0, 0,
        vecU.x, vecU.y, vecU.z,
        vecV.x, vecV.y, vecV.z,

        vecU.x, vecU.y, vecU.z,
        p3.x, p3.y, p3.z,
        vecV.x, vecV.y, vecV.z
    ]);

    parallelogramGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    parallelogramGeo.computeVertexNormals();

    // Update UI Readouts
    uiValU.innerText = formatVector(vecU);
    uiValV.innerText = formatVector(vecV);
    uiValCross.innerText = formatVector(crossProductVec);
    uiValArea.innerText = lenCross.toFixed(2);
}

// Initial setup
updateVisualization();

// Raycasting / Dragging Logic
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let draggedObject = null;
const planeNormal = new THREE.Vector3();
const intersectionPoint = new THREE.Vector3();
const dragPlane = new THREE.Plane();

window.addEventListener('pointerdown', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([handleU, handleV]);

    if (intersects.length > 0) {
        draggedObject = intersects[0].object;
        controls.enabled = false; // Disable orbit controls

        // Create a plane parallel to the camera view for dragging
        planeNormal.copy(camera.position).normalize();
        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, draggedObject.position);
        document.body.style.cursor = 'grabbing';
    }
});

window.addEventListener('pointermove', (event) => {
    if (!draggedObject) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Update plane to stay parallel to camera but pass through the object's original depth
    planeNormal.subVectors(camera.position, controls.target).normalize();
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, draggedObject.position);

    if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
        draggedObject.position.copy(intersectionPoint);
        updateVisualization();
    }
});

window.addEventListener('pointerup', () => {
    if (draggedObject) {
        draggedObject = null;
        controls.enabled = true; // Re-enable orbit controls
        document.body.style.cursor = 'default';
    }
});

// Responsive resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
