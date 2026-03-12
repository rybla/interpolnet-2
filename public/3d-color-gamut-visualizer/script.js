/**
 * 3D Color Gamut Visualizer
 */

let scene, camera, renderer, controls;
let pointCloud, geometry;
let currentMode = 'rgb';
let targetPositions = [];
let currentPositions = [];
let rgbPositions = [];
let hsvPositions = [];
let labPositions = [];
let transitionProgress = 1;

const numPointsPerAxis = 16;
const totalPoints = numPointsPerAxis * numPointsPerAxis * numPointsPerAxis;

// Layout modes mapping
const MODES = ['rgb', 'hsv', 'cielab'];

// ----- Color Space Conversion Functions -----

// Convert RGB [0,1] to HSV [0,1]
function rgbToHsv(r, g, b) {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let d = max - min;
  let h, s, v = max;

  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

// Convert RGB [0,1] to CIELAB
function rgbToXyz(r, g, b) {
  let [rL, gL, bL] = [r, g, b].map(v => {
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });

  rL *= 100;
  gL *= 100;
  bL *= 100;

  let x = rL * 0.4124 + gL * 0.3576 + bL * 0.1805;
  let y = rL * 0.2126 + gL * 0.7152 + bL * 0.0722;
  let z = rL * 0.0193 + gL * 0.1192 + bL * 0.9505;

  return { x, y, z };
}

function xyzToLab(x, y, z) {
  // D65 standard referent
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let [xL, yL, zL] = [x / refX, y / refY, z / refZ].map(v => {
    return v > 0.008856 ? Math.pow(v, 1/3) : (7.787 * v) + (16 / 116);
  });

  let l = (116 * yL) - 16;
  let a = 500 * (xL - yL);
  let b = 200 * (yL - zL);

  return { l, a, b };
}

function rgbToLab(r, g, b) {
  let xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

function init() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(2, 2, 4);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;

  // Create coordinate axes
  const axesHelper = new THREE.AxesHelper(1.5);
  scene.add(axesHelper);

  createPointCloud();

  setupUI();

  window.addEventListener('resize', onWindowResize);

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupUI() {
  const buttons = document.querySelectorAll('.mode-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active from all
      buttons.forEach(b => b.classList.remove('active'));
      // Add active to clicked
      e.target.classList.add('active');

      const newMode = e.target.getAttribute('data-mode');
      if (newMode !== currentMode) {
        setTargetMode(newMode);
      }
    });
  });
}

function createPointCloud() {
  geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(totalPoints * 3);
  const colors = new Float32Array(totalPoints * 3);

  let i = 0;
  for (let r = 0; r < numPointsPerAxis; r++) {
    for (let g = 0; g < numPointsPerAxis; g++) {
      for (let b = 0; b < numPointsPerAxis; b++) {
        // Normalize to [0, 1]
        const nR = r / (numPointsPerAxis - 1);
        const nG = g / (numPointsPerAxis - 1);
        const nB = b / (numPointsPerAxis - 1);

        // Colors
        colors[i * 3] = nR;
        colors[i * 3 + 1] = nG;
        colors[i * 3 + 2] = nB;

        // --- RGB Positions (Cube centered at origin) ---
        rgbPositions.push(nR - 0.5, nG - 0.5, nB - 0.5);

        // --- HSV Positions (Cylinder/Cone) ---
        const hsv = rgbToHsv(nR, nG, nB);
        // radius = saturation, height = value, angle = hue
        const radius = hsv.s;
        const angle = hsv.h * Math.PI * 2;
        const hsvX = radius * Math.cos(angle);
        const hsvZ = radius * Math.sin(angle);
        const hsvY = hsv.v - 0.5;
        hsvPositions.push(hsvX, hsvY, hsvZ);

        // --- CIELAB Positions ---
        const lab = rgbToLab(nR, nG, nB);
        // Normalize roughly to [-1, 1] for visual consistency
        // L: [0, 100], a: [-128, 127], b: [-128, 127]
        const labY = (lab.l / 100) - 0.5;
        const labX = lab.a / 128;
        const labZ = lab.b / 128;
        labPositions.push(labX, labY, labZ);

        i++;
      }
    }
  }

  // Initialize with RGB positions
  currentPositions = [...rgbPositions];
  targetPositions = [...rgbPositions];

  for (let j = 0; j < totalPoints * 3; j++) {
    positions[j] = currentPositions[j];
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  pointCloud = new THREE.Points(geometry, material);
  scene.add(pointCloud);
}

function setTargetMode(mode) {
  currentMode = mode;
  transitionProgress = 0;

  switch(mode) {
    case 'rgb': targetPositions = [...rgbPositions]; break;
    case 'hsv': targetPositions = [...hsvPositions]; break;
    case 'cielab': targetPositions = [...labPositions]; break;
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Interpolate positions
  if (transitionProgress < 1 && geometry) {
    transitionProgress += 0.02; // Speed of transition
    if (transitionProgress > 1) transitionProgress = 1;

    const positions = geometry.attributes.position.array;
    for (let i = 0; i < totalPoints * 3; i++) {
      // Lerp
      currentPositions[i] += (targetPositions[i] - currentPositions[i]) * 0.1;
      positions[i] = currentPositions[i];
    }
    geometry.attributes.position.needsUpdate = true;
  }

  controls.update();
  renderer.render(scene, camera);
}

window.onload = init;
