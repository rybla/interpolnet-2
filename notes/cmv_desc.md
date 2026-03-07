## Complex Multiplication Visualizer [[demo](https://rybla.github.io/interpolnet-2/complex-multiplication-visualizer)]

An interactive complex plane where multiplying two complex numbers visually demonstrates the scaling of magnitude and the addition of angles.

### Features
- **Interactive Complex Plane**: A Cartesian coordinate system representing the complex plane (real axis horizontally, imaginary axis vertically).
- **Draggable Vectors**: Two distinct interactive vectors, `z1` and `z2`, representing complex numbers, which users can drag around the plane to change their values.
- **Real-Time Multiplication**: The product `z3 = z1 * z2` is calculated and displayed in real-time as a third vector.
- **Visual Proof of Multiplication Rules**:
  - **Magnitude Scaling**: Dashed circles or arcs showing the magnitudes $|z1|$, $|z2|$, and the resulting $|z3| = |z1| * |z2|$.
  - **Angle Addition**: Visual representation of the angles (arguments) $\theta_1$, $\theta_2$, and the sum $\theta_3 = \theta_1 + \theta_2$.
- **Coordinate Display**: Real-time readout of the Cartesian ($a + bi$) and polar ($r \cdot e^{i\theta}$) coordinates for all three vectors.

### Design Goals
- **Geometric Intuition**: Demystify complex multiplication by showing that it's just a combination of scaling and rotation.
- **Direct Manipulation**: Allow users to interact directly with the math by dragging the vectors rather than just typing numbers.
- **Clear Visual Hierarchy**: Use distinct colors for `z1`, `z2`, and the product `z3` to make the relationships clear, with matching colors for their respective magnitude and angle indicators.

### Implementation Plan
- **HTML**: A split layout with a full-screen `<canvas>` for the interactive plane and a side/overlay panel for the coordinate readouts and math formulas.
- **CSS**: A clean, dark theme with bright, distinct colors for the vectors (e.g., cyan for `z1`, magenta for `z2`, and yellow for `z3`). Ensure the overlay panel is responsive.
- **JavaScript**:
  - Implement a rendering loop on the `<canvas>` to draw the grid, axes, vectors, magnitude circles, and angle arcs.
  - Handle pointer events for dragging the vector heads (`z1` and `z2`).
  - Calculate the product `z3` mathematically: $z3 = (a_1a_2 - b_1b_2) + (a_1b_2 + a_2b_1)i$.
  - Convert coordinates between Cartesian and screen space (accounting for the inverted canvas Y-axis).
  - Update the DOM elements in the overlay with the formatted values of the complex numbers.