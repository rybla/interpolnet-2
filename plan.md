1. **Update `notes/Directory.md`**
   - Write a detailed description of the "Error Diffusion Dithering Visualizer" to a temporary file.
   - Use `sed` to replace the "TODO: comprehensive description of new demo" placeholder with the detailed description.
   - Remove the temporary file.
   - Verify the changes using the `read_file` tool.
2. **Implement the HTML Structure (`public/error-diffusion-dithering/index.html`)**
   - Create the layout with a main viewing area for the image and slider, and a control panel for algorithm selection and image upload.
   - Include the necessary CSS and JS links.
   - Verify the changes using the `read_file` tool.
3. **Implement the CSS Styling (`public/error-diffusion-dithering/style.css`)**
   - Apply a "dark room" or photography-inspired theme with distinct, unique, and consistent colors and typography.
   - Implement responsive design for mobile and desktop using flexbox/grid.
   - Add animations for interactive elements like the slider and buttons.
   - Verify the changes using the `read_file` tool.
4. **Implement the JavaScript Logic (`public/error-diffusion-dithering/script.js`)**
   - Load a default high-resolution image (e.g., generate a gradient or use a data URI or placeholder image) and handle image uploads.
   - Implement the error diffusion dithering algorithms: Floyd-Steinberg, Atkinson, Jarvis-Judice-Ninke, and Stucki.
   - Implement the interactive comparison slider using `clip-path` or drawing logic on an HTML5 canvas.
   - Cache the dithered image when the algorithm changes to ensure smooth slider performance.
   - Verify the changes using the `read_file` tool.
5. **Validation and Verification**
   - Follow instructions from the `frontend_verification_instructions` tool to write a Python script using Playwright.
   - Run the script to start a local server, navigate to the page, interact with it, and take a screenshot at `screenshots/error-diffusion-dithering.png`.
   - Verify the visual output using the `read_image_file` tool.
6. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
7. **Submit the changes**
   - Submit the branch with a descriptive commit message.