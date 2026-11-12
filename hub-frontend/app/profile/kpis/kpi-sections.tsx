"use client";

import type { ReactNode } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { KpiResponse } from "../../services/stats";
import KpiActivity from "./kpi-activity";
import KpiHighlights from "./kpi-highlights";
import KpiPending from "./kpi-pending";

type KpiSectionsProps = {
  kpis: KpiResponse;
  semesterBody: ReactNode;
  showSemesters: boolean;
};

/**
 * Organiza los indicadores en pestañas: resumen, pendientes, actividad y,
 * cuando el rol lo permite, panorama por semestre.
 */
export default function KpiSections({
  kpis,
  semesterBody,
  showSemesters,
}: Readonly<KpiSectionsProps>) {
  return (
    <Tabs defaultValue="summary" className="gap-4">
      <TabsList className="max-w-full flex-wrap">
        <TabsTrigger value="summary">Resumen</TabsTrigger>
        <TabsTrigger value="pending">Pendientes</TabsTrigger>
        <TabsTrigger value="activity">Mi actividad</TabsTrigger>
        {showSemesters ? (
          <TabsTrigger value="semesters">Semestres</TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="summary" keepMounted>
        <KpiHighlights kpis={kpis} />
      </TabsContent>

      <TabsContent value="pending" keepMounted>
        <KpiPending kpis={kpis} />
      </TabsContent>

      <TabsContent value="activity" keepMounted>
        <KpiActivity myReviews={kpis.myReviews} />
      </TabsContent>

      {showSemesters ? (
        <TabsContent value="semesters" keepMounted>
          <section>
            <h2 className="text-lg font-semibold tracking-tight">
              Panorama por semestre
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Desarrollo general de todos los proyectos, por semestre académico y
              por fase del proyecto.
            </p>
            {semesterBody}
          </section>
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
