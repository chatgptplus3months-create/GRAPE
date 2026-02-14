import React, { useState, useEffect, useCallback } from "react";
import { db, AVAILABLE_BADGES, supabase } from "../services/supabase";
import { UserProfile, Badge, Submission } from "../types";

interface StudentsViewProps {
  searchQuery: string;
  user: UserProfile;
}

const StudentsView: React.FC<StudentsViewProps> = ({
  searchQuery,
  user: currentUser,
}) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(
    null,
  );
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [provisionError, setProvisionError] = useState<{
    message: string;
  } | null>(null);
  const [provisionData, setProvisionData] = useState({
    email: "",
    name: "",
    grade: "Grade 8",
    initialStars: 0,
    password: "123456",
  });
  const [processing, setProcessing] = useState(false);

  const isAdmin = currentUser.role === "admin";

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [s, subs] = await Promise.all([
        db.getLeaderboard(),
        db.getSubmissions(),
      ]);
      setStudents(s ?? []);
      setAllSubmissions(subs ?? []);
    } catch (err) {
      console.error(err);
      showToast("Telemetry Sync Error.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("elite_hof_sync_v25")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => loadData(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => loadData(true),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleIssueAward = async (badgeId: string) => {
    if (!viewingStudent) return;
    setProcessing(true);
    try {
      const success = await db.awardBadge(viewingStudent.id, badgeId);
      if (success) {
        showToast(
          `Recognition verified for ${viewingStudent.name}!`,
          "success",
        );
        await loadData(true);
        setViewingStudent(null);
      }
    } catch (err) {
      showToast("Award protocol failure.", "error");
    } finally {
      setProcessing(false);
      setShowAwardModal(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError(null);
    setProcessing(true);
    try {
      await db.provisionStudent(
        provisionData.email,
        provisionData.name,
        provisionData.grade,
        provisionData.initialStars,
        provisionData.password,
      );
      showToast(`Node ${provisionData.name} initialized.`, "success");
      setProvisionData({
        email: "",
        name: "",
        grade: "Grade 8",
        initialStars: 0,
        password: "123456",
      });
      setShowProvisionModal(false);
      await loadData(true);
    } catch (err: any) {
      setProvisionError({ message: err.message || "Deployment Failed" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!viewingStudent) return;
    setProcessing(true);
    try {
      await db.deleteProfile(viewingStudent.id);
      showToast("Node purged from ecosystem.");
      setViewingStudent(null);
      setShowConfirmDelete(false);
      await loadData(true);
    } catch (err: any) {
      showToast("Removal Error: " + (err.message || "Conflict"), "error");
    } finally {
      setProcessing(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading && students.length === 0)
    return (
      <div className="py-40 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#790BFD] border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(121,11,253,0.2)]"></div>
        <p className="text-[#790BFD] font-black uppercase tracking-[0.6em] text-[10px] animate-pulse">
          Scanning Registry...
        </p>
      </div>
    );

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32 max-w-[1440px] mx-auto px-4">
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000] px-10 py-5 bg-[#181922]/90 border border-white/10 rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-in slide-in-from-bottom-12 backdrop-blur-3xl">
          <div
            className={`w-2.5 h-2.5 rounded-full ${toast.type === "error" ? "bg-red-500" : "bg-[#3DD598]"} animate-pulse`}
          ></div>
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
            {toast.message}
          </span>
        </div>
      )}

      {/* Hero Header */}
      <header className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-20">
        <div className="space-y-2">
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">
            Hall{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#790BFD] to-[#3DD598]">
              of Fame
            </span>
          </h1>
          <p className="text-[#A1A1B3] font-black text-[11px] uppercase tracking-[0.8em] opacity-40">
            Elite operational registry
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowProvisionModal(true)}
            className="px-12 py-6 bg-[#790BFD] text-white font-black rounded-[32px] uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-[#8d2dfd] active:scale-95 transition-all border border-white/10"
          >
            Deploy Node +
          </button>
        )}
      </header>

      {/* Grid Headers */}
      <div className="hidden lg:grid grid-cols-12 gap-8 px-16 mb-6 opacity-30">
        <div className="col-span-1 text-[10px] font-black uppercase tracking-[0.4em]">
          Rank
        </div>
        <div className="col-span-4 text-[10px] font-black uppercase tracking-[0.4em]">
          Identity Node
        </div>
        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-[0.4em]">
          Yield
        </div>
        <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-[0.4em]">
          Missions
        </div>
        <div className="col-span-3 text-right text-[10px] font-black uppercase tracking-[0.4em]">
          Status
        </div>
      </div>

      {/* Horizontal List of Members */}
      <div className="space-y-4">
        {filtered.map((s, idx) => {
          const isTop3 = idx < 3;
          const sub = allSubmissions.find(
            (sub) =>
              sub.student_id === s.id &&
              (sub.status === "pending" || sub.status === "event_pending"),
          );
          const isActive = s.points > 0 || !!sub;

          let statusText = "Standby";
          let statusColor = "text-[#4C4D5E]";
          let dotColor = "bg-[#4C4D5E]";

          if (sub) {
            statusText = "Sync Pending";
            statusColor = "text-amber-400";
            dotColor = "bg-amber-400";
          } else if (isActive) {
            statusText = "Active Node";
            statusColor = "text-[#3DD598]";
            dotColor = "bg-[#3DD598]";
          }

          const rankStyle =
            idx === 0
              ? "border-yellow-500/30 bg-yellow-500/5"
              : idx === 1
                ? "border-white/20 bg-white/5"
                : idx === 2
                  ? "border-orange-500/30 bg-orange-500/5"
                  : "border-white/5 bg-white/[0.02]";
          const rankText =
            idx === 0
              ? "text-yellow-500"
              : idx === 1
                ? "text-gray-300"
                : idx === 2
                  ? "text-orange-400"
                  : "text-[#232435]";

          return (
            <div
              key={s.id}
              className={`group relative w-full rounded-[32px] border border-white/10 
                bg-white/[0.04] backdrop-blur-3xl overflow-hidden
                shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]
                transition-all duration-500
                hover:bg-white/[0.08]
                hover:shadow-[0_30px_80px_-20px_rgba(121,11,253,0.35)]
                hover:-translate-y-1
                ${rankStyle}
              `}
            >
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#790BFD]/10 blur-[120px]" />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 
                bg-gradient-to-r from-[#790BFD]/10 via-transparent to-[#3DD598]/10"
              />

              <div className="relative grid grid-cols-12 items-center gap-6 px-8 py-8">
                {/* LEFT: Rank + Avatar + Identity */}
                <div className="col-span-12 lg:col-span-6 flex items-center gap-5 min-w-0">
                  {/* Rank */}
                  <div className="shrink-0 w-12 text-center">
                    <div className={`text-2xl font-black ${rankText}`}>
                      #{idx + 1}
                    </div>
                  </div>

                  {/* Avatar + dot */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        s.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`
                      }
                      className={`w-14 h-14 rounded-2xl border bg-[#0E0E17] ${idx === 0 ? "border-yellow-500/40" : "border-white/10"}`}
                      alt=""
                    />
                    {/* status dot */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[5px] border-[#0E0E17] bg-black/40 flex items-center justify-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${dotColor} ${isActive ? "shadow-[0_0_12px_currentColor]" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight truncate">
                      {s.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                      <span className="text-[#790BFD]">
                        {s.skill_level || "Member Node"}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <span className="text-white/35">{s.class_name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <span className={`${statusColor}`}>{statusText}</span>
                    </div>
                  </div>
                </div>

                {/* MIDDLE: Scores */}
                <div className="col-span-12 lg:col-span-4 flex items-center justify-start lg:justify-center gap-8 border-t border-white/5 pt-4 lg:pt-0 lg:border-t-0">
                  <div className="text-left lg:text-center">
                    <p className="text-[9px] font-black text-white/35 uppercase tracking-[0.35em]">
                      Yield
                    </p>
                    <div className="mt-1 text-xl font-black text-white tabular-nums">
                      {s.points} <span className="text-amber-300">⭐</span>
                    </div>
                  </div>

                  <div className="w-px h-10 bg-white/10 hidden lg:block" />

                  <div className="text-left lg:text-center">
                    <p className="text-[9px] font-black text-white/35 uppercase tracking-[0.35em]">
                      Missions
                    </p>
                    <div className="mt-1 text-xl font-black text-white tabular-nums">
                      {s.completed_challenges || 0}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="col-span-12 lg:col-span-2 flex items-center justify-end gap-3 border-t border-white/5 pt-4 lg:pt-0 lg:border-t-0">
                  {!isAdmin ? null : (
                    <>
                      <button
                        onClick={() => {
                          setViewingStudent(s);
                          setShowAwardModal(true);
                        }}
                        className="px-5 py-3 rounded-2xl bg-[#790BFD] text-white font-black text-[10px] uppercase tracking-[0.25em]
                                   hover:bg-[#8d2dfd] transition border border-white/10"
                      >
                        Award
                      </button>

                      <button
                        onClick={() => {
                          setViewingStudent(s);
                          setShowConfirmDelete(true);
                        }}
                        className="w-11 h-11 rounded-2xl bg-white/5 text-white/40 border border-white/10
                                   hover:bg-red-500 hover:text-white hover:border-red-500/40 transition"
                        aria-label="Delete member"
                        title="Delete member"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provision Modal */}
      {showProvisionModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#0E0E17]/95 backdrop-blur-3xl animate-in fade-in"
          onClick={() => setShowProvisionModal(false)}
        >
          <div
            className="bg-[#181922]/90 border border-white/10 rounded-[64px] max-w-lg w-full p-12 md:p-16 shadow-[0_100px_200px_rgba(0,0,0,0.8)] animate-in zoom-in-95 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4 text-center leading-none">
              Initialize
            </h2>
            <form onSubmit={handleProvision} className="space-y-6 mt-12">
              {provisionError && (
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-500 text-[11px] font-black uppercase text-center">
                  {provisionError.message}
                </div>
              )}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-[#790BFD] uppercase tracking-[0.4em] px-8">
                  Identity Email
                </label>
                <input
                  required
                  type="email"
                  value={provisionData.email}
                  onChange={(e) =>
                    setProvisionData({
                      ...provisionData,
                      email: e.target.value,
                    })
                  }
                  placeholder="id@grape-hub.com"
                  className="w-full bg-[#0E0E17] border border-white/10 rounded-[32px] py-7 px-10 text-white font-bold outline-none focus:border-[#790BFD] shadow-inner placeholder:opacity-20"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-[#4C4D5E] uppercase tracking-[0.4em] px-8">
                  Alias
                </label>
                <input
                  required
                  type="text"
                  value={provisionData.name}
                  onChange={(e) =>
                    setProvisionData({ ...provisionData, name: e.target.value })
                  }
                  placeholder="Human Name"
                  className="w-full bg-[#0E0E17] border border-white/10 rounded-[32px] py-7 px-10 text-white font-bold outline-none focus:border-[#790BFD]"
                />
              </div>
              <button
                type="submit"
                disabled={processing}
                className="w-full py-8 bg-[#790BFD] text-white rounded-[40px] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-[#8d2dfd] transition-all mt-8 border border-white/10"
              >
                {processing ? "Connecting..." : "Deploy Protocol"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Award Modal */}
      {showAwardModal && viewingStudent && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#0E0E17]/98 backdrop-blur-3xl animate-in fade-in"
          onClick={() => setShowAwardModal(false)}
        >
          <div
            className="bg-[#181922]/90 border border-white/10 rounded-[64px] max-w-2xl w-full p-16 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-5xl font-black text-white text-center uppercase tracking-tighter mb-4">
              Recognize
            </h2>
            <p className="text-center text-[#4C4D5E] text-[11px] font-black uppercase tracking-[0.6em] mb-16">
              Assigning merit to node {viewingStudent.name.split(" ")[0]}
            </p>

            <div className="grid grid-cols-3 gap-8 relative z-10">
              {AVAILABLE_BADGES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleIssueAward(b.id)}
                  className="aspect-square bg-[#0E0E17] border border-white/10 rounded-[48px] flex flex-col items-center justify-center gap-6 hover:border-[#790BFD] hover:bg-white/5 transition-all group hover:scale-105"
                >
                  <span className="text-7xl group-hover:scale-125 transition-transform duration-500">
                    {b.icon}
                  </span>
                  <span className="text-[11px] font-black text-[#4C4D5E] uppercase tracking-[0.4em] group-hover:text-white">
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDelete && viewingStudent && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in"
          onClick={() => setShowConfirmDelete(false)}
        >
          <div
            className="w-full max-w-xl rounded-[44px] border border-white/10 bg-[#181922]/90 p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              Remove Member?
            </h3>

            <p className="mt-4 text-center text-white/60 font-semibold">
              This will permanently remove{" "}
              <span className="text-white font-black">
                {viewingStudent.name}
              </span>
              .
            </p>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-4 rounded-2xl border border-white/10 bg-white/5 text-white/70 font-black uppercase tracking-[0.25em] text-[10px]
                           hover:bg-white/10 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteStudent}
                disabled={processing}
                className="flex-1 py-4 rounded-2xl border border-red-500/25 bg-red-500/15 text-red-200 font-black uppercase tracking-[0.25em] text-[10px]
                           hover:bg-red-500 hover:text-white transition disabled:opacity-50"
              >
                {processing ? "Removing..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsView;
