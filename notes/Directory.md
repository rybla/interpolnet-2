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

## Lambda Calculus Visualizer [[demo](https://rybla.github.io/interpolnet-2/lambda-calculus-visualizer)]

An interactive lambda calculus evaluator that visually steps through beta reductions and highlights bound variables as the execution progresses. This tool is designed to help students and enthusiasts understand the core mechanics of functional programming and lambda calculus through visualization.

### Features
- **Expression Input**: A text input area where users can type lambda calculus expressions. Supported syntax includes standard notation (e.g., `λx.x`, `(\x.x)`, or just `\x.x`).
- **Visual Representation**: The expression is rendered as a tree or a nested structure of boxes, making the structure of applications and abstractions clear.
- **Step-by-Step Evaluation**: Users can click a "Step" button to perform a single beta reduction.
- **Highlighting**:
    - **Redex Identification**: The next reducible expression (redex) is highlighted.
    - **Variable Binding**: Hovering over a lambda abstraction highlights all occurrences of its bound variable. Hovering over a variable highlights the lambda that binds it.
- **Animation**: Smooth transitions when substituting variables and reducing expressions to make the transformation process easy to follow.
- **Predefined Examples**: A dropdown menu with classic combinators (e.g., I, K, S, Y, Church numerals) to quickly load and explore.

### Design Goals
- **Clarity**: The primary goal is to demystify beta reduction. The visual feedback should make it obvious *what* is being replaced and *where*.
- **Interactivity**: Immediate feedback on syntax errors and the ability to interact with the visual elements (hovering, clicking) enhances learning.
- **Aesthetics**: A clean, modern interface with a soothing color palette (e.g., dark mode with neon accents for highlighting) to make the abstract math feel approachable and engaging.

### Implementation Plan
- **Parser**: Implement a recursive descent parser in JavaScript to convert the string input into an Abstract Syntax Tree (AST). The AST will support Abstractions (`λx.body`), Applications (`(f a)`), and Variables (`x`).
- **Evaluator**: Implement a reducer that finds the leftmost-outermost redex (normal order reduction). It needs to handle alpha-conversion to avoid variable capture (renaming variables when necessary).
- **Renderer**:
    - Map the AST to DOM elements. Abstractions will be containers with a header (the lambda and variable) and a body. Applications will be containers holding the function and the argument side-by-side.
    - Use CSS Flexbox for layout.
- **Animation**: Use the Web Animations API or CSS transitions. When a reduction happens:
    1. Highlight the redex.
    2. Animate the argument moving into the positions of the bound variable in the function body.
    3. Replace the redex with the reduced body.
- **State Management**: Keep track of the current AST and the history of reduction steps to allow "Undo" or "Reset" functionality.

## Hindley-Milner Type Inference Visualizer [[demo](https://rybla.github.io/interpolnet-2/hm-type-inference-visualizer)]

An interactive tool that visualizes the Hindley-Milner type inference algorithm. Users input functional programming expressions (similar to lambda calculus but with `let` bindings), and the system infers the type, showing the unification process and the resulting type tree.

### Features
- **Expression Input**: Supports lambda calculus syntax plus `let` bindings (e.g., `let id = \x.x in id`).
- **Real-time Inference**: Updates the type inference as the user types.
- **Unification Visualization**: Shows the constraints generated and how they are solved (unified).
- **Type Tree Visualization**: Visually represents the inferred type as a tree structure.
- **Interactive AST**: Hovering over parts of the expression highlights the corresponding type constraints.

### Design Goals
- **Educational**: Help users understand how type inference works "under the hood".
- **Visual**: Use diagrams (trees/graphs) to represent types and constraints.
- **Clean UI**: Minimalist interface focusing on the code and the visualization.

### Implementation Plan
- **Parser**: Implement a parser for a mini-functional language.
    - AST nodes: `Var`, `Abs` (lambda), `App`, `Let`, `Lit` (Int, Bool).
- **Type System**:
    - Types: `TVar` (type variable), `TCon` (type constructor like Int, Bool), `TArr` (function arrow).
    - **Inference Algorithm**: Implement Algorithm W to generate constraints and substitutions.
    - **Unification**: Solve constraints, maintaining a substitution map.
- **Visualization**:
    - **AST View**: Display the parsed expression structure.
    - **Constraint View**: List generated constraints.
    - **Substitution View**: Show current variable mappings (e.g., `a -> Int`).
    - **Type Tree**: Render the final type using a tree layout using HTML/CSS.
- **UI/UX**:
    - Split screen: Code input on one side, Visualization on the other.
    - Color coding for type variables to track them easily.

## Dynamic AST Visualizer [[demo](https://rybla.github.io/interpolnet-2/dynamic-ast-visualizer)]

An interactive tool that visualizes the Abstract Syntax Tree (AST) of a custom C-like programming language in real-time. As the user types code, the tree structure grows, prunes, and updates dynamically.

### Features
- **Real-time Parsing**: Code is parsed on every keystroke (with debouncing) to generate an AST.
- **Dynamic Tree Visualization**: The AST is rendered as a node-link diagram using SVG.
- **Bidirectional Highlighting**:
    - Hovering over a node in the tree highlights the corresponding code in the editor.
    - Hovering over code highlights the corresponding node in the tree.
- **Collapsible Branches**: Users can click on tree nodes to collapse or expand branches to focus on specific parts of the code.
- **Zoom and Pan**: The visualization area supports zooming and panning to navigate large ASTs.

### Design Goals
- **Educational**: Provide a clear visual representation of how source code translates into a hierarchical structure.
- ** responsiveness**: Ensure the visualization updates smoothly and feels responsive to user input.
- **Aesthetics**: Use a clean, modern design with smooth animations for tree updates (nodes entering/exiting).

### Implementation Plan
- **Parser**: Implement a recursive descent parser for a subset of C-like syntax.
    - Supported constructs: `function`, `var`, `if`, `while`, `return`, binary operations, function calls.
    - Output: A JSON-like tree structure where each node contains its type, value (if applicable), children, and source code range (start/end indices).
- **Layout Engine**: Implement a tree layout algorithm (e.g., Reingold-Tilford) to calculate x/y coordinates for each node.
- **Renderer**:
    - Use SVG for rendering nodes (circles/rectangles) and edges (lines/curves).
    - Use CSS transitions for smooth movement of nodes when the tree structure changes.
- **Code Editor**: A `textarea` for input, with a synchronized overlay for syntax highlighting and range highlighting.
- **Interaction Logic**:
    - Map source ranges to AST nodes.
    - Handle mouse events for hovering and clicking.
    - Implement zoom/pan logic for the SVG container.

## Mark and Sweep [[demo](https://rybla.github.io/interpolnet-2/mark-and-sweep)]

An interactive visualization of the Mark-and-Sweep garbage collection algorithm. This demo helps users understand how automatic memory management works by allowing them to manipulate object references and trigger the garbage collection cycle.

### Features
- **Memory Heap Visualization**: The memory heap is represented as a graph where nodes are objects and edges are references.
- **Interactive References**: Users can click on reference edges to "sever" them, effectively simulating a variable going out of scope or being set to null.
- **Root Set**: Clearly distinct "Root" nodes (representing the stack or global variables) serve as the starting point for reachability.
- **Allocation Simulation**: A button to "Allocate" new objects, which randomly links them to existing reachable objects, simulating program execution.
- **Step-by-Step GC**:
    - **Mark Phase**: When triggered, the algorithm traverses the graph from the roots, visually "marking" reachable objects (e.g., changing color).
    - **Sweep Phase**: After marking, the system identifies unmarked objects and animates their deallocation (e.g., fading away), reclaiming space.

### Design Goals
- **Educational Clarity**: Distinguish clearly between "reachable" (live) and "unreachable" (garbage) memory.
- **Interactive Learning**: Allow users to create "garbage" manually and see it being collected.
- **Visual Satisfaction**: Use satisfying animations for the marking spread and the sweeping deletion.
- **Responsive Design**: Ensure the visualization works well on both desktop and mobile screens.

### Implementation Plan
- **Data Structure**:
    - `HeapObject`: ID, position (x,y), marked (boolean).
    - `Reference`: fromID, toID.
    - `RootSet`: List of IDs that are always reachable.
- **Rendering**:
    - Use SVG for drawing graph structures and enabling easy interaction (clicking edges).
    - Nodes: Circles with unique IDs or labels.
    - Edges: Directed arrows connecting nodes.
- **Interaction**:
    - Click on edge: Remove the reference.
    - Click on "Allocate": Create a new node and add a reference from a random reachable node to it.
    - Click on "Run GC": Start the animation loop for Mark and Sweep.
- **Algorithm & Animation**:
    - **Mark**: BFS/DFS traversal from Roots. Animate the "discovery" of nodes with a delay. Change node color to "Marked" state.
    - **Sweep**: Iterate through all nodes. If `!marked`, animate removal. If `marked`, reset `marked` flag for next cycle and revert color.

## Weak Memory Models [[demo](https://rybla.github.io/interpolnet-2/weak-memory-models)]

An interactive visualization of hardware memory models, specifically focusing on Total Store Order (TSO) to demonstrate how buffering stores can lead to counter-intuitive execution results (anomalies).

### Features
- **Dual-Thread Simulation**: Users control two concurrent threads of execution.
- **Operational TSO Model**:
    - **Instruction Queues**: Each thread has a sequence of Load and Store instructions.
    - **Store Buffers**: Visual representation of the FIFO buffer where stores are held before committing to main memory.
    - **Main Memory**: Shared global state for variables (x, y).
    - **Registers**: Local thread state (r1, r2).
- **Interactive Scheduling**:
    - **Step**: Execute the next instruction in a thread.
    - **Flush**: Commit the oldest store from a thread's buffer to main memory.
- **Litmus Test Presets**: Easily load classic concurrency scenarios:
    - **Store Buffering (SB)**: The classic example where `r1=0, r2=0` is possible despite `x=1, y=1`.
    - **Message Passing (MP)**: Shows safety in TSO (but would fail in weaker models).
    - **Independent Reads**: Shows how independent loads can be reordered (or not, depending on the model, though TSO preserves load-load).
- **Anomaly Detection**: The system highlights when a final state is reached that would be impossible under Sequential Consistency.

### Design Goals
- **Demystify Concurrency**: Show *mechanistically* why reordering happens (it's just buffering!), rather than just abstract rules.
- **Gamification**: The user acts as the "scheduler", trying to trigger specific edge cases by carefully interleaving steps and flushes.
- **Visual Clarity**: Bright, distinct colors for different values/variables to easily track data flow from registers to buffers to memory.

### Implementation Plan
- **HTML Structure**: A layout with three main sections: Thread 1 (Left), Main Memory (Center), Thread 2 (Right). Each thread section includes its Instruction Queue, Registers, and Store Buffer.
- **State Management**:
    - A central store object tracking: `programCounters` for T1/T2, `storeBuffers` (queues of `{addr, val}`), `registers` (map), and `memory` (map).
    - History stack for "Undo" functionality.
- **Interaction Logic**:
    - `Step(threadId)`:
        - If `Load`: Check local buffer for address; if hit, return value; else read main memory. Update register.
        - If `Store`: Push `{addr, val}` to local Store Buffer.
    - `Flush(threadId)`: Pop oldest store from buffer, write to main memory.
- **Rendering**:
    - Use CSS Grid for the layout.
    - Animate the movement of values:
        - From Instruction to Buffer (on Store).
        - From Buffer to Memory (on Flush).
        - From Memory/Buffer to Register (on Load).
    - Use `requestAnimationFrame` for smooth transitions of "data packets".

## Piet Interpreter [[demo](https://rybla.github.io/interpolnet-2/piet-interpreter)]

An interactive Piet interpreter that traces a cursor through a pixel art grid to show how color transitions dictate program logic. Piet is an esoteric programming language where programs are images. The program counter moves across the image, from one continuous block of color to the next. The "meaning" of a transition is determined by the difference in hue and lightness between the two colors.

### Features
- **Visual Execution**: The interpreter displays the program as a grid of colored blocks (codels). A cursor visually moves across the grid to show the current execution point.
- **Interactive Controls**:
    - **Play/Pause**: Automatically step through the program.
    - **Step**: Manually execute one step at a time.
    - **Reset**: Return the program to its initial state.
    - **Speed Control**: Adjust the execution speed.
- **State Inspection**:
    - **Stack**: Visualizes the current state of the stack (the program's memory).
    - **Output**: Displaying the ASCII or numeric output generated by the program.
    - **Direction Pointer (DP) & Codel Chooser (CC)**: Visually indicates the current direction of movement and which edge of the color block is being chosen.
- **Image Import**: Allows users to upload their own small images (GIF/PNG) to be interpreted as Piet programs.

### Design Goals
- **Intuitive Visualization**: Make the abstract rules of Piet (hue/lightness changes) concrete by visualizing the movement and the resulting operations.
- **Aesthetics**: Embrace the "pixel art" nature of Piet. The interface should feel like a retro tool or a specialized image editor.
- **Responsiveness**: The grid and controls should adapt to different screen sizes, ensuring the program is viewable on mobile devices.

### Implementation Plan
- **Piet Logic Engine**:
    - Implement a robust Piet interpreter in JavaScript.
    - **State**: Keep track of the Stack, Direction Pointer (DP), Codel Chooser (CC), and the current Codel coordinates.
    - **Navigation**: Algorithms to find "blocks" of continuous color and determine the exit edge based on DP and CC.
    - **Operations**: Implement the 18 standard Piet operations (push, pop, add, sub, mul, div, mod, not, greater, pointer, switch, duplicate, roll, in(number), in(char), out(number), out(char)).
- **Grid Rendering**:
    - Use an HTML5 `<canvas>` or a CSS Grid/Flexbox layout to render the image. Canvas is likely better for performance with larger images.
    - Draw the codels as colored squares.
    - Overlay a high-contrast cursor (e.g., a white/black border or icon) on the current codel.
- **UI Components**:
    - **Control Panel**: Buttons for Play, Pause, Step, Reset. Slider for Speed.
    - **Stack View**: A list or stack visualization showing values.
    - **Output Console**: A text area to display program output.
    - **Status Indicators**: Icons or text showing the current DP (Right, Down, Left, Up) and CC (Left, Right).
- **File Handling**:
    - Use the File API to read uploaded images.
    - Parse image data to a 2D array of color values (normalizing to Piet's standard 20 colors).

## Mechanical Brainfuck [[demo](https://rybla.github.io/interpolnet-2/mechanical-brainfuck)]

A 2D tape visualizer for Brainfuck where a mechanical read/write head moves physically to execute loops and pointer increments. This demo brings the abstract concept of the Brainfuck tape to life with a skeuomorphic, mechanical design.

### Features
- **2D Tape Grid**: The tape is visualized not just as a 1D strip, but as a winding 2D path (e.g., a Hilbert curve or a snake-like pattern) to fit more memory on the screen while maintaining a mechanical aesthetic.
- **Mechanical Head**: A detailed, animated read/write head that physically traverses the tape.
- **Execution Animation**:
    - **Move**: The head slides or rolls to the next cell.
    - **Increment/Decrement**: Mechanical gears or digits spin to change the value in the current cell.
    - **Loop**: The head physically travels back to the start of the loop, emphasizing the control flow.
- **Code Editor**: A text area to input Brainfuck code with syntax highlighting for the 8 commands.
- **Controls**: Play, Pause, Step, and Speed control.
- **Memory View**: A zoomed-out view or a side panel showing the state of the memory cells.

### Design Goals
- **Tangibility**: Make the execution of Brainfuck code feel physical and tangible.
- **Visual Engagement**: The mechanical movement and animations should be satisfying to watch.
- **Clarity**: Despite the skeuomorphic design, the state of the machine (pointer position, current value) should be clearly readable.

### Implementation Plan
- **Tape Representation**: Use an HTML5 `<canvas>` or SVG to render the 2D tape path. The path will be generated algorithmically (e.g., a snake pattern filling the viewport).
- **Mechanical Head**:
    - Implement a sprite or SVG graphic for the head.
    - Use CSS transitions or the Web Animations API to animate its movement along the tape path.
    - Animate value changes (e.g., a rolling counter effect).
- **Interpreter**:
    - Implement a standard Brainfuck interpreter in JavaScript.
    - Map the linear memory array to the 2D tape coordinates.
    - Support standard commands: `+`, `-`, `<`, `>`, `[`, `]`, `.`, `,`.
- **UI/UX**:
    - **Editor**: A simple code editor overlay or panel.
    - **Controls**: Playback controls (Play/Pause/Step/Reset) and a speed slider.
    - **Output**: A simulated "printer" or display for the output characters.

## Fibonacci Fractal Tree [[demo](https://rybla.github.io/interpolnet-2/fibonacci-fractal-tree)]

An interactive visualization of the recursive Fibonacci sequence calculation as a downward-growing fractal tree. This demo illustrates the concept of recursion, the structure of the call stack, and the redundancy of overlapping subproblems in a naive implementation.

### Features
- **Fractal Growth**: Watch the tree "bloom" as you increase the Fibonacci number. The tree grows downward, with each branch representing a recursive call.
- **Interactive Controls**:
    - **Increase/Decrease n**: Adjust the input number `n` to see how the tree complexity explodes exponentially.
    - **Animation Speed**: Control how fast the recursion unfolds.
- **Subproblem Highlighting**:
    - **Hover Effects**: Hovering over a node highlights all identical subproblems (e.g., all instances of `fib(2)`) to visualize redundancy.
    - **Memoization Mode**: A toggle to enable memoization. When active, the visualization shows how the tree is pruned, calculating each unique subproblem only once.
- **Visual Feedback**:
    - **Golden Ratio Aesthetics**: Use a color palette inspired by the golden ratio and nature (greens, golds, earth tones).
    - **Dynamic Edges**: Lines connecting nodes animate as if growing.

### Design Goals
- **Educational Intuition**: Provide a visceral sense of "exponential growth" through the visual density of the tree.
- **Contrast**: Clearly show the difference between naive recursion (bushy, redundant tree) and memoized recursion (linear-ish, pruned tree).
- **Aesthetic Appeal**: Create a visualization that is beautiful to look at, resembling a biological plant or a mathematical fractal.

### Implementation Plan
- **Recursive Logic**: Implement a generator or an async recursive function to yield the state of the tree step-by-step for animation.
- **Layout Algorithm**: Use a recursive tree layout algorithm.
    - Root at the top.
    - Children split at angles (e.g., +/- 15-30 degrees) or spread horizontally.
    - Branch length and thickness may decrease with depth to enhance the "fractal" look.
- **Rendering**:
    - Use **SVG** for the visualization to allow for clean scaling and easy DOM event handling (hovering).
    - Use CSS transitions for color changes and opacity.
- **UI Overlay**: A minimal control panel for `n`, speed, and the memoization toggle.

## Closure Bubbles [[demo](https://rybla.github.io/interpolnet-2/closure-bubbles)]

An interactive visualization that illustrates JavaScript closures by representing function scopes as physical bubbles. Variables are particles trapped inside these bubbles. The demo demonstrates how an inner function (closure) retains access to its parent's scope (the outer bubble) even after the parent function has finished executing, preventing the parent scope from being "popped" (garbage collected).

### Features
- **Physical Metaphor**:
    - **Scopes as Bubbles**: Functions are represented as semi-transparent, bouncy bubbles.
    - **Variables as Particles**: Variables are physical objects floating inside their respective scope bubbles.
    - **Closures as Tethers**: Returned inner functions maintain a physical connection or containment relationship with their parent scope, visually anchoring it.
- **Interactive Execution**:
    - **Step-by-Step**: Users step through a code snippet to see the line-by-line execution.
    - **Dynamic Creation**: Watch bubbles inflate as functions are called and variables are declared.
    - **Persistence**: Observe how a "closure" keeps the outer bubble alive while other non-closed scopes pop and vanish.
- **Variable Access Visualization**:
    - **Scope Chain Lookup**: When a variable is accessed, a visual line traces from the active function up the bubble chain to find the variable.
    - **Mutation**: See variable particles change color or value when modified by a closure.

### Design Goals
- **Tangible "Trapping"**: The primary goal is to make the concept of "captured variables" feel physical. The user should see that the variable *cannot* leave and the scope *cannot* disappear because it is held by the closure.
- **Physics-based Fun**: The playfulness of bouncing bubbles makes the abstract concept of memory management more engaging and less dry.
- **Clear Distinction**: Visually separate "active execution" from "retained memory".

### Implementation Plan
- **Physics Engine**: Use a custom lightweight physics engine or a library (like Matter.js) to simulate:
    - **Containers**: Scopes are circular boundaries.
    - **Bodies**: Variables are small circles colliding inside.
    - **Constraints**: Closures are linked to their parent scopes.
- **Visuals**:
    - **Canvas API**: Render the physics simulation.
    - **Styling**: Use a "soap bubble" aesthetic with specular highlights and wobble effects.
    - **Code View**: Display the source code and highlight the active line.
- **Simulation Logic**:
    - Hardcode a specific closure scenario (e.g., a counter generator or a function factory).
    - Map each line of code to a specific animation/physics event (e.g., `let x = 1` spawns a particle).
- **Interactions**:
    - "Next Step" button to advance the code.
    - Mouse interaction to poke and drag bubbles (to prove they are physical objects).
