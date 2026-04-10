import { prismaMock } from "../mocks/prisma";
import "../mocks/nextServer";
import { authMock } from "../mocks/auth";
import { createMockRequest } from "../mocks/request";
import { GET, POST, PATCH } from "@/app/api/messages/route";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/messages", () => {
  it("returns 400 when conversationId is missing", async () => {
    const request = createMockRequest("http://localhost:3000/api/messages");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("conversationId query parameter is required");
  });

  it("returns parsed messages for a given conversationId", async () => {
    const mockMessages = [
      {
        id: "msg-1",
        body: "Cześć!",
        image: null,
        createdAt: new Date("2026-04-10T10:00:00Z"),
        clientSideId: null,
        conversationId: "conv-1",
        senderId: "user-1",
        seen: false,
        sender: { name: "Jan" },
      },
    ];

    prismaMock.message.findMany.mockResolvedValue(mockMessages);

    const request = createMockRequest(
      "http://localhost:3000/api/messages?conversationId=conv-1",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].body).toBe("Cześć!");
    expect(data[0].senderName).toBe("Jan");
  });

  it("defaults senderName to 'Unknown user' when sender name is null", async () => {
    const mockMessages = [
      {
        id: "msg-1",
        body: "Hi",
        image: null,
        createdAt: new Date(),
        clientSideId: null,
        conversationId: "conv-1",
        senderId: "user-1",
        seen: false,
        sender: { name: null },
      },
    ];

    prismaMock.message.findMany.mockResolvedValue(mockMessages);

    const request = createMockRequest(
      "http://localhost:3000/api/messages?conversationId=conv-1",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data[0].senderName).toBe("Unknown user");
  });
});

describe("POST /api/messages", () => {
  it("returns 400 for invalid input", async () => {
    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "POST",
      body: { body: "Hello" }, // missing conversationId
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "POST",
      body: { body: "Hello", conversationId: "conv-1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("returns 404 when conversation does not exist", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.conversation.findUnique.mockResolvedValue(null);

    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "POST",
      body: { body: "Hello", conversationId: "nonexistent" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Conversation not found");
  });

  it("creates and returns a message when valid", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv-1" });

    const createdMessage = {
      id: "msg-new",
      body: "Hello!",
      image: null,
      createdAt: new Date("2026-04-10T12:00:00Z"),
      clientSideId: "client-1",
      conversationId: "conv-1",
      senderId: "user-1",
      seen: false,
      sender: { name: "Jan" },
    };
    prismaMock.message.create.mockResolvedValue(createdMessage);

    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "POST",
      body: {
        body: "Hello!",
        conversationId: "conv-1",
        clientSideId: "client-1",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.body).toBe("Hello!");
    expect(data.senderName).toBe("Jan");
    expect(prismaMock.message.create).toHaveBeenCalledWith({
      data: {
        body: "Hello!",
        image: null,
        conversationId: "conv-1",
        clientSideId: "client-1",
        senderId: "user-1",
      },
      include: { sender: { select: { name: true } } },
    });
  });
});

describe("PATCH /api/messages", () => {
  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "PATCH",
      body: { conversationId: "conv-1" },
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid input", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "PATCH",
      body: {},
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it("marks unread messages from others as seen", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.message.updateMany.mockResolvedValue({ count: 3 });

    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "PATCH",
      body: { conversationId: "conv-1" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(3);
    expect(prismaMock.message.updateMany).toHaveBeenCalledWith({
      where: {
        conversationId: "conv-1",
        senderId: { not: "user-1" },
        seen: false,
      },
      data: { seen: true },
    });
  });

  it("returns 0 when no messages to mark", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.message.updateMany.mockResolvedValue({ count: 0 });

    const request = createMockRequest("http://localhost:3000/api/messages", {
      method: "PATCH",
      body: { conversationId: "conv-1" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated).toBe(0);
  });
});
