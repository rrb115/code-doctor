interface OxlintConfigOptions {
  pluginPath: string;
}

const CODE_DOCTOR_LLM_RULES: Record<string, string> = {
  "code-doctor/llm-static-prompt-call": "error",
  "code-doctor/llm-deterministic-task": "warn",
  "code-doctor/llm-loop-call": "warn",
  "code-doctor/llm-sequential-call": "warn",
};

const CODE_DOCTOR_GENERAL_RULES: Record<string, string> = {
  "code-doctor/no-secrets-in-client-code": "error",
  "code-doctor/async-parallel": "warn",
  "code-doctor/js-combine-iterations": "warn",
  "code-doctor/js-tosorted-immutable": "warn",
  "code-doctor/js-hoist-regexp": "warn",
  "code-doctor/js-min-max-loop": "warn",
  "code-doctor/js-set-map-lookups": "warn",
  "code-doctor/js-index-maps": "warn",
  "code-doctor/js-early-exit": "warn",
  "code-doctor/no-eval": "error",
};

export const createOxlintConfig = ({ pluginPath }: OxlintConfigOptions) => ({
  categories: {
    correctness: "off",
    suspicious: "off",
    pedantic: "off",
    perf: "off",
    restriction: "off",
    style: "off",
    nursery: "off",
  },
  plugins: [],
  jsPlugins: [pluginPath],
  rules: {
    ...CODE_DOCTOR_LLM_RULES,
    ...CODE_DOCTOR_GENERAL_RULES,
  },
});
