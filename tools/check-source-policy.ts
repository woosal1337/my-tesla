import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { Parser, parseAllDocuments } from "yaml";

type Group = "script" | "python" | "style" | "yaml" | "lineConfig";

const scriptExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".json",
]);
const lineConfigNames = new Set([
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".prettierignore",
  ".env.example",
  ".dockerignore",
  "Dockerfile",
]);
const proseExtensions = new Set([".md"]);
const assetExtensions = new Set([
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".svg",
  ".woff",
  ".woff2",
]);
const generatedFiles = new Set(["bun.lock"]);
const legalFiles = new Set(["LICENSE"]);
const vendoredFiles = new Set(["src/components/ui/map.tsx"]);

function authoredFiles(): string[] {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8" },
  );
  return output.split("\0").filter((file) => file && existsSync(file));
}

function groupOf(file: string): Group | "skip" | "unsupported" {
  const name = path.basename(file);
  const extension = path.extname(file);
  if (
    generatedFiles.has(file) ||
    legalFiles.has(file) ||
    vendoredFiles.has(file) ||
    proseExtensions.has(extension) ||
    assetExtensions.has(extension)
  ) {
    return "skip";
  }
  if (lineConfigNames.has(name)) return "lineConfig";
  if (scriptExtensions.has(extension)) return "script";
  if (extension === ".py") return "python";
  if (extension === ".css") return "style";
  if (extension === ".yml" || extension === ".yaml") return "yaml";
  return "unsupported";
}

function lineOf(text: string, offset: number): number {
  return text.slice(0, offset).split("\n").length;
}

function runAdapter(argv: string[], files: string[]): boolean {
  if (!files.length) return true;
  const [command, ...args] = argv;
  return (
    spawnSync(command, [...args, ...files], { stdio: "inherit" }).status === 0
  );
}

function checkStyle(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const errors: string[] = [];
  try {
    postcss.parse(text, { from: file }).walkComments((comment) => {
      errors.push(
        `${file}:${comment.source?.start?.line ?? 1}: Remove the source comment.`,
      );
    });
  } catch (error) {
    errors.push(`${file}: ${error instanceof Error ? error.message : error}`);
  }
  return errors;
}

function collectYamlComments(node: unknown, offsets: number[]) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectYamlComments(child, offsets));
    return;
  }
  if (node && typeof node === "object") {
    const token = node as { type?: string; offset?: number };
    if (token.type === "comment" && typeof token.offset === "number") {
      offsets.push(token.offset);
    }
    Object.values(node).forEach((child) => collectYamlComments(child, offsets));
  }
}

function checkYaml(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const errors = parseAllDocuments(text).flatMap((document) =>
    document.errors.map((error) => `${file}: ${error.message}`),
  );
  const offsets: number[] = [];
  for (const token of new Parser().parse(text)) {
    collectYamlComments(token, offsets);
  }
  return errors.concat(
    offsets.map(
      (offset) => `${file}:${lineOf(text, offset)}: Remove the comment.`,
    ),
  );
}

function checkLineConfig(file: string): string[] {
  const markers = path.basename(file) === ".editorconfig" ? ["#", ";"] : ["#"];
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, index) =>
      markers.some((marker) => line.trimStart().startsWith(marker))
        ? [`${file}:${index + 1}: Remove the comment line.`]
        : [],
    );
}

function main(): number {
  const groups: Record<Group, string[]> = {
    script: [],
    python: [],
    style: [],
    yaml: [],
    lineConfig: [],
  };
  const errors: string[] = [];
  for (const file of authoredFiles()) {
    const group = groupOf(file);
    if (group === "unsupported") {
      errors.push(`${file}: Add a source adapter for this file type.`);
    } else if (group !== "skip") {
      groups[group].push(file);
    }
  }
  errors.push(...groups.style.flatMap(checkStyle));
  errors.push(...groups.yaml.flatMap(checkYaml));
  errors.push(...groups.lineConfig.flatMap(checkLineConfig));
  errors.forEach((error) => console.error(error));
  const scriptsPass = runAdapter(
    ["bun", "tools/check-source-comments.mjs"],
    groups.script,
  );
  const pythonPass = runAdapter(
    ["python3", "tools/check-source-comments.py"],
    groups.python,
  );
  return errors.length || !scriptsPass || !pythonPass ? 1 : 0;
}

process.exit(main());
