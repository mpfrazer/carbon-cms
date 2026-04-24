import nodemailer from "nodemailer";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, users } from "@/lib/db/schema";

const SMTP_KEYS = ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom", "smtpSecure"];

async function getSmtpConfig(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings).where(inArray(settings.key, SMTP_KEYS));
  const cfg: Record<string, string> = {};
  for (const row of rows) {
    try { cfg[row.key] = JSON.parse(row.value); } catch { cfg[row.key] = row.value; }
  }
  return cfg;
}

function makeTransport(cfg: Record<string, string>) {
  return nodemailer.createTransport({
    host: cfg.smtpHost,
    port: parseInt(cfg.smtpPort ?? "587", 10),
    secure: cfg.smtpSecure === "true",
    auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPass ?? "" } : undefined,
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const cfg = await getSmtpConfig();
  if (!cfg.smtpHost) {
    console.warn("[email] SMTP not configured — skipping verification email to", to);
    return;
  }
  const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3003";
  const verifyUrl = `${siteUrl}/verify-email?token=${token}`;
  await makeTransport(cfg).sendMail({
    from: cfg.smtpFrom || cfg.smtpUser,
    to,
    subject: "Verify your email address",
    text: `Hi ${name},\n\nVerify your email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<p>Hi ${name},</p><p><a href="${verifyUrl}">Verify your email address</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const cfg = await getSmtpConfig();
  if (!cfg.smtpHost) {
    console.warn("[email] SMTP not configured — skipping password reset email to", to);
    return;
  }
  await makeTransport(cfg).sendMail({
    from: cfg.smtpFrom || cfg.smtpUser,
    to,
    subject: "Reset your password",
    text: `Hi ${name},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p>Hi ${name},</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
}

export async function sendCommentNotificationEmail(opts: {
  authorName: string;
  postTitle: string;
  postSlug: string;
  excerpt: string;
}) {
  const cfg = await getSmtpConfig();
  if (!cfg.smtpHost) return;

  const admins = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));
  if (admins.length === 0) return;

  const adminUrl = process.env.CARBON_ADMIN_URL ?? "http://localhost:3000";
  const commentsUrl = `${adminUrl}/admin/comments`;

  const subject = `New comment on "${opts.postTitle}"`;
  const text = [
    `${opts.authorName} left a comment on "${opts.postTitle}":`,
    ``,
    opts.excerpt,
    ``,
    `Review and moderate at: ${commentsUrl}`,
  ].join("\n");
  const html = [
    `<p><strong>${opts.authorName}</strong> left a comment on &ldquo;${opts.postTitle}&rdquo;:</p>`,
    `<blockquote style="border-left:3px solid #ccc;margin:0;padding:0 1em;color:#555">${opts.excerpt}</blockquote>`,
    `<p><a href="${commentsUrl}">Review and moderate comments</a></p>`,
  ].join("");

  const transport = makeTransport(cfg);
  await Promise.all(
    admins.map((admin) =>
      transport.sendMail({ from: cfg.smtpFrom || cfg.smtpUser, to: admin.email, subject, text, html })
    )
  );
}

export async function sendWelcomeEmail(to: string, name: string) {
  const cfg = await getSmtpConfig();
  if (!cfg.smtpHost) return;
  const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3003";
  await makeTransport(cfg).sendMail({
    from: cfg.smtpFrom || cfg.smtpUser,
    to,
    subject: "Welcome!",
    text: `Hi ${name},\n\nYour account is ready. Log in at ${siteUrl}/login`,
    html: `<p>Hi ${name},</p><p>Your account is ready. <a href="${siteUrl}/login">Log in here</a>.</p>`,
  });
}
