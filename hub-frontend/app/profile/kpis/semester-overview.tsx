import {
  RiCheckboxCircleLine,
  RiFlagLine,
  RiFolderLine,
  RiSendPlaneLine,
} from "@remixicon/react";
import {
  CalendarSemester,
  KpiPhase,
  PhaseSemester,
  SemesterBucket,
  SemesterStatsResponse,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PHASE_LABELS: Record<KpiPhase, string> = {
  semester_1: "Semestre 1",
  semester_2: "Semestre 2",
};

/** Porcentaje entero, o null cuando no hay base sobre la que calcularlo. */
function percent(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 100) : null;
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function countOf(bucket: SemesterBucket, ...statuses: string[]): number {
  return bucket.byStatus
    .filter((entry) => statuses.includes(entry.status))
    .reduce((total, entry) => total + entry.count, 0);
}

/** Resultado de cada proyecto agrupado para la barra apilada. */
const OUTCOME_GROUPS = [
  {
    key: "closed",
    label: "Finalizados",
    statuses: ["closed"],
    className: "bg-success",
  },
  {
    key: "active",
    label: "En curso",
    statuses: ["approved", "in_progress", "paused"],
    className: "bg-utb-blue",
  },
  {
    key: "pending",
    label: "Por decidir",
    statuses: ["proposed", "under_review"],
    className: "bg-muted-foreground/40",
  },
  {
    key: "stopped",
    label: "Rechazados o cancelados",
    statuses: ["rejected", "cancelled"],
    className: "bg-destructive",
  },
] as const;

function SummaryCard({
  label,
  value,
  hint,
  Icon,
}: {
  readonly label: string;
  readonly value: string;
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

function RateBar({ value }: { readonly value: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-utb-blue"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
      <span className="w-9 text-right text-sm tabular-nums">
        {formatPercent(value)}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {OUTCOME_GROUPS.map((group) => (
        <li key={group.key} className="flex items-center gap-1.5">
          <span
            className={cn("size-2.5 rounded-sm", group.className)}
            aria-hidden="true"
          />
          {group.label}
        </li>
      ))}
    </ul>
  );
}

function SemesterChart({
  calendar,
}: {
  readonly calendar: CalendarSemester[];
}) {
  const max = Math.max(...calendar.map((semester) => semester.projects), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyectos por semestre académico</CardTitle>
        <CardDescription>
          Según la fecha de inicio de cada proyecto (o la de creación si aún no
          la tiene). Enero–junio es el semestre 1 y julio–diciembre el 2.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {calendar.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay proyectos registrados.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {calendar.map((semester) => (
                <div key={semester.period} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-sm font-medium tabular-nums">
                    {semester.period}
                  </span>

                  <div
                    className="flex h-5 min-w-0 flex-1 overflow-hidden rounded-md bg-muted"
                    role="img"
                    aria-label={`${semester.period}: ${semester.projects} proyecto(s)`}
                  >
                    <div
                      className="flex h-full"
                      style={{ width: `${(semester.projects / max) * 100}%` }}
                    >
                      {OUTCOME_GROUPS.map((group) => {
                        const count = countOf(semester, ...group.statuses);

                        return count > 0 ? (
                          <div
                            key={group.key}
                            className={cn("h-full", group.className)}
                            style={{
                              width: `${(count / semester.projects) * 100}%`,
                            }}
                            title={`${group.label}: ${count}`}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>

                  <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
                    {semester.projects}
                  </span>
                </div>
              ))}
            </div>

            <Legend />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SemesterTable({
  calendar,
}: {
  readonly calendar: CalendarSemester[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desarrollo por semestre</CardTitle>
        <CardDescription>
          La aceptación se calcula sobre las propuestas ya decididas; los hitos
          y las entregas, sobre lo registrado en esos proyectos.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Semestre</TableHead>
              <TableHead className="text-right">Proyectos</TableHead>
              <TableHead>Aceptación</TableHead>
              <TableHead className="text-right">En progreso</TableHead>
              <TableHead className="text-right">Finalizados</TableHead>
              <TableHead>Hitos mínimos</TableHead>
              <TableHead>Entregas aceptadas</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {calendar.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  Sin datos todavía.
                </TableCell>
              </TableRow>
            ) : (
              [...calendar].reverse().map((semester) => (
                <TableRow
                  key={semester.period}
                  className="transition-colors hover:bg-utb-blue/4"
                >
                  <TableCell className="font-medium tabular-nums">
                    {semester.period}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {semester.projects}
                  </TableCell>
                  <TableCell>
                    <RateBar
                      value={percent(semester.accepted, semester.decided)}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {semester.inProgress}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {semester.closed}
                  </TableCell>
                  <TableCell>
                    <RateBar
                      value={percent(
                        semester.minimumMilestones.completed,
                        semester.minimumMilestones.total,
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <RateBar
                      value={percent(
                        semester.reports.accepted,
                        semester.reports.total,
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PhaseCard({ phase }: { readonly phase: PhaseSemester }) {
  const statusRows = phase.byStatus.filter((entry) => entry.count > 0);
  const max = Math.max(...statusRows.map((entry) => entry.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{PHASE_LABELS[phase.phase]}</CardTitle>
        <CardDescription>
          {phase.projects} proyecto(s) en esta fase.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Aceptación</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {formatPercent(percent(phase.accepted, phase.decided))}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Hitos mínimos</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {formatPercent(
                percent(
                  phase.minimumMilestones.completed,
                  phase.minimumMilestones.total,
                ),
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Entregas</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {formatPercent(
                percent(phase.reports.accepted, phase.reports.total),
              )}
            </dd>
          </div>
        </dl>

        {statusRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin proyectos en esta fase.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {statusRows.map((entry) => (
              <div key={entry.status} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-muted-foreground">
                  {formatStatus(entry.status)}
                </span>

                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-utb-deep-blue"
                    style={{ width: `${(entry.count / max) * 100}%` }}
                  />
                </div>

                <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SemesterOverview({
  stats,
}: {
  readonly stats: SemesterStatsResponse;
}) {
  const totals = stats.calendar.reduce(
    (acc, semester) => ({
      decided: acc.decided + semester.decided,
      accepted: acc.accepted + semester.accepted,
      closed: acc.closed + semester.closed,
      milestonesTotal: acc.milestonesTotal + semester.minimumMilestones.total,
      milestonesDone:
        acc.milestonesDone + semester.minimumMilestones.completed,
      reportsTotal: acc.reportsTotal + semester.reports.total,
      reportsAccepted: acc.reportsAccepted + semester.reports.accepted,
    }),
    {
      decided: 0,
      accepted: 0,
      closed: 0,
      milestonesTotal: 0,
      milestonesDone: 0,
      reportsTotal: 0,
      reportsAccepted: 0,
    },
  );

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Proyectos"
          value={String(stats.totalProjects)}
          hint={`En ${stats.calendar.length} semestre(s) académico(s).`}
          Icon={RiFolderLine}
        />
        <SummaryCard
          label="Propuestas aceptadas"
          value={formatPercent(percent(totals.accepted, totals.decided))}
          hint={`${totals.accepted} de ${totals.decided} propuestas decididas.`}
          Icon={RiCheckboxCircleLine}
        />
        <SummaryCard
          label="Hitos mínimos cumplidos"
          value={formatPercent(
            percent(totals.milestonesDone, totals.milestonesTotal),
          )}
          hint={`${totals.milestonesDone} de ${totals.milestonesTotal} hitos.`}
          Icon={RiFlagLine}
        />
        <SummaryCard
          label="Entregas aceptadas"
          value={formatPercent(
            percent(totals.reportsAccepted, totals.reportsTotal),
          )}
          hint={`${totals.reportsAccepted} de ${totals.reportsTotal} entregas.`}
          Icon={RiSendPlaneLine}
        />
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <SemesterChart calendar={stats.calendar} />
        <SemesterTable calendar={stats.calendar} />
      </div>

      <h2 className="mb-3 text-sm font-semibold tracking-tight">
        Por fase del proyecto
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {stats.phases.map((phase) => (
          <PhaseCard key={phase.phase} phase={phase} />
        ))}
      </div>
    </>
  );
}
