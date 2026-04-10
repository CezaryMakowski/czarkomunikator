// Helper to create a NextRequest-like object for API route tests
export function createMockRequest(
  url: string,
  options?: { method?: string; body?: unknown },
) {
  const { method = "GET", body } = options ?? {};
  const urlObj = new URL(url);

  return {
    method,
    nextUrl: urlObj,
    json: async () => body,
    headers: new Headers({ "Content-Type": "application/json" }),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
