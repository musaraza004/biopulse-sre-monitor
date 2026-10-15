import { MonitoredTarget, CronJob } from './monitor.js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Lead SRE' | 'DevOps Engineer' | 'Bioscience Analyst' | 'Guest Observer';
  provider: 'google' | 'demo' | 'custom';
  clusterName: string;
  lastLogin: string;
}

export interface UserDashboardData {
  userId: string;
  userEmail: string;
  updatedAt: number;
  targets: MonitoredTarget[];
  cronJobs: CronJob[];
  sharedToken: string;
  autoRefreshInterval: number;
  isDarkMode: boolean;
  selectedTargetId: string;
}

export const PRESET_USERS: UserProfile[] = [
  {
    id: 'user_musa',
    name: 'Musa Raza',
    email: 'musaraza004@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    role: 'Lead SRE',
    provider: 'google',
    clusterName: 'Musa-BioPulse-Live',
    lastLogin: 'Active now',
  }
];
