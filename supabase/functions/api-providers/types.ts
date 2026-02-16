export const BASE_URL = "https://wrenchli.lovable.app";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

export interface ServiceProvider {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  address: string;
  phone: string;
  distance_miles: number;
  specialties: string[];
  price_tier: "budget" | "mid" | "premium";
  response_time: string;
  availability: "same_day" | "next_day" | "within_week";
  wrenchli_verified: boolean;
  quote_url: string;
  booking_url?: string;
}
