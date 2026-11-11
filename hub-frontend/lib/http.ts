/**
 * Utilidades compartidas para traducir respuestas fallidas de la API a errores
 * con mensajes consistentes.
 */
import { getApiUrl } from "./api";

export type ApiErrorOptions = {
  // Frase verbal que describe la acción, p. ej. "editar el proyecto".
  action: string;
  // Mensaje específico para respuestas 409 cuando el estado no lo permite.
  conflictMessage?: string;
};

export type ApiRequestOptions = ApiErrorOptions & {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

// Mensaje que se muestra cuando el servicio no responde.
export const SERVICE_UNAVAILABLE_MESSAGE =
  "El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.";

// Estados que indican que el backend o la base de datos no responden.
export function isServiceUnavailableStatus(
  status: number | undefined,
): boolean {
  return status === 502 || status === 503 || status === 504;
}

export async function readBackendMessage(
  response: Response,
  fallback = `Backend responded with status ${response.status}`,
): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(" ");
    }

    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // La respuesta no era JSON; se usa el mensaje genérico.
  }

  return fallback;
}

// Devuelve el mensaje de error de una respuesta. Los estados de servicio no
// disponible se traducen a un texto amigable en español.
export async function apiErrorMessage(response: Response): Promise<string> {
  if (isServiceUnavailableStatus(response.status)) {
    return SERVICE_UNAVAILABLE_MESSAGE;
  }

  return readBackendMessage(response);
}

export async function apiRequestError(
  response: Response,
  { action, conflictMessage }: ApiErrorOptions,
): Promise<Error> {
  if (response.status === 401) {
    return new Error(`Inicia sesión para ${action}.`);
  }

  if (response.status === 403) {
    return new Error(`No tienes permisos para ${action}.`);
  }

  if (response.status === 409 && conflictMessage) {
    return new Error(conflictMessage);
  }

  return new Error(await apiErrorMessage(response));
}

/**
 * Manejador global para sesiones rechazadas. Lo registra `AuthProvider` para
 * limpiar la sesión y redirigir al login; así ninguna pantalla maneja el 401
 * por su cuenta.
 */
type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler;
}

/**
 * Avisa que la API rechazó la sesión (401). Lo llaman `ensureOk` y los
 * fetchers que revisan `response.ok` a mano. El BFF limpia la cookie httpOnly
 * al reenviar la respuesta; aquí solo se reacciona al estado.
 */
export function notifyUnauthorized(): void {
  unauthorizedHandler?.();
}

export async function ensureOk(
  response: Response,
  options: ApiErrorOptions,
): Promise<void> {
  if (response.status === 401) {
    notifyUnauthorized();
  }

  if (!response.ok) {
    throw await apiRequestError(response, options);
  }
}

/**
 * Petición JSON genérica: resuelve la URL, envía el cuerpo como JSON y lanza un
 * error con mensaje consistente si la respuesta no es satisfactoria. Devuelve
 * la respuesta parseada. Los `GET` usan `cache: "no-store"`.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions,
): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: options.method,
    cache: options.method ? undefined : "no-store",
    headers:
      options.body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  await ensureOk(response, options);

  return (await response.json()) as T;
}

/**
 * Petición sin cuerpo de respuesta (DELETE, 204): lanza si falla y no parsea.
 */
export async function apiRequestVoid(
  path: string,
  options: ApiErrorOptions & {
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
  },
): Promise<void> {
  const response = await fetch(getApiUrl(path), {
    method: options.method,
    headers:
      options.body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  await ensureOk(response, options);
}

/**
 * Petición multipart: el navegador agrega el `Content-Type` con el boundary.
 * Devuelve el JSON de la respuesta.
 */
export async function apiFormRequest<T>(
  path: string,
  formData: FormData,
  options: ApiErrorOptions & { method?: "POST" | "PUT" | "PATCH" },
): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: options.method ?? "POST",
    body: formData,
  });

  await ensureOk(response, options);

  return (await response.json()) as T;
}
