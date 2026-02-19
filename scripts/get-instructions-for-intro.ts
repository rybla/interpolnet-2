import { cq, cqBlock } from "@/utility";

console.log(
  `
These are instructions for introduction to the project.

Carefully read ${cq("README.md")} to understand an overview of this project.

Then, run this command to get your next instructions:

${cqBlock("sh", "bun run scripts/get-task-instructions.ts")}
`.trim(),
);
