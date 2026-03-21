import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

let scene, camera, renderer, controls;
let marchingCubes;
const resolution = 40;

const initScene = () => {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 150);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Initialize Marching Cubes
  const material = new THREE.MeshStandardMaterial({
    color: 0xff3366,
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  marchingCubes = new MarchingCubes(resolution, material, true, true, 100000);
  marchingCubes.position.set(0, 0, 0);
  marchingCubes.scale.set(40, 40, 40);
  marchingCubes.isolation = 50; // default threshold

  scene.add(marchingCubes);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

const updateCubes = (time) => {
  marchingCubes.reset();

  // add several moving blobs to form the isosurface
  const numBlobs = 10;

  for (let i = 0; i < numBlobs; i++) {
    const ballx = 0.5 + 0.3 * Math.sin(time + i * 1.3);
    const bally = 0.5 + 0.3 * Math.cos(time * 0.8 + i * 2.1);
    const ballz = 0.5 + 0.3 * Math.sin(time * 1.1 + i * 0.9);

    // addball(x, y, z, strength, subtract)
    marchingCubes.addBall(ballx, bally, ballz, 0.2, 12);
  }

  marchingCubes.update();
};

const setup = () => {
  initScene();

  const slider = document.getElementById('threshold-slider');
  const valueDisplay = document.getElementById('threshold-value');

  slider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    valueDisplay.textContent = `${value}%`;
    marchingCubes.isolation = value;
  });

  const clock = new THREE.Clock();

  const render = () => {
    requestAnimationFrame(render);

    const time = clock.getElapsedTime();
    updateCubes(time * 0.5); // animate at a reasonable speed

    controls.update();
    renderer.render(scene, camera);
  };

  render();
};

document.addEventListener('DOMContentLoaded', setup);
