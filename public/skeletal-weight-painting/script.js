// Interpolnet 2 | Skeletal Animation Weight Painting Visualizer

const container = document.getElementById('canvas-container');
const width = window.innerWidth;
const height = window.innerHeight;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19);
// subtle fog matching background
scene.fog = new THREE.Fog(0x0b0f19, 10, 50);

const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
camera.position.set(0, 10, 30);
camera.lookAt(0, 5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
// Important for vertex colors to work nicely
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0x00ffcc, 0.5);
backLight.position.set(-10, 10, -10);
scene.add(backLight);

// Geometry Setup (A cylinder representing an arm or tentacle)
const segmentHeight = 6;
const segmentCount = 3;
const heightTotal = segmentHeight * segmentCount;
const heightHalf = heightTotal * 0.5;

const sizing = {
    segmentHeight: segmentHeight,
    segmentCount: segmentCount,
    height: heightTotal,
    halfHeight: heightHalf
};

// Cylinder parameters: radiusTop, radiusBottom, height, radialSegments, heightSegments
const geometry = new THREE.CylinderGeometry(
    2,
    2,
    sizing.height,
    16,
    sizing.segmentCount * 4,
    false
);

// Define bones
const bones = [];

// Base bone
const boneBase = new THREE.Bone();
boneBase.position.y = -sizing.halfHeight;
bones.push(boneBase);

// Child bones
let prevBone = boneBase;
for (let i = 1; i <= sizing.segmentCount; i++) {
    const bone = new THREE.Bone();
    bone.position.y = sizing.segmentHeight;
    prevBone.add(bone);
    bones.push(bone);
    prevBone = bone;
}

const skeleton = new THREE.Skeleton(bones);

// Bind vertices to bones
const positionAttribute = geometry.attributes.position;
const vertexCount = positionAttribute.count;

const skinIndices = [];
const skinWeights = [];
// Array to store original colors
const vertexColors = new Float32Array(vertexCount * 3);

for (let i = 0; i < vertexCount; i++) {
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(positionAttribute, i);

    // Calculate vertex position relative to base
    const y = (vertex.y + sizing.halfHeight);

    // Calculate bone weights
    const skinIndex = Math.floor(y / sizing.segmentHeight);
    const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight;

    // The vertex is influenced by two bones: the bone below and the bone above
    // Bottom-most bone index
    let boneIndex0 = skinIndex;
    let boneIndex1 = skinIndex + 1;

    // Handle edge cases
    if (boneIndex0 >= bones.length - 1) {
        boneIndex0 = bones.length - 2;
        boneIndex1 = bones.length - 1;
        skinIndices.push(boneIndex0, boneIndex1, 0, 0);
        skinWeights.push(0, 1, 0, 0);
    } else {
        skinIndices.push(boneIndex0, boneIndex1, 0, 0);
        skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
    }

    // Default color (white-ish)
    vertexColors[i * 3] = 0.9;
    vertexColors[i * 3 + 1] = 0.9;
    vertexColors[i * 3 + 2] = 0.9;
}

geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));

// Material
const material = new THREE.MeshPhongMaterial({
    skinning: true,
    vertexColors: true,
    side: THREE.DoubleSide,
    flatShading: false,
    shininess: 30
});

const mesh = new THREE.SkinnedMesh(geometry, material);
mesh.add(bones[0]); // Add armature to mesh
mesh.bind(skeleton);
// Move the mesh up so it rests on the "ground"
mesh.position.y = sizing.halfHeight;

scene.add(mesh);

// Skeleton Helper
const skeletonHelper = new THREE.SkeletonHelper(mesh);
skeletonHelper.material.linewidth = 3;
scene.add(skeletonHelper);

// Grid Helper
const gridHelper = new THREE.GridHelper(40, 40, 0x00ffcc, 0xff00ff);
gridHelper.material.opacity = 0.2;
gridHelper.material.transparent = true;
gridHelper.position.y = 0;
scene.add(gridHelper);


// Interactive Logic
let selectedBoneIndex = -1; // -1 means none

// Color mapping logic for weight painting
function updateVertexColors() {
    const colors = geometry.attributes.color.array;

    // Gradient: 0 -> Dark Blue (0,0,0.2) | 0.5 -> Green (0,1,0) | 1.0 -> Red (1,0,0)
    for (let i = 0; i < vertexCount; i++) {
        if (selectedBoneIndex === -1) {
            // Default gray
            colors[i * 3] = 0.8;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 0.8;
            continue;
        }

        let weight = 0;
        // Check which bone influences this vertex and how much
        for (let j = 0; j < 4; j++) {
            if (skinIndices[i * 4 + j] === selectedBoneIndex) {
                weight = skinWeights[i * 4 + j];
                break;
            }
        }

        // Map weight to color
        if (weight <= 0) {
            // Dark blue for 0 influence
            colors[i * 3] = 0.05;
            colors[i * 3 + 1] = 0.05;
            colors[i * 3 + 2] = 0.2;
        } else if (weight < 0.5) {
            // Blend dark blue to cyan/green
            const t = weight / 0.5;
            colors[i * 3] = 0.05;
            colors[i * 3 + 1] = t * 1.0;
            colors[i * 3 + 2] = 0.2 + (t * 0.8);
        } else {
            // Blend green/cyan to red
            const t = (weight - 0.5) / 0.5;
            colors[i * 3] = t * 1.0;
            colors[i * 3 + 1] = (1 - t) * 1.0;
            colors[i * 3 + 2] = (1 - t) * 1.0;
        }
    }

    geometry.attributes.color.needsUpdate = true;
}

// Event Listeners for UI
document.querySelectorAll('input[name="bone"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        selectedBoneIndex = parseInt(e.target.value);
        updateVertexColors();
    });
});

const animationSlider = document.getElementById('animation-slider');
animationSlider.addEventListener('input', (e) => {
    // value is 0 to 100
    const t = e.target.value / 100;

    // Calculate simple procedural animation
    // When t=0.5, bones are straight
    // When t < 0.5 or t > 0.5, bones bend
    const angle = (t - 0.5) * Math.PI; // -90 to +90 degrees

    for (let i = 1; i < bones.length; i++) {
        bones[i].rotation.z = angle / (bones.length - 1);
    }
});

const skeletonToggle = document.getElementById('show-skeleton');
skeletonToggle.addEventListener('change', (e) => {
    skeletonHelper.visible = e.target.checked;
});

const wireframeToggle = document.getElementById('wireframe');
wireframeToggle.addEventListener('change', (e) => {
    material.wireframe = e.target.checked;
});

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render Loop
function animate() {
    requestAnimationFrame(animate);

    // Slow rotation of entire mesh for better viewing
    mesh.rotation.y += 0.005;

    renderer.render(scene, camera);
}

// Initial color update and start animation
updateVertexColors();
animate();