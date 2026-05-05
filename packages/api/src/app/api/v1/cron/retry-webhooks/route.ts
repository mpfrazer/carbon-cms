import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { retryDueWebhooks } from "@/lib/webhook";

function isAuthorized(req: NextRequest): boolean {
  const bearer = req.headers.get("authorization");
  if (bearer === `Bearer ${process.env.AUTH_SECRET}`) return true;
  const vercelAuth = req.headers.get("x-vercel-cron-authorization");
  if (vercelAuth === `Bearer ${process.env.CRON_SECRET ?? process.env.AUTH_SECRET}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await retryDueWebhooks();
    if (result.attempted > 0) {
      console.log(
        `[cron] webhook retries: attempted=${result.attempted} succeeded=${result.succeeded} exhausted=${result.exhausted}`,
      );
    }
    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}
