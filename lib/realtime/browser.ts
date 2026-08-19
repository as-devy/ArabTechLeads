import { createClient } from "@/lib/supabase/client";

export function getRealtimeClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    return createClient();
  } catch {
    return null;
  }
}

export type RealtimeRow = Record<string, unknown>;

export type RealtimeChange = {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: RealtimeRow;
  old: RealtimeRow;
};

export function rowId(row: RealtimeRow, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}
