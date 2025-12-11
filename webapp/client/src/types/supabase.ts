// Supabase Database Types
// Generated based on the SQL schema in userDB.sql
// TypeScript types for your database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: {
          id: string
          type: 'info' | 'warning' | 'promo' | 'success' | 'error' | 'new' | 'update'
          title: string
          message: string
          tag: string | null
          icon: string | null
          link_url: string | null
          link_text: string | null
          status: 'active' | 'scheduled' | 'expired' | 'draft'
          priority: number
          start_date: string
          end_date: string | null
          dismissible: boolean
          bg_color: string | null
          text_color: string | null
          themed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'info' | 'warning' | 'promo' | 'success' | 'error' | 'new' | 'update'
          title: string
          message: string
          tag?: string | null
          icon?: string | null
          link_url?: string | null
          link_text?: string | null
          status?: 'active' | 'scheduled' | 'expired' | 'draft'
          priority?: number
          start_date?: string
          end_date?: string | null
          dismissible?: boolean
          bg_color?: string | null
          text_color?: string | null
          themed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'info' | 'warning' | 'promo' | 'success' | 'error' | 'new' | 'update'
          title?: string
          message?: string
          tag?: string | null
          icon?: string | null
          link_url?: string | null
          link_text?: string | null
          status?: 'active' | 'scheduled' | 'expired' | 'draft'
          priority?: number
          start_date?: string
          end_date?: string | null
          dismissible?: boolean
          bg_color?: string | null
          text_color?: string | null
          themed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          order_id: string
          payment_session_id: string | null
          cashfree_order_id: string | null
          plan_id: string
          plan_name: string
          amount: number
          currency: string
          status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
          payment_method: string | null
          transaction_id: string | null
          payment_time: string | null
          error_message: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          payment_session_id?: string | null
          cashfree_order_id?: string | null
          plan_id: string
          plan_name: string
          amount: number
          currency?: string
          status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
          payment_method?: string | null
          transaction_id?: string | null
          payment_time?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string
          payment_session_id?: string | null
          cashfree_order_id?: string | null
          plan_id?: string
          plan_name?: string
          amount?: number
          currency?: string
          status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
          payment_method?: string | null
          transaction_id?: string | null
          payment_time?: string | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          payment_id: string | null
          plan_id: string
          plan_name: string
          plan_duration_days: number
          start_date: string
          end_date: string
          status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_id?: string | null
          plan_id: string
          plan_name: string
          plan_duration_days: number
          start_date?: string
          end_date: string
          status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_id?: string | null
          plan_id?: string
          plan_name?: string
          plan_duration_days?: number
          start_date?: string
          end_date?: string
          status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          clerk_user_id: string
          name: string
          email: string
          role: 'basic' | 'pro' | 'admin'
          chef: 'yes' | 'no'
          photo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          name: string
          email: string
          role?: 'basic' | 'pro' | 'admin'
          chef?: 'yes' | 'no'
          photo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          name?: string
          email?: string
          role?: 'basic' | 'pro' | 'admin'
          chef?: 'yes' | 'no'
          photo?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          user_location: string | null
          age_range: string | null
          gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null
          city: string | null
          user_state: string | null
          pin_code: string | null
          experience_years: number | null
          experiences: string | null
          profession: string | null
          job_role: string | null
          education: string | null
          cuisines: string | null
          languages: string | null
          certifications: string | null
          current_ctc: string | null
          expected_ctc: string | null
          notice_period: string | null
          training: 'yes' | 'no' | 'try' | null
          preferred_location: string | null
          joining: 'immediate' | 'specific' | null
          work_type: 'full' | 'part' | 'contract' | null
          business_type: 'any' | 'new' | 'old' | null
          linkedin_profile: string | null
          portfolio_website: string | null
          bio: string | null
          passport: string | null
          photo: string | null
          resume_file: string | null
          verified: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          user_location?: string | null
          age_range?: string | null
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null
          city?: string | null
          user_state?: string | null
          pin_code?: string | null
          experience_years?: number | null
          experiences?: string | null
          profession?: string | null
          job_role?: string | null
          education?: string | null
          cuisines?: string | null
          languages?: string | null
          certifications?: string | null
          current_ctc?: string | null
          expected_ctc?: string | null
          notice_period?: string | null
          training?: 'yes' | 'no' | 'try' | null
          preferred_location?: string | null
          joining?: 'immediate' | 'specific' | null
          work_type?: 'full' | 'part' | 'contract' | null
          business_type?: 'any' | 'new' | 'old' | null
          linkedin_profile?: string | null
          portfolio_website?: string | null
          bio?: string | null
          passport?: string | null
          photo?: string | null
          resume_file?: string | null
          verified?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          user_location?: string | null
          age_range?: string | null
          gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null
          city?: string | null
          user_state?: string | null
          pin_code?: string | null
          experience_years?: number | null
          experiences?: string | null
          profession?: string | null
          job_role?: string | null
          education?: string | null
          cuisines?: string | null
          languages?: string | null
          certifications?: string | null
          current_ctc?: string | null
          expected_ctc?: string | null
          notice_period?: string | null
          training?: 'yes' | 'no' | 'try' | null
          preferred_location?: string | null
          joining?: 'immediate' | 'specific' | null
          work_type?: 'full' | 'part' | 'contract' | null
          business_type?: 'any' | 'new' | 'old' | null
          linkedin_profile?: string | null
          portfolio_website?: string | null
          bio?: string | null
          passport?: string | null
          photo?: string | null
          resume_file?: string | null
          verified?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Resume = Database['public']['Tables']['resumes']['Row']
export type ResumeInsert = Database['public']['Tables']['resumes']['Insert']
export type ResumeUpdate = Database['public']['Tables']['resumes']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

// Type for user with optional resume data
export type UserWithResume = User & {
  resumes?: Resume[]
}

// Type for creating/updating user from Clerk webhook
export type ClerkUserData = {
  clerk_user_id: string
  name: string
  email: string
  photo?: string | null
}

// Response types for API endpoints
export type ApiResponse<T> = {
  data?: T
  error?: string
  success: boolean
}

export type UserResponse = ApiResponse<User>
export type UsersResponse = ApiResponse<User[]>
export type ResumeResponse = ApiResponse<Resume>
export type ResumesResponse = ApiResponse<Resume[]>