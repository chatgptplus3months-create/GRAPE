import React, { useEffect, useMemo, useState } from "react";
import type { UserProfile } from "../types";

/**
 * DASHBOARD OVERVIEW (Glassmorphism + Medium widgets + Interactive + Fade-in)
 * Drop-in replacement for your DashboardOverview component.
 *
 * Notes:
 * - Tailwind only
 * - If your project doesn't support `animate-in` classes, remove them.
 */
type DashboardOverviewProps = {
  user: any; // quickest fix
  searchQuery: string;

  activeNodes?: number;
  syncingNodes?: number;
  ecosystemLabel?: string;

  facultyInfluence?: number;
  starsThisWeek?: number;

  onDeployNode?: () => void;
  onOpenTelemetry?: () => void;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export default function DashboardOverview({
  user,
  activeNodes = 0,
  syncingNodes = 0,
  ecosystemLabel = "OPTIMAL",
  facultyInfluence = 0,
  starsThisWeek = 0,
  onDeployNode,
  onOpenTelemetry,
}: DashboardOverviewProps) {
  const firstName = useMemo(() => {
    const n = (user?.name || "").trim();
    if (!n) return "Gaya";
    return n.split(" ")[0];
  }, [user?.name]);

  // Subtle interactive ping
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 250);
    return () => clearTimeout(t);
  }, []);

  const progress = clamp(facultyInfluence, 0, 100);
  const glowAlpha = Math.min(
    0.28,
    0.1 + clamp(facultyInfluence, 0, 9999) / 20000,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-7 md:gap-8 items-start">
        {/* LEFT: Greeting / System Card */}
        <div className="relative overflow-hidden rounded-[44px] md:rounded-[56px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl">
          {/* soft glows */}
          <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-[#790BFD]/18 blur-[140px]" />
          <div className="absolute -bottom-28 -left-28 w-96 h-96 rounded-full bg-emerald-500/12 blur-[140px]" />

          <div className="relative p-7 md:p-10">
            {/* top status row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] border border-[#790BFD]/25 bg-[#790BFD]/10 text-[#C6A8FF]">
                <span
                  className={`h-2 w-2 rounded-full ${pulse ? "bg-[#790BFD]" : "bg-white/20"} transition`}
                />
                System Active
              </span>

              <span className="inline-flex items-center gap-3 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] border border-white/10 bg-white/5 text-white/40">
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                Ecosystem: {ecosystemLabel}
              </span>
            </div>

            {/* hero row */}
            <div className="mt-9 md:mt-10 flex items-start gap-6">
              {/* avatar */}
              <div className="shrink-0">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-3xl bg-gradient-to-br from-[#790BFD] to-fuchsia-600 p-[1px] shadow-2xl">
                  <div className="h-full w-full rounded-3xl bg-black/30 backdrop-blur-2xl flex items-center justify-center border border-white/10">
                    <span className="text-3xl md:text-4xl">🍇</span>
                  </div>
                </div>
              </div>

              {/* greeting */}
              <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight text-white">
                Hi,{" "}
                <span className="bg-gradient-to-r from-[#8A2EFF] via-[#B98BFF] to-emerald-300 bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
            </div>

            {/* description */}
            <p className="mt-8 md:mt-10 text-sm md:text-base font-semibold text-white/55 leading-relaxed max-w-2xl">
              Monitoring{" "}
              <span className="text-white/80 font-black">
                {activeNodes} nodes
              </span>
              . Currently{" "}
              <span className="text-white/80 font-black">
                {syncingNodes} nodes
              </span>{" "}
              are syncing data or awaiting verification in the registry.
            </p>

            {/* divider */}
            <div className="mt-9 md:mt-10 h-px w-full bg-white/10" />

            {/* actions row */}
            <div className="mt-7 md:mt-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <button
                onClick={onDeployNode}
                className="group inline-flex items-center justify-center rounded-[28px] px-7 py-5 bg-gradient-to-r from-[#790BFD] to-fuchsia-600 text-white font-black uppercase text-[11px] tracking-[0.3em]
                           shadow-2xl shadow-fuchsia-600/15 hover:brightness-110 active:scale-[0.99] transition"
              >
                Deploy Node{" "}
                <span className="ml-2 opacity-90 group-hover:translate-x-0.5 transition">
                  +
                </span>
              </button>

              {/* medium telemetry widget button */}
              <button
                onClick={onOpenTelemetry}
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-2xl px-6 py-5
                           hover:bg-white/10 active:scale-[0.99] transition shadow-xl"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-sky-500/10 blur-[60px]" />
                <div className="relative flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center">
                    <span className="text-lg">🛰️</span>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                      Telemetry
                    </div>
                    <div className="mt-1 text-[12px] font-extrabold text-emerald-300">
                      {syncingNodes} SYNCING
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Medium Widget (Glass) */}
        <div className="relative overflow-hidden rounded-[44px] md:rounded-[56px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-700">
          {/* glows */}
          <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-amber-400/10 blur-[140px]" />
          <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full bg-[#790BFD]/12 blur-[140px]" />

          <div className="relative p-7 md:p-10">
            {/* header */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
                Faculty Influence
              </p>

              <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-[10px] font-black tracking-[0.22em] uppercase">
                Verified
              </span>
            </div>

            {/* main stat row */}
            <div className="mt-8 flex items-end justify-between gap-6">
              <div>
                <div className="text-6xl md:text-7xl font-black text-white leading-none tracking-tight">
                  {facultyInfluence}
                </div>
                <p className="mt-2 text-[12px] font-semibold text-white/60">
                  {starsThisWeek} stars earned this week
                </p>
              </div>

              {/* star with controlled glow */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-[34px]"
                  style={{ background: `rgba(255, 200, 80, ${glowAlpha})` }}
                />
                <span className="relative text-5xl">⭐</span>
              </div>
            </div>

            {/* interactive progress */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                  Progress
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                  {progress}%
                </p>
              </div>

              <div className="mt-3 h-3 rounded-full bg-black/25 border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300/80 via-[#790BFD]/70 to-emerald-300/70 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-5 text-[12px] text-white/55 leading-relaxed">
                Complete missions to increase influence. Verified identity
                unlocks advanced protocols.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-7">
              <button
                onClick={onOpenTelemetry}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.32em] text-white/75
                           hover:bg-white/10 hover:text-white transition active:scale-[0.99]"
              >
                View Influence Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* bottom divider */}
      <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
