import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MaintenanceEmailData {
  type: "maintenance";
  vehicleName: string;
  serviceLabel: string;
  priority: string;
  milesText: string;
  costLow: number;
  costHigh: number;
  summary: string;
}

interface MarketValueEmailData {
  type: "market_value";
  vehicleName: string;
  previousValue: number;
  currentValue: number;
  changePercent: number;
  changeDirection: string;
  summary: string;
}

type AlertEmailData = MaintenanceEmailData | MarketValueEmailData;

function buildMaintenanceEmail(data: MaintenanceEmailData): { subject: string; html: string } {
  const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
    overdue: { bg: "#FEE2E2", text: "#991B1B", label: "🔴 OVERDUE" },
    urgent: { bg: "#FEF3C7", text: "#92400E", label: "🟡 URGENT" },
    soon: { bg: "#DBEAFE", text: "#1E40AF", label: "🔵 COMING UP" },
  };
  const p = priorityColors[data.priority] || priorityColors.soon;

  return {
    subject: `Maintenance Reminder — ${data.serviceLabel} for your ${data.vehicleName}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1E3A5F,#2563EB);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🔧 Wrenchli</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Vehicle Maintenance Alert</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Hi there,</p>
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Your <strong>${data.vehicleName}</strong> has a maintenance item that needs attention:</p>
          <!-- Priority Badge -->
          <div style="background:${p.bg};border-radius:8px;padding:20px;margin:0 0 24px;">
            <span style="display:inline-block;background:${p.text};color:#fff;border-radius:4px;padding:4px 10px;font-size:12px;font-weight:700;margin:0 0 12px;">${p.label}</span>
            <h2 style="margin:0 0 8px;color:${p.text};font-size:20px;font-weight:700;">${data.serviceLabel}</h2>
            <p style="margin:0;color:#4B5563;font-size:15px;">${data.milesText} · Estimated cost: $${data.costLow}–$${data.costHigh}</p>
          </div>
          <p style="margin:0 0 28px;color:#6B7280;font-size:14px;line-height:1.6;">${data.summary}</p>
          <a href="https://wrenchli.lovable.app/garage" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">View Maintenance Schedule →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #E5E7EB;text-align:center;">
          <p style="margin:0;color:#9CA3AF;font-size:12px;">You're receiving this because you have maintenance email alerts enabled.<br>
          <a href="https://wrenchli.lovable.app/notification-settings" style="color:#6B7280;">Manage preferences</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}

function buildMarketValueEmail(data: MarketValueEmailData): { subject: string; html: string } {
  const isUp = data.changeDirection === "increase";
  const arrow = isUp ? "↑" : "↓";
  const emoji = isUp ? "📈" : "📉";
  const color = isUp ? "#059669" : "#D97706";
  const bgColor = isUp ? "#ECFDF5" : "#FFFBEB";
  const headline = isUp ? "Great news!" : "Heads up —";

  return {
    subject: `Your ${data.vehicleName} value changed ${arrow} ${data.changePercent.toFixed(1)}%`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1E3A5F,#2563EB);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">${emoji} Wrenchli</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Market Value Update</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">Hi there,</p>
          <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">${headline} Your <strong>${data.vehicleName}</strong> market value has <strong>${data.changeDirection}d</strong>:</p>
          <!-- Value Card -->
          <div style="background:${bgColor};border-radius:8px;padding:24px;margin:0 0 24px;text-align:center;">
            <p style="margin:0 0 8px;color:#6B7280;font-size:14px;">Market Value Shift</p>
            <h2 style="margin:0 0 4px;color:${color};font-size:28px;font-weight:800;">$${data.previousValue.toLocaleString()} → $${data.currentValue.toLocaleString()}</h2>
            <p style="margin:0;color:${color};font-size:18px;font-weight:700;">${arrow} ${data.changePercent.toFixed(1)}%</p>
          </div>
          <p style="margin:0 0 28px;color:#6B7280;font-size:14px;line-height:1.6;">${isUp ? "This could be a good time to evaluate your options." : "Market conditions may be shifting — keep an eye on trends."} Track your vehicle's value in your garage.</p>
          <a href="https://wrenchli.lovable.app/vehicle-insights" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">View Vehicle Insights →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #E5E7EB;text-align:center;">
          <p style="margin:0;color:#9CA3AF;font-size:12px;">You're receiving this because you have market value email alerts enabled.<br>
          <a href="https://wrenchli.lovable.app/notification-settings" style="color:#6B7280;">Manage preferences</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, alertData }: { to: string; alertData: AlertEmailData } = await req.json();

    if (!to || !alertData) {
      throw new Error("Missing required fields: to, alertData");
    }

    const { subject, html } =
      alertData.type === "maintenance"
        ? buildMaintenanceEmail(alertData as MaintenanceEmailData)
        : buildMarketValueEmail(alertData as MarketValueEmailData);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wrenchli <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending alert email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
