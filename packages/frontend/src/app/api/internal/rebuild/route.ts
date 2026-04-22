import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-carbon-internal");
  if (!secret || secret !== process.env.CARBON_INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire-and-forget: run the build in the background and update build status
  triggerRebuild().catch(console.error);

  return NextResponse.json({ status: "build_queued" });
}

async function triggerRebuild() {
  const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
  const internalSecret = process.env.CARBON_INTERNAL_SECRET ?? "";

  async function updateBuildStatus(status: string) {
    await fetch(`${apiUrl}/api/v1/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Carbon-Internal": internalSecret },
      body: JSON.stringify({ buildStatus: status }),
    }).catch(console.error);
  }

  try {
    await updateBuildStatus("building");
    await execAsync("npm run build", { cwd: process.cwd(), timeout: 120_000 });
    await updateBuildStatus("done");
    // Signal the process manager to restart (PM2, tini wrapper, etc.)
    // In Docker: write a sentinel file that a wrapper script watches
    await execAsync("touch .rebuild-complete").catch(() => null);
  } catch (err) {
    console.error("[rebuild] build failed:", err);
    await updateBuildStatus("error");
  }
}
