import { NextResponse } from "next/server";
import { proxyJson, proxyToBackend } from "@/app/api/proxy";

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

type CatchAllContext = {
  params: Promise<{ path: string[] }>;
};

type ProxyMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ProxyRouteOptions = {
  /** Prefijo del backend al que se reenvía la petición. */
  backendPrefix: string;
  /** Reenvía el query string de la petición original. */
  includeSearch?: boolean;
  /** Indica si la respuesta debe transmitirse sin bufferizar. */
  isStreamPath?: (path: string[]) => boolean;
  /** Indica si el POST es una subida multipart que debe transmitirse. */
  isMultipartUpload?: (path: string[]) => boolean;
};

type ProxyHandler = (
  request: Request,
  context: CatchAllContext,
) => Promise<NextResponse>;

export type ProxyRouteHandlers = Record<ProxyMethod, ProxyHandler>;

function invalidPath(): NextResponse {
  return NextResponse.json({ error: "Invalid path" }, { status: 400 });
}

/**
 * Convierte los segmentos decodificados en la ruta del backend, validando que
 * cada segmento solo contenga caracteres seguros (letras, dígitos, guion y
 * guion bajo). Esto bloquea el path traversal (`..`, `%2f`, barras inversas…)
 * que Next decodifica antes de entregar `path`.
 */
function backendPath(
  path: string[],
  backendPrefix: string,
  search: string,
): string | null {
  if (path.some((segment) => !SAFE_SEGMENT.test(segment))) {
    return null;
  }

  return `${backendPrefix}/${path.join("/")}${search}`;
}

async function handleProxyRequest(
  request: Request,
  method: ProxyMethod,
  path: string[],
  options: ProxyRouteOptions,
): Promise<NextResponse> {
  const search = options.includeSearch ? new URL(request.url).search : "";
  const url = backendPath(path, options.backendPrefix, search);

  if (url === null) {
    return invalidPath();
  }

  if (method === "GET") {
    return proxyToBackend(request, url, {
      cache: "no-store",
      stream: options.isStreamPath?.(path) ?? false,
    });
  }

  if (method === "POST" && options.isMultipartUpload?.(path)) {
    const contentType = request.headers.get("content-type") ?? "";

    return proxyToBackend(request, url, {
      method: "POST",
      body: request.body,
      duplex: "half",
      headers: contentType ? { "Content-Type": contentType } : {},
    });
  }

  if (method === "DELETE") {
    return proxyToBackend(request, url, { method: "DELETE" });
  }

  return proxyJson(request, url, method);
}

/**
 * Fábrica de route handlers para los proxies catch-all del BFF. Las rutas solo
 * declaran su prefijo y qué peticiones necesitan streaming o multipart.
 */
export function createProxyRouteHandlers(
  options: ProxyRouteOptions,
): ProxyRouteHandlers {
  function handler(method: ProxyMethod): ProxyHandler {
    return async (
      request: Request,
      { params }: CatchAllContext,
    ): Promise<NextResponse> => {
      const { path } = await params;
      return handleProxyRequest(request, method, path, options);
    };
  }

  return {
    GET: handler("GET"),
    POST: handler("POST"),
    PUT: handler("PUT"),
    PATCH: handler("PATCH"),
    DELETE: handler("DELETE"),
  };
}
