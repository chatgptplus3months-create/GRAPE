
import { MetricData, ChartData, Activity, Student, Challenge } from './types';

export const MOCK_METRICS: MetricData[] = [
  { label: 'TOTAL STUDENTS', value: '0', trend: 0, icon: 'users' },
  { label: 'ACTIVE CHALLENGES', value: '0', trend: 0, icon: 'zap' },
  { label: 'COMPLETED SUBMISSIONS', value: '0', trend: 0, icon: 'check-circle' },
];

export const MOCK_CHART_DATA: ChartData[] = [
  { name: 'MON', value: 0, secondary: 0 },
  { name: 'TUE', value: 0, secondary: 0 },
  { name: 'WED', value: 0, secondary: 0 },
  { name: 'THU', value: 0, secondary: 0 },
  { name: 'FRI', value: 0, secondary: 0 },
  { name: 'SAT', value: 0, secondary: 0 },
  { name: 'SUN', value: 0, secondary: 0 },
];

export const CATEGORY_DISTRIBUTION = [
  { label: 'Web Development', percentage: 0 },
  { label: 'Artificial Intelligence', percentage: 0 },
  { label: 'Robotics & IoT', percentage: 0 },
  { label: 'Cybersecurity', percentage: 0 },
];

// Emptying mock arrays to ensure only database content is displayed
export const MOCK_ACTIVITIES: Activity[] = [];

export const MOCK_STUDENTS: Student[] = [];

export const MOCK_CHALLENGES: Challenge[] = [];
