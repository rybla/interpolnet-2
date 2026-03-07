class Complex {
  constructor(re, im) {
    this.re = re;
    this.im = im;
  }

  add(c) {
    return new Complex(this.re + c.re, this.im + c.im);
  }

  sub(c) {
    return new Complex(this.re - c.re, this.im - c.im);
  }

  mul(c) {
    return new Complex(this.re * c.re - this.im * c.im, this.re * c.im + this.im * c.re);
  }

  div(c) {
    const den = c.re * c.re + c.im * c.im;
    return new Complex(
      (this.re * c.re + this.im * c.im) / den,
      (this.im * c.re - this.re * c.im) / den
    );
  }

  abs() {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  arg() {
    return Math.atan2(this.im, this.re);
  }

  exp() {
    const e = Math.exp(this.re);
    return new Complex(e * Math.cos(this.im), e * Math.sin(this.im));
  }

  pow(c) {
    if (this.re === 0 && this.im === 0) return new Complex(0, 0);
    const ln_r = Math.log(this.abs());
    const theta = this.arg();

    // ln(this) = ln_r + i * theta
    // this^c = exp(c * ln(this))
    const p_re = c.re * ln_r - c.im * theta;
    const p_im = c.im * ln_r + c.re * theta;

    const e = Math.exp(p_re);
    return new Complex(e * Math.cos(p_im), e * Math.sin(p_im));
  }
}

// Compute Zeta via Dirichlet eta function approximation
// eta(s) = sum_{n=1}^{N} (-1)^{n-1} / n^s
// zeta(s) = eta(s) / (1 - 2^{1-s})
function zetaApprox(s, iterations = 50) {
  let sum = new Complex(0, 0);

  for (let n = 1; n <= iterations; n++) {
    const nC = new Complex(n, 0);
    const nPowS = nC.pow(s);

    const term = new Complex(1, 0).div(nPowS);
    if (n % 2 === 0) {
      sum = sum.sub(term);
    } else {
      sum = sum.add(term);
    }
  }

  const one = new Complex(1, 0);
  const two = new Complex(2, 0);
  const oneMinusS = one.sub(s);
  const denTerm = two.pow(oneMinusS);
  const den = one.sub(denTerm);

  // Guard against division by zero (s=1 is a pole)
  if (den.abs() < 1e-10) return new Complex(1e10, 1e10);

  return sum.div(den);
}

// Map value to HSL color
function phaseToColor(phase, mag) {
  // Phase is -PI to PI
  const hue = (phase + Math.PI) / (2 * Math.PI);
  // Logarithmic scale for brightness to show detail near 0
  const lightness = 0.2 + 0.6 * (1 - Math.exp(-mag * 0.5));

  const color = new THREE.Color();
  color.setHSL(hue, 0.8, lightness);
  return color;
}

let scene, camera, renderer, controls, planeMesh, criticalLine, raycaster, mouse;
let resolution = 150;
const sigmaMin = -2, sigmaMax = 3;
const tMin = 0, tMax = 30;

function init() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d1a);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(-8, 15, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0, 0);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  createLandscape();

  window.addEventListener('resize', onWindowResize);
  container.addEventListener('mousemove', onMouseMove);

  document.getElementById('resolution-slider').addEventListener('input', (e) => {
    resolution = parseInt(e.target.value);
    document.getElementById('res-val').innerText = resolution;
    createLandscape();
  });

  animate();
}

function createLandscape() {
  if (planeMesh) {
    scene.remove(planeMesh);
    planeMesh.geometry.dispose();
    planeMesh.material.dispose();
  }
  if (criticalLine) {
    scene.remove(criticalLine);
    criticalLine.geometry.dispose();
    criticalLine.material.dispose();
  }

  // Create plane geometry
  const width = sigmaMax - sigmaMin;
  const height = tMax - tMin;

  const geometry = new THREE.PlaneGeometry(width * 3, height, resolution, resolution);

  // Compute Zeta for each vertex
  const positions = geometry.attributes.position;
  const colors = [];

  for (let i = 0; i < positions.count; i++) {
    // Plane is initially on XY plane (Z is up later)
    const x = positions.getX(i); // maps to sigma (scaled later)
    const y = positions.getY(i); // maps to t

    // Map geometry bounds to our domain
    const sigma = sigmaMin + (x + (width*3)/2) / (width*3) * width;
    const t = tMin + (y + height/2) / height * height;

    const s = new Complex(sigma, t);
    const z = zetaApprox(s, 40); // 40 iterations for performance vs accuracy

    let mag = z.abs();
    // Cap magnitude to prevent massive spikes
    mag = Math.min(mag, 8);

    // Set Z value to magnitude (we'll rotate the plane so Z is up)
    positions.setZ(i, mag);

    // Set color based on phase
    const color = phaseToColor(z.arg(), mag);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    flatShading: true,
    shininess: 30
  });

  planeMesh = new THREE.Mesh(geometry, material);

  // Rotate plane so X is sigma, Y is height (mag), Z is t (imaginary)
  planeMesh.rotation.x = -Math.PI / 2;

  // Center it visually
  planeMesh.position.x = - (sigmaMax + sigmaMin) / 2;
  planeMesh.position.z = (tMax + tMin) / 2;

  scene.add(planeMesh);

  // Critical Line Marker (sigma = 0.5)
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  const linePts = [];
  const sigmaCrit = 0.5;
  const mappedXCrit = (sigmaCrit - sigmaMin) / width * (width * 3) - (width * 3) / 2;

  for (let y = -height/2; y <= height/2; y += height/50) {
    const t = tMin + (y + height/2) / height * height;
    const s = new Complex(sigmaCrit, t);
    const z = zetaApprox(s, 40);
    const mag = Math.min(z.abs(), 8.1); // slightly above surface
    linePts.push(new THREE.Vector3(mappedXCrit, y, mag + 0.1));
  }

  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  criticalLine = new THREE.Line(lineGeo, lineMat);
  criticalLine.rotation.x = -Math.PI / 2;
  criticalLine.position.x = planeMesh.position.x;
  criticalLine.position.z = planeMesh.position.z;
  scene.add(criticalLine);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (planeMesh) {
    const intersects = raycaster.intersectObject(planeMesh);
    if (intersects.length > 0) {
      const p = intersects[0].point;

      // Inverse map from world coordinates back to (sigma, t)
      const width = sigmaMax - sigmaMin;
      const height = tMax - tMin;

      // planeMesh position offsets
      const localX = p.x - planeMesh.position.x;
      const localY = - (p.z - planeMesh.position.z); // Because of rotation -PI/2

      const sigma = sigmaMin + (localX + (width*3)/2) / (width*3) * width;
      const t = tMin + (localY + height/2) / height * height;

      const s = new Complex(sigma, t);
      const z = zetaApprox(s, 50);

      document.getElementById('coord-s').innerText = `s = ${sigma.toFixed(3)} + ${t.toFixed(3)}i`;
      document.getElementById('val-zeta').innerText = `|\u03B6| = ${z.abs().toFixed(4)}`;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Start
init();