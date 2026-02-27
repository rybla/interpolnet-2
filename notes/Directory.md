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
