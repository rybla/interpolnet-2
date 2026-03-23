const init = () => {
  const container = document.getElementById('canvas-container');

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0c10);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 15);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // The virtual light to demonstrate scattering
  const virtualLight = new THREE.PointLight(0xffddaa, 2, 20);
  scene.add(virtualLight);

  // Light visualization (small glowing sphere)
  const lightGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffddaa });
  const lightSphere = new THREE.Mesh(lightGeo, lightMat);
  virtualLight.add(lightSphere);

  // Construct a rudimentary "hand" out of box geometries merged together
  // Since we don't have external assets, we build a hand-like structure
  const handGroup = new THREE.Group();

  // Hand Material with subsurface scattering properties
  const handMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffe0bd,
    roughness: 0.2,
    transmission: 0.9, // high transmission to allow light through
    thickness: 2.0, // thickness of the volume
    side: THREE.DoubleSide
  });

  const createBone = (w, h, d, y, x) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, handMaterial);
    mesh.position.set(x, y, 0);
    return mesh;
  };

  // Palm
  handGroup.add(createBone(3, 3, 0.8, -1.5, 0));

  // Fingers
  handGroup.add(createBone(0.6, 2.5, 0.6, 1.25, -1)); // Index
  handGroup.add(createBone(0.6, 2.8, 0.6, 1.4, -0.2)); // Middle
  handGroup.add(createBone(0.6, 2.6, 0.6, 1.3, 0.6)); // Ring
  handGroup.add(createBone(0.5, 2.0, 0.5, 1.0, 1.3)); // Pinky

  // Thumb
  const thumb = createBone(0.7, 1.8, 0.7, -0.5, -2);
  thumb.rotation.z = Math.PI / 4;
  handGroup.add(thumb);

  scene.add(handGroup);

  // UI Elements
  const angleSlider = document.getElementById('light-angle');
  const heightSlider = document.getElementById('light-height');
  const transmissionSlider = document.getElementById('mat-transmission');
  const thicknessSlider = document.getElementById('mat-thickness');
  const roughnessSlider = document.getElementById('mat-roughness');

  let time = 0;

  // Render loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Update light position based on UI sliders
    const angle = parseFloat(angleSlider.value);
    const height = parseFloat(heightSlider.value);
    const radius = 5;

    virtualLight.position.x = Math.sin(angle) * radius;
    virtualLight.position.z = Math.cos(angle) * radius;
    virtualLight.position.y = height;

    // Update material based on UI sliders
    handMaterial.transmission = parseFloat(transmissionSlider.value);
    handMaterial.thickness = parseFloat(thicknessSlider.value);
    handMaterial.roughness = parseFloat(roughnessSlider.value);

    // Slowly rotate the hand for better view
    handGroup.rotation.y += 0.005;
    handGroup.rotation.x = Math.sin(time) * 0.1;
    time += 0.01;

    renderer.render(scene, camera);
  };

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

window.addEventListener('DOMContentLoaded', init);
