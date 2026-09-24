export function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export function formatCurrency(value: string | null): string {
  if (!value) {
    return "No definido";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return value;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numericValue);
}
