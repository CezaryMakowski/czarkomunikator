import { mockSupabase, mockChannel } from "../mocks/supabase";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useChat } from "@/hooks/useChat";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockChannel.on.mockReturnThis();
  mockChannel.subscribe.mockReturnThis();
});

describe("useChat", () => {
  const currentUser = { id: "user-1", name: "Jan" };
  const conversationId = "conv-1";

  it("returns initial empty messages and loading state", () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoadingMessages).toBe(true);
    expect(result.current.whoIsTyping).toBeNull();
    expect(result.current.failedMessage).toBeNull();
    expect(result.current.isSending).toBe(false);
  });

  it("fetches messages from API", async () => {
    const mockMessages = [
      {
        id: "msg-1",
        body: "Hello",
        image: null,
        createdAt: "2026-04-10T10:00:00Z",
        clientSideId: null,
        conversationId: "conv-1",
        senderId: "user-2",
        senderName: "Anna",
        seen: false,
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockMessages,
    });

    const { result } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingMessages).toBe(false);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].body).toBe("Hello");
    expect(result.current.messages[0].senderName).toBe("Anna");
  });

  it("returns empty array when conversationId is empty", async () => {
    const { result } = renderHook(() => useChat("", currentUser), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingMessages).toBe(false);
    });

    expect(result.current.messages).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sets messagesError when fetch fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingMessages).toBe(false);
    });

    expect(result.current.messagesError).toBeTruthy();
  });

  it("subscribes to Supabase channels on mount", () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    // messages channel + typing channel
    expect(mockSupabase.channel).toHaveBeenCalledWith(
      `messages-${conversationId}`,
    );
    expect(mockSupabase.channel).toHaveBeenCalledWith(`room:${conversationId}`);
  });

  it("sends a message via POST", async () => {
    const sentMessage = {
      id: "msg-new",
      body: "Hi!",
      image: null,
      createdAt: new Date().toISOString(),
      clientSideId: "client-1",
      conversationId: "conv-1",
      senderId: "user-1",
      senderName: "Jan",
      seen: false,
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => sentMessage }) // POST
      .mockResolvedValue({ ok: true, json: async () => [sentMessage] }); // refetch after invalidate

    const { result } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingMessages).toBe(false);
    });

    await act(async () => {
      result.current.sendMessage({
        body: "Hi!",
        conversationId: "conv-1",
        clientSideId: "client-1",
      });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/messages",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            body: "Hi!",
            conversationId: "conv-1",
            clientSideId: "client-1",
          }),
        }),
      );
    });
  });

  it("sends typing status through broadcast channel", () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.sendTypingStatus(true);
    });

    expect(mockChannel.send).toHaveBeenCalledWith({
      type: "broadcast",
      event: "typing",
      payload: {
        userId: "user-1",
        userName: "Jan",
        isTyping: true,
      },
    });
  });

  it("markAsSeen calls PATCH /api/messages", async () => {
    const mockMessages = [
      {
        id: "msg-1",
        body: "Hi",
        image: null,
        createdAt: "2026-04-10T10:00:00Z",
        clientSideId: null,
        conversationId: "conv-1",
        senderId: "user-2",
        senderName: "Anna",
        seen: false,
      },
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockMessages })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ updated: 1 }) });

    const { result } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingMessages).toBe(false);
    });

    await act(async () => {
      await result.current.markAsSeen();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: "conv-1" }),
    });
  });

  it("markAsSeen does nothing when all messages are seen", async () => {
    const mockMessages = [
      {
        id: "msg-1",
        body: "Hi",
        image: null,
        createdAt: "2026-04-10T10:00:00Z",
        clientSideId: null,
        conversationId: "conv-1",
        senderId: "user-2",
        senderName: "Anna",
        seen: true,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    const { result } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingMessages).toBe(false);
    });

    await act(async () => {
      await result.current.markAsSeen();
    });

    // Only the initial GET, no PATCH
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("cleans up Supabase channels on unmount", () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { unmount } = renderHook(() => useChat(conversationId, currentUser), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });
});
