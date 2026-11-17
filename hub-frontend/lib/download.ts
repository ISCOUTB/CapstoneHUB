/**
 * Utilidades de descarga para respuestas binarias del BFF. Solo se usan desde
 * componentes cliente.
 */

function fileNameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return null;
    }
  }

  const asciiMatch = /filename="?([^";]+)"?/i.exec(header);
  return asciiMatch?.[1]?.trim() ?? null;
}

export async function downloadResponseFile(
  response: Response,
  fallbackName: string,
): Promise<void> {
  const blob = await response.blob();
  const headerName = fileNameFromContentDisposition(
    response.headers.get("content-disposition"),
  );
  const fileName = (headerName || fallbackName).replace(/[/\\]/g, "_");

  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
