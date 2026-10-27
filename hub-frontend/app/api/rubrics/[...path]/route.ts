import { NextResponse } from "next/server";
import { proxyJson, proxyToBackend } from "@/app/api/proxy";

type Params = Promise<{ path: string[] }>;

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

function invalidPath(): NextResponse {
  return NextResponse.json({ error: "Invalid path" }, { status: 400 });
}

function rubricsBackendPath(path: string[]): string | null {
  if (path.some((segment) => !SAFE_SEGMENT.test(segment))) {
    return null;
  }

  return `/rubrics/${path.join("/")}`;
}

async function handle(
  request: Request,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string[],
): Promise<NextResponse> {
  const url = rubricsBackendPath(path);

  if (url === null) {
    return invalidPath();
  }

  if (method === "GET") {
    return proxyToBackend(request, url, { cache: "no-store" });
  }

  if (method === "DELETE") {
    return proxyToBackend(request, url, { method: "DELETE" });
  }

  return proxyJson(request, url, method);
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { path } = await params;
  return handle(request, "GET", path);
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { path } = await params;
  return handle(request, "POST", path);
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { path } = await params;
  return handle(request, "PATCH", path);
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const { path } = await params;
  return handle(request, "DELETE", path);
}
