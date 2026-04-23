import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, errors?: unknown) {
  return NextResponse.json({ error: message, errors }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(error?: unknown) {
  if (error) console.error("[serverError]", error);
  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function paginated<T>(data: T[], total: number, page: number, pageSize: number) {
  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export function parsePagination(searchParams: URLSearchParams) {
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const pageSize = Math.min(100, Math.max(1, isNaN(rawSize) ? 20 : rawSize));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
