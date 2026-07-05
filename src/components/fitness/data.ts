import raw from "@/data/fitness.json";

export interface Workout {
  name: string;
  type: string;
  durationMin: number;
  calories: number;
  avgHr: number | null;
  distanceKm: number;
}

export interface Day {
  date: string;
  steps: number;
  calories: number;
  activeCalories: number;
  restingHr: number | null;
  distanceKm: number;
  floors: number;
  stress: number | null;
  bodyBatteryHigh: number | null;
  bodyBatteryLow: number | null;
  intensityMin: number;
  sleepMin: number;
  deepMin: number;
  lightMin: number;
  remMin: number;
  awakeMin: number;
  sleepScore: number | null;
  sleepFeedback: string | null;
  workouts: Workout[];
  trainingMin: number;
}

export const DAYS: Day[] = raw as Day[];

export const MONTHS: { key: string; label: string }[] = [
  { key: "2026-01", label: "Januar" },
  { key: "2026-02", label: "Februar" },
  { key: "2026-03", label: "März" },
  { key: "2026-04", label: "April" },
  { key: "2026-05", label: "Mai" },
  { key: "2026-06", label: "Juni" },
];

export function daysInMonth(monthKey: string): Day[] {
  return DAYS.filter((d) => d.date.startsWith(monthKey));
}

export interface Stats {
  avgSleepMin: number;
  avgSleepScore: number | null;
  avgSteps: number;
  totalSteps: number;
  avgRestingHr: number | null;
  workoutCount: number;
  trainingMin: number;
  avgStress: number | null;
  bestStepDay: Day | null;
  bestSleepDay: Day | null;
  longestWorkout: Workout | null;
  activeDays: number;
  daysCount: number;
}

const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);
const avgOrNull = (nums: (number | null)[]) => {
  const filtered = nums.filter((n): n is number => n != null && n > 0);
  return filtered.length ? Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length) : null;
};

export function computeStats(days: Day[]): Stats {
  const withSleep = days.filter((d) => d.sleepMin > 0);
  const workouts = days.flatMap((d) => d.workouts);
  const bestStepDay = days.reduce<Day | null>((a, b) => (a && a.steps > b.steps ? a : b), null);
  const bestSleepDay = withSleep.reduce<Day | null>(
    (a, b) => (a && (a.sleepScore ?? 0) > (b.sleepScore ?? 0) ? a : b),
    null,
  );
  const longestWorkout = workouts.reduce<Workout | null>(
    (a, b) => (a && a.durationMin > b.durationMin ? a : b),
    null,
  );
  return {
    avgSleepMin: avg(withSleep.map((d) => d.sleepMin)),
    avgSleepScore: avgOrNull(withSleep.map((d) => d.sleepScore)),
    avgSteps: avg(days.map((d) => d.steps)),
    totalSteps: days.reduce((s, d) => s + d.steps, 0),
    avgRestingHr: avgOrNull(days.map((d) => d.restingHr)),
    workoutCount: workouts.length,
    trainingMin: days.reduce((s, d) => s + d.trainingMin, 0),
    avgStress: avgOrNull(days.map((d) => d.stress)),
    bestStepDay,
    bestSleepDay,
    longestWorkout,
    activeDays: days.filter((d) => d.trainingMin > 0).length,
    daysCount: days.length,
  };
}

export function formatSleep(min: number): string {
  if (!min) return "–";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} h ${m.toString().padStart(2, "0")} min`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function computeAchievements(days: Day[]) {
  const stats = computeStats(days);
  const list: { icon: string; title: string; desc: string; unlocked: boolean }[] = [];

  // 10k week
  let best10k = 0;
  for (let i = 0; i + 7 <= days.length; i++) {
    const chunk = days.slice(i, i + 7);
    const daysOver = chunk.filter((d) => d.steps >= 10000).length;
    if (daysOver > best10k) best10k = daysOver;
  }
  list.push({
    icon: "👟",
    title: "10k-Woche",
    desc: `${best10k} von 7 Tagen mit mindestens 10.000 Schritten`,
    unlocked: best10k >= 4,
  });

  // Streak of workouts
  let streak = 0,
    maxStreak = 0;
  for (const d of days) {
    if (d.trainingMin > 0) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else streak = 0;
  }
  list.push({
    icon: "🔥",
    title: "Trainings-Serie",
    desc: `Längste Serie: ${maxStreak} Tage in Folge aktiv`,
    unlocked: maxStreak >= 3,
  });

  // Best sleep score
  if (stats.bestSleepDay) {
    list.push({
      icon: "🌙",
      title: "Perfekte Nacht",
      desc: `Beste Sleep-Score: ${stats.bestSleepDay.sleepScore} am ${formatDateShort(stats.bestSleepDay.date)}`,
      unlocked: (stats.bestSleepDay.sleepScore ?? 0) >= 85,
    });
  }

  // Marathon workout
  if (stats.longestWorkout) {
    list.push({
      icon: "⏱️",
      title: "Marathon-Session",
      desc: `Längstes Training: ${stats.longestWorkout.durationMin} min · ${stats.longestWorkout.name}`,
      unlocked: stats.longestWorkout.durationMin >= 60,
    });
  }

  // Total steps milestone
  list.push({
    icon: "🏆",
    title: "Millionär-Club",
    desc: `${stats.totalSteps.toLocaleString("de-DE")} Schritte insgesamt`,
    unlocked: stats.totalSteps >= 1_000_000,
  });

  // Resting HR
  if (stats.avgRestingHr) {
    list.push({
      icon: "❤️",
      title: "Ruheherz",
      desc: `Ø Ruhepuls: ${stats.avgRestingHr} bpm – Zeichen guter Fitness`,
      unlocked: stats.avgRestingHr <= 60,
    });
  }

  return list;
}
