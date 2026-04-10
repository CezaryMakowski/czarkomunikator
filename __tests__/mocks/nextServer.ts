class MockNextResponse {
  body: unknown;
  status: number;

  constructor(body: unknown, init?: { status?: number }) {
    this.body = body;
    this.status = init?.status ?? 200;
  }

  async json() {
    return this.body;
  }

  static json(data: unknown, init?: { status?: number }) {
    return new MockNextResponse(data, init);
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
  NextRequest: jest.fn(),
}));
