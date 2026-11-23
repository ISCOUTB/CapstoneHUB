import Link from "next/link";
import { KpiResponse } from "../../services/stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function ProjectLink({
  projectId,
  name,
}: {
  readonly projectId: number;
  readonly name: string;
}) {
  return (
    <Button
      variant="link"
      className="h-auto justify-start p-0 text-left font-medium"
      nativeButton={false}
      render={<Link href={`/projects/${projectId}`}>{name}</Link>}
    />
  );
}

function EmptyPending({ message }: { readonly message: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Sin pendientes</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function MoreNote({
  total,
  shown,
}: {
  readonly total: number;
  readonly shown: number;
}) {
  if (total <= shown) {
    return null;
  }

  return (
    <p className="mt-3 text-xs text-muted-foreground">
      Y {total - shown} más.
    </p>
  );
}

export default function KpiPending({
  kpis,
}: {
  readonly kpis: KpiResponse;
}) {
  const { pendingProposals, pendingReviews, milestoneAssessmentProgress } =
    kpis;

  return (
    <div className="mb-6 flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Propuestas por aprobar</CardTitle>
          <CardDescription>
            {pendingProposals.count === 0
              ? "No hay propuestas esperando concepto."
              : `${pendingProposals.count} propuesta(s) esperando concepto.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {pendingProposals.items.length === 0 ? (
            <EmptyPending message="Cuando llegue una propuesta nueva aparecerá aquí." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Proponente</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProposals.items.map((proposal) => (
                    <TableRow
                      key={proposal.id}
                      className="transition-colors hover:bg-utb-blue/[0.04]"
                    >
                      <TableCell>
                        <ProjectLink
                          projectId={proposal.id}
                          name={proposal.name}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {proposal.proposerName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(proposal.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <MoreNote
                total={pendingProposals.count}
                shown={pendingProposals.items.length}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entregas por revisar</CardTitle>
          <CardDescription>
            {pendingReviews.count === 0
              ? "No hay entregas enviadas pendientes de revisión."
              : `${pendingReviews.count} entrega(s) enviadas${
                  pendingReviews.overdueCount > 0
                    ? `, ${pendingReviews.overdueCount} vencida(s)`
                    : ""
                }.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {pendingReviews.items.length === 0 ? (
            <EmptyPending message="Las entregas enviadas por los estudiantes aparecerán aquí." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Enviada</TableHead>
                    <TableHead>Vence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReviews.items.map((review) => (
                    <TableRow
                      key={review.reportId}
                      className="transition-colors hover:bg-utb-blue/[0.04]"
                    >
                      <TableCell>
                        <ProjectLink
                          projectId={review.projectId}
                          name={review.projectName}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {review.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(review.submittedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          {formatDate(review.dueDate)}
                          {review.overdue ? (
                            <Badge variant="destructive">Vencida</Badge>
                          ) : null}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <MoreNote
                total={pendingReviews.count}
                shown={pendingReviews.items.length}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evaluación de hitos pendiente</CardTitle>
          <CardDescription>
            {milestoneAssessmentProgress.pendingPrograms === 0
              ? "No hay evaluaciones de hitos pendientes."
              : `${milestoneAssessmentProgress.pendingPrograms} programa(s) con requisitos sin evaluar.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {milestoneAssessmentProgress.items.length === 0 ? (
            <EmptyPending message="Los programas con evaluación pendiente aparecerán aquí." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Avance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestoneAssessmentProgress.items.map((item) => (
                    <TableRow
                      key={`${item.projectId}-${item.programId}`}
                      className="transition-colors hover:bg-utb-blue/[0.04]"
                    >
                      <TableCell>
                        <ProjectLink
                          projectId={item.projectId}
                          name={item.projectName}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.programName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.answeredItems}/{item.totalItems} · {item.percent}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <MoreNote
                total={milestoneAssessmentProgress.pendingPrograms}
                shown={milestoneAssessmentProgress.items.length}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
