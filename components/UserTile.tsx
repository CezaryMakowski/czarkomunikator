"use client";

import { User } from "@/lib/types";
import styles from "@/styles/UserTile.module.css";
import Link from "next/link";

export default function UserTile({ user }: { user: User }) {
  const getLastSeenText = () => {
    if (!user.lastSeenAt) return "";
    const lastSeen = new Date(user.lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 1) {
      return (
        lastSeen.toLocaleDateString("pl-PL") +
        " " +
        lastSeen.toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else {
      return lastSeen.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <Link href={`/konwersacja/${user.id}`}>
      <div key={user.id} className={styles.userTile}>
        <div className={styles.picWrapper}>
          <img
            src={user.image || "/default_pic.svg"}
            alt={user.name}
            className={styles.userImage}
          />
          <div
            className={`${styles.activeIndicator} ${user.active ? styles.active : ""}`}
          ></div>
        </div>
        <div className={styles.nameWrapper}>
          <p>{user.name}</p>
          {user.active && <p>Online</p>}
          {!user.active && user.lastSeenAt && (
            <p>ostatnio: {getLastSeenText()}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
