import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

function resolveBackendUrl() {
  if (!backendUrl) {
    return null;
  }
  return backendUrl;
}

export async function GET() {
  const resolvedUrl = resolveBackendUrl();

  if (!resolvedUrl) {
    return NextResponse.json(
      { error: "BACKEND_URL is not set" },
      { status: 500 },
    );
  }

  const response = await fetch(`${resolvedUrl}/projects`, {
    cache: "no-store",
  });
  const contentType =
    response.headers.get("content-type") ?? "application/json";
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": contentType },
  });
}

export async function POST(request: Request) {
  const resolvedUrl = resolveBackendUrl();

  if (!resolvedUrl) {
    return NextResponse.json(
      { error: "BACKEND_URL is not set" },
      { status: 500 },
    );
  }

  const payload = await request.json();
  const response = await fetch(`${resolvedUrl}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const contentType =
    response.headers.get("content-type") ?? "application/json";
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": contentType },
  });
}
