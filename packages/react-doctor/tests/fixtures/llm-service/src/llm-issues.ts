interface ChatCompletionMessage {
  role: "system" | "user";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
}

interface OpenAiClient {
  chat: {
    completions: {
      create: (request: ChatCompletionRequest) => Promise<unknown>;
    };
  };
}

const openaiClient: OpenAiClient = {
  chat: {
    completions: {
      create: async () => Promise.resolve({}),
    },
  },
};

const normalizeFullNameWithLlm = async () =>
  openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Convert the name to lowercase and trim surrounding whitespace. Return only the normalized output.",
      },
      {
        role: "user",
        content: "  JOHN DOE  ",
      },
    ],
  });

const classifySupportTicketWithLlm = async (ticketText: string) =>
  openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Classify this support ticket as yes or no for billing relevance and return compact JSON.",
      },
      {
        role: "user",
        content: ticketText,
      },
    ],
  });

export { classifySupportTicketWithLlm, normalizeFullNameWithLlm };
