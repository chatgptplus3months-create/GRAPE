
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabase';
import { Event, UserProfile } from '../types';

const EventsView: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [checkInLink, setCheckInLink] = useState('');
  const [checkInProof, setCheckInProof] = useState('');

  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    time: '11:00 AM', 
    type: 'Workshop', 
    location: 'Digital Hub Lab' 
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setNewEvent({ title: '', time: '11:00 AM', type: 'Workshop', location: 'Digital Hub Lab' });
    setShowAddModal(false);
    setSubmitting(false);
  };

  const isAdmin = user.role === 'admin' || user.skill_level === 'Faculty Lead';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventData, attendanceData] = await Promise.all([
        db.getEvents(),
        db.getEventAttendees()
      ]);
      setEvents(eventData || []);
      setAttendance(attendanceData || []);
    } catch (err: any) { 
      console.error("Hub Sync Error Protocol:", err); 
      setError({ message: err.message, code: err.code || 'HUB_SYNC_FAIL' });
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleJoinEvent = async (eventId: string) => {
    setSubmitting(true);
    try {
      await db.joinEvent(user.id, eventId);
      showToast("Reservation Synced! 🎯 Use the 'Check-In' button later.");
      await fetchData();
    } catch (err: any) {
      showToast("Handshake Error: " + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await db.deleteEvent(id);
      showToast("Session Node Purged Successfully.");
      await fetchData();
    } catch (err: any) {
      showToast("Purge Failure: " + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckInModal) return;
    setSubmitting(true);
    try {
      await db.submitEventAttendance(showCheckInModal, checkInLink, checkInProof);
      showToast("Proof Dispatched! Stars pending verification. 📡");
      setShowCheckInModal(null);
      setCheckInLink('');
      setCheckInProof('');
      await fetchData();
    } catch (err: any) {
      showToast("Check-In Error: " + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return { month: 'TBA', day: '??' };
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { month: 'TBA', day: '??' };
      const monthNamesShort = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return {
        month: monthNamesShort[date.getUTCMonth()],
        day: date.getUTCDate().toString()
      };
    } catch (e) {
      return { month: 'TBA', day: '??' };
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !user) return;
    setSubmitting(true);
    try {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const standardDateString = `${year}-${month}-${day}`;
      
      const payload = { 
        title: newEvent.title,
        time: newEvent.time,
        type: newEvent.type,
        location: newEvent.location,
        event_date: standardDateString,
        color: '#790BFD' 
      };

      await db.createEvent(payload);
      resetForm();
      await fetchData();
      showToast("Session Node Active! 🗓️");
    } catch (err: any) {
      setError({ message: err.message, code: err.code });
      showToast("Failed to create session.", 'error');
    } finally { 
      setSubmitting(false); 
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startOffset = new Date(year, month, 1).getDay();
    const days = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`pad-${i}`} className="h-12 border border-[#232435]/20 bg-[#0E0E17]/30"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const dayEvents = events.filter(e => e.event_date === dateStr);
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

      days.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(new Date(year, month, d))}
          className={`h-12 border border-[#232435]/20 flex flex-col items-center justify-center cursor-pointer transition-colors relative ${isSelected ? 'bg-[#790BFD]/20' : 'hover:bg-[#181922]'}`}
        >
          <span className={`text-[10px] font-black ${isSelected ? 'text-white' : 'text-[#4C4D5E]'}`}>{d}</span>
          {dayEvents.length > 0 && (
            <div className="absolute bottom-1 flex gap-0.5">
              {dayEvents.slice(0, 3).map((e, idx) => (
                <div key={idx} className="w-1 h-1 rounded-full bg-[#790BFD]"></div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  if (loading && events.length === 0) return <div className="py-24 text-center text-[#790BFD] font-black animate-pulse uppercase tracking-widest text-xs">Synchronizing Calendar Node...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded-3xl border shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[#3DD598]/10 border-[#3DD598]/30 text-[#3DD598]'
        }`}>
          <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Event Horizon</h1>
          <p className="text-[#A1A1B3] font-bold">Workshops, meetups, and ecosystem sync events.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-4 bg-[#790BFD] text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            Deploy Session +
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#181922] p-8 rounded-[40px] border border-[#232435] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-[#0E0E17] rounded-xl transition-colors">←</button>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-[#0E0E17] rounded-xl transition-colors">→</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-[#232435]/20 rounded-2xl overflow-hidden border border-[#232435]/20">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="h-8 flex items-center justify-center text-[9px] font-black text-[#4C4D5E] bg-[#0E0E17]">{d}</div>
              ))}
              {renderCalendar()}
            </div>
          </div>
          
          <div className="bg-[#0E0E17] p-8 rounded-[40px] border border-[#232435]/50">
             <h4 className="text-[10px] font-black text-[#790BFD] uppercase tracking-[0.2em] mb-4">Sync Legend</h4>
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#790BFD]"></div>
                   <span className="text-[9px] font-black text-[#A1A1B3] uppercase tracking-widest">Hub Workshop</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#3DD598]"></div>
                   <span className="text-[9px] font-black text-[#A1A1B3] uppercase tracking-widest">Verified Attendance</span>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 gap-6">
              {events.length > 0 ? events.map(event => {
                const dateParts = formatEventDate(event.event_date);
                const sub = attendance.find(a => a.challenge_id === event.id && a.student_id === user.id);
                
                return (
                  <div key={event.id} className="bg-[#181922] p-8 rounded-[48px] border border-[#232435] hover:border-[#790BFD]/30 transition-all flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                     {isAdmin && (
                       <button 
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="absolute top-6 right-6 p-3 bg-[#0E0E17] rounded-xl text-[#4C4D5E] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         🗑️
                       </button>
                     )}
                     
                     <div className="flex flex-col items-center justify-center w-24 h-24 bg-[#0E0E17] rounded-[32px] border border-[#232435] shrink-0 shadow-inner group-hover:border-[#790BFD]/30 transition-colors">
                        <span className="text-[10px] font-black text-[#790BFD] uppercase tracking-widest">{dateParts.month}</span>
                        <span className="text-3xl font-black text-white tracking-tighter">{dateParts.day}</span>
                     </div>

                     <div className="flex-1 text-center md:text-left">
                        <span className="px-3 py-1 bg-[#790BFD]/10 text-[#790BFD] rounded-full text-[8px] font-black uppercase tracking-widest border border-[#790BFD]/20 mb-2 inline-block">{event.type}</span>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2 leading-tight">{event.title}</h4>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                           <div className="flex items-center gap-2">
                              <span className="text-lg">⏰</span>
                              <span className="text-[10px] font-bold text-[#A1A1B3] uppercase tracking-widest">{event.time}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-lg">📍</span>
                              <span className="text-[10px] font-bold text-[#A1A1B3] uppercase tracking-widest">{event.location}</span>
                           </div>
                        </div>
                     </div>

                     {!isAdmin && (
                       <div className="shrink-0 w-full md:w-auto">
                          {sub ? (
                            sub.status === 'event_joined' ? (
                              <button 
                                onClick={() => setShowCheckInModal(sub.id)}
                                className="w-full md:w-auto px-10 py-5 bg-[#3DD598]/10 text-[#3DD598] border border-[#3DD598]/30 rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-[#3DD598] hover:text-white transition-all shadow-xl"
                              >
                                Check-In Node 🎯
                              </button>
                            ) : (
                              <div className="px-10 py-5 bg-[#0E0E17] border border-[#232435] rounded-[28px] text-[#4C4D5E] font-black text-[10px] uppercase tracking-widest text-center">
                                {sub.status === 'event_pending' ? 'Verification Pending...' : 'Presence Verified ✅'}
                              </div>
                            )
                          ) : (
                            <button 
                              onClick={() => handleJoinEvent(event.id)}
                              disabled={submitting}
                              className="w-full md:w-auto px-12 py-5 bg-[#790BFD] text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#790BFD]/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              Reserve Slot 🚀
                            </button>
                          )}
                       </div>
                     )}
                  </div>
                );
              }) : (
                <div className="py-24 text-center bg-[#0E0E17] border-2 border-dashed border-[#232435] rounded-[48px] opacity-40">
                   <span className="text-4xl block mb-4">🛸</span>
                   <p className="text-[10px] font-black text-[#A1A1B3] uppercase tracking-[0.3em]">No Session Nodes Detected</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-[#181922] border border-[#232435] rounded-[56px] max-w-lg w-full p-12 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <h2 className="text-3xl font-black text-white text-center uppercase tracking-tighter mb-8">Deploy Session</h2>
              <form onSubmit={handleSaveEvent} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest px-1">Session Title</label>
                    <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-[#0E0E17] border border-[#232435] rounded-2xl py-5 px-8 text-white font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest px-1">Sync Time</label>
                      <input required type="text" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full bg-[#0E0E17] border border-[#232435] rounded-2xl py-5 px-8 text-white font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest px-1">Node Type</label>
                      <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="w-full bg-[#0E0E17] border border-[#232435] rounded-2xl py-5 px-8 text-white font-bold appearance-none">
                        <option>Workshop</option>
                        <option>Meetup</option>
                        <option>Hardware Lab</option>
                      </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest px-1">Network Location</label>
                    <input required type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full bg-[#0E0E17] border border-[#232435] rounded-2xl py-5 px-8 text-white font-bold" />
                 </div>
                 <button type="submit" disabled={submitting} className="w-full py-6 bg-[#790BFD] text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl">
                   {submitting ? 'Deploying...' : 'Initiate Session 🚀'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showCheckInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowCheckInModal(null)}>
           <div className="bg-[#181922] border border-[#232435] rounded-[56px] max-w-lg w-full p-12 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <h2 className="text-3xl font-black text-white text-center uppercase tracking-tighter mb-4">Node Check-In</h2>
              <p className="text-[#A1A1B3] text-center font-bold text-sm mb-10 uppercase tracking-widest">Provide proof of presence to earn Stars.</p>
              <form onSubmit={handleCheckIn} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest px-1">Observation Note</label>
                    <input required type="text" placeholder="What did you learn?" value={checkInLink} onChange={e => setCheckInLink(e.target.value)} className="w-full bg-[#0E0E17] border border-[#232435] rounded-2xl py-5 px-8 text-white font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest px-1">Visual Proof (URL)</label>
                    <input required type="url" placeholder="Screenshot or Photo Link" value={checkInProof} onChange={e => setCheckInProof(e.target.value)} className="w-full bg-[#0E0E17] border border-[#232435] rounded-2xl py-5 px-8 text-white font-bold" />
                 </div>
                 <button type="submit" disabled={submitting} className="w-full py-6 bg-[#3DD598] text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl">
                   {submitting ? 'Verifying...' : 'Finalize Check-In ✅'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setConfirmDeleteId(null)}>
           <div className="bg-[#181922] border border-red-500/30 rounded-[48px] max-w-md w-full p-12 text-center shadow-2xl">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Purge Session?</h2>
              <p className="text-[#A1A1B3] font-bold mb-10 text-sm uppercase tracking-widest">This action is irreversible and removes all RSVPs.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleDeleteEvent} className="w-full py-5 bg-red-500 text-white font-black rounded-3xl uppercase text-xs tracking-widest">Confirm Purge</button>
                 <button onClick={() => setConfirmDeleteId(null)} className="w-full py-5 text-[10px] font-black text-[#4C4D5E] uppercase tracking-widest">Abort</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventsView;
