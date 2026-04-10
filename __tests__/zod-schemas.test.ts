import {
  messageSchema,
  sendMessageSchema,
  registryFormSchema,
} from "@/lib/zod/schemas";

describe("messageSchema", () => {
  it("parses a valid message", () => {
    const input = {
      id: "msg-1",
      body: "Hello",
      image: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      clientSideId: "client-1",
      conversationId: "conv-1",
      senderId: "user-1",
      senderName: "Jan",
      seen: false,
    };

    const result = messageSchema.parse(input);

    expect(result.id).toBe("msg-1");
    expect(result.body).toBe("Hello");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.senderName).toBe("Jan");
  });

  it("coerces string date to Date object", () => {
    const input = {
      id: "msg-1",
      body: "Test",
      image: null,
      createdAt: "2026-04-10T12:00:00Z",
      clientSideId: null,
      conversationId: "conv-1",
      senderId: "user-1",
      seen: true,
    };

    const result = messageSchema.parse(input);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe("2026-04-10T12:00:00.000Z");
  });

  it("defaults senderName to 'Unknown user' when not provided", () => {
    const input = {
      id: "msg-1",
      body: "Test",
      image: null,
      createdAt: new Date(),
      clientSideId: null,
      conversationId: "conv-1",
      senderId: "user-1",
      seen: false,
    };

    const result = messageSchema.parse(input);
    expect(result.senderName).toBe("Unknown user");
  });

  it("allows nullable body and image", () => {
    const input = {
      id: "msg-1",
      body: null,
      image: null,
      createdAt: new Date(),
      clientSideId: null,
      conversationId: "conv-1",
      senderId: "user-1",
      seen: false,
    };

    const result = messageSchema.parse(input);
    expect(result.body).toBeNull();
    expect(result.image).toBeNull();
  });

  it("rejects missing required fields", () => {
    expect(() => messageSchema.parse({})).toThrow();
    expect(() => messageSchema.parse({ id: "msg-1" })).toThrow();
  });
});

describe("sendMessageSchema", () => {
  it("parses valid send message input", () => {
    const input = {
      body: "Hello!",
      conversationId: "conv-1",
    };

    const result = sendMessageSchema.parse(input);
    expect(result.body).toBe("Hello!");
    expect(result.conversationId).toBe("conv-1");
  });

  it("allows optional fields to be omitted", () => {
    const input = {
      conversationId: "conv-1",
    };

    const result = sendMessageSchema.parse(input);
    expect(result.body).toBeUndefined();
    expect(result.image).toBeUndefined();
    expect(result.clientSideId).toBeUndefined();
  });

  it("rejects missing conversationId", () => {
    expect(() => sendMessageSchema.parse({ body: "Hello" })).toThrow();
  });

  it("parses input with all optional fields", () => {
    const input = {
      body: "Hi",
      image: "https://example.com/img.png",
      conversationId: "conv-1",
      clientSideId: "client-123",
    };

    const result = sendMessageSchema.parse(input);
    expect(result.image).toBe("https://example.com/img.png");
    expect(result.clientSideId).toBe("client-123");
  });
});

describe("registryFormSchema", () => {
  const validInput = {
    name: "Jan",
    email: "jan@example.com",
    password: "haslo123",
    confirmPassword: "haslo123",
  };

  it("parses valid registration data", () => {
    const result = registryFormSchema.parse(validInput);
    expect(result.name).toBe("Jan");
    expect(result.email).toBe("jan@example.com");
  });

  it("rejects empty name", () => {
    expect(() =>
      registryFormSchema.parse({ ...validInput, name: "" }),
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      registryFormSchema.parse({ ...validInput, email: "not-an-email" }),
    ).toThrow();
  });

  it("rejects password shorter than 7 characters", () => {
    expect(() =>
      registryFormSchema.parse({
        ...validInput,
        password: "abc",
        confirmPassword: "abc",
      }),
    ).toThrow();
  });

  it("rejects mismatched passwords", () => {
    expect(() =>
      registryFormSchema.parse({
        ...validInput,
        password: "haslo123",
        confirmPassword: "inneinne",
      }),
    ).toThrow();
  });

  it("rejects empty confirmPassword", () => {
    expect(() =>
      registryFormSchema.parse({ ...validInput, confirmPassword: "" }),
    ).toThrow();
  });

  it("accepts password with exactly 7 characters", () => {
    const input = {
      ...validInput,
      password: "1234567",
      confirmPassword: "1234567",
    };
    const result = registryFormSchema.parse(input);
    expect(result.password).toBe("1234567");
  });
});
