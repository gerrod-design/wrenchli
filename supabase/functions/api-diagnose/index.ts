import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleApiDiagnose } from "../_shared/api-diagnose-handler.ts";

// Public assessment API. The original endpoint name (api-diagnose) is the
// live contract and is kept; /api-assess is the assessment-named alias.
serve(async (req) => handleApiDiagnose(req, "api-diagnose"));
