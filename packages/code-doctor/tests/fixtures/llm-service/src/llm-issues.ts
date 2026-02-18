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

// 1. Static prompt
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

// 2. Deterministic task (Classification loop)
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

// 3. Loop call
const processSupportTickets = async (tickets: string[]) => {
  // Loop
  for (const ticket of tickets) {
    await classifySupportTicketWithLlm(ticket);
  }
  // Map
  await Promise.all(tickets.map((ticket) => classifySupportTicketWithLlm(ticket)));
};

// 4. Sequential call
const processSequential = async (ticket: string) => {
  const result1 = await classifySupportTicketWithLlm(ticket);
  const result2 = await normalizeFullNameWithLlm();
  return { result1, result2 };
};

export {
  classifySupportTicketWithLlm,
  normalizeFullNameWithLlm,
  processSupportTickets,
  processSequential,
};
