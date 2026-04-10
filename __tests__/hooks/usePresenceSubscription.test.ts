import { mockSupabase, mockChannel } from "../mocks/supabase";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { usePresenceSubscription } from "@/hooks/usePresenceSubscription";

// Mock updateLastSeen
jest.mock("@/utils/updateLastSeen", () => ({
  updateLastSeen: jest.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockChannel.on.mockReturnThis();
  mockChannel.subscribe.mockReturnThis();
});

describe("usePresenceSubscription", () => {
  it("sets onlineUsers to empty set when no userId is provided", () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );

    renderHook(() => usePresenceSubscription(""), { wrapper });

    const onlineUsers = queryClient.getQueryData<Set<string>>(["onlineUsers"]);
    expect(onlineUsers).toEqual(new Set());
    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it("subscribes to Supabase presence channel with userId", () => {
    renderHook(() => usePresenceSubscription("user-1"), {
      wrapper: createWrapper(),
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith("online-users", {
      config: {
        presence: {
          key: "user-1",
        },
      },
    });
  });

  it("registers sync and leave event handlers", () => {
    renderHook(() => usePresenceSubscription("user-1"), {
      wrapper: createWrapper(),
    });

    expect(mockChannel.on).toHaveBeenCalledWith(
      "presence",
      { event: "sync" },
      expect.any(Function),
    );
    expect(mockChannel.on).toHaveBeenCalledWith(
      "presence",
      { event: "leave" },
      expect.any(Function),
    );
  });

  it("calls subscribe on the channel", () => {
    renderHook(() => usePresenceSubscription("user-1"), {
      wrapper: createWrapper(),
    });

    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("cleans up channel on unmount", () => {
    const { unmount } = renderHook(() => usePresenceSubscription("user-1"), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
