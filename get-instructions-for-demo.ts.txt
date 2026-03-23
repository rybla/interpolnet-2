import {
  directory_filepath,
  directory_new_demo_placeholder_text,
  public_dirpath,
} from "@/constants";
import { cq, cqBlock } from "@/utility";
import path from "path";

console.log(
  `
These are instructions for implementing a new demo.

Now that you have the description of the demo you must implement, run this command to initialize the setup for the new demo:

${cqBlock("sh", "bun run scripts/initialize-new-demo.ts <DEMO_NAME> <DEMO_SLUG>")}

Here, ${cq("<DEMO_NAME>")} is the human-readable name for your new demo, and ${cq("<DEMO_SLUG>")} is a slug version of the name. Note that ${cq("<DEMO_NAME>")} and ${cq("<DEMO_SLUG>")} will be referenced in later instructions.

This command does two things:

- It adds a new placeholder entry to ${cq(directory_filepath)} for your new demo.
- It initializes the contents of a new directory at ${cq(path.join(public_dirpath, "<DEMO_SLUG>"))} which is where you will be doing your work to implement the new demo.

Now, you should replace the placeholder text in ${cq(directory_filepath)}, which looks like "${directory_new_demo_placeholder_text("<DEMO_NAME>")}" (where "<DEMO_NAME>" is your demo's name) with a flushed-out comprehensive description of what your demo is, what are the specific features, what are the design goal, and a basic outline of the implementation plan. Be creative! Make sure to follow the demo description you were given earlier.

Finally, you must implement the demo according to your flushed-out and comprehensive description of the demo and implementation plan in ${cq(path.join(public_dirpath, "<DEMO_SLUG>"))}. That directory has been initialized with some template files which you should edit to implement the demo.

Recall that each demo must follow these guidelines:

- Use distinct, unique, and consistent color schemes and typography.
- Use many passive and active animations to indicate what elements are interactable, and when things change in response to either automatic updates or user input.
- Ensure that the webpage is designed to be mobile-friendly.
- Use a responsive design.

Once you've finished implementing the demo, run this command for the next instructions on validating your demo implementation:

${cqBlock("sh", "bun run scripts/get-instructions-for-validation.ts")}
`.trim(),
);
