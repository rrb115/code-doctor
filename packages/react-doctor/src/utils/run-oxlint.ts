import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ERROR_PREVIEW_LENGTH_CHARS, SOURCE_FILE_PATTERN } from "../constants.js";
import { createOxlintConfig } from "../oxlint-config.js";
import type { CleanedDiagnostic, Diagnostic, OxlintOutput } from "../types.js";
import { neutralizeDisableDirectives } from "./neutralize-disable-directives.js";

const esmRequire = createRequire(import.meta.url);

const RULE_CATEGORY_MAP: Record<string, string> = {
  "code-doctor/llm-static-prompt-call": "LLM Cost & Latency",
  "code-doctor/llm-deterministic-task": "LLM Cost & Latency",
  "code-doctor/llm-loop-call": "LLM Cost & Latency",
  "code-doctor/llm-sequential-call": "LLM Cost & Latency",

  "code-doctor/no-secrets-in-client-code": "Security",
  "code-doctor/no-eval": "Security",

  "code-doctor/async-parallel": "Performance",
  "code-doctor/js-combine-iterations": "Performance",
  "code-doctor/js-tosorted-immutable": "Performance",
  "code-doctor/js-hoist-regexp": "Performance",
  "code-doctor/js-min-max-loop": "Performance",
  "code-doctor/js-set-map-lookups": "Performance",
  "code-doctor/js-index-maps": "Performance",
  "code-doctor/js-early-exit": "Performance",
};

const RULE_HELP_MAP: Record<string, string> = {
  "llm-static-prompt-call":
    "If prompt/input is static, replace the model call with a constant lookup or deterministic helper",
  "llm-deterministic-task":
    "Use local deterministic logic (string methods, regex, switch, or parser) instead of an LLM call for this task",
  "llm-loop-call":
    "Avoid per-item model calls inside loops/maps. Pre-filter deterministically, batch requests, or replace with local parsing logic",
  "llm-sequential-call":
    "Collapse sequential model calls by moving deterministic logic local-first and parallelizing only truly independent LLM requests",

  "no-secrets-in-client-code":
    "Move to server-side `process.env.SECRET_NAME`. Only `NEXT_PUBLIC_*` vars are safe for the client (and should not contain secrets)",
  "no-eval": "Replace eval() with JSON.parse(), Function(), or a safe expression evaluator",

  "async-parallel":
    "Use `const [a, b] = await Promise.all([fetchA(), fetchB()])` to run independent operations concurrently",
  "js-combine-iterations":
    "Merge multiple .map()/.filter() chains into a single .reduce() or for-loop to avoid redundant passes",
  "js-tosorted-immutable":
    "Use `.toSorted()` instead of `.slice().sort()` for a cleaner immutable sort",
  "js-hoist-regexp":
    "Move RegExp literals outside loops/functions to avoid re-compilation on every call",
  "js-min-max-loop":
    "Replace manual min/max loops with `Math.min(...arr)` or `Math.max(...arr)`",
  "js-set-map-lookups":
    "Use a Set or Map for O(1) lookups instead of repeated Array.includes() or Array.find()",
  "js-index-maps":
    "Build an index Map once (`new Map(items.map(i => [i.id, i]))`) instead of repeated .find() calls",
  "js-early-exit":
    "Return early from the function instead of wrapping the entire body in an if-block",
};

const FILEPATH_WITH_LOCATION_PATTERN = /\S+\.\w+:\d+:\d+[\s\S]*$/;

const cleanDiagnosticMessage = (
  message: string,
  help: string,
  _plugin: string,
  rule: string,
): CleanedDiagnostic => {
  const cleaned = message.replace(FILEPATH_WITH_LOCATION_PATTERN, "").trim();
  return { message: cleaned || message, help: help || RULE_HELP_MAP[rule] || "" };
};

const parseRuleCode = (code: string): { plugin: string; rule: string } => {
  const match = code.match(/^(.+)\((.+)\)$/);
  if (!match) return { plugin: "unknown", rule: code };
  return { plugin: match[1].replace(/^eslint-plugin-/, ""), rule: match[2] };
};

const resolveOxlintBinary = (): string => {
  const oxlintMainPath = esmRequire.resolve("oxlint");
  const oxlintPackageDirectory = path.resolve(path.dirname(oxlintMainPath), "..");
  return path.join(oxlintPackageDirectory, "bin", "oxlint");
};

const resolvePluginPath = (): string => {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const pluginPath = path.join(currentDirectory, "code-doctor-plugin.js");
  if (fs.existsSync(pluginPath)) return pluginPath;

  const distPluginPath = path.resolve(currentDirectory, "../../dist/code-doctor-plugin.js");
  if (fs.existsSync(distPluginPath)) return distPluginPath;

  return pluginPath;
};

const resolveDiagnosticCategory = (plugin: string, rule: string): string => {
  const ruleKey = `${plugin}/${rule}`;
  return RULE_CATEGORY_MAP[ruleKey] ?? "Other";
};

export const runOxlint = async (
  rootDirectory: string,
  hasTypeScript: boolean,
): Promise<Diagnostic[]> => {
  const configPath = path.join(os.tmpdir(), `code-doctor-oxlintrc-${process.pid}.json`);
  const pluginPath = resolvePluginPath();
  const config = createOxlintConfig({ pluginPath });
  const restoreDisableDirectives = neutralizeDisableDirectives(rootDirectory);

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const oxlintBinary = resolveOxlintBinary();
    const args = [oxlintBinary, "-c", configPath, "--format", "json"];

    if (hasTypeScript) {
      args.push("--tsconfig", "./tsconfig.json");
    }

    args.push(".");

    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd: rootDirectory,
      });

      const stdoutBuffers: Buffer[] = [];
      const stderrBuffers: Buffer[] = [];

      child.stdout.on("data", (buffer: Buffer) => stdoutBuffers.push(buffer));
      child.stderr.on("data", (buffer: Buffer) => stderrBuffers.push(buffer));

      child.on("error", (error) => reject(new Error(`Failed to run oxlint: ${error.message}`)));
      child.on("close", () => {
        const output = Buffer.concat(stdoutBuffers).toString("utf-8").trim();
        if (!output) {
          const stderrOutput = Buffer.concat(stderrBuffers).toString("utf-8").trim();
          if (stderrOutput) {
            reject(new Error(`Failed to run oxlint: ${stderrOutput}`));
            return;
          }
        }
        resolve(output);
      });
    });

    if (!stdout) {
      return [];
    }

    let output: OxlintOutput;
    try {
      output = JSON.parse(stdout) as OxlintOutput;
    } catch {
      throw new Error(
        `Failed to parse oxlint output: ${stdout.slice(0, ERROR_PREVIEW_LENGTH_CHARS)}`,
      );
    }

    return output.diagnostics
      .filter((diagnostic) => SOURCE_FILE_PATTERN.test(diagnostic.filename))
      .map((diagnostic) => {
        const { plugin, rule } = parseRuleCode(diagnostic.code);
        const primaryLabel = diagnostic.labels[0];

        const cleaned = cleanDiagnosticMessage(diagnostic.message, diagnostic.help, plugin, rule);

        return {
          filePath: diagnostic.filename,
          plugin,
          rule,
          severity: diagnostic.severity,
          message: cleaned.message,
          help: cleaned.help,
          line: primaryLabel?.span.line ?? 0,
          column: primaryLabel?.span.column ?? 0,
          category: resolveDiagnosticCategory(plugin, rule),
        };
      });
  } finally {
    restoreDisableDirectives();
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
};
