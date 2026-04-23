import { describe, it, expect } from "vitest";

interface ScheduledPost {
  id: string;
  status: string;
  scheduledAt: Date | null;
}

function getPostsDueForPublishing(posts: ScheduledPost[], now: Date): ScheduledPost[] {
  return posts.filter(
    (p) => p.status === "scheduled" && p.scheduledAt !== null && p.scheduledAt <= now
  );
}

describe("getPostsDueForPublishing", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  it("returns posts whose scheduledAt is in the past", () => {
    const posts: ScheduledPost[] = [
      { id: "1", status: "scheduled", scheduledAt: new Date("2024-06-15T11:00:00Z") },
    ];
    expect(getPostsDueForPublishing(posts, now)).toHaveLength(1);
  });

  it("returns posts whose scheduledAt is exactly now", () => {
    const posts: ScheduledPost[] = [
      { id: "1", status: "scheduled", scheduledAt: now },
    ];
    expect(getPostsDueForPublishing(posts, now)).toHaveLength(1);
  });

  it("excludes posts whose scheduledAt is in the future", () => {
    const posts: ScheduledPost[] = [
      { id: "1", status: "scheduled", scheduledAt: new Date("2024-06-15T13:00:00Z") },
    ];
    expect(getPostsDueForPublishing(posts, now)).toHaveLength(0);
  });

  it("excludes posts that are not in scheduled status", () => {
    const posts: ScheduledPost[] = [
      { id: "1", status: "draft", scheduledAt: new Date("2024-06-15T11:00:00Z") },
      { id: "2", status: "published", scheduledAt: new Date("2024-06-15T11:00:00Z") },
    ];
    expect(getPostsDueForPublishing(posts, now)).toHaveLength(0);
  });

  it("excludes scheduled posts with a null scheduledAt", () => {
    const posts: ScheduledPost[] = [
      { id: "1", status: "scheduled", scheduledAt: null },
    ];
    expect(getPostsDueForPublishing(posts, now)).toHaveLength(0);
  });

  it("handles a mixed list correctly", () => {
    const posts: ScheduledPost[] = [
      { id: "1", status: "scheduled", scheduledAt: new Date("2024-06-15T11:00:00Z") }, // due
      { id: "2", status: "scheduled", scheduledAt: new Date("2024-06-15T13:00:00Z") }, // future
      { id: "3", status: "draft",     scheduledAt: new Date("2024-06-15T11:00:00Z") }, // wrong status
      { id: "4", status: "scheduled", scheduledAt: null },                              // no date
    ];
    const due = getPostsDueForPublishing(posts, now);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe("1");
  });

  it("returns empty array when no posts are provided", () => {
    expect(getPostsDueForPublishing([], now)).toHaveLength(0);
  });
});
