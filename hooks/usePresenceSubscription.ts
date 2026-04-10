"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimePresenceState } from "@supabase/supabase-js";
import type { OnlineUser } from "@/lib/types";
import { updateLastSeen } from "@/utils/updateLastSeen";
import { useQueryClient } from "@tanstack/react-query";

export function usePresenceSubscription(currentUserId: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!currentUserId) {
      queryClient.setQueryData<Set<string>>(["onlineUsers"], new Set());
      return;
    }

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState: RealtimePresenceState<OnlineUser> =
          channel.presenceState();
        const userIds = new Set(
          Object.values(presenceState)
            .flat()
            .map((presence) => presence.userId),
        );
        queryClient.setQueryData<Set<string>>(["onlineUsers"], userIds);
      })
      .on("presence", { event: "leave" }, () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          updateLastSeen(currentUserId);
          await channel.track({
            userId: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]);
}
