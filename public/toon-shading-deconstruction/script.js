// Setup Three.js Scene
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Global Variables
let object;
let material;
let rampTexture;
const lightPosition = new THREE.Vector3(5, 5, 5);
let rotationSpeed = 0.01;

// Color Stops Data Structure
let colorStops = [
    { position: 0.0, color: '#1a1a1a' },
    { position: 0.3, color: '#1a1a1a' },
    { position: 0.3, color: '#4caf50' },
    { position: 0.7, color: '#4caf50' },
    { position: 0.7, color: '#ffeb3b' },
    { position: 1.0, color: '#ffeb3b' }
];

// UI Elements
const rampCanvas = document.getElementById('ramp-canvas');
const ctx = rampCanvas.getContext('2d');
const colorStopsContainer = document.getElementById('color-stops-container');
const addStopBtn = document.getElementById('add-stop-btn');

const lightXSlider = document.getElementById('light-x');
const lightYSlider = document.getElementById('light-y');
const lightZSlider = document.getElementById('light-z');
const rotationSpeedSlider = document.getElementById('rotation-speed');

// Shaders
const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform vec3 uLightDir;
    uniform sampler2D uRampTexture;

    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        // Normalize vectors
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(uLightDir);

        // Calculate diffuse lighting (dot product)
        float diffuse = max(dot(normal, lightDir), 0.0);

        // Use diffuse value to sample the 1D ramp texture
        // Sample exactly from the middle of the texture's height
        vec4 toonColor = texture2D(uRampTexture, vec2(diffuse, 0.5));

        gl_FragColor = toonColor;
    }
`;

function generateRampTexture() {
    // Sort stops by position
    colorStops.sort((a, b) => a.position - b.position);

    const width = rampCanvas.width;
    const height = rampCanvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create a horizontal gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);

    // Ensure we have at least one stop
    if (colorStops.length === 0) {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#ffffff');
    } else {
        colorStops.forEach(stop => {
            // Clamp position between 0 and 1
            const pos = Math.max(0, Math.min(1, stop.position));
            gradient.addColorStop(pos, stop.color);
        });
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Create Three.js texture
    if (rampTexture) {
        rampTexture.dispose();
    }
    rampTexture = new THREE.CanvasTexture(rampCanvas);
    rampTexture.minFilter = THREE.NearestFilter;
    rampTexture.magFilter = THREE.NearestFilter; // Crucial for sharp bands
    rampTexture.generateMipmaps = false;
    rampTexture.needsUpdate = true;

    if (material) {
        material.uniforms.uRampTexture.value = rampTexture;
    }
}

function updateMaterial() {
    if (!material) {
        material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uLightDir: { value: lightPosition.clone().normalize() },
                uRampTexture: { value: rampTexture }
            }
        });

        // Initialize object
        const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 128, 32);
        object = new THREE.Mesh(geometry, material);
        scene.add(object);
    } else {
        material.uniforms.uLightDir.value.copy(lightPosition).normalize();
    }
}

function renderColorStopsUI() {
    colorStopsContainer.innerHTML = '';

    colorStops.forEach((stop) => {
        const stopDiv = document.createElement('div');
        stopDiv.className = 'color-stop';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = stop.color;
        colorInput.addEventListener('input', (e) => {
            stop.color = e.target.value;
            generateRampTexture();
        });

        const posInput = document.createElement('input');
        posInput.type = 'range';
        posInput.min = '0';
        posInput.max = '1';
        posInput.step = '0.01';
        posInput.value = stop.position;
        posInput.addEventListener('input', (e) => {
            stop.position = parseFloat(e.target.value);
            generateRampTexture();
            // Optional: Re-render UI to keep sorted order visual
            // But might interrupt dragging, so just update texture
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove Stop';
        if (colorStops.length <= 1) {
            removeBtn.disabled = true;
        } else {
            removeBtn.addEventListener('click', () => {
                const currentIndex = colorStops.indexOf(stop);
                if (currentIndex > -1) {
                    colorStops.splice(currentIndex, 1);
                }
                renderColorStopsUI();
                generateRampTexture();
            });
        }

        stopDiv.appendChild(colorInput);
        stopDiv.appendChild(posInput);
        stopDiv.appendChild(removeBtn);
        colorStopsContainer.appendChild(stopDiv);
    });
}

function setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Light Position
    const updateLight = () => {
        lightPosition.set(
            parseFloat(lightXSlider.value),
            parseFloat(lightYSlider.value),
            parseFloat(lightZSlider.value)
        );
        updateMaterial();
    };

    lightXSlider.addEventListener('input', updateLight);
    lightYSlider.addEventListener('input', updateLight);
    lightZSlider.addEventListener('input', updateLight);

    // Rotation Speed
    rotationSpeedSlider.addEventListener('input', (e) => {
        rotationSpeed = parseFloat(e.target.value);
    });

    // Add Color Stop
    addStopBtn.addEventListener('click', () => {
        // Find a good position to add the new stop
        const newPos = colorStops.length > 0 ? (colorStops[colorStops.length-1].position + 0.1) % 1.0 : 0.5;
        colorStops.push({ position: newPos, color: '#ffffff' });
        renderColorStopsUI();
        generateRampTexture();
    });
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (object) {
        object.rotation.x += rotationSpeed;
        object.rotation.y += rotationSpeed;
    }

    renderer.render(scene, camera);
}

// Initialization
generateRampTexture();
updateMaterial();
renderColorStopsUI();
setupEventListeners();
animate();
