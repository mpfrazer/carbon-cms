export type PostStatus = "draft" | "published" | "scheduled" | "archived" | "in_review";

export function canSubmitForReview(status: string): boolean {
  return status === "draft";
}

export function canApprove(status: string): boolean {
  return status === "in_review";
}

export function canReject(status: string): boolean {
  return status === "in_review";
}
