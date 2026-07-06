import { createClient } from "@supabase/supabase-js";
import type { Day } from "@/components/fitness/data";

// Vanessas eigenes Supabase-Projekt (publishable key – öffentlich, RLS-geschützt)
const SUPABASE_URL = "https://qfjdkwaajuzphjapiutm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0OQwKEZovCIL-GI-DipbRA_GNmOtSRS";

export const fitnessSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function fetchFitnessDays(): Promise<Day[] | null> {
  try {
    const { data, error } = await fitnessSupabase
      .from("fitness_days")
      .select("date, payload")
      .order("date", { ascending: true });
    if (error) {
      console.warn("[supabase] fitness_days:", error.message);
      return null;
    }
    if (!data || data.length === 0) return null;
    return data.map((row: any) =>
      typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload,
    ) as Day[];
  } catch (err) {
    console.warn("[supabase] fetch failed:", err);
    return null;
  }
}
