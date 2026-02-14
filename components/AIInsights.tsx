
import React, { useEffect, useState } from 'react';
import { getAIInsights } from '../services/gemini';
import { Insight } from '../types';
import { MOCK_METRICS } from '../constants';

const CACHE_KEY = 'gr_hub_ai_insights_v2';
const COOLDOWN_KEY = 'gr_hub_ai_cooldown_v2';
const CACHE_EXPIRY = 30 * 60 * 1000;

const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setInsights(data);
          setLastSync(timestamp);
        }
      } catch (e) {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  const fetchInsights = async () => {
    const now = Date.now();
    const cooldown = sessionStorage.getItem(COOLDOWN_KEY);
    if (cooldown && now - parseInt(cooldown) < 30000) {
      setError("System recalibrating. Wait 30s.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getAIInsights(MOCK_METRICS);
      setInsights(result);
      const timestamp = Date.now();
      setLastSync(timestamp);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp }));
      sessionStorage.setItem(COOLDOWN_KEY, timestamp.toString());
    } catch (err) {
      setError("AI Node connection failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#181922] p-12 rounded-[56px] border border-[#232435] h-full flex flex-col shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#790BFD]/10 blur-[120px] rounded-full -mr-40 -mt-40 transition-all duration-1000 group-hover:scale-125"></div>
      
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-[28px] border-2 transition-all shadow-2xl ${loading ? 'bg-[#790BFD] animate-pulse border-white/20' : 'bg-[#790BFD]/20 border-[#790BFD]/30 shadow-[#790BFD]/20'}`}>
            <svg className={`w-8 h-8 ${loading ? 'text-white' : 'text-[#790BFD]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter">Gemini Core</h3>
            <p className="text-[10px] font-black text-[#A1A1B3] uppercase tracking-[0.4em] mt-1">
              {lastSync ? `Active Node: ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Neural Link Required'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-8 relative z-10 overflow-y-auto pr-4 custom-scrollbar">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div key={idx} className="relative pl-10 border-l-2 border-[#232435] hover:border-[#790BFD] transition-all group/insight pb-4">
              <div className={`absolute -left-[7px] top-0 h-3.5 w-3.5 rounded-full shadow-[0_0_15px_rgba(121,11,253,0.5)] transition-all group-hover/insight:scale-125 ${
                  insight.severity === 'high' ? 'bg-[#FF4D4D] shadow-[#FF4D4D]' : 'bg-[#790BFD]'
              }`} />
              <div className="mb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#790BFD] mb-2">{insight.category}</h4>
                 <p className="text-lg text-white font-bold leading-snug">{insight.summary}</p>
              </div>
              <div className="bg-[#0E0E17] p-6 rounded-[32px] border border-[#232435] group-hover/insight:border-[#790BFD]/40 transition-all shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-1.5 h-1.5 bg-[#3DD598] rounded-full"></div>
                   <span className="text-[9px] font-black text-[#3DD598] uppercase tracking-widest">Protocol Action</span>
                </div>
                <p className="text-xs font-bold text-[#A1A1B3] leading-relaxed italic">{insight.action}</p>
              </div>
            </div>
          ))
        ) : !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-8 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-default">🧠</div>
            <p className="text-[11px] font-black text-[#4C4D5E] uppercase tracking-[0.5em] max-w-[240px] leading-relaxed">
              Initiate neural sync to generate real-time ecosystem insights.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-3 w-32 bg-[#232435] rounded-full"></div>
                <div className="h-6 w-full bg-[#232435] rounded-full"></div>
                <div className="h-20 w-full bg-[#0E0E17] rounded-[32px]"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 relative z-10 pt-8 border-t border-[#232435]">
        {error && (
          <div className="mb-6 p-5 bg-red-400/10 border-2 border-red-400/20 rounded-[28px] text-[10px] font-black text-red-400 uppercase tracking-widest text-center animate-in zoom-in-95">
            {error}
          </div>
        )}
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className={`w-full py-7 rounded-[40px] text-[11px] font-black uppercase tracking-[0.5em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 ${
            loading 
              ? 'bg-[#232435] text-[#4C4D5E] cursor-not-allowed' 
              : 'bg-[#790BFD] text-white shadow-[#790BFD]/30 hover:bg-[#8d2dfd] hover:-translate-y-2 border-2 border-white/10'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Neural Sync
            </>
          )}
        </button>
        <p className="text-center text-[9px] font-black text-[#4C4D5E] mt-6 uppercase tracking-[0.4em]">
          Data analyzed by Gemini Flash v3
        </p>
      </div>
    </div>
  );
};

export default AIInsights;
