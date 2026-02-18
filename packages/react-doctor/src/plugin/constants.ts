// Thresholds
export const SEQUENTIAL_AWAIT_THRESHOLD = 3;
export const SECRET_MIN_LENGTH_CHARS = 8;
export const AUTH_CHECK_LOOKAHEAD_STATEMENTS = 3;
export const DEEP_NESTING_THRESHOLD = 3;
export const DUPLICATE_STORAGE_READ_THRESHOLD = 2;

// Patterns used by helpers.ts and js-performance.ts
export const SETTER_PATTERN = /^set[A-Z]/;
export const UPPERCASE_PATTERN = /^[A-Z]/;
export const TEST_FILE_PATTERN = /\.(?:test|spec|stories)\.[tj]sx?$/;

// Sets used by helpers.ts
export const FETCH_CALLEE_NAMES = new Set(["fetch"]);
export const FETCH_MEMBER_OBJECTS = new Set(["axios", "ky", "got"]);
export const MUTATION_METHOD_NAMES = new Set([
  "create",
  "insert",
  "insertInto",
  "update",
  "upsert",
  "delete",
  "remove",
  "destroy",
  "set",
  "append",
]);
export const MUTATING_HTTP_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);
export const STORAGE_OBJECTS = new Set(["localStorage", "sessionStorage"]);

// Loop types (used by LLM loop detection and JS perf rules)
export const LOOP_TYPES = [
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
];

// JS iteration methods used in LLM loop detection
export const CHAINABLE_ITERATION_METHODS = new Set(["map", "filter", "forEach", "flatMap"]);

// Security
export const SECRET_PATTERNS = [
  /^sk_live_/,
  /^sk_test_/,
  /^AKIA[0-9A-Z]{16}$/,
  /^ghp_[a-zA-Z0-9]{36}$/,
  /^gho_[a-zA-Z0-9]{36}$/,
  /^github_pat_/,
  /^glpat-/,
  /^xox[bporas]-/,
  /^sk-[a-zA-Z0-9]{32,}$/,
];

export const SECRET_VARIABLE_PATTERN = /(?:api_?key|secret|token|password|credential|auth)/i;

export const SECRET_FALSE_POSITIVE_SUFFIXES = new Set([
  "modal",
  "label",
  "text",
  "title",
  "name",
  "id",
  "key",
  "url",
  "path",
  "route",
  "page",
  "param",
  "field",
  "column",
  "header",
  "placeholder",
  "description",
  "type",
  "icon",
  "class",
  "style",
  "variant",
  "event",
  "action",
  "status",
  "state",
  "mode",
  "flag",
  "option",
  "config",
  "message",
  "error",
  "display",
  "view",
  "component",
  "element",
  "container",
  "wrapper",
  "button",
  "link",
  "input",
  "select",
  "dialog",
  "menu",
  "form",
  "step",
  "index",
  "count",
  "length",
  "role",
  "scope",
  "context",
  "provider",
  "ref",
  "handler",
  "query",
  "schema",
  "constant",
]);

export const AUTH_FUNCTION_NAMES = new Set([
  "auth",
  "getSession",
  "getServerSession",
  "getUser",
  "requireAuth",
  "checkAuth",
  "verifyAuth",
  "authenticate",
  "currentUser",
  "getAuth",
  "validateSession",
]);

// LLM detection
export const LLM_SEQUENTIAL_AWAIT_THRESHOLD = 2;

export const LLM_ITERATION_METHOD_NAMES = new Set(["map", "forEach", "flatMap", "reduce"]);

export const LLM_INVOCATION_METHOD_NAMES = new Set([
  "create",
  "invoke",
  "generate",
  "generatetext",
  "generatecontent",
  "streamtext",
  "streamcontent",
  "completions",
  "completion",
  "responses",
  "messages",
  "chat",
]);

export const LLM_PROVIDER_SEGMENTS = new Set([
  "openai",
  "anthropic",
  "claude",
  "gemini",
  "cohere",
  "mistral",
  "together",
  "groq",
  "ollama",
  "bedrock",
  "vertex",
  "azureopenai",
]);

export const LLM_CHAIN_HINT_SEGMENTS = new Set([
  "chat",
  "completions",
  "completion",
  "responses",
  "messages",
  "embeddings",
  "generatecontent",
  "generatetext",
  "streamtext",
  "streamcontent",
  "assistant",
  "assistants",
]);

export const LLM_CALL_IDENTIFIER_PATTERN =
  /(?:llm|openai|anthropic|claude|gemini|cohere|mistral|together|groq|ollama|bedrock|vertex|generate(?:text|content|object)|stream(?:text|content|object)|chatcompletion)/i;

export const LLM_DYNAMIC_FIELD_NAMES = new Set([
  "prompt",
  "input",
  "messages",
  "contents",
  "instruction",
  "instructions",
  "question",
  "query",
  "content",
  "text",
]);

export const LLM_TEXT_FIELD_NAMES = new Set([
  "prompt",
  "input",
  "content",
  "text",
  "instruction",
  "instructions",
  "question",
  "query",
  "system",
  "user",
]);

export const LLM_DETERMINISTIC_PROMPT_PATTERNS = [
  /\b(?:lowercase|upper\s?case|trim|strip whitespace|slug(?:ify)?|camel case|snake case|kebab case|title case)\b/i,
  /\b(?:parse|format)\s+json\b/i,
  /\b(?:sort|deduplicate|remove duplicates|unique)\b/i,
  /\bextract\s+(?:email|phone|url|number)\b/i,
  /\bclassif(?:y|ication)\b[\s\S]*\b(?:yes|no|true|false)\b/i,
  /\b(?:validate|is)\s+(?:email|url|uuid|phone|json)\b/i,
  /\b(?:split|join|replace)\b[\s\S]*\b(?:string|text)\b/i,
  /\b(?:remove|strip)\b[\s\S]*\b(?:html|markdown|emoji|punctuation)\b/i,
  /\b(?:convert|transform)\b[\s\S]*\b(?:date|timestamp|csv|xml)\b/i,
];
