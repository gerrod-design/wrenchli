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

    // Generate the password reset link using the admin API
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error("Generate link error:", linkError);
      // Don't reveal whether the email exists
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resetLink = data.properties.action_link;

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
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">Reset Your Password</h2>
            <p style="color: #555; line-height: 1.6;">
              We received a request to reset the password for your Wrenchli account. 
              Copy and paste the link below into your browser to set a new password:
            </p>
            <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin: 24px 0; word-break: break-all;">
              <a href="${resetLink}" style="color: #2563eb; font-size: 14px;">${resetLink}</a>
            </div>
            <p style="color: #555; line-height: 1.6; font-size: 14px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Wrenchli — Your Car Care Companion</p>
          </div>
        `,
        text: `Reset Your Wrenchli Password\n\nCopy and paste this link into your browser to set a new password:\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.\n\n— Wrenchli`,
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
