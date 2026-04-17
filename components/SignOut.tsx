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

  const handleDeleteAccount = async () => {
    if (
      confirm("Czy na pewno chcesz usunąć konto? Ta akcja jest nieodwracalna.")
    ) {
      try {
        const response = await fetch("/api/user", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "delete", userId }),
        });

        if (response.ok) {
          alert("Konto zostało usunięte.");
          signOut();
        } else {
          alert("Błąd podczas usuwania konta.");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Błąd podczas usuwania konta.");
      }
    }
  };

  return (
    <div className={`${styles.container} glass-window`}>
      <p className={styles.welcome}>Cześć, {name}!</p>
      <button className={styles.button} onClick={handleSignOut}>
        Wyloguj się
      </button>
      <button className={styles.button} onClick={handleDeleteAccount}>
        usuń konto
      </button>
    </div>
  );
}
