import { public_dirpath, screenshots_dirpath } from "@/constants";
import { cq } from "@/utility";
import path from "path";

console.log(
  `
These are instructions for validating your demo implementation.

To validate your demo implementation, use the ${cq("http.server")} Python module launch a web server at ${cq(path.join(public_dirpath, "<DEMO_SLUG>"))} (which is the directory where you implemented the demo) and use the Playwright library for Python to perform these steps:

- Open a browser window to view the demo.
- Interact with the demo to make sure the key aspects are working properly
- After some interaction, take a screenshot and save it as an image file at this path: ${cq(path.join(screenshots_dirpath, "<DEMO_SLUG>"))}.

If there are any issues with the demo, modify your implementation to address them.

Once there are no issues, submit your work.
`.trim(),
);
