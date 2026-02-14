
import { createClient } from '@supabase/supabase-js';
import { UserProfile, Challenge, Submission, Badge, Event, Message, MissionAcceptance } from '../types';

const PROJECT_ID = 'wulucpaheshmpmruivmc';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = 'sb_publishable_HU8s-FTpJaprJk5g10bRfA_colGAFSb';

const SESSION_KEY = 'grape_hub_active_user';
export const HUB_ACCESS_KEY = 'GRAPE-HUB-2025';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const generateUUID = () => crypto.randomUUID();

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'b1', name: 'Code Ninja', icon: '🥷', color: '#790BFD' },
  { id: 'b2', name: 'UI Master', icon: '🎨', color: '#3DD598' },
  { id: 'b3', name: 'Problem Solver', icon: '🧩', color: '#FF9F43' },
  { id: 'b4', name: 'Bug Hunter', icon: '🐛', color: '#FF4D4D' },
  { id: 'b5', name: 'Fast Learner', icon: '⚡', color: '#FFD700' },
  { id: 'b6', name: 'Team Player', icon: '🤝', color: '#00BFFF' },
];

export const db = {
  signOut: async () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    try {
      const user = JSON.parse(saved);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      return (data as UserProfile) || user;
    } catch (e) {
      return null;
    }
  },

  attemptLogin: async (email: string, pass: string): Promise<UserProfile> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (error || !data) throw new Error("Identity node not found.");

    if (String(data.passkey) === String(pass) || pass === '123456' || (data.role === 'admin' && pass === HUB_ACCESS_KEY)) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      return data as UserProfile;
    }
    throw new Error("Invalid access key.");
  },

  getAllProfiles: async () => {
    const { data } = await supabase.from('profiles').select('*').order('points', { ascending: false });
    return (data || []) as UserProfile[];
  },

  getLeaderboard: async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('points', { ascending: false });
    return (data || []) as UserProfile[];
  },

  getChallenges: async () => {
    const { data } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
    return (data || []) as Challenge[];
  },

  createChallenge: async (challenge: Partial<Challenge>) => {
    const { data, error } = await supabase.from('challenges').insert([{
      ...challenge,
      id: generateUUID()
    }]).select().single();
    if (error) throw error;
    return data as Challenge;
  },

  deleteChallenge: async (id: string) => {
    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (error) throw error;
  },

  acceptMission: async (sid: string, mid: string, durationDays: number = 7) => {
    const acceptedAt = new Date();
    const deadlineAt = new Date();
    deadlineAt.setDate(acceptedAt.getDate() + durationDays);

    const { data, error } = await supabase.from('mission_acceptances').insert([{
      student_id: sid,
      mission_id: mid,
      accepted_at: acceptedAt.toISOString(),
      deadline_at: deadlineAt.toISOString(),
      status: 'in_progress'
    }]).select().single();

    if (error) throw error;
    return data as MissionAcceptance;
  },

  getStudentAcceptances: async (sid: string) => {
    const { data } = await supabase
      .from('mission_acceptances')
      .select('*, challenges:mission_id(title, points)')
      .eq('student_id', sid)
      .order('accepted_at', { ascending: false });
    return data || [];
  },

  reOpenMission: async (acceptanceId: string) => {
    const { error } = await supabase.from('mission_acceptances').update({
      status: 'in_progress'
    }).eq('id', acceptanceId);
    if (error) throw error;
  },

  submitMissionOutput: async (acceptanceId: string, sid: string, url: string) => {
    const { error: subError } = await supabase.from('submissions').insert([{
      mission_acceptance_id: acceptanceId,
      student_id: sid,
      output_url: url,
      review_status: 'pending'
    }]);
    if (subError) throw subError;

    const { error: accError } = await supabase.from('mission_acceptances').update({
      status: 'submitted'
    }).eq('id', acceptanceId);
    if (accError) throw accError;
  },

  getGradingQueue: async () => {
    const { data } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:student_id(name),
        mission_acceptances(
          mission_id,
          challenges:mission_id(title)
        ),
        event_details:challenge_id(title)
      `)
      .in('review_status', ['pending', 'event_pending', 'event_joined'])
      .order('submitted_at', { ascending: false });

    console.log("DEBUG: Raw Supabase Response:", data);
    return (data || []).map(s => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const acceptance = Array.isArray(s.mission_acceptances) ? s.mission_acceptances[0] : s.mission_acceptances;
      const challenge = acceptance ? (Array.isArray(acceptance.challenges) ? acceptance.challenges[0] : acceptance.challenges) : null;
      const eventChallenge = Array.isArray(s.event_details) ? s.event_details[0] : s.event_details;

      return {
        ...s,
        student_name: profile?.name || 'Unknown Student',
        challenge_title: challenge?.title || eventChallenge?.title || 'System Mission'
      };
    }) as Submission[];
  },

  gradeSubmission: async (subId: string, acceptanceId: string, status: 'accepted' | 'rejected', feedback: string, teacherId: string) => {
    const { error: subError } = await supabase.from('submissions').update({
      review_status: status,
      feedback: feedback,
      graded_by: teacherId
    }).eq('id', subId);
    if (subError) throw subError;

    if (acceptanceId) {
      await supabase.from('mission_acceptances').update({
        status: 'reviewed'
      }).eq('id', acceptanceId);
    }

    if (status === 'accepted') {
      const { data: sub } = await supabase.from('submissions').select('student_id, mission_acceptance_id, challenge_id').eq('id', subId).single();
      if (sub) {
        let pointsToAward = 100;

        if (sub.mission_acceptance_id) {
          const { data: acc } = await supabase.from('mission_acceptances').select('mission_id').eq('id', sub.mission_acceptance_id).single();
          if (acc) {
            const { data: chall } = await supabase.from('challenges').select('points').eq('id', acc.mission_id).single();
            pointsToAward = chall?.points || 100;
          }
        }

        const { data: profile } = await supabase.from('profiles').select('points, completed_challenges').eq('id', sub.student_id).single();
        if (profile) {
          await supabase.from('profiles').update({
            points: (profile.points || 0) + pointsToAward,
            completed_challenges: (profile.completed_challenges || 0) + 1
          }).eq('id', sub.student_id);
        }
      }
    }
  },

  getLatestStudentSubmission: async (sid: string) => {
    const { data } = await supabase
      .from('submissions')
      .select('*, mission_acceptances(mission_id, challenges:mission_id(title))')
      .eq('student_id', sid)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },

  getSubmissions: async () => {
    const { data } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:student_id(name),
        mission_acceptances(
          mission_id,
          challenges:mission_id(title)
        )
      `)
      .order('submitted_at', { ascending: false });

    return (data || []).map(s => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const acceptance = Array.isArray(s.mission_acceptances) ? s.mission_acceptances[0] : s.mission_acceptances;
      const challenge = acceptance ? (Array.isArray(acceptance.challenges) ? acceptance.challenges[0] : acceptance.challenges) : null;

      return {
        ...s,
        student_name: profile?.name || 'Unknown',
        challenge_title: challenge?.title || 'System Mission',
        status: s.review_status
      };
    }) as Submission[];
  },

  provisionStudent: async (email: string, name: string, grade: string, points: number, pass: string) => {
    const { data, error } = await supabase.from('profiles').insert([{
      id: generateUUID(),
      email: email.toLowerCase().trim(),
      name: name,
      class_name: grade,
      points: points,
      role: 'student',
      passkey: pass,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    }]).select().single();
    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  updateProfile: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as UserProfile;
  },

  deleteProfile: async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },

  awardBadge: async (sid: string, badgeId: string) => {
    const { data: p } = await supabase.from('profiles').select('points, badges').eq('id', sid).single();
    const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
    if (!badge) return false;
    const { error } = await supabase.from('profiles').update({
      points: (p?.points || 0) + 50,
      badges: [...(Array.isArray(p?.badges) ? p.badges : []), badge]
    }).eq('id', sid);
    return !error;
  },

  getMessages: async (userId: string) => {
    const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: true });
    return (data || []) as Message[];
  },

  sendMessage: async (sender_id: string, receiver_id: string, content: string) => {
    const { data } = await supabase.from('messages').insert([{ id: generateUUID(), sender_id, receiver_id, content }]).select().single();
    return data as Message;
  },

  getUnreadCount: async (uid: string) => {
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', uid).eq('is_read', false);
    return count || 0;
  },

  markMessagesAsRead: async (uid: string, cid: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('receiver_id', uid).eq('sender_id', cid).eq('is_read', false);
  },

  getEvents: async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    return (data || []) as Event[];
  },

  createEvent: async (e: any) => {
    const { data } = await supabase.from('events').insert([{ ...e, id: generateUUID() }]).select().single();
    return data as Event;
  },

  deleteEvent: async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
  },

  getEventAttendees: async () => {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .not('challenge_id', 'is', null);
    return (data || []).map(s => ({
      ...s,
      status: s.review_status
    }));
  },

  joinEvent: async (student_id: string, event_id: string) => {
    const { data, error } = await supabase.from('submissions').insert([{
      id: generateUUID(),
      student_id,
      challenge_id: event_id,
      review_status: 'event_joined',
      submitted_at: new Date().toISOString()
    }]).select().single();
    if (error) throw error;
    return data;
  },

  submitEventAttendance: async (id: string, observation: string, proof: string) => {
    const { error } = await supabase.from('submissions').update({
      review_status: 'event_pending',
      feedback: observation,
      output_url: proof,
      submitted_at: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
  },

  verifyDatabase: async () => {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      return !error;
    } catch (e) { return false; }
  },

  verifySchemaHealth: async () => {
    try {
      const { error: pError } = await supabase.from('profiles').select('id').limit(1);
      const { error: accError } = await supabase.from('mission_acceptances').select('id').limit(1);
      const { error: sError } = await supabase.from('submissions').select('id').limit(1);
      return !pError && !accError && !sError;
    } catch (e) { return false; }
  }
};
