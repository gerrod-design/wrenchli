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
      ad_click_events: {
        Row: {
          click_type: string
          created_at: string
          diagnosis_code: string | null
          diagnosis_title: string | null
          id: string
          item_brand: string | null
          item_category: string | null
          item_id: string | null
          item_price: string | null
          item_title: string | null
          placement: string | null
          source: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
        }
        Insert: {
          click_type: string
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_title?: string | null
          id?: string
          item_brand?: string | null
          item_category?: string | null
          item_id?: string | null
          item_price?: string | null
          item_title?: string | null
          placement?: string | null
          source?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Update: {
          click_type?: string
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_title?: string | null
          id?: string
          item_brand?: string | null
          item_category?: string | null
          item_id?: string | null
          item_price?: string | null
          item_title?: string | null
          placement?: string | null
          source?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Relationships: []
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
    },
  },
} as const
