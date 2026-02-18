# code-doctor (llminate)

> Detect and eliminate unnecessary LLM calls in any JavaScript/TypeScript codebase — replace them with deterministic local logic to cut latency and cost.

Forked from [react-doctor](https://github.com/millionco/react-doctor) and repurposed as a focused LLM optimization tool.

---

## Installation

Run directly with npx (no install required):

```bash
npx -y code-doctor@latest .
```

Or install globally:

```bash
npm install -g code-doctor
code-doctor .
```

---

## What it detects

### LLM Cost & Latency

| Rule | Severity | What it flags |
|------|----------|---------------|
| `llm-static-prompt-call` | error | LLM calls with a fully static prompt — replace with a constant or deterministic helper |
| `llm-deterministic-task` | warning | Prompts requesting deterministic operations (normalize, parse, validate, classify yes/no) |
| `llm-loop-call` | warning | Per-item LLM calls inside loops/maps — batch or replace with local logic |
| `llm-sequential-call` | warning | Consecutive awaited LLM calls that can be parallelized or collapsed |

### Performance

| Rule | Severity | What it flags |
|------|----------|---------------|
| `async-parallel` | warning | Sequential `await` calls that can run with `Promise.all` |
| `js-combine-iterations` | warning | Multiple `.map()/.filter()` chains that can be merged |
| `js-hoist-regexp` | warning | RegExp literals inside loops that get re-compiled on every iteration |
| `js-min-max-loop` | warning | Manual min/max loops replaceable with `Math.min/max` |
| `js-set-map-lookups` | warning | Repeated `Array.includes/find` that should use a `Set` or `Map` |
| `js-index-maps` | warning | Repeated `.find()` calls that should use an index `Map` |
| `js-early-exit` | warning | Functions with a large if-block that should return early |
| `js-tosorted-immutable` | warning | `.slice().sort()` replaceable with `.toSorted()` |

### Security

| Rule | Severity | What it flags |
|------|----------|---------------|
| `no-secrets-in-client-code` | error | API keys / tokens hardcoded in client-side code |
| `no-eval` | error | `eval()` usage |

---

## CLI options

```
Usage: code-doctor [options] [directory]

Arguments:
  directory              project directory to scan (default: ".")

Options:
  --no-lint              skip linting
  --no-dead-code         skip dead code detection
  --score-only           print score only (machine-readable)
  -v, --version          display the version number
  -h, --help             display help
```

---

## Node.js API

```typescript
import { diagnose } from "code-doctor/api";

const result = await diagnose("./my-project", {
  lint: true,
  deadCode: false,
});

console.log(result.diagnostics);
console.log(result.score);
```

---

## ESLint / Oxlint plugin

The rules are also available as a standalone plugin for use in your own Oxlint config:

```json
{
  "jsPlugins": ["./node_modules/code-doctor/dist/code-doctor-plugin.js"],
  "rules": {
    "code-doctor/llm-static-prompt-call": "error",
    "code-doctor/llm-deterministic-task": "warn",
    "code-doctor/llm-loop-call": "warn",
    "code-doctor/llm-sequential-call": "warn"
  }
}
```

---

## Example: what gets flagged

```typescript
// ❌ llm-static-prompt-call — prompt is fully static, no LLM needed
const result = await openai.chat.completions.create({
  messages: [{ role: "user", content: "What is the capital of France?" }],
});

// ✅ Replace with a constant
const result = "Paris";
```

```typescript
// ❌ llm-deterministic-task — normalizing a string doesn't need a model
const slug = await llm.generate({ prompt: `Convert "${title}" to a URL slug` });

// ✅ Replace with deterministic logic
const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
```

```typescript
// ❌ llm-loop-call — one model call per item
const results = await Promise.all(items.map(item =>
  openai.chat.completions.create({ messages: [{ role: "user", content: item }] })
));

// ✅ Pre-filter deterministically, then batch the remaining items
const needsModel = items.filter(item => !isSimpleCase(item));
const results = await openai.chat.completions.create({ messages: needsModel.map(...) });
```

```typescript
// ❌ llm-sequential-call — two independent calls run one after the other
const summary = await llm.generate({ prompt: "Summarize: " + doc });
const tags = await llm.generate({ prompt: "Tag: " + doc });

// ✅ Parallelize
const [summary, tags] = await Promise.all([
  llm.generate({ prompt: "Summarize: " + doc }),
  llm.generate({ prompt: "Tag: " + doc }),
]);
```

---

## Origin

This project is a fork of [react-doctor](https://github.com/millionco/react-doctor) by the Million.js team. The React-specific rules have been removed and replaced with a focused set of LLM optimization rules that work on any JS/TS codebase.
