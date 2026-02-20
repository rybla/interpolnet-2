# Directory

This is the directory of all Interpolnet demos.

## Falling Sand Physics Simulation [[demo](https://rybla.github.io/interpolnet-2/falling-sand)]

A falling-sand style physics simulation. The user can choose from a variety of different materials to place into the world:

- Sand has gravity and spreads out with high friction.
- Water has gravity and spreads out with no friction.
- Stone has no gravity and stays in place.
- Plant has no gravity and grows upwards.
- Ooze is like water but spreads out very slowly and sticks together.
- Steam is like water but with inverse gravity.
- Lava is like water but spreads out slower. Lava melts sand into stone. Lava boils water into steam. Lava burns plant and ooze into steam.

## UI Design Playground [[demo](https://rybla.github.io/interpolnet-2/ui-design-playground)]

A UI design playground that lets users tweak CSS variables for a mock dashboard and immediately see the results on typography and layout.

### Features
- **Mock Dashboard**: A realistic looking dashboard UI containing cards, charts placeholders, lists, and various form elements.
- **Real-time Customization**: A control panel that allows users to adjust:
    - **Colors**: Primary brand color, background colors, surface colors, and text colors.
    - **Typography**: Base font size, heading scale, and font families.
    - **Spacing**: Base spacing unit which scales padding and margins.
    - **Borders**: Border radius for cards and buttons.
- **Instant Feedback**: Changes in the control panel are immediately reflected in the dashboard.
- **Responsive Design**: The layout adapts to different screen sizes, with a collapsible control panel on smaller screens.

### Design Goals
- **Interactive Learning**: Help users understand how CSS variables affect a design system.
- **Visual Consistency**: Demonstrate how a few variables can control the look and feel of an entire application.
- **Usability**: Provide an intuitive interface for tweaking design tokens without writing code.

### Implementation Plan
- **HTML**: Structure the page with a split view: a sidebar for controls and a main area for the mock dashboard. The dashboard will use semantic HTML for better accessibility and structure.
- **CSS**: Heavily rely on CSS Custom Properties (Variables) for all themable values. Flexbox and Grid will be used for layout. The dashboard will have a distinct visual style that can be drastically altered by the variables.
- **JavaScript**: Listen for `input` events on the control panel inputs and update the `style` attribute of the document root (or a wrapper element) to set the new CSS variable values.
