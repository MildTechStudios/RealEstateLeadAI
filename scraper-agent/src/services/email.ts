/**
 * Resend Email Service
 * 
 * Handles sending contact form emails via Resend.
 */

import { Resend } from 'resend';

// Initialize Resend client safely
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn('[Email] RESEND_API_KEY is not set. Email sending will be disabled.');
}
const resend = apiKey ? new Resend(apiKey) : null;

// The "From" email must be from your verified domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

interface ContactFormData {
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  message: string;
  agentName: string;
  agentEmail: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { visitorName, visitorEmail, visitorPhone, message, agentName, agentEmail } = data;

  try {
    if (!resend) {
      console.error('[Email] Cannot send email: Resend client not initialized (missing API key).');
      return { success: false, error: 'Email service not configured (missing API key)' };
    }

    console.log(`[Email] Sending contact email to ${agentEmail} from visitor ${visitorEmail}`);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      replyTo: visitorEmail,
      subject: `New Website Inquiry from ${visitorName}`,
      html: `
                <!-- Preview in browser to see the final result -->
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:40px 20px; background:#eef2f7; font-family: Arial, sans-serif;">

<div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header Bar -->
  <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 28px 32px; text-align:center;">
    <p style="margin:0; color:#f59e0b; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">Siteo</p>
    <h1 style="margin:8px 0 0 0; color:#ffffff; font-size:20px; font-weight:600;">New Contact Form Submission</h1>
  </div>

  <!-- Body -->
  <div style="padding: 28px 32px 20px;">

    <!-- Sender Card -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px 22px; margin-bottom:24px;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:7px 0; width:70px;">
            <span style="display:inline-block; background:#f59e0b; color:#fff; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px;">FROM</span>
          </td>
          <td style="padding:7px 0; color:#1e293b; font-weight:600; font-size:15px;">${visitorName}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;">
            <span style="display:inline-block; background:#cbd5e1; color:#475569; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px;">EMAIL</span>
          </td>
          <td style="padding:7px 0;">
            <a href="mailto:${visitorEmail}" style="color:#3b82f6; text-decoration:none; font-size:14px;">${visitorEmail}</a>
          </td>
        </tr>
        <!-- Phone row — only rendered if visitorPhone exists -->
        <!-- ${visitorPhone ? `
        <tr>
          <td style="padding:7px 0;">
            <span style="display:inline-block; background:#cbd5e1; color:#475569; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px;">PHONE</span>
          </td>
          <td style="padding:7px 0;">
            <a href="tel:${visitorPhone}" style="color:#3b82f6; text-decoration:none; font-size:14px;">${visitorPhone}</a>
          </td>
        </tr>
        ` : ''} -->
      </table>
    </div>

    <!-- Message Section -->
    <div style="margin-bottom:24px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <div style="width:3px; height:18px; background:#f59e0b; border-radius:2px;"></div>
        <h3 style="margin:0; color:#1e293b; font-size:15px; font-weight:600;">Message</h3>
      </div>
      <div style="background:#fafafa; border:1px solid #f1f5f9; border-radius:10px; padding:18px 20px;">
        <p style="margin:0; color:#334155; line-height:1.7; font-size:14px; white-space:pre-wrap;">${message}</p>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div style="background:#f1f5f9; border-top:1px solid #e2e8f0; padding:20px 32px; text-align:center;">
    <p style="margin:0 0 6px 0; color:#64748b; font-size:12px; line-height:1.5;">
      This is an <strong style="color:#475569;">automated notification</strong> — do not reply to this email.
    </p>
    <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.5;">
      To respond to ${visitorName}, please use their contact details above.
    </p>
    <p style="margin:16px 0 0 0; color:#cbd5e1; font-size:11px;">
      Sent via Siteo &middot; Contact Form Notification
    </p>
  </div>

</div>

</body>
</html>
            `,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Email sent successfully. ID: ${result?.id}`);
    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: err.message || 'Failed to send email' };
  }
}

interface WelcomeEmailData {
  agentName: string;
  agentEmail: string;
  websiteUrl: string;
  adminUrl: string;
  defaultPassword: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, websiteUrl, adminUrl, defaultPassword } = data;

  try {
    if (!resend) {
      console.error('[Email] Cannot send email: Resend client not initialized (missing API key).');
      return { success: false, error: 'Email service not configured (missing API key)' };
    }

    console.log(`[Email] Sending welcome email to ${agentEmail}`);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: `Your Website is Ready! - ${agentName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:40px 20px; background:#eef2f7; font-family: Arial, sans-serif;">

<div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header Bar -->
  <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 28px 32px; text-align:center;">
    <p style="margin:0; color:#f59e0b; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">Siteo</p>
    <h1 style="margin:8px 0 0 0; color:#ffffff; font-size:24px; font-weight:600;">🎉 Your Website is Live!</h1>
  </div>

  <!-- Body -->
  <div style="padding: 28px 32px 20px;">

    <p style="font-size:16px; color:#334155; line-height:1.7;">
      Hi <strong>${agentName}</strong>,
    </p>

    <p style="font-size:15px; color:#475569; line-height:1.7;">
      Great news! Your personalized real estate website has been created and is ready to start generating leads for you.
    </p>

    <!-- Website Link Card -->
    <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:20px 22px; margin:24px 0;">
      <p style="margin:0 0 10px 0; color:#166534; font-size:13px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Your Website</p>
      <a href="${websiteUrl}" style="color:#15803d; font-size:18px; font-weight:bold; text-decoration:none;">${websiteUrl}</a>
    </div>

    <p style="font-size:15px; color:#475569; line-height:1.7;">
      You also have access to an <strong>Admin Dashboard</strong> where you can customize your site, view leads, and manage your settings:
    </p>

    <!-- Admin Link Card -->
    <div style="background:#eff6ff; border:1px solid #93c5fd; border-radius:10px; padding:20px 22px; margin:24px 0;">
      <p style="margin:0 0 10px 0; color:#1e40af; font-size:13px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">Admin Console</p>
      <a href="${adminUrl}" style="color:#1d4ed8; font-size:16px; font-weight:bold; text-decoration:none;">${adminUrl}</a>
      <p style="margin:12px 0 0 0; color:#64748b; font-size:13px;">
        <strong>Default Password:</strong> <code style="background:#e2e8f0; padding:2px 8px; border-radius:4px; font-family:monospace;">${defaultPassword}</code>
      </p>
      <p style="margin:8px 0 0 0; color:#94a3b8; font-size:12px;">
        Please change your password after first login.
      </p>
    </div>

    <p style="font-size:15px; color:#475569; line-height:1.7;">
      If you have any questions, feel free to reach out!
    </p>

  </div>

  <!-- Footer -->
  <div style="background:#f1f5f9; border-top:1px solid #e2e8f0; padding:20px 32px; text-align:center;">
    <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.5;">
      Sent via Siteo &middot; Website Notification
    </p>
  </div>

</div>

</body>
</html>
      `,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Welcome email sent successfully. ID: ${result?.id}`);
    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: err.message || 'Failed to send email' };
  }
}
