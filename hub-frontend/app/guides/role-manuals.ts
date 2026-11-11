import type { UserRole } from "../services/roles";

export type RoleManualSection = {
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

export type RoleManualLink = {
  href: string;
  label: string;
};

export type RoleManual = {
  role: UserRole;
  title: string;
  summary: string;
  sections: readonly RoleManualSection[];
  quickLinks: readonly RoleManualLink[];
};

/** Orden en el que se muestran los manuales y las pestañas de rol. */
export const ROLE_MANUAL_ORDER: readonly UserRole[] = [
  "student",
  "teacher",
  "evaluator",
  "directivo",
  "admin",
  "proposer",
];

export const ROLE_MANUALS: Record<UserRole, RoleManual> = {
  student: {
    role: "student",
    title: "Manual del estudiante",
    summary:
      "Explora proyectos, expresa tu interés, consulta tus asignaciones y prepara las entregas del equipo.",
    sections: [
      {
        title: "Explora los proyectos disponibles",
        paragraphs: [
          "En Proyectos encontrarás los proyectos visibles para tu cuenta. Puedes buscar por nombre, filtrar por estado, fuente o año y abrir el detalle de cada uno.",
          "Los proyectos privados aprobados muestran una vista previa con la información que el equipo docente considera pública. Al asignarte, verás el detalle completo.",
        ],
        bullets: [
          "Revisa la descripción, los requisitos de equipo y los resultados esperados antes de postularte.",
          "Usa los filtros para encontrar proyectos de tu escuela o área de interés.",
        ],
      },
      {
        title: "Expresa tu interés",
        paragraphs: [
          "En el detalle de un proyecto aprobado puedes registrar tu interés con un mensaje opcional. El docente asignado verá tu postulación en la pestaña Equipo y podrá asignarte o descartarla.",
          "Puedes retirar tu interés mientras el proyecto siga abierto y no hayas sido asignado al equipo.",
        ],
      },
      {
        title: "Revisa tus proyectos y entregas",
        paragraphs: [
          "El inicio muestra tus proyectos asignados. Al abrir uno verás las pestañas internas del proyecto, incluidas Hitos, Entregas, Observaciones y Anexos.",
          "Solo el estudiante asignado al proyecto puede preparar y enviar las entregas. Los docentes y evaluadores las configuran y revisan.",
        ],
      },
      {
        title: "Prepara y envía una entrega",
        bullets: [
          "Abre la pestaña Entregas y revisa el título, las instrucciones y la fecha límite.",
          "Agrega el contenido solicitado: texto, un enlace o un archivo dentro de los formatos permitidos.",
          "Puedes editar el contenido mientras la entrega esté pendiente o haya sido rechazada.",
          "Cuando esté completa, envíala para revisión. Después del envío ya no se puede modificar.",
          "Si la entrega es rechazada, revisa el comentario del docente, corrige y vuelve a enviarla.",
        ],
      },
      {
        title: "Consulta hitos, observaciones e historial",
        paragraphs: [
          "Los hitos muestran la fase a la que pertenecen, las entregas vinculadas y si son mínimos. Las observaciones y el historial te ayudan a entender el seguimiento del proyecto.",
          "Mantén tu perfil actualizado y cambia tu contraseña desde Mi perfil cuando lo necesites.",
        ],
      },
    ],
    quickLinks: [
      { href: "/projects", label: "Explorar proyectos" },
      { href: "/home", label: "Mis proyectos" },
      { href: "/profile", label: "Mi perfil" },
    ],
  },
  teacher: {
    role: "teacher",
    title: "Manual del docente",
    summary:
      "Gestiona los proyectos que supervisas, el equipo, los hitos, las entregas y el avance de fase.",
    sections: [
      {
        title: "Proyectos asignados",
        paragraphs: [
          "En Mi inicio y Proyectos encontrarás los proyectos donde estás asignado como docente. Desde el detalle puedes editar los datos, gestionar el equipo y hacer seguimiento.",
          "Un directivo también puede revisar cualquier proyecto sin asignarse, pero las tareas de ejecución —como avanzar la fase— requieren tu asignación como docente.",
        ],
      },
      {
        title: "Gestiona el equipo",
        bullets: [
          "En la pestaña Equipo asigna estudiantes, docentes o evaluadores según los roles habilitados.",
          "Revisa la lista de estudiantes interesados y asígnalos o descarta su postulación.",
          "Al asignar a un estudiante, su interés se elimina automáticamente.",
          "Una persona solo puede tener un rol dentro del mismo proyecto.",
        ],
      },
      {
        title: "Hitos y entregas",
        paragraphs: [
          "Crea hitos con título, descripción, fecha y fase. Marca como mínimo los obligatorios para avanzar de fase o cerrar el proyecto.",
          "Puedes vincular una o varias entregas a un hito. El hito no se completa hasta que todas sus entregas vinculadas estén aceptadas.",
        ],
        bullets: [
          "Configura cada entrega con su tipo: texto, enlace o archivo.",
          "Para las entregas de archivo define los formatos permitidos y el máximo de archivos.",
          "Revisa las entregas enviadas y acéptalas o recházalas con un comentario.",
        ],
      },
      {
        title: "Avance de fase y cierre",
        paragraphs: [
          "La barra Fase del detalle permite avanzar del semestre 1 al semestre 2 cuando todos los hitos mínimos de la fase actual están completos, la fase está evaluada y el proponente y los evaluadores dieron su visto bueno.",
          "El cierre también exige los hitos mínimos completos y la evaluación de la fase actual. Los avisos indican qué falta antes de continuar.",
        ],
      },
      {
        title: "Observaciones e historial",
        paragraphs: [
          "Registra observaciones para dejar contexto del seguimiento. La pestaña Historial conserva los cambios de estado y de datos del proyecto.",
        ],
      },
    ],
    quickLinks: [
      { href: "/home", label: "Mis proyectos" },
      { href: "/projects", label: "Lista de proyectos" },
    ],
  },
  evaluator: {
    role: "evaluator",
    title: "Manual del evaluador",
    summary:
      "Revisa los proyectos donde fuiste asignado, aprueba la fase y registra la evaluación de la expo.",
    sections: [
      {
        title: "Proyectos asignados",
        paragraphs: [
          "Como evaluador solo participas en los proyectos donde se te asigna el rol de evaluador. En ellos conservas los permisos de revisión, aprobación de fase y evaluación.",
          "El rol de evaluador no tiene acceso global: si no estás asignado a un proyecto, no verás sus secciones internas.",
        ],
      },
      {
        title: "Revisión de hitos y entregas",
        bullets: [
          "Consulta los hitos del proyecto y las entregas vinculadas.",
          "Revisa las entregas enviadas por el equipo y acéptalas o recházalas con un comentario.",
          "Puedes gestionar hitos y entregas como parte del equipo revisor.",
        ],
      },
      {
        title: "Visto bueno de fase",
        paragraphs: [
          "Antes de avanzar de semestre, el proponente y cada evaluador asignado deben aprobar la fase destino. Puedes retirar tu visto bueno mientras la fase no se haya avanzado.",
        ],
      },
      {
        title: "Evaluación semestral",
        paragraphs: [
          "La pestaña Evaluación muestra la rúbrica asignada a cada fase. Registra una nota entre 0.0 y 5.0 por criterio, un comentario opcional y un comentario general.",
          "Solo puedes evaluar mientras el proyecto está en progreso y la fase evaluada es la actual. La nota total se calcula con los pesos de la rúbrica.",
          "La evaluación de la fase actual es obligatoria para avanzar de fase y para cerrar el proyecto. Puedes corregir tu evaluación mientras se mantengan esas condiciones.",
        ],
      },
    ],
    quickLinks: [
      { href: "/home", label: "Mis proyectos" },
      { href: "/projects", label: "Lista de proyectos" },
    ],
  },
  directivo: {
    role: "directivo",
    title: "Manual del directivo",
    summary:
      "Revisa cualquier proyecto, resuelve propuestas, asigna actores, gestiona rúbricas y consulta los indicadores.",
    sections: [
      {
        title: "Revisión de propuestas",
        paragraphs: [
          "Los directivos ven todos los proyectos, incluso sin estar asignados. Desde el detalle puedes aprobar o rechazar una propuesta y dejar el motivo en el historial.",
          "Las transiciones de la fase de propuesta no requieren asignación; las de ejecución sí requieren una asignación como docente.",
        ],
      },
      {
        title: "Edición y equipo",
        bullets: [
          "Edita los datos de cualquier proyecto mientras no esté finalizado o rechazado.",
          "Asigna docentes, evaluadores y estudiantes desde la pestaña Equipo.",
          "Comenta y revisa entregas sin necesidad de asignarte.",
          "Cada campo modificado queda registrado en el Historial.",
        ],
      },
      {
        title: "Rúbricas y evaluación",
        paragraphs: [
          "En Rúbricas puedes crear y editar plantillas y asignarlas a un proyecto y fase. Los porcentajes de los criterios deben sumar 100%.",
          "Puedes consultar las evaluaciones de cualquier proyecto, pero solo puedes enviar la evaluación si además estás asignado como evaluador. Un admin sí puede enviarla.",
          "Una plantilla asignada o con evaluaciones no se puede editar ni archivar.",
        ],
      },
      {
        title: "Indicadores y panorama",
        paragraphs: [
          "El panel de Indicadores resume pendientes, distribución de proyectos y actividad de revisión. El panorama por semestre muestra proyectos, aceptación, hitos mínimos y entregas por fase.",
        ],
      },
      {
        title: "Alcance de tus permisos",
        bullets: [
          "Para gestionar hitos o aprobar una fase necesitas una asignación como evaluador.",
          "Para avanzar de fase o realizar transiciones de ejecución necesitas una asignación como docente.",
          "El cierre y el avance de fase tienen bloqueos duros, incluso para administradores.",
        ],
      },
    ],
    quickLinks: [
      { href: "/projects", label: "Revisar proyectos" },
      { href: "/profile/kpis", label: "Indicadores" },
      { href: "/admin/rubrics", label: "Rúbricas" },
    ],
  },
  admin: {
    role: "admin",
    title: "Manual del administrador",
    summary:
      "Administra usuarios, roles y el catálogo de guías; supervisa cualquier proyecto y completa las operaciones de cierre.",
    sections: [
      {
        title: "Usuarios y roles",
        paragraphs: [
          "En Administración puedes crear usuarios, revisar su estado y asignar los roles globales: admin, directivo, evaluador, docente, proponente o estudiante.",
          "Asigna solo los roles necesarios. Los permisos dentro de un proyecto dependen de la asignación de actor, no solo del rol global.",
        ],
      },
      {
        title: "Proyectos",
        bullets: [
          "Crea, edita y elimina proyectos, y resuelve cualquier transición de estado.",
          "Gestiona el equipo, los hitos, las entregas, los anexos y las observaciones.",
          "Puedes avanzar la fase y cerrar el proyecto, siempre que se cumplan los bloqueos de hitos y evaluación.",
        ],
      },
      {
        title: "Rúbricas, evaluaciones y guías",
        paragraphs: [
          "Administra las plantillas de rúbricas y asigna la de cada proyecto y fase. Puedes enviar evaluaciones aunque no estés asignado como evaluador.",
          "Desde Administrar guías mantienes el catálogo de formatos, plantillas y procedimientos que se publica en la página Guías.",
        ],
      },
      {
        title: "Operación y soporte",
        bullets: [
          "Revisa el historial de cada proyecto para explicar cambios de estado o de datos.",
          "Verifica que los anexos y archivos de entrega estén disponibles.",
          "Ante un error de permisos, confirma primero la asignación del usuario en el proyecto.",
        ],
      },
    ],
    quickLinks: [
      { href: "/admin/users", label: "Usuarios" },
      { href: "/admin/rubrics", label: "Rúbricas" },
      { href: "/admin/guides", label: "Administrar guías" },
    ],
  },
  proposer: {
    role: "proposer",
    title: "Manual del proponente",
    summary:
      "Registra tu propuesta, sigue su estado y actualízala mientras siga en la fase de propuesta.",
    sections: [
      {
        title: "Registra tu propuesta",
        paragraphs: [
          "Desde Proponer completas el formulario de propuesta con los datos de la organización o del proyecto, el contexto, los objetivos y los entregables esperados.",
          "Define si el proyecto es privado. Un proyecto privado nunca se publica en el listado público y solo lo ven los revisores y el equipo asignado.",
        ],
        bullets: [
          "Revisa los requisitos de equipo y los resultados esperados antes de enviar.",
          "Acepta el consentimiento de tratamiento de datos para registrar la propuesta.",
        ],
      },
      {
        title: "Sigue el estado de la propuesta",
        paragraphs: [
          "En Proyectos y en el detalle puedes consultar el estado: propuesto, aprobado, en progreso, en pausa, finalizado, cancelado o rechazado.",
          "Los estados finales y las propuestas rechazadas quedan en solo lectura.",
        ],
      },
      {
        title: "Edita mientras está en propuesta",
        paragraphs: [
          "Mientras el proyecto siga en estado propuesto puedes corregir sus datos desde Editar proyecto. Cada cambio queda registrado en el Historial.",
          "Después de la aprobación, la edición pasa a manos de los docentes, directivos y administradores.",
        ],
      },
      {
        title: "Consulta el detalle",
        paragraphs: [
          "Como proponente puedes ver las secciones internas del proyecto, incluidas observaciones, hitos y anexos. Las evaluaciones y notas solo las ven los revisores autorizados.",
        ],
      },
      {
        title: "Recomendaciones",
        bullets: [
          "Describe el problema y el contexto con datos concretos.",
          "Explica con claridad el equipo requerido y los resultados esperados.",
          "Adjunta la información de contacto correcta para el seguimiento.",
        ],
      },
    ],
    quickLinks: [
      { href: "/submit", label: "Proponer un proyecto" },
      { href: "/projects", label: "Consultar proyectos" },
    ],
  },
};
