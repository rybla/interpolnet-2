import z from "zod";
import path from "path";

export const app_name = "Interpolnet 2";
export const root_url_relative_prefix = "interpolnet-2";
export const root_url = `https://rybla.github.io/${root_url_relative_prefix}`;
export const public_dirpath = "public";
export const dist_dirpath = "dist";

export const notes_dirpath = "notes";
export const directory_filepath = path.join(notes_dirpath, "Directory.md");
export const instructions_filepath = path.join(
  notes_dirpath,
  "Instructions.md",
);

export const demo_slug_pattern = /^[a-zA-Z0-9_-]+$/;
export const demo_slug_schema = z.string().regex(demo_slug_pattern);

export type DemoManifest = z.infer<typeof demo_manifest_schema>;
export const demo_manifest_schema = z.object({
  name: z.string(),
  slug: demo_slug_schema,
});

export function directory_new_demo_placeholder_text(name: string) {
  return `TODO: comprehensive description of new demo "${name}"`;
}
