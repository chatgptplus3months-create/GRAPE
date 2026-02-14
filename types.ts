
export type UserRole = 'admin' | 'student';
export type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Pro';
export type AcceptanceStatus = 'in_progress' | 'submitted' | 'reviewed';
// Expanded SubmissionStatus to include event-related and variant statuses used in components
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'approved' | 'event_joined' | 'event_pending' | 'event_approved';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  points: number;
  completed_challenges: number;
  rank?: number;
  avatar_url?: string;
  class_name?: string;
  skill_level?: string;
  badges?: Badge[];
  passkey?: string;
}

// Student is an alias for UserProfile where role is student
export type Student = UserProfile;

export interface MissionAcceptance {
  id: string;
  student_id: string;
  mission_id: string;
  accepted_at: string;
  deadline_at: string;
  status: AcceptanceStatus;
}

export interface Submission {
  id: string;
  mission_acceptance_id?: string; // Optional for event attendance
  challenge_id?: string; // Used for event attendance tracking
  student_id: string;
  output_url?: string; // Optional for event attendance
  submitted_at: string;
  review_status?: SubmissionStatus; // Backend status
  status: SubmissionStatus; // Frontend status used throughout components
  feedback?: string;
  graded_by?: string;
  // Join fallbacks
  student_name?: string;
  challenge_title?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  points: number;
  duration_days: number; // For timer calculation
  created_by_id?: string;
}

export type AppTab = 'Dashboard' | 'Students' | 'Challenges' | 'Submissions' | 'Vault' | 'Events' | 'Sticker Store' | 'Settings' | 'Messages';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Event {
  id: string;
  title: string;
  event_date: string;
  time: string;
  type: string;
  color: string;
  location: string;
}

export interface MetricData {
  label: string;
  value: string;
  trend?: number;
  icon: string;
}

export interface ChartData {
  name: string;
  value: number;
  secondary: number;
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  content: string;
  created_at: string;
}

export interface Insight {
  category: string;
  summary: string;
  action: string;
  severity: 'low' | 'medium' | 'high';
}
