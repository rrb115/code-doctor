import {
  llmDeterministicTask,
  llmLoopCall,
  llmSequentialCall,
  llmStaticPromptCall,
} from "./rules/llm.js";
import {
  asyncParallel,
  jsCombineIterations,
  jsEarlyExit,
  jsHoistRegexp,
  jsIndexMaps,
  jsMinMaxLoop,
  jsSetMapLookups,
  jsTosortedImmutable,
} from "./rules/js-performance.js";
import { noEval, noSecretsInClientCode } from "./rules/security.js";
import type { RulePlugin } from "./types.js";

const plugin: RulePlugin = {
  meta: { name: "code-doctor" },
  rules: {
    // LLM Cost & Latency
    "llm-static-prompt-call": llmStaticPromptCall,
    "llm-deterministic-task": llmDeterministicTask,
    "llm-loop-call": llmLoopCall,
    "llm-sequential-call": llmSequentialCall,

    // General JS Performance
    "js-combine-iterations": jsCombineIterations,
    "js-tosorted-immutable": jsTosortedImmutable,
    "js-hoist-regexp": jsHoistRegexp,
    "js-min-max-loop": jsMinMaxLoop,
    "js-set-map-lookups": jsSetMapLookups,
    "js-index-maps": jsIndexMaps,
    "js-early-exit": jsEarlyExit,
    "async-parallel": asyncParallel,

    // Security
    "no-eval": noEval,
    "no-secrets-in-client-code": noSecretsInClientCode,
  },
};

export default plugin;
