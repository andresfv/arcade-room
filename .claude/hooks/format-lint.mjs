// PostToolUse hook: formatea con Prettier y corrige con ESLint cada archivo
// creado o editado por Claude dentro del proyecto.
// Exit 2 + stderr cuando quedan errores, para que Claude los vea y los corrija.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
const ESLINT_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const SKIP_DIRS = ["node_modules", ".next", ".git"];
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let filePath;
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!filePath) process.exit(0);
// Git Bash puede entregar rutas tipo /c/Users/...; convertirlas a C:/Users/...
const toNative = (p) =>
  process.platform === "win32" ? p.replace(/^\/([a-zA-Z])\//, "$1:/") : p;
const projectDir = path.resolve(
  toNative(process.env.CLAUDE_PROJECT_DIR ?? process.cwd()),
);
const absFile = path.resolve(toNative(filePath));
if (!existsSync(absFile)) process.exit(0);
const rel = path.relative(projectDir, absFile);
if (rel.startsWith("..") || path.isAbsolute(rel)) process.exit(0);
if (rel.split(path.sep).some((part) => SKIP_DIRS.includes(part)))
  process.exit(0);
const isWin = process.platform === "win32";
const bin = (name) =>
  path.join(projectDir, "node_modules", ".bin", isWin ? `${name}.cmd` : name);
function run(name, args) {
  const cmd = bin(name);
  if (!existsSync(cmd)) return { status: 0, output: "" };
  const quoted = isWin
    ? [`"${cmd}"`, ...args.map((a) => `"${a}"`)]
    : [cmd, ...args];
  const res = spawnSync(quoted[0], quoted.slice(1), {
    cwd: projectDir,
    encoding: "utf8",
    shell: isWin,
  });
  return {
    status: res.status ?? 1,
    output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim(),
  };
}
const problems = [];
const prettier = run("prettier", [
  "--write",
  "--ignore-unknown",
  "--log-level",
  "warn",
  rel,
]);
if (prettier.status !== 0)
  problems.push(`Prettier falló en ${rel}:\n${prettier.output}`);
// ESLint después de Prettier: --fix aplica las recomendaciones del linter y
// no-multiple-empty-lines (max 0) elimina todas las líneas en blanco del código
// (respeta template literals). --max-warnings 0 reporta también las advertencias.
if (ESLINT_EXTS.has(path.extname(absFile).toLowerCase())) {
  const eslint = run("eslint", [
    "--fix",
    "--no-warn-ignored",
    "--max-warnings",
    "0",
    "--rule",
    "no-multiple-empty-lines: [error, {max: 0, maxBOF: 0, maxEOF: 0}]",
    rel,
  ]);
  if (eslint.status !== 0)
    problems.push(`ESLint reporta problemas en ${rel}:\n${eslint.output}`);
}
if (problems.length) {
  console.error(problems.join("\n\n"));
  process.exit(2);
}
process.exit(0);
