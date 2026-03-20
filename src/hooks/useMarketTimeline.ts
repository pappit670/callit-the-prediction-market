import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";

type ProbabilityPoint = { time: string; probability: number };

export type OptionSeries = {
  label: string;
  data: ProbabilityPoint[];
};

export type MarketTimelineState = {
  hasActivity: boolean;
  optionSeries: OptionSeries[];
  latestProbabilities: Record<string, number>;
  participants: number;
  totalCoinsStaked: number;
};

const COINS_PER_STAKE = 50;
const DEFAULT_MAX_POINTS = 20;
const MAX_CALLS_FOR_TIMELINE = 5000;

function formatRelativeTime(firstTimeISO: string, currentTimeISO: string): string {
  const first = new Date(firstTimeISO).getTime();
  const cur = new Date(currentTimeISO).getTime();
  const deltaMs = Math.max(0, cur - first);

  const totalSeconds = Math.floor(deltaMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const secondsRemainder = totalSeconds - minutes * 60;

  if (minutes > 0) return `+${minutes}m`;
  return `+${secondsRemainder}s`;
}

function buildTimelineFromCalls({
  calls,
  options,
  maxPoints,
}: {
  calls: { chosen_option: string; created_at: string }[];
  options: string[];
  maxPoints: number;
}): {
  optionSeries: OptionSeries[];
  latestProbabilities: Record<string, number>;
  participants: number;
  totalCoinsStaked: number;
} {
  if (!calls.length) {
    const emptySeries = options.map((label) => ({ label, data: [] }));
    return {
      optionSeries: emptySeries,
      latestProbabilities: Object.fromEntries(options.map((o) => [o, 0])),
      participants: 0,
      totalCoinsStaked: 0,
    };
  }

  const participants = calls.length;
  const totalCoinsStaked = participants * COINS_PER_STAKE;

  const snapshotCount = Math.min(maxPoints, calls.length);
  const lastIndex = calls.length - 1;

  const rawIndices = Array.from({ length: snapshotCount }, (_, i) => {
    // Evenly distribute points across calls while keeping the first/last included.
    return Math.round((i * lastIndex) / Math.max(1, snapshotCount - 1));
  });

  const snapshotIndices = Array.from(new Set(rawIndices)).sort((a, b) => a - b);

  const counts: Record<string, number> = Object.fromEntries(options.map((o) => [o, 0]));

  const seriesDataByOption: Record<string, ProbabilityPoint[]> = Object.fromEntries(
    options.map((o) => [o, []]),
  );
  const latestProbabilities: Record<string, number> = Object.fromEntries(options.map((o) => [o, 0]));

  const firstTime = calls[0].created_at;
  let snapshotCursor = 0;

  for (let i = 0; i < calls.length; i++) {
    const chosen = calls[i].chosen_option;
    if (chosen in counts) counts[chosen] += 1;

    if (snapshotCursor >= snapshotIndices.length) continue;
    if (i !== snapshotIndices[snapshotCursor]) continue;

    const totalSoFar = i + 1;
    const timeLabel = formatRelativeTime(firstTime, calls[i].created_at);

    for (const opt of options) {
      const prob = totalSoFar > 0 ? (counts[opt] / totalSoFar) * 100 : 0;
      const rounded = Math.round(prob);
      latestProbabilities[opt] = rounded;
      seriesDataByOption[opt].push({ time: timeLabel, probability: rounded });
    }

    snapshotCursor += 1;
  }

  const optionSeries: OptionSeries[] = options.map((label) => ({
    label,
    data: seriesDataByOption[label] || [],
  }));

  return { optionSeries, latestProbabilities, participants, totalCoinsStaked };
}

export function useMarketTimeline({
  opinionId,
  options,
  maxPoints = DEFAULT_MAX_POINTS,
  enabled = true,
  realtime = true,
  pollIntervalMs = 15000,
}: {
  opinionId: string | number | undefined;
  options: string[];
  maxPoints?: number;
  enabled?: boolean;
  realtime?: boolean;
  pollIntervalMs?: number;
}): MarketTimelineState {
  const stableOptions = useMemo(() => options.filter(Boolean), [options]);

  const [optionSeries, setOptionSeries] = useState<OptionSeries[]>(() =>
    stableOptions.map((label) => ({ label, data: [] })),
  );
  const [latestProbabilities, setLatestProbabilities] = useState<Record<string, number>>(() =>
    Object.fromEntries(stableOptions.map((o) => [o, 0])),
  );
  const [participants, setParticipants] = useState(0);
  const [totalCoinsStaked, setTotalCoinsStaked] = useState(0);

  const [hasActivity, setHasActivity] = useState(false);

  const rebuildTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!opinionId) return;
    if (!stableOptions.length) return;

    let isCancelled = false;

    const rebuildFromServer = async () => {
      try {
        const { data, error } = await supabase
          .from("calls")
          .select("chosen_option, created_at")
          .eq("opinion_id", opinionId)
          .order("created_at", { ascending: true })
          .limit(MAX_CALLS_FOR_TIMELINE);

        if (error) throw error;

        if (isCancelled) return;

        type CallRow = { chosen_option?: string | null; created_at?: string | null };
        const rows = (data || []) as unknown as CallRow[];
        const callsForTimeline = rows.filter(
          (c) => typeof c?.created_at === "string" && typeof c?.chosen_option === "string",
        );

        const built = buildTimelineFromCalls({
          calls: callsForTimeline,
          options: stableOptions,
          maxPoints,
        });

        setOptionSeries(built.optionSeries);
        setLatestProbabilities(built.latestProbabilities);
        setParticipants(built.participants);
        setTotalCoinsStaked(built.totalCoinsStaked);
        setHasActivity(built.participants > 0);
      } catch (e) {
        // Fail closed to "No activity yet" rather than breaking the UI.
        if (isCancelled) return;
        setOptionSeries(stableOptions.map((label) => ({ label, data: [] })));
        setLatestProbabilities(Object.fromEntries(stableOptions.map((o) => [o, 0])));
        setParticipants(0);
        setTotalCoinsStaked(0);
        setHasActivity(false);
      }
    };

    const scheduleRebuild = () => {
      if (rebuildTimerRef.current) window.clearTimeout(rebuildTimerRef.current);
      rebuildTimerRef.current = window.setTimeout(() => {
        rebuildFromServer();
      }, 450);
    };

    // Initial build
    rebuildFromServer();

    // If realtime updates are disabled (e.g., card grids), poll periodically.
    if (!realtime) {
      const t = window.setInterval(() => {
        rebuildFromServer();
      }, pollIntervalMs);

      return () => {
        isCancelled = true;
        if (rebuildTimerRef.current) window.clearTimeout(rebuildTimerRef.current);
        window.clearInterval(t);
      };
    }

    // Realtime updates for new stakes or updates (upserts).
    const channel = supabase
      .channel(`market_timeline_${opinionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calls",
          // Supabase filter format: `column=op.value` (type casting depends on DB).
          filter: `opinion_id=eq.${opinionId}`,
        },
        () => {
          scheduleRebuild();
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      if (rebuildTimerRef.current) window.clearTimeout(rebuildTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, opinionId, stableOptions, maxPoints]);

  return {
    hasActivity,
    optionSeries,
    latestProbabilities,
    participants,
    totalCoinsStaked,
  };
}

