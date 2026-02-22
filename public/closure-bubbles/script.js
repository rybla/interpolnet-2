if (typeof window !== 'undefined') {
    // Matter.js module aliases
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Composites = Matter.Composites,
          Constraint = Matter.Constraint,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events,
          Body = Matter.Body,
          Vector = Matter.Vector;

    // Create engine
    const engine = Engine.create();
    const world = engine.world;
    engine.gravity.y = 0; // No gravity for floating bubbles

    // Create renderer
    const container = document.getElementById('canvas-container');
    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: container.clientWidth,
            height: container.clientHeight,
            background: '#0f0f13',
            wireframes: false,
            showAngleIndicator: false
        }
    });

    // Create runner
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    Composite.add(world, mouseConstraint);

    // Keep the mouse in sync with rendering
    render.mouse = mouse;

    // Handle resize
    window.addEventListener('resize', () => {
        render.canvas.width = container.clientWidth;
        render.canvas.height = container.clientHeight;
    });

    // Variables to track state
    let scopes = [];
    let variables = [];
    let activeConstraints = [];
    let groupCounter = -1;

    // --- Helper Functions ---

    function createScopeBubble(x, y, radius, label, type = 'function') {
        groupCounter--;
        const group = groupCounter;

        const circle = Bodies.circle(x, y, radius, {
            label: 'scope',
            collisionFilter: { group: group },
            frictionAir: 0.05,
            restitution: 0.9,
            render: {
                fillStyle: 'transparent',
                strokeStyle: '#64ffda',
                lineWidth: 2
            }
        });

        circle.customData = {
            label: label,
            type: type, // 'global', 'function', 'closure'
            radius: radius,
            group: group,
            variables: []
        };

        Composite.add(world, circle);
        scopes.push(circle);
        return circle;
    }

    function createVariableParticle(scopeBody, label, value) {
        const r = 15;
        // Start near the center of the scope
        const x = scopeBody.position.x + (Math.random() - 0.5) * 10;
        const y = scopeBody.position.y + (Math.random() - 0.5) * 10;

        const particle = Bodies.circle(x, y, r, {
            label: 'variable',
            collisionFilter: { group: scopeBody.customData.group },
            frictionAir: 0.02,
            restitution: 0.5,
            render: {
                fillStyle: '#ff6b6b'
            }
        });

        particle.customData = {
            label: label,
            value: value,
            parentScope: scopeBody
        };

        // Constraint to keep it inside the scope (soft tether to center)
        const constraint = Constraint.create({
            bodyA: scopeBody,
            bodyB: particle,
            stiffness: 0.005,
            damping: 0.05,
            render: { visible: false }
        });

        Composite.add(world, [particle, constraint]);
        variables.push(particle);
        activeConstraints.push(constraint);

        scopeBody.customData.variables.push(particle);

        return particle;
    }

    // Connects a closure scope to its parent scope (closure "captures" parent)
    // This prevents the parent from drifting away too far, or just visualizes the link
    function createClosureTether(childScope, parentScope) {
        const constraint = Constraint.create({
            bodyA: childScope,
            bodyB: parentScope,
            length: childScope.customData.radius + parentScope.customData.radius + 20,
            stiffness: 0.05,
            damping: 0.1,
            render: {
                strokeStyle: '#64ffda',
                lineWidth: 2,
                type: 'line'
            }
        });

        Composite.add(world, constraint);
        activeConstraints.push(constraint);
        return constraint;
    }

    function updateCodeHighlight(lineNum) {
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
        if (lineNum > 0) {
            const el = document.getElementById(`line-${lineNum}`);
            if (el) el.classList.add('active');
        }
    }

    function updateDescription(text) {
        document.getElementById('step-description').innerText = text;
    }

    // --- Simulation Logic ---

    let currentStep = -1;
    let makeCounterScope = null;
    let countVariable = null;
    let closureFunc = null;
    let execScope = null;

    const steps = [
        // Step 0: Initial State
        {
            line: 0,
            text: "Click 'Next Step' to begin.",
            action: () => {}
        },
        // Step 1: Function Declaration
        {
            line: 1,
            text: "Declaring function `makeCounter`. It's defined in the Global Scope.",
            action: () => {
                // Could visualize the function definition itself, but let's skip for simplicity
            }
        },
        // Step 2: Call makeCounter
        {
            line: 8,
            text: "Calling `makeCounter()`. A new execution scope (bubble) is created.",
            action: () => {
                const w = container.clientWidth;
                const h = container.clientHeight;
                makeCounterScope = createScopeBubble(w/2, h/2, 80, 'makeCounter\nScope', 'function');
            }
        },
        // Step 3: Initialize count
        {
            line: 2,
            text: "Variable `count` is initialized to 0 inside `makeCounter`'s scope.",
            action: () => {
                countVariable = createVariableParticle(makeCounterScope, 'count', 0);
            }
        },
        // Step 4: Return function (Closure creation)
        {
            line: 3,
            text: "An anonymous function is created. It captures (tethers) `makeCounter`'s scope.",
            action: () => {
                // Create the function object that is returned.
                // We'll represent it as a smaller, special bubble/body.
                const w = container.clientWidth;
                const h = container.clientHeight;

                closureFunc = Bodies.polygon(w/2 + 150, h/2 - 50, 3, 20, {
                    label: 'function',
                    frictionAir: 0.05,
                    restitution: 0.8,
                    render: { fillStyle: '#64ffda' }
                });
                closureFunc.customData = { label: 'func', type: 'closure', radius: 20 };
                Composite.add(world, closureFunc);
                scopes.push(closureFunc); // Track it for cleanup

                // Tether it to makeCounter scope
                createClosureTether(closureFunc, makeCounterScope);
            }
        },
        // Step 5: Assign to global variable
        {
            line: 8,
            text: "`makeCounter` returns the function. `myCounter` now holds this function (and its closure).",
            action: () => {
                // Visual feedback: Maybe flash the closureFunc or move it
            }
        },
        // Step 6: makeCounter finishes
        {
            line: 7,
            text: "`makeCounter` finishes execution. Normally its scope would pop, but the closure holds it!",
            action: () => {
                // Visual: Pulse the tether to show it holding on
                makeCounterScope.render.strokeStyle = '#ff6b6b';
                setTimeout(() => { makeCounterScope.render.strokeStyle = '#64ffda'; }, 500);
            }
        },
        // Step 7: Call myCounter (1st time)
        {
            line: 9,
            text: "Calling `myCounter()`. A new execution scope is created.",
            action: () => {
                const w = container.clientWidth;
                const h = container.clientHeight;
                execScope = createScopeBubble(w/2 - 150, h/2 + 50, 60, 'exec 1', 'execution');

                // It is connected to the function being executed
                createClosureTether(execScope, closureFunc);
            }
        },
        // Step 8: Increment count
        {
            line: 4,
            text: "Inside `myCounter`: `count++`. It finds `count` in the tethered parent scope.",
            action: () => {
                // Visualize lookup?
                countVariable.customData.value++;
                // Visual pop
                countVariable.render.fillStyle = '#fff';
                setTimeout(() => { countVariable.render.fillStyle = '#ff6b6b'; }, 300);
            }
        },
        // Step 9: Return count
        {
            line: 5,
            text: "Returns 1.",
            action: () => {}
        },
        // Step 10: Execution finishes
        {
            line: 6,
            text: "Execution finishes. The execution bubble pops (is garbage collected).",
            action: () => {
                // Remove execScope and its constraints
                // Find constraints attached to execScope
                const toRemove = activeConstraints.filter(c => c.bodyA === execScope || c.bodyB === execScope);
                Composite.remove(world, toRemove);
                activeConstraints = activeConstraints.filter(c => !toRemove.includes(c));

                Composite.remove(world, execScope);
                scopes = scopes.filter(s => s !== execScope);
                execScope = null;
            }
        },
         // Step 11: Call myCounter (2nd time)
         {
            line: 10,
            text: "Calling `myCounter()` again. Another fresh execution scope is created.",
            action: () => {
                const w = container.clientWidth;
                const h = container.clientHeight;
                execScope = createScopeBubble(w/2 - 100, h/2 + 80, 60, 'exec 2', 'execution');
                createClosureTether(execScope, closureFunc);
            }
        },
        // Step 12: Increment count
        {
            line: 4,
            text: "`count++` again. The SAME `count` variable is modified because the scope was preserved.",
            action: () => {
                countVariable.customData.value++;
                countVariable.render.fillStyle = '#fff';
                setTimeout(() => { countVariable.render.fillStyle = '#ff6b6b'; }, 300);
            }
        },
        // Step 13: Return count
        {
            line: 5,
            text: "Returns 2.",
            action: () => {}
        },
        // Step 14: Execution finishes
        {
            line: 6,
            text: "Execution finishes. Scope pops. `makeCounter` scope still remains!",
            action: () => {
                 const toRemove = activeConstraints.filter(c => c.bodyA === execScope || c.bodyB === execScope);
                Composite.remove(world, toRemove);
                activeConstraints = activeConstraints.filter(c => !toRemove.includes(c));

                Composite.remove(world, execScope);
                scopes = scopes.filter(s => s !== execScope);
                execScope = null;
            }
        }
    ];

    function nextStep() {
        if (currentStep < steps.length - 1) {
            currentStep++;
            const step = steps[currentStep];
            updateCodeHighlight(step.line);
            updateDescription(step.text);
            step.action();
        } else {
             updateDescription("Simulation complete. Click Reset to start over.");
        }
    }

    function reset() {
        // Clear all bodies
        Composite.clear(world);
        engine.events = {}; // Clear events if any

        // Re-add mouse constraint
        Composite.add(world, mouseConstraint);

        scopes = [];
        variables = [];
        activeConstraints = [];
        groupCounter = -1;
        currentStep = -1;
        makeCounterScope = null;
        countVariable = null;
        closureFunc = null;
        execScope = null;

        updateCodeHighlight(0);
        updateDescription("Click 'Next Step' to start the simulation.");
    }

    // UI Listeners
    document.getElementById('step-btn').addEventListener('click', nextStep);
    document.getElementById('reset-btn').addEventListener('click', reset);

    // Initialize
    updateDescription("Click 'Next Step' to start the simulation.");

    // --- Custom Rendering ---

    Events.on(render, 'afterRender', function() {
        const context = render.context;

        // Render Scopes
        scopes.forEach(scope => {
            const { x, y } = scope.position;
            const r = scope.customData.radius || 20; // Default for non-circle scopes

            // For polygon scopes (closure func), r is approx
            if (scope.label === 'function' && scope.customData.type === 'closure') {
                 context.font = "12px Arial";
                 context.fillStyle = "black";
                 context.textAlign = "center";
                 context.fillText("func", x, y + 4);
                 return;
            }

            // Draw bubble gradient
            const gradient = context.createRadialGradient(x, y, r * 0.1, x, y, r);
            gradient.addColorStop(0, 'rgba(100, 255, 218, 0.05)');
            gradient.addColorStop(0.8, 'rgba(100, 255, 218, 0.2)');
            gradient.addColorStop(1, 'rgba(100, 255, 218, 0.4)');

            context.beginPath();
            context.arc(x, y, r, 0, 2 * Math.PI);
            context.fillStyle = gradient;
            context.fill();

            // Draw Label
            context.font = "bold 14px Arial";
            context.fillStyle = "#64ffda";
            context.textAlign = "center";
            const lines = scope.customData.label.split('\n');
            lines.forEach((line, i) => {
                context.fillText(line, x, y - r - 10 + (i * 15));
            });
        });

        // Render Variables
        variables.forEach(variable => {
            const { x, y } = variable.position;
            const r = 15;

            // Variable is already drawn by Matter.js debug render (red circle),
            // but let's overlay text
            context.font = "12px Arial";
            context.fillStyle = "white"; // Text color on top of red
            context.textAlign = "center";
            context.fillText(variable.customData.value, x, y + 4);

            // Label name below
            context.font = "10px Arial";
            context.fillStyle = "#ccc";
            context.fillText(variable.customData.label, x, y + r + 12);
        });
    });
}
