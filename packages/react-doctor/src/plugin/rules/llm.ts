import {
  LLM_CALL_IDENTIFIER_PATTERN,
  LLM_CHAIN_HINT_SEGMENTS,
  LLM_DETERMINISTIC_PROMPT_PATTERNS,
  LLM_DYNAMIC_FIELD_NAMES,
  LLM_INVOCATION_METHOD_NAMES,
  LLM_PROVIDER_SEGMENTS,
  LLM_TEXT_FIELD_NAMES,
} from "../constants.js";
import type { EsTreeNode, Rule } from "../types.js";

const normalizeSegment = (segment: string): string =>
  segment.toLowerCase().replace(/[^a-z0-9]/g, "");

const unwrapChainExpression = (node: EsTreeNode): EsTreeNode =>
  node.type === "ChainExpression" ? node.expression : node;

const getPropertyKeyName = (propertyNode: EsTreeNode): string | null => {
  if (propertyNode.key?.type === "Identifier") {
    return propertyNode.key.name;
  }
  if (propertyNode.key?.type === "Literal" && typeof propertyNode.key.value === "string") {
    return propertyNode.key.value;
  }
  return null;
};

const readObjectPropertyValue = (
  objectExpressionNode: EsTreeNode,
  targetFieldNames: Set<string>,
): EsTreeNode | null => {
  for (const propertyNode of objectExpressionNode.properties ?? []) {
    if (propertyNode.type !== "Property") {
      continue;
    }
    const keyName = getPropertyKeyName(propertyNode);
    if (!keyName) {
      continue;
    }
    if (targetFieldNames.has(keyName)) {
      return propertyNode.value;
    }
  }
  return null;
};

const getMemberExpressionSegments = (memberExpressionNode: EsTreeNode): string[] => {
  const memberSegments: string[] = [];
  let currentNode: EsTreeNode | null = memberExpressionNode;

  while (currentNode?.type === "MemberExpression") {
    const propertyNode = currentNode.property;
    if (currentNode.computed) {
      if (propertyNode?.type === "Literal" && typeof propertyNode.value === "string") {
        memberSegments.unshift(propertyNode.value);
      } else {
        return [];
      }
    } else if (propertyNode?.type === "Identifier") {
      memberSegments.unshift(propertyNode.name);
    } else {
      return [];
    }

    currentNode = currentNode.object;
  }

  if (currentNode?.type === "Identifier") {
    memberSegments.unshift(currentNode.name);
  }

  return memberSegments;
};

const getCalleeSegments = (callExpressionNode: EsTreeNode): string[] => {
  const unwrappedCallee = unwrapChainExpression(callExpressionNode.callee);

  if (unwrappedCallee.type === "Identifier") {
    return [unwrappedCallee.name];
  }

  if (unwrappedCallee.type === "MemberExpression") {
    return getMemberExpressionSegments(unwrappedCallee);
  }

  return [];
};

const hasProviderSegment = (normalizedSegments: string[]): boolean =>
  normalizedSegments.some(
    (segment) =>
      LLM_PROVIDER_SEGMENTS.has(segment) ||
      segment.includes("openai") ||
      segment.includes("anthropic") ||
      segment.includes("languagemodel") ||
      segment.endsWith("llm"),
  );

const hasLlmHintSegment = (normalizedSegments: string[]): boolean =>
  normalizedSegments.some(
    (segment) =>
      LLM_CHAIN_HINT_SEGMENTS.has(segment) ||
      segment.includes("completion") ||
      segment.includes("response") ||
      segment.includes("message"),
  );

const isLikelyLlmCall = (callExpressionNode: EsTreeNode): boolean => {
  const calleeSegments = getCalleeSegments(callExpressionNode);
  if (calleeSegments.length === 0) {
    return false;
  }

  if (calleeSegments.length === 1) {
    return LLM_CALL_IDENTIFIER_PATTERN.test(calleeSegments[0]);
  }

  const normalizedSegments = calleeSegments.map(normalizeSegment);
  const lastSegment = normalizedSegments.at(-1);
  if (!lastSegment) {
    return false;
  }

  return Boolean(
    (hasProviderSegment(normalizedSegments) && LLM_INVOCATION_METHOD_NAMES.has(lastSegment)) ||
      (hasProviderSegment(normalizedSegments) && hasLlmHintSegment(normalizedSegments)),
  );
};

const extractPromptNode = (callExpressionNode: EsTreeNode): EsTreeNode | null => {
  const firstArgument = callExpressionNode.arguments?.[0];
  if (!firstArgument) {
    return null;
  }

  const unwrappedArgument = unwrapChainExpression(firstArgument);

  if (unwrappedArgument.type !== "ObjectExpression") {
    return unwrappedArgument;
  }

  return readObjectPropertyValue(unwrappedArgument, LLM_DYNAMIC_FIELD_NAMES) ?? unwrappedArgument;
};

const isStaticPromptNode = (node: EsTreeNode | null): boolean => {
  if (!node) {
    return false;
  }

  if (node.type === "Literal") {
    return true;
  }

  if (node.type === "TemplateLiteral") {
    return node.expressions.length === 0;
  }

  if (node.type === "ArrayExpression") {
    return (node.elements ?? []).every(
      (elementNode: EsTreeNode | null) => Boolean(elementNode) && isStaticPromptNode(elementNode),
    );
  }

  if (node.type === "ObjectExpression") {
    return (node.properties ?? []).every((propertyNode: EsTreeNode) => {
      if (propertyNode.type !== "Property") {
        return false;
      }
      return isStaticPromptNode(propertyNode.value);
    });
  }

  if (node.type === "UnaryExpression") {
    return isStaticPromptNode(node.argument);
  }

  return false;
};

const containsDynamicPromptInput = (node: EsTreeNode | null): boolean => {
  if (!node) {
    return false;
  }

  if (node.type === "Identifier") {
    return true;
  }

  if (node.type === "ThisExpression") {
    return true;
  }

  if (node.type === "MemberExpression") {
    return true;
  }

  if (node.type === "CallExpression") {
    return true;
  }

  if (node.type === "TemplateLiteral") {
    if (node.expressions.length > 0) {
      return true;
    }
    return false;
  }

  if (node.type === "ArrayExpression") {
    return (node.elements ?? []).some((elementNode: EsTreeNode | null) =>
      containsDynamicPromptInput(elementNode),
    );
  }

  if (node.type === "ObjectExpression") {
    return (node.properties ?? []).some((propertyNode: EsTreeNode) => {
      if (propertyNode.type !== "Property") {
        return true;
      }
      return containsDynamicPromptInput(propertyNode.value);
    });
  }

  if (node.type === "UnaryExpression") {
    return containsDynamicPromptInput(node.argument);
  }

  if (node.type === "Literal") {
    return false;
  }

  return false;
};

const collectPromptText = (node: EsTreeNode | null, textFragments: string[]): void => {
  if (!node) {
    return;
  }

  if (node.type === "Literal" && typeof node.value === "string") {
    textFragments.push(node.value);
    return;
  }

  if (node.type === "TemplateLiteral") {
    for (const templateSegment of node.quasis ?? []) {
      const cookedValue = templateSegment.value?.cooked;
      if (typeof cookedValue === "string" && cookedValue.trim().length > 0) {
        textFragments.push(cookedValue);
      }
    }
    for (const expressionNode of node.expressions ?? []) {
      collectPromptText(expressionNode, textFragments);
    }
    return;
  }

  if (node.type === "ArrayExpression") {
    for (const elementNode of node.elements ?? []) {
      collectPromptText(elementNode, textFragments);
    }
    return;
  }

  if (node.type === "ObjectExpression") {
    for (const propertyNode of node.properties ?? []) {
      if (propertyNode.type !== "Property") {
        continue;
      }
      const keyName = getPropertyKeyName(propertyNode);
      if (!keyName) {
        continue;
      }
      if (LLM_DYNAMIC_FIELD_NAMES.has(keyName) || LLM_TEXT_FIELD_NAMES.has(keyName)) {
        collectPromptText(propertyNode.value, textFragments);
      }
    }
  }
};

const buildPromptText = (promptNode: EsTreeNode): string => {
  const promptTextFragments: string[] = [];
  collectPromptText(promptNode, promptTextFragments);
  return promptTextFragments.join(" ").trim();
};

const hasDeterministicPromptText = (promptText: string): boolean =>
  LLM_DETERMINISTIC_PROMPT_PATTERNS.some((promptPattern) => promptPattern.test(promptText));

export const llmStaticPromptCall: Rule = {
  create: (context) => ({
    CallExpression(node: EsTreeNode) {
      if (!isLikelyLlmCall(node)) {
        return;
      }

      const promptNode = extractPromptNode(node);
      if (!promptNode) {
        return;
      }

      if (!isStaticPromptNode(promptNode)) {
        return;
      }

      context.report({
        node,
        message:
          "LLM call uses fully static prompt input at runtime — replace with deterministic local logic or a precomputed constant to remove network latency",
      });
    },
  }),
};

export const llmDeterministicTask: Rule = {
  create: (context) => ({
    CallExpression(node: EsTreeNode) {
      if (!isLikelyLlmCall(node)) {
        return;
      }

      const promptNode = extractPromptNode(node);
      if (!promptNode) {
        return;
      }

      if (!containsDynamicPromptInput(promptNode)) {
        return;
      }

      const promptText = buildPromptText(promptNode);
      if (!promptText) {
        return;
      }

      if (!hasDeterministicPromptText(promptText)) {
        return;
      }

      context.report({
        node,
        message:
          "Prompt appears to request deterministic transformation/classification — replace this LLM call with string, regex, or switch-based logic to reduce latency and cost",
      });
    },
  }),
};
