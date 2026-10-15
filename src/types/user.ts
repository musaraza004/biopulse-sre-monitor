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
    clusterName: 'Musa-BioPulse-Prod-01',
    lastLogin: 'Active now',
  },
  {
    id: 'user_alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@biopulse.org',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: 'DevOps Engineer',
    provider: 'google',
    clusterName: 'Rivera-Edge-EU-West',
    lastLogin: '25 mins ago',
  },
  {
    id: 'user_sarah',
    name: 'Dr. Sarah Chen',
    email: 's.chen@genomics-pulse.io',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
    role: 'Bioscience Analyst',
    provider: 'google',
    clusterName: 'Chen-GeneSeq-Lab-04',
    lastLogin: '2 hours ago',
  },
  {
    id: 'user_auditor',
    name: 'Compliance Auditor',
    email: 'audit-team@healthcare-standards.org',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    role: 'Guest Observer',
    provider: 'google',
    clusterName: 'Public-Audit-Readonly',
    lastLogin: 'Yesterday',
  },
];
