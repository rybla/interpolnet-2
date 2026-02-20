import { demo_descriptions_filepath } from "@/constants";
import fs from "fs";

const content = fs.readFileSync(demo_descriptions_filepath, {
  encoding: "utf-8",
});
const lines = content.split("\n");
const line = lines.shift();
if (line === undefined || line.length === 0) {
  console.error(
    "There are no more demo descriptions left. Stop your task now.",
  );
  process.exit();
}

fs.writeFileSync(demo_descriptions_filepath, lines.join("\n"), {
  encoding: "utf-8",
});

console.log(
  `
Your demo description is the following:

${line}
`.trim(),
);
