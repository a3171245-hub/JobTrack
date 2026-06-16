export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApplicationStatus =
  | 'applied'
  | 'document'
  | 'test'
  | 'gd'
  | 'interview_1'
  | 'interview_2'
  | 'final'
  | 'offer'
  | 'rejected'
  | 'event'

export type EmailType = 'selection' | 'event' | 'other' | 'manual_update'

export type TestResult = '通過' | '不通過' | '未受検'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          dedicated_email: string | null
          plan: 'free' | 'premium'
          gmail_access_token: string | null
          gmail_refresh_token: string | null
          gmail_email: string | null
          gmail_history_id: string | null
          gmail_watch_expiration: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          dedicated_email?: string | null
          plan?: 'free' | 'premium'
          gmail_access_token?: string | null
          gmail_refresh_token?: string | null
          gmail_email?: string | null
          gmail_history_id?: string | null
          gmail_watch_expiration?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          dedicated_email?: string | null
          plan?: 'free' | 'premium'
          gmail_access_token?: string | null
          gmail_refresh_token?: string | null
          gmail_email?: string | null
          gmail_history_id?: string | null
          gmail_watch_expiration?: string | null
          created_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          user_id: string
          company_name: string
          status: ApplicationStatus
          latest_email_subject: string | null
          interview_date: string | null
          event_date: string | null
          test_type: string | null
          test_date: string | null
          test_result: TestResult | null
          notes: string | null
          memo: string | null
          es_deadline: string | null
          custom_flow: Json | null
          gd_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          status?: ApplicationStatus
          latest_email_subject?: string | null
          interview_date?: string | null
          event_date?: string | null
          test_type?: string | null
          test_date?: string | null
          test_result?: TestResult | null
          notes?: string | null
          memo?: string | null
          es_deadline?: string | null
          custom_flow?: Json | null
          gd_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          status?: ApplicationStatus
          latest_email_subject?: string | null
          interview_date?: string | null
          event_date?: string | null
          test_type?: string | null
          test_date?: string | null
          test_result?: TestResult | null
          notes?: string | null
          memo?: string | null
          es_deadline?: string | null
          custom_flow?: Json | null
          gd_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          date: string
          type: string
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          date: string
          type: string
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          date?: string
          type?: string
          memo?: string | null
          created_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          id: string
          user_id: string
          application_id: string | null
          subject: string | null
          body_text: string | null
          received_at: string
          email_type: EmailType
        }
        Insert: {
          id?: string
          user_id: string
          application_id?: string | null
          subject?: string | null
          body_text?: string | null
          received_at?: string
          email_type?: EmailType
        }
        Update: {
          id?: string
          user_id?: string
          application_id?: string | null
          subject?: string | null
          body_text?: string | null
          received_at?: string
          email_type?: EmailType
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
