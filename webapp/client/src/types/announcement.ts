// Announcement Types for Admin Management System

export type AnnouncementType = 
  | 'info'      // General information
  | 'warning'   // Important warnings
  | 'promo'     // Promotional content
  | 'success'   // Success messages
  | 'error'     // Error notifications
  | 'new'       // New features
  | 'update';   // Updates

export type AnnouncementStatus = 
  | 'active'    // Currently showing
  | 'scheduled' // Scheduled for future
  | 'expired'   // Past end date
  | 'draft';    // Not yet published

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  message: string; // Supports markdown
  tag?: string; // Optional tag/badge text
  icon?: string; // Lucide icon name
  link_url?: string; // Optional link
  link_text?: string; // Link text
  status: AnnouncementStatus;
  priority: number; // 1-10, higher = more important
  start_date: string; // ISO 8601
  end_date?: string; // Optional, null = no expiry
  dismissible: boolean;
  bg_color?: string; // Custom background color
  text_color?: string; // Custom text color
  themed: boolean; // Use themed mode
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInsert {
  type: AnnouncementType;
  title: string;
  message: string;
  tag?: string;
  icon?: string;
  link_url?: string;
  link_text?: string;
  status?: AnnouncementStatus;
  priority?: number;
  start_date?: string;
  end_date?: string;
  dismissible?: boolean;
  bg_color?: string;
  text_color?: string;
  themed?: boolean;
}

export interface AnnouncementUpdate {
  type?: AnnouncementType;
  title?: string;
  message?: string;
  tag?: string;
  icon?: string;
  link_url?: string;
  link_text?: string;
  status?: AnnouncementStatus;
  priority?: number;
  start_date?: string;
  end_date?: string;
  dismissible?: boolean;
  bg_color?: string;
  text_color?: string;
  themed?: boolean;
}

// Type-specific styling presets
export const announcementTypeStyles: Record<AnnouncementType, {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  defaultIcon: string;
  defaultBgColor?: string;
  defaultTextColor?: string;
}> = {
  info: {
    variant: 'outline',
    defaultIcon: 'Info',
    defaultBgColor: 'bg-blue-50',
    defaultTextColor: 'text-blue-900'
  },
  warning: {
    variant: 'destructive',
    defaultIcon: 'AlertTriangle',
    defaultBgColor: 'bg-yellow-50',
    defaultTextColor: 'text-yellow-900'
  },
  promo: {
    variant: 'secondary',
    defaultIcon: 'Sparkles',
    defaultBgColor: 'bg-purple-50',
    defaultTextColor: 'text-purple-900'
  },
  success: {
    variant: 'default',
    defaultIcon: 'CheckCircle2',
    defaultBgColor: 'bg-green-50',
    defaultTextColor: 'text-green-900'
  },
  error: {
    variant: 'destructive',
    defaultIcon: 'XCircle',
    defaultBgColor: 'bg-red-50',
    defaultTextColor: 'text-red-900'
  },
  new: {
    variant: 'default',
    defaultIcon: 'Zap',
    defaultBgColor: 'bg-indigo-50',
    defaultTextColor: 'text-indigo-900'
  },
  update: {
    variant: 'secondary',
    defaultIcon: 'RefreshCw',
    defaultBgColor: 'bg-teal-50',
    defaultTextColor: 'text-teal-900'
  }
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export type AnnouncementResponse = ApiResponse<Announcement>;
export type AnnouncementsResponse = ApiResponse<Announcement[]>;
