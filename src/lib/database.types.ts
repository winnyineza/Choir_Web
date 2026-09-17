// Database types for Supabase
// This file defines the shape of your database tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
          status: 'Active' | 'Pending' | 'Inactive';
          joined_date: string;
          date_of_birth: string | null;
          photo: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
          status?: 'Active' | 'Pending' | 'Inactive';
          joined_date?: string;
          date_of_birth?: string | null;
          photo?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          voice?: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
          status?: 'Active' | 'Pending' | 'Inactive';
          joined_date?: string;
          date_of_birth?: string | null;
          photo?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          date: string;
          time: string;
          location: string | null;
          category: 'Concert' | 'Revival' | 'Workshop' | 'Fellowship' | 'Other';
          image: string | null;
          is_free: boolean;
          status: 'draft' | 'published' | 'cancelled';
          livestream_url: string | null;
          is_live: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          date: string;
          time: string;
          location?: string | null;
          category?: 'Concert' | 'Revival' | 'Workshop' | 'Fellowship' | 'Other';
          image?: string | null;
          is_free?: boolean;
          status?: 'draft' | 'published' | 'cancelled';
          livestream_url?: string | null;
          is_live?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          date?: string;
          time?: string;
          location?: string | null;
          category?: 'Concert' | 'Revival' | 'Workshop' | 'Fellowship' | 'Other';
          image?: string | null;
          is_free?: boolean;
          status?: 'draft' | 'published' | 'cancelled';
          livestream_url?: string | null;
          is_live?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      contributions: {
        Row: {
          id: string;
          member_id: string;
          type: string;
          category: 'monthly_dues' | 'special' | 'tithe' | 'offering' | 'other';
          amount: number;
          month: number | null;
          year: number | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          type: string;
          category?: 'monthly_dues' | 'special' | 'tithe' | 'offering' | 'other';
          amount: number;
          month?: number | null;
          year?: number | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          member_id?: string;
          type?: string;
          category?: 'monthly_dues' | 'special' | 'tithe' | 'offering' | 'other';
          amount?: number;
          month?: number | null;
          year?: number | null;
          notes?: string | null;
          recorded_by?: string | null;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          member_id: string;
          date: string;
          session_title: string | null;
          status: 'present' | 'absent' | 'excused' | 'late';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          date: string;
          session_title?: string | null;
          status: 'present' | 'absent' | 'excused' | 'late';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          member_id?: string;
          date?: string;
          session_title?: string | null;
          status?: 'present' | 'absent' | 'excused' | 'late';
          notes?: string | null;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          role: 'super_admin' | 'main_admin' | 'finance' | 'secretary' | 'disciplinary' | 'reviewer' | 'social_affairs' | 'coach';
          member_id: string | null;
          is_active: boolean;
          last_login: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          password_hash: string;
          role?: 'super_admin' | 'main_admin' | 'finance' | 'secretary' | 'disciplinary' | 'reviewer' | 'social_affairs' | 'coach';
          member_id?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          password_hash?: string;
          role?: 'super_admin' | 'main_admin' | 'finance' | 'secretary' | 'disciplinary' | 'reviewer' | 'social_affairs' | 'coach';
          member_id?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      login_attempts: {
        Row: {
          id: string;
          email: string;
          ip_address: string | null;
          success: boolean;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          ip_address?: string | null;
          success?: boolean;
          attempted_at?: string;
        };
        Update: {
          email?: string;
          ip_address?: string | null;
          success?: boolean;
          attempted_at?: string;
        };
        Relationships: [];
      };
      leave_requests: {
        Row: {
          id: string;
          member_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          status: 'pending' | 'approved' | 'denied';
          approvals: Json;
          denials: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          status?: 'pending' | 'approved' | 'denied';
          approvals?: Json;
          denials?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          start_date?: string;
          end_date?: string;
          reason?: string;
          status?: 'pending' | 'approved' | 'denied';
          approvals?: Json;
          denials?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          title: string;
          amount: number;
          category: string;
          date: string;
          description: string | null;
          receipt_url: string | null;
          recorded_by: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          amount: number;
          category: string;
          date: string;
          description?: string | null;
          receipt_url?: string | null;
          recorded_by?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          title?: string;
          amount?: number;
          category?: string;
          date?: string;
          description?: string | null;
          receipt_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          type: 'general' | 'event' | 'warning' | 'success';
          priority: 'normal' | 'high' | 'urgent';
          is_pinned: boolean;
          expires_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          type?: 'general' | 'event' | 'warning' | 'success';
          priority?: 'normal' | 'high' | 'urgent';
          is_pinned?: boolean;
          expires_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          type?: 'general' | 'event' | 'warning' | 'success';
          priority?: 'normal' | 'high' | 'urgent';
          is_pinned?: boolean;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          user_email: string;
          user_name: string;
          action: string;
          details: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email: string;
          user_name: string;
          action: string;
          details?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        // Audit rows are append-only; nothing about them may be edited.
        Update: Record<string, never>;
        Relationships: [];
      };
      choir_settings: {
        Row: {
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_sessions: {
        Row: {
          id: string;
          start_time: string;
          last_activity: string;
        };
        Insert: {
          id: string;
          start_time?: string;
          last_activity?: string;
        };
        Update: {
          id?: string;
          start_time?: string;
          last_activity?: string;
        };
        Relationships: [];
      };
      leave_verification_codes: {
        Row: {
          id: string;
          leave_id: string;
          email: string;
          code: string;
          expires_at: string;
          used: boolean;
          created_at: string;
          // Only present on the legacy schema; see insertVerificationCodeLegacy.
          approver_id?: string | null;
        };
        Insert: {
          id: string;
          leave_id: string;
          email: string;
          code: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
          approver_id?: string | null;
        };
        Update: {
          id?: string;
          leave_id?: string;
          email?: string;
          code?: string;
          expires_at?: string;
          used?: boolean;
          created_at?: string;
          approver_id?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
