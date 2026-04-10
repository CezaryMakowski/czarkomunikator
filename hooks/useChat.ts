"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  messageSchema,
  type Message,
  type SendMessageInput,
} from "@/lib/zod/schemas";
import type { User } from "@/lib/types";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useChat(
  conversationId: string,
  currentUser: { id: string; name: string },
) {
  const queryClient = useQueryClient();
  const [whoIsTyping, setWhoIsTyping] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<SendMessageInput | null>(
    null,
  );
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Pobieranie wiadomości
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      return data.map((msg: unknown) => messageSchema.parse(msg)) as Message[];
    },
  });

  // Wysyłanie wiadomości z Optimistic Updates
  const sendMessageMutation = useMutation({
    mutationFn: async (input: SendMessageInput) => {
      setFailedMessage(null);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onMutate: async (newMessage) => {
      // Anuluj wychodzące refetches
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });

      // Snapshot poprzedniego stanu
      const previousMessages = queryClient.getQueryData<Message[]>([
        "messages",
        conversationId,
      ]);

      // Optymistycznie dodaj wiadomość
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        body: newMessage.body ?? null,
        image: newMessage.image ?? null,
        conversationId: newMessage.conversationId,
        createdAt: new Date(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        seen: false,
        clientSideId: newMessage.clientSideId ?? null,
      };

      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (old) => [...(old || []), optimisticMessage],
      );

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      console.error("Failed to send message:", err);
      setFailedMessage(newMessage);
      // Przywróć poprzedni stan
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previousMessages,
        );
      }
    },
    onSettled: () => {
      // Invalidate i refetch
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  // Nasłuchiwanie nowych wiadomości i aktualizacji seen przez Supabase
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload: { new: Message }) => {
          const { senderId } = payload.new;
          const users = queryClient.getQueryData<User[]>(["users"]);
          const sender = users?.find((user) => user.id === senderId);
          const newMessage = messageSchema.parse({
            ...payload.new,
            senderName: sender?.name,
          });
          queryClient.setQueryData<Message[]>(
            ["messages", conversationId],
            (oldMessages) => {
              if (!oldMessages) return [newMessage];
              // Sprawdź duplikaty po clientSideId
              if (
                newMessage.clientSideId &&
                oldMessages.some(
                  (oldMessage) =>
                    oldMessage.clientSideId === newMessage.clientSideId,
                )
              ) {
                return oldMessages;
              }
              return [...oldMessages, newMessage];
            },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload: { new: Message }) => {
          const updatedId = payload.new.id;
          const updatedSeen = payload.new.seen;
          queryClient.setQueryData<Message[]>(
            ["messages", conversationId],
            (oldMessages) =>
              oldMessages?.map((msg) =>
                msg.id === updatedId ? { ...msg, seen: updatedSeen } : msg,
              ) ?? [],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    const channel = supabase.channel(`room:${conversationId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        // Ignoruj sygnał, jeśli to my sami piszemy
        if (payload.userId === currentUser.id) return;

        if (payload.isTyping) {
          setWhoIsTyping(payload.userName);
        } else {
          setWhoIsTyping(null);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUser.id]);

  // Funkcja wywoływana przez ChatInput
  const sendTypingStatus = (isTyping: boolean) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping,
      },
    });
  };

  // Oznacz wiadomości od innych jako przeczytane
  const markAsSeen = async () => {
    if (!conversationId) return;

    const hasUnseen = messages.some(
      (message) => message.senderId !== currentUser.id && !message.seen,
    );
    if (!hasUnseen) return;

    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
    }
  };

  return {
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage: sendMessageMutation.mutate,
    failedMessage,
    isSending: sendMessageMutation.isPending,
    whoIsTyping,
    sendTypingStatus,
    markAsSeen,
  };
}
