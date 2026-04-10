// Reusable Supabase mock for hook tests
export const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: jest.fn(),
  send: jest.fn(),
  presenceState: jest.fn(() => ({})),
  track: jest.fn(),
};

export const mockSupabase = {
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn(),
};

jest.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));
