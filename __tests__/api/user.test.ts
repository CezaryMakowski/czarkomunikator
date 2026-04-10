import { prismaMock } from "../mocks/prisma";
import "../mocks/nextServer";
import { createMockRequest } from "../mocks/request";
import { GET, POST } from "@/app/api/user/route";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/user", () => {
  it("returns list of users", async () => {
    const mockUsers = [
      {
        id: "user-1",
        name: "Jan",
        email: "jan@example.com",
        image: null,
        lastSeenAt: new Date("2026-04-10T10:00:00Z"),
      },
      {
        id: "user-2",
        name: "Anna",
        email: "anna@example.com",
        image: null,
        lastSeenAt: new Date("2026-04-10T09:00:00Z"),
      },
    ];

    prismaMock.user.findMany.mockResolvedValue(mockUsers);

    const request = createMockRequest("http://localhost:3000/api/user");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Jan");
    expect(data[1].name).toBe("Anna");
  });

  it("returns 500 on database error", async () => {
    prismaMock.user.findMany.mockRejectedValue(new Error("DB error"));

    const request = createMockRequest("http://localhost:3000/api/user");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch users");
  });
});

describe("POST /api/user", () => {
  it("updates lastSeenAt for leave action", async () => {
    prismaMock.user.update.mockResolvedValue({
      id: "user-1",
      lastSeenAt: new Date(),
    });

    const request = createMockRequest("http://localhost:3000/api/user", {
      method: "POST",
      body: { action: "leave", userId: "user-1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("User status updated");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { lastSeenAt: expect.any(Date) },
    });
  });

  it("returns success even for unknown action (no-op)", async () => {
    const request = createMockRequest("http://localhost:3000/api/user", {
      method: "POST",
      body: { action: "unknown", userId: "user-1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("User status updated");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
