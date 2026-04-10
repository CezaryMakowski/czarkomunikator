import { prismaMock } from "../mocks/prisma";
import "../mocks/nextServer";
import { bcryptMock } from "../mocks/bcrypt";
import { createMockRequest } from "../mocks/request";
import { POST } from "@/app/api/rejestracja/route";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/rejestracja", () => {
  const validBody = {
    name: "Jan",
    email: "jan@example.com",
    password: "haslo123",
    confirmPassword: "haslo123",
  };

  it("creates a new user with valid data", async () => {
    bcryptMock.hash.mockResolvedValue("hashed-password");
    prismaMock.user.findUnique.mockResolvedValue(null); // no duplicate
    prismaMock.user.create.mockResolvedValue({
      id: "new-user-id",
      email: "jan@example.com",
      name: "Jan",
    });

    const request = createMockRequest("http://localhost:3000/api/rejestracja", {
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Jan");
    expect(bcryptMock.hash).toHaveBeenCalledWith("haslo123", 12);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: "jan@example.com",
        name: "Jan",
        hashedPassword: "hashed-password",
      },
    });
  });

  it("returns 403 for invalid form data", async () => {
    const request = createMockRequest("http://localhost:3000/api/rejestracja", {
      method: "POST",
      body: { name: "", email: "bad", password: "abc", confirmPassword: "xyz" },
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns 422 if email already exists", async () => {
    // First findUnique call (by email) returns existing user
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "existing",
      email: "jan@example.com",
    });
    bcryptMock.hash.mockResolvedValue("hashed");

    const request = createMockRequest("http://localhost:3000/api/rejestracja", {
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.email).toBe("podany email już istnieje");
  });

  it("returns 422 if username already exists", async () => {
    // First findUnique (email) returns null, second (name) returns existing
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing", name: "Jan" });
    bcryptMock.hash.mockResolvedValue("hashed");

    const request = createMockRequest("http://localhost:3000/api/rejestracja", {
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.name).toBe("podana nazwa użytkownika już istnieje");
  });

  it("returns 500 if user creation fails", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    bcryptMock.hash.mockResolvedValue("hashed");
    prismaMock.user.create.mockResolvedValue(null);

    const request = createMockRequest("http://localhost:3000/api/rejestracja", {
      method: "POST",
      body: validBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("lowercases email before saving", async () => {
    bcryptMock.hash.mockResolvedValue("hashed");
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "id",
      email: "jan@example.com",
      name: "Jan",
    });

    const request = createMockRequest("http://localhost:3000/api/rejestracja", {
      method: "POST",
      body: { ...validBody, email: "JAN@Example.COM" },
    });

    await POST(request);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "jan@example.com",
        }),
      }),
    );
  });
});
