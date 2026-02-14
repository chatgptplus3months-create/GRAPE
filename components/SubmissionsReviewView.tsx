
import React, { useState, useEffect, useCallback } from 'react';
import { db, supabase } from '../services/supabase';
import { Submission, UserProfile } from '../types';

const SubmissionsReviewView: React.FC<{ searchQuery: string, user: UserProfile }> = ({ searchQuery, user }) => {
  const [queue, setQueue] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('Outstanding artifact. Hub merit verified.');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchQueue = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await db.getGradingQueue();
      console.log("DEBUG: Fetched Grading Queue:", data);
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const channel = supabase.channel('grading_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchQueue(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_acceptances' }, () => fetchQueue(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchQueue]);

  const handleGrade = async (sub: any, status: 'accepted' | 'rejected') => {
    setProcessingId(sub.id);
    try {
      await db.gradeSubmission(sub.id, sub.mission_acceptance_id, status, feedback, user.id);
      showToast(status === 'accepted' ? "Merit Verified! ⭐" : "Artifact Rejected.");
      setFeedback('Outstanding artifact. Hub merit verified.');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = queue.filter(s =>
    (s.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.challenge_title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="py-40 text-center">
      <div className="w-12 h-12 border-4 border-[#790BFD] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-[10px] font-black text-[#790BFD] uppercase tracking-widest">Accessing Audit Records...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in pb-40 max-w-7xl mx-auto px-4 relative">
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] px-8 py-4 rounded-full border shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 backdrop-blur-3xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[#3DD598]/10 border-[#3DD598]/30 text-[#3DD598]'
          }`}>
          <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#232435] pb-10">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Grading Desk</h1>
          <p className="text-[#A1A1B3] font-black text-[10px] uppercase tracking-[0.4em] opacity-60">Ecosystem Merit Verification Hub</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setDiagnosticMode(!diagnosticMode)}
            className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${diagnosticMode ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-[#181922] border-[#232435] text-[#4C4D5E]'}`}
          >
            {diagnosticMode ? 'Technical Details On' : 'Technical Details Off'}
          </button>
          <button
            onClick={() => fetchQueue()}
            className="p-4 bg-[#181922] border border-[#232435] rounded-2xl text-white hover:text-[#790BFD] transition-colors"
          >
            🔄
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="py-32 text-center opacity-40 border-2 border-dashed border-[#232435] rounded-[64px]">
          <span className="text-7xl block mb-6 animate-pulse">📡</span>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">Queue clear</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A1A1B3]">Waiting for new artifact dispatches...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {filtered.map(sub => (
            <div key={sub.id} className="bg-[#181922] p-12 rounded-[56px] border-2 border-[#232435] shadow-2xl flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h4 className="text-3xl font-black text-white uppercase tracking-tight mb-1">{sub.student_name}</h4>
                    <p className="text-[10px] font-black text-[#790BFD] uppercase tracking-[0.3em]">{sub.challenge_title}</p>
                  </div>
                  <span className="text-[9px] font-black text-[#4C4D5E] uppercase tracking-widest">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </span>
                </div>

                {diagnosticMode && (
                  <div className="mb-8 p-6 bg-[#0E0E17] rounded-3xl border border-amber-500/20 text-[8px] font-mono text-amber-500/60 break-all space-y-1">
                    <p>SUB_ID: {sub.id}</p>
                    <p>ACC_ID: {sub.mission_acceptance_id}</p>
                    <p>STU_ID: {sub.student_id}</p>
                  </div>
                )}

                <a
                  href={sub.output_url}
                  target="_blank"
                  className="block bg-[#0E0E17] border border-blue-500/20 p-8 rounded-[32px] text-blue-400 font-black uppercase text-xs tracking-widest hover:border-blue-500 transition-all mb-8 shadow-inner text-center"
                >
                  Launch Artifact Link ↗
                </a>

                <div className="space-y-3 mb-10">
                  <label className="text-[9px] font-black text-[#4C4D5E] uppercase tracking-widest px-4">Audit Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="w-full bg-[#0E0E17] border border-[#232435] rounded-3xl p-6 text-white font-bold text-xs outline-none focus:border-[#790BFD]"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleGrade(sub, 'rejected')}
                  disabled={processingId === sub.id}
                  className="flex-1 py-6 bg-red-500/10 text-red-500 border border-red-500/30 rounded-[28px] font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleGrade(sub, 'accepted')}
                  disabled={processingId === sub.id}
                  className="flex-[2] py-6 bg-[#3DD598] text-white rounded-[28px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
                >
                  {processingId === sub.id ? 'Grading...' : 'Verify Merit ⭐'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionsReviewView;
