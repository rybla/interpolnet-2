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

## Riemann Zeta 3D Visualizer [[demo](https://rybla.github.io/interpolnet-2/riemann-zeta-3d)]

An interactive 3D visualization that maps the complex-valued Riemann Zeta function onto a 3D landscape. This tool allows users to explore the topography of the function, particularly focusing on the "critical line" where non-trivial zeros reside.

### Features
- **3D Landscape Visualization**: The complex plane is represented as a 2D surface (Real part $\sigma$ on one axis, Imaginary part $t$ on another axis). The height ($Z$-axis) represents the magnitude $|\zeta(\sigma + it)|$ or the real/imaginary parts.
- **Critical Line Highlighting**: The critical line ($\sigma = \frac{1}{2}$) is distinctly marked, allowing users to visually track the valleys where the function approaches zero.
- **Interactive Exploration**: Users can rotate, pan, and zoom the 3D landscape using mouse or touch controls.
- **Hover Information**: Hovering over the landscape with the cursor displays a readout of the current complex coordinate $s = \sigma + it$ and the computed value of $\zeta(s)$.
- **Dynamic Calculation**: The $\zeta(s)$ values are calculated dynamically using an approximation formula (like the Dirichlet eta function for $\sigma > 0$) directly in JavaScript.
- **Color Mapping**: The surface is colored based on the phase (argument) or magnitude of $\zeta(s)$, creating a striking, rainbow-colored landscape where colors indicate the direction of the complex value.

### Design Goals
- **Mathematical Intuition**: Provide a visceral, spatial understanding of one of the most famous unsolved problems in mathematics (the Riemann Hypothesis).
- **Aesthetic Quality**: Create a beautiful, mesmerizing visualization that looks like an alien landscape, combining math and art.
- **Performance**: Use WebGL (via Three.js) and optimized math functions to ensure the large number of vertices in the landscape can be rendered and interacted with smoothly.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering.
- **Mathematical Engine**:
    - Implement a complex number class or utilize a lightweight library for complex arithmetic (addition, multiplication, exponentiation).
    - Implement an approximation of the Riemann Zeta function. The Dirichlet $\eta$ function ($\eta(s) = (1 - 2^{1-s})\zeta(s)$) is a good choice for the critical strip $0 < \sigma < 1$.
- **Scene Setup**:
    - Create a `PlaneGeometry` with a high number of segments to represent the complex plane grid.
    - Instead of relying on complex custom shaders (which might fail in headless testing environments), calculate the $Z$-position (height) for each vertex on the CPU based on the magnitude $|\zeta(\sigma + it)|$.
    - Map the $\sigma$ and $t$ ranges appropriately (e.g., $\sigma$ from $-2$ to $2$, $t$ from $0$ to $40$).
    - Update the vertex positions dynamically or statically upon initialization.
- **Rendering & Materials**:
    - Use vertex colors to color the landscape based on the phase of the zeta value (using `HSL` where hue is the phase).
    - Add a distinct line geometry to clearly mark the critical line $\sigma = 0.5$.
- **Interaction**:
    - Add `OrbitControls` for camera movement.
    - Implement a `Raycaster` to intersect the plane and calculate the corresponding $s$ coordinate to display in the UI readout.
## Rule 30 Explorer [[demo](https://rybla.github.io/interpolnet-2/rule-30-explorer)]

An interactive one-dimensional cellular automaton explorer that focuses on Rule 30. It demonstrates how a remarkably simple set of binary rules applied to a single starting cell can generate complex, chaotic, and seemingly random fractal patterns (like the Sierpiński triangle-like structures).

### Features
- **Real-Time Generation**: Watch the cellular automaton grow row by row as the rule is applied iteratively.
- **Rule Visualization**: A visual key showing the 8 possible states for a cell and its neighbors (e.g., 111, 110, 101) and the resulting outcome for the next generation based on Rule 30.
- **Interactive Controls**:
    - **Play/Pause**: Control the generation process.
    - **Speed Slider**: Adjust how fast new rows are generated.
    - **Step**: Manually advance the simulation by one generation.
    - **Reset**: Clear the canvas and start over with a single active cell in the center.
- **Infinite Canvas**: The automaton is drawn on a canvas that smoothly scrolls upwards as new rows are added at the bottom, creating a continuous flow of chaotic patterns.

### Design Goals
- **Educational Clarity**: Make the connection between the simple local rule (Rule 30) and the complex global pattern obvious.
- **Aesthetics**: A striking dark theme with a distinct, consistent color scheme. High contrast (e.g., bright neon cyan for active cells against a deep navy or black background) to emphasize the fractal triangles.
- **Mesmerizing Flow**: The continuous generation should feel satisfying and slightly hypnotic.

### Implementation Plan
- **HTML**: A split layout (desktop) or stacked layout (mobile) featuring a control panel (with the rule key and buttons) and a large, central `<canvas>` element for rendering.
- **CSS**: Apply a cohesive dark theme. Use flexbox/grid for responsive layout. Add subtle hover states to controls.
- **JavaScript (Canvas API)**:
    - Maintain a 1D array representing the current state (row).
    - Implement the Rule 30 logic: `next_state = (left ^ (center | right))`.
    - Use `requestAnimationFrame` for a smooth rendering loop.
    - Draw the cells as small rectangles on the canvas. When the canvas fills up, visually scroll the image data up by one cell height and draw the new row at the bottom.

## Circular Motion Sine Wave [[demo](https://rybla.github.io/interpolnet-2/circular-motion-sine-wave)]

An interactive physics and math visualization that directly links the uniform circular motion of a point on a rotating wheel to the generation of a simple harmonic sine wave on an adjacent, continuously scrolling graph.

### Features
- **Rotating Wheel**: A visually distinct circle on the left representing uniform circular motion. A point on the circumference rotates at a constant speed.
- **Scrolling Graph**: An adjacent canvas on the right that continuously plots the vertical displacement (y-value) of the rotating point over time, creating a perfect sine wave.
- **Connecting Line**: A dynamic, glowing horizontal line connecting the point on the wheel directly to the leading edge of the sine wave, visually demonstrating that the wave's height is exactly the point's height.
- **Interactive Controls**: Users can adjust the speed of rotation (frequency) and the radius of the wheel (amplitude) using sliders. The graph updates in real-time.
- **Trace Toggle**: An option to show the underlying angle tracing inside the circle.

### Design Goals
- **Educational Intuition**: Make the connection between circular motion and trigonometry (sine waves) visceral and obvious through direct physical linkage.
- **Aesthetics**: A dark, sci-fi/blueprint aesthetic with high-contrast neon colors (e.g., cyan for the circle, magenta for the wave, yellow for the connecting line).
- **Responsive Layout**: On desktop, the wheel and graph sit side-by-side. On mobile, they resize to maintain the visual connection.

### Implementation Plan
- **HTML Structure**: A responsive container holding a single `<canvas>` element and a control panel for sliders. We will use a single canvas to easily draw the connecting line across the two visual areas.
- **CSS Styling**: A dark theme background, custom-styled range inputs for the controls, and responsive flexbox/grid layout.
- **JavaScript (Canvas API)**:
    - **State Management**: Track current angle, angular velocity, and radius.
    - **Rendering Loop**: Use `requestAnimationFrame` to update the angle, clear the canvas, and redraw.
    - **Drawing the Wheel**: Draw a circle on the left side. Calculate the point coordinates `(x, y) = (cx + R * cos(theta), cy + R * sin(theta))`.
    - **Drawing the Wave**: Maintain an array or buffer of past y-values. Shift them to the right to create a scrolling effect, and draw the line connecting these historical points.
    - **Connecting Link**: Draw a dashed line from the point on the circle to the start of the wave graph.

## Cubic Bezier Curve Interpolation Visualizer [[demo](https://rybla.github.io/interpolnet-2/cubic-bezier-interpolation-visualizer)]

An interactive visualizer that reveals the recursive linear interpolations underlying a cubic Bézier curve. It dynamically shows the moving scaffolding lines that construct the curve point by point as the parameter $t$ varies from 0 to 1.

### Features
- **Draggable Control Points**: Users can interactively drag four control points ($P_0, P_1, P_2, P_3$) on the canvas to reshape the cubic Bézier curve.
- **Dynamic Scaffolding Construction**: Real-time rendering of the three levels of linear interpolation:
  - Level 1: Three lines connecting the four control points.
  - Level 2: Two moving line segments interpolating along the Level 1 lines.
  - Level 3: One moving line segment interpolating along the Level 2 lines.
  - Final Point: A single moving point tracing the actual cubic curve.
- **Interactive Time Control**: A slider to manually adjust the interpolation parameter $t \in [0, 1]$, along with a Play/Pause button for automatic animation.
- **Trail Visualization**: A fading or solid trail indicating the fully drawn path of the Bézier curve.

### Design Goals
- **Intuitive Deconstruction**: Demystify Bézier curves by breaking them down into simple, intuitive linear interpolations, emphasizing De Casteljau's algorithm.
- **Vibrant Aesthetics**: Employ a dark, blueprint-style theme with distinct, glowing neon colors for each level of interpolation to make the recursive structure clear at a glance.
- **Responsive Interactions**: Provide smooth, immediate feedback as points are dragged, ensuring it feels like a physical, mechanical linkage. Mobile-friendly touch support.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` with an absolutely positioned UI panel overlay for the controls (slider and buttons).
- **CSS**: Dark theme styling. Distinct accent colors defined for the UI components and canvas drawing. Responsive Flexbox layout for the control panel.
- **JavaScript (Canvas API)**:
  - Track states for four control points $(x, y)$ and the interpolation parameter $t$.
  - Implement a rendering loop using `requestAnimationFrame`.
  - Draw the recursive linear interpolations explicitly:
    - Draw control points and base lines.
    - Calculate and draw $L_1$ points (interpolation between $P_i$ and $P_{i+1}$).
    - Calculate and draw $L_2$ points (interpolation between $L_1$ points).
    - Calculate and draw the final point (interpolation between $L_2$ points).
  - Trace the entire cubic Bézier curve path statically in the background to show the final shape.
  - Implement mouse/touch event listeners (`pointerdown`, `pointermove`, `pointerup`) to support dragging control points.
## Conway's Game of Life WebGL [[demo](https://rybla.github.io/interpolnet-2/conways-game-of-life-webgl)]

A massive, interactive web-based implementation of Conway's Game of Life utilizing WebGL for high-performance rendering and simulation of millions of cells.

### Features
- **Massive Canvas**: An infinitely panning and zooming canvas running a dense Game of Life simulation, supporting 1024x1024 grid cells.
- **Interactive Stamping Tools**: Users can place single cells, or use pre-configured stamps to instantly spawn complex structures like Gliders and Gosper Glider Guns into the simulation.
- **Simulation Controls**: Play, Pause, and Step functionalities to observe the chaotic evolution of the cellular automaton at different speeds.
- **Pan and Zoom Navigation**: Intuitive mouse and touch controls to explore the massive grid.
- **High-Performance WebGL**: Uses ping-pong framebuffers and fragment shaders to calculate the next generation of cells entirely on the GPU, allowing for massive scale and fluid framerates.
- **Clear Canvas**: A tool to instantly wipe the board clean and start fresh.

### Design Goals
- **Raw Performance**: Demonstrate the power of WebGL for parallel processing by offloading the entire Game of Life rule evaluation to the GPU.
- **Interactive Sandbox**: Provide users with the tools to easily create and observe complex, emergent behaviors without painstakingly drawing them cell by cell.
- **Hacker Aesthetic**: A distinct visual style utilizing a stark black background with glowing, bright neon green cells, evoking classic retro-computing or cyberpunk themes.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` element for the WebGL rendering, overlaid with a floating, responsive control panel for tools and simulation controls.
- **CSS Styling**: A dark theme with distinct neon green accents, glowing hover effects, and a modern, slightly brutalist UI layout.
- **JavaScript (WebGL)**:
    - **Initialization**: Set up a WebGL context with floating-point or unsigned byte textures.
    - **Ping-Pong Textures**: Create two textures (Current State and Next State) and alternatingly bind them as input and output framebuffers.
    - **Simulation Shader**: A fragment shader that reads the 8 neighboring pixels from the Current State texture and applies Conway's rules (survive with 2 or 3 neighbors, birth with 3) to output the Next State.
    - **Display Shader**: A fragment shader that maps the current texture to the screen, applying panning and zooming transformations based on user input.
    - **Tool Logic**: Implement `texSubImage2D` to allow writing specific pixel patterns (stamps) directly into the Current State texture based on mouse clicks and the selected tool.
    - **Game Loop**: A `requestAnimationFrame` loop that runs the simulation shader (when playing) and then runs the display shader to render the result.
## Cross Product Visualizer [[demo](https://rybla.github.io/interpolnet-2/cross-product-visualizer)]

An interactive 3D coordinate system to show how adjusting two vectors dynamically alters the area and orthogonal direction of their cross product.

### Features
- **3D Coordinate System**: A central 3D space with X, Y, and Z axes.
- **Interactive Vectors**: Users can click and drag two initial vectors ($u$ and $v$) around the 3D space to change their direction and magnitude.
- **Real-time Cross Product Visualization**: A third vector ($u \times v$) is automatically calculated and displayed in real-time, pointing in the orthogonal direction according to the right-hand rule.
- **Parallelogram Area**: A semi-transparent parallelogram is drawn between the two initial vectors, and its area is dynamically calculated. The length of the cross product vector perfectly corresponds to this area.
- **Dynamic Readouts**: A UI panel showing the current components of the vectors and the calculated cross product, as well as the area.

### Design Goals
- **Intuitive Understanding**: Make the abstract concept of a cross product geometric and intuitive by physically linking the area of the parallelogram to the magnitude of the resulting orthogonal vector.
- **Engaging Aesthetics**: Use a dark, blueprint or neon aesthetic (e.g., dark background with bright cyan, magenta, and yellow vectors) to make the math look striking.
- **Responsive Interactions**: Ensure the visualizer works seamlessly on both desktop and mobile devices, utilizing touch events for dragging points.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` with an absolutely positioned UI panel overlay for the controls and readouts.
- **CSS Styling**: A dark theme background, custom-styled UI overlay, and responsive flexbox/grid layout.
- **JavaScript (Three.js)**:
  - Setup a Three.js scene, camera, renderer, and lights.
  - Create the coordinate axes and a grid helper.
  - Render vectors $u$ and $v$ as arrows (`ArrowHelper` or custom meshes).
  - Use `DragControls` or a custom raycaster implementation to allow dragging the endpoints of $u$ and $v$.
  - Dynamically calculate the cross product vector and update its corresponding arrow in the scene.
  - Draw the parallelogram defined by $u$ and $v$ using a custom `BufferGeometry` and update it dynamically.

## Galton Board Visualizer [[demo](https://rybla.github.io/interpolnet-2/galton-board-visualizer)]

This demo visually calculates binomial coefficients by routing falling physical balls through a Galton board peg maze to form a normal distribution. As a ball falls through each row of pegs, it has a 50% chance of bouncing left or right. The resulting distribution of balls in the collection bins perfectly mirrors the theoretical binomial distribution for $n$ trials (where $n$ is the number of peg rows), which in turn approximates the Gaussian normal distribution curve.

Features include:
- An interactive HTML5 Canvas displaying the peg maze, falling balls, and collection bins.
- Dynamic control over the number of peg rows (1 to 20), instantly re-configuring the board and resetting the simulation.
- A "Simulation Speed" slider to control the rate at which balls are dropped and fall.
- A continuous overlaid line graph representing the theoretical perfect binomial distribution, scaling as balls fill the bins.
- A responsive layout that centers the board and scales pegs based on available screen space and row count.
- Balls that stack realistically within their respective bins using simple rigid-body physics for visual flair.
- An automatic flush system when a bin reaches maximum capacity to allow for continuous demonstration.

The implementation relies on an explicit physics loop in JavaScript running with `requestAnimationFrame`. Balls are tracked with position, velocity, and state (falling vs. settled). Collision detection is performed radially against the mathematically positioned peg grid. When a ball passes the final row, it determines its destination bin and transitions to a settled stack state. A secondary loop calculates the combinations for the binomial distribution curve plotted over the bins.
## Modular Arithmetic Clock [[demo](https://rybla.github.io/interpolnet-2/modular-arithmetic-clock)]

An interactive physical clock face visualization that represents modular arithmetic, where addition and multiplication warp around the dial continuously.

### Features
- **Interactive Clock Face**: A circular dial displaying the numbers from 0 to N-1, where N is the modulus.
- **Dynamic Modulus Control**: A slider allowing users to change the modulus (N) dynamically, seamlessly re-rendering the clock face.
- **Addition & Multiplication Modes**: Users can select between addition and multiplication operations to see how they behave in modular arithmetic.
- **Visual Operations**:
  - For addition `(a + b) mod N`: An animated arc traces from 0 to `a`, and then from `a` to the result, wrapping around the clock face if necessary.
  - For multiplication `(a * b) mod N`: Multiple arcs trace the repeated addition of `a`, `b` times, looping around the dial to arrive at the final modulo result.
- **Interactive Input**: Users can select the operands `a` and `b` via input fields or sliders.
- **Continuous Warping Animation**: Smooth, satisfying animations that emphasize the "wrap-around" nature of modular arithmetic.

### Design Goals
- **Intuitive Understanding**: Demystify modular arithmetic (often called "clock math") by directly using its most common real-world analogy.
- **Engaging Aesthetics**: A retro-futuristic, neon-infused color scheme (e.g., deep dark blue background with bright cyan, magenta, and yellow accents) to make the math visually striking.
- **Responsiveness**: Ensure the clock and controls scale perfectly for both desktop and mobile devices.

### Implementation Plan
- **HTML Structure**: A two-panel responsive layout with a control panel on one side (inputs, sliders, operation toggles) and a large `<canvas>` on the other for the clock face.
- **CSS Styling**: Apply the neon color palette, with glowing effects for active numbers and paths. Implement flexbox/grid for a responsive design.
- **JavaScript**:
  - **State Management**: Track the modulus `N`, operands `a` and `b`, and the selected operation.
  - **Rendering**: Use HTML5 Canvas to draw the clock face, placing numbers evenly around the circumference.
  - **Animation Logic**: Calculate the paths for addition and multiplication. Use `requestAnimationFrame` to animate drawing the arcs and paths wrapping around the circle. Use easing functions for smooth motion.
## Markov Chain Frog [[demo](https://rybla.github.io/interpolnet-2/markov-chain-frog)]

A web-based interactive visualization of a Markov Chain, conceptualized as a network of Lilypads. A frog jumps between these Lilypads, and the jumps are determined by weighted probability arrows connecting them.

### Features
- **Interactive Lilypads (States)**: Users can click on the canvas to add new Lilypads to the pond, representing the states in the Markov chain.
- **Weighted Probability Arrows (Transitions)**: Users can drag from one Lilypad to another to create directed arrows representing transition probabilities.
- **Weight Adjustment**: A floating UI panel allows users to select an arrow and adjust its transition weight. The weights outgoing from each Lilypad are automatically normalized to sum to 1 (or 100%).
- **Animated Frog (The Process)**: A frog character sits on one Lilypad. A "Step" button makes the frog jump to the next Lilypad based on the defined probabilities. An "Auto-Jump" toggle lets the frog jump continuously at a set interval.
- **Path Highlighting**: When the frog jumps, the specific arrow it traveled across lights up briefly.
- **State Distribution Chart**: A side panel displays a bar chart showing the frequency of visits to each Lilypad, visually demonstrating the stationary distribution (if it exists) as the frog makes many jumps.

### Design Goals
- **Intuitive Metaphor**: Use the playful, concrete metaphor of a frog and lilypads to explain the abstract mathematical concept of state transitions and probabilities in a Markov chain.
- **Engaging Aesthetics**: A vibrant, nature-inspired "pond" theme. Deep blues/greens for the water, bright green for the Lilypads, and a distinct, cute frog character.
- **Direct Manipulation**: Building the Markov chain should feel like drawing a graph or a mind map, with immediate visual feedback when weights are changed.
- **Clear Feedback**: The normalization of probabilities should be visually apparent (e.g., arrow thickness changes based on relative weight).

### Implementation Plan
- **HTML Structure**: A full-screen container holding an HTML5 `<canvas>` for the pond, an overlay `<div>` for the control panel (adding states, adjusting weights, play/pause), and a sidebar `<div>` for the state distribution chart.
- **CSS Styling**: A cohesive "pond" color palette. The UI panels should have a translucent, frosted glass effect so the pond is still visible underneath.
- **JavaScript Core**:
    - **State Management**: A graph data structure where nodes are Lilypads (with `x`, `y` coordinates and a `visitCount`) and edges are transitions (with `source`, `target`, and `weight`).
    - **Canvas Rendering**: Use `requestAnimationFrame` to draw the pond background, Lilypads, arrows (using Bezier curves for aesthetics and to handle bidirectional links), and the frog.
    - **Interaction Handling**: Pointer events to handle creating Lilypads (clicking empty space), creating arrows (dragging between Lilypads), and selecting arrows to adjust weights.
    - **Markov Logic**: A function that takes the frog's current Lilypad, looks at the outgoing normalized probabilities, generates a random number between 0 and 1, and selects the next Lilypad accordingly.
    - **Animation**: Smoothly animate the frog's jump along the Bezier curve of the chosen arrow.
    - **Chart Update**: Update the DOM-based bar chart whenever the frog lands on a Lilypad.

## Voronoi Diagram Sweep-Line [[demo](https://rybla.github.io/interpolnet-2/voronoi-sweep-line)]

An interactive HTML5 Canvas demo visualizing Fortune's algorithm, a sweep-line algorithm for generating Voronoi diagrams. Users can place random seed points on the canvas, triggering a horizontal sweep line that dynamically constructs the intersecting parabolic beach lines and traces the boundaries of the resulting Voronoi cells.

### Features
- **Interactive Point Placement**: Clicking anywhere on the canvas dynamically adds a new seed point.
- **Continuous Sweep-Line Animation**: A horizontal sweep line moves continuously downwards. When a new point is added, its effect on the sweep line and beach line is calculated in real time.
- **Dynamic Beach Line Rendering**: Above the sweep line, the complex intersection of parabolas (the "beach line") is calculated and drawn continuously, showing how each seed's sphere of influence grows.
- **Voronoi Cell Filling**: As the sweep line moves, the regions defined by the beach line are filled with distinct colors corresponding to their seed points, persistently drawing the final Voronoi diagram on a background canvas.
- **Dual Canvas System**: Utilizes a back canvas for persistent painting of the cell colors and boundaries, and a front transparent canvas for rendering the dynamic sweep line, beach line, and seed points smoothly.

### Design Goals
- **Algorithm Visualization**: Make the complex mechanics of Fortune's algorithm (sweep lines and parabolic beach lines) visually intuitive and understandable.
- **Striking Aesthetics**: Employ a dark theme with vibrant, randomly generated neon colors for the Voronoi cells and a bright, contrasting color for the sweep line and beach line to make the math look striking.
- **Performance**: Maintain a smooth 60fps animation even as the number of points and the complexity of the beach line increase, leveraging a dual-canvas optimization.
- **Responsive**: Ensure the visualization works seamlessly across desktop and mobile sizes, recalculating properly if the window is resized.

### Implementation Plan
- **HTML Structure**: A full-screen container with two overlapping `<canvas>` elements (`background-canvas` and `foreground-canvas`).
- **CSS Styling**: A dark theme, utilizing absolute positioning to perfectly overlap the canvases.
- **JavaScript Core**:
    - **State Management**: Track an array of `seeds` (x, y, color) and the current `sweepY` position.
    - **Mathematics**: Implement functions to calculate a parabola given a focus (seed) and directrix (sweep line). Implement a function to find the intersections of these parabolas to determine the valid segments forming the beach line.
    - **Rendering Loop**: Use `requestAnimationFrame`.
        - Increment `sweepY`.
        - For every pixel across the width (or a sampled resolution for performance), calculate the highest parabola `y` value to determine the beach line.
        - **Background Canvas**: Draw the vertical distance between the previous frame's beach line and the current frame's beach line, coloring it according to which seed "owns" that section of the beach line.
        - **Foreground Canvas**: Clear the canvas. Draw the seed points, the straight horizontal sweep line, and the complex beach line curve.
    - **Interaction**: Handle pointer events to add new points, generating a random bright color for each.

## Minimax Saddle Point Surface [[demo](https://rybla.github.io/interpolnet-2/minimax-saddle-point-surface)]

An interactive 3D multivariable calculus visualization where a rolling ball naturally settles into the minimax saddle point.

### Features
- **3D Saddle Surface**: A parametric surface representing a hyperbolic paraboloid (e.g., $f(x, z) = x^2 - z^2$).
- **Minimax Dynamics**: A rolling ball is simulated using a custom physics loop based on gradient descent along the $x$-axis and gradient ascent along the $z$-axis, naturally finding the saddle point.
- **Interactive Dragging**: Users can drag the ball to different starting positions using a Raycaster, observing how it always returns to the saddle point.
- **Visual Feedback**: The surface is rendered with a wireframe or grid texture to clearly show the curvature, while the ball is distinctly colored.

### Design Goals
- **Educational Intuition**: Provide a visceral, geometric understanding of what a saddle point is in multivariable calculus.
- **Engaging Aesthetics**: Use a clean, scientific aesthetic (dark background with glowing neon grid lines).
- **Responsiveness**: Ensure the 3D canvas scales to fit any screen size and supports touch interactions for dragging the ball.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering.
- **Scene Setup**:
    - A parametric geometry to draw the saddle surface.
    - A sphere mesh representing the ball.
    - Orbit controls for camera manipulation.
- **Physics Simulation**:
    - Update the ball's $(x, z)$ coordinates each frame based on the gradient of the surface function $f(x, z)$.
    - The new $y$ coordinate is computed as $f(x, z)$.
- **Interaction Logic**:
    - Implement a raycaster to allow the user to grab and drag the ball across the surface.
    - Disable physics updates while the ball is being dragged, resuming once released.
## Golden Spiral [[demo](https://rybla.github.io/interpolnet-2/golden-spiral)]

An interactive visualization demonstrating how the Fibonacci sequence recursively divides a golden rectangle into smaller squares, perfectly tracing the path of a logarithmic spiral.

### Features
- **Golden Rectangle Recursion**: Visualizes a large starting golden rectangle that is iteratively divided into a square and a smaller golden rectangle.
- **Logarithmic Spiral**: An animated spiral perfectly traces through the opposite corners of the drawn squares, illustrating the golden spiral.
- **Continuous Drawing Animation**: The division of squares and the drawing of the spiral arcs are animated to visually demonstrate the construction process.

### Design Goals
- **Mathematical Clarity**: Clearly show the geometric connection between the Fibonacci sequence (squares) and the golden spiral.
- **Aesthetic**: Use a beautiful, cohesive color scheme (e.g., a dark background with golden/yellow strokes for the spiral and squares).
- **Responsive**: Ensure the canvas scales perfectly across different device sizes, centering the spiral within the view.

### Implementation Plan
- **HTML**: Include a single, full-screen `<canvas>` element.
- **CSS**: Apply a dark background to the page, reset margins, and configure the canvas to fill the entire viewport.
- **JavaScript (Canvas API)**:
    - Compute the optimal starting dimensions of the golden rectangle based on the screen size.
    - Implement a `requestAnimationFrame` loop to animate the drawing process.
    - Recursively draw scaled-down squares and quarter-circle arcs, applying the necessary rotation and translation to correctly position them according to the Fibonacci spiral geometry.
## Galton Board Skew [[demo](https://rybla.github.io/interpolnet-2/galton-board-skew)]

An interactive Galton board where users can skew the peg probabilities to watch the resulting distribution shift from normal to Poisson.

### Features
- **Adjustable Skew Probability**: A dynamic slider allows users to change the probability $p$ that a ball bounces right at each peg. By default $p = 0.5$ yielding a normal distribution, but skewing it demonstrates the Poisson approximation of the binomial distribution.
- **Continuous Simulation Loop**: Balls continuously drop from the top, bouncing against a grid of pegs, building a live histogram in the bins below.
- **Live Updates**: Changing the probability dynamically updates the trajectory of falling balls immediately without stopping the simulation.
- **Dynamic Bins**: Bins automatically expand and highlight when balls enter, and visually decay to clearly show the distribution accumulating over time.

### Design Goals
- **Educational Intuition**: Provide a visceral, real-time visualization of statistical concepts (Binomial, Normal, and Poisson distributions) using an engaging physical analogy.
- **Aesthetics**: Employ a clean, dark "neon" color scheme with bright, glowing balls and pegs for a modern look.
- **Responsive & Mobile Friendly**: Ensure the visualization canvas automatically resizes and positions correctly across any screen.

### Implementation Plan
- **HTML Structure**: A full-screen container with a single `<canvas>` element for the simulation, and an overlaid translucent `<div>` control panel for the skew slider.
- **CSS Styling**: A dark theme, absolute positioning for the overlay, customized slider styles with hover states.
- **JavaScript Core**:
    - **State Management**: Track falling `balls` array, a static grid of `pegs`, and `bins` counting the landed balls.
    - **Mathematics**: Calculate the physical position of pegs in an equilateral triangle grid. Update ball velocities and positions with gravity.
    - **Collision Logic**: When a ball intersects a peg radius, resolve the collision and impart a horizontal bounce dictated by the skewed probability $p$.
    - **Rendering Loop**: Use `requestAnimationFrame` to draw the dark background, pegs, balls, and the resulting histogram bars at the bottom.
    - **Interaction**: Pointer events to capture slider changes and update the $p$ value in the simulation state in real time.
## Huffman Entropy Calculator [[demo](https://rybla.github.io/interpolnet-2/huffman-entropy-calculator)]

An entropy calculator that visually compresses a string of text using a dynamically generated Huffman coding tree based on character frequency.

### Features
- **Real-Time Analysis**: As the user types into a text input field, the application instantly calculates character frequencies, probabilities, and the Shannon entropy of the text.
- **Dynamic Huffman Tree**: A visual representation of the Huffman coding tree is generated and updated in real-time.
- **Compression Metrics**: Displays the original size (in bits, assuming 8 bits/char), the compressed size (in bits, using the generated Huffman codes), and the resulting compression ratio.
- **Animated Tree Construction**: Smooth transitions when nodes are added, merged, or repositioned within the tree to help visualize the algorithm's bottom-up building process.
- **Interactive Code Table**: A dynamic table showing each character, its frequency, and its assigned variable-length binary Huffman code.
- **Node Highlighting**: Hovering over a character in the table or text input highlights the corresponding path from the root to the leaf node in the visual tree.

### Design Goals
- **Educational Value**: Demystify the concept of data compression and entropy by providing a tangible, interactive visualization of one of the most fundamental algorithms.
- **Clarity and Aesthetics**: Use a clean, modern interface with a distinct color palette (e.g., deep background with bright accent colors for nodes and edges) to make the tree structure easily readable.
- **Responsiveness**: Ensure the tree layout algorithm can handle varying text lengths and adapt to different screen sizes, gracefully scaling or allowing panning/zooming if the tree becomes too large.

### Implementation Plan
- **HTML Structure**: A layout featuring a text input area, a statistics/metrics panel, a character code table, and a large central canvas or SVG area for the tree visualization.
- **Data Structures (JavaScript)**:
    - Implement a `MinHeap` or priority queue to efficiently build the Huffman tree.
    - Implement a `HuffmanNode` class to represent internal nodes and leaves.
- **Algorithms**:
    - **Frequency Counter**: Parse the input string to count character occurrences.
    - **Tree Builder**: The standard Huffman algorithm: create leaf nodes, repeatedly extract the two minimum frequency nodes, and merge them under a new parent node until one root remains.
    - **Code Generator**: Traverse the tree from root to leaves, assigning '0' for left branches and '1' for right branches, to determine the binary code for each character.
    - **Entropy Calculation**: Implement the Shannon entropy formula: $H(X) = - \sum p_i \log_2(p_i)$.
- **Visualization Engine**:
    - Use HTML5 Canvas or SVG (SVG might be easier for handling interactions and CSS transitions on nodes).
    - Implement a tree layout algorithm (like Reingold-Tilford) to calculate the $(x, y)$ coordinates for each node to ensure a clean, non-overlapping display.
    - Animate node movements using CSS transitions or a `requestAnimationFrame` loop.
## Dynamic Slope Field [[demo](https://rybla.github.io/interpolnet-2/dynamic-slope-field)]

An interactive mathematical visualization tool where users can explore differential equations by interacting with a real-time, dynamic slope field.

### Features
- **Dynamic Slope Field Grid**: Displays a background grid of slope lines, calculated in real-time based on a user-provided differential equation ($dy/dx = f(x, y)$). The field uses color mapping to indicate the magnitude (steepness) of the slope at each point.
- **Interactive "Ink" Dropping**: Users can click or tap anywhere on the canvas to drop virtual "ink" particles. These particles are then animated over time, tracing the specific solution curves (integral curves) through the slope field originating from those initial coordinate drops.
- **Real-Time Equation Parsing**: A floating control panel provides a text input for the user to type in their own equations (e.g., `Math.sin(x) * y`, `-x/y`, `x - y`). As the user types, the background slope field instantly re-renders to reflect the new differential equation.
- **Continuous Simulation Loop**: The ink drops leave a persistent or slowly fading trail as they are pushed across the canvas by the calculated slopes using a numerical method solver (like Euler's or Runge-Kutta).
- **Responsive Canvas**: The slope field and particle coordinate system automatically adjust to window resizing, ensuring a consistent visual experience on both mobile and desktop screens.

### Design Goals
- **Educational Sandbox**: Provide a highly intuitive, tactile way for students and enthusiasts to understand the relationship between a differential equation, its slope field, and the family of specific solution curves. By physically "dropping" points, the abstract concept of initial value problems becomes concrete.
- **Striking Visuals**: Utilize a dark, scientific theme with glowing, neon accents. The background field should be subtle but clear, while the active ink trails should be bright and distinct (e.g., cyan, magenta, and bright yellow), creating a beautiful flow-art effect over time.
- **Fluid Performance**: Leverage `requestAnimationFrame` and optimized canvas rendering to ensure that evaluating the equation at hundreds of grid points and animating dozens of particles simultaneously runs at a smooth 60 frames per second.

### Implementation Plan
- **HTML/CSS Structure**: A full-screen `<canvas>` element for the rendering and an absolutely positioned, translucent floating control panel containing the equation input text field.
- **Math Evaluation Engine**: A custom or restricted evaluation function that safely parses the user's string input into a callable JavaScript function `f(x, y)`, making `Math` object methods available (like `sin`, `cos`, `exp`).
- **Rendering Loop (Canvas API)**:
    - **Grid Calculation**: Compute the slope $dy/dx$ at evenly spaced grid points across the visible canvas coordinates. Draw short line segments indicating the angle of the slope. Map the slope magnitude to a color gradient for visual depth.
    - **Particle System**: Maintain an array of active ink particles (position `(x, y)` and color).
    - **Animation**: On each frame, iterate through particles. Use a numerical method (e.g., Euler's: $x_{new} = x + \Delta x$, $y_{new} = y + f(x,y)\Delta x$, suitably scaled to screen time/pixels) to update their positions. Draw the new segments of their trails.
- **Interaction Logic**: Handle pointer events (`pointerdown`, `pointermove`) on the canvas to instantiate new particles at the mapped coordinate space. Listen to input events on the text field to trigger a full re-evaluation and redraw of the background grid.
## Penrose Tiling Editor [[demo](https://rybla.github.io/interpolnet-2/penrose-tiling-editor)]

## Penrose Tiling Editor [[demo](https://rybla.github.io/interpolnet-2/penrose-tiling-editor)]

An interactive HTML5 canvas visualization of a gapless Penrose tiling generated via recursive subdivision (deflation) of kites and darts. Users can drag vertices to symmetrically deform the shapes while maintaining mathematically sound 10-fold symmetry.

### Features
- **Penrose P2 Tiling**: A continuous surface filled with kites and darts without gaps or periodic repetition.
- **Recursive Subdivision (Deflation)**: The initial configuration (e.g., a "sun" pattern) is subdivided into smaller tiles using the golden ratio rule, generating the intricate fractal-like Penrose tiling structure.
- **Symmetric Deformation**:
    - **Interactive Vertices**: Users can click and drag specific points (vertices) on the tiling.
    - **10-Fold Symmetry**: As one vertex is moved, its corresponding vertices under the 10-fold rotational symmetry group ($D_{10}$) are simultaneously and proportionally displaced.
    - **Gapless Preservation**: The deformation mathematically recalculates the adjacent edges and shapes to ensure the tiling remains continuous, without overlaps or gaps.
- **Responsive Canvas**: The canvas scales to fill the viewport and adapts to mobile screens, ensuring the tiling remains centered.

### Design Goals
- **Mathematical Elegance**: Visualize the relationship between Penrose tilings, the golden ratio, and 10-fold symmetry in an intuitive, physical manner.
- **Mesmerizing Interactivity**: The synchronized deformation of dozens of tiles creates a kaleidoscopic, satisfying visual effect.
- **Aesthetics**: Employ a cohesive, distinct color palette for the kites and darts (e.g., bright orange/coral and teal) against a dark background to make the geometric shapes pop.

### Implementation Plan
- **HTML/CSS**: A full-screen `<canvas>` element with a dark theme background (`#1e272e`), and custom CSS variables for tile colors (`#ff7e67`, `#00d2d3`).
- **Mathematical Engine (JavaScript)**:
    - **Tile Definitions**: `Kite` and `Dart` classes defining their vertices relative to an origin.
    - **Deflation Algorithm**: A recursive function to substitute a kite or dart with smaller kites and darts based on the substitution rules involving the golden ratio $\phi = \frac{1+\sqrt{5}}{2}$.
- **Rendering Loop**:
    - Use HTML5 Canvas API within a `requestAnimationFrame` loop.
    - Draw filled paths for each tile and stroke their edges.
    - Render interactable vertices as small, glowing circles.
- **Interaction Logic**:
    - Pointer events (`pointerdown`, `pointermove`, `pointerup`) to handle dragging.
    - When a vertex is dragged, calculate the displacement vector.
    - Identify the symmetry group of the vertex relative to the origin.
    - Apply the rotated displacement vectors (by $k \times 36^\circ$) to all corresponding symmetric vertices to update the entire tiling's geometry in real time.

## Raytracer Pixel Stepper [[demo](https://rybla.github.io/interpolnet-2/raytracer-pixel-stepper)]


An interactive 2D visualization that demystifies the core algorithm of raytracing by stepping through the calculation of a single pixel's color. The demo explicitly shows the primary ray cast from the camera, the mathematical intersection point on a spherical obstacle, the calculation of the surface normal, and the casting of a shadow ray to check for light source occlusion.

### Features
- **2D Sandbox View**: A top-down, 2D representation of a 3D scene.
  - **Camera (Eye)**: The origin point of the ray.
  - **Image Plane (Pixel)**: The virtual screen the ray passes through.
  - **Obstacle (Sphere)**: A 2D circle representing a 3D sphere in the scene.
  - **Light Source**: A point light that illuminates the scene.
- **Interactive Elements**: Users can click and drag the light source and the obstacle sphere to set up custom scenarios.
- **Step-by-Step Execution**: A "Step" button controls the pace of the visualization, advancing through the distinct phases of the raytracing algorithm:
  1.  **Primary Ray**: A ray is cast from the camera, through the pixel, out into the scene.
  2.  **Intersection**: The mathematical point of intersection (if any) with the obstacle is calculated and highlighted.
  3.  **Normal Calculation**: The surface normal vector at the intersection point is drawn.
  4.  **Shadow Ray**: A secondary ray is cast from the intersection point towards the light source.
  5.  **Shading**: If the shadow ray reaches the light unoccluded, the pixel is shaded based on Lambertian reflectance (the dot product of the normal and the light vector). If occluded (or if the primary ray misses), the pixel is shaded black or background color.
- **Real-time Log**: A text readout panel that dynamically updates with the current step's mathematical explanation and calculations (e.g., intersection coordinates, normal vector components, shading intensity).

### Design Goals
- **Educational Breakdown**: Take a complex, continuous process (rendering an entire image) and isolate it down to its fundamental atomic unit (a single ray path) to make it comprehensible.
- **Visual Causality**: Directly link the geometric relationships (angles, distances) to the final output color of the pixel.
- **Aesthetics**: A "blueprint" or "tactical screen" visual style. Dark background with glowing, high-contrast vectors (e.g., cyan for primary ray, magenta for normal, yellow for shadow ray).

### Implementation Plan
- **HTML Layout**: A split-screen or responsive flexbox layout. A large main `<canvas>` element for the 2D sandbox, and a side panel containing the "Step" button and the readout log.
- **JavaScript Core**:
  - Implement basic 2D vector math functions (add, subtract, dot product, normalize).
  - Implement a mathematically sound line-circle intersection algorithm to find the exact hit point.
  - Create a State Machine (`IDLE`, `SHOOTING_RAY`, `CALCULATING_NORMAL`, `SHOOTING_SHADOW`, `SHADING`) to govern the progression of the animation.
- **Canvas Rendering**:
  - Use `requestAnimationFrame` to smoothly draw the expanding rays and vectors during transitions.
  - Redraw static scene elements (camera, grid, obstacles) on each frame.
- **Interaction**:
  - Attach pointer events to the canvas to allow dragging the light and the obstacle, ensuring they update the scene state and reset the step-through process.

## WebGL Gray-Scott Turing Patterns [[demo](https://rybla.github.io/interpolnet-2/webgl-gray-scott-turing-patterns)]

An interactive WebGL simulation of the Gray-Scott reaction-diffusion model where users can directly "paint" chemical food onto the canvas to spawn and grow organic, mesmerizing Turing patterns. The simulation is entirely computed and rendered on the GPU for high-performance visual feedback.

### Features
- **GPU-Accelerated Simulation**: Utilizes WebGL fragment shaders and a ping-pong framebuffer architecture to calculate the reaction-diffusion equations across millions of pixels simultaneously at 60 FPS.
- **Interactive "Painting"**: Users can click/tap and drag across the canvas to actively inject chemical food into the simulation. This dynamic interaction seeds new pattern growth exactly where the user strokes.
- **Organic Turing Patterns**: The continuous simulation mathematically models the reaction between two hypothetical chemicals, naturally forming complex, self-organizing structures such as spots, stripes, and labyrinthine waves.
- **Responsive WebGL Canvas**: The simulation scales dynamically to perfectly fit any window size or mobile screen, mapping touch and mouse coordinates accurately to the texture space.

### Design Goals
- **Tactile Exploration**: Transform a complex mathematical model into an intuitive, tactile toy. The user should feel like they are cultivating a digital petri dish.
- **Mesmerizing Visuals**: Employ a striking and distinct color mapping—for example, a dark, deep violet or black background with vibrant, neon cyan or bright green patterns. The high contrast will make the organic growth visually pop.
- **Performance First**: Since the simulation requires multiple calculation passes per frame to remain stable and visually interesting, offloading the work entirely to the GPU is critical to ensure a fluid experience on both desktop and mobile devices.

### Implementation Plan
- **HTML/CSS Structure**: A straightforward, full-screen `<canvas>` element for the WebGL context, accompanied by a subtle, animated text overlay providing instructions (e.g., "Paint chemical food...").
- **WebGL Architecture (JavaScript)**:
    - **Initialization**: Set up a WebGL context, ensuring support for necessary floating-point textures to store the chemical concentrations accurately.
    - **Ping-Pong Framebuffers**: Create two framebuffer objects (FBOs) with attached textures. The simulation will read from one texture, perform the reaction-diffusion calculations, and write the results to the other texture, swapping their roles each frame.
    - **Simulation Shader**: A fragment shader that implements the core Gray-Scott math, utilizing uniforms for the grid size, time step, and the user's interactive "brush" position.
    - **Render Shader**: A separate fragment shader responsible for taking the current concentration data from the active FBO and mapping it to the vibrant color palette for final display on the screen.
- **Interaction Loop**:
    - Attach standard pointer events (`pointerdown`, `pointermove`, `pointerup`) to the canvas.
    - When the pointer is active, pass its normalized coordinates to the simulation shader as uniform variables.
    - The simulation shader will add a "splat" of chemical concentration at those coordinates, simulating the act of painting food.
## L-System Fractal Trees [[demo](https://rybla.github.io/interpolnet-2/l-system-fractal-trees)]

An interactive grammar ruleset editor where specific axiomatic string expansions instantly render as branching L-system fractal trees. This demo allows users to dynamically build complex organic shapes through simple, recursive string replacement rules.

### Features
- **Interactive Grammar Editor**: Input fields for an initial Axiom and a dynamic list of replacement rules (character mapping to replacement string).
- **Instant Rendering**: As the user types or modifies the rules, the L-system string is expanded and instantly rendered onto a canvas.
- **Branching Fractals**: The expanded string is interpreted to generate intricate, branching fractal tree structures.
- **Visual Feedback**: The interface provides immediate visual feedback, allowing for rapid experimentation and discovery of new fractal patterns.

### Design Goals
- **Educational Exploration**: To provide a hands-on, visual way to understand Lindermayer systems and how simple recursive rules can lead to complex, nature-like structures.
- **Responsive & Modern**: A clean, dark-themed UI that focuses the user's attention on the colorful fractal drawing, ensuring the layout works seamlessly on both desktop and mobile devices.
- **Fluid Interactivity**: Ensure the recursive string expansion and canvas rendering are optimized for real-time updates as the user edits the grammar.

### Implementation Plan
- **HTML Structure**: A responsive split layout with a control panel on one side (or stacked on mobile) containing the Axiom input and dynamic rule inputs, and a main `<canvas>` area on the other.
- **CSS Styling**: A dark background with neon accents for the UI elements and the fractal drawing itself to make it pop. Passive and active animations will enhance the interactive elements.
- **JavaScript Logic**:
    - **L-System Engine**: A string rewriting algorithm that takes the Axiom and applies the Rules.
    - **Canvas Renderer**: An interpreter that reads the expanded string character by character, dynamically mapping them to canvas drawing operations to create branches and structures.
    - **Event Listeners**: Attach listeners to the input fields to trigger the L-System expansion and canvas redraw on every change.
## Perlin Noise Visualizer [[demo](https://rybla.github.io/interpolnet-2/perlin-noise-visualizer)]

An interactive visualization that demystifies the generation of 2D Perlin noise. It reveals the underlying grid of random gradient vectors and demonstrates how dot products and smoothed bilinear interpolation combine to create organic, continuous noise patterns.

### Features
- **Gradient Grid Overlay**: A visible grid displaying the pseudorandom 2D gradient vectors at each lattice point.
- **Interactive Probe**: Users can move their cursor over the noise map. A floating panel shows the exact calculation for the hovered point, displaying its position within the grid cell, the vectors from the four corners, the dot products, and the interpolation weights.
- **Interpolation Toggle**: A control to switch between linear interpolation (creating harsh artifacts) and smoothstep/smootherstep interpolation (producing the organic look characteristic of Perlin noise).
- **Z-Axis Slicing (Time)**: An automatic animation that moves through the 3rd dimension (Z-axis or Time), showing how the 2D slice smoothly morphs as the 3D gradient space is traversed.
- **Resolution Control**: A slider to adjust the grid size (frequency) of the noise, showing the difference between low-frequency and high-frequency noise.

### Design Goals
- **Educational Breakdown**: Break down the seemingly complex Perlin noise algorithm into understandable visual steps: grid, gradients, dot products, and interpolation.
- **Visual Clarity**: Use a clean, tech-inspired aesthetic (e.g., dark background with bright, contrasting colors like cyan for vectors and a grayscale heatmap for the noise values) to distinguish the mathematical components from the resulting noise.
- **Real-Time Feedback**: Ensure the noise map and the interactive probe update instantly as the user tweaks parameters or moves their mouse.

### Implementation Plan
- **HTML Structure**: A main `<canvas>` for rendering the noise map and vectors, alongside a floating UI control panel and an interactive probe overlay.
- **Styling (CSS)**: Apply a cohesive dark theme with neon accents. Use absolute positioning for the probe and control panel.
- **JavaScript Core**:
    - **Perlin Algorithm**: Implement a classic 2D/3D Perlin noise algorithm.
    - **Rendering**: Use the HTML5 Canvas API. To ensure performance, write the noise values directly to an `ImageData` buffer for the background heatmap. Draw the gradient vectors using `ctx.lineTo` and `ctx.stroke`.
    - **Interaction**: Listen to `mousemove` events to update the interactive probe's position and readout, calculating the specific dot products and weights for the current pixel on the fly.
## Boids Flocking Simulation [[demo](https://rybla.github.io/interpolnet-2/boids-flocking)]

An interactive visualization of a Boids algorithm, simulating the flocking behavior of birds. Users can dynamically tweak the weights of separation, alignment, and cohesion to observe how these simple local rules generate complex, emergent flocking patterns.

### Features
- **Real-Time Flocking Simulation**: A canvas displaying numerous "boids" (bird-oid objects) that move autonomously.
- **Interactive Weight Controls**: Sliders to adjust the exact weights of the three core boid behaviors in real-time:
  - **Separation**: Steer to avoid crowding local flockmates.
  - **Alignment**: Steer towards the average heading of local flockmates.
  - **Cohesion**: Steer to move toward the average position of local flockmates.
- **Visual Feedback**: The simulation reacts instantly to slider changes, allowing users to see the flock transition between chaotic swarms, orderly flocks, and tight clusters.
- **Mobile-Friendly Layout**: A responsive design with controls that stack neatly on smaller screens while keeping the simulation visible.

### Design Goals
- **Educational Exploration**: Provide a hands-on way to understand how complex, synchronized group behaviors emerge from simple individual rules without central coordination.
- **Aesthetics**: Use a clean, dark theme with bright, distinct colors for the boids (e.g., neon blue or green against a dark background) to make the movement paths clear and engaging.
- **Fluid Performance**: Ensure the simulation runs smoothly by efficiently calculating distances and velocities for all boids.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` for the simulation and a floating or stacked control panel `div` containing range inputs (sliders) for the three weights.
- **CSS Styling**: A dark color scheme. Sliders styled with passive/active hover and focus animations to indicate interactivity. Flexbox/Grid for responsive placement of the control panel.
- **JavaScript Core**:
  - Implement the Boids algorithm. Each boid updates its velocity based on its neighbors within a certain radius.
  - Apply the user-controlled weights to the separation, alignment, and cohesion vectors before updating a boid's acceleration and velocity.
  - Render the boids as simple shapes (e.g., triangles pointing in the direction of velocity) on the canvas.
  - Hook up event listeners to the sliders to update the weight variables used in the simulation loop.
## Barycentric Coordinate Rasterization [[demo](https://rybla.github.io/interpolnet-2/barycentric-coordinate-rasterization)]

An interactive visualizer demonstrating the barycentric coordinate rasterization process by filling in a massive 2D triangle pixel-by-pixel to calculate color gradients.

### Features
- **Massive 2D Triangle**: A large triangle drawn on an HTML5 canvas with distinct colors assigned to its three vertices (Red, Green, Blue).
- **Pixel-by-Pixel Rasterization**: An animation that scans the bounding box of the triangle pixel-by-pixel, visualizing the core of a software rasterizer.
- **Barycentric Interpolation**: For each pixel inside the triangle, the algorithm computes its barycentric coordinates (alpha, beta, gamma) and smoothly interpolates the vertex colors to produce beautiful gradients.
- **Dynamic Calculation Readout**: A side or floating panel displaying real-time coordinates, weight values, and the resulting interpolated color for the current pixel being processed.
- **Smooth Animation Loop**: Employs `requestAnimationFrame` for a responsive, visible step-through of the rasterization process.

### Design Goals
- **Educational Value**: Demystify the foundational algorithm of 3D graphics rendering (triangle rasterization and interpolation).
- **Aesthetics**: Utilize a dark, high-contrast theme where the vibrant interpolated neon colors pop against a deep background, consistent with the Interpolnet 2 visual style.
- **Clear Visualization**: Make the abstract mathematical calculation of barycentric weights (areas of sub-triangles) visible through the smooth color gradients it produces.

### Implementation Plan
- **HTML Structure**: A responsive container wrapping the main `<canvas>` and a UI overlay for real-time calculation readouts.
- **CSS Styling**: Apply a dark, modern design with flexbox/grid for mobile-friendly layout and glowing accents for text readouts.
- **JavaScript Core**:
    - Define three fixed vertices for the triangle.
    - Compute the bounding box of the triangle.
    - Implement a rendering loop that iterates over the pixels within the bounding box over time.
    - Implement an `isInside` function utilizing barycentric coordinates to determine if a pixel is within the triangle and calculate the weights.
    - Map the calculated weights to RGB color values and draw the filled pixel.
    - Update the UI readout dynamically as each pixel is rasterized.

## Marching Cubes Isosurface Mesh [[demo](https://rybla.github.io/interpolnet-2/marching-cubes-isosurface)]

An interactive 3D scalar field where users adjust an isosurface threshold slider to watch the marching cubes algorithm generate a cohesive polygonal mesh.

### Features
- **3D Scalar Field Visualization**: A 3D grid containing a scalar field generated using a combination of mathematical functions or noise (e.g., metaballs). The grid points are visualized as faint glowing dots with varying sizes or colors based on their scalar value.
- **Interactive Isosurface Threshold**: A prominent, stylized slider allows the user to dynamically adjust the threshold value for the isosurface extraction.
- **Real-Time Marching Cubes Extraction**: As the slider moves, the marching cubes algorithm evaluates the grid cells and generates the corresponding polygonal mesh in real time. The generated mesh is rendered beautifully with modern materials.
- **Dynamic Animations**:
  - **Passive**: The scalar field itself animates over time (e.g., metaballs orbiting), causing the mesh to organically shift and flow even when the user isn't interacting.
  - **Active**: Interacting with the slider provides immediate visual feedback.
- **Wireframe Toggle**: A button to toggle between solid shading and a wireframe view, allowing users to clearly see the individual triangles generated by the algorithm.
- **Grid Visibility Control**: Options to toggle the visibility of the underlying scalar field grid points.

### Design Goals
- **Educational Intuition**: Provide a clear, real-time visual demonstration of how the marching cubes algorithm converts discrete volumetric data into a continuous surface.
- **Aesthetics**: Employ a "synthwave" or "cyberpunk" aesthetic—dark background with bright neon accents (e.g., cyan mesh, magenta scalar points) to make the geometry visually striking.
- **Fluid Interactivity**: Ensure high-performance rendering so that the mesh updates instantly as the threshold is adjusted or the field animates, maintaining a strong sense of causality.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering and geometry generation.
- **Data Structure**:
  - A 3D array (or flattened 1D array) representing the scalar field values at discrete grid coordinates.
  - A predefined lookup table for the marching cubes algorithm (edge intersections and triangle configurations for all 256 possible cell states).
- **Algorithm implementation**:
  - Evaluate the scalar field at each grid point based on time and mathematical functions.
  - Iterate through the 3D grid cells, determine the 8-bit index based on the 8 corner values and the current threshold, and use the lookup table to generate vertices and faces.
  - Interpolate vertex positions along the edges of the cells for smooth mesh generation.
- **Rendering**:
  - Use `BufferGeometry` in Three.js to efficiently update and render the generated mesh.
  - Use `Points` material for the scalar field grid, mapping point scale and color to the scalar value.
- **UI & Controls**:
  - HTML/CSS overlay for the threshold slider, wireframe toggle, and grid visibility toggle.
  - Apply the Interpolnet 2 design system guidelines (distinct typography, responsive layout, CSS animations on UI elements).

## Error Diffusion Dithering Visualizer [[demo](https://rybla.github.io/interpolnet-2/error-diffusion-dithering)]

An interactive tool allowing users to compare various error-diffusion dithering algorithms side-by-side by dragging a slider across a high-resolution image to reveal its 1-bit pixelation.

### Features
- **Algorithm Selection**: Users can choose between multiple error-diffusion algorithms such as Floyd-Steinberg, Atkinson, Jarvis-Judice-Ninke, and Stucki.
- **Interactive Slider**: A draggable slider overlays the image. One side displays the original high-resolution image, and the other displays the 1-bit dithered result, allowing for immediate visual comparison.
- **High-Resolution Image Loading**: The demo uses a high-resolution built-in image to clearly demonstrate the subtle differences between error-diffusion patterns.

### Design Goals
- **Educational Comparison**: Provide an intuitive, interactive way to understand how different error-diffusion kernels affect visual perception and quantization artifacts.
- **Performance**: The dithering calculations should be performed quickly enough to allow seamless switching of algorithms. The interactive slider should update smoothly without lag.
- **Visual Clarity**: A clean, minimalist interface focusing entirely on the image and the comparison tool, with a dark theme to enhance image contrast.

### Implementation Plan
- **HTML Structure**: A main container holding the canvas for the image and the interactive slider element. A control panel for selecting the dithering algorithm.
- **CSS Styling**: A simple, dark theme. CSS absolute positioning will be used to overlay the slider onto the canvas. The canvas rendering will handle the split view.
- **JavaScript Engine**:
  - Load the base high-resolution image and extract its pixel data via a canvas `ImageData` object.
  - Implement a general error-diffusion function that accepts different weight matrices (kernels).
  - Add specific matrices for Floyd-Steinberg, Atkinson, Jarvis-Judice-Ninke, and Stucki.
  - Apply the selected dithering algorithm to the image data.
  - Handle the slider's `input` event to dynamically composite the original image and the dithered image based on the slider's position, drawing the combined result to the visible canvas.
## Procedural Biome Map Generator [[demo](https://rybla.github.io/interpolnet-2/procedural-biome-map-generator)]

An interactive map generator that combines overlapping octaves of simplex noise with a moisture map to generate biomes, coastlines, and rivers dynamically.

### Features
- **Dynamic Terrain Generation**: Utilizes 2D Simplex Noise with multiple overlapping octaves to create complex, natural-looking elevation maps.
- **Moisture Mapping**: A secondary noise layer determines the moisture level across the terrain, influencing the final biome classification.
- **Biome Classification**: Maps the combined (elevation, moisture) values to distinct biomes (e.g., deep ocean, shallow water, beach, plains, forest, jungle, desert, snow, and mountains).
- **River Generation**: Simulates water flow by identifying high-elevation points and tracing downward paths to the ocean, carving out dynamic river systems.
- **Real-Time Rendering**: The generated map is rendered pixel-by-pixel onto an HTML5 Canvas, providing immediate visual feedback of the procedural generation algorithms.
- **Interactive Exploration**: The map generator operates continuously, allowing users to watch the terrain form or click to instantly generate a completely new random world seed.

### Design Goals
- **Algorithmic Transparency**: Visually demonstrate how simple mathematical functions (noise) can be layered and combined to produce complex, emergent geographic features.
- **Aesthetic Consistency**: Use a distinct, unique, and consistent color scheme for the biomes, ensuring the generated maps are beautiful and readable.
- **Responsiveness**: The canvas should automatically scale to fit the window, ensuring a full-screen, immersive experience on both desktop and mobile devices.

### Implementation Plan
- **HTML/CSS**: A full-screen layout with a central `<canvas>` element. Apply a dark theme background with typography consistent with the Interpolnet 2 project.
- **Noise Implementation (JavaScript)**: Embed a lightweight, standalone 2D Simplex Noise algorithm.
- **Map Generation Logic**:
  - Implement a `generateElevationMap` function using Fractional Brownian Motion (FBM) with multiple octaves of Simplex Noise.
  - Implement a `generateMoistureMap` function using a different noise offset.
  - Create a lookup table or function to determine the biome color based on elevation and moisture thresholds.
- **River Simulation**: Algorithm to pick random inland points, calculate the steepest downhill gradient, and trace a path until it reaches sea level, marking those pixels as rivers.
- **Rendering Loop**: Use `ImageData` to manipulate pixels efficiently and draw the final biome colors and rivers onto the canvas context.
## WebGL Particle Emitter [[demo](https://rybla.github.io/interpolnet-2/webgl-particle-emitter)]

An interactive WebGL-based particle system that visually demonstrates the effects of vector mathematics and simple physics. Users can construct math vectors for wind, gravity, and drag, which are independently applied to a massive amount of particles rendered in real-time.

### Features
- **GPU-Accelerated Particles**: Thousands of individual particles are updated and rendered directly via WebGL, allowing for a smooth 60fps experience even with high particle counts.
- **Interactive Physics Vectors**:
    - **Gravity Vector**: Users can adjust a 2D vector controlling the constant pull on all particles.
    - **Wind Vector**: A directional force that pushes particles across the canvas.
    - **Drag Coefficient**: A slider to increase or decrease the simulated air resistance, causing particles to slow down over time relative to their velocity.
- **Visual Controls**: Interactive UI elements that allow dragging to set vector magnitude and direction.
- **Real-Time Simulation**: Changes to gravity, wind, and drag immediately affect the simulation without restarting.
- **Emission Dynamics**: A steady stream of particles is emitted from a central point, fading out as they age.

### Design Goals
- **Educational and Fun**: Demystify simple physics simulation (Euler integration) by providing an engaging visual sandbox.
- **Performance**: Use WebGL to push the limits of particle counts in the browser, showing the power of typed arrays and shaders.
- **Aesthetic Excellence**: Adopt a "neon synthwave" visual style—dark background with bright, glowing cyan, magenta, and yellow particles.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` element for the WebGL rendering. A floating, semi-transparent UI control panel overlay containing the sliders and vector controls.
- **CSS Styling**: A cohesive dark theme, using responsive flexbox for the controls so they look good on desktop and mobile.
- **JavaScript Core**:
    - **WebGL Context**: Initialize WebGL, compile vertex and fragment shaders.
    - **State Management**: Use `Float32Array` buffers to store particle positions, velocities, colors, and lifetimes to ensure fast memory access and easy passing to WebGL buffers.
    - **Physics Engine**: In the `requestAnimationFrame` loop, update particle positions based on $v_{new} = v_{old} + (gravity + wind - drag \times v_{old}) \times dt$ and $p_{new} = p_{old} + v_{new} \times dt$.
    - **Rendering**: Upload the updated buffer data to the GPU and draw as `GL_POINTS`.
    - **Interaction**: Handle pointer events on custom UI elements to update the physics variables dynamically.
## Shadow Mapping Deconstruction [[demo](https://rybla.github.io/interpolnet-2/shadow-mapping-deconstruction)]

Deconstruct 3D shadow mapping by rendering a split-screen view showing the scene from the camera's perspective next to the light source's depth buffer.

### Features
- **Split-Screen Visualization**: A side-by-side (or top-and-bottom on mobile) layout presenting two distinct views of the same 3D scene.
- **Camera Perspective**: The primary view shows the scene as seen by the main camera, featuring objects casting and receiving shadows.
- **Light Source Perspective**: The secondary view shows the scene exactly as seen from the perspective of the shadow-casting light source.
- **Depth Map Rendering**: The secondary view renders the scene using a depth material, visually representing the shadow map (closer objects are darker/lighter, further objects fade). This reveals how the light "sees" depth.
- **Dynamic Objects**: A scene consisting of several simple geometric objects (like a rotating torus, a sphere, and a ground plane) to clearly demonstrate shadow casting and receiving.

### Design Goals
- **Educational Demystification**: Provide a clear, intuitive visual explanation of how shadow mapping algorithms work in 3D graphics by exposing the hidden "light camera".
- **Visual Correlation**: The split-screen design allows users to instantly connect the shadows seen in the main camera view with the depth information generated in the light's view.
- **Clean Aesthetic**: Use a minimalist, high-contrast visual style to ensure the geometry and shadows are the clear focus.

### Implementation Plan
- **HTML Structure**: Set up a responsive flexbox container holding two distinct `div` elements, one for each view.
- **CSS Styling**: Apply the Interpolnet 2 color scheme. Ensure the two views stack vertically on small screens and sit side-by-side on larger screens.
- **JavaScript (Three.js)**:
  - Initialize a single Three.js scene containing the objects (torus, sphere, plane).
  - Create a `DirectionalLight` or `SpotLight` configured to cast shadows.
  - Set up two cameras: the main `PerspectiveCamera` and a camera corresponding to the light source's position and orientation (often an `OrthographicCamera` for directional lights).
  - In the render loop, render the scene twice:
    - First to the left container using the main camera and standard materials (with shadow casting/receiving enabled).
    - Second to the right container using the light's camera. To visualize the depth map, override the scene material temporarily with a `MeshDepthMaterial` during this render pass.

## Delaunay Expanding Circles [[demo](https://rybla.github.io/interpolnet-2/delaunay-expanding-circles)]

An interactive geometric visualization that allows users to place points randomly on a canvas to watch circles expand and lock together to form the mathematically optimal Delaunay triangle mesh.

### Features
- **Interactive Point Placement**: Clicking anywhere on the canvas dynamically adds a new seed point.
- **Expanding Circles**: Each placed point spawns a circle that continuously expands outwards.
- **Delaunay Triangulation**: The circles intersect, and as they do, the underlying Delaunay triangle mesh is continuously calculated and rendered.
- **Dynamic Connection Animation**: The mesh edges connecting the points are drawn.

### Design Goals
- **Algorithm Visualization**: Visually demonstrate how a Delaunay triangulation connects a set of points in a plane.
- **Engaging Aesthetics**: Employ a dark theme with vibrant, randomly generated neon colors for the expanding circles and a bright, contrasting color for the mesh to make the math look striking.
- **Responsiveness**: Ensure the visualization works seamlessly across desktop and mobile sizes, recalculating properly if the window is resized.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` element for the visualization.
- **CSS Styling**: A dark theme, styling the canvas to fill the viewport completely.
- **JavaScript Core**:
    - **State Management**: Track an array of `points` (x, y) and their expanding circle properties.
    - **Mathematics**: Implement a robust algorithm for Delaunay Triangulation (such as Bowyer-Watson).
    - **Rendering Loop**: Use `requestAnimationFrame` to animate expanding circles and update the mesh as the circles expand.
    - **Interaction**: Handle pointer events to allow users to add new points, generating beautiful visual effects for each.

## 3D UV Map Painter [[demo](https://rybla.github.io/interpolnet-2/uv-map-painter)]

An interactive 3D modeling visualization that demystifies texture mapping by showing a 3D cube unrolled into a flat UV map layout, allowing users to paint on the 2D surface and see the brush strokes wrap around the 3D object in real-time.

### Features
- **Split-Screen View**: A side-by-side layout presenting the 2D unwrapped UV map and the 3D rendered cube.
- **Interactive Painting Canvas**: Users can click and drag on the 2D canvas to paint strokes. The canvas is laid out as a cross, representing the unfolded faces of the cube (Top, Bottom, Front, Back, Left, Right).
- **Real-Time 3D Wrapping**: As the user paints on the 2D canvas, the 3D cube's texture instantly updates, wrapping the drawn strokes across the edges of the cube.
- **Auto-Rotation**: The 3D cube gently rotates to show all sides, allowing the user to inspect how their 2D painting translates to the 3D surface.

### Design Goals
- **Educational Clarity**: Provide a concrete, hands-on demonstration of UV mapping, a concept that is fundamental to 3D graphics but often abstract to beginners.
- **Immediate Feedback**: The instant translation from a 2D brush stroke to a 3D surface mapping creates a satisfying and magical interaction loop.
- **Aesthetics**: Use a clean, dark theme with distinct, glowing neon colors for the paint and clear grid lines indicating the UV layout.

### Implementation Plan
- **HTML Structure**: A responsive flexbox container holding a standard HTML5 `<canvas>` for the 2D painting and a `<div>` container for the Three.js 3D rendering.
- **2D Canvas Logic**:
  - Set up a square canvas (e.g., 512x512) and draw a permanent grid/outline showing the 6 faces of the unfolded cube.
  - Implement a simple drawing application using `pointerdown`, `pointermove`, and `pointerup` events to draw lines.
- **3D Rendering (Three.js)**:
  - Create a `BoxGeometry`. By default, Three.js maps the entire texture to each face. This must be modified by updating the `uv` attributes of the geometry to map specific rectangular regions of the 2D canvas to specific faces of the cube.
  - Create a `CanvasTexture` using the 2D painting canvas as the source.
  - Apply this texture to a `MeshBasicMaterial` (or `MeshStandardMaterial` with lighting).
- **Synchronization**: In the `requestAnimationFrame` loop, rotate the cube and set `texture.needsUpdate = true` so Three.js knows to re-upload the 2D canvas data to the GPU.

## Inverse Kinematics Robotic Arm [[demo](https://rybla.github.io/interpolnet-2/inverse-kinematics-robotic-arm)]

An interactive visualization of a multi-jointed robotic arm utilizing inverse kinematics, where users can drag the end effector and the algorithm calculates the joint angles in real time to reach the target.

### Features
- **Multi-Jointed Arm**: A visual representation of a robotic arm with multiple segments and joints rendered on an HTML5 canvas.
- **Interactive End Effector**: Users can click and drag the target (end effector) around the canvas.
- **Inverse Kinematics Algorithm**: The system dynamically calculates the required angles for each joint so that the end of the arm reaches the user-defined target position, utilizing the FABRIK (Forward And Backward Reaching Inverse Kinematics) or CCD (Cyclic Coordinate Descent) algorithm.
- **Real-Time Rendering**: The arm smoothly updates its position and joint angles in real time as the target is dragged.

### Design Goals
- **Educational Visualization**: Demonstrate how inverse kinematics algorithms solve the complex problem of determining joint parameters to achieve a desired end-effector position.
- **Engaging Interaction**: Provide a tactile, responsive experience where the user feels they are directly manipulating the robotic arm's goal.
- **Aesthetic Excellence**: Use a clean, modern aesthetic with distinct colors for the segments, joints, and target to make the mechanics clear.

### Implementation Plan
- **HTML Structure**: A full-screen `<canvas>` element.
- **Styling**: A dark theme with distinct colors (e.g., glowing cyan for segments, magenta for joints).
- **JavaScript Core**:
    - **State Management**: Maintain an array of segments (length, angle) or joints (x, y coordinates).
    - **Inverse Kinematics Logic**: Implement an iterative solver (like FABRIK) that runs every frame to adjust joint positions towards the target.
    - **Rendering Loop**: Use `requestAnimationFrame` to draw the arm's segments and joints, and the target point.
    - **Interaction**: Handle pointer events (`pointerdown`, `pointermove`, `pointerup`) to update the target position based on user input.

## Constructive Solid Geometry Visualizer [[demo](https://rybla.github.io/interpolnet-2/csg-visualizer)]

Visualize Constructive Solid Geometry by letting users intersect, union, and subtract transparent 3D primitives to carve out complex objects.

### Features
- **3D Primitive Interactions**: Users can select and interact with multiple 3D primitives in a 3D scene.
- **CSG Operations**: Three primary operations (Union, Subtract, Intersect) can be performed when shapes overlap.
- **Transparent Rendering**: Primitives are rendered with translucent, glass-like materials so the user can see where the volumes overlap and understand the internal structure of the resulting CSG operation.
- **Dynamic Mesh Updates**: The shapes dynamically reflect the results of the CSG operations when active.

### Design Goals
- **Intuitive Exploration**: Make the process of understanding CSG (a complex 3D modeling concept) interactive and intuitive through direct manipulation of primitives.
- **Visual Clarity**: Enhance understanding by making overlaps visible through material transparency, paired with distinct color-coding for each primitive.
- **Aesthetic**: Maintain the Interpolnet 2 neon/dark synthwave aesthetic with bright, glowing primitives on a deep background.

### Implementation Plan
- **Tech Stack**: HTML5 Canvas and Three.js (`r128` via CDN) for the 3D environment.
- **Mathematical Engine (CSG)**: Implement custom Constructive Solid Geometry algorithms in JavaScript to handle the Boolean operations (Union, Intersect, Subtract) on the geometry.
- **Interaction (JavaScript)**: Utilize Three.js `Raycaster` to handle user pointer events to select and drag primitives across the scene.
- **Rendering**: Render base primitives with `MeshPhysicalMaterial` for transparency and transmission. Compute updated vertex positions and faces dynamically based on the chosen CSG operation.

## Screen Space Ambient Occlusion [[demo](https://rybla.github.io/interpolnet-2/ssao-demo)]

An interactive 3D visualization using THREE that demystifies how Screen Space Ambient Occlusion (SSAO) works by exposing the hidden test rays. The demo allows users to select a point in a 3D scene (representing a pixel's depth buffer position) and see the hemispherical rays cast outward to determine if that specific corner or surface is shaded.

### Features
- **3D Scene Environment**: A simple Cornell-box-like environment with intersecting walls and floating geometric shapes to create corners and crevices where ambient occlusion naturally occurs.
- **Interactive Ray Selection**: Users can click or tap anywhere on the scene surfaces to designate a "target pixel".
- **Hemispherical Ray Visualization**: From the selected target point, the demo visually spawns a hemisphere of test rays pointing outwards (along the surface normal).
- **Intersection Feedback**: The test rays are color-coded in real-time. Rays that hit nearby geometry (occluded) are colored distinctly from rays that shoot into open space (unoccluded).
- **Dynamic Occlusion Readout**: A UI panel updates to show the ratio of occluded vs. unoccluded rays, explicitly demonstrating how the final "darkness" of that pixel's ambient occlusion is calculated.

### Design Goals
- **Educational Demystification**: Break down the complex, often "black box" post-processing effect of SSAO into a tangible, geometric process.
- **Visual Causality**: Directly link the presence of nearby geometry (corners, crevices) to the resulting shading by making the test rays visible.
- **Aesthetics**: Maintain the project's consistent dark/neon aesthetic. The scene geometry will be minimalist, while the test rays will use bright, glowing colors (e.g., cyan for free rays, magenta for occluded rays) to stand out.

### Implementation Plan
- **Tech Stack**: Three.js for 3D rendering.
- **Scene Setup**: Create a room with some intersecting boxes using standard Three.js meshes and materials.
- **Interaction (JavaScript)**:
  - Utilize Three.js Raycaster to handle user pointer events to select a point on the surfaces.
  - Calculate the surface normal at the clicked point.
- **Ray Visualization**:
  - Generate a set of random or semi-random vectors distributed across a hemisphere oriented along the surface normal.
  - Cast a Three.js Raycaster along each of these vectors for a short distance (the SSAO radius).
  - Draw lines (using `THREE.Line` or `THREE.ArrowHelper`) to represent these rays, colored based on whether the raycaster detects a hit within the radius.

## 3D Character Facial Expression Interpolation [[demo](https://rybla.github.io/interpolnet-2/3d-character-facial-expression-interpolation)]

A visualization that demonstrates how a 3D character's facial expression changes by interpolating vertex positions between a neutral base mesh and a smiling target mesh.

### Features
- **Interactive 3D View**: A 3D view of a character's face.
- **Interpolation Slider**: A slider control that dynamically adjusts the interpolation factor between 0.0 (neutral) and 1.0 (smiling), instantly reflecting changes on the 3D model.

### Design Goals
- **Educational**: Help users understand how basic facial animation works by interpolating between predefined target shapes (blend shapes/morph targets).
- **Visual Clarity**: Display the mesh clearly to emphasize the movement of individual vertices as the expression changes.

### Implementation Plan
- **Renderer**: Implement custom 3D projection rendering to an HTML5 canvas element, without external 3D libraries.
- **Mesh Data**: Hard-code the vertices and faces for a simple low-polygon base face mesh, and a target smile mesh which contains identically structured topology but with adjusted vertex positions (e.g., mouth corners raised and cheeks shifted).
- **Logic**: A render loop reading the slider value (t). The final position of each vertex is calculated as: `(1 - t) * baseVertex + t * smileVertex`. The canvas is cleared and the interpolated mesh is projected and drawn every frame.

## Cel Shading Visualizer [[demo](https://rybla.github.io/interpolnet-2/cel-shading-visualizer)]

An interactive 3D visualization that demonstrates how cel shading (toon shading) works by mapping smooth lighting gradients to sharp color bands using an adjustable 1D step texture.

### Features
- **3D Model Viewer**: A central 3D model (e.g., a torus knot) that displays the lighting.
- **Interactive 1D Gradient Map**: A visual representation of a 1D texture that users can adjust to change the number of color bands (steps).
- **Real-Time Shading Updates**: The 3D model instantly reflects the changes made to the 1D gradient map, snapping smooth lighting into discrete tones.
- **Lighting Controls**: Interactive controls to adjust the light's direction to observe how the cel-shaded bands react.

### Design Goals
- **Educational Value**: Clearly illustrate the mapping process from continuous diffuse lighting values (N dot L) to discrete color bands.
- **Visual Feedback**: Make the connection between the 1D texture configuration and the resulting non-photorealistic rendering immediate and intuitive.
- **Aesthetic**: A stylish, clean aesthetic that highlights the cartoonish nature of cel shading against a dark, contrasting background.

### Implementation Plan
- **HTML/CSS**: A flex container with a main 3D canvas and a panel for UI controls.
- **3D Rendering**: Use Three.js to render the scene. Apply `MeshToonMaterial` which supports a gradient map. Use a `DataTexture` to dynamically generate the 1D step texture based on user input.
- **Interaction**: UI sliders to let users define the number of steps and light position, dynamically rebuilding the `DataTexture` when settings change.

## Flow Field Particles [[demo](https://rybla.github.io/interpolnet-2/flow-field-particles)]

An interactive, fluid-like visualization where thousands of particles trace the currents of a dynamic, noise-driven vector flow field. The underlying invisible currents are generated using procedural noise and displayed as a grid of rotating vector arrows, while particles continuously flow through the environment creating mesmerizing organic patterns.

### Features
- **Dynamic Flow Field**: A grid of invisible vectors dictating the "currents", updated dynamically over time utilizing underlying noise.
- **Particle Swarm**: Thousands of small particles rendered in real-time, flowing smoothly through the vector field.
- **Vector Overlay**: A togglable (or faintly visible) grid of rotating vector arrows that reveals the underlying noise structure shaping the particles' paths.
- **Trail Effects**: As particles move, they leave fading trails, creating a sense of continuous flow and accumulating into beautiful organic fluid structures.
- **Responsive Layout**: Adapts gracefully to both desktop and mobile devices, maintaining fluid dynamics independent of canvas proportions.

### Design Goals
- **Mesmerizing Flow**: Provide a visually hypnotic experience by mimicking fluid dynamics and organic currents using simple procedural noise.
- **Clear Causality**: Ensure the relationship between the underlying vector field (noise) and the particle movement is apparent.
- **Modern Aesthetic**: Use a clean, dark "neon" or "blueprint" theme typical of the Interpolnet 2 project (e.g., deep background with bright glowing particles and subtle vector arrows).

### Implementation Plan
- **HTML/CSS**: A full-screen `<canvas>` element for rendering the visualization.
- **Math & Noise Logic (JavaScript)**:
    - Implement a lightweight procedural noise function (like Perlin or Simplex noise) to generate smooth, continuous random values.
    - Calculate a vector field grid where the angle of each vector is determined by the noise value at that position.
- **Particle System**:
    - Manage an array of thousands of particles, each with a position and velocity.
    - In the animation loop, each particle looks up the nearest vector in the flow field, applies it as a force to its velocity, and updates its position.
    - Particles wrap around the screen edges to maintain a continuous, infinite flow.
- **Rendering Loop**:
    - Use `requestAnimationFrame` for a smooth 60fps loop.
    - Draw the background with a low-opacity fill instead of a full clear to create particle trails.
    - Draw the particles as small points or lines.
    - Periodically update the noise offset (time) to make the vector field slowly shift and morph, animating the currents.

## Voxelizer [[demo](https://rybla.github.io/interpolnet-2/voxelizer)]

An interactive 3D visualization using Three.js that demonstrates the process of voxelization by converting a high-poly 3D model into an increasingly blocky Minecraft-style voxel grid.

### Features
- **Dynamic Voxelization**: Users can use a slider to adjust the voxel size/resolution in real-time, watching a smooth 3D shape transform into a grid of distinct blocks.
- **Bounding Box Intersection Visualization**: The underlying algorithm (testing whether each discrete voxel cell intersects the original geometry's bounding box) is visually demonstrated by the appearance and disappearance of voxel cubes.
- **Interactive 3D View**: A responsive 3D environment where the user can observe the voxelized mesh.

### Design Goals
- **Educational Value**: Provide a tangible, interactive demonstration of spatial discretization and volumetric representation in computer graphics.
- **Immediate Feedback**: The voxelization process updates instantly as the user drags the slider, establishing a clear link between the resolution parameter and the visual output.
- **Aesthetic**: Maintain the consistent neon/dark synthwave aesthetic of the Interpolnet 2 project, using glowing, distinct colors against a dark background.

### Implementation Plan
- **Tech Stack**: HTML5 Canvas, CSS, and Three.js (`r128` via CDN) for the 3D environment.
- **Scene Setup**: Create a base 3D shape (e.g., a `TorusKnotGeometry` or similar complex shape) and a surrounding grid.
- **Voxelization Algorithm (JavaScript)**:
    - Compute the bounding box of the base geometry.
    - Based on the current slider value (voxel size), divide the bounding volume into a 3D grid.
    - Iterate through each cell in the grid. Create a temporary `THREE.Box3` for the cell.
    - Check if this cell's bounding box intersects the bounding box of the original geometry. For a more accurate voxelization, it can check intersection against the geometry's triangles or just approximate with bounding boxes.
    - Render a voxel (e.g., an `InstancedMesh` for performance) at the center of each intersecting cell.
- **Interaction**: An HTML range input slider that updates the voxel size parameter and triggers a recalculation and re-render of the voxel grid.

## Synthetic Stock Chart [[demo](https://rybla.github.io/interpolnet-2/synthetic-stock-chart)]

An interactive visualization that simulates the erratic, jagged price movement of a synthetic stock market chart by layering multiple frequencies of noise over a 1D line using fractional Brownian motion.

### Features
- **Dynamic Chart Rendering**: A real-time updating chart that draws the synthesized stock prices on a 1D line.
- **Adjustable Parameters**: Users can control variables such as the number of noise frequencies (octaves), scaling factors, and time steps.
- **Fractional Brownian Motion**: Uses layered noise to accurately simulate the semi-random walk characteristics commonly found in real financial markets.
- **Color Coding**: Visual indicators highlight upward or downward trends to mimic traditional trading dashboards.

### Design Goals
- **Visual Simulation**: Provide a compelling and visually accurate simulation of a synthetic stock market chart.
- **Interactive Exploration**: Allow users to explore how combining different frequencies of noise can create complex, unpredictable patterns resembling real-world data.
- **Financial Dashboard Aesthetic**: Use a distinct, consistent color scheme that evokes the feeling of modern trading software, complete with responsive layout for varying screen sizes.

### Implementation Plan
- **HTML/CSS Structure**: A responsive layout with a main `canvas` element for the chart and a control panel featuring sliders and inputs for adjusting the noise parameters.
- **Noise Generation (JavaScript)**: Implement a custom 1D noise algorithm.
- **Fractional Brownian Motion**: Create a function that loops through multiple octaves, scaling frequency and amplitude, and summing the noise values to generate the final price point.
- **Rendering Loop**: Use `requestAnimationFrame` to continuously calculate new values, scroll the historical data, and draw the line graph on the HTML5 canvas.

## Depth of Field Simulator [[demo](https://rybla.github.io/interpolnet-2/depth-of-field-simulator)]

An interactive 3D visualization demonstrating the optical depth of field effect by calculating a focal plane and dynamically blurring objects based on their z-depth distance from the circle of confusion. The simulator aims to provide an intuitive understanding of how camera lenses capture light and focus on subjects.

## Subsurface Scattering Visualizer [[demo](https://rybla.github.io/interpolnet-2/subsurface-scattering-visualizer)]

An interactive 3D visualization that demonstrates subsurface scattering by shining a virtual light behind a translucent 3D marble hand to visualize how light rays penetrate, scatter, and exit the surface to create a fleshy glow.

### Features
- **Translucent 3D Model**: A central 3D model styled to look like a marble hand that displays the subsurface scattering effect.
- **Interactive Light Source**: A point light source that users can move around the 3D space, especially behind the object, to observe the scattering of light through the material.
- **Real-Time Material Updates**: Interactive controls to adjust the material's transmission, thickness, and roughness to observe how these properties affect the subsurface scattering.
- **Light Controls**: Adjustable sliders to change the intensity and color of the light.

### Design Goals
- **Educational Value**: Clearly illustrate how light scattering through a medium affects the final appearance, distinguishing it from simple opaque surface reflection.
- **Visual Feedback**: Instantly show the effect of changing the light position or material properties, providing a clear understanding of the subsurface scattering phenomena.
- **Aesthetic**: A visually pleasing and modern interface with a consistent color scheme, focusing on the glow of the translucent material against a dark background.

### Implementation Plan
- **HTML/CSS**: A responsive layout featuring a main 3D canvas and a side panel with UI controls (sliders) for interactivity.
- **3D Rendering**: Use Three.js to render the 3D scene. Utilize a material that supports physical properties such as transmission and thickness, allowing for the simulation of subsurface scattering. A built-in or procedurally generated geometry will be used to represent the hand.
- **Interaction**: UI sliders to adjust the light's position (X, Y, Z), material properties (transmission, thickness, roughness), and light intensity, dynamically updating the Three.js scene in real-time.

## 2D Metaballs Liquid Simulator [[demo](https://rybla.github.io/interpolnet-2/2d-metaballs-liquid-simulator)]

Render 2D metaballs that smoothly merge into one another like liquid drops by calculating the overlapping thresholds of their inverse-square distance functions.

### Features
- **Metaballs**: 2D metaballs that smoothly merge into one another.
- **Overlapping Thresholds**: Calculate the overlapping thresholds of their inverse-square distance functions.
- **Liquid Simulator**: Simulate liquid drops that merge into one another.

### Design Goals
- **Smooth Merging**: Provide a visually appealing and smooth merging of liquid drops.
- **Performance**: Ensure the simulation is performant and responsive.
- **Aesthetic**: A visually pleasing and modern interface with a consistent color scheme.

### Implementation Plan
- **HTML**: Set up a canvas for rendering.
- **CSS**: Apply styling.
- **JavaScript**: Implement the metaballs logic and rendering loop.

## Path Tracing vs Ray Tracing [[demo](https://rybla.github.io/interpolnet-2/path-tracing-vs-ray-tracing)]

An interactive 2D visualization that contrasts standard ray tracing with path tracing by showing how firing hundreds of randomized stochastic rays per pixel accurately resolves global illumination and soft shadows.

### Features
- **Split-Screen or Togglable View**: A canvas displaying a simple 2D scene (camera, light source, obstacles). Users can switch between "Ray Tracing" mode and "Path Tracing" mode.
- **Ray Tracing Mode**: Visualizes the standard deterministic approach: a single primary ray is cast per pixel, and a single shadow ray is cast to the light. Produces hard shadows and no indirect lighting.
- **Path Tracing Mode**: Visualizes the stochastic approach: hundreds of primary rays are cast, bouncing randomly off surfaces based on material properties (diffuse, specular) and accumulating color over time to produce soft shadows, color bleeding, and global illumination.
- **Interactive Scene Elements**: Users can drag the light source or obstacles around the scene to see how the lighting dynamically updates in real-time.
- **Interactive Pixel Selection**: Users can click on any pixel in the scene to visualize the specific rays being cast for that pixel, demystifying the rendering process.

### Design Goals
- **Educational Clarity**: Visually demonstrate the core difference between deterministic ray tracing and stochastic path tracing. Show why path tracing requires many samples but yields more realistic lighting.
- **Visual Causality**: Directly link the random paths of bouncing rays to the accumulation of indirect light and soft shadows in the final image.
- **Aesthetic**: A clean, modern "blueprint" or "tactical screen" visual style, using distinct neon colors against a dark background for the rays and obstacles, maintaining the Interpolnet 2 design system.

### Implementation Plan
- **HTML Structure**: A layout featuring the main 2D `<canvas>` element for the visualization and a control panel for switching modes and interacting with the scene.
- **Styling (CSS)**: Apply the dark, high-contrast Interpolnet 2 theme, ensuring responsive design and clear, distinct buttons.
- **Rendering Engine (JavaScript)**:
  - Implement a simple 2D vector math and geometry engine for ray-circle and ray-line intersections.
  - Create a 2D scene graph containing the camera, a point/area light, and various geometric obstacles.
  - Implement a `traceRay` function that handles deterministic bouncing and shadow ray casting for the "Ray Tracing" mode.
  - Implement a `tracePath` function that uses stochastic bouncing (Monte Carlo integration) to accumulate color for the "Path Tracing" mode.
  - Use `requestAnimationFrame` for a continuous rendering loop, updating the canvas with the accumulated lighting results over time to show the progressive refinement typical of path tracing.

## Skeletal Animation Weight Painting Visualizer [[demo](https://rybla.github.io/interpolnet-2/skeletal-weight-painting)]

An interactive 3D visualization that demonstrates how vertex weight painting controls skin deformation during skeletal animation. By displaying a 3D model with its underlying bone armature visible, users can visually explore the relationship between bones and mesh vertices.

### Features
- **3D Interactive Model**: A central 3D model (e.g., a simple cylinder or generic character arm) rendered with an underlying skeletal armature.
- **Bone Interaction**: Users can select individual bones in the armature to highlight their influence on the mesh.
- **Weight Visualization**: The mesh visually updates to display the weight painting for the selected bone, using a color gradient (e.g., from blue/black for 0 influence to red/white for 1.0 influence) mapped to the vertices.
- **Animation Controls**: A slider to manually scrub through a simple animation (like bending an arm or a worm-like movement), clearly showing how the weighted vertices deform in real time.
- **Overlay Options**: Toggles to show/hide the skeletal armature and switch between standard shading and weight visualization mode.

### Design Goals
- **Educational Clarity**: Demystify the concept of skeletal animation and skinning by making the invisible "weights" explicit and visual.
- **Immediate Feedback**: Ensure the mesh updates instantly when a new bone is selected or when the animation slider is moved, providing a strong sense of causality.
- **Aesthetic**: A clean, technical aesthetic that contrasts the underlying structure (bones) with the surface structure (mesh), utilizing a distinct and consistent color scheme.

### Implementation Plan
- **HTML/CSS**: A responsive layout featuring a main 3D canvas and a side panel with UI controls (sliders for animation, toggles for visualization modes).
- **3D Rendering (Three.js)**:
  - Create a `SkinnedMesh` with a custom geometry (like a cylinder divided into segments) and a corresponding `Skeleton`.
  - Assign `skinIndex` and `skinWeight` attributes to the geometry vertices to bind them to the bones.
  - Implement a custom shader material or use vertex colors with a standard material to visualize the weights dynamically when a bone is selected.
- **Interaction**: UI controls to scrub through pre-defined bone rotations, select specific bones, and toggle rendering modes.

## Bump Mapping Visualizer [[demo](https://rybla.github.io/interpolnet-2/bump-mapping-visualizer)]

An interactive 3D visualization using Three.js that demonstrates the illusion of bump mapping. It visually breaks down how a grayscale height map alters a flat surface's normal vectors to fake the appearance of physical bumps and divots under a moving light source.

### Features
- **3D Flat Surface**: A central 3D flat plane that receives dynamic lighting.
- **Grayscale Height Map Visualization**: A UI toggle allows users to display the procedural grayscale height map that dictates the bump information.
- **Normal Vector Visualization**: A critical feature that renders the surface normal vectors as visible lines (e.g., using `VertexNormalsHelper`). Users can toggle this to see the straight, uniform normals of the flat plane suddenly perturb and shift orientation when the bump map is applied.
- **Dynamic Moving Light**: A point light source orbits or sweeps across the surface, highlighting the fake shadows and highlights created by the altered normals.
- **Real-Time Toggles**: Users can instantly toggle the bump map effect on and off to compare the flat, un-bumped shading with the detailed bump-mapped shading.

### Design Goals
- **Educational Demystification**: Make the "trick" of bump mapping obvious by explicitly showing the normal vectors changing direction based on the height map, rather than just showing the final shaded result.
- **Visual Causality**: Directly link the light's movement to the resulting dynamic highlights and shadows that give the flat plane its fake depth.
- **Aesthetic**: A clean, technical aesthetic consistent with the Interpolnet 2 project, utilizing a dark background with distinct, high-contrast colors for the normal vectors (e.g., bright neon magenta or cyan) to make them clearly visible against the surface.

### Implementation Plan
- **HTML/CSS**: A responsive container with a main 3D canvas and a floating control panel for the toggles (Show Bump Map, Show Normals, Enable Effect).
- **3D Scene (Three.js)**:
  - Create a high-resolution `PlaneGeometry` to provide enough vertices for the normal vector visualization to look dense and convincing.
  - Generate a procedural grayscale height map texture (e.g., using Canvas 2D API or perlin noise).
  - Apply a `MeshStandardMaterial` to the plane.
  - Create a moving `PointLight` and a subtle `AmbientLight`.
- **Interaction and Logic**:
  - Implement a `VertexNormalsHelper` attached to the mesh to visualize the normals.
  - When the "Enable Effect" toggle is active, assign the generated texture to the material's `bumpMap` property and update the normal visualization to reflect the perturbed normals (this may require a custom shader or manually calculating the perturbed normals for visualization if the helper only shows original geometry normals).
  - Animate the light source in the `requestAnimationFrame` loop.
