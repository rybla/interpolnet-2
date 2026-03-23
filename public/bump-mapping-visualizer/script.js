const canvasContainer = document.getElementById('canvas-container');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Generate procedural height map
function generateHeightMap(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base gray
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Add some random bumps and divots
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 30 + 10;

    // Randomly choose black (divot) or white (bump)
    const isBump = Math.random() > 0.5;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    if (isBump) {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return { texture, canvas };
}

const { texture: bumpTexture, canvas: bumpCanvas } = generateHeightMap();

// Create plane
const planeGeometry = new THREE.PlaneGeometry(5, 5, 128, 128); // High segment count for clear normal visualization
planeGeometry.rotateX(-Math.PI / 2);

const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x445566,
  roughness: 0.4,
  metalness: 0.1,
  bumpMap: bumpTexture,
  bumpScale: 0.1,
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 20);
pointLight.position.set(2, 2, 2);
scene.add(pointLight);

const lightHelper = new THREE.PointLightHelper(pointLight, 0.2);
scene.add(lightHelper);

// Height map visualization sprite
const mapSpriteMaterial = new THREE.SpriteMaterial({
  map: bumpTexture,
  color: 0xffffff,
});
const mapSprite = new THREE.Sprite(mapSpriteMaterial);
mapSprite.scale.set(2, 2, 1);
mapSprite.position.set(-3, 2, 0);
mapSprite.visible = false;
scene.add(mapSprite);

// Normal vector visualization
// Since Three.js standard materials calculate perturbed normals in the fragment shader,
// we need to manually compute them to visualize them as lines.
let normalsLines;

function computePerturbedNormals() {
  if (normalsLines) {
    scene.remove(normalsLines);
    normalsLines.geometry.dispose();
    normalsLines.material.dispose();
  }

  const positionAttribute = planeGeometry.getAttribute('position');
  const uvAttribute = planeGeometry.getAttribute('uv');
  const normalAttribute = planeGeometry.getAttribute('normal');

  const linePositions = [];
  const lineLength = 0.2;
  const bumpScale = planeMaterial.bumpScale;

  const ctx = bumpCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, bumpCanvas.width, bumpCanvas.height);
  const data = imgData.data;

  for (let i = 0; i < positionAttribute.count; i++) {
    const px = positionAttribute.getX(i);
    const py = positionAttribute.getY(i);
    const pz = positionAttribute.getZ(i);

    let nx = normalAttribute.getX(i);
    let ny = normalAttribute.getY(i);
    let nz = normalAttribute.getZ(i);

    // If bump map is enabled, calculate the perturbed normal
    if (planeMaterial.bumpMap) {
      const u = uvAttribute.getX(i);
      const v = 1 - uvAttribute.getY(i); // Canvas Y is inverted

      const xPix = Math.floor(u * (bumpCanvas.width - 1));
      const yPix = Math.floor(v * (bumpCanvas.height - 1));

      // Finite difference to approximate the gradient
      const step = 1;
      const getVal = (x, y) => {
        x = Math.max(0, Math.min(x, bumpCanvas.width - 1));
        y = Math.max(0, Math.min(y, bumpCanvas.height - 1));
        const idx = (y * bumpCanvas.width + x) * 4;
        return data[idx] / 255.0;
      };

      const H = getVal(xPix, yPix);
      const Hx = getVal(xPix + step, yPix);
      const Hy = getVal(xPix, yPix + step);

      const dHdx = (Hx - H) * bumpScale * 50;
      const dHdy = (Hy - H) * bumpScale * 50;

      // In a plane facing up (0,1,0), tangents are roughly (1,0,0) and (0,0,-1)
      // Perturb the normal based on the gradient
      nx = -dHdx;
      ny = 1.0;
      nz = dHdy;

      // Normalize
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx /= len;
      ny /= len;
      nz /= len;
    }

    linePositions.push(px, py, pz);
    linePositions.push(px + nx * lineLength, py + ny * lineLength, pz + nz * lineLength);
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.5
  });

  normalsLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(normalsLines);
}

// Initial generation of normals (if enabled)
const toggleNormalsCheckbox = document.getElementById('toggle-normals');
if (toggleNormalsCheckbox.checked) {
  computePerturbedNormals();
}

// UI Interaction
document.getElementById('toggle-bump-map').addEventListener('change', (e) => {
  if (e.target.checked) {
    planeMaterial.bumpMap = bumpTexture;
  } else {
    planeMaterial.bumpMap = null;
  }
  planeMaterial.needsUpdate = true;

  // Recompute normals visualization if it's active
  if (toggleNormalsCheckbox.checked) {
    computePerturbedNormals();
  }
});

document.getElementById('toggle-show-map').addEventListener('change', (e) => {
  mapSprite.visible = e.target.checked;
});

toggleNormalsCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    computePerturbedNormals();
  } else if (normalsLines) {
    scene.remove(normalsLines);
    normalsLines.geometry.dispose();
    normalsLines.material.dispose();
    normalsLines = null;
  }
});

// Window resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  const time = clock.getElapsedTime();

  // Orbit light
  const radius = 3;
  const speed = 0.5;
  pointLight.position.x = Math.cos(time * speed) * radius;
  pointLight.position.z = Math.sin(time * speed) * radius;

  renderer.render(scene, camera);
}

animate();
