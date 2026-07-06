import { useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Kettlebell } from "./Kettlebell";
import {
  activityBreakdown,
  assessSleep,
  assessSteps,
  assessTraining,
  computeAchievements,
  computeStats,
  DAYS,
  daysInMonth,
  formatDateLong,
  formatDateShort,
  formatSleep,
  MONTHS,
  type Day,
} from "./data";



const ACCENT = "hsl(210 90% 62%)";
const ACCENT_2 = "hsl(180 70% 60%)";
const ACCENT_3 = "hsl(155 60% 60%)";
const ACCENT_WARN = "hsl(30 90% 65%)";

// ---------- Chart primitives ----------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1626]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 font-semibold text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">
            {typeof p.value === "number" ? p.value.toLocaleString("de-DE") : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- Stat pill ----------

function StatCard({
  label,
  value,
  hint,
  accent = ACCENT,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="border-white/10 bg-card/60 p-5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold text-foreground" style={{ color: accent }}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

// ---------- Sleep chapter ----------

function SleepChart({ days, onSelect }: { days: Day[]; onSelect: (d: Day) => void }) {
  const data = days.map((d) => ({
    date: formatDateShort(d.date),
    _raw: d,
    Tief: Math.round((d.deepMin / 60) * 10) / 10,
    Leicht: Math.round((d.lightMin / 60) * 10) / 10,
    REM: Math.round((d.remMin / 60) * 10) / 10,
    Wach: Math.round((d.awakeMin / 60) * 10) / 10,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        onClick={(e: any) => e?.activePayload?.[0]?.payload?._raw && onSelect(e.activePayload[0].payload._raw)}
      >
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} unit=" h" />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <ReferenceLine y={7} stroke="hsl(0 80% 65%)" strokeDasharray="4 4" label={{ value: "WHO Ziel 7h", fill: "hsl(0 80% 65%)", fontSize: 10, position: "right" }} />
        <Bar dataKey="Tief" stackId="s" fill={ACCENT} radius={[0, 0, 0, 0]} />
        <Bar dataKey="Leicht" stackId="s" fill={ACCENT_2} />
        <Bar dataKey="REM" stackId="s" fill={ACCENT_3} />
        <Bar dataKey="Wach" stackId="s" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------- Steps chapter ----------

function StepsChart({ days, onSelect }: { days: Day[]; onSelect: (d: Day) => void }) {
  const data = days.map((d) => ({ date: formatDateShort(d.date), _raw: d, Schritte: d.steps }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        onClick={(e: any) => e?.activePayload?.[0]?.payload?._raw && onSelect(e.activePayload[0].payload._raw)}
      >
        <defs>
          <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.7} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: ACCENT, strokeOpacity: 0.3 }} />
        <ReferenceLine y={10000} stroke="hsl(0 80% 65%)" strokeDasharray="4 4" label={{ value: "WHO 10.000", fill: "hsl(0 80% 65%)", fontSize: 10, position: "right" }} />
        <Area type="monotone" dataKey="Schritte" stroke={ACCENT} strokeWidth={2} fill="url(#stepsGrad)" activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------- Training chapter ----------

function TrainingChart({ days, onSelect }: { days: Day[]; onSelect: (d: Day) => void }) {
  const data = days.map((d) => ({
    date: formatDateShort(d.date),
    _raw: d,
    Minuten: d.trainingMin,
    Kalorien: d.workouts.reduce((s, w) => s + w.calories, 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        onClick={(e: any) => e?.activePayload?.[0]?.payload?._raw && onSelect(e.activePayload[0].payload._raw)}
      >
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} unit=" min" />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="Minuten" fill={ACCENT} radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.Minuten === 0 ? "rgba(255,255,255,0.06)" : ACCENT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------- Day detail popover ----------

function DayDetail({ day, onClose }: { day: Day | null; onClose: () => void }) {
  if (!day) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-white/10 bg-card p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Tages­detail</div>
            <div className="mt-1 font-display text-lg font-bold">{formatDateLong(day.date)}</div>
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-white/5">
            ✕
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Detail label="Schritte" value={day.steps ? day.steps.toLocaleString("de-DE") : "–"} />
          <Detail label="Distanz" value={day.distanceKm ? `${day.distanceKm} km` : "–"} />
          <Detail label="Schlaf" value={formatSleep(day.sleepMin)} />
          <Detail label="Sleep-Score" value={day.sleepScore ? `${day.sleepScore}/100` : "–"} />
          <Detail label="Ruhepuls" value={day.restingHr ? `${day.restingHr} bpm` : "–"} />
          <Detail label="Stress Ø" value={day.stress != null ? `${day.stress}` : "–"} />
          <Detail label="Kalorien" value={day.calories ? day.calories.toLocaleString("de-DE") : "–"} />
          <Detail label="Body Battery" value={day.bodyBatteryHigh ? `${day.bodyBatteryLow ?? "?"} – ${day.bodyBatteryHigh}` : "–"} />
        </div>
        {day.workouts.length > 0 && (
          <div className="mt-5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Trainings</div>
            <div className="mt-2 space-y-2">
              {day.workouts.map((w, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-background/40 p-3 text-sm">
                  <div className="font-medium">{w.name || w.type}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{w.durationMin} min</span>
                    {w.calories > 0 && <span>{w.calories} kcal</span>}
                    {w.avgHr && <span>Ø {Math.round(w.avgHr)} bpm</span>}
                    {w.distanceKm > 0 && <span>{w.distanceKm} km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

// ---------- Chapter block ----------

function ChapterBlock({
  index,
  kicker,
  title,
  story,
  stats,
  chart,
  mood = "good",
  who,
}: {
  index: string;
  kicker: string;
  title: string;
  story: string;
  stats: { label: string; value: string; accent?: string }[];
  chart: React.ReactNode;
  mood?: "good" | "tip";
  who?: { label: string; value: string; verdict: string };
}) {
  return (
    <section className="border-t border-white/5 py-14 first:border-t-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[380px_1fr] lg:gap-16">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
                {index} · {kicker}
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight lg:text-4xl">{title}</h2>
            </div>
            <Kettlebell mood={mood} size={72} className="-mt-2 shrink-0 drop-shadow-[0_6px_20px_rgba(122,183,255,0.25)]" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{story}</p>
          <div className="mt-6 space-y-3">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 pl-4" style={{ borderColor: s.accent || ACCENT }}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <div className="mt-0.5 font-display text-xl font-bold" style={{ color: s.accent || ACCENT }}>
                  {s.value}
                </div>
              </div>
            ))}
            {who && (
              <div className="mt-4 rounded-lg border border-white/10 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: mood === "good" ? ACCENT_3 : "hsl(0 80% 68%)" }}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: mood === "good" ? ACCENT_3 : "hsl(0 80% 68%)" }} />
                  {who.label}
                </div>
                <div className="mt-1 text-sm text-foreground">{who.value}</div>
                <div className="mt-2 text-xs text-muted-foreground">Dein Ergebnis: <span className="font-semibold text-foreground">{who.verdict}</span></div>
              </div>
            )}
          </div>
        </div>
        <Card className="border-white/10 bg-card/60 p-4 lg:p-6">{chart}</Card>
      </div>
    </section>
  );
}


// ---------- Guided Tour ----------

interface TourChapter {
  id: string;
  monthKey: string;
  label: string;
  headline: string;
  narrative: string;
}

const TOUR: TourChapter[] = [
  {
    id: "jan",
    monthKey: "2026-01",
    label: "Januar · Der Auftakt",
    headline: "Neujahr, neue Routine",
    narrative:
      "Der Jahresstart – noch ohne Rhythmus, aber mit klarer Absicht. Schlaf und Schritte pendeln sich langsam ein, das erste Krafttraining findet statt.",
  },
  {
    id: "feb",
    monthKey: "2026-02",
    label: "Februar · Rhythmus finden",
    headline: "Aus Vorsätzen wird Gewohnheit",
    narrative:
      "Die Trainingsfrequenz steigt, der Schlaf wird stabiler. Erste Serien von aktiven Tagen entstehen – die Basis für alles Weitere.",
  },
  {
    id: "mar",
    monthKey: "2026-03",
    label: "März · Der Wendepunkt",
    headline: "Mehr Struktur, mehr Regeneration",
    narrative:
      "Der Körper reagiert sichtbar: Ruhepuls sinkt, Body Battery lädt besser. Krafttraining und Cardio wechseln sich ab.",
  },
  {
    id: "apr",
    monthKey: "2026-04",
    label: "April · Frühling ruft",
    headline: "Bewegung nach draußen",
    narrative:
      "Steigende Schrittzahlen, mehr Outdoor-Aktivität. Der Frühling zeigt sich in den Daten – längere Distanzen, höhere Intensität.",
  },
  {
    id: "may",
    monthKey: "2026-05",
    label: "Mai · Konstanz",
    headline: "Alles im grünen Bereich",
    narrative:
      "Schlaf, Schritte und Training auf konstant hohem Niveau. Die Routine trägt – das ist die belohnende Phase.",
  },
  {
    id: "jun",
    monthKey: "2026-06",
    label: "Juni · Aktueller Stand",
    headline: "Wo stehe ich heute?",
    narrative:
      "Der aktuelle Ausschnitt: Wie sieht mein Alltag in diesem Moment aus? Was funktioniert, was darf sich weiterentwickeln?",
  },
];

function TourView({ onSelectDay }: { onSelectDay: (d: Day) => void }) {
  const [step, setStep] = useState(0);
  const chapter = TOUR[step];
  const days = daysInMonth(chapter.monthKey);
  const stats = computeStats(days);
  const aSleep = assessSleep(days);
  const aSteps = assessSteps(days);
  const aTraining = assessTraining(days);
  const overallMood: "good" | "tip" = [aSleep, aSteps, aTraining].every((a) => a.mood === "good") ? "good" : "tip";
  const motText = overallMood === "good"
    ? "Top-Phase: Schlaf, Schritte und Training – alles im grünen Bereich. Genau so soll es sein."
    : "Solide Basis mit klaren Baustellen. Ein bis zwei gezielte Anpassungen und die Kurve zeigt nach oben.";
  const progress = ((step + 1) / TOUR.length) * 100;


  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Kapitel {step + 1} von {TOUR.length}</span>
          <span>{Math.round(progress)}% der Reise</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {TOUR.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setStep(i)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                i === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < step
                    ? "border-primary/40 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-white/30"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <Card className="border-primary/30 bg-primary/5 p-6">
          <div className="flex items-start gap-4">
            <Kettlebell mood={overallMood} size={64} className="shrink-0" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">{chapter.label}</div>
              <h2 className="mt-2 font-display text-3xl font-bold lg:text-4xl">{chapter.headline}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{chapter.narrative}</p>
              <div className="mt-4 rounded-md border-l-2 border-primary bg-background/40 px-3 py-2 text-sm italic text-foreground/90">
                <span className="mr-2 text-[10px] font-semibold not-italic uppercase tracking-widest text-primary">Deine Phase in einem Satz</span>
                <br />
                {motText}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ChapterBlock
        index="01"
        kicker="Schlaf & Regeneration"
        title={aSleep.headline}
        story={aSleep.story}
        mood={aSleep.mood}
        who={{ label: aSleep.whoLabel, value: aSleep.whoValue, verdict: aSleep.verdict }}

        stats={[
          { label: "Ø Schlafdauer", value: formatSleep(stats.avgSleepMin) },
          { label: "Ø Sleep-Score", value: stats.avgSleepScore ? `${stats.avgSleepScore}/100` : "–", accent: ACCENT_2 },
          { label: "Beste Nacht", value: stats.bestSleepDay ? `${stats.bestSleepDay.sleepScore} · ${formatDateShort(stats.bestSleepDay.date)}` : "–", accent: ACCENT_3 },
        ]}
        chart={<SleepChart days={days} onSelect={onSelectDay} />}
      />

      <ChapterBlock
        index="02"
        kicker="Alltag & Bewegung"
        title={aSteps.headline}
        story={aSteps.story}
        mood={aSteps.mood}
        who={{ label: aSteps.whoLabel, value: aSteps.whoValue, verdict: aSteps.verdict }}
        stats={[
          { label: "Ø Schritte / Tag", value: stats.avgSteps.toLocaleString("de-DE") },
          { label: "Bester Tag", value: stats.bestStepDay ? `${stats.bestStepDay.steps.toLocaleString("de-DE")} · ${formatDateShort(stats.bestStepDay.date)}` : "–", accent: ACCENT_2 },
          { label: "Ø Ruhepuls", value: stats.avgRestingHr ? `${stats.avgRestingHr} bpm` : "–", accent: ACCENT_3 },
        ]}
        chart={<StepsChart days={days} onSelect={onSelectDay} />}
      />

      <ChapterBlock
        index="03"
        kicker="Training & Kraft"
        title={aTraining.headline}
        story={aTraining.story}
        mood={aTraining.mood}
        who={{ label: aTraining.whoLabel, value: aTraining.whoValue, verdict: aTraining.verdict }}
        stats={[
          { label: "Sessions", value: `${stats.workoutCount}` },
          { label: "Trainingszeit", value: `${Math.round(stats.trainingMin / 60)} h ${stats.trainingMin % 60} min`, accent: ACCENT_2 },
          { label: "Aktive Tage", value: `${stats.activeDays} / ${stats.daysCount}`, accent: ACCENT_3 },
        ]}
        chart={<TrainingChart days={days} onSelect={onSelectDay} />}
      />


      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-8">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← Zurück
        </Button>
        <div className="text-sm text-muted-foreground">
          {step === TOUR.length - 1 ? "Ende der geführten Tour – wechsle in den Explorer, um selbst zu stöbern." : "Weiter in der Story"}
        </div>
        <Button disabled={step === TOUR.length - 1} onClick={() => setStep((s) => Math.min(TOUR.length - 1, s + 1))}>
          Weiter →
        </Button>
      </div>
    </div>
  );
}

// ---------- Explorer ----------

function ExplorerView({ onSelectDay }: { onSelectDay: (d: Day) => void }) {
  const [monthKey, setMonthKey] = useState(MONTHS[MONTHS.length - 1].key);
  const monthDays = daysInMonth(monthKey);
  const maxWeek = Math.max(1, Math.ceil(monthDays.length / 7));
  const [week, setWeek] = useState<number[]>([1]);
  const weekIndex = Math.min(week[0], maxWeek);
  const weekDays = monthDays.slice((weekIndex - 1) * 7, weekIndex * 7);
  const stats = computeStats(weekDays);
  const aSleep = assessSleep(weekDays);
  const aSteps = assessSteps(weekDays);
  const aTraining = assessTraining(weekDays);
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <Tabs value={monthKey} onValueChange={(v) => { setMonthKey(v); setWeek([1]); }}>
        <TabsList className="flex w-full flex-wrap justify-start bg-white/5">
          {MONTHS.map((m) => (
            <TabsTrigger key={m.key} value={m.key} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={monthKey} className="mt-6">
          <Card className="border-white/10 bg-card/60 p-6">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
                  {first && last ? `${formatDateShort(first.date)} – ${formatDateShort(last.date)}` : "–"} · Woche {weekIndex} von {maxWeek}
                </div>
                <div className="mt-1 font-display text-lg font-semibold">
                  Explorer-Modus: {MONTHS.find((m) => m.key === monthKey)?.label} 2026
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Ziehe den Slider, um durch die Wochen zu blättern</div>
            </div>
            <Slider value={week} onValueChange={setWeek} min={1} max={maxWeek} step={1} className="mt-2" />
          </Card>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ø Schlaf" value={formatSleep(stats.avgSleepMin)} hint={stats.avgSleepScore ? `Score Ø ${stats.avgSleepScore}` : undefined} />
            <StatCard label="Ø Schritte" value={stats.avgSteps.toLocaleString("de-DE")} accent={ACCENT_2} hint={stats.avgSteps >= 10000 ? "über WHO-Ziel" : "unter WHO-Ziel"} />
            <StatCard label="Trainings" value={`${stats.workoutCount}`} accent={ACCENT_3} hint={`${stats.trainingMin} min gesamt`} />
            <StatCard label="Ø Ruhepuls" value={stats.avgRestingHr ? `${stats.avgRestingHr} bpm` : "–"} accent={ACCENT_WARN} hint={stats.avgStress ? `Stress Ø ${stats.avgStress}` : undefined} />
          </div>

          <ChapterBlock
            index="01"
            kicker="Schlaf & Regeneration"
            title={aSleep.headline}
            story={aSleep.story}
            mood={aSleep.mood}
            who={{ label: aSleep.whoLabel, value: aSleep.whoValue, verdict: aSleep.verdict }}
            stats={[
              { label: "Ø Dauer", value: formatSleep(stats.avgSleepMin) },
              { label: "Ø Score", value: stats.avgSleepScore ? `${stats.avgSleepScore}/100` : "–", accent: ACCENT_2 },
            ]}
            chart={<SleepChart days={weekDays} onSelect={onSelectDay} />}
          />

          <ChapterBlock
            index="02"
            kicker="Alltag & Bewegung"
            title={aSteps.headline}
            story={aSteps.story}
            mood={aSteps.mood}
            who={{ label: aSteps.whoLabel, value: aSteps.whoValue, verdict: aSteps.verdict }}
            stats={[
              { label: "Ø / Tag", value: stats.avgSteps.toLocaleString("de-DE") },
              { label: "Summe", value: stats.totalSteps.toLocaleString("de-DE"), accent: ACCENT_2 },
            ]}
            chart={<StepsChart days={weekDays} onSelect={onSelectDay} />}
          />

          <ChapterBlock
            index="03"
            kicker="Training"
            title={aTraining.headline}
            story={aTraining.story}
            mood={aTraining.mood}
            who={{ label: aTraining.whoLabel, value: aTraining.whoValue, verdict: aTraining.verdict }}
            stats={[
              { label: "Sessions", value: `${stats.workoutCount}` },
              { label: "Minuten", value: `${stats.trainingMin}`, accent: ACCENT_2 },
              { label: "Aktive Tage", value: `${stats.activeDays}/${stats.daysCount}`, accent: ACCENT_3 },
            ]}
            chart={<TrainingChart days={weekDays} onSelect={onSelectDay} />}
          />

        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Compare ----------

function CompareView() {
  const [a, setA] = useState("2026-01");
  const [b, setB] = useState("2026-05");
  const daysA = daysInMonth(a);
  const daysB = daysInMonth(b);
  const sA = computeStats(daysA);
  const sB = computeStats(daysB);

  const rows: { label: string; a: string; b: string; better: "a" | "b" | "eq"; unit?: string }[] = [
    { label: "Ø Schlafdauer", a: formatSleep(sA.avgSleepMin), b: formatSleep(sB.avgSleepMin), better: sA.avgSleepMin > sB.avgSleepMin ? "a" : sA.avgSleepMin < sB.avgSleepMin ? "b" : "eq" },
    { label: "Ø Sleep-Score", a: `${sA.avgSleepScore ?? "–"}`, b: `${sB.avgSleepScore ?? "–"}`, better: (sA.avgSleepScore ?? 0) > (sB.avgSleepScore ?? 0) ? "a" : "b" },
    { label: "Ø Schritte", a: sA.avgSteps.toLocaleString("de-DE"), b: sB.avgSteps.toLocaleString("de-DE"), better: sA.avgSteps > sB.avgSteps ? "a" : "b" },
    { label: "Trainings", a: `${sA.workoutCount}`, b: `${sB.workoutCount}`, better: sA.workoutCount > sB.workoutCount ? "a" : "b" },
    { label: "Trainingsminuten", a: `${sA.trainingMin} min`, b: `${sB.trainingMin} min`, better: sA.trainingMin > sB.trainingMin ? "a" : "b" },
    { label: "Ø Ruhepuls", a: sA.avgRestingHr ? `${sA.avgRestingHr} bpm` : "–", b: sB.avgRestingHr ? `${sB.avgRestingHr} bpm` : "–", better: (sA.avgRestingHr ?? 999) < (sB.avgRestingHr ?? 999) ? "a" : "b" },
    { label: "Aktive Tage", a: `${sA.activeDays}/${sA.daysCount}`, b: `${sB.activeDays}/${sB.daysCount}`, better: sA.activeDays > sB.activeDays ? "a" : "b" },
  ];

  const combined = useMemo(() => {
    const len = Math.max(daysA.length, daysB.length);
    return Array.from({ length: len }, (_, i) => ({
      day: `Tag ${i + 1}`,
      [MONTHS.find((m) => m.key === a)?.label ?? "A"]: daysA[i]?.steps ?? 0,
      [MONTHS.find((m) => m.key === b)?.label ?? "B"]: daysB[i]?.steps ?? 0,
    }));
  }, [a, b, daysA, daysB]);

  const labelA = MONTHS.find((m) => m.key === a)?.label ?? "";
  const labelB = MONTHS.find((m) => m.key === b)?.label ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4">
      <Card className="border-white/10 bg-card/60 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Vergleichsmodus</div>
        <h2 className="mt-1 font-display text-2xl font-bold">Zwei Monate im direkten Duell</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MonthSelect label="Monat A" value={a} onChange={setA} color={ACCENT} />
          <MonthSelect label="Monat B" value={b} onChange={setB} color={ACCENT_2} />
        </div>
      </Card>

      <Card className="mt-6 border-white/10 bg-card/60 p-6">
        <div className="text-sm font-semibold">Schritte im Vergleich</div>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={combined}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={10000} stroke="hsl(0 80% 65%)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey={labelA} stroke={ACCENT} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={labelB} stroke={ACCENT_2} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden border-white/10 bg-card/60">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-white/10 px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Metrik</span>
          <span className="text-right" style={{ color: ACCENT }}>{labelA}</span>
          <span className="text-right" style={{ color: ACCENT_2 }}>{labelB}</span>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-white/5 px-6 py-3 text-sm last:border-b-0">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={`text-right font-semibold ${r.better === "a" ? "text-primary" : ""}`}>{r.a}</span>
            <span className={`text-right font-semibold ${r.better === "b" ? "" : ""}`} style={r.better === "b" ? { color: ACCENT_2 } : undefined}>
              {r.b}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function MonthSelect({ label, value, onChange, color }: { label: string; value: string; onChange: (v: string) => void; color: string }) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-widest" style={{ color }}>{label}</div>
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m) => (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${value === m.key ? "text-primary-foreground" : "border-white/10 text-muted-foreground hover:border-white/30"}`}
            style={value === m.key ? { background: color, borderColor: color } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Achievements ----------

function Achievements() {
  const list = computeAchievements(DAYS);
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Achievements</div>
      <h2 className="mt-1 font-display text-2xl font-bold">Was du bisher erreicht hast</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Berechnet aus deinen Daten Januar – heute. Freigeschaltete Achievements sind farbig, verschlossene grau.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <Card
            key={a.title}
            className={`border p-5 transition-all ${
              a.unlocked ? "border-primary/40 bg-primary/5" : "border-white/10 bg-card/40 opacity-60"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl ${a.unlocked ? "bg-primary/20" : "bg-white/5"}`}>
                {a.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{a.title}</span>
                  {a.unlocked && <Badge className="bg-primary text-primary-foreground">freigeschaltet</Badge>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{a.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ---------- Root Dashboard ----------

export function Dashboard() {
  const [mode, setMode] = useState<"tour" | "explorer" | "compare">("tour");
  const [dayDetail, setDayDetail] = useState<Day | null>(null);
  const overallStats = useMemo(() => computeStats(DAYS), []);
  const last = DAYS[DAYS.length - 1];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_auto] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Health & Performance · Januar – {formatDateShort(last.date)}
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight lg:text-6xl">
              Vanessas Tracking-Story
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
              161 Tage Selbsttracking mit Garmin – Schlaf, Alltag und Training in einer geführten Reise oder als
              freies Explorer-Board. Alle Daten liegen lokal in der App, keine Weitergabe an Dritte (DSGVO-konform).
            </p>
            <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Tage" value={`${overallStats.daysCount}`} />
              <StatCard label="Schritte gesamt" value={overallStats.totalSteps.toLocaleString("de-DE")} accent={ACCENT_2} />
              <StatCard label="Sessions" value={`${overallStats.workoutCount}`} accent={ACCENT_3} />
              <StatCard label="Ø Ruhepuls" value={overallStats.avgRestingHr ? `${overallStats.avgRestingHr}` : "–"} accent={ACCENT_WARN} hint="bpm" />
            </div>
          </div>
          <div className="hidden lg:block">
            <Kettlebell size={220} />
          </div>
        </div>
      </header>

      {/* Mode switcher */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            {(
              [
                { k: "tour", label: "Guided Tour" },
                { k: "explorer", label: "Explorer" },
                { k: "compare", label: "Vergleich" },
              ] as const
            ).map((o) => (
              <button
                key={o.k}
                onClick={() => setMode(o.k)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  mode === o.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Datenquelle: Garmin UDS / Sleep / Activities · JSON-Upload · lokal ausgewertet
          </div>
        </div>
      </div>

      <div className="pt-8">
        {mode === "tour" && <TourView onSelectDay={setDayDetail} />}
        {mode === "explorer" && <ExplorerView onSelectDay={setDayDetail} />}
        {mode === "compare" && <CompareView />}
      </div>

      <Achievements />

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        THWS Würzburg · Medienmanagement · Modul Interaktive Medien · Datenauswertung Vanessa Kressar
      </footer>

      <DayDetail day={dayDetail} onClose={() => setDayDetail(null)} />
    </main>
  );
}
