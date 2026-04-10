"use client";

import { signOut } from "next-auth/react";
import styles from "@/styles/SignOut.module.css";
import { updateLastSeen } from "@/utils/updateLastSeen";

export default function UserInfo({
  name,
  userId,
}: {
  name: string;
  userId: string;
}) {
  const handleSignOut = async () => {
    await updateLastSeen(userId);
    signOut();
  };

  return (
    <div className={`${styles.container} glass-window`}>
      <p className={styles.welcome}>Cześć, {name}!</p>
      <button className={styles.signOutButton} onClick={handleSignOut}>
        Wyloguj się
      </button>
    </div>
  );
}
