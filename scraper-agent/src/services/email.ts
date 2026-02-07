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
export const resend = apiKey ? new Resend(apiKey) : null;

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

    // Log to Database
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: `New Website Inquiry from ${visitorName}`,
          status: 'sent',
          resend_id: result?.id,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error('[Email] Failed to log to DB:', logErr);
    }

    console.log(`[Email] Email sent successfully. ID: ${result?.id}`);
    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Unexpected error:', err);
    // Log failure
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: `New Website Inquiry from ${visitorName}`,
          status: 'failed',
          error_message: err.message,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) { console.error('DB Log Error', logErr) }

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
    // Start with a strict check
    if (!resend) {
      console.error('[Email] Resend client not initialized');
      return { success: false, error: 'Email service not configured' };
    }

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: `Your Website is Ready! - ${agentName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Professional Website is Live</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <!-- Premium Header -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; text-align:center;">
      <p style="margin:0; color:#cbd5e1; font-size:12px; text-transform:uppercase; letter-spacing:3px; font-weight:700; opacity:0.9;">EXCLUSIVE PREVIEW</p>
      <h1 style="margin:12px 0 0 0; color:#ffffff; font-size:28px; font-weight:800; line-height:1.2;">Your Custom Website<br>Is Now Live.</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 32px;">

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        Hello <strong>${agentName}</strong>,
      </p>

      <p style="font-size:16px; color:#475569; line-height:1.6; margin-bottom:32px;">
        We noticed your impressive profile and took the initiative to build a <strong>high-performance, custom website</strong> tailored specifically for your real estate business.
      </p>

      <!-- Feature Highlight -->
      <div style="background-color:#eff6ff; border-radius:12px; padding:24px; margin-bottom:32px; border:1px solid #dbeafe;">
        <p style="margin:0 0 16px 0; font-size:14px; color:#1e40af; font-weight:700; text-transform:uppercase; letter-spacing:1px;">WHY UPGRADE?</p>
        <ul style="margin:0; padding-left:20px; color:#334155; font-size:15px; line-height:1.8;">
          <li>🚀 <strong>Instant Lead Capture:</strong> Optimized to convert visitors into clients.</li>
          <li>📱 <strong>Mobile Perfect:</strong> Looks stunning on every device.</li>
          <li>🎨 <strong>Fully Customizable:</strong> Update your brand in seconds.</li>
        </ul>
      </div>

      <p style="text-align:center; margin-bottom:32px;">
        <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:16px 32px; border-radius:50px; box-shadow:0 4px 6px -1px rgba(79, 70, 229, 0.3);">
          View My Live Website &rarr;
        </a>
      </p>

      <div style="border-top:1px solid #e2e8f0; margin:32px 0;"></div>

      <!-- Admin Access -->
      <h3 style="margin:0 0 16px 0; color:#1e293b; font-size:18px; font-weight:700;">Take Ownership & Customize</h3>
      <p style="font-size:15px; color:#64748b; line-height:1.6; margin-bottom:20px;">
        Want to edit the content, swap photos, or connect your own domain? Log in to your personal Admin Console here:
      </p>

      <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
        <p style="margin:0 0 8px 0; font-size:14px; color:#64748b;"><strong>Admin URL:</strong> <a href="${adminUrl}" style="color:#4f46e5; text-decoration:none;">${adminUrl}</a></p>
        <p style="margin:0; font-size:14px; color:#64748b;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0; padding:4px 8px; border-radius:4px; color:#0f172a; font-family:monospace; font-size:14px;">${defaultPassword}</code></p>
      </div>

      <p style="font-size:14px; color:#94a3b8; margin-top:16px;">
        <em>Access is free for 30 days. No credit card required to view.</em>
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color:#f1f5f9; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 8px 0; color:#64748b; font-size:12px; font-weight:600;">Siteo Automation Team</p>
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail} regarding your professional online presence.
      </p>
    </div>

  </div>

</body>
</html>
      `
    });

    if (error) throw error; // Handle error in catch

    // Log to Database
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: `Your Website is Ready! - ${agentName}`,
          status: 'sent',
          resend_id: result?.id,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error('[Email] Failed to log to DB:', logErr);
    }

    return { success: true, id: result?.id };

  } catch (err: any) {
    // Log failure
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: `Your Website is Ready! - ${agentName}`,
          status: 'failed',
          error_message: err.message,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) { }

    return { success: false, error: err.message };
  }
}
