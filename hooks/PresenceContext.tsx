"use client";

import type { ReactNode } from "react";
import { usePresenceSubscription } from "@/hooks/usePresenceSubscription";

export function PresenceProvider({
  currentUserId,
  children,
}: {
  currentUserId: string;
  children: ReactNode;
}) {
  usePresenceSubscription(currentUserId);
  return <>{children}</>;
}
