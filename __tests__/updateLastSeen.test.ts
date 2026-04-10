// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { updateLastSeen } from "@/utils/updateLastSeen";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateLastSeen", () => {
  it("calls /api/user with POST and correct payload", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await updateLastSeen("user-123");

    expect(mockFetch).toHaveBeenCalledWith("/api/user", {
      method: "POST",
      body: JSON.stringify({
        action: "leave",
        userId: "user-123",
      }),
    });
  });

  it("calls fetch exactly once", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await updateLastSeen("user-456");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not throw on fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(updateLastSeen("user-789")).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error updating user status:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
