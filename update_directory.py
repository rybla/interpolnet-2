
import os

filepath = 'notes/Directory.md'
placeholder = 'TODO: comprehensive description of new demo "Nostalgic OS Window Chaos"'

new_content = """A retro-themed web experience that simulates a crashing Windows 95 desktop. The core mechanic is a visual glitch where dragging a window causes it to leave an infinite, highly satisfying trail of frozen window clones across the canvas. Users can embrace this chaos to use windows as makeshift paintbrushes, creating complex patterns and "art" from the debris of a failing operating system.

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
    - Sound effects for error chords and clicks to enhance the retro feel."""

with open(filepath, 'r') as f:
    content = f.read()

if placeholder in content:
    updated_content = content.replace(placeholder, new_content)
    with open(filepath, 'w') as f:
        f.write(updated_content)
    print("Successfully updated notes/Directory.md")
else:
    print("Placeholder not found in notes/Directory.md")
