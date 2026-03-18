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

## Structural Subtyping Puzzle [[demo](https://rybla.github.io/interpolnet-2/structural-subtyping-puzzle)]

An interactive puzzle game that visualizes the concept of structural subtyping and generic constraints in programming languages like TypeScript. Users drag and drop "Data Blocks" (representing objects/values) into "Type Slots" (representing interfaces/expected types) to see if they fit.

### Features
- **Visual Type Checking**:
    - **Interface Slots**: Represented as sockets with specific "ports" (indentations) for required properties.
    - **Data Blocks**: Represented as puzzle pieces with "connectors" (protrusions) for their properties.
    - **Fitting Logic**: A block fits a slot if it has *at least* the connectors required by the slot. Extra connectors on the block are allowed (structural subtyping), but missing connectors cause rejection.
- **Generics Support**:
    - Visualizes generic types (e.g., `Container<T>`) using nested shapes or colors.
    - Demonstrates constraints (e.g., `T extends Shape`) by requiring the inner shape to match a specific pattern.
- **Interactive Playground**:
    - **Challenge Mode**: A series of levels where the user must find the correct data block for a given function signature.
    - **Sandbox Mode**: Users can combine properties to create custom blocks and test them against various interfaces.
- **Code Correspondence**:
    - Hovering over any visual element displays its equivalent TypeScript code (interface definition or object literal).
    - Successful matches show the "function call" that would execute.

### Design Goals
- **Intuitive Understanding**: Replace abstract type theory rules with physical intuitions (fitting shapes, connecting plugs).
- **Clear Feedback**: Immediate visual feedback when a type mismatch occurs (e.g., a red highlight on the missing property).
- **Playfulness**: Make the act of "type checking" feel like solving a satisfying spatial puzzle.

### Implementation Plan
- **Data Model**:
    - Define a schema for `Type` (Interface) and `Value` (Object).
    - `Type` structure: `{ name: string, properties: { [key: string]: Type } }`.
    - `Value` structure: `{ properties: { [key: string]: Value } }`.
- **Renderer**:
    - Use **SVG** for crisp, scalable graphics.
    - **Dynamic Shape Generation**: Algorithmically generate SVG paths for blocks and slots based on their properties.
        - Each property (e.g., `id: number`, `name: string`) maps to a specific connector shape/position on the block edge.
    - **Generics**: Render generic parameters as "inlays" or specific color modifications.
- **Interaction**:
    - Implement drag-and-drop using mouse/touch events.
    - **Collision Detection**: Simple bounding box or distance check to detect when a block is hovered over a slot.
    - **Validation Logic**: On drop, recursively check if the dragged Value structure satisfies the Target Type structure.
- **UI/Layout**:
    - **Sidebar**: A "Part Picker" containing available Data Blocks.
    - **Main Area**: The "Type Checking Zone" with active Interface Slots.
    - **Code Panel**: A floating or fixed panel showing the TS syntax.

## Interactive Regex Engine [[demo](https://rybla.github.io/interpolnet-2/regex-engine)]

An interactive regular expression engine that visualizes the conversion of a regex pattern into a Non-Deterministic Finite Automaton (NFA) graph and animates the string matching process state-by-state. This tool helps users understand the underlying mechanics of how regex engines work.

### Features
- **Regex Input**: A text input field where users can type a regular expression. Supports basic operators: concatenation, union (`|`), Kleene star (`*`), and parentheses `()`.
- **String Input**: A text input field to test strings against the compiled regex.
- **NFA Visualization**:
    - **Graph Rendering**: The regex is compiled into an NFA using Thomson's Construction algorithm. The resulting graph is rendered with states (nodes) and transitions (edges).
    - **Epsilon Transitions**: Clearly distinguishes epsilon transitions (automatic jumps) from character transitions.
- **Interactive Matching**:
    - **Step-by-Step Animation**: Users can step through the matching process character by character.
    - **Active States Highlighting**: At each step, the set of active NFA states is highlighted.
    - **Path Tracing**: Visualizes how the engine explores multiple paths simultaneously (or backtracking, depending on the conceptual model shown, here NFA simulation avoids backtracking by keeping a set of states).
- **Match Result**: Indicates success or failure based on whether an accepting state is reached after consuming the input string.

### Design Goals
- **Educational Value**: Demystify regex by showing the state machine it compiles to.
- **Visual Clarity**: Use a clean, directed graph layout. States should be clearly labeled (Start, End).
- **Responsiveness**: The graph layout should update automatically as the regex changes.

### Implementation Plan
- **Regex Parser**:
    - Implement a parser (recursive descent or shunting-yard) to convert the regex string into a structured AST (e.g., `Concat`, `Union`, `Star`, `Char`).
    - Handle operator precedence and grouping.
- **NFA Compiler**:
    - Implement Thomson's Construction to convert the AST into an NFA graph structure.
    - NFA Structure: States, Transitions (input char or epsilon).
- **NFA Simulation**:
    - Implement the NFA matching algorithm:
        - `epsilonClosure(states)`: Find all reachable states via epsilon transitions.
        - `move(states, char)`: Find all reachable states via a specific character transition.
    - Maintain a `currentStates` set.
- **Visualization**:
    - **Graph Layout**: Use a simple layered graph layout (dagre-like) or force-directed layout to position nodes. A simple layer-based approach works well for Thomson NFAs as they have a natural left-to-right flow.
    - **Rendering**: Use SVG for rendering nodes (circles/rectangles) and edges (lines/curves).
    - **UI/UX**:
    - **Inputs**: Top bar with Regex and Test String inputs.
    - **Controls**: Play/Pause, Step Forward, Reset buttons.
    - **Status**: Visual indicator for "Match" or "No Match".

## Dining Philosophers [[demo](https://rybla.github.io/interpolnet-2/dining-philosophers)]

An interactive simulation of the classic Dining Philosophers problem, illustrating synchronization issues in concurrent systems. Users can observe philosophers as they think, get hungry, and attempt to eat, while manipulating mutex timeout variables to explore deadlock scenarios and resolution strategies.

### Features
- **Visual Simulation**: 5 Philosophers sitting around a table with 5 forks.
    - Philosophers have states: Thinking (Idle), Hungry (Waiting for forks), Eating (Holding two forks).
    - Forks have states: Free, Taken.
- **Interactive Controls**:
    - **Mutex Timeout**: Sliders to adjust how long a philosopher waits for a fork before giving up (or infinite wait to induce deadlock).
    - **Eating Duration**: Sliders to adjust how long a philosopher eats.
    - **Thinking Duration**: Sliders to adjust how long a philosopher thinks.
- **Deadlock Visualization**:
    - Visual indicators when a deadlock occurs (all philosophers holding one fork and waiting for the other).
    - "Reset" button to break the deadlock manually.
- **Resource State Tracking**: Real-time display of fork ownership and philosopher status.
- **Algorithm Options**: Toggle between naive (wait indefinitely) and smart (timeout and retry/randomized wait) strategies.

### Design Goals
- **Educational**: Clearly demonstrate the conditions for deadlock (Circular Wait, Hold and Wait, No Preemption, Mutual Exclusion).
- **Interactive**: Allow users to "break" the system by setting bad parameters, then fix it.
- **Aesthetic**: A clean, abstract "dinner party" aesthetic, focusing on the state logic.
- **Responsive**: Works on various screen sizes.

### Implementation Plan
- **State Management**:
    - Central `Simulation` object managing the loop.
    - `Philosopher` class: `id`, `state`, `leftFork`, `rightFork`, `timers`, `color`.
    - `Fork` class: `id`, `owner`.
    - `requestAnimationFrame` loop to update states.
- **Logic**:
    - State Machine: `Thinking` -> `Hungry` -> `Eating` -> `Thinking`.
    - `Hungry`: Try to acquire left fork. If successful, try right fork.
    - If wait time > timeout, release held fork (if any) and go back to `Hungry` (or `Thinking` briefly).
- **Rendering**:
    - **Canvas API**: Draw the table, philosophers (circles), and forks (lines).
    - **Animations**:
        - Smooth transition of forks to philosophers.
        - Color pulses for state changes.
        - Progress bars for eating/thinking duration.
- **UI**:
    - Control panel with sliders for global parameters.
    - Legend for states.

## Monadic Conveyor Belts [[demo](https://rybla.github.io/interpolnet-2/monadic-conveyor-belts)]

An interactive visualization that represents functional monads (specifically `Identity`, `Maybe`, and `Result`) as protective conveyor belts. This demo helps users build an intuition for how Monads handle "wrapped" values, managing side effects (like failure or absence) automatically while allowing pure functions to operate on the underlying data.

### Features
- **Conveyor Belt Pipeline**: A visual assembly line where values travel from left to right through a series of "Processing Nodes".
- **Monad Selector**: Users can switch between different Monad types, changing the behavior of the belt:
    - **Identity**: The baseline. Values are simply wrapped in a box and processed.
    - **Maybe**: Values are wrapped in a "Maybe Box". Some operations might fail (producing `None`/Empty Box). Subsequent nodes automatically ignore empty boxes, preventing crashes.
    - **Result**: Values are wrapped in a "Result Crate". Operations can succeed or fail with an error message. Error crates bypass subsequent processing nodes.
- **Interactive Nodes**: Users can drag and drop function nodes onto the belt:
    - **Math Ops**: `+ 2`, `x 3`, `- 5`.
    - **Logic Ops**: `isEven?` (Fails/None if odd), `isPositive?`.
    - **Transformation**: `toString`.
- **Visualized Bind**:
    - When an item enters a node, the animation explicitly shows the "Bind" operation:
        1. **Unwrap**: The protective box opens.
        2. **Apply**: The pure function operates on the raw value inside.
        3. **Re-wrap**: The result is placed back into a new box (or an empty/error box if the function failed) and sent along.
- **Value Injection**: Users can spawn raw values (numbers) onto the belt to watch them flow through their custom pipeline.

### Design Goals
- **Intuitive "Bind"**: Demystify the `bind` (>>=) operator by showing it as the mechanical process of opening, applying, and sealing.
- **Safety Visualization**: Visually demonstrate how Monads "protect" the pipeline. For example, show an empty `Maybe` box gliding safely through a `divide by 2` node without causing an error, because the node never touches the inside.
- **Composability**: Show that complex behaviors (like error handling) can be composed from simple, pure functions glued together by the Monadic structure.

### Implementation Plan
- **Engine**:
    - **Monad Definitions**: Classes for `Identity`, `Maybe`, `Result`. Each has a `bind(func)` method (conceptually) and a visual representation state.
    - **Pipeline**: An array of `Node` objects (functions).
    - **Item**: The travelling object, holding a `MonadicValue`.
- **Renderer (SVG)**:
    - **Belt**: An animated SVG path (conveyor belt treads moving).
    - **Nodes**: SVG groups representing the machines.
    - **Items**: SVG groups representing Boxes/Crates.
- **Animation**:
    - Use `requestAnimationFrame` for smooth movement.
    - Implement a state machine for items interacting with nodes: `Approaching` -> `Entering` -> `Unwrapping` -> `Transforming` -> `Rewrapping` -> `Exiting`.
- **UI**:
    - **Toolbar**: Draggable nodes (using HTML Drag and Drop API or mouse events).
    - **Control Panel**: Buttons to spawn values, switch Monad mode, and reset the belt.

## Scope Topography [[demo](https://rybla.github.io/interpolnet-2/scope-topography)]

An interactive visualization that maps code scopes (global, function, block) to a 3D topographical terrain. This demo uses the metaphor of elevation to explain variable shadowing: inner scopes are "higher" plateaus that physically obscure or shadow variables defined in lower, outer scopes.

### Features
- **Split View Interface**:
    - **Code Editor**: A text area on the left where users can write JavaScript code. It supports `var`, `let`, `const`, functions, and block scopes `{ ... }`.
    - **Topographical Map**: A 3D isometric or top-down visualization on the right representing the scope chain as a terrain.
- **Terrain Visualization**:
    - **Global Scope**: The base "sea level" terrain.
    - **Nested Scopes**: Functions and blocks create raised plateaus or hills on top of their parent scope's terrain. The deeper the nesting, the higher the elevation.
    - **Variables as Landmarks**: Variables declared in a scope are rendered as structures (e.g., flags, towers, or crystals) standing on that scope's plateau.
- **Shadowing Mechanics**:
    - **Visual Shadowing**: When a variable in an inner scope (high plateau) has the same name as one in an outer scope (low ground), the high variable physically stands above the low one.
    - **View Modes**:
        - **Top-Down**: The high variable literally covers the low one, demonstrating "shadowing" perfectly.
        - **Isometric**: Users can see the layers and understand that the outer variable still exists "underneath" or "outside" the inner scope.
- **Interactive Highlighting**:
    - **Code-to-Map**: Moving the cursor in the code editor highlights the corresponding active scope plateau on the map.
    - **Map-to-Code**: Hovering over a plateau on the map highlights the scope by brightening it.

### Design Goals
- **Spatial Intuition**: Convert the abstract concept of "lexical scope" into a concrete spatial relationship (containment = elevation).
- **Literal Shadowing**: Make the term "variable shadowing" visual and self-explanatory.
- **Dynamic Exploration**: Allow users to type their own code and immediately see the topological consequences.

### Implementation Plan
- **Parser**:
    - Implement a simple JavaScript parser (using a library like Acorn or a custom Babel-based traverse if feasible, or a simplified regex/recursive parser for the demo's scope) to detect scopes and variable declarations.
    - Output a tree structure: `ScopeNode { id, type, range, variables: [], children: [] }`.
- **Terrain Generation**:
    - **Layout Algorithm**: Map the nested `ScopeNode` tree to 2D rectangles.
        - Global scope = full canvas.
        - Inner scopes = smaller rectangles contained within parent rectangles.
    - **Rendering**:
        - Use **HTML5 Canvas** for drawing the isometric terrain.
        - Draw "slabs" for scopes: stacked rectangles with a pseudo-3D extrusion effect.
        - Assign distinct colors to different scope depths.
- **Variable Rendering**:
    - Draw icons/sprites at calculated positions on the slabs.
    - Ensure variables with same names are aligned (conceptually) or just placed within their respective scope bounds.
- **Interaction Logic**:
    - Listen to `input` events on the editor (debounced).
    - Re-parse and re-render the map.
    - Handle `mousemove` to hit-test the map elements or map code cursor position to the AST node.

## Brutalist Spatial Chaos [[demo](https://rybla.github.io/interpolnet-2/brutalist-spatial-chaos)]

An experimental navigation menu that defies standard usability heuristics by embracing a brutalist aesthetic and chaotic physics. The menu grid actively reorganizes itself, elements overlap and flash in neon colors, and the cursor acts as a magnetic repulsor, forcing the user to "chase" the links they want to click.

### Features
- **Chaotic Grid Reorganization**: The navigation menu is not static. It periodically (or responsively) breaks its own grid, shuffling items into overlapping, misaligned positions.
- **Magnetic Repulsion**: The user's cursor emits a "magnetic field" that pushes menu items away. The closer the cursor gets, the stronger the repulsion force, making it challenging to click a specific link.
- **Aggressive Aesthetics**:
    - **Neon Palette**: High-contrast, flashing neon colors (lime green, hot pink, electric blue) against a harsh black or dark gray background.
    - **Overlapping Elements**: Items do not respect boundaries; they stack, intersect, and obscure each other.
    - **Raw Typography**: Use of bold, mono-spaced, or distorted fonts to enhance the "brutalist" feel.
- **Interactive Glitches**: Hovering or clicking triggers visual glitches, screen tearing effects, or sudden color inversions.
- **Responsive Chaos**: The chaos adapts to screen size, ensuring the experience remains usable (albeit frustratingly so) on mobile devices.

### Design Goals
- **Anti-Design**: Deliberately break rules of alignment, spacing, and predictability to create a memorable, if disorienting, experience.
- **Gamification**: Turn the simple act of navigation into a mini-game of skill and patience.
- **Visceral Feedback**: Every interaction should feel impactful, with immediate visual and physics-based responses.

### Implementation Plan
- **Physics Engine**:
    - Implement a custom, lightweight physics system using requestAnimationFrame.
    - **Entities**: Menu items are physics bodies with position, velocity, and dimensions.
    - **Forces**: Implement a repulsion force from the mouse cursor and a weak attraction force to a target "home" position (so items don't fly off-screen permanently).
    - **Collision**: Optional simple collision detection to make items bounce off each other or the screen edges.
- **Rendering**:
    - **DOM-based**: Use absolute positioning for menu items (`div`s) within a container. Update `transform: translate(x, y)` every frame for performance.
    - **CSS**: Use CSS variables for colors to easily implement flashing/strobing effects. Use `mix-blend-mode: difference` or `exclusion` to handle overlapping text legibility and create interesting visual artifacts.
- **Behavior Loop**:
    - **Idle State**: Items drift slowly or jitter.
    - **Interaction**: On mousemove, calculate distance to each item. Apply repulsion vector if within radius.
    - **Chaos Timer**: Every few seconds, randomize the "home" positions of the items to completely restructure the layout.
- **Responsiveness**:
    - On touch devices, the "repulsion" might need to be toned down or changed to a "scatter on touch" interaction to ensure links are clickable.

## Absurdist Volume Slider [[demo](https://rybla.github.io/interpolnet-2/absurdist-volume-slider)]

A volume control interface that embraces inefficiency and humor by requiring the user to operate a physics-based catapult. To set the volume, the user must aim and launch a rock at a distant target structure. The resulting volume level is dynamically determined by the impact coordinates and the magnitude of structural destruction.

### Features
- **Physics-Based Catapult**:
    - **Drag-to-Aim**: Users pull back on the catapult arm to set tension (power) and angle.
    - **Trajectory Preview**: A dotted line shows the predicted path of the projectile.
- **Destructible Environment**:
    - **Target Structure**: A tower of blocks or a bullseye that reacts physically to impacts.
    - **Debris**: Blocks tumble and fall realistically using 2D rigid body physics (Verlet integration).
- **Dynamic Volume Calculation**:
    - **Precision**: Hitting the "bullseye" or a specific sweet spot sets the volume to 100%.
    - **Chaos Factor**: The amount of destruction (number of toppled blocks) can add a multiplier or fine-tune the level.
    - **Visual Indicator**: A giant speaker or volume bar updates in real-time as the destruction settles.
- **Audio Feedback**:
    - **Sound Effects**: Satisfying "thud", "crash", and "crumble" sounds (synthesized or simple samples).
    - **Volume Test**: A sample loop plays at the newly set volume to confirm the setting.

### Design Goals
- **Absurdity**: Highlight the ridiculousness of using a siege weapon for a simple UI task.
- **Visceral Satisfaction**: Make the act of destroying the UI feel heavy and impactful.
- **Gamification**: Turn volume adjustment into a skill-based mini-game.

### Implementation Plan
- **Physics Engine**: Implement a custom lightweight Verlet integration engine to handle particles, constraints, collisions, and gravity.
- **Rendering**:
    - Use **HTML5 Canvas** for high-performance rendering of the physics objects.
    - Draw the catapult, rock, and target blocks with a consistent, perhaps "sketchy" or "blueprint" aesthetic.
- **Game Loop**:
    - `Update`: Step the physics simulation.
    - `Draw`: Clear canvas, render all bodies.
    - `Check State`: Detect when the rock stops or falls off-screen to finalize the volume reading.
- **Interaction Logic**:
    - `mousedown`/`touchstart`: Start aiming.
    - `mousemove`/`touchmove`: Update aim vector.
    - `mouseup`/`touchend`: Apply force to the rock and release.

## Depth-Layout Finger Menu [[demo](https://rybla.github.io/interpolnet-2/depth-layout-finger-menu)]

A monochromatic 3D tunnel interface where navigation happens along the Z-axis. Users scroll (or drag) to move forward/backward through layers of menu items. Items scale exponentially as they approach the "camera" (screen surface), simulating a flight through the menu. Inactive layers (too far or too close) fade into the background fog. Clicking an item activates a nested function or submenu, potentially triggering a warp-speed transition or a smooth camera pan to a new tunnel branch.

### Features
- **3D Tunnel Visualization**: A perspective view of menu items arranged in layers along the Z-axis.
- **Z-Axis Scrolling**: Scroll wheel or touch-drag controls the camera's Z-position, effectively flying through the tunnel.
- **Exponential Scaling**: Items close to the viewer are large; items further away shrink rapidly, creating a strong sense of depth.
- **Atmospheric Fog**: Items fade out based on their distance from the optimal viewing plane, blending into the background color.
- **Monochromatic Aesthetic**: A strict single-color palette (e.g., Matrix green, Cyberpunk cyan, or a stark white-on-black) for a cohesive, futuristic look.
- **Interactive Hover/Focus**: Active items (closest to the specific Z-plane) highlight or pulse when focused.

### Design Goals
- **Immersion**: Make the user feel like they are physically traveling through the interface.
- **Cleanliness**: A strict monochromatic theme focuses attention on structure and motion.
- **Fluidity**: Smooth 60fps animations for scrolling and transitions.

### Implementation Plan
- **Tech Stack**: HTML5 Canvas for performance and 3D rendering (custom simple 3D projection).
- **Data Structure**: A tree of menu nodes. Each node has a label, icon, and children.
- **State**:
    - `cameraZ`: Current depth position.
    - `layers`: Array of menu items currently visible.
    - `theme`: Color constants.
- **Rendering (Canvas)**:
    - **Projection**: Map (x, y, z) 3D coordinates to (screenX, screenY) using perspective projection: `scale = focalLength / (focalLength + z + cameraZ)`.
    - **Loop**: Clear canvas -> Update positions based on input -> Sort by depth (painters algorithm) -> Draw items with calculated scale and opacity.
    - **Fog**: `globalAlpha` or color mixing based on `z` distance.
- **Interaction**:
    - `wheel`: Increment/decrement `cameraZ`.
    - `touchmove`: Map vertical drag to `cameraZ`.
    - `click`: If item is clicked, animate transition to submenu (reset `cameraZ` or fly into the item).

## Degrading Typography [[demo](https://rybla.github.io/interpolnet-2/degrading-typography)]

A manifesto on web impermanence that features text characters physically detaching from the Document Object Model and falling away if the user hovers their mouse over them too slowly. This demo renders the font via a WebGL particle system that crumbles into digital dust scattered across the viewport.

### Features
- **WebGL Particle Typography**:
    - **Font Rendering**: Text is rendered not as standard HTML elements but as a dense collection of thousands of individual particles in a WebGL context.
    - **Fidelity**: At rest, the particles perfectly align to form crisp, readable characters of a serif manifesto-style font.
    - **Crumbling Physics**: Upon triggering, the particles lose their cohesion and become subject to a physics simulation (gravity, collision, drag), causing the letter to disintegrate into dust.
- **Interaction Model**:
    - **Hover Sensitivity**: The degradation is triggered by *slow* mouse movement. If the user moves quickly, the text remains stable. If they linger or drift slowly over a character, it detects the "stagnation" and begins to crumble.
    - **Permanent Decay**: Once a character crumbles, it does not reform. The text is permanently lost for the session, emphasizing the theme of impermanence.
- **Aesthetic**:
    - **Manifesto Style**: Large, centered, high-contrast typography (e.g., bright white on deep black) presenting a statement about the fleeting nature of digital content.
    - **Particle Visuals**: Particles are small, pixel-like points that scatter realistically.

### Design Goals
- **Thematic Resonance**: Connect the user's behavior (lingering/reading slowly) directly to the destruction of the content. To read is to destroy.
- **Visual Impact**: Create a "wow" moment when the solid text dissolves into fluid particles.
- **Performance**: Use WebGL to handle the thousands of particles required for high-quality text representation without lagging the browser.

### Implementation Plan
- **Tech Stack**: HTML5 Canvas + WebGL (via a lightweight wrapper or raw API).
- **Text Processing**:
    - **Offscreen Canvas**: Render the manifesto text string to an offscreen 2D canvas.
    - **Sampling**: Iterate through the pixel data of the offscreen canvas. For every non-transparent pixel, spawn a particle at that `(x, y)` coordinate.
    - **Optimization**: Store particle positions in a Float32Array for fast WebGL buffer updates.
- **Particle System**:
    - **Attributes**: Position `(x, y)`, Velocity `(vx, vy)`, State `(Stable, Falling)`.
    - **Physics Kernel**: In the animation loop, update falling particles: `y += vy`, `vy += gravity`. Add some horizontal spread `vx` based on mouse interaction direction.
- **Interaction Logic**:
    - **Mouse Tracking**: Track mouse position and speed (delta distance / delta time).
    - **Trigger**: Check if mouse is over a "stable" particle's initial position AND speed < threshold.
    - **Explosion**: If triggered, switch particle state to `Falling` and assign random initial velocities.
- **Rendering**:
    - **Vertex Shader**: Simple point rendering.
    - **Fragment Shader**: Solid color (white/grey).
    - **Loop**: Clear buffer -> Update Physics -> Draw Arrays.

## Skeuomorphic Savings Jar [[demo](https://rybla.github.io/interpolnet-2/skeuomorphic-savings-jar)]

A financial dashboard that requires users to allocate their funds by physically dragging physics-enabled 3D coins into rendered glass jars. This demo emphasizes the tactile satisfaction of saving money through realistic collision physics, acoustic feedback, and high-fidelity rendering of glass and metal materials.

### Features
- **3D Physics Environment**:
    - **Coins**: Realistic 3D models of coins (e.g., gold, silver, bronze) that react to gravity, collisions, and user interaction.
    - **Jars**: Glass jars with refractive properties that contain the coins. They have physical boundaries that contain the coins.
    - **Interactivity**: Users can click and drag coins to move them. Releasing a coin lets it fall.
- **Skeuomorphic Design**:
    - **Material Rendering**: High-quality rendering of metallic coins and glass jars using WebGL/Three.js or similar technology.
    - **Shadows and Refraction**: Realistic shadows cast by the coins and jars, and refraction effects through the glass.
- **Audio Feedback**:
    - **Collision Sounds**: Procedural or sampled sounds that trigger when coins hit each other or the glass jar, varying based on velocity and material.
    - **Ambience**: Subtle background sounds to enhance immersion.
- **Financial Dashboard Elements**:
    - **Allocation Tracking**: The system tracks which jar each coin is in and updates a UI dashboard showing the total funds allocated to different categories (e.g., "Vacation", "Emergency", "Gadgets").
    - **Labels**: Jars are labeled with their specific purpose.

### Design Goals
- **Tactile Satisfaction**: The primary goal is to make the act of saving money feel substantial and rewarding through physics and sound.
- **Visual Realism**: Push the boundaries of web-based 3D rendering to create a convincing illusion of physical objects.
- **Playfulness**: Turn a mundane task (budget allocation) into a playful, physics-based toy.

### Implementation Plan
- **Tech Stack**:
    - **Three.js**: For 3D rendering (scene, camera, lights, meshes, materials).
    - **Cannon-es**: For 3D physics simulation (rigid bodies, collisions, gravity).
- **Scene Setup**:
    - **Camera**: Fixed perspective looking slightly down at a table surface.
    - **Lighting**: carefully placed lights to enhance the metallic and glass materials (e.g., environment map, point lights).
    - **Objects**:
        - **Jars**: Cylinder geometries with an open top. Physics bodies will need to be compound shapes to approximate the hollow cylinder.
        - **Coins**: Cylinder geometries with custom textures/materials. Physics bodies are cylinders.
        - **Table**: A static plane for coins to rest on initially.
- **Interaction Logic**:
    - **Raycasting**: Use Three.js Raycaster to map mouse/touch input to 3D world coordinates.
    - **Drag and Drop**: Create a "Mouse Joint" or spring constraint in the physics engine to pull the clicked coin towards the cursor/finger position.
- **Audio System**:
    - Listen for collision events from the physics engine.
    - Trigger sound samples with volume/pitch modulated by impact velocity.
- **UI Overlay**:
    - HTML/CSS overlay for the dashboard statistics (Total Saved, Category Breakdowns).
    - Update logic: Check coin positions periodically (or on sleep) to determine which jar they are inside and update totals.

## Pixel Peeping [[demo](https://rybla.github.io/interpolnet-2/pixel-peeping)]

A side-by-side comparison game that challenges the user to identify microscopic padding and hex-code errors under a simulated magnifying glass. This tool utilizes an interactive loupe tool that distorts and magnifies the underlying CSS rendering to reveal sub-pixel discrepancies, gamifying the attention to detail required in UI development.

### Features
- **Spot the Difference**: Two nearly identical UI components are presented side-by-side. One is the "Reference" (perfect), and the other is the "Candidate" (flawed).
- **Interactive Loupe**:
    - **Magnification**: A circular "lens" follows the mouse cursor, providing a high-level zoom (e.g., 8x-16x) of the area underneath.
    - **Sub-pixel Rendering**: The loupe reveals subtle misalignments (e.g., 1px padding differences), incorrect border radii, or slight color mismatches (e.g., `#333` vs `#334`) that are invisible to the naked eye.
    - **Distortion Effects**: Optional chromatic aberration or barrel distortion within the loupe to simulate a real optical lens.
- **Gamified Progression**:
    - **Levels**: Users progress through increasingly difficult levels. Early levels have obvious errors (wrong margin, wrong color). Later levels have "pixel-peeping" errors (sub-pixel antialiasing differences, 1px shifts).
    - **Scoring**: Points are awarded for speed and accuracy. Clicking the correct error highlights it and moves to the next level. Incorrect clicks result in a penalty.
- **Visual Feedback**:
    - **Error Reveal**: When an error is found, the UI highlights the specific DOM element responsible and displays the CSS property mismatch (e.g., "Expected: padding-left: 12px, Found: 11px").
    - **Confetti/Sound**: Satisfying feedback upon finding a bug.

### Design Goals
- **Training Eye for Detail**: Train designers and developers to notice the small details that make a UI feel "polished".
- **Satisfaction**: The "Aha!" moment of spotting a tiny error with the aid of a tool.
- **Realistic Constraints**: Use actual HTML/CSS rendering so the errors are genuine browser rendering behaviors, not just static images.

### Implementation Plan
- **Dual Rendering Engine**:
    - Render the "Reference" component in a side container.
    - Render the "Flawed" component in the main view.
    - The "Flawed" component will be generated by taking the Reference configuration and applying random CSS mutations (changing `padding`, `margin`, `color`, `border-width` by small amounts).
- **Loupe Implementation**:
    - **Technique**: Use a synced container approach.
        - Create a `div` for the loupe.
        - Inside the loupe, place a *copy* of the entire game stage (Reference and Candidate).
        - Transform the inner copy: `scale(10)` and `translate(-mouse_x, -mouse_y)` so that the zoomed view matches the cursor position.
        - Use `overflow: hidden` and `border-radius: 50%` on the loupe container.
    - **Canvas Fallback**: If DOM performance is poor with many elements, use `html2canvas` to rasterize the view and draw the zoomed portion to a canvas inside the loupe. However, CSS `transform` is preferred for crisp vectors.
- **Interaction Logic**:
    - Track mouse movement to update the Loupe's position and internal transform.
    - Track clicks. If a click occurs on a mutated element, validate the find.
- **Level Generation**:
    - Define a library of "Components" (Buttons, Cards, Navbars, Inputs).
    - Define a library of "Mutations" (Color shift, Padding shift, Font weight, Border radius).
    - Randomly select a component and a mutation for each level.

## Audio Reactive Interface [[demo](https://rybla.github.io/interpolnet-2/audio-reactive-interface)]

A music player should feature a play button, timeline, and volume slider composed entirely of an active frequency waveform, where the structural integrity of the UI vibrates violently to the bass track, requiring the user to accurately click rapidly moving targets to pause the music.

### Features
- **Waveform UI Elements**: The Play/Pause button, Timeline, and Volume Slider are rendered as continuous lines or shapes that are directly modulated by the audio's frequency spectrum.
- **Bass-Driven Instability**: Low-frequency signals (bass) cause the entire interface to shake, distort, and displace, simulating physical vibration.
- **Procedural Audio Generation**: Uses the Web Audio API to generate a rhythmic, bass-heavy beat in real-time, eliminating the need for external audio files.
- **Dynamic Hit Detection**: Interaction targets (click zones) move in sync with the visual distortion, forcing the user to track the UI elements with their mouse to successfully interact.
- **Visual Feedback**: A high-contrast, oscilloscope-inspired aesthetic (e.g., neon green/blue on black) to emphasize the waveform nature of the interface.

### Design Goals
- **Synesthesia**: Create a direct, visible link between the sound energy and the interface form.
- **Gamified Anti-Usability**: Intentionally degrade usability in a fun, rhythmic way to challenge the user's precision and timing.
- **Performance**: Maintain a smooth 60fps framerate even with heavy canvas redrawing and audio analysis.

### Implementation Plan
- **Audio Engine**:
    - Use `AudioContext` with `OscillatorNodes` (Sawtooth/Square waves) and `GainNodes` to create a sequencer loop.
    - Route audio through an `AnalyserNode` to capture FFT (Fast Fourier Transform) data.
    - Implement a "Kick" drum synthesis for heavy bass impacts.
- **Renderer**:
    - **Canvas API**: Render all UI components on a single full-screen canvas.
    - **Shape Distortion**:
        - **Play Button**: A triangle path where vertices are displaced by specific frequency bins.
        - **Timeline**: A horizontal line that deforms into a wave based on the time-domain data.
        - **Volume**: A vertical slider that expands/contracts with volume levels.
    - **Global Shake**: Apply a random translation `(dx, dy)` to the canvas context based on the average amplitude of the bass frequencies (0-100Hz).
- **Interaction Logic**:
    - **Hit Testing**: Because the shapes move, standard DOM events won't work. Implement custom raycasting/point-in-path checks against the *current* transformed coordinates of the UI shapes.
    - **State Management**: Track `isPlaying`, `volume`, and `currentTime`.

## Blind Navigation [[demo](https://rybla.github.io/interpolnet-2/blind-navigation)]

An interface entirely devoid of hover states or visual affordances should force users to infer clickability solely through trial and error, maintaining the screen as an absolute flat plane while clicks emit sonar-like shockwaves to temporarily illuminate the hidden bounding boxes of buttons.

### Features
- **Invisible Interface**: The initial state of the screen is completely blank or uniform, with no visible buttons, links, or text.
- **Sonar Interaction**:
    - **Click/Tap**: Clicking anywhere on the screen emits a "shockwave" or ripple effect from the cursor position.
    - **Echolocation**: As the shockwave expands, it momentarily reveals the outlines or filled shapes of hidden UI elements (buttons, navigation items) when it intersects them. The reveal is fleeting, fading back to invisibility as the wave passes or dissipates.
- **Hidden Structure**:
    - **Navigation Menu**: A standard website layout (header, sidebar, content area) is hidden in the void.
    - **Interactive Elements**: Buttons and links are functional but invisible until "pinged".
- **Feedback**:
    - **Audio**: A subtle "ping" sound accompanies the visual shockwave, with pitch or volume changing based on proximity to hidden elements.
    - **Success State**: Successfully clicking a hidden button triggers a distinct visual feedback (e.g., a permanent light-up or a page transition) to confirm the action.

### Design Goals
- **Sensory Deprivation**: Force users to rely on active exploration rather than passive scanning.
- **Gamification**: Turn navigation into a game of "Battleship" or echolocation.
- **Atmosphere**: Create a mysterious, dark, and immersive experience.

### Implementation Plan
- **Tech Stack**: HTML5 Canvas for the shockwave and reveal effects.
- **Data Structure**:
    - `UIElement`: Class defining hidden areas `{x, y, width, height, type, action}`.
    - `Wave`: Class for active shockwaves `{x, y, radius, intensity}`.
- **Rendering**:
    - **Base Layer**: A dark/black background.
    - **Hidden Layer**: Offscreen canvas or data structure containing the UI layout.
    - **Effect Layer**: On every frame:
        - Update wave radii.
        - For each wave, calculate its distance to every `UIElement`.
        - If a wave intersects an element, render the element with opacity based on the intersection intensity.
        - Draw the wave rings themselves.
- **Interaction Logic**:
    - `click`: Spawn a new `Wave` at cursor coordinates. Check collision with `UIElement`s. If a click is *inside* a revealed (or even unrevealed) element, trigger its action (e.g., "Navigate to About").

## Infinite Scroll Labyrinth [[demo](https://rybla.github.io/interpolnet-2/infinite-scroll-labyrinth)]

An experimental storytelling platform that abandons traditional vertical scrolling for an infinite, omnidirectional canvas. Text wraps in massive spiral patterns, disorienting the user as the camera continuously rotates and swoops through dynamic 3D transitions to follow the text path.

### Features
- **3D Text Path**: Text is arranged along a complex, non-linear path (e.g., a 3D spiral, a helix, or a knot).
- **Dynamic Camera Movement**: The camera isn't static. It follows the text, rotating to keep the current reading line horizontal while the rest of the world spins around it.
- **Omnidirectional Scrolling**: Scrolling doesn't just move up/down; it advances the camera along the 3D path.
- **Atmospheric Visuals**: Background elements (stars, fog, floating geometric shapes) provide depth and context to the 3D space.
- **Typography**: High-contrast, legible typography that remains readable even when the camera is in motion.

### Design Goals
- **Disorientation**: To challenge the user's spatial awareness and break the convention of "top-down" reading.
- **Immersion**: To make the user feel like they are traveling *through* the story, not just looking at it.
- **Flow**: To create a sense of continuous, fluid motion.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering.
- **Data Structure**:
    - A path definition (e.g., a Catmull-Rom spline) that defines the trajectory of the text.
    - Text segments positioned along this spline.
- **Rendering**:
    - Use `TextGeometry` or `Troika-Three-Text` for high-quality 3D text rendering.
    - Calculate the position and rotation of each text character or segment so it aligns with the tangent and normal of the curve at that point.
- **Camera Logic**:
    - The camera's position is determined by a "progress" variable (0 to 1 along the path).
    - The camera's look-at target is a point slightly ahead on the path.
    - The camera's up vector is derived from the curve's torsion/normal to create the twisting effect.
- **Interaction**:
    - `wheel` events map to the "progress" variable.
    - Smooth damping/lerping to ensure fluid movement.

## Overlapping Z-Index Puzzle [[demo](https://rybla.github.io/interpolnet-2/overlapping-z-index-puzzle)]

A modal window system where alert boxes continuously stack upon one another, creating a towering, claustrophobic mess of interconnected error messages. To close them, the user must solve a complex sliding tile puzzle of UI frames, manipulating their z-index and position to reveal the "Close" buttons buried underneath.

### Features
- **Infinite Modal Stacking**: New modal windows appear at regular intervals or upon interaction, stacking on top of existing ones with deep drop shadows.
- **Z-Index Manipulation**: Users can click and drag modals to move them, but their stacking order (z-index) is constrained or linked to other modals.
- **Sliding Tile Mechanics**:
    - **Interconnected Movement**: Moving one modal might shift others, or a modal might be "pinned" by another on top of it.
    - **Hidden Controls**: The "Close" or "Dismiss" buttons are often obscured by overlapping frames. Users must slide the top layers away to access the controls of the bottom layers.
- **Visual Chaos**:
    - **Shadows**: Deep, semi-transparent box shadows to emphasize the height of the stack.
    - **Themes**: Each modal simulates a different OS or error style (Windows 95, MacOS, Linux, Modern Flat), adding to the visual noise.
- **Puzzle Logic**:
    - **Locks**: Some modals might be "locked" until a specific key or condition (found in another modal) is met.
    - **Shuffle**: A "Shuffle" button that randomly rearranges the z-indices, potentially making the puzzle harder or easier.

### Design Goals
- **Claustrophobia**: Evoke the feeling of a computer crashing or being overwhelmed by popups.
- **Problem Solving**: Turn the annoyance of popups into a spatial reasoning puzzle.
- **Satisfaction**: The relief of finally clearing the screen, one modal at a time.

### Implementation Plan
- **Data Structure**:
    - `Modal`: `{ id, x, y, width, height, zIndex, content, isLocked, dependencies: [] }`.
    - `Stack`: An array of active `Modal` objects.
- **Renderer**:
    - **DOM-based**: Use standard HTML `div` elements for the modals to ensure they look and feel like real UI windows.
    - **CSS Grid/Flex**: Not suitable here; absolute positioning is key.
    - **Z-Index Management**: Dynamically assign `z-index` styles based on the `Stack` order.
- **Interaction Logic**:
    - **Drag and Drop**: Implement custom drag logic. When dragging a modal, check for collisions or constraints with other modals.
    - **Click Handling**: Event bubbling/capture to determine which modal was clicked.
    - **Puzzle Mechanics**:
        - "Pinning": If Modal A is "pinned" by Modal B, A cannot be moved until B is moved away or closed.
        - "Key Finding": Clicking a button in Modal A unlocks Modal B.
- **Game Loop**:
    - **Spawner**: Periodically spawn a new modal if the count is below a threshold.
    - **Win Condition**: When the stack is empty (or below a manageable number), display a "System Stable" message.

## Kinetic Typography Cursor [[demo](https://rybla.github.io/interpolnet-2/kinetic-typography-cursor)]

A landing page where the typography actively flees from the user's cursor, utilizing flocking algorithms. The user must herd the letters into a designated bounding box to form a legible sentence and enable navigation.

### Features
- **Fleeing Typography**: Letters behave like boids (bird-oid objects) that are repelled by the mouse cursor.
- **Flocking Behavior**: Letters have cohesion (stay close to neighbors), separation (don't crowd too much), and alignment (move in the same direction) behaviors, but with a strong repulsion force from the cursor.
- **Herding Mechanic**: The user must use the cursor to "push" the chaotic cloud of letters into a specific target area (a "corral" or bounding box).
- **Legibility State**:
    - **Chaos Mode**: Letters are scattered and rotating randomly.
    - **Order Mode**: When contained within the target area, the letters snap into a readable sentence or word (e.g., "ENTER" or "WELCOME").
- **Navigation**: Once the sentence is formed and held for a brief moment, a "Proceed" button or link becomes active/clickable.

### Design Goals
- **Playful Frustration**: Turn the passive act of reading into an active game of chase.
- **Dynamic Aesthetics**: Use high-contrast, large typography (e.g., bold sans-serif) that looks striking in both chaotic and ordered states.
- **Interactive Narrative**: The user "writes" the message by forcing the letters to cooperate.

### Implementation Plan
- **Physics Engine**:
    - Implement a custom Boids algorithm.
    - **Entities**: Each letter is a boid with `position`, `velocity`, `acceleration`.
    - **Forces**:
        - `Separation`: Steer to avoid crowding local flockmates.
        - `Cohesion`: Steer to move toward the average position of local flockmates.
        - `Alignment`: Steer towards the average heading of local flockmates.
        - `Flee`: Strong repulsion force inversely proportional to distance from mouse cursor.
        - `Containment`: A weaker force keeping them generally on screen, but allowing them to be pushed around.
        - `Snap`: A special force that activates when inside the target box, pulling each letter towards its correct relative position in the sentence.
- **Rendering**:
    - **Canvas API**: Use HTML5 Canvas for high-performance rendering of many moving text elements.
    - **Text Rendering**: `ctx.fillText` for each boid. Rotation based on velocity vector or smooth transition to 0 when snapping.
- **Game Loop**:
    - Update positions based on forces.
    - Check if all boids are within the target bounding box.
    - If yes, increase a "cohesion" counter. If counter > threshold, trigger "Success" state (letters lock in place, button appears).
    - Render frame.
- **UI**:
    - A visible "Target Zone" (dashed line box).
    - Visual feedback when letters enter the zone (e.g., they glow or slow down).
## Parallax Maze [[demo](https://rybla.github.io/interpolnet-2/parallax-maze)]

A multi-layered website that utilizes extreme parallax scrolling to create a visual maze. The user must scroll up and down repeatedly to align gaps in the foreground and background layers to reveal hidden hyperlinks that are otherwise obscured by the overlapping z-layers.

### Features
- **Multi-Layered Parallax**: The environment consists of multiple distinct layers moving at significantly different speeds.
- **Obscuration Mechanics**:
    - **Occlusion**: Walls and obstacles on faster foreground layers frequently block the view of items on slower background layers.
    - **Alignment Puzzles**: Key interactive elements (targets) are only visible and clickable when specific "windows" in the foreground align with the target in the background.
- **Visual Depth**:
    - **Atmospheric Perspective**: Layers fade into darkness or change color saturation based on their depth (z-index).
    - **Dynamic Lighting**: Targets emit a glow that can be glimpsed through cracks, guiding the user.
- **Scavenger Hunt**: The goal is to find and click a series of hidden targets scattered throughout the long vertical scroll range.

### Design Goals
- **Spatial Reasoning**: Challenge the user to predict how scrolling will shift the layers relative to each other.
- **Exploration**: Encourage scanning the entire "depth" of the page, not just the surface.
- **Immersion**: Create a sense of peering into a deep, complex machine or cavern.

### Implementation Plan
- **HTML Structure**:
    - A main `#world` container.
    - Multiple `.layer` containers, each `position: fixed` but transformed via JS.
    - A proxy scroll element (tall empty div) to drive the browser's native scrollbar.
- **Parallax Engine**:
    - Listen to `window.scrollY`.
    - Apply `transform: translateY(-scrollY * speedFactor)` to each layer.
    - Background layers move slowly (low factor), foreground layers move fast (high factor).
- **Level Design**:
    - **Targets**: Placed on the deepest layer.
    - **Obstacles**: Placed on intermediate and foreground layers.
    - **Algorithm**: Pre-calculate specific scroll positions where a target *should* be visible. Place "windows" (gaps in the obstacles) on the upper layers at precisely those coordinates, but fill the rest of the layer with occluding blocks.
- **Interaction**:
    - CSS `pointer-events`: Ensure the "windows" allow clicks to pass through to the underlying layers, or manage hit-testing manually if CSS clipping is insufficient.

## Friction-Based Form Fields [[demo](https://rybla.github.io/interpolnet-2/friction-based-form)]

An intentionally frustrating contact form where fields are "frozen" and must be "warmed up" by vigorously rubbing the mouse over them to generate friction heat. This demo explores the concept of physical interaction metaphors in digital interfaces, turning the simple act of focusing an input into a strenuous physical activity.

### Features
- **Frozen State**: Input fields initially appear "frozen" with icy textures, low opacity, and are disabled, preventing any keyboard input.
- **Friction Logic**:
    - **Heat Generation**: Detects the velocity of mouse movements over the field. Higher velocity generates more heat (kinetic energy conversion).
    - **Cooling System**: Heat dissipates rapidly over time. If the user stops interacting or moves too slowly, the field re-freezes.
- **Visual Feedback**:
    - **Thermometers**: A dynamic temperature gauge next to each input shows the current heat level.
    - **Thawing Animation**: As temperature rises, a frost overlay opacity decreases, and the field's border begins to glow.
    - **Particle Effects**: A particle system generates sparks or steam when the friction level is high, adding visceral feedback.
- **Interactive Thresholds**: Fields only become active/editable when the temperature exceeds a specific "thaw point" (e.g., 80%). Dropping below this point disables the field again.

### Design Goals
- **Playful Frustration**: To make a mundane task (filling a form) surprisingly physical and challenging.
- **Metaphorical UI**: To implement a literal interpretation of "warming up" a cold engine or object.
- **Visual Reward**: To provide satisfying particle and animation feedback that makes the effort feel "productive" despite the inefficiency.

### Implementation Plan
- **HTML**:
    - A standard contact form structure (Name, Email, Subject, Message).
    - Wrapper elements for each input to contain the frost overlays and thermometers.
    - A full-screen `<canvas>` overlay for the particle system.
- **CSS**:
    - **Theming**: A cold, wintery color palette (blues, whites, grays).
    - **Textures**: Use CSS gradients or SVG filters to create a frosted glass effect.
    - **States**: Classes like `.frozen` and `.thawed` to control opacity, pointer-events, and border styles.
- **JavaScript (Physics Engine)**:
    - **Class `HeatManager`**: Manages the temperature state of each field.
        - `update()` loop handles cooling (temperature decay).
        - `addHeat(velocity)` increments temperature based on mouse speed.
    - **Input Handling**: Listen for `mousemove` events to calculate velocity vectors.
    - **Rendering Loop**:
        - Update DOM elements (thermometer height, opacity).
        - Toggle `disabled` attribute on inputs based on temperature.
        - Drive the particle system on the canvas.

## Nostalgic OS Window Chaos [[demo](https://rybla.github.io/interpolnet-2/nostalgic-os-window-chaos)]

A retro-themed web experience that simulates a crashing Windows 95 desktop. The core mechanic is a visual glitch where dragging a window causes it to leave an infinite, highly satisfying trail of frozen window clones across the canvas. Users can embrace this chaos to use windows as makeshift paintbrushes, creating complex patterns and "art" from the debris of a failing operating system.

### Features
- **Infinite Window Trails**:
    - **Visual Glitch**: As the user drags a window, its previous positions are stamped onto a background canvas, creating a permanent trail.
    - **Performance**: Uses an optimized HTML5 Canvas backend to handle thousands of "stamped" window frames without performance degradation, distinct from the active DOM window.
- **Retro Aesthetic**:
    - **Classic UI**: Faithful recreation of the Windows 95/98 design language: teal background (`#008080`), gray beveled windows, navy blue title bars, and pixelated system fonts.
    - **Authentic Controls**: Functional minimize/maximize/close buttons (though they might not always work as expected in a "crashing" system).
- **Interactive Chaos**:
    - **Window Types**: Users can spawn various window types from the "Start" menu: Error messages, Notepad instances, and Image viewers.
    - **BSOD Reset**: A "System Reset" feature that triggers a Blue Screen of Death before clearing the canvas, allowing the user to start their chaotic masterpiece over.
- **Paintbrush Mechanics**: The speed of dragging affects the density of the trail, allowing for different "brush strokes."

### Design Goals
- **Nostalgia**: Evoke the specific frustration and visual distinctiveness of late 90s OS instability.
- **Satisfaction**: Turn a computer bug (screen tearing/trails) into a satisfying creative feature.
- **Performance**: Demonstrate how to mix DOM elements (active windows) with Canvas (trails) to achieve effects that would be impossible with DOM alone.

### Implementation Plan
- **Hybrid Rendering Architecture**:
    - **Foreground (DOM)**: Active, draggable windows are real HTML elements to ensure sharp text and interactivity.
    - **Background (Canvas)**: A full-screen canvas sits behind the UI. When a window is dragged, its visual representation is manually drawn onto the canvas at its current coordinates.
- **WindowManager**:
    - A JavaScript class to manage the lifecycle of DOM windows (spawn, close, focus).
    - Handles z-index sorting to ensure the active window is always on top.
- **Trail Engine**:
    - Listens to `mousemove` events during a drag operation.
    - Calls a `drawWindowToCanvas` function that replicates the CSS styling of the window (borders, colors, title text) using Canvas 2D API calls (`fillRect`, `strokeRect`, `fillText`).
- **UI/UX**:
    - A Taskbar at the bottom with a Start button menu to spawn new windows.
    - Sound effects for error chords and clicks to enhance the retro feel.

## Gestural Password Unlock [[demo](https://rybla.github.io/interpolnet-2/gestural-password-unlock)]

A security interface should replace the traditional password field with a 3D geometric shape that the user must manipulate using complex, multi-touch trackpad gestures to solve a Rubik's Cube-style puzzle, mapping the final configuration to a cryptographic hash function to grant access.

### Features
- **3D Interactive Puzzle**:
    - **Geometric Lock**: A 3x3x3 cube structure resembling a Rubik's Cube serves as the input mechanism.
    - **Gesture Control**: Users rotate individual slices of the cube using drag gestures.
    - **State-Based Hashing**: The specific permutation of the cube's sub-units determines the "password".
- **Security Logic**:
    - **Set Password Mode**: Users manipulate the cube to a secret configuration and save it as their gesture key.
    - **Unlock Mode**: Users must replicate the exact sequence of rotations or final state to unlock the system.
    - **Visual Hashing**: As the user interacts, a real-time "hash" visualization (e.g., a changing hex code or color pattern) updates to show the complexity of the current state.
- **Aesthetic**:
    - **Futuristic Interface**: Glowing neon edges, metallic surfaces, and a dark, cyber-security themed background.
    - **Smooth Animations**: High-frame-rate transitions for slice rotations and camera movements.

### Design Goals
- **Novelty**: reimagine the mundane act of password entry as a tactile, spatial puzzle.
- **Security Theater**: Emphasize the "high-tech" feel of the security mechanism, even if the underlying logic is just a state comparison.
- **Engagement**: Make the unlocking process fun and satisfying.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering.
- **Scene Setup**:
    - **Camera**: OrbitControls for viewing the cube from different angles.
    - **Lighting**: Point lights and ambient light to highlight the metallic materials.
    - **Object**: A group of 27 "cubies" (small cubes) arranged in a grid.
- **Interaction Logic**:
    - **Raycasting**: Detect which face and which cubie is clicked.
    - **Drag Handling**: Calculate the drag vector to determine which slice to rotate (X, Y, or Z axis).
    - **Rotation Animation**:
        1. Group the affected cubies.
        2. Rotate the group 90 degrees.
        3. Ungroup and update the individual cubies' transforms to reflect the new position.
- **State Management**:
    - Serialize the position and orientation of each cubie into a string.
    - Compare current string vs. saved string for authentication.
- **UI**:
    - Overlay for "Set Password", "Unlock", and status messages ("Access Granted", "Access Denied").

## Schrodinger's Checkbox [[demo](https://rybla.github.io/interpolnet-2/schrodingers-checkbox)]

A settings menu featuring "quantum" checkboxes that exist in a superposition of both checked and unchecked states. These checkboxes rapidly oscillate between the two states until the user focuses their cursor on them, at which point the wavefunction collapses randomly into a definitive boolean value (checked or unchecked). This demo explores quantum mechanics concepts (superposition and observation-induced wavefunction collapse) applied to a standard user interface element.

### Features
- **Quantum Superposition State**:
    - By default, the checkboxes are in a "superposition" state, visually vibrating and oscillating rapidly between a checked and unchecked appearance.
    - A custom CSS animation (`@keyframes oscillate`) creates a blurred, glitchy, or vibrating effect to represent the uncertainty of the state.
- **Wavefunction Collapse**:
    - **Observation**: When a user hovers their mouse cursor over a checkbox, focuses it via keyboard navigation, or touches it on a mobile device, the "observation" occurs.
    - **Random Collapse**: The superposition state is broken, and the checkbox randomly "collapses" into either a checked (true) or unchecked (false) state with a 50% probability.
    - **Definitive Visuals**: Once collapsed, the checkbox stops vibrating and displays a clear, solid checkmark or an empty box, glowing to indicate its finalized state.
- **Quantum Theming**:
    - The settings menu features options with a scientific or sci-fi flavor (e.g., "Enable Dark Matter Simulation", "Entangle Particles", "Sync Multiverse Timelines").
    - The aesthetic uses a dark background with neon cyan and magenta accents, reminiscent of sci-fi interfaces and quantum computing visuals.

### Design Goals
- **Conceptual Playfulness**: To map the abstract concept of Schrodinger's Cat and quantum superposition onto a familiar, mundane UI component.
- **Visual Feedback**: To clearly communicate the transition from a chaotic, uncertain state to a stable, observed state through strong visual cues and animations.
- **Unpredictability**: To introduce an element of chance into a system where users normally expect deterministic control.

### Implementation Plan
- **HTML Structure**:
    - A main `#settings-menu` container.
    - A list of `.setting-row` items, each containing:
        - A `.quantum-checkbox` (a custom `div` or `button` acting as the checkbox).
        - A `.setting-label` with the setting text.
- **CSS Styling**:
    - **Theme**: Dark background (`#0b0f19`), neon text and borders (`#00ffcc`, `#ff00ff`), monospace fonts.
    - **Animations**: An `oscillate` keyframe animation that rapidly changes the opacity, scale, or background color of the checkbox to simulate superposition.
    - **States**: Classes for `.superposition`, `.collapsed-true`, and `.collapsed-false` with distinct visual styles (e.g., glowing effects for collapsed states).
- **JavaScript Logic**:
    - **Class `QuantumCheckbox`**: Manages the state and behavior of each checkbox.
        - `constructor`: Initializes the element, sets the initial state to 'superposition', and attaches event listeners (`mouseenter`, `focus`, `touchstart`).
        - `collapse()`: The core method triggered by "observation". It stops the oscillation animation, randomly selects a boolean value, updates the element's classes, and removes the observation event listeners to lock the state.
    - **Initialization**: Find all `.quantum-checkbox` elements in the DOM and instantiate a `QuantumCheckbox` object for each.
    - Ensure code is structured to support testing in both browser and Node.js environments by conditionally executing DOM logic and exporting classes.

## Recoil-Enabled Buttons [[demo](https://rybla.github.io/interpolnet-2/recoil-enabled-buttons)]

An aggressive UI design that applies simulated physical recoil to all interactive buttons. Clicking a button physically knocks the browser window backward in 3D space, requiring a brief cool-down period before the UI stabilizes enough to be interacted with again.

### Features
- **Physics-Based Recoil**: Clicking any button applies a sudden, powerful 3D transform (`rotateX`, `rotateY`, `translateZ`) to the entire form or UI container, simulating the kickback of a heavy weapon.
- **Cool-Down Period**: After a click, the UI becomes momentarily disabled. The interface slowly "springs" back to its original position over a few seconds, during which inputs cannot be focused or clicked.
- **Dynamic Impact**: Different buttons may have different recoil profiles based on their perceived "weight" or importance (e.g., a "Submit" button kicks harder than a "Cancel" button).
- **Aggressive Aesthetics**: High-contrast, tactical, or brutalist design language. Dark backgrounds with stark, neon accents (like targeting reticles or warning colors).

### Design Goals
- **Visceral Feedback**: Make the simple act of clicking feel incredibly weighty and consequential.
- **Intentional Frustration**: Introduce a playful anti-pattern by making rapid clicking impossible, forcing users to be deliberate with their inputs.
- **3D Immersion**: Utilize CSS 3D transforms to create a strong sense of depth and physical space within the browser window.

### Implementation Plan
- **HTML/CSS Structure**:
  - The `body` or a main wrapper needs a strong `perspective` value.
  - The main form/UI container will hold all the inputs and buttons.
  - Buttons will be styled to look heavy, perhaps with inset shadows or metallic gradients.
- **Animation Mechanics**:
  - The recoil effect will be achieved by instantly applying a `transform` via JavaScript on click.
  - The recovery will be handled by a CSS `transition` with a custom `cubic-bezier` timing function to simulate a spring settling, or via a `requestAnimationFrame` loop for more complex physics.
- **State Management**:
  - A `cooling-down` class will be toggled on the main container. While active, CSS `pointer-events: none` will be applied to prevent further interactions until the UI has settled.

## Currying Visualizer [[demo](https://rybla.github.io/interpolnet-2/currying-visualizer)]

An interactive visualization that animates the process of currying by showing a multi-argument function physically breaking apart into a chain of single-argument function boxes.

### Features
- **Function Visualization**: A central area displays a function as a physical block with "ports" or "slots" for its arguments.
- **Currying Animation**:
    - **Uncurried State**: The function is a single, large block requiring multiple inputs simultaneously.
    - **Curried State**: The single block smoothly splits apart into a sequence of smaller, chained blocks. Each block takes one input and returns the next block in the chain.
- **Interactive Evaluation**:
    - Users can input values into the argument slots.
    - When evaluated, the visualization animates the data flowing through the function.
    - In the curried state, the evaluation can be step-by-step: supplying one argument returns a "partially applied" function block waiting for the next argument.
- **Code Correspondence**:
    - A dynamic code snippet below the visualization updates to show the JavaScript/TypeScript equivalent of the current state (e.g., `add(x, y, z)` vs `add(x)(y)(z)`).
    - When arguments are supplied, the code snippet highlights the corresponding partially applied state.

### Design Goals
- **Demystify Currying**: Transform an abstract functional programming concept into a concrete, mechanical process.
- **Visual Clarity**: Use clear shapes and animations to illustrate the difference between a multi-arity function and a sequence of unary functions.
- **Engaging Aesthetics**: Employ a clean, modern design with satisfying "snap" and "break" animations for the function blocks.

### Implementation Plan
- **HTML Structure**:
    - A main container for the visualization stage.
    - A control panel with "Curry/Uncurry" toggle, "Evaluate" button, and reset.
    - A code display area.
- **Styling (CSS)**:
    - Use CSS Flexbox to layout the function blocks.
    - Implement CSS transitions for the splitting and joining animations. The "uncurried" block will visually appear as a single unit, which then separates into individual blocks connected by arrows or pipes.
    - Define a distinct color palette (e.g., warm oranges/yellows for function blocks, cool blues for data).
- **Interactive Logic (JavaScript)**:
    - Manage the state (`isCurried`, `arguments`, `evaluationStep`).
    - Render the function blocks dynamically based on the state.
    - Animate the transition between uncurried and curried states using CSS classes.
    - Implement the evaluation logic: flow values into the blocks, animate the calculation, and output the result.
    - Update the code snippet based on the current state and provided arguments.

## Event Loop Visualizer [[demo](https://rybla.github.io/interpolnet-2/event-loop-visualizer)]

The Event Loop Visualizer demo illustrates the inner workings of the JavaScript event loop through a physical, animated metaphor.

### Features
*   **Central Execution Stack:** A visually distinct area representing the call stack.
*   **Physical Queues:** Separate queues for the Task Queue (Macrotasks), Microtask Queue, and Web APIs.
*   **Animated Transfers:** Tasks visually move from their respective queues onto the execution stack.
*   **Control Panel:** Buttons to add different types of tasks (Synchronous code, `setTimeout`, `Promise`, etc.) to the system.
*   **Speed Control:** A slider to adjust the speed of the visualization for easier comprehension.

### Design Goals
*   **Clarity over Complexity:** Abstract away unnecessary details to focus on the core flow of tasks between queues and the stack.
*   **Engaging Metaphor:** Use a physical, factory-like aesthetic (conveyor belts, distinct bins) to make abstract concepts concrete.
*   **Distinct Color Scheme:** Use a unique palette (e.g., neon accents against a dark theme) to differentiate the stack, microtasks, and macrotasks.
*   **Responsive:** Ensure the layout adapts gracefully to different screen sizes, perhaps stacking the queues vertically on mobile.

### Implementation Plan
1.  **HTML Structure:** Create containers for the Execution Stack, Web API area, Task Queue, Microtask Queue, and a control panel for user input.
2.  **CSS Styling:** Apply a consistent, vibrant color scheme. Use CSS Grid/Flexbox for layout. Define CSS animations or transitions for moving task elements.
3.  **JavaScript Logic:**
    *   Maintain an internal state for the stack and queues.
    *   Implement an `EventLoopManager` class that ticks at a set interval (controlled by the speed slider).
    *   During each tick, logic will decide the next action:
        *   If the stack is not empty, process the top item (animate it out).
        *   If the stack is empty, check the Microtask Queue. If not empty, move an item to the stack.
        *   If both stack and Microtask Queue are empty, check the Task Queue. If not empty, move an item to the stack.
    *   Handle user inputs to push new task representations into the appropriate queues/Web API area (simulating delay for `setTimeout`).
    *   Synchronize the logical state with DOM updates (creating, moving, and removing DOM elements representing tasks).

## Heap Fragmentation Visualizer [[demo](https://rybla.github.io/interpolnet-2/heap-fragmentation-visualizer)]

The Heap Fragmentation Visualizer is a web demonstration illustrating the concept of memory fragmentation. Users can drag irregularly sized memory blocks into a visual contiguous memory array. As blocks are allocated and later freed, gaps are created. The demonstration specifically visualizes how an allocation can fail even if the *total* free memory is sufficient, because the *contiguous* free memory is insufficient due to fragmentation.

**Features:**
* **Block Palette**: Draggable memory blocks of varying sizes (e.g., 2, 3, 5 units).
* **Memory Array Visualizer**: A graphical representation of contiguous memory units.
* **Allocation and Deallocation**: Dragging blocks to the array allocates them; clicking allocated blocks frees them.
* **Statistics Panel**: Real-time display of total free space, maximum contiguous free space, and fragmentation level.
* **Visual Feedback**: Neon, cyberpunk aesthetic with active drag states, successful allocation pulsing, and failure "shake" animations when an allocation request cannot be satisfied.

**Design Goal:**
Provide an intuitive, hands-on analogy for understanding why heap fragmentation causes out-of-memory errors despite having enough raw bytes available. The cyberpunk theme adds a tech-centric atmosphere appropriate for memory management concepts.

**Implementation Outline:**
* **HTML/CSS**: Responsive grid layout with a cyberpunk color scheme (neon cyan, magenta, dark backgrounds). CSS grid for the memory array.
* **JavaScript**: Pointer events for custom drag-and-drop handling. A core state manager tracking an array of memory units (Free vs. Allocated by Block ID). Logic to calculate contiguous free segments and handle allocation failures with CSS class toggling for shake animations.

## Compiler Assembly Line [[demo](https://rybla.github.io/interpolnet-2/compiler-assembly-line)]

An interactive visualization that represents the compilation process as a physical factory assembly line. Source code enters the factory, gets chopped into tokens by the Lexer, assembled into an Abstract Syntax Tree (AST) by the Parser, and finally stamped into machine code instructions by the Code Generator.

### Features
- **Assembly Line Visualization**: A conveyor belt that moves code fragments through three distinct machine stations: Lexer, Parser, and Code Generator.
- **Lexical Analysis (Tokenizer)**: The first machine chops raw text strings into discrete, categorized tokens (keywords, identifiers, operators, literals), represented as color-coded blocks.
- **Syntax Parsing (AST Construction)**: The second machine takes the stream of token blocks and visually snaps them together into a tree structure (Abstract Syntax Tree).
- **Code Generation**: The final machine takes the AST and translates it into a sequence of low-level assembly/machine code instructions.
- **Interactive Code Input**: A text area allowing users to type simple expressions (e.g., `let x = 5 + 3;`) and watch them go through the pipeline.
- **Step-by-Step Execution**: Controls to play, pause, or step through the compilation pipeline one stage at a time.

### Design Goals
- **Educational Demystification**: Break down the complex phases of a compiler into intuitive, physical analogies.
- **Industrial Aesthetic**: Use a factory-themed UI with conveyor belts, gears, mechanical presses, and distinct color-coding for each pipeline stage.
- **Fluid Animation**: Smooth transitions as text becomes tokens, tokens become trees, and trees become machine code.

### Implementation Plan
- **HTML/CSS**: Construct a responsive layout featuring the code editor, the three machine stations (Lexer, Parser, Generator), and the conveyor belt connecting them.
- **Compiler Logic (JavaScript)**:
  - Implement a basic Lexer that uses regex or string scanning to produce an array of token objects.
  - Implement a simple recursive descent Parser to build an AST from the tokens.
  - Implement a basic Code Generator to walk the AST and produce mock assembly instructions.
- **Animation System**: Manage the state of items on the conveyor belt using `requestAnimationFrame` or CSS transitions, transitioning their visual representation as they pass through each machine.

## Promise Flow Visualizer [[demo](https://rybla.github.io/interpolnet-2/promise-flow-visualizer)]

An interactive visualization that maps asynchronous JavaScript promises as branching paths that glow green upon resolution or red upon rejection to trigger downstream clauses.

### Features
- **Promise Graph Visualization**: Displays a flow chart representing a chain of JavaScript Promises, including `then()`, `catch()`, `finally()`, `Promise.all()`, and `Promise.race()`.
- **Interactive State Toggling**: Users can interact with the initial "source" promises to set their future state to either "Resolve" or "Reject".
- **Flow Animation**: Upon clicking "Run", the visualization animates the execution flow.
  - Paths traversed by a resolved promise glow bright green.
  - Paths traversed by a rejected promise glow bright red.
  - Unreached or pending paths remain dim.
- **Node Status Indicators**: Each node in the graph clearly indicates its current state (Pending, Fulfilled, Rejected) and the value or error it holds.
- **Dynamic Code Snippet**: A side panel displays the equivalent JavaScript code for the currently displayed graph, highlighting the active line as the animation progresses.

### Design Goals
- **Demystify Asynchrony**: Provide a concrete, spatial metaphor for the often abstract and confusing concepts of Promise chaining and error propagation.
- **Visual Feedback**: Use strong colors and animations (glowing paths) to clearly distinguish between success and failure paths.
- **Intuitive Interaction**: Allow users to experiment with different success/failure scenarios to see how the downstream flow reacts.

### Implementation Plan
- **HTML Structure**:
  - A main container for the SVG graph.
  - A control panel for interacting with source nodes and triggering the run.
  - A code view panel.
- **CSS Styling**:
  - Dark theme with high-contrast neon colors (green for resolve, red for reject).
  - Use SVG CSS animations (e.g., animating `stroke-dashoffset`) to create the glowing path effect.
- **JavaScript Logic**:
  - Implement a `Graph` data structure to represent the nodes and their connections (edges).
  - Each node represents a Promise-like operation.
  - Implement a simulation engine that traverses the graph based on the user-defined initial states, propagating the resolve/reject signals down the edges.
  - Synchronize the logical traversal with visual SVG animations and code highlighting.

## Visual Lambda Beta Reduction [[demo](https://rybla.github.io/interpolnet-2/visual-lambda-beta-reduction)]

**Visual Lambda Beta Reduction** is an interactive, visual substitution engine for Lambda calculus that animates beta-reductions step-by-step using colored geometric shapes.

### Description & Features
- Represents lambda expressions as physical, colored geometric blocks.
  - Variables are shapes (e.g. circles, squares) distinguished by color.
  - Abstractions (λx.M) are represented as container blocks with an "input slot" matching the bound variable's color/shape.
  - Applications (M N) are represented as two blocks positioned adjacently.
- Users can click on a valid application to trigger a step-by-step beta reduction animation.
- The animation visually demonstrates substitution:
  - The argument block is highlighted.
  - The abstraction's body is scanned for matching bound variables.
  - The argument block gracefully duplicates and flies to replace each matching variable inside the abstraction body.
  - Finally, the abstraction envelope and original argument block fade out, leaving the substituted body.
- Supports nested expressions and basic combinators (e.g., Identity, Mockingbird, Kestrel). Users can select from a dropdown of examples or build simple expressions.
- Includes a "Step" button to manually control the reduction process, alongside "Reset" and "Example" selectors.

### Design Goals
- **Intuitive Understanding:** Make the abstract concepts of lambda calculus and beta reduction concrete and tactile through spatial relationships and consistent color coding.
- **Engaging Animations:** Use fluid transitions (e.g., shapes flying to their substituted positions) to clarify the substitution mechanism.
- **Aesthetic:** A modern, clean look using pastel colors for variables, soft shadows for depth (indicating nesting), and clear typography.

### Implementation Plan
- **Data Structure:** Implement an AST for lambda expressions (Variable, Abstraction, Application).
- **Layout Engine:** Write a function to recursively calculate the visual size and position of each AST node, laying them out from left to right, and grouping abstractions inside rounded rectangles.
- **Rendering:** Use HTML/CSS/JS (with DOM elements or SVG/Canvas) to render the AST based on the layout engine's calculations. CSS transitions will be heavily used.
- **Reduction Logic:** Implement a safe substitution function that tracks the original DOM elements and their destinations.
- **Animation Orchestrator:** Manage the sequence of steps: highlighting the redex, moving clones of the argument to target positions, fading out the abstraction wrapper, and recalculating the final layout.

## Pointer Aliasing [[demo](https://rybla.github.io/interpolnet-2/pointer-aliasing)]

The Pointer Aliasing demo visualizes how multiple pointers in C can point to the same memory location, demonstrating the concept of pointer aliasing.

Features:
- A central memory cell representing a block of memory holding an integer value (e.g., `int target = 42;`).
- Multiple floating pointer blocks (e.g., `*ptr1`, `*ptr2`, `*ptr3`) that visually point to the central memory cell.
- Each pointer block has an input field allowing the user to modify the value of the memory cell it points to.
- When a value is updated through a pointer, a visual "data flow" animation travels from the pointer to the central memory cell.
- Once the data reaches the central cell, it updates its value, and active CSS pulse animations trigger on both the central cell and all other aliasing pointers to emphasize that they all observe the change.
- A dark, code-editor-style theme using monospace fonts (like Fira Code or Consolas) and neon accent colors to evoke a low-level programming aesthetic.

Design Goals:
- Provide a clear, intuitive visual metaphor for pointer aliasing, a concept that often confuses beginner C programmers.
- Use passive animations (like gentle floating of the pointer blocks) to make the demo feel alive and interactive.
- Use active animations (like pulsing and data flow) to provide immediate, satisfying feedback when the user interacts with the pointers.
- Ensure the layout is responsive and mobile-friendly, adapting the arrangement of the pointers and the central cell for smaller screens.

Implementation Plan:
- **HTML**: Create a container for the demo, a central `.memory-cell` div, and multiple `.pointer-block` divs. SVG lines or CSS borders will be used to draw the connections between the pointers and the central cell.
- **CSS**: Apply a dark theme with syntax-highlighting-inspired colors. Define keyframe animations for the floating effect (`passive-float`), the update pulse (`active-pulse`), and the data flow visual.
- **JavaScript**: Manage the state of the central memory cell and the pointers. Attach event listeners to the input fields in the pointer blocks. When an input changes, update the central state, trigger the data flow animation, and subsequently update the DOM values and trigger pulse animations on all affected elements.

## Finite State Machine Generator [[demo](https://rybla.github.io/interpolnet-2/fsm-generator)]

This demo provides a visual canvas where users can intuitively draw finite state machines (FSMs) by creating circles (states) and connecting them with arrows (transitions). As the user interacts with the canvas to design the FSM, the application dynamically generates and updates the corresponding C/C++ style `switch-case` code in real-time.

### Features
- **Interactive Canvas**: Add, move, and connect states using mouse/touch interactions.
- **Dynamic Code Generation**: Automatically generates a structured `switch-case` skeleton based on the current graph topology.
- **State & Transition Naming**: Double-click on states or transitions to rename them or set transition conditions.
- **Theme**: A clean, "blueprint" aesthetic with a dark blue background, grid pattern, and bright cyan/orange accents for contrast.
- **Animations**: Smooth transitions when adding nodes, hover effects on interactable elements, and pulsating active states.
- **Responsive Design**: Adapts to mobile and desktop layouts, ensuring the canvas and code view are optimally sized.

### Implementation Plan
- **HTML**: A split-screen layout (or stacked on mobile) with an SVG element for the canvas and a `<pre><code>` block for the generated code.
- **CSS**: Custom properties for the blueprint theme, grid background using CSS gradients, and flexbox/grid for layout.
- **JavaScript**:
  - Maintain a state object containing nodes and edges.
  - Handle pointer events (down, move, up) on the SVG to support dragging nodes and drawing edges.
  - Compute edge paths dynamically, including self-loops and curved paths for bidirectional transitions.
  - Generate the code string by iterating through nodes and their outgoing edges, formatting it as standard `switch` statements.

## Java Bytecode VM [[demo](https://rybla.github.io/interpolnet-2/java-bytecode-vm)]

The Java Bytecode VM demo is an interactive, visual simulation of a stack-based Java Virtual Machine. Users can step through compiled Java bytecode instructions and observe real-time updates to the operand stack, local variables array, and program counter. It demystifies the low-level execution model of Java programs.

### Features
- **Bytecode Execution**: A simulated JVM that executes a subset of common Java bytecode instructions, including `bipush`, `iload`, `istore`, `iadd`, `isub`, `imul`, `goto`, `ifeq`, `if_icmpeq`, `iinc`, and `return`.
- **Interactive Stepping**: Users can execute the bytecode step-by-step or run it automatically, with controls to adjust execution speed.
- **Visual State Tracking**:
    - **Operand Stack**: A dynamic visual stack where values are explicitly pushed and popped. Animations highlight operations like adding two values.
    - **Local Variables**: A numbered array showing the current state of local variables. Highlighting indicates when a variable is read or written.
    - **Instruction List**: A scrollable view of the loaded bytecode program. The active instruction (Program Counter) is prominently highlighted.
- **Code Presets**: Includes multiple pre-compiled bytecode examples representing common Java concepts:
    - Basic Arithmetic
    - Factorial (using a loop)
    - Fibonacci sequence
    - Conditionals (if/else)
- **Active and Passive Animations**:
    - Passive: Gentle glowing or pulsing on the active instruction to draw focus.
    - Active: Smooth translations when values move between the stack, local variables, and the instruction itself. Values pushed to the stack animate from the source (instruction or local variable).

### Design Goals
- **Educational Clarity**: Make the abstract concept of a stack machine concrete and easy to follow.
- **Visual Causality**: Ensure every change in state (stack, variables) is visually linked to the specific instruction that caused it through animation.
- **Developer Aesthetic**: A UI inspired by IDE debuggers, utilizing a clean, dark-mode color scheme (e.g., `#1e1e1e` background, syntax-highlighted code colors like `#d4d4d4` for text, `#569cd6` for keywords, `#b5cea8` for numbers).
- **Responsive Layout**: Arrange the three main components (Instructions, Stack, Locals) in a flexible grid that adapts to different screen sizes.

### Implementation Plan
- **HTML Structure**:
    - A main grid layout containing three primary panels:
        1. **Code Panel**: Displays the list of instructions.
        2. **Stack Panel**: A vertical flex container for the operand stack.
        3. **Locals Panel**: A horizontal or vertical list for local variables.
    - A control bar with Play, Pause, Step, and Reset buttons, plus a dropdown for selecting presets.
- **CSS Styling**:
    - Define a custom dark theme using CSS variables.
    - Use Flexbox for internal panel layouts and CSS Grid for the overall page structure.
    - Define CSS transitions for stack item insertion/removal (e.g., scaling and translating) and for highlighting active rows.
- **JavaScript Logic**:
    - **VM State**: Create a class or object managing the `programCounter`, `operandStack` (array), `localVariables` (array), and `instructions` (array of parsed objects).
    - **Instruction Set**: Implement functions for each supported opcode that mutate the VM state.
    - **Execution Loop**: A `setInterval` or `requestAnimationFrame` loop to handle automated execution.
    - **DOM Updates**: Functions to re-render or animate DOM elements based on VM state changes. Crucially, when an instruction executes, orchestrate CSS animations to visually represent the data flow (e.g., creating a temporary DOM element that flies from a local variable slot to the top of the stack during an `iload`).

## Hoisting Visualizer [[demo](https://rybla.github.io/interpolnet-2/hoisting-visualizer)]

[Demo Link](/public/hoisting-visualizer/)

### Description
The Hoisting Visualizer is an interactive educational tool that physically animates the concept of variable and function hoisting in JavaScript. By visually lifting declarations (like `var` and `function`) to the top of an execution context container before executing the remaining code, users can intuitively grasp how the JavaScript engine parses and prepares code during the creation phase.

### Features
*   **Execution Context Container:** A designated physical area representing the current scope or execution context.
*   **Draggable/Editable Code Lines:** Users can input or modify lines of JavaScript code within the container.
*   **Physical Lifting Animation:** When the "Simulate Engine Parsing" button is clicked, declarations (`var`, `function`) physically detach from their initial positions and smoothly animate upwards to the top of the container.
*   **Code Execution Simulation:** After hoisting, the code can be stepped through, showing how assignments and initializations remain in place.
*   **Distinct Styling:** Uses a unique "Blueprint" color scheme (deep blues, whites, and bright yellow/orange highlights for declarations) with a monospace typography appropriate for code.

### Design Goals
*   **Clarify a Complex Concept:** Hoisting is often confusing for beginners. This demo aims to make the invisible parsing step of the JS engine visible and tangible.
*   **Interactive Learning:** By allowing users to write their own code or use presets, they can actively test their understanding.
*   **Engaging Animations:** The use of smooth, physical transitions (e.g., using CSS transforms and transitions) will make the "lifting" action satisfying and memorable.

### Implementation Plan
1.  **HTML Structure:** Create a main container for the Execution Context. Inside, have a list of code lines (either div-based or list-based) that can hold code snippets. Include controls (buttons) for triggering the animations.
2.  **CSS Styling:** Apply the "Blueprint" theme. Use absolute positioning or CSS Grid/Flexbox with `transform` properties to allow elements to move freely during the animation phase. Ensure it is responsive.
3.  **JavaScript Logic:**
    *   Parse the input code to identify declarations (`var`, `function`).
    *   Calculate the initial and target positions of the elements using `getBoundingClientRect()`.
    *   Apply CSS `transform` (translations) to physically move the declaration elements to the top of the container while pushing other lines down.
    *   Handle the timing and sequencing of the animations.

## Rust Ownership Visualizer [[demo](https://rybla.github.io/interpolnet-2/rust-ownership-visualizer)]

This demo visualizes the core concepts of Rust's ownership model by representing variables as physical tokens that can be dragged and dropped between different function scopes. It enforces the rule that each token can only be held by one function scope at a time.

### Features
- Drag and drop tokens representing variables between distinct, labeled function scope containers (e.g., `main()`, `process_data()`, `calculate_sum()`).
- Only one scope can own a specific variable token at any given time.
- Attempting to use a variable that has been moved visually demonstrates a compilation error or disabled state.
- Cloning a variable creates a distinct visual copy of the token.
- Scopes highlight when a token is dragged over them to indicate they can accept ownership.
- Distinct color coding for tokens and scopes using a Rust-inspired theme (dark background, orange accents).
- Animations when a token is moved or when ownership is transferred.

### Design Goal
To provide an intuitive, physical metaphor for Rust's abstract ownership rules, helping learners grasp the concept of moving values instead of simply copying them, and understanding why a value is no longer accessible in its original scope after a move.

### Implementation Plan
- Use HTML `div` elements to represent the function scopes and the variable tokens.
- Implement drag-and-drop functionality using the Pointer Events API (`pointerdown`, `pointermove`, `pointerup`) or the HTML5 Drag and Drop API to move tokens.
- State management in JavaScript to track the current owner of each token and prevent multiple ownership.
- Use CSS transitions for smooth movement of tokens and pulsing animations to indicate active/draggable tokens.
- Implement responsive layout using CSS Flexbox or Grid to ensure the demo is usable on mobile devices.

## Pattern Matching Sieve [[demo](https://rybla.github.io/interpolnet-2/pattern-matching-sieve)]

An interactive visualization showing how functional pattern matching acts as a visual sieve filtering data structures through specific shape templates.

### Features
- **Data Spawner**: Users can generate complex data structures represented as nested blocks or colorful shapes with properties like \`type\`, \`color\`, and \`value\`.
- **Vertical Sieve Pipeline**: A cascading series of "sieves" representing pattern matching clauses (e.g., \`case {type: "circle", color: "red"}\`).
- **Visual Filtering Animation**:
  - Data blocks fall from the top of the screen.
  - When a block hits a sieve, it pauses.
  - The sieve visually expands or scans the block, checking its properties against the sieve's pattern template.
  - If it matches, the block glows green and is pulled horizontally into a "Match Bin", and its destructured variables (e.g., \`value\`) are displayed.
  - If it does not match, the block glows red, the sieve visually rejects it (a slight bounce), and it falls to the next sieve.
- **Catch-All Basin**: A final \`case _\` sieve at the bottom that catches anything that falls through the previous templates.

### Design Goals
- **Intuitive "Filtering" Metaphor**: Translate the abstract concept of structural pattern matching into a literal physical process of sieving or sorting.
- **Destructuring Visibility**: Clearly show how variables are bound when a match succeeds by extracting those pieces of the data block visually.
- **Engaging Aesthetics**: A satisfying, semi-physical animation style with clean, rounded UI elements and a dark theme with vibrant neon accents (e.g., cyan, magenta, and bright yellow).

### Implementation Plan
- **HTML Structure**:
  - A left column serving as the vertical "drop zone" for the data blocks.
  - Sieve elements stacked vertically within the drop zone.
  - Output bins extending to the right of each sieve.
  - A control panel at the top to spawn random data shapes.
- **Styling (CSS)**:
  - Use CSS Flexbox/Grid for layout.
  - Define custom animations and transitions for falling (\`transform: translateY\`), matching (glowing and horizontal translation), and rejecting (shaking).
- **Interactive Logic (JavaScript)**:
  - Define a set of patterns objects to represent the sieves.
  - Create a \`DataBlock\` class to manage the state and DOM element of each falling piece of data.
  - Implement a recursive \`isMatch(data, pattern)\` function.
  - Use a simple animation loop (\`requestAnimationFrame\` or CSS transition event listeners) to move blocks between sieves and trigger the match evaluation logic at each step.

## Interactive Bitwise Logic Gates [[demo](https://rybla.github.io/interpolnet-2/interactive-bitwise-logic-gates)]

This demo is an interactive tool for visualizing 32-bit binary logic gates and operations.

### Features
- Two 32-bit switch arrays representing binary inputs (Input A and Input B).
- Real-time computation and display of bitwise operations: XOR, AND, OR.
- Real-time computation and display of bit-shift operations: Left Shift (<<), Right Shift (>>), and Unsigned Right Shift (>>>).
- Each output is visualized using 32-bit switch arrays, which are read-only but dynamically update to reflect the result.
- A decimal representation is shown alongside each 32-bit binary representation.
- Fully responsive design, adapting cleanly to mobile and desktop screens.
- Interactive and satisfying toggle animations.

### Design Goals
- Provide an intuitive visual representation of how individual bits are affected by bitwise operations.
- Make the abstract concept of bitwise math tangible and interactive.
- Use distinct neon-themed colors to differentiate between operations (e.g., green for AND, blue for OR, purple for XOR) for a tech-oriented visual style.

### Implementation Plan
- **HTML**: Layout the structural elements, including rows of bits for Input A, Input B, and various operation outputs.
- **CSS**: Apply a dark tech theme. Utilize CSS Grid/Flexbox for laying out 32 bits into manageable chunks (e.g., 4 bytes of 8 bits). Add hover and toggle animations to the switches.
- **JavaScript**: Maintain state for Input A and Input B as 32-bit unsigned integers. Add event listeners to the input switches to toggle bits and update state. On state change, recalculate outputs for AND, OR, XOR, <<, >>, >>> and update the DOM efficiently.

## Tail Call Optimization Visualizer [[demo](https://rybla.github.io/interpolnet-2/tail-call-optimization-visualizer)]

The "Tail Call Optimization Visualizer" demo contrasts standard recursion against tail-call optimization. It visualizes call stacks for both approaches by evaluating a simple recursive function (like factorial).

**Features:**
- Side-by-side visualization of call stacks for standard recursion and tail-call optimized recursion.
- Visual representation of stack frames being pushed, updated, and popped using smooth CSS transitions and animations.
- Code snippets for both implementations highlighting the differences in structure.
- Adjustable input parameters to see how the stack depth changes.

**Design Goals:**
- Provide an intuitive understanding of why TCO is more memory-efficient by showing how it reuses a single stack frame instead of stacking them endlessly.
- Use distinct colors for standard and TCO to emphasize the contrast.
- Ensure the layout is responsive, stacking the side-by-side view vertically on mobile devices.

**Implementation Plan:**
- **HTML:** Two main columns for the two recursive approaches, each containing a code snippet view and a visual call stack container. A control panel at the top for setting inputs and starting the simulation.
- **CSS:** Flexbox for layout. Define CSS keyframes for stack frame operations. Frames in standard recursion will stack visually using `flex-direction: column-reverse`. Use a distinct, unique, and consistent color scheme.
- **JavaScript:** State machine to simulate the step-by-step execution of both recursive functions. Manipulate the DOM to add/remove elements for standard recursion, and update the text content of a single element for TCO recursion. Use `setInterval` for the animation loop.

## IEEE 754 Visualizer [[demo](https://rybla.github.io/interpolnet-2/ieee-754-visualizer)]

Deconstruct the IEEE 754 floating-point standard visually by allowing users to toggle sign, exponent, and mantissa bits to see the decimal value.

### Features
- A 32-bit switch array representing a single-precision floating-point number.
- Three distinct colored sections: 1 Sign bit, 8 Exponent bits, and 23 Mantissa (fraction) bits.
- Real-time updates: toggling any bit instantly recalculates and displays the decimal representation.
- Detailed breakdown of the formula: $(-1)^{	ext{sign}} 	imes (1 + 	ext{mantissa}) 	imes 2^{	ext{exponent} - 127}$ with live values plugged in.
- Shows special cases such as Zero, Infinity, and NaN automatically based on bit patterns.

### Design Goals
- Make the complex IEEE 754 standard intuitive by breaking down its components visually.
- Use a distinct color palette (e.g., red for sign, green for exponent, blue for mantissa) to clearly differentiate the three parts of the floating point number.
- Ensure the interface is responsive and works well on both mobile and desktop screens.

### Implementation Plan
- **HTML:** Create a container with 32 toggleable bit buttons, grouped visually into Sign (1), Exponent (8), and Mantissa (23). Below the bits, create an area to display the formula breakdown and the final decimal value.
- **CSS:** Use flexbox or grid for layout, ensuring bits wrap cleanly on smaller screens. Apply distinct colors to the three sections. Add hover effects and transition animations for bit toggles.
- **JavaScript:** Add event listeners to each bit. Maintain an array of 32 booleans (or 0s/1s). On change, calculate the sign, exponent, and mantissa values according to the IEEE 754 standard. Update the UI with the detailed breakdown and final result, taking care to handle special cases like Infinity and NaN.

## Virtual Method Table Visualizer [[demo](https://rybla.github.io/interpolnet-2/virtual-method-table-visualizer)]


The Virtual Method Table Visualizer is an educational tool designed to demystify how object-oriented languages implement dynamic dispatch. It interactively illustrates how a virtual method call is routed to the correct subclass implementation using a Virtual Method Table (vtable).

### Features
- **Class Definitions & VTables**: Displays a Base Class and multiple Subclasses, each with its corresponding Virtual Method Table.
- **Instance Creation**: Users can instantiate objects of different classes (e.g., Base, Subclass A, Subclass B).
- **Interactive Dispatch**: Clicking a method (like `speak()`) on an instantiated object triggers an animated sequence tracing the execution path.
- **Visual Tracing**: An animated highlight physically traces the flow from the object instance -> to its implicit vtable pointer -> to the class's vtable -> to the specific method implementation.
- **Execution Log**: A console-like execution log captures and displays the final output of the method call.

### Design Goals
- **Clarity**: Simplify complex internal compiler mechanisms into an accessible, physical metaphor.
- **Feedback**: Use distinct visual animations (like tracing paths or glowing boxes) to make the implicit behavior of dynamic dispatch explicit and visible.
- **Aesthetics**: Employ a consistent, technical color scheme (e.g., monospace fonts, distinct colors for different classes) with responsive design to ensure it is mobile-friendly.

### Implementation Plan
- **HTML**: Structure the UI with distinct sections for Class Blueprints/VTables, Object Instances, and an Execution Log.
- **CSS**: Apply styling using a unique color palette for each class type to clearly differentiate them. Use CSS transitions and animations to visualize the dispatch flow.
- **JavaScript**: Manage the state of object instances. Handle user interactions (instantiation, method calls). Calculate positions of DOM elements using `getBoundingClientRect()` to dynamically draw or animate SVG arrows/highlights tracing the dispatch sequence from the object to the method implementation.

## Lisp Macro Visualizer [[demo](https://rybla.github.io/interpolnet-2/lisp-macro-visualizer)]

A Lisp macro visualizer that demonstrates the powerful concept of macros as programs that write programs. It visually expands concise, high-level syntax into deeper parenthetical abstract syntax trees (ASTs) before the evaluation phase.

### Features
- **Interactive Macro Expansion**: Users can click on macro calls within a displayed Lisp form to see them physically expand, step-by-step, into their underlying macro-expanded code.
- **Visual AST Representation**: Lisp forms are rendered not just as text, but as nested structural blocks. As a macro expands, new sub-trees animate into existence, pushing sibling nodes aside using smooth CSS transitions.
- **Preset Macro Examples**: Includes classic Lisp macros like `(unless condition body...)` expanding to `(if (not condition) (progn body...))`, or `(let ((x 1)) x)` expanding to `((lambda (x) x) 1)`.
- **Retro Lisp Machine Aesthetic**: The UI employs a vintage terminal color scheme with monospaced typography, subtle scanlines, and glowing S-expressions to evoke a classic Lisp development environment.

### Implementation Plan
- **HTML**: Create a responsive layout with a header, a sidebar/row for preset selection, and a large main visualization canvas.
- **CSS**: Apply retro styling with neon greens/ambers on dark backgrounds, using Flexbox to structure the nested S-expression blocks, and CSS transitions to animate the expansion of nodes.
- **JavaScript**:
  - Implement a simple Lisp parser to convert strings into a nested AST representation.
  - Create a rendering function that translates the AST into nested DOM elements.
  - Implement a macro expander function that knows how to transform specific AST patterns.
  - Handle click events on macro nodes to trigger expansion, calculate the new AST, and animate the DOM replacement smoothly.

## Dependency Injection Plumbing [[demo](https://rybla.github.io/interpolnet-2/dependency-injection-plumbing)]

**Dependency Injection Plumbing** is an interactive visual metaphor for software dependency injection. It maps software dependencies as an interconnected plumbing network where an **Injector** module explicitly routes required service "fluids" (dependencies) into **Components**.

### Design Goals
- Visually demonstrate the concept of Dependency Injection (DI) without code.
- Provide an industrial, plumbing-themed UI with pipes, valves, and distinct glowing fluids representing different services (e.g., Database, Logger, Authentication).
- Clear feedback on when a component is "ready" (all dependencies satisfied) vs "waiting".

### Features
- **The Injector**: A central reservoir that holds different colored fluids (services).
- **Valves**: Interactive elements that can be clicked to open or close the flow of specific fluids to different parts of the network.
- **Pipes**: SVG-based pipes that visually transport the fluids from the injector to the components. The fluids animate flowing through the pipes when valves are opened.
- **Components**: Endpoints that require specific fluids to function. They have indicator lights that turn green and animate when all required dependencies are met.

### Implementation Outline
- **HTML**: Uses an SVG layer for drawing complex pipe paths, overlaid with HTML elements for the Injector, Components, and interactive valve controls.
- **CSS**: Industrial dark theme. CSS animations (specifically `stroke-dashoffset`) are used on SVG paths to simulate the flow of fluid through pipes. Components have states (inactive/active) visualized with glowing box-shadows.
- **JavaScript**: Manages the state of valves, updates the SVG paths to show active fluid flow based on valve states, and checks if components have received all their required dependencies to toggle their active state.

## Fourier Epicycles Simulator [[demo](https://rybla.github.io/interpolnet-2/fourier-epicycles-simulator)]

This demo allows users to draw an arbitrary continuous wave and watch it decompose into a mechanical chain of rotating Fourier series epicycles. The canvas gives users the freedom to trace any single contiguous curve. Once drawing stops, the application uses the Discrete Fourier Transform (DFT) to analyze the complex path, finding a sum of complex exponentials representing the frequencies, amplitudes, and phases of the drawn line. Then, an animated mechanical chain of rotating epicycles—each circle representing one term from the Fourier series—starts tracing out the drawing in real time. The demo features unique, distinct typography, a visually appealing dark theme for mathematical representations, interactive UI buttons for clearing the screen, and mobile-friendly touch support. It provides an intuitive, interactive way to understand the underlying principles of the Fourier transform and its capability to represent complex periodic functions through simple circular motions.

## Conic Sections Visualizer [[demo](https://rybla.github.io/interpolnet-2/conic-sections-visualizer)]

An interactive 3D visualization of conic sections, allowing users to adjust a slicing plane to intersect a double cone, dynamically generating circles, ellipses, parabolas, and hyperbolas in real-time.

### Features
- **3D Interactive Scene**: A double cone rendered in a 3D environment that can be rotated and zoomed.
- **Adjustable Slicing Plane**: Users can manipulate the angle and offset of a slicing plane to intersect the cone.
- **Real-time Intersection Visualization**: The intersection of the plane and the cone is visually highlighted, revealing the shape of the conic section.
- **Dynamic Identification**: The system automatically calculates and displays the current type of conic section (Circle, Ellipse, Parabola, or Hyperbola) based on the plane's angle and offset.
- **UI Controls**: Intuitive sliders for precisely adjusting the plane's angle and vertical offset.

### Design Goals
- **Educational Value**: Provide a clear, visual intuition for how different conic sections are derived from a single geometric structure.
- **Visual Clarity**: Use translucent materials and contrasting colors to ensure the intersection is always visible and distinct.
- **Aesthetics**: A dark, sci-fi inspired theme with neon accents (e.g., bright orange and pink against a deep violet background).
- **Responsive Interface**: A mobile-friendly control panel overlaid on the 3D canvas.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering.
- **Scene Setup**:
    - Two cones joined at their apexes. Use `MeshPhysicalMaterial` with transparency, transmission, and roughness to create a glass-like appearance.
    - A plane mesh representing the slicing plane, styled with a distinct, semi-transparent color.
- **Clipping Logic**:
    - Use Three.js `clippingPlanes` feature. Apply a clipping plane to the cone's material so that the portion of the cone 'above' the slicing plane is visually removed, revealing the cross-section.
    - Alternatively, or additionally, trace the intersection curve mathematically and render it using a `Line` or `TubeGeometry`.
- **Math and Identification**:
    - Calculate the intersection type based on the angle of the slicing plane relative to the cone's generating angle.
    - Update the UI label dynamically.
- **Controls**:
    - OrbitControls for camera manipulation.
    - HTML input sliders linked to the plane's rotation and position properties.

## Linear Transformation Visualizer [[demo](https://rybla.github.io/interpolnet-2/linear-transformation-visualizer)]

A 2D web-based visualization tool that illustrates how 2x2 matrices act as linear transformations on a coordinate space. The demo displays a standard Cartesian grid with an original set of basis vectors ($i$ and $j$), alongside a superimposed, interactive transformed grid.

### Features
- **Matrix Input Matrix:** A dynamic 2x2 input grid where users can manipulate the numeric values of the transformation matrix.
- **Real-time Rendering:** The canvas updates smoothly in real-time as users modify the input matrix or drag the basis vectors on the grid directly.
- **Basis Vector Manipulation:** Users can click and drag the transformed basis vectors on the visual grid, which automatically calculates and updates the corresponding 2x2 matrix values.
- **Visual Grid Overlay:** Shows the original, undeformed grid in a faint color behind the brightly-colored transformed grid to provide clear visual context of the shear, rotation, and scaling effects.
- **Preset Transformations:** Quick-action buttons to apply common linear transformations (e.g., Identity, Shear, 90-degree Rotation, Reflection, Projection).
- **Responsive Design:** Ensures that both the matrix controls and the canvas scale properly on desktop and mobile displays.

### Implementation Details
- **HTML/CSS:** Responsive layout utilizing CSS Grid/Flexbox to position a control panel (with the 2x2 matrix inputs and preset buttons) alongside a main `<canvas>` area. A clean, dark-themed UI is implemented with glowing neon accents.
- **Canvas API (JavaScript):** Custom vanilla JS rendering loop that calculates the linear transformation for grid lines and vectors. It iteratively draws vertical and horizontal grid lines using `ctx.transform(a, b, c, d, e, f)` or manual vector math for flexibility.
- **Interactivity:** Uses mouse/touch event listeners on the canvas to detect dragging of the basis vector endpoints. It calculates the closest vector, updates the respective matrix values, and immediately triggers a re-render.
- **Animations:** Employs CSS transitions for UI elements and potentially `requestAnimationFrame` for smooth interpolation when preset transformations are triggered.

## Ulam Spiral Visualizer [[demo](https://rybla.github.io/interpolnet-2/ulam-spiral-visualizer)]

An interactive Ulam spiral that zooms out indefinitely allowing users to highlight quadratic equations to search for diagonal prime clustering.

### Features
- **Infinite Zooming Canvas**: A continuous, performant 2D canvas that generates the Ulam spiral outward dynamically as the user zooms out.
- **Prime Number Highlighting**: Distinct visualization for prime numbers versus composite numbers.
- **Quadratic Equation Overlay**: A control panel allowing users to input values for $a$, $b$, and $c$ in the quadratic equation $an^2 + bn + c$.
- **Diagonal Highlighting**: The numbers generated by the user's quadratic equation are highlighted on the spiral, revealing the visual clustering of primes along diagonal lines.
- **Dynamic Calculation**: Primes and equation outputs are calculated in real-time as the spiral grows.

### Design Goals
- **Mathematical Exploration**: Create an intuitive visual tool for observing prime number distribution and exploring Euler's prime-generating polynomials.
- **Performance**: Maintain a smooth 60fps framerate while rendering tens of thousands of numbers and computing primes dynamically.
- **Aesthetic**: Deep space/mathematical theme. A dark background with glowing neon accents (e.g., cyan for primes, bright magenta for highlighted equation outputs).

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` element and a floating control panel overlay for equation inputs and zoom controls.
- **CSS Styling**: A dark mode palette, translucent control panels with blur effects, and custom range sliders for zoom.
- **JavaScript Core**:
    - An optimized `isPrime(n)` function with memoization.
    - A coordinate mapping algorithm to calculate the $(x, y)$ canvas position for any integer $n$ in the spiral.
    - A rendering loop using `requestAnimationFrame` that handles zooming, panning, and drawing the spiral points efficiently.
    - Dynamic calculation of the sequence $f(n) = an^2 + bn + c$ and matching these results against the visible spiral numbers.

## Taylor Series Sine Wave Approximation [[demo](https://rybla.github.io/interpolnet-2/taylor-series-sine-wave)]

An interactive visualization showing how a sine wave is approximated by drawing the sequential addition of Taylor polynomial terms that slowly wrap around the true curve.

### Features
- **Sine Wave Baseline**: A visual baseline showing the true sine wave for reference.
- **Taylor Polynomial Terms**: Animates the sequential addition of Taylor series terms ($x - \frac{x^3}{3!} + \frac{x^5}{5!} - \dots$).
- **Interactive Term Slider**: Users can control the number of terms added to the approximation, up to a large number of terms to see how the approximation improves.
- **Real-time Drawing**: As terms are added, the approximated curve visually "wraps" around the true sine wave curve, expanding outwards from the center ($x=0$).
- **Visual Distinction**: Distinct colors for the true sine wave (e.g., dim gray) and the approximation (e.g., bright neon cyan).
- **Mathematical Formula**: A dynamic mathematical equation showing the current terms being added.

### Design Goals
- **Educational Value**: Provide an intuitive visual representation of how Taylor series build up a complex function from simple polynomial terms.
- **Smooth Animation**: Ensure fluid transitions and drawing animations as terms are added or removed.
- **Aesthetics**: A dark, mathematical theme with glowing neon colors for high contrast and modern look.

### Implementation Plan
- **HTML**: A responsive container holding a full-screen canvas for the visualization, an overlay for the mathematical formula, and a control panel with a slider for the number of terms.
- **CSS**: Dark background, neon colors for the drawn lines, and styled sliders.
- **JavaScript (Canvas API)**:
    - Real-time rendering loop using `requestAnimationFrame`.
    - Mathematical functions to calculate the true sine wave and the Taylor polynomial approximation.
    - Animation logic to smoothly transition between different numbers of terms, perhaps interpolating the newest term's contribution for a smooth "wrapping" effect.
    - Responsive handling to update canvas size and scaling on window resize.

## Mandelbrot Julia Mapping [[demo](https://rybla.github.io/interpolnet-2/mandelbrot-julia-mapping)]

**Mandelbrot Julia Mapping**
This demo features an interactive Mandelbrot set where clicking any coordinate instantly maps and animates the corresponding Julia set iteration on a secondary canvas.

**Features:**
- An interactive primary canvas displaying the Mandelbrot set.
- Hover effects indicating interactivity on the Mandelbrot set.
- A secondary canvas displaying the corresponding Julia set for the clicked point `c = a + bi`.
- Visual indicators (crosshairs/pins) on the Mandelbrot set showing the selected coordinate.
- Smooth transitions when generating a new Julia set.
- Side-by-side layout on desktop, stacking vertically on mobile.

**Design Goals:**
- Provide a responsive layout displaying both fractals clearly.
- Employ a distinct typography and color scheme (e.g., deep purples, neon cyan accents) suitable for the "Interpolnet 2" aesthetic.
- Ensure passive animations (such as a slight ambient glow) and active animations (like ripple effects on click) guide the user.

**Implementation Plan:**
- `index.html`: Layout with headers, instructions, and two `<canvas>` elements within a responsive grid/flex container.
- `style.css`: Apply custom variables, responsive media queries, and animations (pulse, glow).
- `script.js`: Implement the main mathematical loop to generate fractals. The Mandelbrot set will be pre-rendered. An event listener on the Mandelbrot canvas calculates the normalized `c` coordinate, updates the UI (drawing a marker), and triggers a recalculation/redraw on the Julia canvas.

## Poincaré Disk Simulator [[demo](https://rybla.github.io/interpolnet-2/poincare-disk-simulator)]

The Poincaré Disk Simulator is an interactive visualization of hyperbolic geometry using the Poincaré disk model. In this model, the entire hyperbolic plane is mapped to the interior of a unit disk. Geodesics (straight lines in hyperbolic space) are represented as circular arcs that meet the boundary of the disk at right angles, or straight line segments that pass through the center of the disk.

This demo allows users to intuitively explore non-Euclidean geometry. By clicking and dragging inside the disk, users can draw geodesics and visually see how "straight lines" curve towards the boundary, illustrating the concept that distances grow exponentially closer to the edge, making the boundary infinitely far away.

**Features:**
- **Interactive Drawing:** Click and drag to define the start and end points of a hyperbolic straight line.
- **Dynamic Arc Calculation:** The system computes the unique circular arc orthogonal to the boundary disk that passes through the user's two points.
- **Neon Synthwave Aesthetic:** Uses a distinct, glowing neon color scheme with dark backgrounds.
- **Visual Feedback:** Animations and glowing effects indicate interactions and line creation.

**Implementation Outline:**
- **HTML/CSS:** A responsive, mobile-friendly interface featuring a central full-screen canvas and a floating UI panel with instructions and a "Clear" button.
- **JavaScript (Math & Interaction):**
  - Implement point inversion in a circle to find the center and radius of the geodesic arcs.
  - Handle coordinates translation from screen space to the normalized unit disk.
  - Calculate the intersection points and appropriate angles to draw the arc using the HTML5 Canvas `arc` method.
  - Manage interaction states (start dragging, moving, releasing) and store persistent lines.

## Conjugate Partitions [[demo](https://rybla.github.io/interpolnet-2/conjugate-partitions)]

The Conjugate Partitions demo provides an interactive visualization of integer partitions using Ferrers diagrams. The user can input a sequence of integers representing the partition. The demo renders this partition as a grid of distinct, interactable circles (dots).

The core feature is the rotation/conjugation animation. When the user clicks the "Conjugate" button, the entire Ferrers diagram smoothly animates its transformation into its conjugate partition. This is mathematically equivalent to reflecting the diagram across its main diagonal.

### Design Goals:
- **Responsive & Mobile-Friendly:** The layout consists of a floating panel for input controls and a central, expansive canvas area for the Ferrers diagram. The diagram scales appropriately to fit the screen.
- **Visual Clarity:** Dots use bright, cohesive colors and smooth CSS transitions. Passive hover animations indicate interactivity.
- **Mathematical Precision:** The grid reflection visually proves theorems relating to conjugate partitions by demonstrating the one-to-one correspondence between a partition and its conjugate.

### Implementation Outline:
- **HTML/CSS:** A responsive flexbox layout. A control panel with a text input for the partition sequence (comma-separated integers) and a trigger button.
- **JavaScript:**
  - Parse the input string into an array of integers, validating that it forms a valid partition (non-increasing sequence of positive integers).
  - Dynamically generate DOM elements (dots) for each block in the Ferrers diagram.
  - Calculate grid positions (x, y) for each dot based on its index.
  - Implement the conjugation logic by calculating the transposed positions (y, x).
  - Apply CSS `transform` translations to animate the dots from their original to their conjugated positions.

## Derivative Visualizer [[demo](https://rybla.github.io/interpolnet-2/derivative-visualizer)]

The Derivative Visualizer is an interactive educational tool that illustrates the concept of a derivative in calculus. It allows users to physically interact with a secant line by sliding its anchor points closer together along a curve, demonstrating how it smoothly transitions into the tangent line as the distance between the points approaches zero.

### Features
- **Interactive Curve**: A beautifully rendered mathematical curve (e.g., $f(x) = \sin(x)$ or a cubic function).
- **Draggable Anchor Points**: Two distinct points on the curve that define a secant line. Users can drag these points along the path of the function.
- **Dynamic Secant Line**: A line passing through the two anchor points that updates in real-time as the points are moved.
- **Tangent Transition**: When the two points are dragged sufficiently close to each other, they visually "snap" together. The secant line smoothly transforms into the tangent line, and its color/style changes to indicate the transition.
- **Math Readout Overlay**: A clear, heads-up display showing the current coordinates of the points, the calculated slope of the secant/tangent line, and the equation of the line.

### Design Goals
- **Demystify Calculus**: Transform the abstract definition of a derivative ($f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$) into a concrete, physical interaction.
- **Visual Feedback**: Use color and animation to clearly distinguish between the secant line (two points, average rate of change) and the tangent line (one point, instantaneous rate of change).
- **Aesthetics**: A clean, modern "dark mode" mathematical theme with high-contrast neon accents (e.g., cyan for the curve, magenta for the secant line, bright yellow for the tangent).

### Implementation Plan
- **HTML/CSS**: A full-screen container for an HTML5 `<canvas>` element. An overlay `<div>` positioned absolutely to display the math readout. CSS will define the dark theme and handle simple animations like pulsing text when the tangent is formed.
- **JavaScript (Canvas API)**:
    - **Coordinate System**: Implement a function to map mathematical coordinates to canvas pixel coordinates, inverting the Y-axis.
    - **Rendering**: Draw the axes, the function curve, the two anchor points, and the connecting line.
    - **Interaction**: Implement pointer event listeners (`pointerdown`, `pointermove`, `pointerup`) to handle dragging the points. Constrain the dragging so the points always stay on the mathematical curve.
    - **Logic**: Calculate the slope $m = \frac{y_2 - y_1}{x_2 - x_1}$. If $|x_2 - x_1| < \epsilon$, snap the points together, calculate the true derivative $f'(x_1)$, and draw the tangent line.
    - **Readout**: Update the DOM elements in the overlay with the real-time slope calculations.

## Eigenvector Visualizer [[demo](https://rybla.github.io/interpolnet-2/eigenvector-visualizer)]

A grid transformation tool that highlights the specific eigenvectors that scale but do not rotate during a linear matrix transformation.

### Features
- **Interactive Grid Overlay**: A Cartesian grid showing unit vectors alongside standard vectors which are morphed dynamically via 2x2 matrix transformations.
- **Customizable Matrix Entries**: Sliders or input fields for each cell of the 2x2 matrix to explore different types of linear transformations like shear, scale, rotation, etc.
- **Real-Time Eigenvector Highlighting**: Eigenvectors computed from the matrix are distinctly drawn. When the transformation occurs, these specific vectors dynamically show that they only scale, keeping their original directional span.
- **Animations**: Fluid passive animations emphasizing interactive components, and active animations showing the before-and-after states of the transformation mapping.

### Design Goals
- **Math Visualization**: Demystify the concept of eigenvectors, giving a physical, geometric intuition rather than just a mathematical definition.
- **Engaging UI**: Provide robust controls, clear tooltips, and responsive feedback within a distinct and immersive visual theme to encourage exploration.
- **Mobile Friendly Layout**: Ensure the matrix controls and visualization canvas scale seamlessly to small screens.

### Implementation Plan
- **HTML**: Include a `<canvas>` element for the 2D visualizer alongside a set of controls for the matrix entries (`a, b, c, d`).
- **CSS**: Adopt Interpolnet 2's theme standard, ensuring typography and colors reflect interactive states with active transitions. Implement flexbox/grid layouts ensuring responsiveness.
- **JavaScript**:
  - Implement rendering logic on the HTML5 Canvas to handle inverse-Y transformations so cartesian logic holds.
  - Implement a 2x2 matrix transformation engine.
  - Implement the mathematical logic to compute eigenvectors and eigenvalues of the real 2x2 matrix and trace these highlighted lines on the canvas overlay.

## Four Color Theorem Visualizer [[demo](https://rybla.github.io/interpolnet-2/four-color-theorem-visualizer)]

An interactive graph drawing sandbox that visualizes the Four Color Theorem by automatically coloring nodes such that no two adjacent nodes share the same color.

### Features
- **Sandbox Drawing**: Users can click to place nodes on a blank canvas and drag between nodes to create edges, building complex graphs.
- **Automatic 4-Coloring**: Every time a node or edge is added, a backtracking algorithm runs in real-time to re-color the entire graph using only four distinct colors.
- **Visual Feedback**: Nodes smoothly transition their colors, and active edge creation is shown visually as users drag the mouse.
- **Conflict Avoidance**: The algorithm ensures that no two connected nodes share the same color, visually proving the theorem on the user's custom graph.

### Design Goals
- **Intuitive Interaction**: Make graph creation as simple as clicking and dragging.
- **Real-time Visualization**: Provide immediate, satisfying visual feedback of the coloring algorithm at work.
- **Distinct Palette**: Use a high-contrast, distinct 4-color palette that stands out against a dark background.

### Implementation Plan
- **HTML**: Provide a full-screen `<canvas>` element for the sandbox.
- **CSS**: Ensure a responsive, dark-themed background with crisp, mobile-friendly styles for the canvas.
- **JavaScript**:
  - Implement a graph data structure to track nodes and edges.
  - Implement pointer events to handle node creation (click on empty space) and edge creation (drag from one node to another).
  - Implement a backtracking 4-coloring algorithm that runs efficiently on small to medium graphs upon any topology change.
  - Create a rendering loop that draws the edges as lines and the nodes as colored circles.

## Collatz Conjecture Tree [[demo](https://rybla.github.io/interpolnet-2/collatz-conjecture-tree)]

The Collatz Conjecture Tree is an interactive visualization of the Collatz sequence, mapped as a branching organic tree structure that always funnels down to the root node of 1.

### Features
- **Dynamic Tree Visualization**: The Collatz sequence for user-input numbers is calculated and added to the tree in real-time.
- **Organic Layout**: The tree is rendered with a hierarchical, organic layout, using Bezier curves to connect nodes to simulate branches and roots. The structure funnels downwards to the root node of 1.
- **Animation**: When a new number is added, its path is animated as it falls down the tree to the root.
- **Pan and Zoom**: Users can explore the infinitely expanding tree structure using click-and-drag panning and scroll-to-zoom functionalities on the canvas.
- **Interactive UI**: An overlay provides a text input to easily add new starting numbers to the tree.

### Design Goals
- **Bioluminescent Aesthetic**: A dark background with glowing nodes and paths to represent the organic, almost cellular structure of the Collatz sequences merging together.
- **Mathematical Exploration**: Allow users to visualize how wildly different starting numbers eventually converge into the same familiar branches before hitting the 4-2-1 loop.
- **Performance**: Use HTML5 Canvas to handle the rendering of potentially thousands of nodes efficiently.

### Implementation Plan
- **HTML**: A full-screen `<canvas>` for rendering and an absolute-positioned floating UI panel for input.
- **CSS**: A dark theme with glowing accents for buttons and inputs.
- **JavaScript Core**:
    - Manage a graph data structure representing the tree. The root is 1. Edges are directed from `n` to `n/2` (if `n` is even) or `3n+1` (if `n` is odd).
    - Implement the Collatz logic to generate the path for a given number.
    - Implement a tree layout algorithm to assign `(x, y)` coordinates to each node. `y` is based on the distance from the root (1). `x` is based on preventing overlap among siblings and branches.
    - Render the nodes and edges using `requestAnimationFrame`. Draw lines as smooth bezier curves.
    - Handle pan and zoom transformations using the Canvas API's `translate` and `scale`.

## Homeomorphism: Mug to Donut [[demo](https://rybla.github.io/interpolnet-2/homeomorphism-mug-to-donut)]

Animate the continuous topological deformation of a coffee mug morphing smoothly into a donut to explain homeomorphism.

### Features
- **3D Morphing Animation**: A 3D coffee mug smoothly and continuously deforms into a donut (torus) and back again.
- **Interactive Control**: Users can manually control the morphing progress using a slider, allowing them to inspect intermediate topological states.
- **Auto-Play**: A button to toggle continuous, automatic animation back and forth between the two shapes.
- **Wireframe Mode**: An option to toggle wireframe rendering to better visualize the vertices and polygons as they transform.

### Design Goals
- **Intuitive Topology**: Visually demonstrate the mathematical concept that a mug and a donut are topologically equivalent (homeomorphic) because they both have exactly one hole.
- **Engaging Visuals**: Provide a smooth, visually appealing 3D animation using distinct, consistent colors and a clean layout.
- **Educational Interactivity**: Let users pause and scrub the animation to understand how the continuous deformation happens without cutting or gluing the surface.

### Implementation Plan
- **HTML**: A container for the 3D canvas and a UI panel overlay with controls (slider, play/pause toggle, wireframe toggle).
- **CSS**: Styling for the layout, adopting the consistent dark theme and typography of Interpolnet 2, ensuring responsive and mobile-friendly controls.
- **JavaScript (Three.js)**:
  - Setup a Three.js scene, camera, renderer, and lights.
  - Generate the geometry for both the mug and the donut. A common approach is to use a high-resolution base geometry (like a cylinder or a custom shape) and define morph targets, or manually interpolate vertices in the render loop based on a `progress` value (0 to 1).
  - Use `requestAnimationFrame` for the render loop to smoothly animate the morphing when auto-play is enabled.
  - Wire up the UI controls to adjust the `progress` value, toggle wireframe materials, and play/pause the animation.

## Complex Number Multiplication Visualizer [[demo](https://rybla.github.io/interpolnet-2/complex-multiplication-visualizer)]

An interactive complex plane where multiplying two complex numbers visually demonstrates the scaling of magnitude and the addition of angles. Users can intuitively grasp complex multiplication through interactive manipulation of vectors in real-time.

### Features
- **Interactive Complex Plane**: A central canvas where users can see the origin (0,0), unit circle, and axes representing the Real and Imaginary parts of complex numbers.
- **Draggable Vectors**: Two distinct vectors, $z_1$ and $z_2$, can be dragged around the complex plane to dynamically update their values.
- **Real-time Multiplication Visualization**: A third vector, $z_3 = z_1 \times z_2$, is calculated and drawn in real-time.
- **Angle Addition Animation**: Visual arcs from the positive real axis show the angles of $z_1$ ($\theta_1$) and $z_2$ ($\theta_2$), and a larger arc shows how the angle of $z_3$ is exactly $\theta_1 + \theta_2$.
- **Magnitude Scaling**: The lengths (magnitudes) of the vectors are highlighted. An expanding/contracting indicator clarifies that the magnitude of $z_3$ is the product of the magnitudes of $z_1$ and $z_2$.
- **Control Panel**: A side or floating UI panel allowing precise manual entry of the real and imaginary components of $z_1$ and $z_2$, alongside a readout of their polar forms ($re^{i\theta}$) and the final calculation.

### Design Goals
- **Educational Clarity**: Make the abstract concept of complex multiplication geometric and intuitive. Emphasize that complex multiplication is a rotation *and* a scaling.
- **Engaging Aesthetics**: Employ a clean, dark-themed "blueprint" or "neon" aesthetic (e.g., deep blue background with bright cyan, magenta, and yellow vectors) to make the math look striking.
- **Responsiveness**: Ensure the visualizer works seamlessly on both desktop and mobile devices, utilizing touch events for dragging points.

### Implementation Plan
- **HTML Layout**: A full-screen `<canvas>` with an absolutely positioned UI panel overlay containing inputs and readouts.
- **CSS**: Adopt a cohesive dark theme with specific accent colors for $z_1$, $z_2$, and $z_3$. Utilize CSS Grid or Flexbox for the control panel.
- **JavaScript**:
  - Implement a `Complex` class to handle math operations (addition, multiplication, polar conversion).
  - Use HTML5 Canvas API for rendering the grid, axes, unit circle, vectors (arrows), and angle arcs.
  - Implement a `requestAnimationFrame` render loop to smoothly update the canvas.
  - Handle pointer events (`pointerdown`, `pointermove`, `pointerup`) to allow dragging the endpoints of vectors $z_1$ and $z_2$.
  - Provide helper functions to map between logical mathematical coordinates and canvas screen coordinates (accounting for inverted Y-axis).

## Riemann Zeta Function Topography [[demo](https://rybla.github.io/interpolnet-2/riemann-zeta-topography)]

The Riemann Zeta Function Topography demo visualizes the complex-valued Riemann Zeta function mapped onto a 3D landscape to explore the topography of the critical line where non-trivial zeros reside.

### Features
- **3D Interactive Landscape**: A continuous 3D surface representing the magnitude of the Riemann Zeta function on the complex plane. Users can rotate, zoom, and pan around the surface to explore peaks and valleys.
- **The Critical Line ($Re(s) = 0.5$)**: A visually distinct path highlighting the critical line where all non-trivial zeros are conjectured to exist according to the Riemann Hypothesis.
- **Zero Indicators**: Distinct markers placed exactly at the locations of the first few non-trivial zeros (e.g., $s = 0.5 + 14.13i, 0.5 + 21.02i$).
- **Color Mapping**: The height (magnitude) and phase (argument) of the zeta function are mapped to vivid colors, showing the intricate topography of the function's poles and zeros.
- **Controls**: An interactive UI panel with a slider to adjust the range of the imaginary axis ($Im(s)$), allowing exploration of zeros higher up the critical line, and a toggle to switch between magnitude and phase coloring.

### Design Goals
- **Mathematical Topography**: Help users intuitively grasp the complex behavior of the Riemann Zeta function by turning it into an interactive terrain.
- **Educational Impact**: Highlight the critical line and clearly demonstrate the location of non-trivial zeros in an engaging, visual way.
- **Responsive 3D Graphics**: Use Three.js to render a performant, smooth, and interactive 3D surface that works seamlessly on both desktop and mobile devices.

### Implementation Plan
- **HTML Layout**: A full-screen container for the 3D canvas and an absolutely positioned UI panel for controls.
- **CSS**: Adopt Interpolnet 2's dark theme, with a floating glassmorphic control panel and consistent typography.
- **JavaScript**:
  - Implement a mathematical approximation of the Riemann Zeta function for the complex plane (e.g., using Dirichlet eta function or similar methods for regions near the critical strip).
  - Use Three.js to create a `ParametricGeometry` or dynamically updated `PlaneGeometry` where the z-coordinate (height) corresponds to the magnitude $|\zeta(s)|$.
  - Implement custom shaders (`ShaderMaterial`) to color the surface based on magnitude and phase, ensuring visual clarity.
  - Implement `OrbitControls` for user interaction.
  - Add specific 3D markers (spheres or pins) at known non-trivial zero coordinates.
  - Wire up UI controls to update the mathematical domain and re-render the surface dynamically.

## Rule 30 Cellular Automaton [[demo](https://rybla.github.io/interpolnet-2/rule-30-cellular-automaton)]

An interactive one-dimensional cellular automaton explorer focusing on Rule 30 to show how simple binary rules generate chaotic fractal triangles.

### Features
- **Interactive Canvas**: A rendering of the 1D cellular automaton over time (down the Y axis).
- **Rule Selection**: An input to change the rule number (0-255), defaulting to 30.
- **Playback Controls**: Play, Pause, Step, and Reset buttons to control the automaton's evolution.
- **Dynamic Scrolling**: As the automaton generates more generations than can fit on the canvas, it scrolls upwards.

### Design Goals
- **Educational**: Visually demonstrate how a simple 1D binary cellular automaton like Rule 30 can create complex, pseudo-random, and chaotic patterns from a single active cell.
- **Aesthetic**: Use a distinct, unique, and consistent color scheme with passive and active animations to make the demo visually appealing.
- **Responsive**: Ensure the layout works well on both mobile and desktop screens.

### Implementation Plan
- **HTML**: A `<canvas>` element for rendering the automaton. A control panel overlay or section for UI inputs (Play, Pause, Step, Reset, Rule Number).
- **CSS**: A specific color scheme, flexbox for layout, and responsive design for different screen sizes. Animations for buttons.
- **JavaScript**:
    - **State**: A 1D array representing the current generation of cells.
    - **Logic**: Calculate the next generation using the selected rule (e.g., Rule 30) by evaluating the left, center, and right neighbors of each cell.
    - **Rendering**: Draw the current generation to the canvas. Shift the canvas up (or redraw) when reaching the bottom to simulate scrolling.
    - **Loop**: `requestAnimationFrame` for continuous playback when "Play" is active.

## Sine Wave Generator [[demo](https://rybla.github.io/interpolnet-2/sine-wave-generator)]

This demo visually links the uniform circular motion of a point on a rotating wheel directly to the generation of a simple harmonic sine wave on an adjacent scrolling graph. It provides an intuitive, interactive way to understand the mathematical relationship between circles and sine waves.

### Design Goals
- Provide a clear, real-time visualization showing how the y-coordinate of a rotating point traces out a sine wave over time.
- Offer interactive controls (e.g., a rotation speed slider) allowing the user to experiment with the frequency of the wave.
- Ensure the layout places the wheel and the wave graph side-by-side (or top-and-bottom on mobile) with an explicit horizontal dashed line connecting the rotating point to the leading edge of the wave to emphasize the linkage.
- Employ a clean, distinct color scheme (e.g., dark slate background with vibrant cyan and magenta accents) to highlight key elements.
- Use passive animations and subtle glowing effects to make the simulation engaging.

### Implementation Outline
1. **HTML Structure**:
   - A main `<canvas>` element for rendering the visualization.
   - An overlay UI containing a title, brief description, and an `<input type="range">` slider to control the rotation speed (frequency).
2. **CSS Styling**:
   - A dark, modern theme (`#111827` background) with sans-serif typography.
   - Flexbox or Grid layout to ensure the canvas is responsive and fills the available viewport while maintaining a good aspect ratio.
   - Styling for the range input to match the demo's color scheme.
3. **JavaScript Logic**:
   - Use `requestAnimationFrame` for a smooth, continuous render loop.
   - **State**: Maintain an `angle` for the point on the circle, a `speed` variable controlled by the slider, and an array `waveData` storing historical y-values.
   - **Update**: Increment the `angle` by `speed` each frame. Calculate the current y-coordinate `y = amplitude * Math.sin(angle)`. Shift the `waveData` array to simulate a scrolling graph, pushing the new `y` to the front.
   - **Render**:
     - Clear the canvas.
     - Draw the circle (wheel) on the left side of the canvas, including axes and the rotating point.
     - Draw the sine wave on the right side of the canvas by iterating through `waveData`.
     - Draw a distinct connecting line (e.g., dashed, bright colored) from the current y-coordinate of the point on the circle to the start of the sine wave to clearly illustrate the relationship.

## Cubic Bezier Curve Interpolation [[demo](https://rybla.github.io/interpolnet-2/cubic-bezier-interpolation)]

An interactive visualization revealing the recursive linear interpolations that construct a cubic Bézier curve by dynamically showing the moving scaffolding lines.

### Features
- **Interactive Control Points**: Users can click and drag the four control points defining the cubic Bézier curve anywhere on the canvas.
- **Dynamic Scaffolding Animation**: The demo animates the `t` parameter from 0 to 1, showing how the intermediate points ($t$ between the first 4 points, then $t$ between those 3 points, then $t$ between those 2 points) form the scaffolding lines.
- **Trace the Curve**: The final point traces the path of the cubic Bézier curve, visually proving the relationship between the linear interpolations and the final curve shape.
- **Playback Controls**: A timeline slider allows users to scrub through the `t` parameter manually, or use a Play/Pause button for automatic animation.
- **Visual Hierarchy**: Uses distinct colors for the initial lines, first-level scaffolding, second-level scaffolding, and the final curve to clearly illustrate the recursive reduction.

### Design Goals
- **Mathematical Intuition**: Make the abstract De Casteljau's algorithm concrete and visually understandable.
- **Clarity and Separation**: Use color coding and varying line thicknesses to differentiate the layers of interpolation.
- **Responsive and Fluid**: Ensure the interactions and animations remain smooth at 60fps on all devices.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` element for the visualization and a floating UI control panel for the playback slider and buttons.
- **CSS Styling**: A dark theme to provide high contrast for the brightly colored scaffolding lines and curve.
- **JavaScript State**:
  - Manage the positions of the 4 control points `P0, P1, P2, P3`.
  - Handle pointer events for dragging points.
  - Track the current interpolation parameter `t` (0 to 1).
- **JavaScript Rendering**:
  - Implement a recursive or iterative `lerp` function to compute the intermediate points for a given `t`.
  - Draw the control polygon (connecting the 4 points).
  - Draw the subsequent generations of scaffolding lines with different colors.
  - Draw the final cubic Bézier curve up to the current `t`, or simply draw the full curve faintly in the background while the animated point traces it.

## Conway Game of Life [[demo](https://rybla.github.io/interpolnet-2/conway-game-of-life)]

An interactive implementation of Conway's Game of Life utilizing WebGL for rendering and simulation on a massive scale.

### Features
- **Massive Canvas**: A large-scale simulation grid using WebGL to handle millions of cells efficiently.
- **Interactive Stamping**: Users can stamp specific patterns, such as Gliders and Gosper Glider Guns, directly onto the canvas by clicking.
- **Real-time Evolution**: The cellular automaton rules are evaluated using custom shaders to ensure high performance and real-time evolution.

### Design Goals
- **Performance**: Leverage WebGL to offload the heavy computational lifting of Conway's Game of Life to the GPU, enabling a massive simulation size that would be impossible with traditional CPU-based JavaScript arrays.
- **Interactivity**: Provide an intuitive and immediate way for users to interact with the complex system by seeding it with known, interesting patterns.
- **Visual Scale**: Create a visually striking representation of chaotic emergence from simple rules.

### Implementation Plan
- **Simulation Shaders**:
  - Implement the Game of Life rules in a fragment shader. It will sample the states of the 8 neighboring cells from a texture representing the current generation.
  - If a cell is alive and has 2 or 3 live neighbors, it stays alive. If it's dead and has 3 live neighbors, it becomes alive. Otherwise, it dies.
- **Ping-Pong Rendering**:
  - Use two framebuffers (textures). In each frame, read from the "current" texture, run the simulation shader, and render the result to the "next" texture. Then, swap the textures.
- **Display Shader**:
  - A simple shader to draw the current simulation texture to the screen canvas.
- **Interaction Logic**:
  - Map mouse coordinates to the simulation grid.
  - Implement a mechanism to inject pre-defined patterns (Glider, Gosper Gun) into the current simulation texture at the clicked location. This can be done by rendering small quads with the pattern data over the current state.

## Vector Cross Product Visualizer [[demo](https://rybla.github.io/interpolnet-2/vector-cross-product-visualizer)]

An interactive 3D educational tool designed to visualize the cross product of two vectors. It provides a real-time, manipulable 3D coordinate system where users can adjust two input vectors and immediately see how their cross product vector and the resulting parallelogram area respond.

### Features
- **Interactive 3D Coordinate System**: A full 3D environment allowing users to pan, zoom, and rotate around the origin to view the vectors from any angle.
- **Draggable Input Vectors**: Users can click and drag the heads of two input vectors, Vector A (e.g., colored blue) and Vector B (e.g., colored red), altering their x, y, and z components dynamically.
- **Real-Time Cross Product Visualization**: As the input vectors are manipulated, the resulting cross product vector (Vector C) is continuously recomputed and displayed (e.g., colored green), illustrating its orthogonal relationship to both input vectors.
- **Area Visualization**: A semi-transparent parallelogram defined by Vector A and Vector B is drawn to visually represent the magnitude (area) of the cross product vector.
- **Dynamic Heads-Up Display**: A floating control panel overlaid on the canvas displays the current components of all vectors, the computed magnitude, and the formula used, updating in real time.
- **Axis Helpers**: Clear, color-coded axes (X, Y, Z) and grid lines provide spatial context.

### Design Goals
- **Geometric Intuition**: Transition the abstract mathematical definition of the cross product into a tangible, geometric intuition, emphasizing the right-hand rule and the area of the spanned parallelogram.
- **Visual Clarity**: Utilize a distinct, unique, and consistent color scheme for each vector to prevent confusion during complex rotations.
- **Responsiveness**: Ensure the 3D controls and UI overlays function smoothly on both desktop and mobile devices.

### Implementation Plan
- **HTML/CSS**: Provide a full-screen container for the 3D visualization. Create a responsive, floating UI overlay panel with a distinct aesthetic to display numerical values and provide instructions.
- **JavaScript (Three.js)**:
  - Setup a Three.js scene, camera, renderer, and lighting.
  - Create arrow helpers or custom geometry for Vector A, Vector B, and Vector C (Cross Product).
  - Implement interaction logic using `Raycaster` and a draggable plane to allow users to click and drag the heads of Vector A and Vector B.
  - In the render loop, continuously calculate `C = A.cross(B)` and update the visual representation of Vector C.
  - Generate and update a `PlaneGeometry` or custom polygon geometry defined by points `(0,0,0)`, `A`, `A+B`, and `B` to visualize the area parallelogram.
  - Update the DOM elements in the UI overlay with the latest vector components and calculated area.

## Galton Board Normal Distribution [[demo](https://rybla.github.io/interpolnet-2/galton-board)]

An interactive 2D physics simulation that visually calculates binomial coefficients by routing falling physical balls through a Galton board peg maze to form a normal distribution.

### Features
- **Dynamic Physics Engine**: Continuously drops physical balls that bounce and collide off a triangular grid of static pegs and gather into bins at the bottom.
- **Normal Distribution Curve**: As balls accumulate in the bins over time, they naturally form a visual bell curve (Pascal's triangle / binomial coefficients).
- **Interactive Controls**: Users can pause/resume the flow of balls, adjust the drop rate, and reset the simulation.
- **Real-Time Statistics**: A heads-up display showing the total number of balls dropped and an overlay on each bin showing its current count.
- **Aesthetics**: A dark, vibrant theme with distinct colors for pegs, balls, and bins, alongside fluid physics animations.

### Design Goals
- **Statistical Intuition**: Demonstrate the Central Limit Theorem and binomial distribution visually using physical laws.
- **Mesmerizing Simulation**: Create an engaging and satisfying animation of balls cascading through the maze.
- **Responsive Layout**: Ensure the canvas and UI controls scale effectively on both desktop and mobile devices.

### Implementation Plan
- **HTML/CSS**: A full-screen `<canvas>` container with a floating UI control panel overlay for inputs and a statistics display.
- **Physics System (JavaScript)**:
  - Implement a simple fixed-timestep 2D physics loop managing particle positions, velocities, and gravity.
  - Handle circle-circle collisions (balls vs. pegs, and balls vs. balls in the bins) and circle-line collisions (balls vs. bin walls and floor).
- **Galton Board Generator**:
  - Dynamically generate a triangular grid array of peg positions.
  - Generate the vertical bin dividers below the last row of pegs.
- **Rendering**:
  - Use the Canvas API (`ctx.arc`, `ctx.fillRect`) to efficiently draw the elements in the render loop.

## Modular Arithmetic Clock [[demo](https://rybla.github.io/interpolnet-2/modular-arithmetic-clock)]

An interactive visualization that represents modular arithmetic operations (addition and multiplication) as paths drawn on a physical clock face, allowing users to observe continuous patterns and warpings.

### Features
- **Clock Face Visualization**: A circular dial divided into $N$ equal points, representing the modulus space (0 to $N-1$).
- **Operation Selection**: Users can switch between Modulo Addition ($x + A \pmod{N}$) and Modulo Multiplication ($x \times A \pmod{N}$).
- **Factor Control**: A slider allowing the user to select the factor $A$ to add or multiply by. The changes to $A$ are immediately reflected in the drawn lines.
- **Continuous Path Drawing**: Lines are drawn from each point $x$ on the dial to the resulting point of the selected operation.
- **Auto-Play/Animation**: An auto-play mode that slowly increments the factor $A$, animating the continuous warping and creation of new patterns (like cardioids and nephroids in multiplication).
- **Responsive Controls**: A floating or side control panel that dynamically adapts its layout based on the screen size.

### Design Goals
- **Mathematical Intuition**: Make the abstract concepts of modular arithmetic concrete and visual. Show how multiplication forms distinct geometric patterns.
- **Aesthetics**: Follow the Interpolnet 2 style guidelines with a distinct, consistent color scheme, utilizing bold colors on a dark background.
- **Fluid Animation**: Ensure the lines drawn across the circle smoothly transition and redraw efficiently at 60fps as parameters change.

### Implementation Plan
- **HTML Structure**: A main `<canvas>` element to render the clock face and lines, and a UI container for the controls (sliders, buttons, and radio inputs).
- **CSS Styling**: Apply a dark, modern theme. The UI should utilize flexbox/grid to remain responsive and mobile-friendly, with smooth passive animations on hoverable elements.
- **JavaScript Core**:
    - Manage the state: Modulus ($N$), Factor ($A$), current Operation, and an `isAutoPlaying` flag.
    - Implement a render loop using `requestAnimationFrame`. If auto-playing, increment $A$ slightly each frame.
    - The drawing function will calculate the position of $N$ points around the circumference of a circle.
    - For each point $x \in [0, N-1]$, calculate the target $y$ based on the operation and draw a line from the coordinate of $x$ to the coordinate of $y$. Use color gradients or distinct stroke styles to make the patterns pop.

## Markov Chain Frog [[demo](https://rybla.github.io/interpolnet-2/markov-chain-frog)]

**Description**:
An interactive visualization of a Markov Chain, where states are represented as lilypads in a pond, and the transitions are weighted probability arrows between them. A frog character jumps between these lilypads over time, effectively traversing the Markov Chain and visually demonstrating state transitions based on defined probabilities.

**Features**:
- Interactive Canvas: A full-screen pond environment with distinctly colored lilypads (states).
- Weighted Arrows: Directed arrows indicating possible transitions from one lilypad to another, with text labels showing the probability of each transition.
- Frog Animation: A visual representation of the current state, smoothly animating (jumping) along the transition arrows to the next state.
- Controls: A bottom UI panel allows the user to pause/play the animation and adjust the speed of the simulation.
- Real-time Updates: As the frog jumps, the "active" path is highlighted.

**Design Goals**:
- Consistent color scheme and typography in line with guidelines.
- Responsive design ensuring the canvas and controls are mobile-friendly.
- Passive animations (e.g., slight hovering or rippling of lilypads) and active animations (the jumping frog).

**Implementation Plan**:
1. Implement the HTML structure containing the canvas and a simple UI overlay.
2. Style the layout with CSS to ensure full screen, responsive UI, and distinct colors.
3. Write JavaScript to:
   - Define a state machine representing the Markov Chain (nodes and edges with probabilities).
   - Render the lilypads and arrows dynamically on the canvas.
   - Implement the `requestAnimationFrame` loop for the frog's jumping animation.
   - Handle play/pause logic and speed control.

## Sweep-line Voronoi [[demo](https://rybla.github.io/interpolnet-2/sweep-line-voronoi)]

### Description
This demo visualizes the generation of a Voronoi diagram using a sweep-line algorithm approach. Users can interactively place seed points on a canvas, and a moving horizontal line sweeps across the screen, calculating and rendering the corresponding Voronoi cell boundaries in real-time. This provides an intuitive and visual understanding of how spatial partitioning works.

### Features
- Interactive canvas to place, drag, or remove seed points.
- Real-time visualization of the sweep-line moving across the canvas.
- Dynamic rendering of Voronoi cell boundaries as the sweep-line progresses.
- Controls to pause, play, reset, and adjust the speed of the sweep-line.
- Responsive design adapting to different screen sizes.

### Design Goals
- **Educational:** Clearly illustrate the process of Voronoi diagram generation.
- **Interactive:** Encourage users to experiment with different point placements.
- **Aesthetic:** Use a clean, consistent color scheme with distinct visual cues for points, the sweep-line, and cell boundaries. Ensure smooth animations.

### Implementation Plan
- **HTML (`index.html`):** Structure with an HTML5 `<canvas>`, a control panel for buttons (Play/Pause, Reset, Clear Points), and a brief instruction section.
- **CSS (`style.css`):** Apply a distinct color palette. Ensure the canvas scales correctly and controls are styled with clear interactive feedback (hover/active states). Ensure mobile responsiveness.
- **JavaScript (`script.js`):** Implement the core logic. Handle mouse/touch events for adding points. Implement an animation loop (`requestAnimationFrame`) to update the sweep-line position and calculate Voronoi edges based on the current points. Handle resizing and re-rendering.

## Minimax Saddle Point [[demo](https://rybla.github.io/interpolnet-2/minimax-saddle-point)]

### Description
An interactive 3D visualization of a multivariable calculus surface where a rolling ball naturally settles into the minimax saddle point due to gravity. The user can interact with the surface to drop the ball from different locations and watch its trajectory as it accelerates down the steepest slopes, demonstrating gradient descent and saddle point dynamics.

### Features
- **3D Surface**: A visually distinct 3D representation of a multivariable function containing a saddle point (e.g., $f(x,y) = x^2 - y^2$), rendered using Three.js.
- **Physics Simulation**: A real-time physics simulation of a ball rolling on the surface, affected by gravity, surface normals (gradients), and friction/damping.
- **Interactive Controls**: Users can drag and drop the ball anywhere on the surface to start a new trajectory. Sliders are provided to adjust physical parameters such as gravity and friction.
- **Visual Aids**: The ball leaves a trailing path to visualize its trajectory over time, highlighting how it oscillates and settles at the minimax point.
- **Responsive Layout**: A clean, responsive UI overlay displaying controls and the current coordinates and velocity of the ball.

### Design Goals
- **Mathematical Intuition**: Provide an intuitive, physical understanding of saddle points, gradients, and optimization in multivariable calculus.
- **Visual Clarity**: Use a unique and consistent color scheme (e.g., a wireframe or heat-mapped surface) to make the 3D geometry easily understandable.
- **Performance**: Ensure smooth 60fps rendering and physics calculations.

### Implementation Plan
- **HTML/CSS**: Set up a full-screen canvas container for the 3D scene and a floating, responsive UI overlay for the controls and statistics.
- **JavaScript (Three.js & Physics)**:
  - Initialize a Three.js scene with a camera, lights, and orbit controls for exploring the surface.
  - Generate the surface geometry using a custom function. Use a wireframe or custom shader material to enhance depth perception.
  - Implement a physics loop to update the ball's position:
    - Calculate the gradient (slope) of the surface at the ball's current $(x, y)$ coordinates.
    - Apply acceleration proportional to the gradient to simulate gravity pulling the ball downhill.
    - Apply a damping force (friction) proportional to velocity to ensure the ball eventually comes to rest at the saddle point $(0, 0, 0)$.
    - Update the ball's $(x, y, z)$ position, ensuring $z$ exactly matches the surface height $f(x, y)$.
  - Implement a trailing line or points using `THREE.Line` or `THREE.Points` to visualize the trajectory.
  - Add raycasting to allow the user to click on the surface to place the ball at a new starting location.

## Fibonacci Golden Spiral [[demo](https://rybla.github.io/interpolnet-2/fibonacci-golden-spiral)]

### Description
An interactive visualization showing the Fibonacci sequence recursively dividing a golden rectangle into smaller squares that perfectly trace the path of a logarithmic spiral. The user can watch the progressive generation of the squares and the connecting spiral arcs, demonstrating the geometric relationship between the Fibonacci numbers and the golden ratio.

### Features
- **Progressive Animation**: Slowly draws the Fibonacci squares one by one, scaling the view or zooming out as larger squares are added to keep the entire structure visible.
- **Golden Spiral**: Simultaneously draws smooth quarter-circle arcs within each square to form a continuous golden spiral.
- **Interactive Controls**: Users can pause/play the animation, adjust the animation speed, and manually step forward or backward through the sequence.
- **Information Display**: Displays the current Fibonacci number and the total number of squares currently drawn.
- **Responsive Canvas**: The canvas auto-resizes to fit the screen, maintaining the correct aspect ratio for the golden rectangle.

### Design Goals
- **Mathematical Clarity**: Clearly illustrate the construction of the golden spiral using Fibonacci squares.
- **Visual Elegance**: Use smooth animations, distinct colors for the squares' borders, and a prominent, contrasting color for the spiral path to make the mathematical structure visually appealing.
- **Responsiveness**: Ensure the controls and canvas look good on both desktop and mobile devices.

### Implementation Plan
- **HTML/CSS**: Set up a full-screen canvas with a floating, responsive UI overlay for controls and statistics.
- **JavaScript Core Logic**:
  - Maintain state for the current step in the Fibonacci sequence (e.g., $F_n = F_{n-1} + F_{n-2}$).
  - Track the current drawing coordinate, orientation, and scale.
  - Implement a `requestAnimationFrame` loop to handle the progressive drawing and zooming.
- **Rendering**:
  - Use `ctx.strokeRect` or `ctx.fillRect` with varying colors to draw each new Fibonacci square.
  - Use `ctx.arc` to draw the quarter-circle path connecting the opposite corners of the square.
  - Apply `ctx.translate` and `ctx.scale` to keep the growing structure centered and visible within the canvas viewport as it exponentially expands.

## Skewed Galton Board [[demo](https://rybla.github.io/interpolnet-2/skewed-galton-board)]

This demo features an interactive Galton board where users can dynamically skew the probabilities of falling balls at each peg. By adjusting the probability slider, users can observe the resulting distribution of balls at the bottom shift continuously from a standard Normal distribution (when probability is 0.5) to a skewed Poisson distribution. The implementation utilizes an HTML5 Canvas for high-performance rendering of the falling physics balls and the distribution bins, coupled with smooth CSS animations for the UI controls to provide an engaging and intuitive educational experience.

## Huffman Entropy Compressor [[demo](https://rybla.github.io/interpolnet-2/huffman-entropy-compressor)]

This demo provides an interactive educational visualization of data compression using a Huffman coding algorithm. Users can input arbitrary text, and the application dynamically constructs and displays a Huffman tree based on the character frequencies in the text. The demo calculates and visualizes the entropy of the text and provides real-time statistics on the original size, compressed size, and compression ratio. It features an HTML5 canvas to render the branching Huffman tree and interactive tables mapping each character to its variable-length binary code, demonstrating how more frequent characters receive shorter codes.

## Slope Field Ink Drops [[demo](https://rybla.github.io/interpolnet-2/slope-field-ink-drops)]

The "Slope Field Ink Drops" demo provides an interactive 2D visualization on an HTML5 canvas where users explore a dynamic slope field representing a differential equation. Users can click and drag to drop virtual ink drops that flow along the slope field, continuously tracing out distinct solution curves over time.

- Features a full-screen HTML5 canvas displaying a dynamic vector field.
- Users click and drag on the canvas to place colorful ink drops.
- Ink drops actively trace the solution curve from their initial drop point, leaving a fading trail.
- The slope field animates slightly over time, causing the vector orientations to sway, simulating a non-autonomous differential equation or simply adding a dynamic feel to the visualization.
- Designed with unique, consistent coloring, responsive interactions, and mobile-friendly touch/mouse event support.

## Penrose Tiling Editor [[demo](https://rybla.github.io/interpolnet-2/penrose-tiling-editor)]

An interactive editor for exploring and manipulating Penrose tilings. The demo allows users to dynamically deform the edges of the fundamental kite and dart tiles, with changes propagating symmetrically across the entire aperiodic pattern.

### Features
- **Aperiodic Tiling Generation**: Automatically generates a large-scale Penrose P2 (Kite and Dart) tiling.
- **Symmetric Edge Deformation**: Users can click and drag the edges of any tile. The deformation is applied symmetrically to all corresponding edges in the tiling, ensuring the interlocking pattern remains gapless.
- **Interactive Control Points**: Visual indicators for the manipulatable control points on the edges of the tiles.
- **Dynamic Rendering**: The entire tiling is re-rendered in real-time as the user drags the control points.
- **Pan and Zoom**: Users can pan across the infinite-seeming canvas and zoom in/out to explore the intricate structures of the Penrose tiling.

### Design Goals
- **Mathematical Intuition**: Provide a tangible, interactive way to understand the complex symmetry and interlocking nature of Penrose tilings.
- **Visually Engaging**: Use a distinct, vibrant color scheme to differentiate the kites and darts, and smooth animations for interactions.
- **Performance**: Ensure real-time rendering of the tiling even with a large number of tiles and complex deformed edges.
- **Responsiveness**: The canvas should fill the screen and adapt to both desktop and mobile devices.

### Implementation Plan
- **HTML**: A full-screen `<canvas>` element for rendering the tiling, and a minimal UI overlay for controls (like "Reset Pattern").
- **CSS**: A clean, modern aesthetic with a dark background to make the vibrant colors of the tiles pop. Ensure responsive design.
- **JavaScript (Tiling Logic)**:
  - Implement a deflation algorithm to generate the Penrose P2 tiling (subdividing half-kites and half-darts, or "Robinson triangles").
  - Maintain a global set of control points that define the shape of the "Long Edge" and the "Short Edge" of the tiles.
- **JavaScript (Rendering & Interaction)**:
  - Use the HTML5 Canvas API to render the tiles.
  - Implement logic to draw the deformed edges using quadratic or cubic Bézier curves based on the global control points.
  - Add event listeners for mouse/touch interactions to allow users to pan the view, zoom, and drag the control points.
  - When a control point is dragged, update its global coordinates and trigger a re-render of the entire canvas to show the symmetric deformation.

## Raytracer Pixel Step [[demo](https://rybla.github.io/interpolnet-2/raytracer-pixel-step)]

### Overview
The **Raytracer Pixel Step** demo provides an interactive educational visualization of the fundamental process inside a raytracer for calculating a single pixel's color. It breaks down the continuous rendering process into discrete, understandable steps, focusing on tracing a primary ray from a camera through a virtual screen pixel, hitting a 2D spherical object, calculating the surface normal, and casting a shadow ray to check for light occlusion by another object.

### Features
- **Step-by-Step Visualization**: A sequential control panel that allows users to click through each stage of a raycast (Camera Origin, Ray Emit, Intersection, Surface Normal Calculation, Shadow Ray Emit, Shadow Hit/Miss, Shading Calculation).
- **Interactive 2D Scene**: A top-down 2D canvas representing the 3D raytracing logic, where users can drag the light source, target sphere, and occluder sphere around the scene to dynamically alter the resulting raycast logic.
- **Dynamic Geometric Drawing**: Real-time rendering of mathematical components such as the camera vector, the pixel plane, intersection points, normal vectors, and shadow rays.
- **State Machine Animation**: Passive animations that highlight active components depending on the current step in the raytracing process.

### Design Goals
- **Clarity and Simplicity**: Use a consistent and vibrant color scheme to differentiate objects (camera, target sphere, occluder sphere, light) and ray vectors.
- **Educational Impact**: Demystify the "black box" of raytracing by visually breaking down a single ray calculation, clearly showing how lighting and shadows are computed through geometry.
- **Responsiveness**: Ensure the scene layout and controls adapt gracefully to mobile and desktop screens.

### Implementation Plan
- **HTML**: Create a responsive layout featuring a main `<canvas>` for the 2D scene and a dedicated control panel `<div>` with a descriptive text area and a "Next Step" button.
- **CSS**: Apply a distinct, clean styling with clear contrast. Implement flexbox for an adaptable layout and use CSS transitions for smooth interactive feedback on buttons.
- **JavaScript (State Logic)**:
  - Implement a state machine (enum or sequence) to manage the current step in the raytracing process.
  - Define data structures for vectors, spheres (position, radius, color), the camera (position), and the light source.
- **JavaScript (Math & Raytracing)**:
  - Implement 2D vector mathematics (addition, subtraction, normalization, dot product).
  - Implement a line-sphere intersection algorithm to mathematically detect where rays hit the 2D circles.
- **JavaScript (Rendering & Interaction)**:
  - Use `requestAnimationFrame` for a continuous render loop on the HTML5 Canvas.
  - Add pointer event listeners (mousedown, mousemove, mouseup/touchstart, touchmove, touchend) to enable dragging of the scene objects.
  - Draw the scene dynamically based on the current state, animating vectors and updating the explanation text to guide the user through the raytracing calculation.

## Gray-Scott Turing Patterns [[demo](https://rybla.github.io/interpolnet-2/gray-scott-turing-patterns)]

This demo provides an interactive WebGL simulation of the Gray-Scott model of reaction-diffusion, allowing users to paint "chemical food" onto a digital canvas to watch complex, organic Turing patterns emerge, grow, and split in real time.

### Features
- **Real-time WebGL Simulation:** Uses WebGL ping-pong framebuffers to simulate the Gray-Scott equations at 60 FPS across a high-resolution grid.
- **Interactive Painting:** Users can interact with the canvas using mouse or touch to add "chemical food" (substance B) directly into the simulation, triggering new patterns to grow.
- **Dynamic Parameter Controls:** Sliders to adjust feed rate ($f$), kill rate ($k$), diffusion rates ($D_A$ and $D_B$), and time steps per frame, allowing users to explore different parameter regimes (e.g., spots, stripes, mazes, and moving spots).
- **Custom Color Mapping:** A shader-based color mapping system that translates the chemical concentrations into vibrant, organic colors.
- **Responsive Layout:** A mobile-friendly design that adapts the canvas and control panel to various screen sizes.

### Design Goals
- Provide an intuitive and mesmerizing way to explore reaction-diffusion systems.
- Ensure high performance by keeping all simulation computations and rendering on the GPU.
- Create a distinct visual identity with a dark, scientific theme, using glowing colors for the patterns and clear, minimalist typography for the controls.

### Implementation Outline
1. **HTML/CSS Structure:** Build a full-screen or large responsive canvas with an overlaid or side-by-side control panel (using modern CSS Grid/Flexbox).
2. **WebGL Context and Shaders:**
   - **Simulation Shader:** A fragment shader that reads the previous state from a texture, computes the discrete Laplacian, and updates concentrations $A$ and $B$ according to the Gray-Scott equations.
   - **Render Shader:** A fragment shader that samples the current state texture and maps the concentration of $B$ to a color gradient for display.
3. **Ping-Pong Framebuffers:** Set up two Framebuffer Objects (FBOs) with attached textures (`gl.UNSIGNED_BYTE` format, converted to normalized float in shaders for wider compatibility, or `gl.FLOAT` if the extension is available; for safety and broad compatibility, we will use a clever mapping with 8-bit channels if needed, though most modern browsers support `OES_texture_float`. Given the memory constraints, we'll try to stick to basic data types where possible, but precision is key for Gray-Scott).
4. **Interaction Logic:** Track pointer events to pass a uniform (mouse coordinates and click state) to the simulation shader, adding a burst of substance $B$ where the user clicks/drags.
5. **Animation Loop:** In each frame, run the simulation shader multiple times (for numerical stability and speed), then run the render shader once to output to the canvas.

## L-System Fractal Trees [[demo](https://rybla.github.io/interpolnet-2/l-system-fractal-trees)]

An interactive grammar ruleset editor where specific axiomatic string expansions instantly render as branching L-system fractal trees.

### Features
- **Interactive Grammar Ruleset Editor**: A control panel area allowing users to define an axiom and specific grammar replacement rules.
- **Instant Rendering**: As users edit the axiom, rules, or parameters like angle and length, the L-system is recalculated and instantly rendered on the HTML5 canvas.
- **Axiomatic String Expansions**: Visualizes the string generated by recursively applying rules to the initial axiom.
- **Branching L-system Fractal Trees**: Translates the expanded string into drawing commands to generate complex branching structures in real-time.

### Design Goals
- **Educational**: Visually demonstrate how simple string replacement rules can generate complex, self-similar fractal patterns.
- **Immediate Feedback**: Ensure modifications to the ruleset are instantly reflected in the visualization to facilitate intuitive understanding and exploration.
- **Aesthetics**: A distinct, unique, and consistent color scheme for the UI and the generated trees, with smooth, fluid rendering.

### Implementation Plan
- **HTML/CSS**: A responsive split-layout with a control panel on one side and a canvas on the other, utilizing Flexbox/Grid. Include hover, focus, and active state animations.
- **L-System Logic**: Implement a `parseRules` function to create a key-value mapping of replacement rules and a `generateLSystem` function to recursively expand the axiom based on the rules.
- **Canvas Drawing**: Implement a `drawTree` function that parses the expanded string into canvas drawing commands. Add `input` and `change` event listeners to instantly trigger `generateLSystem` and `drawTree` upon user edits.

## Perlin Noise Visualizer [[demo](https://rybla.github.io/interpolnet-2/perlin-noise-visualizer)]

### Overview
The **Perlin Noise Visualizer** provides an interactive and educational look at how 2D Perlin noise is generated. It demonstrates the underlying gradient vectors and shows how bilinear interpolation blends these gradients to produce smooth, continuous noise maps often used in procedural generation.

### Features
- **Gradient Vector Display:** Visualizes the pseudo-random 2D gradient vectors at grid intersections.
- **Interpolation Visualization:** Real-time demonstration of how values are smoothly interpolated between grid points.
- **Interactive Parameters:** Controls to adjust grid resolution (frequency) and animate the noise generation process.
- **Dynamic Feedback:** Watch the noise map update instantly as parameters are modified or the gradient vectors are randomly regenerated.

### Design Goals
- **Educational Clarity:** Break down the somewhat complex algorithm of Perlin noise into easily understandable visual components.
- **Interactivity:** Encourage exploration by allowing users to tinker with the frequency and seed of the noise.
- **Aesthetic Quality:** Use a clean, modern aesthetic with distinct colors for gradient vectors and the resulting noise map to clearly separate the underlying math from the final visual output.
- **Responsiveness:** Ensure the interactive canvas and controls adapt seamlessly to various screen sizes.

### Implementation Plan
- **HTML/CSS:** Structure a responsive page with a main `<canvas>` element for the visualization and a control panel for user inputs. Style with a clear, engaging theme.
- **JavaScript (Core Logic):**
  - Implement a basic pseudo-random number generator for consistent gradient generation.
  - Define a function to create a grid of 2D unit vectors.
  - Implement the core Perlin noise algorithm: determining the cell containing a point, calculating dot products between distance vectors and gradients, and applying the smoothstep fade function for bilinear interpolation.
- **JavaScript (Rendering):**
  - Use the HTML5 Canvas 2D API to render the underlying grid.
  - Draw the gradient vectors at each grid node.
  - Render the interpolated noise map, perhaps togglable so users can see just the gradients or the final noise.
- **JavaScript (Interaction):**
  - Add event listeners to control inputs to regenerate gradients, change grid size, and toggle visualization layers.
  - Implement an animation loop to potentially shift the noise map or slowly rotate the gradient vectors for dynamic demonstration.

## Boids Flocking Simulation [[demo](https://rybla.github.io/interpolnet-2/boids-flocking-simulation)]

The Boids Flocking Simulation demo provides an interactive 2D visualization of emergent flocking behavior. Inspired by Craig Reynolds' original algorithm, the simulation renders a collection of "boids" (bird-oid objects) on an HTML5 canvas. Users can tweak the exact weights of the three core rules—separation, alignment, and cohesion—via dynamic sliders to observe in real-time how the flocking behavior changes, such as moving from a tightly knit school to a chaotic swarm. The demo features a modern, mobile-friendly design with distinct colors to distinguish boids and UI elements, alongside passive animations to highlight interactable controls.

## Barycentric Triangle Rasterizer [[demo](https://rybla.github.io/interpolnet-2/barycentric-triangle-rasterizer)]

This demo provides an interactive and educational look at how computer graphics rasterize triangles by filling in a massive 2D triangle pixel-by-pixel to calculate color gradients using barycentric coordinates.

### Features
- **Pixel-by-Pixel Rasterization:** Visually fills a massive 2D triangle step-by-step to demonstrate the rendering process.
- **Barycentric Interpolation:** Calculates the barycentric coordinates of each pixel to interpolate colors from the three primary vertices (Red, Green, Blue).
- **Interactive Vertices:** Users can drag the three vertices of the triangle to dynamically change its shape, size, and the resulting color gradients.
- **Playback Controls:** Pause, play, reset, and adjust the speed of the rasterization process.

### Design Goals
- **Educational:** Break down the fundamental concept of triangle rasterization and barycentric coordinates in an intuitive and visual way.
- **Interactive Exploration:** Let users manipulate the geometry to see real-time updates of the rasterization constraints and color interpolation.
- **Aesthetics:** Clean, responsive design with distinctive vertex colors blending smoothly inside the triangle against a dark or clearly contrasting background.

### Implementation Plan
- **HTML/CSS:** Structure a responsive page with a main `<canvas>` for rendering and a side/bottom control panel for controls. Style with a clear, readable theme and custom range inputs.
- **JavaScript (State):** Keep track of the three vertices (position and color), the current rasterization coordinate (x, y bounds), and animation state.
- **JavaScript (Math):** Implement functions to calculate the bounding box of the triangle, compute barycentric coordinates (alpha, beta, gamma) for a given point, and check if a point lies within the triangle.
- **JavaScript (Rendering):** Use `requestAnimationFrame` for a main loop that incrementally checks pixels within the bounding box. If a pixel is inside the triangle, color it using barycentric interpolation of the vertex colors.
- **JavaScript (Interaction):** Add pointer event listeners to allow dragging of vertices (triggering a reset of the rasterization) and hook up control buttons to manage the animation loop.
  - Setup a Three.js scene, camera, renderer, and lights.
  - Create the coordinate axes and a grid helper.
  - Render vectors $u$ and $v$ as arrows (`ArrowHelper` or custom meshes).
  - Use `DragControls` or a custom raycaster implementation to allow dragging the endpoints of $u$ and $v$.
  - Dynamically calculate the cross product vector and update its corresponding arrow in the scene.
  - Draw the parallelogram defined by $u$ and $v$ using a custom `BufferGeometry` and update it dynamically.

## Galton Board Binomial Coefficients [[demo](https://rybla.github.io/interpolnet-2/galton-board-binomial)]

A physics simulation of a Galton board (also known as a quincunx or bean machine), which demonstrates the Central Limit Theorem and visually calculates binomial coefficients. Users can drop balls from the top, watching them bounce randomly left or right at each peg, eventually settling into bins at the bottom to form a normal distribution.

### Features
- **Interactive Physics Engine**: A custom physics simulation that handles rigid body collisions between falling balls and static pegs.
- **Dynamic Binomial Coefficients**: As balls settle into bins, the bins visually fill up. The bins display both the expected binomial coefficient for that position and the actual count of balls.
- **Adjustable Parameters**: Users can change the number of peg rows, the bounce properties (restitution), and the spawn rate of the balls.
- **Visualization Modes**:
  - **Distribution Overlay**: A theoretical normal distribution curve is overlaid on the bins, scaling dynamically as more balls are dropped.
  - **Path Tracing**: An option to leave a faint trail behind each ball to visualize its unique path through the maze.
- **Counters and Stats**: Real-time display of total balls dropped, current balls in motion, and the error margin between the simulated distribution and the theoretical binomial distribution.

### Design Goals
- **Educational Intuition**: Make the connection between individual random events (a ball bouncing left or right) and macroscopic predictable patterns (the normal distribution) visceral and obvious.
- **Performance**: Capable of simulating hundreds of balls simultaneously at 60fps using optimized 2D physics.
- **Aesthetics**: A clean, perhaps slightly "wooden" or "brass" skeuomorphic design, or alternatively, a modern dark theme with bright neon balls, consistent with Interpolnet 2's unique style.
- **Responsive Layout**: The board scales to fit both desktop and mobile screens, ensuring the physics still work correctly regardless of the canvas size.

### Implementation Plan
- **HTML Structure**: A main `<canvas>` element for the board and a control panel for parameters and statistics.
- **CSS Styling**: Responsive flexbox layout, with distinct colors for the UI elements and the canvas border.
- **JavaScript Core**:
    - **Physics Engine**: Implement simple circle-circle (ball-peg) and circle-line (ball-wall/floor) collision detection and resolution.
    - **Galton Logic**: Generate the triangular grid of pegs and the bins at the bottom based on the number of rows.
    - **Rendering Loop**: Use `requestAnimationFrame` to update positions, resolve collisions, and draw the pegs, balls, bins, and distribution overlay.
    - **Math Utilities**: Functions to calculate binomial coefficients ($\binom{n}{k}$) and the normal distribution curve.
The implementation relies on an explicit physics loop in JavaScript running with `requestAnimationFrame`. Balls are tracked with position, velocity, and state (falling vs. settled). Collision detection is performed radially against the mathematically positioned peg grid. When a ball passes the final row, it determines its destination bin and transitions to a settled stack state. A secondary loop calculates the combinations for the binomial distribution curve plotted over the bins.
## Modular Arithmetic Clock Face [[demo](https://rybla.github.io/interpolnet-2/modular-arithmetic-clock-face)]

The "Modular Arithmetic Clock Face" demo provides a visual and interactive exploration of modular arithmetic (specifically addition and multiplication) by mapping operations onto a physical clock face dial. This approach grounds abstract mathematical concepts like congruence and modulo operations into an intuitive, continuous circular motion model that wraps around seamlessly.

The demo features a responsive, mobile-friendly interface showcasing an interactive HTML5 Canvas. A prominent, neon-styled circular clock face dominates the center of the screen, with customizable numbers equally spaced around its perimeter, representing the set of integers for a chosen modulo `n`. Users can actively adjust `n` (the modulus), the current operation (Addition or Multiplication), and an operational value (the step size or multiplicand) via an intuitive control panel floating above or beside the canvas.

When an operation is triggered or continuously scrubbed via a slider, the mathematical action is animated directly on the clock face. For addition, an animated arc or arrow originates from an initial value and smoothly sweeps around the perimeter by the specified step amount, physically wrapping past zero if the value exceeds `n`. Multiplication is visualized by drawing rhythmic, continuous path traces or rapid successive addition steps that multiply the base value, forming intricate geometric star patterns and cycles when wrapping around the dial repeatedly.

The color scheme employs deep space backgrounds with glowing neon cyan, magenta, and bright yellow accents to give the mathematical lines high contrast and visual flair. Continuous, passive animations (such as a slowly rotating background grid or pulsing active nodes) ensure the interface feels alive, while state transitions respond smoothly using `requestAnimationFrame` for high-performance rendering. The layout is fully responsive, vertically stacking the controls underneath the canvas on smaller screens and dynamically scaling the clock radius to maximize available screen real estate.
## Markov Chain Frog Jump [[demo](https://rybla.github.io/interpolnet-2/markov-chain-frog-jump)]

The **Markov Chain Frog Jump** demo provides an interactive visualization of a Markov chain. The state space is represented visually as a network of distinct lilypads distributed across a serene pond setting. The possible state transitions are depicted as directed arrows connecting these lilypads. The thickness or labeling of these arrows corresponds directly to the transition probabilities between states.

At the center of this visualization is a virtual frog, which acts as the current state indicator. The frog jumps from its current lilypad to a new one, simulating a single step in the Markov chain process. The choice of the next lilypad is determined stochastically, weighted by the outgoing transition probabilities of the current state. This continuous jumping animation provides an intuitive and engaging way to observe the long-term behavior and state distribution of the Markov chain.

**Design Goals and Features:**
* **Visual Clarity:** Clear distinction between states (lilypads) and transitions (arrows).
* **Intuitive Mechanics:** The frog metaphor immediately conveys the idea of moving from one discrete state to another based on probabilities.
* **Interactive Exploration:** A control panel allows users to manipulate the simulation speed, letting them observe the system dynamically.
* **Responsive Layout:** The canvas is designed to automatically adapt to different screen sizes, ensuring a seamless experience on both desktop and mobile devices.
* **Consistent Aesthetics:** The color palette and typography strictly follow the project's consistent design guidelines, creating a cohesive look and feel within the Interpolnet ecosystem.

## Sweep-line Voronoi [[demo](https://rybla.github.io/interpolnet-2/sweep-line-voronoi-demo)]

This demo provides an interactive visualization of Fortune's sweep-line algorithm (in a discrete rendering context) for generating Voronoi diagrams.

Users can interact with the main `<canvas>` element by clicking to place new "seed" points. As seeds are placed, a horizontal "sweep-line" continuously moves down the screen.
The algorithm calculates the boundary curve formed by the intersections of distance functions extending from each active seed above the sweep-line.
As the sweep-line moves, the breakpoints (intersections) of these curves trace out the edges of the Voronoi cells.

An off-screen canvas is used to continuously accumulate and draw these traced edges. The final render loop composites the off-screen edges, the active seeds, the sweep-line itself, and the dynamic boundary curves onto the main canvas, providing a real-time, animated view of the Voronoi cell formation process.
The demo features a consistent and modern color scheme, ensuring clear visibility of all mathematical components. The layout is fully responsive, keeping the canvas centered and appropriately scaled for mobile devices.

## Minimax Saddle Settler [[demo](https://rybla.github.io/interpolnet-2/minimax-saddle-settler)]

This demo features an interactive 3D visualization using Three.js where users can explore a multivariable calculus surface that has a minimax saddle point. Users can drag a ball onto the surface, and watch it naturally settle into the minimax saddle point by simulating simultaneous gradient descent (along the minimizing axis) and gradient ascent (along the maximizing axis) dynamics, rather than uniform gravity, accompanied by a dynamic trailing path.

## Fibonacci Spiral Animation [[demo](https://rybla.github.io/interpolnet-2/fibonacci-spiral-animation)]

### Description
An interactive visualization showing the Fibonacci sequence recursively dividing a golden rectangle into smaller squares that perfectly trace the path of a logarithmic spiral. The user can watch the progressive generation of the squares and the connecting spiral arcs, demonstrating the geometric relationship between the Fibonacci numbers and the golden ratio.

### Features
- **Progressive Animation**: Slowly draws the Fibonacci squares one by one, scaling the view or zooming out as larger squares are added to keep the entire structure visible.
- **Golden Spiral**: Simultaneously draws smooth quarter-circle arcs within each square to form a continuous golden spiral.
- **Interactive Controls**: Users can pause/play the animation, adjust the animation speed, and manually step forward or backward through the sequence.
- **Information Display**: Displays the current Fibonacci number and the total number of squares currently drawn.
- **Responsive Canvas**: The canvas auto-resizes to fit the screen, maintaining the correct aspect ratio for the golden rectangle.

### Design Goals
- **Mathematical Clarity**: Clearly illustrate the construction of the golden spiral using Fibonacci squares.
- **Visual Elegance**: Use smooth animations, distinct colors for the squares' borders, and a prominent, contrasting color for the spiral path to make the mathematical structure visually appealing.
- **Responsiveness**: Ensure the controls and canvas look good on both desktop and mobile devices.

### Implementation Plan
- **HTML/CSS**: Set up a full-screen canvas with a floating, responsive UI overlay for controls and statistics.
- **JavaScript Core Logic**:
  - Maintain state for the current step in the Fibonacci sequence (e.g., $F_n = F_{n-1} + F_{n-2}$).
  - Track the current drawing coordinate, orientation, and scale.
  - Implement a `requestAnimationFrame` loop to handle the progressive drawing and zooming.
- **Rendering**:
  - Use `ctx.strokeRect` or `ctx.fillRect` with varying colors to draw each new Fibonacci square.
  - Use `ctx.arc` to draw the quarter-circle path connecting the opposite corners of the square.
  - Apply `ctx.translate` and `ctx.scale` to keep the growing structure centered and visible within the canvas viewport as it exponentially expands.

## Skewable Galton Board [[demo](https://rybla.github.io/interpolnet-2/skewable-galton-board)]

An interactive Galton board where users can skew the peg probabilities to watch the resulting distribution shift from normal to Poisson.

### Features
- **Physics Simulation**: A real-time physics simulation of balls falling through a grid of pegs and accumulating in bins.
- **Interactive Skewing**: A slider control that allows the user to dynamically adjust the probability of a ball bouncing left versus right at each peg.
- **Dynamic Distribution Visualization**: As balls accumulate in the bins, a theoretical distribution curve (shifting from Normal to Poisson depending on the skew) is overlaid to compare with the experimental results.
- **Continuous Flow**: Balls continuously drop from the top to show the distribution forming over time.

### Design Goals
- **Educational Intuition**: Provide a visual, interactive way to understand how the normal distribution arises from independent random events (Central Limit Theorem) and how altering the probability of those events leads to a skewed (Poisson-like) distribution.
- **Visual Clarity**: Use distinct, contrasting colors for the balls, pegs, and the overlay curve to ensure the simulation and the resulting data are easy to distinguish.
- **Responsive Layout**: Ensure the canvas and controls are usable on both desktop and mobile devices.

### Implementation Plan
- **HTML/CSS**: A full-screen `<canvas>` for the simulation and a UI overlay for the probability skew slider. Style with the Interpolnet 2 dark theme.
- **JavaScript Core Logic**:
  - Implement a simple 2D physics engine for falling balls, handling gravity and collisions with a static triangular grid of pegs.
  - Implement the skew logic: when a ball hits a peg, use the slider's value (0.0 to 1.0) to determine the probability of bouncing right.
  - Manage a set of bins at the bottom to catch and stack the balls.
- **Rendering**:
  - Use HTML5 Canvas API (`requestAnimationFrame`) to draw the pegs, animating balls, and the accumulating stacks in the bins.
  - Draw a dynamic theoretical curve over the bins based on the current probability parameter.

## Huffman Entropy Coding Compressor [[demo](https://rybla.github.io/interpolnet-2/huffman-entropy-coding-compressor)]

The Huffman Entropy Coding Compressor demo provides an interactive educational visualization of data compression. It dynamically generates a Huffman tree based on input text character frequencies, calculates Shannon entropy, and displays real-time compression statistics and variable-length binary codes.

### Features
- Real-time frequency analysis of user input text.
- Dynamic generation and visualization of a Huffman tree on an HTML5 canvas.
- Display of Shannon entropy, compression ratio, and space savings.
- Output of the original text encoded using the generated variable-length binary codes.

### Design Goals
- Use a distinct, unique, and consistent color scheme (e.g., deep purples and bright accents for tree nodes).
- Incorporate smooth passive and active animations when the input changes to demonstrate real-time updates.
- Ensure the layout is responsive and mobile-friendly, effectively managing the input, visualization, and output areas.

### Implementation Plan
- **HTML:** Create a semantic layout with a text area for input, a canvas element for the tree visualization, and a results section for statistics and the encoded output.
- **CSS:** Apply responsive grid or flexbox styling, define the specific color palette, and add CSS transitions for interactive elements.
- **JavaScript:**
  - Calculate character frequencies.
  - Build the Huffman tree structure using a priority queue approach.
  - Calculate Shannon entropy based on probabilities.
  - Traverse the tree to generate the dictionary of binary codes.
  - Render the tree on the canvas, dynamically positioning nodes and drawing connections.
  - Set up input event listeners to recalculate and re-render on every keystroke.

## Dynamic Slope Field Tracer [[demo](https://rybla.github.io/interpolnet-2/dynamic-slope-field-tracer)]

This demo provides an interactive 2D visualization on an HTML5 canvas where users explore a dynamic slope field representing a differential equation. Users can interact by dropping virtual "ink drops" anywhere on the canvas, which then flow along the vector field to continuously trace distinct solution curves.

Features:
- Dynamic rendering of a slope field for a specific differential equation.
- Interactive placement of "ink drops" via click or touch.
- Continuous tracing of solution curves originating from the ink drops, following the vector field over time.
- Smooth animations for the flowing ink drops.
- Distinct color scheme for the background, vector lines, and ink trails.
- Responsive design for varying screen sizes, ensuring the field and interaction area adjust correctly.

Implementation Outline:
- `index.html`: Contains the full-screen canvas element for the slope field and a simple overlay container for an informational title.
- `style.css`: Defines a distinct dark/neon theme, ensuring the canvas fills the viewport and UI elements are styled responsively with subtle entrance animations.
- `script.js`:
    - Handles canvas resizing to match the window dimensions.
    - Defines a differential equation function $dy/dx = f(x, y)$.
    - Implements a rendering loop that draws the static vector field (short line segments representing the slope at grid points).
    - Manages an array of active "ink drops", updating their positions based on the local slope (using a numerical integration step) and drawing their continuous trails.
    - Attaches event listeners for `mousedown`/`touchstart` to spawn new ink drops at the pointer location.

## Penrose Tiling Visualizer [[demo](https://rybla.github.io/interpolnet-2/penrose-tiling-visualizer)]

The **Penrose Tiling Visualizer** provides an interactive visualization of a Penrose tiling on an HTML5 canvas. The demo utilizes the deflation algorithm to generate the aperiodic tiling, conceptually breaking the infinite pattern down into fundamental "Robinson triangles" (half-kites and half-darts).

A core interactive feature of this demo is the ability for users to dynamically deform the straight edges of the base tiles. The straight edges are replaced with cubic Bézier curves, and the user can drag control points on a central "base" kite/dart pair. Any deformations made to these base edges are instantly and symmetrically propagated across the entire aperiodic pattern, showcasing how complex, curved, non-periodic tessellations can be constructed from simple fundamental rules.

### Features
- Generates an aperiodic Penrose tiling (P3) using the deflation algorithm on Robinson triangles.
- Renders the tiles using cubic Bézier curves instead of straight line segments.
- Interactive control points on a base kite and dart allow users to manipulate the shape of the edges.
- Edge deformations correctly tessellate and propagate symmetrically across the entire infinite-like pattern in real-time.
- Distinct and aesthetically pleasing color scheme for kites, darts, and UI controls.
- Smooth animations for interactivity and mobile-friendly responsive canvas design.

### Implementation Outline
- `index.html`: Contains the full-screen canvas element for the visualization and an informational overlay detailing instructions for the user.
- `style.css`: Defines the unique color scheme using CSS variables, ensures the canvas fills the viewport, and styles the overlay with subtle entrance animations.
- `script.js`:
    - Implements data structures representing acute (half-kite) and obtuse (half-dart) Robinson triangles.
    - Implements the recursive deflation algorithm (`subdivide`) to generate a set of triangles covering the screen.
    - Contains a rendering loop (`draw`) that translates the logical straight-edge triangles into curved tessellating shapes by evaluating cubic Bézier curves based on a global set of user-defined control point offsets.
    - Attaches event listeners for `mousedown`/`touchstart`/`mousemove`/`touchmove`/`mouseup`/`touchend` to allow dragging of the base control points, triggering a re-render.

## Raytracer Single Pixel Calculation [[demo](https://rybla.github.io/interpolnet-2/raytracer-single-pixel-calculation)]

### [Raytracer Single Pixel Calculation](/raytracer-single-pixel-calculation/)

This demo provides an interactive educational visualization of the fundamental process inside a raytracer for calculating a single pixel's color. It breaks down the continuous rendering process into discrete, step-by-step visual calculations, allowing users to physically see each stage of the algorithm as it happens.

**Features:**
- Step-by-step visualization: Traces a primary ray from the camera, calculates intersection with a 2D sphere, finds the surface normal, and casts shadow rays for light occlusion.
- Distinct color scheme: Utilizes a unique palette with clear, vibrant colors to distinguish different elements (camera, ray, sphere, normal, light).
- Interactive progression: Users can click to advance the animation through each logical step of the raytracing pipeline.
- Educational annotations: Real-time text overlays explain the current mathematical operation being performed (e.g., "Calculating primary ray direction", "Checking sphere intersection", "Computing normal", "Testing shadow ray").

**Design Goals:**
- To demystify the core algorithm of raytracing by slowing it down and visualizing it in two dimensions.
- To use clear, distinct visual cues (colors, animations, and typography) to separate the physical elements of the scene from the abstract mathematical vectors.
- To ensure the demo is responsive and accessible on mobile devices, providing a seamless educational experience across screen sizes.

**Implementation Plan:**
- **HTML/CSS:** Set up a full-screen, responsive HTML5 canvas. Apply a custom CSS variable-based color scheme and clear typography for UI elements.
- **JavaScript State Machine:** Implement a state machine to handle the progression of the raytracer:
    - State 1 (Init): Show camera, image plane, sphere, and light source.
    - State 2 (Primary Ray): Animate a ray shooting from the camera through a specific pixel on the image plane towards the scene.
    - State 3 (Intersection): Calculate and highlight the exact intersection point on the sphere surface.
    - State 4 (Normal Calculation): Visualize the calculation of the surface normal vector at the intersection point.
    - State 5 (Shadow Ray): Animate a secondary ray from the intersection point towards the light source to check for occlusion.
    - State 6 (Result): Color the pixel on the image plane based on whether the shadow ray reached the light or was blocked.
- **Rendering Loop:** Use `requestAnimationFrame` to drive smooth interpolation for the moving rays and fading annotations, using distinct colors for primary rays, normal vectors, and shadow rays.

## Turing Patterns (Gray-Scott) [[demo](https://rybla.github.io/interpolnet-2/turing-patterns-gray-scott)]

This demo implements a WebGL simulation of the Gray-Scott reaction-diffusion model, allowing users to paint chemical food onto a canvas to watch organic Turing patterns grow and split.

### Features
- Real-time simulation of the Gray-Scott model using WebGL for high-performance parallel computation.
- Users can interactively "paint" chemical food (variable `V`) by clicking or dragging on the canvas, sparking new pattern growth.
- The rendering uses a distinct, consistent color scheme mapping the chemical concentration to vibrant, distinct hues, providing a continuous passive animation.
- Responsive, mobile-friendly design where the canvas scales dynamically with the window size.

### Implementation Details
- The simulation requires high-precision calculations for the reaction-diffusion equations, as the frame-to-frame continuous delta updates are very small. It requests the `OES_texture_float` WebGL extension and uses `gl.FLOAT` textures, as 8-bit `gl.UNSIGNED_BYTE` textures lack the necessary precision and would truncate small continuous deltas to zero.
- It utilizes ping-pong framebuffers: the output of one frame's computation (the updated chemical concentrations) becomes the input texture for the next frame.
- The WebGL setup includes two main shader programs: a simulation shader that calculates the next state of the chemical concentrations using the Gray-Scott equations and a rendering shader that maps the concentrations to the visual color scheme.

## L-System Fractal Trees Generator [[demo](https://rybla.github.io/interpolnet-2/l-system-fractal-trees-generator)]

An interactive grammar ruleset editor where specific axiomatic string expansions instantly render as branching L-system fractal trees.

### Features
- **Interactive Grammar Ruleset Editor**: A control panel area allowing users to define an axiom and specific grammar replacement rules.
- **Instant Rendering**: As users edit the axiom, rules, or parameters like angle and length, the L-system is recalculated and instantly rendered on the HTML5 canvas.
- **Axiomatic String Expansions**: Visualizes the string generated by recursively applying rules to the initial axiom.
- **Branching L-system Fractal Trees**: Translates the expanded string into drawing commands to generate complex branching structures in real-time.

### Design Goals
- **Educational**: Visually demonstrate how simple string replacement rules can generate complex, self-similar fractal patterns.
- **Immediate Feedback**: Ensure modifications to the ruleset are instantly reflected in the visualization to facilitate intuitive understanding and exploration.
- **Aesthetics**: A distinct, unique, and consistent color scheme for the UI and the generated trees, with smooth, fluid rendering.

### Implementation Plan
- **HTML/CSS**: A responsive split-layout with a control panel on one side and a canvas on the other, utilizing Flexbox/Grid. Include hover, focus, and active state animations.
- **L-System Logic**: Implement a `parseRules` function to create a key-value mapping of replacement rules and a `generateLSystem` function to recursively expand the axiom based on the rules.
- **Canvas Drawing**: Implement a `drawTree` function that parses the expanded string into canvas drawing commands. Add `input` and `change` event listeners to instantly trigger `generateLSystem` and `drawTree` upon user edits.

## Perlin Noise Visualizer 2 [[demo](https://rybla.github.io/interpolnet-2/perlin-noise-visualizer-2)]

An interactive, educational visualization of how 2D Perlin noise is generated, breaking down the algorithm into its core components.

### Features
- **Gradient Grid Overlay:** Displays a grid where intersections feature pseudo-random 2D gradient vectors.
- **Interpolation Visualization:** Shows how bilinear interpolation blends the dot products of distance vectors and gradient vectors.
- **Step-by-Step Animation:** Users can click on the canvas to step through the generation process: showing just the grid, then the gradient vectors, then the blended noise map.
- **Dynamic Recalculation:** The noise pattern and gradients regenerate upon user request, demonstrating the pseudo-random nature of the algorithm.

### Design Goals
- **Educational Clarity:** Make the mathematical process of generating Perlin noise easy to understand visually.
- **Clean Aesthetic:** Use distinct, high-contrast colors to separate the underlying grid/vectors from the resulting noise map.
- **Interactivity:** Allow the user to step through the process at their own pace.

### Implementation Plan
- **HTML Structure:** A simple full-screen `<canvas>` element for rendering, with an overlay text element for instructional text.
- **CSS Styling:** A dark theme background with vibrant colors (e.g., cyan/magenta) for the vectors, and a grayscale gradient map for the noise output. Use a responsive layout.
- **JavaScript Logic:**
  - Create a 2D grid of random unit vectors.
  - Implement the core Perlin noise algorithm functions: dot product, fade function (smoothstep), and bilinear interpolation (lerp).
  - Implement a `requestAnimationFrame` render loop that draws the grid, the vectors, and the interpolated noise pixel by pixel, based on the current animation state controlled by click events.

## Boids Flocking Simulation [[demo](https://rybla.github.io/interpolnet-2/boids-flocking)]

This demo provides an interactive 2D visualization of emergent flocking behavior based on Craig Reynolds' Boids algorithm. The simulation is rendered on an HTML5 canvas and allows users to explore the dynamics of separation, alignment, and cohesion. Users can dynamically adjust the weights of these three core rules via intuitive sliders, observing in real-time how the changes affect the flocking patterns of the boids. The demo features a distinctive color scheme, smooth passive animations, and a responsive, mobile-friendly design with a control panel for the sliders.

## Barycentric Triangle Fill [[demo](https://rybla.github.io/interpolnet-2/barycentric-triangle-fill)]

This demo provides an interactive visualization of the barycentric coordinate rasterization process by filling in a massive 2D triangle pixel-by-pixel to calculate color gradients.

### Features
- **Pixel-by-Pixel Rasterization:** Visually fills a massive 2D triangle step-by-step to demonstrate the rendering process.
- **Barycentric Interpolation:** Calculates the barycentric coordinates of each pixel to interpolate colors from the three primary vertices (Red, Green, Blue).
- **Interactive Vertices:** Users can drag the three vertices of the triangle to dynamically change its shape, size, and the resulting color gradients.
- **Step-by-Step Animation:** Users can click on the canvas to step through the rasterization process.

### Design Goals
- **Educational:** Break down the fundamental concept of triangle rasterization and barycentric coordinates in an intuitive and visual way.
- **Interactive Exploration:** Let users manipulate the geometry to see real-time updates of the rasterization constraints and color interpolation.
- **Aesthetics:** Clean, responsive design with distinctive vertex colors blending smoothly inside the triangle against a dark or clearly contrasting background.

### Implementation Plan
- **HTML/CSS:** Structure a responsive page with a main `<canvas>` for rendering and a text overlay for instructions. Style with a clear, readable theme and distinct colors.
- **JavaScript (State):** Keep track of the three vertices (position and color), the current rasterization coordinate (x, y bounds), and animation state.
- **JavaScript (Math):** Implement functions to calculate the bounding box of the triangle, compute barycentric coordinates (alpha, beta, gamma) for a given point, and check if a point lies within the triangle.
- **JavaScript (Rendering):** Use `requestAnimationFrame` for a main loop that incrementally checks pixels within the bounding box. If a pixel is inside the triangle, color it using barycentric interpolation of the vertex colors.
- **JavaScript (Interaction):** Add pointer event listeners to allow dragging of vertices (triggering a reset of the rasterization) and canvas clicks to advance the animation.

## Marching Cubes Isosurface [[demo](https://rybla.github.io/interpolnet-2/marching-cubes)]

An interactive 3D visualization that demonstrates the Marching Cubes algorithm. Users can dynamically adjust the isosurface threshold of a continuously animated 3D scalar field, watching in real-time as the algorithm generates a cohesive, fluid-like polygonal mesh that represents the boundary of the threshold.

### Features
- **Real-time 3D Rendering**: High-performance WebGL rendering of a 3D scalar field and the resulting polygonal mesh using Three.js.
- **Dynamic Scalar Field**: The underlying scalar field is continuously animated, creating organic, blob-like structures that merge and separate over time.
- **Interactive Threshold Slider**: Users can control the `threshold` value of the isosurface via a slider. Adjusting the slider instantly re-evaluates the marching cubes algorithm, shrinking or expanding the visible mesh.
- **Camera Controls**: Users can drag to rotate the camera and view the evolving 3D structure from any angle.
- **Visual Clarity**: Uses a distinct, glowing material for the mesh against a dark background, making the geometric topology easy to observe.

### Design Goals
- **Algorithm Demystification**: Provide an intuitive, visual representation of how the marching cubes algorithm extracts a 2D surface from 3D volumetric data.
- **Mesmerizing Fluidity**: Create an engaging "lava lamp" effect through smooth animations and organic shapes.
- **Responsive Interaction**: Ensure the mesh updates instantly as the user drags the threshold slider, emphasizing the direct connection between the mathematical parameter and the physical geometry.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering.
- **Scalar Field Generation**: Create a function $f(x, y, z, t)$ that evaluates the density at any point in the 3D grid. This function will combine multiple moving, overlapping density spheres whose positions update based on time ($t$).
- **Marching Cubes Implementation**:
  - Define a 3D grid (e.g., $40 \times 40 \times 40$).
  - In each frame, evaluate the scalar field function at every grid point.
  - Implement (or utilize an optimized version of) the marching cubes algorithm:
    1. For each cube in the grid, determine an 8-bit index based on which of its 8 vertices are below the current isosurface threshold.
    2. Use this index to look up the corresponding edge intersections from a pre-calculated edge table.
    3. Calculate the exact intersection points on the edges using linear interpolation.
    4. Generate triangles connecting these intersection points.
  - Update the Three.js `BufferGeometry` with the newly generated vertices and normals.
- **User Interface**: A simple HTML range slider overlaid on the canvas, linked to the threshold parameter.

## Dithering Algorithm Comparison [[demo](https://rybla.github.io/interpolnet-2/dithering-algorithm-comparison)]

Compare various error-diffusion and ordered dithering algorithms by dragging a slider across a high-resolution image to reveal its 1-bit pixelation.

### Features
- **Algorithm Selection**: A control panel to select between different dithering algorithms:
  - Threshold
  - Random
  - Ordered (Bayer Matrix)
  - Floyd-Steinberg
  - Atkinson
- **Interactive Split Slider**: An overlay slider on the main image. Dragging it reveals the original image on one side and the dithered version on the other side, allowing precise visual comparison of the details.
- **Procedural Image Generation**: A visually appealing, high-resolution procedural image is generated on an off-screen canvas to serve as the subject for dithering, containing smooth gradients and shapes to test the algorithms effectively.
- **Real-time Processing**: Dithering algorithms are processed efficiently to ensure the split view updates quickly when switching algorithms.

### Design Goals
- **Visual Comparison**: Provide a clear, intuitive way to understand the differences between various dithering techniques and their visual artifacts.
- **Smooth Interaction**: Ensure the split slider feels fluid and responsive.
- **Clean Aesthetic**: A distinct dark theme with neon accents, ensuring mobile-friendliness and smooth hover/active animations.

### Implementation Plan
- **HTML**: Structure the UI with a control panel containing radio buttons for the dithering algorithms and a main container with a `<canvas>` element and an `<input type="range">` overlay slider.
- **CSS**: Create a responsive layout using flexbox/grid for the main container and control panel. Add a dark theme with neon accents. Style the slider thumb to be a vertical line spanning the height of the canvas.
- **JavaScript**:
  - Procedurally generate a high-resolution grayscale/color image on an off-screen canvas.
  - Implement the dithering algorithms to process the generated image data.
  - Add event listeners for the slider to dynamically draw the original image and the dithered version on the main canvas, updating the split view in real-time.

## Procedural Map Generator [[demo](https://rybla.github.io/interpolnet-2/procedural-map-generator)]

Build a map generator that combines overlapping octaves of simplex noise with a moisture map to generate biomes, coastlines, and rivers dynamically.

### Features
- **Dynamic Terrain Generation**: Generates terrain in real-time using simplex noise combined with Fractional Brownian Motion (fBm) to create overlapping octaves for detailed elevation.
- **Moisture Mapping**: Uses an independent noise map to determine moisture levels.
- **Biome Classification**: Maps the intersection of elevation and moisture values to a variety of biomes (e.g., Desert, Grassland, Forest, Tundra, Snow).
- **Water Features**: Distinct coloring for shallow and deep water to create coastlines, as well as distinct logic to form rivers.
- **Interactive Regeneration**: Clicking the canvas regenerates a new map with a different random seed instantly.

### Design Goals
- **Organic Aesthetics**: The primary goal is to produce natural-looking maps with varied biomes and realistic transitions (coastlines and varying elevations).
- **Performance**: Use an efficient, compact implementation of 2D Simplex Noise and fast rendering via `CanvasRenderingContext2D.putImageData()`.
- **Responsive Layout**: Provide a mobile-friendly view where the map correctly scales to fit the screen without stretching, and provides smooth passive/active animations upon interaction.
- **Distinct Colors**: Implement a specific, rich color palette to clearly differentiate biomes, using the established Interpolnet 2 typography and spacing guidelines.

### Implementation Plan
- **HTML Structure**: A clean layout containing the canvas element and an overlay or sidebar with the map legend.
- **CSS Styling**: A dark theme UI that contrasts with the vibrant map colors, ensuring mobile responsiveness.
- **JavaScript Engine**:
  - `SimplexNoise`: Implement a minimal Simplex Noise generator based on standard fast implementations.
  - `fBm`: A function that sums multiple scaled noise layers (`octaves`) by modifying `frequency` (lacunarity) and `amplitude` (persistence).
  - `Map Generation`: Two distinct fBm passes (one for elevation, one for moisture).
  - `Biome Mapping`: A function mapping `(elevation, moisture)` pairs to an RGBA color.
  - `Rendering`: Calculate pixel colors for a grid and write them to an `ImageData` array for single-pass rendering to the canvas.

## WebGL Vector Particle Emitter [[demo](https://rybla.github.io/interpolnet-2/webgl-vector-particle-emitter)]

The WebGL Vector Particle Emitter demo provides an interactive 2D visualization using WebGL where users can visually construct and manipulate vectors representing wind, gravity, and drag applied to thousands of independent points emitted from a source.

### Features
- **Vector Control:** Users can drag the endpoints of visual vector arrows on the canvas to configure global physical forces (gravity, wind, drag) interactively.
- **Particle System:** Thousands of independent particles are continuously emitted from a central point.
- **WebGL Rendering:** Efficient rendering of particles using `gl.POINTS` with customized point sprites via fragment shaders.
- **Physics Simulation:** Each particle's velocity and position are updated every frame by applying the sum of the configured vector forces (Euler integration).

### Implementation
- `Vector Data Structure`: JavaScript objects that hold `x` and `y` components for each user-configurable force, and a method to render themselves as arrows onto an overlay 2D canvas context.
- `WebGL Buffers`: Two separate VBOs for particle data (positions and life/velocity) updated dynamically using `gl.bufferSubData()`.
- `Shaders`:
  - `Vertex Shader`: Calculates the screen position and point size based on particle age.
  - `Fragment Shader`: Renders a soft, glowing point sprite.
- `Simulation Loop`: A `requestAnimationFrame` loop that calculates the total acceleration vector from the user-configured gravity, wind, and drag vectors, updates all active particles' positions, and handles particle emission and recycling.
- `Interaction`: Pointer event listeners on a 2D overlay canvas handle hit detection for the interactive vector arrow heads, allowing drag-and-drop modification of the underlying physical forces.

## Shadow Mapping Deconstructed [[demo](https://rybla.github.io/interpolnet-2/shadow-mapping-deconstructed)]

Deconstruct 3D shadow mapping by rendering a split-screen view showing the scene from the camera's perspective next to the light source's depth buffer.

### Features
- **Split-Screen Visualization:** Two side-by-side (or vertically stacked on mobile) views rendering the exact same scene simultaneously: one from the main camera's perspective showing fully rendered shadows, and one from the light source's perspective showing the depth map.
- **Interactive Light Positioning:** Users can click and drag on the screen to rotate the light source around the central objects, dynamically updating the shadow map in real-time.
- **Real-time Depth Rendering:** The second view utilizes a depth material to visually demonstrate how a shadow map encodes distance from the light.
- **Dynamic Shadows:** Moving the light immediately alters the shadows cast by various objects (like toruses and spheres) onto the floor and each other, which perfectly correlates with the depth buffer view.
- **Responsive Layout:** Automatically adjusts from side-by-side on wide screens to a vertical stack on mobile devices.

### Design Goals
- **Educational Clarity:** Visually demystify how shadow mapping works by letting the user see exactly what the light "sees."
- **Seamless Interactivity:** Provide a fluid experience where dragging instantly updates both rendering contexts without lag.
- **Distinct Aesthetic:** Use the Interpolnet dark theme with a clean, high-contrast palette to make shadows and the depth map easy to distinguish.

### Implementation Plan
- **HTML/CSS Layout:** A flexible container displaying two rendering views. Each view will feature an overlay indicating its perspective (Camera View vs. Light Depth Buffer).
- **Three.js Scene Setup:** Initialize a single 3D scene containing a floor plane and a few floating geometric shapes (e.g., torus, cube, sphere).
- **Light & Cameras:**
  - Create a main perspective camera.
  - Create a directional light with shadow mapping enabled.
  - Create a camera representing the light source's perspective.
- **Split-Screen Rendering Loop:**
  - Use two WebGLRenderers (or a single renderer with `setViewport` and `setScissor`).
  - Render the scene normally for the camera view.
  - For the light view, apply a `MeshDepthMaterial` (or a custom depth visualization shader) to all objects, overriding their standard materials temporarily, and render the scene from the light's camera perspective.
- **Interaction:** Attach pointer event listeners to allow dragging, which calculates a new polar coordinate position for the directional light, smoothly updating its position vector in the animation loop.

## Delaunay Triangulation Visualizer [[demo](https://rybla.github.io/interpolnet-2/delaunay-triangulation-visualizer)]

The Delaunay Triangulation Visualizer is an interactive demo that beautifully illustrates the geometric properties of a Delaunay mesh. Users can tap or click anywhere on an HTML5 canvas to place arbitrary points, from which expanding circles begin to grow outward in real-time.

### Features
- Real-time animation of expanding circumcircles originating from user-defined points.
- Continuous calculation and rendering of valid Delaunay triangles as expanding circles intersect and lock together according to the empty circumcircle property.
- Smooth fading effects to highlight the newest connections while maintaining visual clarity.
- Interactive point placement via pointer events, enabling users to actively influence the emerging mesh.

### Design Goal
To provide a satisfying and visually intuitive understanding of Delaunay triangulation, demonstrating how optimal, non-overlapping triangles naturally emerge from a set of discrete points through the continuous expansion and intersection of their circumcircles.

### Implementation Plan
- **State Management:** Maintain an array of user-placed points, active expanding circles, and established valid triangles.
- **Rendering:** Utilize an HTML5 `<canvas>` and `requestAnimationFrame` for a continuous render loop, drawing the expanding circles, the points, and the final triangulation lines with a cohesive color palette.
- **Logic:** Each animation frame, increment the radius of all active circles. Continuously check for intersections among triplets of circles to identify valid Delaunay triangles, ensuring no other points lie within the circumcircle of the formed triangle.
- **Interaction:** Add pointer event listeners (click/touch) to the canvas to push new coordinate data into the state array, triggering the birth of a new expanding circle.

## 3D UV Map Painter [[demo](https://rybla.github.io/interpolnet-2/3d-uv-map-painter)]

An interactive visualization demonstrating how a 2D texture wraps around a 3D object. The demo provides a split-screen view showing a 3D cube and its corresponding unrolled 2D UV map, allowing users to paint directly on the flat surface and observe the changes in real time on the 3D model.

### Features
- **Split-Screen Interface:** Side-by-side view with a 2D painting canvas and a 3D rendered cube.
- **Real-Time Texture Mapping:** Brush strokes painted on the 2D canvas are immediately applied as a dynamic texture onto the 3D cube.
- **UV Map Guide:** The 2D canvas displays a faint outline showing exactly how the six faces of the cube correspond to the flat 2D layout.
- **Interactive 3D View:** The 3D cube continuously rotates to show all faces, or can be interacted with to view specific angles.

### Design Goals
- **Educational Intuition:** Help users understand the concept of UV mapping by bridging the gap between flat textures and 3D surfaces in a concrete, interactive way.
- **Visual Feedback:** Provide immediate visual connection between drawing actions and 3D texturing.
- **Consistent Aesthetic:** Use a distinct color scheme (e.g., deep charcoal background with bright neon brush strokes) consistent with Interpolnet 2's style.

### Implementation Plan
- **HTML/CSS:** Create a responsive flexbox/grid layout ensuring the 2D canvas and 3D view are equally sized and properly scaled on both desktop and mobile.
- **2D Canvas Logic:**
  - Initialize a standard HTML5 `<canvas>` for drawing.
  - Implement a simple brush drawing logic tracking mouse/touch events.
  - Draw a persistent underlying grid/guide representing the unrolled cube faces.
- **3D Rendering (Three.js):**
  - Set up a Three.js scene, camera, and basic lighting.
  - Create a cube using standard 3D geometry.
  - Apply the 2D canvas as a `CanvasTexture` to the cube's material.
  - Re-map the default UV coordinates of the cube's geometry to match the unrolled cross-layout drawn on the 2D canvas.
  - Add an animation loop to rotate the cube and flag the texture for updates (`needsUpdate = true`) whenever the user paints.

## Inverse Kinematics Robotic Arm [[demo](https://rybla.github.io/interpolnet-2/inverse-kinematics-robotic-arm)]

A multi-jointed robotic arm utilizing inverse kinematics where users drag the end effector and the algorithm calculates the joint angles.

### Features
- **Multi-Jointed Arm**: A visual representation of a robotic arm with multiple segments and joints connected in a chain.
- **Inverse Kinematics**: Implements an algorithm (such as Cyclic Coordinate Descent or FABRIK) to continuously solve for the joint angles required to reach the target.
- **Interactive Target**: Users can drag a target point (the end effector's goal) around the canvas, and the arm automatically moves to follow it.
- **Real-Time Rendering**: The arm's position and orientation update smoothly in real time as the target is moved.

### Design Goals
- **Responsiveness**: Ensure the physics/math calculations perform efficiently to allow smooth, real-time dragging without lag.
- **Visual Clarity**: Use distinct, consistent colors for the base, joints, segments, and target to make the structure clear.
- **Educational Intuition**: Provide a tactile, interactive way to understand inverse kinematics, an important concept in robotics and animation.

### Implementation Plan
- **HTML**: A full-screen `<canvas>` for the rendering context.
- **CSS**: A clean, modern aesthetic with a dark background to make the vibrant colors of the arm pop. Ensure responsive design.
- **JavaScript (Kinematics Logic)**:
  - Define a data structure for the arm, including an array of segment lengths and joint angles.
  - Implement an inverse kinematics solver to iteratively adjust the joint angles to minimize the distance between the end effector and the target.
  - Implement forward kinematics to calculate the exact `(x, y)` coordinates of each joint given the current angles.
- **JavaScript (Rendering & Interaction)**:
  - Use the HTML5 Canvas API to render the segments (as lines or thick paths) and joints (as circles).
  - Add event listeners for mouse/touch interactions to update the target position and trigger the IK solver and rendering loop.

## Constructive Solid Geometry Visualizer [[demo](https://rybla.github.io/interpolnet-2/csg-visualizer)]

Visualize Constructive Solid Geometry by letting users intersect, union, and subtract transparent 3D primitives to carve out complex objects.

### Features
- **3D Interactive Canvas**: A 3D environment rendered with Three.js showing transparent geometric primitives.
- **CSG Operations**: Users can perform boolean operations (union, intersection, subtraction) on 3D primitives.
- **Dynamic Manipulation**: Users can select, move, and combine shapes to create complex carved-out objects in real-time.
- **Operation Selection**: A clean, accessible control panel allowing users to toggle which CSG operation to perform between the selected primitives.
- **Real-Time Rendering**: The resulting complex geometry updates immediately after an operation or translation is applied.

### Design Goals
- **Educational Intuition**: Provide a direct, visual, hands-on way to understand how boolean operations can construct intricate 3D models from simple base shapes.
- **Aesthetic Consistency**: Employ a distinct, visually pleasing dark theme with neon-accented, semi-transparent materials that let users see the internal structures of the CSG operations.
- **Responsiveness**: Ensure the application and control panel scale smoothly and maintain usability on both mobile and desktop screens.
- **Interactive Feedback**: Passive hover animations on the UI and clear visual distinction of the resulting carved-out mesh against the base primitives.

### Implementation Plan
- **HTML**: Include a full-screen container for the 3D canvas alongside a floating control panel for selecting the CSG operation (Union, Intersection, Subtraction). Import necessary libraries (`three`, `three-mesh-bvh`, `three-bvh-csg`) via an importmap.
- **CSS**: Apply a cohesive dark theme, managing layout using Flexbox/Grid to keep the UI overlaid and responsive. Add CSS transitions for interactive button states.
- **JavaScript (Three.js & CSG)**:
  - Setup a Three.js scene, camera, lights, and WebGLRenderer.
  - Create initial 3D primitives (e.g., BoxGeometry, SphereGeometry) and convert them into `Brush` objects utilizing `three-bvh-csg`.
  - Implement an interaction layer mapping pointer events (via raycasting or basic drag logic) to update the position of the brushes.
  - Instantiate an `Evaluator` and dynamically perform the selected boolean operation (`ADDITION`, `SUBTRACTION`, `DIFFERENCE`, `INTERSECTION`) whenever a brush moves or the operation setting is changed, rendering the resulting complex mesh clearly to the user.
