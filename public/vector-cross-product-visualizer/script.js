import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let vectorA, vectorB, vectorCross;
let arrowA, arrowB, arrowCross;
let sphereA, sphereB;
let parallelogram;
let raycaster, mouse;
let isDraggingA = false, isDraggingB = false;
const intersectionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const colorA = 0xff5555;
const colorB = 0x5555ff;
const colorCross = 0xd055ff;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a24);

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Axes Helper
  const axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);

  // Grid Helper
  const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
  scene.add(gridHelper);

  // Initial Vectors
  vectorA = new THREE.Vector3(2, 0, 0);
  vectorB = new THREE.Vector3(0, 0, 2);
  vectorCross = new THREE.Vector3();

  // Create visual elements
  createVectors();
  createParallelogram();
  updateMath();

  // Interaction
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', onWindowResize);

  // Drag events
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // Animation loop
  renderer.setAnimationLoop(animate);
}

function getIntersect(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([sphereA, sphereB]);
  if (intersects.length > 0) {
    return intersects[0].object;
  }
  return null;
}

function onPointerDown(event) {
  const object = getIntersect(event);
  if (object) {
    if (object === sphereA) isDraggingA = true;
    if (object === sphereB) isDraggingB = true;
    controls.enabled = false;

    // Set intersection plane parallel to camera viewing plane
    const normal = camera.getWorldDirection(new THREE.Vector3());
    intersectionPlane.setFromNormalAndCoplanarPoint(normal, object.position);
  }
}

function onPointerMove(event) {
  if (!isDraggingA && !isDraggingB) {
    // Check hover state to change cursor
    const object = getIntersect(event);
    if (object) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersectPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(intersectionPlane, intersectPoint);

  if (intersectPoint) {
    if (isDraggingA) {
      vectorA.copy(intersectPoint);
    } else if (isDraggingB) {
      vectorB.copy(intersectPoint);
    }
    updateMath();
  }
}

function onPointerUp(event) {
  isDraggingA = false;
  isDraggingB = false;
  controls.enabled = true;
  document.body.style.cursor = 'default';
}

function createVectors() {
  const origin = new THREE.Vector3(0, 0, 0);

  // Arrow A
  arrowA = new THREE.ArrowHelper(vectorA.clone().normalize(), origin, vectorA.length(), colorA, 0.2, 0.2);
  scene.add(arrowA);

  // Arrow B
  arrowB = new THREE.ArrowHelper(vectorB.clone().normalize(), origin, vectorB.length(), colorB, 0.2, 0.2);
  scene.add(arrowB);

  // Arrow Cross
  arrowCross = new THREE.ArrowHelper(vectorCross.clone().normalize(), origin, vectorCross.length(), colorCross, 0.3, 0.3);
  scene.add(arrowCross);

  // Interactive spheres
  const sphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const matA = new THREE.MeshPhongMaterial({ color: colorA });
  sphereA = new THREE.Mesh(sphereGeometry, matA);
  sphereA.position.copy(vectorA);
  scene.add(sphereA);

  const matB = new THREE.MeshPhongMaterial({ color: colorB });
  sphereB = new THREE.Mesh(sphereGeometry, matB);
  sphereB.position.copy(vectorB);
  scene.add(sphereB);
}

function createParallelogram() {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff55,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  parallelogram = new THREE.Mesh(geometry, material);
  scene.add(parallelogram);
}

function updateMath() {
  // Calculate cross product
  vectorCross.crossVectors(vectorA, vectorB);
  const area = vectorCross.length();

  // Update Arrow A
  const lenA = vectorA.length();
  if (lenA > 0.001) {
    arrowA.setDirection(vectorA.clone().normalize());
    arrowA.setLength(lenA, 0.2, 0.2);
  }

  // Update Arrow B
  const lenB = vectorB.length();
  if (lenB > 0.001) {
    arrowB.setDirection(vectorB.clone().normalize());
    arrowB.setLength(lenB, 0.2, 0.2);
  }

  // Update Arrow Cross
  if (area > 0.001) {
    arrowCross.setDirection(vectorCross.clone().normalize());
    arrowCross.setLength(area, 0.3, 0.3);
    arrowCross.visible = true;
  } else {
    arrowCross.visible = false;
  }

  // Update spheres
  sphereA.position.copy(vectorA);
  sphereB.position.copy(vectorB);

  // Update Parallelogram
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = vectorA.clone();
  const p2 = new THREE.Vector3().addVectors(vectorA, vectorB);
  const p3 = vectorB.clone();

  const vertices = new Float32Array([
    p0.x, p0.y, p0.z,
    p1.x, p1.y, p1.z,
    p2.x, p2.y, p2.z,

    p0.x, p0.y, p0.z,
    p2.x, p2.y, p2.z,
    p3.x, p3.y, p3.z
  ]);
  parallelogram.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  // Update UI
  document.getElementById('vecA-val').textContent = `[${vectorA.x.toFixed(2)}, ${vectorA.y.toFixed(2)}, ${vectorA.z.toFixed(2)}]`;
  document.getElementById('vecB-val').textContent = `[${vectorB.x.toFixed(2)}, ${vectorB.y.toFixed(2)}, ${vectorB.z.toFixed(2)}]`;
  document.getElementById('cross-val').textContent = `[${vectorCross.x.toFixed(2)}, ${vectorCross.y.toFixed(2)}, ${vectorCross.z.toFixed(2)}]`;
  document.getElementById('area-val').textContent = area.toFixed(2);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
}

init();
