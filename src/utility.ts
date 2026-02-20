import fs from "fs";
import { public_dirpath } from "./constants";

export function do_<A>(k: () => A): A {
  return k();
}

export function cq(s: string): string {
  return `\`${s.trim()}\``;
}

export function cqBlock(lang: string, s: string): string {
  return `\`\`\`${lang}\n${s.trim()}\n\`\`\``;
}

export function getAllDemoSlugs(): string[] {
  return fs.readdirSync(public_dirpath);
}
