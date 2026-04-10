import { prismaMock } from "../mocks/prisma";
import "../mocks/nextServer";
import { authMock } from "../mocks/auth";
import { createMockRequest } from "../mocks/request";
import { POST } from "@/app/api/chat/route";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/chat", () => {
  it("returns 400 for invalid request body", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const request = createMockRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: { currentUserId: "user-1" }, // missing partnerId
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 403 when session user does not match currentUserId", async () => {
    authMock.mockResolvedValue({ user: { id: "different-user" } });

    const request = createMockRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: { currentUserId: "user-1", partnerId: "user-2" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("returns 404 when partner does not exist", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValue(null);

    const request = createMockRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: { currentUserId: "user-1", partnerId: "nonexistent" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("chat partner not found");
  });

  it("returns existing conversation if one exists", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValue({ name: "Anna" });
    prismaMock.conversation.findFirst.mockResolvedValue({
      id: "existing-conv",
    });

    const request = createMockRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: { currentUserId: "user-1", partnerId: "user-2" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationId).toBe("existing-conv");
    expect(data.chatPartnerName).toBe("Anna");
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it("creates a new conversation when none exists", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValue({ name: "Anna" });
    prismaMock.conversation.findFirst.mockResolvedValue(null);
    prismaMock.conversation.create.mockResolvedValue({ id: "new-conv" });

    const request = createMockRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: { currentUserId: "user-1", partnerId: "user-2" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationId).toBe("new-conv");
    expect(data.chatPartnerName).toBe("Anna");
    expect(prismaMock.conversation.create).toHaveBeenCalledWith({
      data: {
        users: {
          connect: [{ id: "user-1" }, { id: "user-2" }],
        },
      },
    });
  });
});
