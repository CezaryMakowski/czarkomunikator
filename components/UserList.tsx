"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/types";
import UserTile from "./UserTile";
import { useMemo } from "react";
import styles from "@/styles/UserList.module.css";

export default function UserList({ currentUserId }: { currentUserId: string }) {
  const { data: onlineUsers = new Set<string>() } = useQuery<Set<string>>({
    queryKey: ["onlineUsers"],
    queryFn: () => new Set<string>(),
    enabled: false,
  });
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<User[]>;
    },
  });

  const usersWithStatus = useMemo(
    () => users.map((user) => ({ ...user, active: onlineUsers.has(user.id) })),
    [users, onlineUsers],
  );

  if (isLoading) return <div>Loading users...</div>;
  return (
    <div className={styles.userList}>
      {usersWithStatus.map((user) => {
        if (user.id === currentUserId) return; // Nie pokazuj siebie na liście
        return <UserTile key={user.id} user={user} />;
      })}
    </div>
  );
}
