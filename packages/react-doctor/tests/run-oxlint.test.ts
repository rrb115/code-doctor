import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Diagnostic } from "../src/types.js";
import { runOxlint } from "../src/utils/run-oxlint.js";

const FIXTURES_DIRECTORY = path.resolve(import.meta.dirname, "fixtures");
const LLM_SERVICE_DIRECTORY = path.join(FIXTURES_DIRECTORY, "llm-service");

const findDiagnosticsByRule = (diagnostics: Diagnostic[], rule: string): Diagnostic[] =>
  diagnostics.filter((diagnostic) => diagnostic.rule === rule);

interface RuleTestCase {
  fixture: string;
  ruleSource: string;
  severity?: "error" | "warning";
  category?: string;
}

const describeRules = (
  groupName: string,
  rules: Record<string, RuleTestCase>,
  getDiagnostics: () => Diagnostic[],
) => {
  describe(groupName, () => {
    for (const [ruleName, testCase] of Object.entries(rules)) {
      it(`${ruleName} (${testCase.fixture} → ${testCase.ruleSource})`, () => {
        const issues = findDiagnosticsByRule(getDiagnostics(), ruleName);
        expect(issues.length).toBeGreaterThan(0);
        if (testCase.severity) expect(issues[0].severity).toBe(testCase.severity);
        if (testCase.category) expect(issues[0].category).toBe(testCase.category);
      });
    }
  });
};

let llmDiagnostics: Diagnostic[];

describe("runOxlint", () => {
  it("loads llm-service diagnostics", async () => {
    llmDiagnostics = await runOxlint(LLM_SERVICE_DIRECTORY, false);
    expect(llmDiagnostics.length).toBeGreaterThan(0);
  });

  it("returns diagnostics with required fields", () => {
    for (const diagnostic of llmDiagnostics) {
      expect(diagnostic).toHaveProperty("filePath");
      expect(diagnostic).toHaveProperty("plugin");
      expect(diagnostic).toHaveProperty("rule");
      expect(diagnostic).toHaveProperty("severity");
      expect(diagnostic).toHaveProperty("message");
      expect(diagnostic).toHaveProperty("category");
      expect(["error", "warning"]).toContain(diagnostic.severity);
      expect(diagnostic.message.length).toBeGreaterThan(0);
    }
  });

  it("only reports diagnostics from source files", () => {
    for (const diagnostic of llmDiagnostics) {
      expect(diagnostic.filePath).toMatch(/\.(tsx?|jsx?)$/);
    }
  });

  describeRules(
    "llm latency rules",
    {
      "llm-static-prompt-call": {
        fixture: "src/llm-issues.ts",
        ruleSource: "rules/llm.ts",
        severity: "error",
        category: "LLM Cost & Latency",
      },
      "llm-deterministic-task": {
        fixture: "src/llm-issues.ts",
        ruleSource: "rules/llm.ts",
        severity: "warning",
        category: "LLM Cost & Latency",
      },
      "llm-loop-call": {
        fixture: "src/llm-issues.ts",
        ruleSource: "rules/llm.ts",
        severity: "warning",
        category: "LLM Cost & Latency",
      },
      "llm-sequential-call": {
        fixture: "src/llm-issues.ts",
        ruleSource: "rules/llm.ts",
        severity: "warning",
        category: "LLM Cost & Latency",
      },
    },
    () => llmDiagnostics,
  );
});
