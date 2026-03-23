import re

with open('notes/Directory.md', 'r') as f:
    content = f.read()

replacement = """## 3D Color Gamut Visualizer [[demo](https://rybla.github.io/interpolnet-2/3d-color-gamut-visualizer)]

An interactive 3D color gamut visualization that shows the exact boundaries and geometric differences between the RGB, HSV, and CIELAB color models.

### Features
- **Interactive 3D View**: A 3D environment where users can rotate, pan, and zoom to explore the color spaces from any angle.
- **Multiple Color Models**: Toggles to switch between the RGB (cube), HSV (cylinder/cone), and CIELAB (irregular 3D shape) color gamut boundaries.
- **Geometric Transitions**: Smooth, animated transitions when switching between different color models, morphing the point cloud or mesh to illustrate how the color spaces map to one another.
- **Color Point Cloud**: The volume of the gamuts is represented by a dense point cloud, where each point is colored exactly matching its coordinate in the color space.

### Design Goals
- **Educational Geometry**: Demystify the abstract shapes of different color spaces by allowing users to physically manipulate and compare their 3D boundaries.
- **Visual Brilliance**: Utilize the actual colors represented by the coordinates to create a stunning, vibrant, and perfectly accurate color visualization.
- **Fluid Interactivity**: Ensure smooth 60fps animations during model morphing, making the exploration feel continuous and tangible.

### Implementation Plan
- **Tech Stack**: HTML5 Canvas and Three.js for 3D rendering.
- **Geometry Generation**:
  - Distribute thousands of points uniformly in the RGB space (0-1 for R, G, B).
  - For HSV and CIELAB views, mathematically convert the RGB coordinates to the target color space to determine the new 3D positions of the points.
- **Animation (Morphing)**: Use `requestAnimationFrame` and `THREE.BufferGeometry` to interpolate the vertex positions of the point cloud between the different color space coordinates over time when the user switches modes.
- **Rendering**: Use `THREE.Points` with `THREE.PointsMaterial` utilizing vertex colors so each point shines in its true color.
- **UI & Controls**:
  - HTML/CSS overlay for model selection buttons.
  - Implement `OrbitControls` for camera manipulation."""

content = re.sub(r'## 3D Color Gamut Visualizer \[\[demo\]\(https://rybla\.github\.io/interpolnet-2/3d-color-gamut-visualizer\)\]\n\nTODO: comprehensive description of new demo "3D Color Gamut Visualizer"', replacement, content)

with open('notes/Directory.md', 'w') as f:
    f.write(content)
