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

const scoreTicketsIndividuallyWithLlm = async (ticketTexts: string[]) =>
  ticketTexts.map((ticketText) =>
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
    }),
  );

const generateTwoIndependentSummaries = async (inputText: string) => {
  const firstSummary = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Summarize the text in one sentence.",
      },
      {
        role: "user",
        content: inputText,
      },
    ],
  });

  const secondSummary = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Summarize the text in three bullet points.",
      },
      {
        role: "user",
        content: inputText,
      },
    ],
  });

  return { firstSummary, secondSummary };
};

export {
  classifySupportTicketWithLlm,
  generateTwoIndependentSummaries,
  normalizeFullNameWithLlm,
  scoreTicketsIndividuallyWithLlm,
};
