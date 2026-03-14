/**
 * Riemann Zeta Function Approximation
 * Using Dirichlet eta function for s with Re(s) > 0.
 * $\zeta(s) = \eta(s) / (1 - 2^{1-s})$
 * $\eta(s) = \sum_{n=1}^\infty (-1)^{n-1} / n^s$
 */

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
        return new Complex(
            this.re * c.re - this.im * c.im,
            this.re * c.im + this.im * c.re
        );
    }

    div(c) {
        const denom = c.re * c.re + c.im * c.im;
        return new Complex(
            (this.re * c.re + this.im * c.im) / denom,
            (this.im * c.re - this.re * c.im) / denom
        );
    }

    exp() {
        const r = Math.exp(this.re);
        return new Complex(r * Math.cos(this.im), r * Math.sin(this.im));
    }

    scale(s) {
        return new Complex(this.re * s, this.im * s);
    }

    magnitude() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    phase() {
        return Math.atan2(this.im, this.re);
    }
}

function complexPow(base, exponent) {
    if (base === 0) return new Complex(0, 0);
    // n^s = exp(s * ln(n))
    const ln_n = Math.log(base);
    const s_ln_n = new Complex(exponent.re * ln_n, exponent.im * ln_n);
    return s_ln_n.exp();
}

function zetaApproximation(s, terms = 50) {
    if (s.re === 1 && s.im === 0) return new Complex(Infinity, 0); // Pole at s=1

    let eta = new Complex(0, 0);
    for (let n = 1; n <= terms; n++) {
        // term = (-1)^(n-1) / n^s
        const sign = (n % 2 === 1) ? 1 : -1;
        const n_to_s = complexPow(n, s);
        const term = new Complex(sign, 0).div(n_to_s);
        eta = eta.add(term);
    }

    // factor = 1 - 2^(1-s)
    const one_minus_s = new Complex(1 - s.re, -s.im);
    const two_to_one_minus_s = complexPow(2, one_minus_s);
    const factor = new Complex(1, 0).sub(two_to_one_minus_s);

    return eta.div(factor);
}

// ----------------------------------------------------
// Three.js Rendering Logic
// ----------------------------------------------------

let scene, camera, renderer, controls;
let surfaceMesh, criticalLineMesh;
let zeroMeshes = [];

const PARAMS = {
    xMin: -4,
    xMax: 4,
    yRange: 40,
    yOffset: 0,
    resolution: 150,
    heightScale: 0.5,
    maxHeight: 5 // clamp magnitude to avoid crazy spikes near pole
};

// Known first few non-trivial zeros
const NON_TRIVIAL_ZEROS = [
    14.134725, 21.022040, 25.010858, 30.424876, 32.935062, 37.586178, 40.918719, 43.327073, 48.005151, 49.773832, 52.970321, 56.446248, 59.347044
];

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f19');

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    setInitialCameraPosition();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    createSurface();
    createCriticalLine();
    createZeros();

    setupUI();

    window.addEventListener('resize', onWindowResize);

    animate();
}

function setInitialCameraPosition() {
    camera.position.set(6, 4, 15);
    camera.lookAt(0, 0, 0);
}

// Map (u,v) from [0,1]x[0,1] to complex s = (re) + i(im)
// u -> Real axis (x)
// v -> Imaginary axis (y)
function mapUVToComplex(u, v) {
    const re = PARAMS.xMin + u * (PARAMS.xMax - PARAMS.xMin);
    const im = PARAMS.yOffset + v * PARAMS.yRange;
    return new Complex(re, im);
}

function createSurfaceGeometry() {
    const geometry = new THREE.BufferGeometry();
    const res = PARAMS.resolution;

    const vertices = [];
    const colors = [];
    const indices = [];

    // Calculate vertices and colors
    for (let i = 0; i <= res; i++) {
        const v = i / res; // goes from 0 to 1
        for (let j = 0; j <= res; j++) {
            const u = j / res; // goes from 0 to 1

            const s = mapUVToComplex(u, v);
            const zeta = zetaApproximation(s);

            let mag = zeta.magnitude();
            if (mag > PARAMS.maxHeight) mag = PARAMS.maxHeight; // Clip peaks

            const phase = zeta.phase(); // -pi to pi

            // Map u, v to physical 3D space
            // Real axis -> X
            // Imaginary axis -> Z (so it looks like a landscape)
            // Magnitude -> Y
            const x = s.re;
            const z = s.im - PARAMS.yOffset - PARAMS.yRange/2; // Center Z around 0 for viewing
            const y = mag * PARAMS.heightScale;

            vertices.push(x, y, z);

            // Color based on phase (HSL)
            // phase is [-pi, pi] -> map to [0, 1] for hue
            const hue = (phase + Math.PI) / (2 * Math.PI);
            const color = new THREE.Color();
            // Saturation 1, Lightness depends on magnitude to show peaks better
            const lightness = 0.3 + 0.5 * (mag / PARAMS.maxHeight);
            color.setHSL(hue, 1.0, lightness);
            colors.push(color.r, color.g, color.b);
        }
    }

    // Calculate indices for triangles
    for (let i = 0; i < res; i++) {
        for (let j = 0; j < res; j++) {
            const a = i * (res + 1) + j;
            const b = i * (res + 1) + j + 1;
            const c = (i + 1) * (res + 1) + j;
            const d = (i + 1) * (res + 1) + j + 1;

            indices.push(a, b, d);
            indices.push(a, d, c);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

function createSurface() {
    if (surfaceMesh) scene.remove(surfaceMesh);

    const geometry = createSurfaceGeometry();

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.1,
        wireframe: false
    });

    surfaceMesh = new THREE.Mesh(geometry, material);
    scene.add(surfaceMesh);
}

function createCriticalLine() {
    if (criticalLineMesh) scene.remove(criticalLineMesh);

    const points = [];
    const segments = 200;

    for (let i = 0; i <= segments; i++) {
        const v = i / segments;
        const im = PARAMS.yOffset + v * PARAMS.yRange;
        const s = new Complex(0.5, im);
        const zeta = zetaApproximation(s);

        let mag = zeta.magnitude();
        if (mag > PARAMS.maxHeight) mag = PARAMS.maxHeight;

        const x = 0.5;
        const z = im - PARAMS.yOffset - PARAMS.yRange/2;
        const y = mag * PARAMS.heightScale;

        // Lift slightly so it doesn't z-fight
        points.push(new THREE.Vector3(x, y + 0.05, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        linewidth: 3
    });

    criticalLineMesh = new THREE.Line(geometry, material);
    scene.add(criticalLineMesh);
}

function createZeros() {
    zeroMeshes.forEach(m => scene.remove(m));
    zeroMeshes = [];

    const zeroGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const zeroMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    NON_TRIVIAL_ZEROS.forEach(zeroIm => {
        // Check if zero is within current visible range
        if (zeroIm >= PARAMS.yOffset && zeroIm <= PARAMS.yOffset + PARAMS.yRange) {
            const x = 0.5;
            const z = zeroIm - PARAMS.yOffset - PARAMS.yRange/2;
            const y = 0; // Zeros have magnitude 0

            const mesh = new THREE.Mesh(zeroGeo, zeroMat);
            mesh.position.set(x, y, z);

            // Add a little glowing halo or line pointing up to make it visible
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 2, 0)
            ]);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.5 });
            const line = new THREE.Line(lineGeo, lineMat);
            mesh.add(line);

            scene.add(mesh);
            zeroMeshes.push(mesh);
        }
    });
}

function updateVisualization() {
    createSurface();
    createCriticalLine();
    createZeros();
}

function setupUI() {
    const yOffsetSlider = document.getElementById('y-offset-slider');
    const yOffsetValue = document.getElementById('y-offset-value');
    const resSlider = document.getElementById('resolution-slider');
    const resValue = document.getElementById('resolution-value');
    const resetBtn = document.getElementById('reset-camera-btn');

    yOffsetSlider.addEventListener('input', (e) => {
        PARAMS.yOffset = parseFloat(e.target.value);
        yOffsetValue.textContent = `${PARAMS.yOffset.toFixed(1)} to ${(PARAMS.yOffset + PARAMS.yRange).toFixed(1)}`;
        updateVisualization();
    });

    resSlider.addEventListener('change', (e) => {
        PARAMS.resolution = parseInt(e.target.value);
        resValue.textContent = PARAMS.resolution;
        updateVisualization();
    });

    resetBtn.addEventListener('click', () => {
        setInitialCameraPosition();
        controls.target.set(0, 0, 0);
    });
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

// Ensure resources are loaded
window.addEventListener('DOMContentLoaded', init);