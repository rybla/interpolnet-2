import {
  app_name,
  demo_manifest_schema,
  dist_dirpath,
  public_dirpath,
  type DemoManifest,
} from "@/constants";
import { do_, getAllDemoSlugs } from "@/utility";
import fs from "fs";
import { renderToStaticMarkup } from "react-dom/server";
import z from "zod";

// -----------------------------------------------------------------------------

console.log("Removing old dist directory");
fs.rmSync(dist_dirpath, { recursive: true, force: true });

console.log("Copying public directory to new dist directory");
fs.cpSync(public_dirpath, dist_dirpath, { recursive: true, force: true });

// -----------------------------------------------------------------------------

console.log("Reading demo manifests");

const demo_slugs = getAllDemoSlugs();
const demo_manifests: DemoManifest[] = [];

for (const demo_slug of demo_slugs) {
  const demo_dirpath = `${public_dirpath}/${demo_slug}`;

  if (!fs.statSync(demo_dirpath).isDirectory()) continue;

  const demo_manifest_text = fs.readFileSync(`${demo_dirpath}/manifest.json`, {
    encoding: "utf-8",
  });

  const demo_manifest_json = do_(() => {
    try {
      return JSON.parse(demo_manifest_text);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `for demo \`${demo_slug}\`, the demo manifest file is invalid JSON:\n${error.message}`,
        );
      } else {
        throw error;
      }
    }
  });

  const demo_manifest = do_(() => {
    const result = demo_manifest_schema.safeParse(demo_manifest_json);
    if (!result.success) {
      throw new Error(
        `for demo \`${demo_slug}\`, the demo manifest file was invalid:\n${z.prettifyError(result.error)}`,
      );
    }
    return result.data;
  });

  demo_manifests.push(demo_manifest);
}

// -----------------------------------------------------------------------------

console.log("Building index");

function Index() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{`${app_name} | Index`}</title>
        <link rel="stylesheet" href="./index.css"></link>
      </head>
      <body>
        <div className="title">{app_name}</div>
        <div className="menu">
          {demo_manifests.map((demo_manifest, i) => (
            <a className="menu-item" href={`./${demo_manifest.slug}/`} key={i}>
              {demo_manifest.name}
            </a>
          ))}
        </div>
      </body>
    </html>
  );
}

const index_filepath = `${dist_dirpath}/index.html`;
console.log(`Writing index HTML to \`${index_filepath}\``);
fs.writeFileSync(
  index_filepath,
  `<!DOCTYPE html>${renderToStaticMarkup(<Index />)}`,
);
