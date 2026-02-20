import { cq, cqBlock } from "@/utility";

console.log(
  `
These are instructions for your task.

Your task is to implement a new demo based on a natural language description. Run this command to get the description of the demo for you to implement:

${cqBlock("sh", "bun run scripts/get-description-of-next-demo.ts")}

Once you have your demo description, run this command to get your next instructions:

${cqBlock("sh", "bun run scripts/get-instructions-for-demo.ts")}
`.trim(),
);
