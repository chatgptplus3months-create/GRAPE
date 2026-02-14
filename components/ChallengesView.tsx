import React, { useState, useEffect, useCallback } from "react";
import { db, supabase } from "../services/supabase";
import { Challenge, UserProfile, ChallengeDifficulty } from "../types";

const CountdownTimer: React.FC<{ deadline: string }> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(deadline).getTime() - new Date().getTime();
      if (diff <= 0) return setTimeLeft("TIME EXPIRED");

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${mins}m ${secs}s`);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 animate-in fade-in duration-500">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
      <span className="text-[11px] font-black text-white uppercase tracking-widest tabular-nums">
        {timeLeft}
      </span>
    </div>
  );
};

const ChallengesView: React.FC<{ searchQuery: string; user: UserProfile }> = ({
  searchQuery,
  user,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [acceptances, setAcceptances] = useState<any[]>([]);
  const [latestSubmission, setLatestSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [newChallenge, setNewChallenge] = useState<Partial<Challenge>>({
    title: "",
    description: "",
    difficulty: "Intermediate",
    points: 100,
    duration_days: 7,
  });

  const isAdmin = user.role === "admin";

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        const [challs, accs, latest] = await Promise.all([
          db.getChallenges(),
          db.getStudentAcceptances(user.id),
          db.getLatestStudentSubmission(user.id),
        ]);
        setChallenges(challs);
        setAcceptances(accs);
        setLatestSubmission(latest);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [user.id],
  );

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("missions_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges" },
        () => fetchData(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mission_acceptances" },
        () => fetchData(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => fetchData(true),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleAccept = async (challenge: Challenge) => {
    setProcessingId(challenge.id);
    try {
      await db.acceptMission(
        user.id,
        challenge.id,
        challenge.duration_days || 7,
      );
      showToast("Mission Node Activated! 🎯");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReAttempt = async (acceptanceId: string) => {
    setProcessingId(acceptanceId);
    try {
      await db.reOpenMission(acceptanceId);
      showToast("Re-attempt protocol initiated. 🚀");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmit = async (acceptanceId: string) => {
    if (!submissionUrl.trim()) return showToast("URL Required.", "error");
    setProcessingId(acceptanceId);
    try {
      await db.submitMissionOutput(acceptanceId, user.id, submissionUrl.trim());
      showToast("Artifact Dispatched! 🚀");
      setSubmissionUrl("");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId("creating");
    try {
      await db.createChallenge(newChallenge);
      showToast("New Mission Deployed! 🍇");
      setShowCreateModal(false);
      setNewChallenge({
        title: "",
        description: "",
        difficulty: "Intermediate",
        points: 100,
        duration_days: 7,
      });
      await fetchData(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!window.confirm("Permanently purge this mission from the ecosystem?"))
      return;
    try {
      await db.deleteChallenge(id);
      showToast("Mission Purged.");
      await fetchData(true);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const filtered = challenges.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="py-40 text-center animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-[#790BFD] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-[10px] font-black text-[#790BFD] uppercase tracking-widest">
          Syncing Missions...
        </p>
      </div>
    );

  return (
    <div className="space-y-10 pb-40 max-w-7xl mx-auto px-4 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 rounded-full border shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 backdrop-blur-3xl ${
            toast.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <span className="text-[11px] font-black uppercase tracking-widest">
            {toast.message}
          </span>
        </div>
      )}

      {/* Header */}
      <header className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1D1E2A] via-[#12131B] to-[#0B0C12] p-8 md:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#790BFD]/20 blur-[120px]"></div>
        <div className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full bg-emerald-500/10 blur-[120px]"></div>

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Missions
            </h1>
            <p className="mt-2 text-[#A1A1B3] font-black text-[10px] uppercase tracking-[0.35em] opacity-70">
              {isAdmin
                ? "System Protocol Administration"
                : "Active Operational Hub"}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-7 py-4 bg-gradient-to-r from-[#790BFD] to-fuchsia-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:brightness-110 active:scale-95 transition-all"
            >
              Create Mission +
            </button>
          )}
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((c) => {
          const acceptance = acceptances.find((a) => a.mission_id === c.id);
          const isAccepted = !!acceptance;
          const status = acceptance?.status || "available";
          const submission =
            latestSubmission?.mission_acceptance_id === acceptance?.id
              ? latestSubmission
              : null;

          const statusChip =
            status === "available"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
              : status === "in_progress"
                ? "bg-sky-500/10 text-sky-300 border-sky-400/20"
                : status === "submitted"
                  ? "bg-amber-500/10 text-amber-300 border-amber-400/20"
                  : status === "reviewed" &&
                      submission?.review_status === "accepted"
                    ? "bg-violet-500/10 text-violet-300 border-violet-400/20"
                    : status === "reviewed" &&
                        submission?.review_status === "rejected"
                      ? "bg-rose-500/10 text-rose-300 border-rose-400/20"
                      : "bg-white/5 text-white/60 border-white/10";

          const diff = (c.difficulty || "").toLowerCase();
          const diffClass =
            diff === "beginner"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
              : diff === "intermediate"
                ? "bg-sky-500/10 text-sky-300 border-sky-400/20"
                : diff === "advanced" || diff === "pro"
                  ? "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-400/20"
                  : "bg-white/5 text-white/60 border-white/10";

          return (
            <div
              key={c.id}
              className={`relative overflow-hidden flex flex-col justify-between rounded-[32px] p-8 border shadow-2xl transition-all duration-300
              bg-gradient-to-br from-[#1E1F2A] via-[#141522] to-[#10111A] border-white/10
              hover:shadow-[0_0_60px_rgba(121,11,253,0.18)]
              ${isAccepted ? "ring-1 ring-sky-500/25" : "hover:ring-1 hover:ring-[#790BFD]/30"}
              `}
            >
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#790BFD]/15 blur-[110px]"></div>
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-[110px]"></div>

              <div className="relative z-10">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {status === "available" ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"></span>
                        </span>
                      </div>
                    ) : status === "reviewed" && submission?.review_status === "rejected" ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-400/20 bg-rose-500/5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]"></span>
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">
                          Deactivated
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusChip}`}
                      >
                        {status.replace("_", " ")}
                      </span>
                    )}

                    <span
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${diffClass}`}
                    >
                      {c.difficulty}
                    </span>

                    <div className="px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold text-emerald-300">
                        {c.points} ⭐
                      </span>
                    </div>

                    <div className="px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-semibold text-amber-300">
                        {c.duration_days ?? 7}d
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteChallenge(c.id)}
                      className="w-9 h-9 flex items-center justify-center bg-red-500/10 text-red-300 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                      aria-label="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <h3 className="mt-6 text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight group-hover:text-[#C6A8FF] transition">
                  {c.title}
                </h3>

                <p className="mt-3 text-sm font-medium text-white/65 leading-relaxed">
                  {c.description}
                </p>

                <div className="mt-6 space-y-5">
                  {status === "in_progress" && acceptance && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <CountdownTimer deadline={acceptance.deadline_at} />

                      <div className="bg-white/5 p-6 rounded-3xl border border-sky-500/20">
                        <label className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-3 block">
                          Artifact URL
                        </label>
                        <input
                          type="url"
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                          placeholder="https://your-project.com"
                          className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white font-semibold text-sm outline-none focus:border-sky-400/60"
                        />
                      </div>
                    </div>
                  )}

                  {status === "submitted" && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl text-center space-y-3 animate-in fade-in duration-500">
                      <span className="text-3xl block animate-pulse">📡</span>
                      <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                        Pending Review
                      </p>
                      {submission && (
                        <a
                          href={submission.output_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-sky-300 hover:underline block truncate"
                        >
                          View Sent Artifact ↗
                        </a>
                      )}
                    </div>
                  )}

                  {status === "reviewed" && submission && (
                    <div
                      className={`p-6 rounded-3xl text-center space-y-3 border animate-in fade-in duration-500 ${
                        submission.review_status === "accepted"
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      <span className="text-3xl block">
                        {submission.review_status === "accepted" ? "🏆" : "❌"}
                      </span>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          submission.review_status === "accepted"
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {submission.review_status}
                      </p>
                      {submission.feedback && (
                        <p className="text-[11px] font-semibold text-white/60 italic leading-tight px-4">
                          “{submission.feedback}”
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10 pt-8">
                {status === "available" && !isAdmin && (
                  <button
                    onClick={() => handleAccept(c)}
                    disabled={processingId === c.id}
                    className="w-full py-5 bg-gradient-to-r from-[#790BFD] to-fuchsia-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.35em] shadow-xl hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {processingId === c.id
                      ? "Initializing..."
                      : "Accept Mission"}
                  </button>
                )}

                {status === "in_progress" && (
                  <button
                    onClick={() => handleSubmit(acceptance.id)}
                    disabled={processingId === acceptance.id || !submissionUrl}
                    className="w-full py-5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.35em] shadow-xl hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {processingId === acceptance.id
                      ? "Dispatching..."
                      : "Dispatch Artifact"}
                  </button>
                )}

                {status === "reviewed" &&
                  submission?.review_status === "rejected" &&
                  !isAdmin && (
                    <button
                      onClick={() => handleReAttempt(acceptance.id)}
                      disabled={processingId === acceptance.id}
                      className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.35em] shadow-xl hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {processingId === acceptance.id
                        ? "Resetting..."
                        : "Initiate Re-attempt"}
                    </button>
                  )}

                {isAdmin && (
                  <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                      Admin Monitoring Mode
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mission Architect Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-gradient-to-br from-[#1E1F2A] via-[#151622] to-[#0F1018] border border-white/10 rounded-[44px] max-w-2xl w-full p-10 md:p-14 shadow-2xl animate-in zoom-in-95 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#790BFD]/15 blur-[120px] rounded-full -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full -ml-40 -mb-40"></div>

            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 text-center">
              Mission Architect
            </h2>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.45em] text-center mb-10">
              Deploying new operational protocols
            </p>

            <form onSubmit={handleCreateChallenge} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#C6A8FF] uppercase tracking-widest px-2">
                  Mission Title
                </label>
                <input
                  required
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) =>
                    setNewChallenge({ ...newChallenge, title: e.target.value })
                  }
                  placeholder="e.g. Neural Network Basics"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white font-semibold outline-none focus:border-[#790BFD]/60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-2">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={newChallenge.description}
                  onChange={(e) =>
                    setNewChallenge({
                      ...newChallenge,
                      description: e.target.value,
                    })
                  }
                  placeholder="Project objectives and constraints..."
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white font-semibold outline-none focus:border-[#790BFD]/60"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-2">
                    Difficulty
                  </label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        difficulty: e.target.value as ChallengeDifficulty,
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-4 text-white font-semibold appearance-none text-center outline-none focus:border-[#790BFD]/60"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest px-2">
                    Yield (Stars)
                  </label>
                  <input
                    required
                    type="number"
                    value={newChallenge.points}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        points: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-4 text-white font-semibold text-center outline-none focus:border-emerald-400/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-amber-300 uppercase tracking-widest px-2">
                    Window (Days)
                  </label>
                  <input
                    required
                    type="number"
                    value={newChallenge.duration_days}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        duration_days: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-4 text-white font-semibold text-center outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processingId === "creating"}
                className="w-full py-5 bg-gradient-to-r from-[#790BFD] to-fuchsia-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.45em] shadow-2xl hover:brightness-110 transition-all disabled:opacity-50"
              >
                {processingId === "creating"
                  ? "Synchronizing Node..."
                  : "Deploy Protocol 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengesView;
