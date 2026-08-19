"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { getRealtimeClient, type RealtimeChange } from "@/lib/realtime/browser";

export function RealtimeRefresher({
  tables,
  onEvent,
}: {
  tables: string[];
  onEvent?: (change: RealtimeChange) => void;
}) {
  const router = useRouter();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const supabase = getRealtimeClient();
    if (!supabase || tables.length === 0) return;

    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 120);
    };

    const channel = supabase.channel(`realtime-refresh:${tables.join(",")}`);
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          onEventRef.current?.({
            table,
            eventType: payload.eventType as RealtimeChange["eventType"],
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
          });
          refresh();
        },
      );
    }
    channel.subscribe();

    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router, tables.join(",")]);

  return null;
}
