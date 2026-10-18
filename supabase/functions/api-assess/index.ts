import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleApiDiagnose } from "../_shared/api-diagnose-handler.ts";

// Assessment-named alias of /api-diagnose (audit R-35). Identical contract;
// the original name remains supported — new integrations should prefer
// this name.
serve(async (req) => handleApiDiagnose(req, "api-assess"));
