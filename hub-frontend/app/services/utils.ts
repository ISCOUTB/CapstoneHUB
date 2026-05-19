export function formatStatus(status: string): string {
  switch (status) {
    case "proposed":
      return "Propuesto";
    case "in_progress":
      return "En progreso";
    case "under_review":
      return "En revisión";
    case "approved":
      return "Aprovado";
    case "assigned":
      return "Asignado";
    case "closed":
      return "Cerrado";
    case "rejected":
      return "Rechazado";
    default:
      return status;
  }
}
