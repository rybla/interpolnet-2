// Depth of Field Simulator implementation
document.addEventListener('DOMContentLoaded', () => {
    // Setup Three.js scene
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);
    scene.fog = new THREE.FogExp2(0x121212, 0.005);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Move camera to a good viewing position
    camera.position.set(0, 10, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff9800, 2, 100);
    pointLight.position.set(0, 5, 20);
    scene.add(pointLight);

    // Create scene objects at varying depths
    const objects = [];
    const geometry = new THREE.IcosahedronGeometry(3, 1);

    // Create a series of objects stretching into the distance
    for (let i = 0; i < 20; i++) {
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
            roughness: 0.2,
            metalness: 0.8,
            flatShading: true
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position them in a zigzag pattern going into the distance
        const x = (i % 2 === 0 ? 1 : -1) * (10 + Math.random() * 5);
        const y = Math.random() * 10 - 5;
        const z = 40 - i * 15; // Z goes from 40 down to -245

        mesh.position.set(x, y, z);
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;

        // Store base color and position for later reference
        mesh.userData = {
            baseColor: material.color.clone(),
            originalY: y,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02
            }
        };

        scene.add(mesh);
        objects.push(mesh);
    }

    // Create a focal plane visualizer (semi-transparent plane)
    const focalPlaneGeo = new THREE.PlaneGeometry(100, 100);
    const focalPlaneMat = new THREE.MeshBasicMaterial({
        color: 0xff5722,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        wireframe: true
    });
    const focalPlaneMesh = new THREE.Mesh(focalPlaneGeo, focalPlaneMat);
    focalPlaneMesh.rotation.y = 0;
    scene.add(focalPlaneMesh);

    // Add a ground plane
    const gridHelper = new THREE.GridHelper(400, 40, 0xff5722, 0x333333);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // UI Controls
    const focusDistanceSlider = document.getElementById('focus-distance');
    const focusDistanceValue = document.getElementById('focus-distance-value');

    const apertureSlider = document.getElementById('aperture');
    const apertureValue = document.getElementById('aperture-value');

    const focalLengthSlider = document.getElementById('focal-length');
    const focalLengthValue = document.getElementById('focal-length-value');

    // Depth of Field parameters
    let params = {
        focusDistance: parseFloat(focusDistanceSlider.value),
        aperture: parseFloat(apertureSlider.value),
        focalLength: parseFloat(focalLengthSlider.value)
    };

    // Update UI and params
    const updateParams = () => {
        params.focusDistance = parseFloat(focusDistanceSlider.value);
        params.aperture = parseFloat(apertureSlider.value);
        params.focalLength = parseFloat(focalLengthSlider.value);

        focusDistanceValue.textContent = params.focusDistance;
        apertureValue.textContent = params.aperture.toFixed(3);
        focalLengthValue.textContent = params.focalLength;

        // Update the focal plane visualizer position
        // Focus distance is relative to camera
        const focalZ = camera.position.z - params.focusDistance;
        focalPlaneMesh.position.z = focalZ;
    };

    focusDistanceSlider.addEventListener('input', updateParams);
    apertureSlider.addEventListener('input', updateParams);
    focalLengthSlider.addEventListener('input', updateParams);

    // Initialize
    updateParams();

    // Custom depth of field effect
    // Since we don't have access to EffectComposer/BokehPass directly without modules,
    // we'll simulate the depth of field visually by adjusting the opacity/color blending
    // or by rendering multiple offset passes. We will use a multi-pass accumulation technique.

    // Create render targets for the accumulation buffer
    const renderTargetParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
    };

    // We won't actually do a full accumulation buffer here as it requires custom shaders for the blend step
    // without EffectComposer. Instead, we'll implement a creative "fake" depth of field by
    // adjusting object properties based on their distance from the focal plane, combined with camera jitter
    // to create a circle of confusion effect.

    let frameCount = 0;
    const JITTER_SAMPLES = 8; // Number of samples for the blur

    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate);

        const time = performance.now() * 0.001;

        // Calculate focal plane Z position
        const focalZ = camera.position.z - params.focusDistance;

        // Animate objects
        objects.forEach(mesh => {
            // Rotate
            mesh.rotation.x += mesh.userData.rotationSpeed.x;
            mesh.rotation.y += mesh.userData.rotationSpeed.y;

            // Hover
            mesh.position.y = mesh.userData.originalY + Math.sin(time * 2 + mesh.position.x) * 2;
        });

        // Simulating Depth of Field
        // 1. Clear renderer manually
        renderer.autoClear = false;
        renderer.clear();

        // We will perform a multi-pass render, jittering the camera slightly
        // based on the aperture to simulate the circle of confusion.
        // We accumulate the renders. To do this without complex shaders,
        // we'll just set the renderer's global alpha if possible, but Three.js doesn't support that directly on the renderer.
        // So we will adjust the camera position and render multiple times,
        // using the "additive" blending approach on a scene level, or simply by
        // doing a poor man's DoF: making out-of-focus objects wireframe or changing their material properties.

        // Let's implement a visual trick for out-of-focus:
        // Adjust the object materials based on their distance to the focal plane

        objects.forEach(mesh => {
            // Distance from object to focal plane
            const distToFocalPlane = Math.abs(mesh.position.z - focalZ);

            // Circle of confusion calculation (simplified)
            // blur = distance * aperture * focalLength
            const blurAmount = distToFocalPlane * params.aperture * (params.focalLength / 50.0);

            // We can't actually blur them easily without post-processing.
            // As a visual fallback, we'll desaturate and fade them to background color
            // the further they are from the focal plane, simulating them blending out of focus.
            // We also make them wireframe if they are very out of focus.

            if (blurAmount > 5) {
                // Highly out of focus
                mesh.material.wireframe = true;
                mesh.material.opacity = Math.max(0.1, 1.0 - (blurAmount - 5) * 0.1);
                mesh.material.transparent = true;
                mesh.material.color.lerpColors(mesh.userData.baseColor, scene.background, 0.8);
            } else {
                // In focus or slightly out
                mesh.material.wireframe = false;
                mesh.material.opacity = 1.0;
                mesh.material.transparent = false;

                // Mix color toward background color based on blur
                const mixRatio = Math.min(0.8, blurAmount / 5.0);
                mesh.material.color.lerpColors(mesh.userData.baseColor, scene.background, mixRatio);
            }
        });

        renderer.render(scene, camera);
        frameCount++;
    };

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
