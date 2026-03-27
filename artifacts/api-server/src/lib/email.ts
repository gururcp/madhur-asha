import nodemailer from "nodemailer";

const ADMIN_EMAILS = ["manishkeche26@gmail.com", "guru2rcp@gmail.com"];

function createTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

export async function sendAccessRequestEmail(user: { name: string; email: string; id: number }) {
  const transport = createTransport();
  if (!transport) return;

  const appUrl = process.env.APP_URL || "https://your-app.replit.app";
  const adminUrl = `${appUrl}/admin/users`;

  try {
    await transport.sendMail({
      from: `"Madhur Asha Portal" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAILS.join(", "),
      subject: `New Access Request — ${user.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #2DB87A;">New Portal Access Request</h2>
          <p><strong>${user.name}</strong> (${user.email}) has requested access to the Madhur Asha Enterprises Portal.</p>
          <p>Please review and approve or reject this request:</p>
          <a href="${adminUrl}" style="background:#2DB87A;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
            Review Request
          </a>
          <p style="color:#888;font-size:12px;margin-top:20px;">Madhur Asha Enterprises Portal</p>
        </div>
      `,
    });
  } catch (err) {
    // Email failure is non-fatal
  }
}

export async function sendApprovalEmail(user: { name: string; email: string }, role: string) {
  const transport = createTransport();
  if (!transport) return;

  const appUrl = process.env.APP_URL || "https://your-app.replit.app";

  const roleLabel = role === "admin" ? "Admin" : role === "customer_access" ? "Customer Access" : "Calculator Only";

  try {
    await transport.sendMail({
      from: `"Madhur Asha Portal" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Your access has been approved — Madhur Asha Enterprises Portal",
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #2DB87A;">Access Approved!</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your access to the Madhur Asha Enterprises Portal has been approved with <strong>${roleLabel}</strong> access.</p>
          <a href="${appUrl}" style="background:#2DB87A;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
            Open Portal
          </a>
          <p style="color:#888;font-size:12px;margin-top:20px;">Madhur Asha Enterprises Portal</p>
        </div>
      `,
    });
  } catch (err) {
    // Email failure is non-fatal
  }
}
