import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const defaultResetUrl = "https://wrenchli.lovable.app/reset-password";
    let safeRedirectTo = typeof redirectTo === "string" && redirectTo.trim().length > 0
      ? redirectTo
      : defaultResetUrl;

    // Preview links can 404 outside the active preview session; force published URL instead.
    if (
      safeRedirectTo.includes("lovableproject.com") ||
      safeRedirectTo.includes("id-preview--")
    ) {
      safeRedirectTo = defaultResetUrl;
    }

    // Generate the password reset link using the admin API
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: safeRedirectTo },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error("Generate link error:", linkError);
      // Don't reveal whether the email exists
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a direct link to the app with token_hash, bypassing Supabase's redirect
    // which can 404 if the redirect URL isn't in the allowed list
    const hashedToken = data.properties.hashed_token;
    const resetLink = `${safeRedirectTo}?token_hash=${hashedToken}&type=recovery`;

    // Send email via Resend with the link as plain text URL
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wrenchli <onboarding@resend.dev>",
        to: [email],
        subject: "Reset Your Wrenchli Password",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 16px;">
            <div style="max-width: 480px; margin: 0 auto;">
              <!-- Header -->
              <div style="background-color: #1E3A5F; border-radius: 12px 12px 0 0; padding: 32px 24px; text-align: center;">
                <img src="https://etytcjxqqjzpalehqoib.supabase.co/storage/v1/object/public/damage-photos/branding%2Fwrenchli-logo.jpeg" alt="Wrenchli" width="56" height="56" style="border-radius: 12px; margin: 0 auto 16px; display: block;" />
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px;">Reset Your Password</h1>
              </div>
              <!-- Body -->
              <div style="background-color: #ffffff; padding: 32px 24px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                  We received a request to reset the password for your Wrenchli account. Use the button below or copy the link to set a new password.
                </p>
                <!-- CTA Button -->
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetLink}" style="display: inline-block; background-color: #E67E22; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">Reset Password</a>
                </div>
                <!-- Fallback link -->
                <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">Or copy and paste this link into your browser:</p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 0 0 24px; word-break: break-all;">
                  <a href="${resetLink}" style="color: #1E3A5F; font-size: 13px; text-decoration: underline;">${resetLink}</a>
                </div>
                <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                  If you didn't request this, you can safely ignore this email. This link will expire shortly.
                </p>
              </div>
              <!-- Footer -->
              <div style="background-color: #f8fafc; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; padding: 20px 24px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Wrenchli — Your Car Care Companion</p>
              </div>
            </div>
          </div>
        `,
        text: `Reset Your Wrenchli Password\n\nWe received a request to reset the password for your Wrenchli account.\n\nCopy and paste this link into your browser to set a new password:\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email. This link will expire shortly.\n\n— Wrenchli, Your Car Care Companion`,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
