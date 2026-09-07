import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

function resolveBackendUrl() {
  if (!backendUrl) {
    return null;
  }
  return backendUrl;
}

export async function GET(request: Request) {
  const resolvedUrl = resolveBackendUrl();

  if (!resolvedUrl) {
    return NextResponse.json(
      { error: "BACKEND_URL is not set" },
      { status: 500 },
    );
  }

  const response = await fetch(`${resolvedUrl}/projects`, {
    headers: {
      ...(request.headers.get("authorization")
        ? { Authorization: request.headers.get("authorization")! }
        : {}),
    },
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
  const authorization = request.headers.get("authorization");
  const response = await fetch(`${resolvedUrl}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
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
