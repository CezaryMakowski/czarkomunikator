"use client";

import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import styles from "@/styles/Chat.module.css";
import Message from "./Message";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const chatInfoSchema = z.object({
  conversationId: z.string(),
  chatPartnerName: z.string(),
});

export default function Chat({
  currentUser,
  chatPartnerId,
}: {
  currentUser: { id: string; name: string };
  chatPartnerId: string;
}) {
  const {
    data: chatInfo = { conversationId: "", chatPartnerName: "" },
    isLoading,
  } = useQuery({
    queryKey: ["currentChat", chatPartnerId, currentUser.id],
    queryFn: async () => {
      if (currentUser.id && chatPartnerId) {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentUserId: currentUser.id,
              partnerId: chatPartnerId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const parsedData = chatInfoSchema.parse(data);
            return parsedData;
          }
        } catch (error) {
          console.error("Error fetching conversation data:", error);
        }
      }
    },
  });
  const {
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage,
    failedMessage,
    isSending,
    whoIsTyping,
    sendTypingStatus,
    markAsSeen,
  } = useChat(chatInfo.conversationId, currentUser);
  const [messageText, setMessageText] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, whoIsTyping]);

  // Oznacz wiadomości jako przeczytane gdy użytkownik widzi czat
  useEffect(() => {
    if (messages.length === 0) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        markAsSeen();
      }
    };

    // Oznacz od razu jeśli karta jest aktywna
    if (document.visibilityState === "visible") {
      markAsSeen();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingStatus(false);
    };
  }, [chatInfo.conversationId]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.addEventListener("keypress", handleKeyPress);

    return () => {
      inputRef.current?.removeEventListener("keypress", handleKeyPress);
    };
  }, [chatInfo.conversationId]);

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      inputRef.current?.form?.dispatchEvent(
        new Event("submit", { bubbles: true }),
      );
    }
  };

  const scheduleTypingReset = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1200);
  };

  const handleChange = (value: string) => {
    setMessageText(value);

    if (!value.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingStatus(false);
      return;
    }

    sendTypingStatus(true);
    scheduleTypingReset();
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = messageText.trim();
    if (!body || !currentUser.id) {
      return;
    }

    sendMessage({
      body,
      conversationId: chatInfo.conversationId,
      clientSideId: crypto.randomUUID(),
    });
    setMessageText("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStatus(false);
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    if (!failedMessage) {
      return;
    }

    sendMessage({
      ...failedMessage,
      clientSideId: failedMessage.clientSideId ?? crypto.randomUUID(),
    });
  };

  if (isLoading) {
    return (
      <section className={`${styles.container} glass-window`}>
        <div className={styles.infoBox}>Ładowanie czatu...</div>
      </section>
    );
  }
  return (
    <section className={`${styles.container} glass-window`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Live chat</p>
          <h2 className={styles.title}>{chatInfo.chatPartnerName}</h2>
        </div>
      </header>
      <div className={styles.messages}>
        {isLoadingMessages && (
          <div className={styles.infoBox}>Ładowanie wiadomości...</div>
        )}
        {messagesError && (
          <div className={styles.errorBox}>
            Nie udało się pobrać wiadomości.
          </div>
        )}
        {!isLoadingMessages && !messagesError && messages.length === 0 && (
          <div className={styles.infoBox}>
            Brak wiadomości. Zacznij rozmowę.
          </div>
        )}
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUser.id;
          return (
            <Message
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
            />
          );
        })}
        {whoIsTyping && (
          <div className={styles.typingHint}>
            {whoIsTyping} pisze
            <div className={styles.dots}>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
      {failedMessage && (
        <div className={styles.retryBar}>
          <span>Nie udało się wysłać wiadomości.</span>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleRetry}
          >
            Wyślij ponownie
          </button>
        </div>
      )}
      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder="Napisz wiadomość..."
          value={messageText}
          onChange={(event) => handleChange(event.target.value)}
          rows={3}
        />
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={!messageText.trim() || isSending}
        >
          Wyślij
        </button>
      </form>
    </section>
  );
}
