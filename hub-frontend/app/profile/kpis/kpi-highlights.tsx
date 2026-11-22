import {
  RiFileList3Line,
  RiFolderLine,
  RiSendPlaneLine,
} from "@remixicon/react";
import {
  KpiPhase,
  KpiProjectStatus,
  KpiResponse,
} from "../../services/stats";
import { formatStatus } from "../../services/utils";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_ORDER: KpiProjectStatus[] = [
  "proposed",
  "under_review",
  "approved",
  "in_progress",
  "paused",
  "closed",
  "cancelled",
  "rejected",
];

const PHASE_LABELS: Record<KpiPhase, string> = {
  semester_1: "Semestre 1",
  semester_2: "Semestre 2",
};

type DistributionRow = {
  key: string;
  label: string;
  count: number;
};

function HighlightCard({
  label,
  value,
  hint,
  Icon,
}: {
  readonly label: string;
  readonly value: number | string;
  readonly hint: string;
  readonly Icon: typeof RiFolderLine;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>

        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-utb-blue/10 text-utb-blue ring-1 ring-utb-blue/15">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

function DistributionCard({
  title,
  description,
  rows,
  barClassName,
}: {
  readonly title: string;
  readonly description: string;
  readonly rows: DistributionRow[];
  readonly barClassName: string;
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin proyectos en este alcance.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-muted-foreground">
                  {row.label}
                </span>

                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", barClassName)}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>

                <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KpiHighlights({
  kpis,
}: {
  readonly kpis: KpiResponse;
}) {
  const statusCounts = new Map(
    kpis.projects.byStatus.map((entry) => [entry.status, entry.count]),
  );
  const statusRows: DistributionRow[] = STATUS_ORDER.map((status) => ({
    key: status,
    label: formatStatus(status),
    count: statusCounts.get(status) ?? 0,
  })).filter((row) => row.count > 0);

  const phaseRows: DistributionRow[] = (
    Object.keys(PHASE_LABELS) as KpiPhase[]
  )
    .map((phase) => ({
      key: phase,
      label: PHASE_LABELS[phase],
      count:
        kpis.projects.byPhase.find((entry) => entry.phase === phase)?.count ??
        0,
    }))
    .filter((row) => row.count > 0);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HighlightCard
          label="Proyectos"
          value={kpis.projects.total}
          hint={
            kpis.scope === "global"
              ? "Todos los proyectos del sistema."
              : "Asignados a ti o propuestos por ti."
          }
          Icon={RiFolderLine}
        />

        <HighlightCard
          label="Propuestas por aprobar"
          value={kpis.pendingProposals.count}
          hint="Esperando concepto."
          Icon={RiFileList3Line}
        />

        <HighlightCard
          label="Entregas por revisar"
          value={kpis.pendingReviews.count}
          hint={
            kpis.pendingReviews.overdueCount > 0
              ? `${kpis.pendingReviews.overdueCount} vencida(s).`
              : "Sin entregas vencidas."
          }
          Icon={RiSendPlaneLine}
        />

        <HighlightCard
          label="Avance de hitos"
          value={
            kpis.milestoneAssessmentProgress.percent === null
              ? "—"
              : `${kpis.milestoneAssessmentProgress.percent}%`
          }
          hint={
            kpis.milestoneAssessmentProgress.totalItems === 0
              ? "Sin formatos de evaluación configurados."
              : `${kpis.milestoneAssessmentProgress.answeredItems} de ${kpis.milestoneAssessmentProgress.totalItems} requisitos evaluados.`
          }
          Icon={RiFileList3Line}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <DistributionCard
          title="Proyectos por estado"
          description="Distribución de tus proyectos según su estado actual."
          rows={statusRows}
          barClassName="bg-utb-blue"
        />

        <DistributionCard
          title="Proyectos por fase"
          description="Semestre en el que se encuentra cada proyecto."
          rows={phaseRows}
          barClassName="bg-utb-deep-blue"
        />
      </div>
    </>
  );
}
