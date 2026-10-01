import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const errors = new Set();
const jsxParents = new Set([
  ts.SyntaxKind.JsxElement,
  ts.SyntaxKind.JsxFragment,
  ts.SyntaxKind.JsxOpeningElement,
  ts.SyntaxKind.JsxClosingElement,
  ts.SyntaxKind.JsxSelfClosingElement,
  ts.SyntaxKind.JsxOpeningFragment,
  ts.SyntaxKind.JsxClosingFragment,
]);
const ignored = new Set([ts.SyntaxKind.JsxText]);

for (const file of process.argv.slice(2)) {
  const text = fs.readFileSync(file, "utf8");
  const extension = path.extname(file);
  if (extension === ".json") {
    try {
      JSON.parse(text);
    } catch {
      errors.add(`${file}: Invalid JSON or a source comment.`);
    }
    continue;
  }
  if (
    ![".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"].includes(
      extension,
    )
  ) {
    errors.add(`${file}: Use an adapter for this source language.`);
    continue;
  }
  const kind =
    extension === ".tsx" || extension === ".jsx"
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  for (const diagnostic of source.parseDiagnostics) {
    errors.add(
      `${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
    );
  }
  const add = (ranges) => {
    for (const range of ranges ?? []) {
      const line = source.getLineAndCharacterOfPosition(range.pos).line + 1;
      errors.add(`${file}:${line}: Remove the source comment.`);
    }
  };
  const visit = (node) => {
    if (!ignored.has(node.kind)) {
      add(ts.getLeadingCommentRanges(text, node.pos));
      if (!jsxParents.has(node.parent?.kind)) {
        add(ts.getTrailingCommentRanges(text, node.end));
      }
    }
    for (const child of node.getChildren(source)) {
      visit(child);
    }
  };
  visit(source);
  add(ts.getTrailingCommentRanges(text, source.end));
}

if (process.argv.length < 3) {
  console.error("Pass every authored JavaScript, TypeScript, and JSON file.");
  process.exit(1);
}
for (const error of errors) {
  console.error(error);
}
if (errors.size) {
  process.exit(1);
}
