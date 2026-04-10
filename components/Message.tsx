import styles from "@/styles/Message.module.css";
import { type Message } from "@/lib/zod/schemas";

export default function Message({
  message,
  isOwnMessage,
}: {
  message: Message;
  isOwnMessage: boolean;
}) {
  return (
    <article
      key={message.id}
      className={`${styles.messageBubble} ${isOwnMessage ? styles.ownMessage : styles.otherMessage}`}
    >
      <p className={styles.messageBody}>{message.body || "[brak treści]"}</p>
      <div className={styles.messageMeta}>
        <span>{isOwnMessage ? "Ty" : message.senderName}</span>
        <div className={styles.metaRight}>
          <time dateTime={message.createdAt.toISOString()}>
            {new Intl.DateTimeFormat("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(message.createdAt)}
          </time>
          {isOwnMessage && (
            <span
              className={`${styles.seenIndicator} ${message.seen ? styles.seen : ""}`}
              title={message.seen ? "Przeczytane" : "Wysłane"}
            >
              {message.seen ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
