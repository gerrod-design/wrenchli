import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { parseScanReportText } from "./parser.ts";

// Scan report import (Path 2): reads ONE owner-uploaded PDF from the
// private garage-vehicle-media bucket, extracts its text, parses it with
// the pure parser in ./parser.ts, and stores an UNFILED scan_reports row
// (vehicle_id null). Filing to a vehicle happens later, in the app, only
// after the owner confirms the match — this function never files.
//
// Authorization is enforced twice:
//   1. The storage path must live under the caller's own user-id prefix.
//   2. Every storage/DB call below uses a caller-scoped client (anon key +
//      the caller's JWT), so storage policies and scan_reports RLS apply
//      exactly as they would to the app itself. The service-role key is
//      never used here.
//
// PDF text extraction: unpdf (pdf.js built for serverless/edge runtimes;
// it is the extraction library Supabase's own edge-function examples use
// for PDFs, needs no native binaries, and runs in Deno). The RS2 export
// is machine-generated text, so extraction is a read, not OCR. If
// extraction fails or yields nothing, the parse is stored as "unparsed"
// with zero codes — codes are never invented.

const GARAGE_MEDIA_BUCKET = "garage-vehicle-media";
const MAX_PDF_BYTES = 25 * 1024 * 1024;

async function getCallerUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  if (token === Deno.env.get("SUPABASE_ANON_KEY")) return null;
  if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  if ((data.claims as Record<string, unknown>).role !== "authenticated") return null;
  return data.claims.sub as string;
}

function callerClient(req: Request): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization")! } },
  });
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const unpdf = await import("https://esm.sh/unpdf@1.9.1");
    const pdf = await unpdf.getDocumentProxy(bytes);
    const { text } = await unpdf.extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : (text ?? "");
  } catch (error) {
    console.error("PDF text extraction failed:", error);
    return "";
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
      {
        status: 429,
        headers: {
          ...securityHeaders,
          ...getRateLimitHeaders(
            RATE_LIMITS.STRICT.maxRequests,
            rateResult.remaining,
            rateResult.resetTime,
          ),
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = await getCallerUserId(req);
    if (!callerUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const storagePath = body?.storage_path;
    const originalFilename =
      typeof body?.original_filename === "string" ? body.original_filename : null;

    if (
      typeof storagePath !== "string" ||
      !storagePath.startsWith(`${callerUserId}/`) ||
      storagePath.includes("..") ||
      !/\.pdf$/i.test(storagePath)
    ) {
      return new Response(
        JSON.stringify({
          error: "A PDF stored under your own Garage media is required.",
        }),
        { status: 400, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const client = callerClient(req);

    const { data: blob, error: downloadError } = await client.storage
      .from(GARAGE_MEDIA_BUCKET)
      .download(storagePath);
    if (downloadError || !blob) {
      return new Response(
        JSON.stringify({ error: "That file could not be read from your Garage media." }),
        { status: 404, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }
    if (blob.size > MAX_PDF_BYTES) {
      return new Response(
        JSON.stringify({ error: "That PDF is too large to read here." }),
        { status: 413, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = await extractPdfText(bytes);
    const parsed = parseScanReportText(text);

    const { data: row, error: insertError } = await client
      .from("scan_reports")
      .insert({
        owner_user_id: callerUserId,
        vehicle_id: null,
        timeline_event_id: null,
        source_tool: parsed.sourceTool,
        report_id: parsed.reportId,
        scanned_at: parsed.scannedAt,
        odometer: parsed.odometer,
        vin_fragment: parsed.vinFragment,
        vehicle_label: parsed.vehicleLabel,
        storage_bucket: GARAGE_MEDIA_BUCKET,
        storage_path: storagePath,
        original_filename: originalFilename,
        parse_status: parsed.parseStatus,
        parsed_payload: parsed,
      })
      .select("*")
      .single();

    if (insertError || !row) {
      console.error("scan_reports insert failed:", insertError);
      return new Response(
        JSON.stringify({ error: "The report could not be saved. Please try again." }),
        { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ scan_report: row, parsed }), {
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in parse-scan-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  }
});
