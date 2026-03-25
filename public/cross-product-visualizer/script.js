import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

let scene, camera, renderer, controls;
let arrowA, arrowB, arrowC;
let vecA, vecB, vecC;
let parallelogram;
let dragPoints = [];

const colorA = 0xff3366;
const colorB = 0x33ccff;
const colorC = 0xcc33ff;
const colorArea = 0xffff66;

const origin = new THREE.Vector3(0, 0, 0);

init();
animate();

function init() {
  const container = document.getElementById('three-container');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(5, 5, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Grid and Axes
  const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
  scene.add(gridHelper);
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // Initial Vectors
  vecA = new THREE.Vector3(2, 0, 0);
  vecB = new THREE.Vector3(0, 0, 2);
  vecC = new THREE.Vector3();

  // Arrows
  arrowA = new THREE.ArrowHelper(vecA.clone().normalize(), origin, vecA.length(), colorA, 0.3, 0.2);
  arrowB = new THREE.ArrowHelper(vecB.clone().normalize(), origin, vecB.length(), colorB, 0.3, 0.2);
  arrowC = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), origin, 1, colorC, 0.3, 0.2);

  // Make lines thicker for better visibility
  arrowA.line.material.linewidth = 3;
  arrowB.line.material.linewidth = 3;
  arrowC.line.material.linewidth = 4;

  scene.add(arrowA);
  scene.add(arrowB);
  scene.add(arrowC);

  // Parallelogram Area
  const areaGeometry = new THREE.BufferGeometry();
  const areaMaterial = new THREE.MeshBasicMaterial({
    color: colorArea,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
  parallelogram = new THREE.Mesh(areaGeometry, areaMaterial);
  scene.add(parallelogram);

  // Interactive points at the tips of vectors A and B
  createDragPoint(vecA, colorA, 'A');
  createDragPoint(vecB, colorB, 'B');

  // Drag Controls
  const dragControls = new DragControls(dragPoints, camera, renderer.domElement);
  dragControls.addEventListener('dragstart', function () {
    controls.enabled = false;
  });
  dragControls.addEventListener('drag', function (event) {
    if (event.object.userData.id === 'A') {
      vecA.copy(event.object.position);
    } else if (event.object.userData.id === 'B') {
      vecB.copy(event.object.position);
    }
    updateVisuals();
  });
  dragControls.addEventListener('dragend', function () {
    controls.enabled = true;
  });

  updateVisuals();

  window.addEventListener('resize', onWindowResize);
}

function createDragPoint(position, color, id) {
  const geometry = new THREE.SphereGeometry(0.2, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(position);
  sphere.userData.id = id;
  scene.add(sphere);
  dragPoints.push(sphere);
}

function updateVisuals() {
  // Update Arrow A
  const lengthA = vecA.length();
  const dirA = vecA.clone().normalize();
  if (lengthA > 0.001) {
    arrowA.setDirection(dirA);
    arrowA.setLength(lengthA, 0.3, 0.2);
    arrowA.visible = true;
  } else {
    arrowA.visible = false;
  }

  // Update Arrow B
  const lengthB = vecB.length();
  const dirB = vecB.clone().normalize();
  if (lengthB > 0.001) {
    arrowB.setDirection(dirB);
    arrowB.setLength(lengthB, 0.3, 0.2);
    arrowB.visible = true;
  } else {
    arrowB.visible = false;
  }

  // Calculate Cross Product C = A x B
  vecC.crossVectors(vecA, vecB);
  const lengthC = vecC.length();
  const dirC = vecC.clone().normalize();

  if (lengthC > 0.001) {
    arrowC.setDirection(dirC);
    // Scale down the visual length of C if it gets too large to keep it on screen,
    // but keep proportional. Or just show true length.
    // Let's show true length for accuracy.
    arrowC.setLength(lengthC, 0.3, 0.2);
    arrowC.visible = true;
  } else {
    arrowC.visible = false;
  }

  // Update Parallelogram
  const p1 = origin;
  const p2 = vecA;
  const p3 = new THREE.Vector3().addVectors(vecA, vecB);
  const p4 = vecB;

  const vertices = new Float32Array([
    p1.x, p1.y, p1.z,
    p2.x, p2.y, p2.z,
    p3.x, p3.y, p3.z,

    p1.x, p1.y, p1.z,
    p3.x, p3.y, p3.z,
    p4.x, p4.y, p4.z
  ]);

  parallelogram.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  parallelogram.geometry.computeVertexNormals();

  updateUI(lengthC);
}

function updateUI(area) {
  const format = (val) => val.toFixed(2);

  document.getElementById('val-a').textContent = `[${format(vecA.x)}, ${format(vecA.y)}, ${format(vecA.z)}]`;
  document.getElementById('val-b').textContent = `[${format(vecB.x)}, ${format(vecB.y)}, ${format(vecB.z)}]`;
  document.getElementById('val-c').textContent = `[${format(vecC.x)}, ${format(vecC.y)}, ${format(vecC.z)}]`;
  document.getElementById('val-area').textContent = format(area);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
