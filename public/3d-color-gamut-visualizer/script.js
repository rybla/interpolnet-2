// 3D Color Gamut Visualizer

let scene, camera, renderer, controls;
let pointCloud;

// Settings
const numPoints = 64000;
const pointSize = 0.02;

let currentMode = 'rgb';
const targetPositions = new Float32Array(numPoints * 3);

// Data arrays for different modes
const pointsRGB = new Float32Array(numPoints * 3);
const pointsHSV = new Float32Array(numPoints * 3);
const pointsLAB = new Float32Array(numPoints * 3);

// Initialize color spaces data
generateColorData();

init();
animate();

function init() {
  const container = document.getElementById('canvas-container');

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(2, 2, 3);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.0;

  // Create axes helper for context
  const axesHelper = new THREE.AxesHelper(1.5);
  // Red = X, Green = Y, Blue = Z
  scene.add(axesHelper);

  const geometry = new THREE.BufferGeometry();

  const initialPositions = new Float32Array(numPoints * 3);
  initialPositions.set(pointsRGB);

  // Target position buffer is used for animating
  targetPositions.set(pointsRGB);

  // We use the RGB point positions as colors (since R,G,B are 0-1)
  const colors = new Float32Array(numPoints * 3);
  colors.set(pointsRGB);

  geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  pointCloud = new THREE.Points(geometry, material);
  scene.add(pointCloud);

  // Window resize handler
  window.addEventListener('resize', onWindowResize);

  setupUI();
}

function setupUI() {
  const btnRgb = document.getElementById('btn-rgb');
  const btnHsv = document.getElementById('btn-hsv');
  const btnLab = document.getElementById('btn-cielab');

  btnRgb.addEventListener('click', () => {
    setActiveButton(btnRgb);
    transitionTo(pointsRGB);
    currentMode = 'rgb';
  });

  btnHsv.addEventListener('click', () => {
    setActiveButton(btnHsv);
    transitionTo(pointsHSV);
    currentMode = 'hsv';
  });

  btnLab.addEventListener('click', () => {
    setActiveButton(btnLab);
    transitionTo(pointsLAB);
    currentMode = 'cielab';
  });
}

function setActiveButton(activeBtn) {
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

function transitionTo(newTargetArray) {
  targetPositions.set(newTargetArray);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateColorData() {
  const steps = Math.cbrt(numPoints);
  const stepSize = 1.0 / (steps - 1);

  let i = 0;
  for (let r = 0; r < steps; r++) {
    for (let g = 0; g < steps; g++) {
      for (let b = 0; b < steps; b++) {
        // RGB is 0 to 1
        const rv = r * stepSize;
        const gv = g * stepSize;
        const bv = b * stepSize;

        // RGB positions
        pointsRGB[i * 3] = rv;
        pointsRGB[i * 3 + 1] = gv;
        pointsRGB[i * 3 + 2] = bv;

        // HSV conversions
        const max = Math.max(rv, gv, bv);
        const min = Math.min(rv, gv, bv);
        const d = max - min;

        let h = 0;
        if (d !== 0) {
          if (max === rv) h = ((gv - bv) / d) % 6;
          else if (max === gv) h = (bv - rv) / d + 2;
          else h = (rv - gv) / d + 4;
        }
        h = h / 6; // normalize 0-1
        if (h < 0) h += 1;

        let s = max === 0 ? 0 : d / max;
        let v = max;

        // Map HSV to cylinder
        // H -> angle, S -> radius, V -> height (Y axis)
        const angle = h * Math.PI * 2;
        const radius = s * 0.8; // scaled to fit nicely

        pointsHSV[i * 3] = Math.cos(angle) * radius;
        pointsHSV[i * 3 + 1] = v; // Y is V
        pointsHSV[i * 3 + 2] = Math.sin(angle) * radius;

        // LAB conversions
        // First RGB to XYZ
        let _r = rv > 0.04045 ? Math.pow((rv + 0.055) / 1.055, 2.4) : rv / 12.92;
        let _g = gv > 0.04045 ? Math.pow((gv + 0.055) / 1.055, 2.4) : gv / 12.92;
        let _b = bv > 0.04045 ? Math.pow((bv + 0.055) / 1.055, 2.4) : bv / 12.92;

        let x = (_r * 0.4124 + _g * 0.3576 + _b * 0.1805) * 100;
        let y = (_r * 0.2126 + _g * 0.7152 + _b * 0.0722) * 100;
        let z = (_r * 0.0193 + _g * 0.1192 + _b * 0.9505) * 100;

        // XYZ to LAB
        // using standard D65 illuminant
        x /= 95.047;
        y /= 100.000;
        z /= 108.883;

        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

        const L = (116 * y) - 16;
        const A = 500 * (x - y);
        const B = 200 * (y - z);

        // Map LAB to 3D space
        // Normalize L to 0-1, A and B are ~ -128 to 127, scale them down
        pointsLAB[i * 3] = A / 128.0;
        pointsLAB[i * 3 + 1] = L / 100.0;
        pointsLAB[i * 3 + 2] = B / 128.0;

        i++;
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Morph animation
  if (pointCloud) {
    const positions = pointCloud.geometry.attributes.position.array;
    let needsUpdate = false;

    // Simple linear interpolation
    for (let i = 0; i < positions.length; i++) {
      const target = targetPositions[i];
      const current = positions[i];
      const diff = target - current;

      if (Math.abs(diff) > 0.001) {
        positions[i] += diff * 0.05; // ease factor
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      pointCloud.geometry.attributes.position.needsUpdate = true;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
