import {
  RiAttachmentLine,
  RiChat3Line,
  RiFileCheckLine,
  RiFlagLine,
  RiHistoryLine,
  RiInformationLine,
  RiPriceTag3Line,
  RiTeamLine,
} from "@remixicon/react";

type ProjectTabIcon = typeof RiInformationLine;

export type ProjectTab = {
  value: string;
  label: string;
  Icon: ProjectTabIcon;
  /** Solo visible para proponente, actores asignados y revisores. */
  memberOnly: boolean;
};

/**
 * Fuente única de las pestañas del detalle. De aquí se derivan tanto la lista
 * aceptada por `ProjectTabs` como los disparadores del `TabsList`, así no pueden
 * desincronizarse.
 */
export const PROJECT_TABS: ProjectTab[] = [
  {
    value: "general",
    label: "General",
    Icon: RiInformationLine,
    memberOnly: false,
  },
  {
    value: "categorias",
    label: "Categorías",
    Icon: RiPriceTag3Line,
    memberOnly: false,
  },
  {
    value: "equipo",
    label: "Equipo",
    Icon: RiTeamLine,
    memberOnly: true,
  },
  {
    value: "observaciones",
    label: "Observaciones",
    Icon: RiChat3Line,
    memberOnly: true,
  },
  {
    value: "hitos",
    label: "Hitos",
    Icon: RiFlagLine,
    memberOnly: true,
  },
  {
    value: "entregas",
    label: "Entregas",
    Icon: RiFileCheckLine,
    memberOnly: true,
  },
  {
    value: "anexos",
    label: "Anexos",
    Icon: RiAttachmentLine,
    memberOnly: true,
  },
  {
    value: "historial",
    label: "Historial",
    Icon: RiHistoryLine,
    memberOnly: true,
  },
];

export function visibleProjectTabs(isMember: boolean): ProjectTab[] {
  return PROJECT_TABS.filter((tab) => !tab.memberOnly || isMember);
}
