export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accuracy_alerts: {
        Row: {
          accuracy_rate: number
          alert_date: string
          category: string
          category_type: string
          created_at: string
          id: string
          is_resolved: boolean
          resolved_at: string | null
          sample_size: number
          updated_at: string
        }
        Insert: {
          accuracy_rate: number
          alert_date?: string
          category: string
          category_type: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          sample_size: number
          updated_at?: string
        }
        Update: {
          accuracy_rate?: number
          alert_date?: string
          category?: string
          category_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          sample_size?: number
          updated_at?: string
        }
        Relationships: []
      }
      accuracy_metrics: {
        Row: {
          accuracy_rate: number
          close_match_count: number | null
          computed_at: string | null
          confidence_calibration: number | null
          dimension_value: string | null
          exact_match_count: number | null
          id: string
          metric_type: string
          miss_count: number | null
          outcomes_count: number
          partial_match_count: number | null
          period: string
          period_start: string
          top_diagnoses: Json | null
          trend: string | null
          worst_diagnoses: Json | null
        }
        Insert: {
          accuracy_rate: number
          close_match_count?: number | null
          computed_at?: string | null
          confidence_calibration?: number | null
          dimension_value?: string | null
          exact_match_count?: number | null
          id?: string
          metric_type: string
          miss_count?: number | null
          outcomes_count: number
          partial_match_count?: number | null
          period: string
          period_start: string
          top_diagnoses?: Json | null
          trend?: string | null
          worst_diagnoses?: Json | null
        }
        Update: {
          accuracy_rate?: number
          close_match_count?: number | null
          computed_at?: string | null
          confidence_calibration?: number | null
          dimension_value?: string | null
          exact_match_count?: number | null
          id?: string
          metric_type?: string
          miss_count?: number | null
          outcomes_count?: number
          partial_match_count?: number | null
          period?: string
          period_start?: string
          top_diagnoses?: Json | null
          trend?: string | null
          worst_diagnoses?: Json | null
        }
        Relationships: []
      }
      ad_click_events: {
        Row: {
          click_type: string
          created_at: string
          destination: string | null
          diagnosis_code: string | null
          diagnosis_title: string | null
          id: string
          item_brand: string | null
          item_category: string | null
          item_id: string | null
          item_price: string | null
          item_title: string | null
          part_name: string | null
          placement: string | null
          session_id: string | null
          source: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
        }
        Insert: {
          click_type: string
          created_at?: string
          destination?: string | null
          diagnosis_code?: string | null
          diagnosis_title?: string | null
          id?: string
          item_brand?: string | null
          item_category?: string | null
          item_id?: string | null
          item_price?: string | null
          item_title?: string | null
          part_name?: string | null
          placement?: string | null
          session_id?: string | null
          source?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Update: {
          click_type?: string
          created_at?: string
          destination?: string | null
          diagnosis_code?: string | null
          diagnosis_title?: string | null
          id?: string
          item_brand?: string | null
          item_category?: string | null
          item_id?: string | null
          item_price?: string | null
          item_title?: string | null
          part_name?: string | null
          placement?: string | null
          session_id?: string | null
          source?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_click_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          action: string
          ad_placement: string | null
          ad_position: number | null
          ad_source: string | null
          category: string
          city: string | null
          event_type: string
          id: string
          item_brand: string | null
          item_category: string | null
          item_id: string | null
          item_price: string | null
          item_title: string | null
          item_url: string | null
          label: string | null
          metadata: Json | null
          page_title: string | null
          page_url: string
          referrer: string | null
          repair_cost_estimate: number | null
          repair_diagnosis: string | null
          session_id: string
          state: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
          value: number | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          zip_code: string | null
        }
        Insert: {
          action: string
          ad_placement?: string | null
          ad_position?: number | null
          ad_source?: string | null
          category: string
          city?: string | null
          event_type: string
          id?: string
          item_brand?: string | null
          item_category?: string | null
          item_id?: string | null
          item_price?: string | null
          item_title?: string | null
          item_url?: string | null
          label?: string | null
          metadata?: Json | null
          page_title?: string | null
          page_url: string
          referrer?: string | null
          repair_cost_estimate?: number | null
          repair_diagnosis?: string | null
          session_id: string
          state?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          value?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Update: {
          action?: string
          ad_placement?: string | null
          ad_position?: number | null
          ad_source?: string | null
          category?: string
          city?: string | null
          event_type?: string
          id?: string
          item_brand?: string | null
          item_category?: string | null
          item_id?: string | null
          item_price?: string | null
          item_title?: string | null
          item_url?: string | null
          label?: string | null
          metadata?: Json | null
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          repair_cost_estimate?: number | null
          repair_diagnosis?: string | null
          session_id?: string
          state?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          value?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          name: string
          owner_email: string | null
          rate_limit_per_minute: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          name: string
          owner_email?: string | null
          rate_limit_per_minute?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          name?: string
          owner_email?: string | null
          rate_limit_per_minute?: number
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          id: string
          key_hash: string
          requested_at: string
        }
        Insert: {
          id?: string
          key_hash: string
          requested_at?: string
        }
        Update: {
          id?: string
          key_hash?: string
          requested_at?: string
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          cost_high: number | null
          cost_low: number | null
          created_at: string
          diagnosis_code: string | null
          diagnosis_title: string | null
          endpoint: string
          id: string
          key_hash: string
          metro_area: string | null
          response_status: number | null
          response_time_ms: number | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_trim: string | null
          vehicle_year: string | null
          zip_code: string | null
        }
        Insert: {
          cost_high?: number | null
          cost_low?: number | null
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_title?: string | null
          endpoint: string
          id?: string
          key_hash: string
          metro_area?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Update: {
          cost_high?: number | null
          cost_low?: number | null
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_title?: string | null
          endpoint?: string
          id?: string
          key_hash?: string
          metro_area?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      developer_accounts: {
        Row: {
          billing_cycle_start: string
          company_name: string | null
          created_at: string
          current_month_calls: number
          id: string
          monthly_call_limit: number
          stripe_customer_id: string | null
          subscription_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle_start?: string
          company_name?: string | null
          created_at?: string
          current_month_calls?: number
          id?: string
          monthly_call_limit?: number
          stripe_customer_id?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle_start?: string
          company_name?: string | null
          created_at?: string
          current_month_calls?: number
          id?: string
          monthly_call_limit?: number
          stripe_customer_id?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string | null
          explanation: string
          id: string
          model_used: string | null
          raw_ai_response: Json | null
          session_id: string | null
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at?: string | null
          explanation: string
          id?: string
          model_used?: string | null
          raw_ai_response?: Json | null
          session_id?: string | null
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string | null
          explanation?: string
          id?: string
          model_used?: string | null
          raw_ai_response?: Json | null
          session_id?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_records: {
        Row: {
          ai_model_used: string | null
          alternative_diagnoses: Json | null
          booked_at: string | null
          cost_estimate_high: number | null
          cost_estimate_low: number | null
          cost_variance_percent: number | null
          created_at: string
          customer_approved: boolean | null
          customer_approved_at: string | null
          customer_id: string | null
          customer_selected_diagnosis: string | null
          estimated_cost: number | null
          historical_most_common_diagnosis: string | null
          historical_similar_symptoms: number | null
          historical_success_rate: number | null
          historical_total_cases: number | null
          id: string
          market_average_cost: number | null
          price_approved: boolean | null
          price_approved_at: string | null
          primary_confidence: number
          primary_diagnosis: string
          rationale: string | null
          recommended_action: string | null
          selected_shop_id: string | null
          session_id: string | null
          shop_selection_rationale: string | null
          status: string
          symptoms: string
          tracking_number: string | null
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_trim: string | null
          vehicle_year: string | null
          vin: string | null
          zip_code: string | null
        }
        Insert: {
          ai_model_used?: string | null
          alternative_diagnoses?: Json | null
          booked_at?: string | null
          cost_estimate_high?: number | null
          cost_estimate_low?: number | null
          cost_variance_percent?: number | null
          created_at?: string
          customer_approved?: boolean | null
          customer_approved_at?: string | null
          customer_id?: string | null
          customer_selected_diagnosis?: string | null
          estimated_cost?: number | null
          historical_most_common_diagnosis?: string | null
          historical_similar_symptoms?: number | null
          historical_success_rate?: number | null
          historical_total_cases?: number | null
          id?: string
          market_average_cost?: number | null
          price_approved?: boolean | null
          price_approved_at?: string | null
          primary_confidence?: number
          primary_diagnosis: string
          rationale?: string | null
          recommended_action?: string | null
          selected_shop_id?: string | null
          session_id?: string | null
          shop_selection_rationale?: string | null
          status?: string
          symptoms: string
          tracking_number?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          vin?: string | null
          zip_code?: string | null
        }
        Update: {
          ai_model_used?: string | null
          alternative_diagnoses?: Json | null
          booked_at?: string | null
          cost_estimate_high?: number | null
          cost_estimate_low?: number | null
          cost_variance_percent?: number | null
          created_at?: string
          customer_approved?: boolean | null
          customer_approved_at?: string | null
          customer_id?: string | null
          customer_selected_diagnosis?: string | null
          estimated_cost?: number | null
          historical_most_common_diagnosis?: string | null
          historical_similar_symptoms?: number | null
          historical_success_rate?: number | null
          historical_total_cases?: number | null
          id?: string
          market_average_cost?: number | null
          price_approved?: boolean | null
          price_approved_at?: string | null
          primary_confidence?: number
          primary_diagnosis?: string
          rationale?: string | null
          recommended_action?: string | null
          selected_shop_id?: string | null
          session_id?: string | null
          shop_selection_rationale?: string | null
          status?: string
          symptoms?: string
          tracking_number?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          vin?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_records_selected_shop_id_fkey"
            columns: ["selected_shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_accuracy: {
        Row: {
          accuracy_score: number | null
          actual_diagnosis: string | null
          computed_at: string | null
          confidence_was_correct: boolean | null
          id: string
          match_explanation: string | null
          match_label: string | null
          outcome_report_id: string | null
          predicted_causes_all: string[]
          predicted_confidence: Database["public"]["Enums"]["confidence_level"]
          predicted_top_cause: string
          predicted_urgency: Database["public"]["Enums"]["urgency_level"]
          session_id: string | null
          symptom_category: string | null
          vehicle_make: string | null
          vehicle_model: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_diagnosis?: string | null
          computed_at?: string | null
          confidence_was_correct?: boolean | null
          id?: string
          match_explanation?: string | null
          match_label?: string | null
          outcome_report_id?: string | null
          predicted_causes_all: string[]
          predicted_confidence: Database["public"]["Enums"]["confidence_level"]
          predicted_top_cause: string
          predicted_urgency: Database["public"]["Enums"]["urgency_level"]
          session_id?: string | null
          symptom_category?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_diagnosis?: string | null
          computed_at?: string | null
          confidence_was_correct?: boolean | null
          id?: string
          match_explanation?: string | null
          match_label?: string | null
          outcome_report_id?: string | null
          predicted_causes_all?: string[]
          predicted_confidence?: Database["public"]["Enums"]["confidence_level"]
          predicted_top_cause?: string
          predicted_urgency?: Database["public"]["Enums"]["urgency_level"]
          session_id?: string | null
          symptom_category?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_accuracy_outcome_report_id_fkey"
            columns: ["outcome_report_id"]
            isOneToOne: false
            referencedRelation: "outcome_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_accuracy_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_sessions: {
        Row: {
          anon_session_id: string | null
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["session_status"] | null
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          anon_session_id?: string | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          anon_session_id?: string | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_sessions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      diy_tutorials: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty: string
          estimated_savings_cents: number | null
          estimated_time_minutes: number
          id: string
          instructions: Json | null
          is_published: boolean
          parts_needed: Json | null
          safety_warnings: string[] | null
          seo_keywords: string[] | null
          slug: string
          thumbnail_url: string | null
          title: string
          tools_needed: Json | null
          updated_at: string
          vehicle_types: string[] | null
          video_source: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          difficulty?: string
          estimated_savings_cents?: number | null
          estimated_time_minutes?: number
          id?: string
          instructions?: Json | null
          is_published?: boolean
          parts_needed?: Json | null
          safety_warnings?: string[] | null
          seo_keywords?: string[] | null
          slug: string
          thumbnail_url?: string | null
          title: string
          tools_needed?: Json | null
          updated_at?: string
          vehicle_types?: string[] | null
          video_source?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          estimated_savings_cents?: number | null
          estimated_time_minutes?: number
          id?: string
          instructions?: Json | null
          is_published?: boolean
          parts_needed?: Json | null
          safety_warnings?: string[] | null
          seo_keywords?: string[] | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          tools_needed?: Json | null
          updated_at?: string
          vehicle_types?: string[] | null
          video_source?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      edge_rate_limits: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          requested_at: string
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          requested_at?: string
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          requested_at?: string
        }
        Relationships: []
      }
      finance_selections: {
        Row: {
          apr: number
          created_at: string
          id: string
          monthly_payment: number
          option_type: string
          provider: string
          quote_request_id: string | null
          repair_cost: number
          term_months: number
          total_cost: number
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          zip_code: string | null
        }
        Insert: {
          apr: number
          created_at?: string
          id?: string
          monthly_payment: number
          option_type: string
          provider: string
          quote_request_id?: string | null
          repair_cost: number
          term_months: number
          total_cost: number
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Update: {
          apr?: number
          created_at?: string
          id?: string
          monthly_payment?: number
          option_type?: string
          provider?: string
          quote_request_id?: string | null
          repair_cost?: number
          term_months?: number
          total_cost?: number
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_selections_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_log: {
        Row: {
          attempt_number: number | null
          attempted_at: string | null
          completed_at: string | null
          direction: string
          error_message: string | null
          id: string
          payload_sent: Json | null
          response_received: Json | null
          session_id: string | null
          shop_integration_id: string
          sms_record_id: string | null
          status: string
        }
        Insert: {
          attempt_number?: number | null
          attempted_at?: string | null
          completed_at?: string | null
          direction: string
          error_message?: string | null
          id?: string
          payload_sent?: Json | null
          response_received?: Json | null
          session_id?: string | null
          shop_integration_id: string
          sms_record_id?: string | null
          status?: string
        }
        Update: {
          attempt_number?: number | null
          attempted_at?: string | null
          completed_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          payload_sent?: Json | null
          response_received?: Json | null
          session_id?: string | null
          shop_integration_id?: string
          sms_record_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_log_shop_integration_id_fkey"
            columns: ["shop_integration_id"]
            isOneToOne: false
            referencedRelation: "shop_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_alerts: {
        Row: {
          created_at: string
          current_mileage: number
          due_mileage: number
          estimated_cost_high: number | null
          estimated_cost_low: number | null
          id: string
          is_read: boolean
          miles_until_due: number
          priority: string
          service_label: string
          service_type: string
          summary: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          current_mileage: number
          due_mileage: number
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          id?: string
          is_read?: boolean
          miles_until_due: number
          priority: string
          service_label: string
          service_type: string
          summary: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          current_mileage?: number
          due_mileage?: number
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          id?: string
          is_read?: boolean
          miles_until_due?: number
          priority?: string
          service_label?: string
          service_type?: string
          summary?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "user_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          id: string
          mileage_at_service: number | null
          next_service_due_date: string | null
          next_service_due_mileage: number | null
          notes: string | null
          service_date: string
          service_type: string
          shop_location: string | null
          shop_name: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          mileage_at_service?: number | null
          next_service_due_date?: string | null
          next_service_due_mileage?: number | null
          notes?: string | null
          service_date: string
          service_type: string
          shop_location?: string | null
          shop_name?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          mileage_at_service?: number | null
          next_service_due_date?: string | null
          next_service_due_mileage?: number | null
          notes?: string | null
          service_date?: string
          service_type?: string
          shop_location?: string | null
          shop_name?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "user_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_value_alerts: {
        Row: {
          change_direction: string
          change_percent: number
          created_at: string
          current_value: number
          id: string
          is_read: boolean
          previous_value: number
          summary: string
          vehicle_id: string
        }
        Insert: {
          change_direction: string
          change_percent: number
          created_at?: string
          current_value: number
          id?: string
          is_read?: boolean
          previous_value: number
          summary: string
          vehicle_id: string
        }
        Update: {
          change_direction?: string
          change_percent?: number
          created_at?: string
          current_value?: number
          id?: string
          is_read?: boolean
          previous_value?: number
          summary?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_value_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "user_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_maintenance: boolean
          email_market_value: boolean
          email_recalls: boolean
          id: string
          inapp_maintenance: boolean
          inapp_market_value: boolean
          inapp_recalls: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_maintenance?: boolean
          email_market_value?: boolean
          email_recalls?: boolean
          id?: string
          inapp_maintenance?: boolean
          inapp_market_value?: boolean
          inapp_recalls?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_maintenance?: boolean
          email_market_value?: boolean
          email_recalls?: boolean
          id?: string
          inapp_maintenance?: boolean
          inapp_market_value?: boolean
          inapp_recalls?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outcome_reminders: {
        Row: {
          completed_at: string | null
          id: string
          opened_at: string | null
          scheduled_for: string
          sent_at: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          opened_at?: string | null
          scheduled_for: string
          sent_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          opened_at?: string | null
          scheduled_for?: string
          sent_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_reminders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome_reports: {
        Row: {
          actual_cost: number | null
          actual_diagnosis: string | null
          diy_notes: string | null
          id: string
          no_visit_reason: string | null
          problem_fixed:
            | Database["public"]["Enums"]["problem_fixed_status"]
            | null
          repair_date: string | null
          reported_at: string | null
          session_id: string | null
          shop_feedback: string | null
          shop_name: string | null
          shop_visit: boolean
          user_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_diagnosis?: string | null
          diy_notes?: string | null
          id?: string
          no_visit_reason?: string | null
          problem_fixed?:
            | Database["public"]["Enums"]["problem_fixed_status"]
            | null
          repair_date?: string | null
          reported_at?: string | null
          session_id?: string | null
          shop_feedback?: string | null
          shop_name?: string | null
          shop_visit: boolean
          user_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_diagnosis?: string | null
          diy_notes?: string | null
          id?: string
          no_visit_reason?: string | null
          problem_fixed?:
            | Database["public"]["Enums"]["problem_fixed_status"]
            | null
          repair_date?: string | null
          reported_at?: string | null
          session_id?: string | null
          shop_feedback?: string | null
          shop_name?: string | null
          shop_visit?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_metrics: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          partner_name: string
          partner_type: string
          period: string
          referrals_count: number | null
          revenue: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_name: string
          partner_type: string
          period: string
          referrals_count?: number | null
          revenue?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_name?: string
          partner_type?: string
          period?: string
          referrals_count?: number | null
          revenue?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      possible_causes: {
        Row: {
          created_at: string | null
          diagnosis_id: string | null
          diy_difficulty: Database["public"]["Enums"]["diy_difficulty"] | null
          estimated_cost_high: number | null
          estimated_cost_low: number | null
          id: string
          name: string
          notes: string | null
          probability: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          diagnosis_id?: string | null
          diy_difficulty?: Database["public"]["Enums"]["diy_difficulty"] | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          id?: string
          name: string
          notes?: string | null
          probability?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          diagnosis_id?: string | null
          diy_difficulty?: Database["public"]["Enums"]["diy_difficulty"] | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          id?: string
          name?: string
          notes?: string | null
          probability?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "possible_causes_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            isOneToOne: false
            referencedRelation: "diagnoses"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_insights: {
        Row: {
          action_items: Json | null
          clicks_count: number
          cost_to_ignore: number | null
          created_at: string
          description: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean
          market_data: Json | null
          potential_savings: number | null
          priority: string
          title: string
          type: string
          updated_at: string
          urgency_timeframe: string | null
          vehicle_id: string
          views_count: number
        }
        Insert: {
          action_items?: Json | null
          clicks_count?: number
          cost_to_ignore?: number | null
          created_at?: string
          description: string
          dismissed_at?: string | null
          expires_at?: string | null
          id: string
          is_dismissed?: boolean
          market_data?: Json | null
          potential_savings?: number | null
          priority: string
          title: string
          type: string
          updated_at?: string
          urgency_timeframe?: string | null
          vehicle_id: string
          views_count?: number
        }
        Update: {
          action_items?: Json | null
          clicks_count?: number
          cost_to_ignore?: number | null
          created_at?: string
          description?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          market_data?: Json | null
          potential_savings?: number | null
          priority?: string
          title?: string
          type?: string
          updated_at?: string
          urgency_timeframe?: string | null
          vehicle_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "proactive_insights_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "user_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_alerts: {
        Row: {
          action_required: boolean | null
          action_taken: string | null
          alert_type: string
          created_at: string
          description: string
          escalated_at: string | null
          escalated_to: string | null
          evidence: Json | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          shop_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          action_required?: boolean | null
          action_taken?: string | null
          alert_type: string
          created_at?: string
          description: string
          escalated_at?: string | null
          escalated_to?: string | null
          evidence?: Json | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          shop_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_required?: boolean | null
          action_taken?: string | null
          alert_type?: string
          created_at?: string
          description?: string
          escalated_at?: string | null
          escalated_to?: string | null
          evidence?: Json | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          shop_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_alerts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          cost_estimate_details: Json | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          diagnosis_code: string | null
          diagnosis_diy_feasibility: string | null
          diagnosis_title: string
          diagnosis_urgency: string | null
          estimated_cost_high: number | null
          estimated_cost_low: number | null
          financing_interested: boolean
          id: string
          metro_area: string | null
          photo_urls: string[] | null
          referral_requested_at: string | null
          referral_token: string | null
          status: string
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_trim: string | null
          vehicle_year: string | null
          zip_code: string
        }
        Insert: {
          cost_estimate_details?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          diagnosis_code?: string | null
          diagnosis_diy_feasibility?: string | null
          diagnosis_title: string
          diagnosis_urgency?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          financing_interested?: boolean
          id?: string
          metro_area?: string | null
          photo_urls?: string[] | null
          referral_requested_at?: string | null
          referral_token?: string | null
          status?: string
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          zip_code: string
        }
        Update: {
          cost_estimate_details?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          diagnosis_code?: string | null
          diagnosis_diy_feasibility?: string | null
          diagnosis_title?: string
          diagnosis_urgency?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          financing_interested?: boolean
          id?: string
          metro_area?: string | null
          photo_urls?: string[] | null
          referral_requested_at?: string | null
          referral_token?: string | null
          status?: string
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      recall_alerts: {
        Row: {
          campaign_number: string
          component: string
          consequence: string | null
          created_at: string
          email_sent: boolean
          id: string
          is_read: boolean
          priority: string
          remedy: string | null
          summary: string
          vehicle_id: string
        }
        Insert: {
          campaign_number: string
          component: string
          consequence?: string | null
          created_at?: string
          email_sent?: boolean
          id?: string
          is_read?: boolean
          priority?: string
          remedy?: string | null
          summary: string
          vehicle_id: string
        }
        Update: {
          campaign_number?: string
          component?: string
          consequence?: string | null
          created_at?: string
          email_sent?: boolean
          id?: string
          is_read?: boolean
          priority?: string
          remedy?: string | null
          summary?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recall_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "user_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_events: {
        Row: {
          created_at: string
          diagnosis_title: string | null
          event_type: string
          id: string
          metadata: Json | null
          quote_request_id: string | null
          referral_token: string
          shop_id: string | null
          shop_name: string | null
          source: string
          source_key_hash: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          zip_code: string | null
        }
        Insert: {
          created_at?: string
          diagnosis_title?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          quote_request_id?: string | null
          referral_token: string
          shop_id?: string | null
          shop_name?: string | null
          source?: string
          source_key_hash?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Update: {
          created_at?: string
          diagnosis_title?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          quote_request_id?: string | null
          referral_token?: string
          shop_id?: string | null
          shop_name?: string | null
          source?: string
          source_key_hash?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_packages: {
        Row: {
          audio_clip_url: string | null
          chat_summary: string | null
          cost_estimate_details: Json | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          diagnosis_code: string | null
          diagnosis_details: Json | null
          diagnosis_title: string
          diagnosis_urgency: string | null
          diy_feasibility: string | null
          estimated_cost_high: number | null
          estimated_cost_low: number | null
          expires_at: string
          id: string
          metro_area: string | null
          pdf_download_count: number
          photo_urls: string[] | null
          quote_request_id: string | null
          token: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_trim: string | null
          vehicle_year: string | null
          video_frame_urls: string[] | null
          view_count: number
          vin: string | null
          zip_code: string | null
        }
        Insert: {
          audio_clip_url?: string | null
          chat_summary?: string | null
          cost_estimate_details?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          diagnosis_code?: string | null
          diagnosis_details?: Json | null
          diagnosis_title: string
          diagnosis_urgency?: string | null
          diy_feasibility?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          expires_at?: string
          id?: string
          metro_area?: string | null
          pdf_download_count?: number
          photo_urls?: string[] | null
          quote_request_id?: string | null
          token?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          video_frame_urls?: string[] | null
          view_count?: number
          vin?: string | null
          zip_code?: string | null
        }
        Update: {
          audio_clip_url?: string | null
          chat_summary?: string | null
          cost_estimate_details?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          diagnosis_code?: string | null
          diagnosis_details?: Json | null
          diagnosis_title?: string
          diagnosis_urgency?: string | null
          diy_feasibility?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          expires_at?: string
          id?: string
          metro_area?: string | null
          pdf_download_count?: number
          photo_urls?: string[] | null
          quote_request_id?: string | null
          token?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_year?: string | null
          video_frame_urls?: string[] | null
          view_count?: number
          vin?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_packages_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_history: {
        Row: {
          cost_actual: number | null
          created_at: string | null
          description: string
          id: string
          mileage_at: number | null
          notes: string | null
          repair_date: string | null
          session_id: string | null
          shop_name: string | null
          vehicle_id: string | null
        }
        Insert: {
          cost_actual?: number | null
          created_at?: string | null
          description: string
          id?: string
          mileage_at?: number | null
          notes?: string | null
          repair_date?: string | null
          session_id?: string | null
          shop_name?: string | null
          vehicle_id?: string | null
        }
        Update: {
          cost_actual?: number | null
          created_at?: string | null
          description?: string
          id?: string
          mileage_at?: number | null
          notes?: string | null
          repair_date?: string | null
          session_id?: string | null
          shop_name?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_outcomes: {
        Row: {
          cost_variance: number | null
          cost_variance_percent: number | null
          created_at: string
          customer_feedback: string | null
          customer_issues_since_repair: boolean | null
          customer_reported_at: string | null
          customer_satisfaction: number | null
          customer_would_return: boolean | null
          diagnosis_match: boolean | null
          diagnosis_record_id: string
          id: string
          rework_details: string | null
          rework_required: boolean | null
          shop_actual_cost: number | null
          shop_actual_diagnosis: string | null
          shop_id: string | null
          shop_labor_hours: number | null
          shop_notes: string | null
          shop_parts_used: Json | null
          shop_reported_at: string | null
          updated_at: string
        }
        Insert: {
          cost_variance?: number | null
          cost_variance_percent?: number | null
          created_at?: string
          customer_feedback?: string | null
          customer_issues_since_repair?: boolean | null
          customer_reported_at?: string | null
          customer_satisfaction?: number | null
          customer_would_return?: boolean | null
          diagnosis_match?: boolean | null
          diagnosis_record_id: string
          id?: string
          rework_details?: string | null
          rework_required?: boolean | null
          shop_actual_cost?: number | null
          shop_actual_diagnosis?: string | null
          shop_id?: string | null
          shop_labor_hours?: number | null
          shop_notes?: string | null
          shop_parts_used?: Json | null
          shop_reported_at?: string | null
          updated_at?: string
        }
        Update: {
          cost_variance?: number | null
          cost_variance_percent?: number | null
          created_at?: string
          customer_feedback?: string | null
          customer_issues_since_repair?: boolean | null
          customer_reported_at?: string | null
          customer_satisfaction?: number | null
          customer_would_return?: boolean | null
          diagnosis_match?: boolean | null
          diagnosis_record_id?: string
          id?: string
          rework_details?: string | null
          rework_required?: boolean | null
          shop_actual_cost?: number | null
          shop_actual_diagnosis?: string | null
          shop_id?: string | null
          shop_labor_hours?: number | null
          shop_notes?: string | null
          shop_parts_used?: Json | null
          shop_reported_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_outcomes_diagnosis_record_id_fkey"
            columns: ["diagnosis_record_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_outcomes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_recommendations: {
        Row: {
          action: string
          created_at: string | null
          id: string
          next_steps: string[] | null
          parts_likely_needed: string[] | null
          questions_to_ask_mechanic: string[] | null
          session_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          next_steps?: string[] | null
          parts_likely_needed?: string[] | null
          questions_to_ask_mechanic?: string[] | null
          session_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          next_steps?: string[] | null
          parts_likely_needed?: string[] | null
          questions_to_ask_mechanic?: string[] | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          address: string
          availability: string | null
          booking_url: string | null
          city: string | null
          created_at: string
          data_source: string
          data_source_id: string | null
          dealer_brands: string[] | null
          external_id: string | null
          id: string
          is_active: boolean | null
          is_dealer: boolean | null
          is_franchise: boolean
          is_partnered: boolean | null
          last_refreshed_at: string | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          price_tier: string | null
          quote_url: string | null
          rating: number | null
          response_time: string | null
          review_count: number | null
          specialties: string[] | null
          state: string | null
          updated_at: string
          wrenchli_verified: boolean | null
          zip_code: string
        }
        Insert: {
          address: string
          availability?: string | null
          booking_url?: string | null
          city?: string | null
          created_at?: string
          data_source?: string
          data_source_id?: string | null
          dealer_brands?: string[] | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_dealer?: boolean | null
          is_franchise?: boolean
          is_partnered?: boolean | null
          last_refreshed_at?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          price_tier?: string | null
          quote_url?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string
          wrenchli_verified?: boolean | null
          zip_code: string
        }
        Update: {
          address?: string
          availability?: string | null
          booking_url?: string | null
          city?: string | null
          created_at?: string
          data_source?: string
          data_source_id?: string | null
          dealer_brands?: string[] | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_dealer?: boolean | null
          is_franchise?: boolean
          is_partnered?: boolean | null
          last_refreshed_at?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          price_tier?: string | null
          quote_url?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string
          wrenchli_verified?: boolean | null
          zip_code?: string
        }
        Relationships: []
      }
      shop_accounts: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_verified: boolean | null
          owner_name: string | null
          shop_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          owner_name?: string | null
          shop_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean | null
          owner_name?: string | null
          shop_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_accounts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_applications: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          owner_name: string | null
          phone: string | null
          shop_name: string
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          owner_name?: string | null
          phone?: string | null
          shop_name: string
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          owner_name?: string | null
          phone?: string | null
          shop_name?: string
          state?: string | null
        }
        Relationships: []
      }
      shop_integrations: {
        Row: {
          api_key_encrypted: string | null
          api_key_iv: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_status: string | null
          shop_id: string
          shop_location_id: string | null
          sms_provider: string
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_key_iv?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          shop_id: string
          shop_location_id?: string | null
          sms_provider: string
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_key_iv?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          shop_id?: string
          shop_location_id?: string | null
          sms_provider?: string
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_integrations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_interest_events: {
        Row: {
          created_at: string
          id: string
          shop_address: string | null
          shop_id: string
          shop_name: string
          shop_type: string | null
          source: string | null
          user_email: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          zip_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          shop_address?: string | null
          shop_id: string
          shop_name: string
          shop_type?: string | null
          source?: string | null
          user_email?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          shop_address?: string | null
          shop_id?: string
          shop_name?: string
          shop_type?: string | null
          source?: string | null
          user_email?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      shop_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          diagnosis_record_id: string
          estimated_completion: string | null
          estimated_cost: number | null
          final_cost: number | null
          id: string
          price_approved_by_customer: boolean | null
          shop_diagnosis_notes: string | null
          shop_id: string
          shop_parts_ordered: Json | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          diagnosis_record_id: string
          estimated_completion?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          price_approved_by_customer?: boolean | null
          shop_diagnosis_notes?: string | null
          shop_id: string
          shop_parts_ordered?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          diagnosis_record_id?: string
          estimated_completion?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          price_approved_by_customer?: boolean | null
          shop_diagnosis_notes?: string | null
          shop_id?: string
          shop_parts_ordered?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_jobs_diagnosis_record_id_fkey"
            columns: ["diagnosis_record_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_jobs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_performance_metrics: {
        Row: {
          avg_consumer_satisfaction: number | null
          computed_at: string | null
          cost_percentile_by_repair: Json | null
          cost_percentile_local: number | null
          id: string
          period_start: string
          response_time_avg_hours: number | null
          shop_id: string
          symptom_match_rate: number | null
          verified_repairs_count: number | null
        }
        Insert: {
          avg_consumer_satisfaction?: number | null
          computed_at?: string | null
          cost_percentile_by_repair?: Json | null
          cost_percentile_local?: number | null
          id?: string
          period_start: string
          response_time_avg_hours?: number | null
          shop_id: string
          symptom_match_rate?: number | null
          verified_repairs_count?: number | null
        }
        Update: {
          avg_consumer_satisfaction?: number | null
          computed_at?: string | null
          cost_percentile_by_repair?: Json | null
          cost_percentile_local?: number | null
          id?: string
          period_start?: string
          response_time_avg_hours?: number | null
          shop_id?: string
          symptom_match_rate?: number | null
          verified_repairs_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_performance_metrics_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_recommendations: {
        Row: {
          created_at: string
          id: string
          recommendation_reason: string | null
          recommender_email: string | null
          recommender_name: string | null
          shop_location: string
          shop_name: string
          specializations: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          recommendation_reason?: string | null
          recommender_email?: string | null
          recommender_name?: string | null
          shop_location: string
          shop_name: string
          specializations?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          recommendation_reason?: string | null
          recommender_email?: string | null
          recommender_name?: string | null
          shop_location?: string
          shop_name?: string
          specializations?: string[] | null
        }
        Relationships: []
      }
      shop_repair_confirmations: {
        Row: {
          actual_labor_rate: number | null
          actual_parts_cost: number | null
          actual_total_cost: number | null
          confirmed_at: string | null
          confirmed_issue: string
          created_at: string | null
          id: string
          parts_quality: Database["public"]["Enums"]["parts_quality"] | null
          repair_order_id: string | null
          session_id: string | null
          shop_id: string | null
          shop_integration_id: string | null
          technician_notes: string | null
        }
        Insert: {
          actual_labor_rate?: number | null
          actual_parts_cost?: number | null
          actual_total_cost?: number | null
          confirmed_at?: string | null
          confirmed_issue: string
          created_at?: string | null
          id?: string
          parts_quality?: Database["public"]["Enums"]["parts_quality"] | null
          repair_order_id?: string | null
          session_id?: string | null
          shop_id?: string | null
          shop_integration_id?: string | null
          technician_notes?: string | null
        }
        Update: {
          actual_labor_rate?: number | null
          actual_parts_cost?: number | null
          actual_total_cost?: number | null
          confirmed_at?: string | null
          confirmed_issue?: string
          created_at?: string | null
          id?: string
          parts_quality?: Database["public"]["Enums"]["parts_quality"] | null
          repair_order_id?: string | null
          session_id?: string | null
          shop_id?: string | null
          shop_integration_id?: string | null
          technician_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_repair_confirmations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_repair_confirmations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_repair_confirmations_shop_integration_id_fkey"
            columns: ["shop_integration_id"]
            isOneToOne: false
            referencedRelation: "shop_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_search_logs: {
        Row: {
          city_resolved: string | null
          id: string
          results_count: number
          searched_at: string
          service_type: string | null
          state: string | null
          vehicle_make: string | null
          zip_code: string
        }
        Insert: {
          city_resolved?: string | null
          id?: string
          results_count?: number
          searched_at?: string
          service_type?: string | null
          state?: string | null
          vehicle_make?: string | null
          zip_code: string
        }
        Update: {
          city_resolved?: string | null
          id?: string
          results_count?: number
          searched_at?: string
          service_type?: string | null
          state?: string | null
          vehicle_make?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          bay_count: string | null
          created_at: string | null
          email: string | null
          id: string
          is_pilot: boolean | null
          name: string
          owner_name: string | null
          owner_user_id: string | null
          phone: string | null
          slug: string | null
          updated_at: string | null
          verified_status: string | null
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          bay_count?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_pilot?: boolean | null
          name: string
          owner_name?: string | null
          owner_user_id?: string | null
          phone?: string | null
          slug?: string | null
          updated_at?: string | null
          verified_status?: string | null
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          bay_count?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_pilot?: boolean | null
          name?: string
          owner_name?: string | null
          owner_user_id?: string | null
          phone?: string | null
          slug?: string | null
          updated_at?: string | null
          verified_status?: string | null
        }
        Relationships: []
      }
      symptom_reports: {
        Row: {
          created_at: string | null
          id: string
          primary_symptom: string
          raw_description: string | null
          session_id: string | null
          severity: Database["public"]["Enums"]["severity_level"] | null
          symptom_location: string | null
          warning_lights: string[] | null
          when_it_happens: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          primary_symptom: string
          raw_description?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["severity_level"] | null
          symptom_location?: string | null
          warning_lights?: string[] | null
          when_it_happens?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          primary_symptom?: string
          raw_description?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["severity_level"] | null
          symptom_location?: string | null
          warning_lights?: string[] | null
          when_it_happens?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "symptom_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_vehicles: {
        Row: {
          annual_mileage_estimate: number | null
          body_type: string | null
          color: string | null
          created_at: string
          current_mileage: number | null
          drive_type: string | null
          driving_style: string | null
          engine: string | null
          fuel_type: string | null
          id: string
          is_active: boolean | null
          last_mileage_update: string | null
          location_zip: string | null
          make: string
          model: string
          nickname: string | null
          purchase_date: string | null
          purchase_mileage: number | null
          purchase_price: number | null
          transmission: string | null
          trim: string | null
          updated_at: string
          usage_type: string | null
          user_id: string
          vin: string | null
          year: number
        }
        Insert: {
          annual_mileage_estimate?: number | null
          body_type?: string | null
          color?: string | null
          created_at?: string
          current_mileage?: number | null
          drive_type?: string | null
          driving_style?: string | null
          engine?: string | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean | null
          last_mileage_update?: string | null
          location_zip?: string | null
          make: string
          model: string
          nickname?: string | null
          purchase_date?: string | null
          purchase_mileage?: number | null
          purchase_price?: number | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          usage_type?: string | null
          user_id: string
          vin?: string | null
          year: number
        }
        Update: {
          annual_mileage_estimate?: number | null
          body_type?: string | null
          color?: string | null
          created_at?: string
          current_mileage?: number | null
          drive_type?: string | null
          driving_style?: string | null
          engine?: string | null
          fuel_type?: string | null
          id?: string
          is_active?: boolean | null
          last_mileage_update?: string | null
          location_zip?: string | null
          make?: string
          model?: string
          nickname?: string | null
          purchase_date?: string | null
          purchase_mileage?: number | null
          purchase_price?: number | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          usage_type?: string | null
          user_id?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      vehicle_known_issues: {
        Row: {
          category: string | null
          complaint_count: number | null
          confidence_score: number
          created_at: string
          description: string
          estimated_cost: string | null
          id: string
          make: string
          mileage_max: number | null
          mileage_min: number | null
          model: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          source: string
          source_url: string | null
          status: string
          tags: string[] | null
          updated_at: string
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          category?: string | null
          complaint_count?: number | null
          confidence_score?: number
          created_at?: string
          description: string
          estimated_cost?: string | null
          id?: string
          make: string
          mileage_max?: number | null
          mileage_min?: number | null
          model?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          source?: string
          source_url?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          category?: string | null
          complaint_count?: number | null
          confidence_score?: number
          created_at?: string
          description?: string
          estimated_cost?: string | null
          id?: string
          make?: string
          mileage_max?: number | null
          mileage_min?: number | null
          model?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          source?: string
          source_url?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: []
      }
      vehicle_value_history: {
        Row: {
          confidence_score: number | null
          cost_ratio: number | null
          estimated_value: number
          id: string
          recommendation_type: string | null
          recorded_at: string
          repair_cost_context: number | null
          source: string | null
          vehicle_id: string
        }
        Insert: {
          confidence_score?: number | null
          cost_ratio?: number | null
          estimated_value: number
          id?: string
          recommendation_type?: string | null
          recorded_at?: string
          repair_cost_context?: number | null
          source?: string | null
          vehicle_id: string
        }
        Update: {
          confidence_score?: number | null
          cost_ratio?: number | null
          estimated_value?: number
          id?: string
          recommendation_type?: string | null
          recorded_at?: string
          repair_cost_context?: number | null
          source?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_value_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "user_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          decoded_specs: Json | null
          id: string
          make: string
          mileage: number | null
          model: string
          nickname: string | null
          trim: string | null
          updated_at: string | null
          user_id: string | null
          vin: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          decoded_specs?: Json | null
          id?: string
          make: string
          mileage?: number | null
          model: string
          nickname?: string | null
          trim?: string | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          decoded_specs?: Json | null
          id?: string
          make?: string
          mileage?: number | null
          model?: string
          nickname?: string | null
          trim?: string | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      youtube_search_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          query_hash: string
          results: Json
          search_query: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          query_hash: string
          results?: Json
          search_query: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          query_hash?: string
          results?: Json
          search_query?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_edge_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_youtube_cache: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      confidence_level: "low" | "medium" | "high"
      diy_difficulty: "easy" | "moderate" | "professional_only"
      parts_quality: "OEM" | "aftermarket" | "remanufactured" | "mixed"
      problem_fixed_status: "yes" | "no" | "partial"
      session_status:
        | "intake"
        | "diagnosing"
        | "complete"
        | "abandoned"
        | "outcome_reported"
      severity_level: "minor" | "moderate" | "urgent" | "do_not_drive"
      urgency_level: "monitor" | "schedule" | "soon" | "immediate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      confidence_level: ["low", "medium", "high"],
      diy_difficulty: ["easy", "moderate", "professional_only"],
      parts_quality: ["OEM", "aftermarket", "remanufactured", "mixed"],
      problem_fixed_status: ["yes", "no", "partial"],
      session_status: [
        "intake",
        "diagnosing",
        "complete",
        "abandoned",
        "outcome_reported",
      ],
      severity_level: ["minor", "moderate", "urgent", "do_not_drive"],
      urgency_level: ["monitor", "schedule", "soon", "immediate"],
    },
  },
} as const
