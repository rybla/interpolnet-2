import {
  app_name,
  demo_slug_pattern,
  directory_new_demo_placeholder_text,
  notes_dirpath,
  public_dirpath,
  root_url,
} from "@/constants";
import { argument, object, string } from "@optique/core";
import { run } from "@optique/run";
import fs from "fs";

// -----------------------------------------------------------------------------

const parser = object({
  name: argument(string({ metavar: "DEMO_NAME" }), {
    description: [
      {
        type: "text",
        text: "The full name of the new demo.",
      },
    ],
  }),
  slug: argument(string({ metavar: "DEMO_SLUG", pattern: demo_slug_pattern }), {
    description: [
      {
        type: "text",
        text: "The short unique slug for the new demo.",
      },
    ],
  }),
});

const config = run(parser, {
  programName: "./initialize-new-demo",
});

// -----------------------------------------------------------------------------

const directory_filepath = `${notes_dirpath}/Directory.md`;
console.log(
  `Creating a new placeholder entry in \`${directory_filepath}\` for new demo "${config.name}"`,
);
fs.appendFileSync(
  directory_filepath,
  `
## ${config.name} [[demo](${root_url}/${config.slug})]

${directory_new_demo_placeholder_text(config.name)}
`,
);

const demo_dirpath = `${public_dirpath}/${config.slug}`;
console.log(`Creating a new directory at \`${demo_dirpath}\``);

fs.mkdirSync(demo_dirpath);

// -----------------------------------------------------------------------------

const demo_index_filepath = `${demo_dirpath}/index.html`;

const demo_script_filename = "script.js";
const demo_script_filepath = `${demo_dirpath}/${demo_script_filename}`;

const demo_styles_filename = "style.css";
const demo_styles_filepath = `${demo_dirpath}/${demo_styles_filename}`;

const demo_manifest_filepath = `${demo_dirpath}/manifest.json`;

console.log(
  `Creating template HTML for demo "${config.name}" at \`${demo_index_filepath}\``,
);
fs.writeFileSync(
  demo_index_filepath,
  `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${app_name} | ${config.name}</title>
    <link rel="stylesheet" href="./${demo_styles_filename}" />
    <script src="./${demo_script_filename}" defer></script>
  </head>
  <body>
    <!-- TODO: HTML for new demo "${config.name}" -->
  </body>
</html>
`.trimStart(),
  { encoding: "utf-8" },
);

console.log(
  `Creating template Javascript for new demo "${config.name}" at \`${demo_script_filepath}\``,
);
fs.writeFileSync(
  demo_script_filepath,
  `// TODO: main script for new demo "${config.name}"\n`,
  { encoding: "utf-8" },
);

console.log(
  `Creating template CSS styles for new demo "${config.name}" at \`${demo_styles_filepath}\``,
);
fs.writeFileSync(
  demo_styles_filepath,
  `/* TODO: styles for new demo "${config.name}" */\n`,
  { encoding: "utf-8" },
);

console.log(
  `Creating manifest file for new demo "${config.name}" at \`${demo_manifest_filepath}\``,
);
fs.writeFileSync(
  demo_manifest_filepath,
  `{
  "name": "${config.name}",
  "slug": "${config.slug}"
}\n`,
  { encoding: "utf-8" },
);
