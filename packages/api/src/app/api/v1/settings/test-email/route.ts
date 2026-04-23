import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";
import nodemailer from "nodemailer";

export async function POST() {
  try {
    const rows = await db.select().from(settings)
      .where(eq(settings.autoload, true));
    const cfg: Record<string, string> = {};
    for (const row of rows) {
      try { cfg[row.key] = JSON.parse(row.value); } catch { cfg[row.key] = row.value; }
    }

    if (!cfg.smtpHost) return badRequest("SMTP host not configured");
    if (!cfg.adminEmail && !cfg.smtpFrom) return badRequest("No recipient — set Admin email in General settings");

    const to = cfg.adminEmail || cfg.smtpFrom;
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost,
      port: parseInt(cfg.smtpPort ?? "587", 10),
      secure: cfg.smtpSecure === "true",
      auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPass ?? "" } : undefined,
    });

    await transporter.sendMail({
      from: cfg.smtpFrom || cfg.smtpUser,
      to,
      subject: "Carbon CMS — SMTP test",
      text: "If you received this, your SMTP configuration is working correctly.",
    });

    return ok({ sent: true });
  } catch (e) {
    return serverError(e);
  }
}
