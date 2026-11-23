export type MilestoneAssessmentItem = {
  readonly id: string;
  readonly label: string;
};

export type MilestoneAssessmentSection = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly MilestoneAssessmentItem[];
};

export type MilestoneAssessmentTemplate = {
  readonly programId: string;
  readonly programName: string;
  readonly introduction: string;
  readonly overviewItems: readonly MilestoneAssessmentItem[];
  readonly sections: readonly MilestoneAssessmentSection[];
  readonly notes?: readonly string[];
};

function item(id: string, label: string): MilestoneAssessmentItem {
  return { id, label };
}

function section(
  id: string,
  title: string,
  items: readonly MilestoneAssessmentItem[],
): MilestoneAssessmentSection {
  return { id, title, items };
}

// prettier-ignore
export const MILESTONE_ASSESSMENT_TEMPLATES: Readonly<
  Record<string, MilestoneAssessmentTemplate>
> = {
  'ingenieria-ambiental': {
    programId: 'ingenieria-ambiental', programName: 'Ingeniería Ambiental',
    introduction: 'Mecanismos de requerimiento mínimos que cada proyecto de ingeniería ambiental debe contener.',
    overviewItems: [item('overview-1', 'Eje temático definido'), item('overview-2', 'Diagnóstico del problema'), item('overview-3', 'Alternativas de solución'), item('overview-4', 'Selección de alternativas'), item('overview-5', 'Metodología'), item('overview-6', 'Diseño de solución'), item('overview-7', 'Entregables')],
    sections: [
      section('1', 'Eje temático claramente definido', [item('1.1', 'Control de la contaminación – matriz agua'), item('1.2', 'Control de la contaminación – matriz suelo'), item('1.3', 'Control de la contaminación – matriz aire'), item('1.4', 'Control de la contaminación – matriz residuos'), item('1.5', 'Otro')]),
      section('2', 'Diagnóstico del problema', [item('2.1', 'Definición del problema'), item('2.2', 'Herramientas visuales de análisis (árbol de problemas, diagrama de Ishikawa, etc.)'), item('2.3', 'Objetivos generales y específicos'), item('2.4', 'Descripción del ambiente operacional'), item('2.5', 'Listado de requisitos, usos, usuarios, asunciones y limitaciones')]),
      section('3', 'Alternativas de solución', [item('3.1', 'Revisión de antecedentes'), item('3.2', 'Marco normativo'), item('3.3', 'Descomposición del sistema'), item('3.4', 'Descripción de alternativas')]),
      section('4', 'Selección de alternativas', [item('4.1', 'Matriz multicriterio'), item('4.2', 'Matriz de impactos'), item('4.3', 'Matriz de ciclo de vida'), item('4.4', 'Matriz de sostenibilidad'), item('4.5', 'Matriz de riesgos'), item('4.6', 'Análisis de incertidumbre'), item('4.7', 'Otros criterios')]),
      section('5', 'Metodología de desarrollo del proyecto', [item('5.1', 'Metodología de validación'), item('5.2', 'Trabajo de laboratorio'), item('5.3', 'Trabajo de campo'), item('5.4', 'Herramientas de simulación'), item('5.5', 'Metodología de diseño')]),
      section('6', 'Diseño de solución', [item('6.1', 'Descripción de la solución'), item('6.2', 'Cálculo de dimensiones y condiciones de operación'), item('6.3', 'Diagrama de procesos y planos de la solución'), item('6.4', 'Verificación de cumplimiento normativo')]),
      section('7', 'Entregables', [item('7.1', 'Avance 1: Definición de problema, estado del arte y marco normativo'), item('7.2', 'Avance 2: Descomposición del sistema, propuesta de alternativas, metodología de selección de alternativas, validación y diseño'), item('7.3', 'Avance 3: Selección de alternativa, validación (experimental, campo, simulación)'), item('7.4', 'Avance 4: Diseño de solución, memoria de cálculo, planos'), item('7.5', 'Informe final: integración de avances 1 a 4')]),
    ],
    notes: ['Los entregables Avance 1 y Avance 2 hacen parte de Proyecto de Ingeniería I. Los entregables Avance 3 y Avance 4 hacen parte de Proyecto de Ingeniería II. El informe final se deposita en el repositorio de biblioteca.'],
  },
  'ingenieria-industrial': {
    programId: 'ingenieria-industrial', programName: 'Ingeniería Industrial',
    introduction: 'Mecanismos de requerimiento mínimos que cada proyecto de ingeniería industrial debe contener.',
    overviewItems: [item('overview-1', 'Eje temático definido'), item('overview-2', 'Diagnóstico del problema'), item('overview-3', 'Justificación de alternativas de solución'), item('overview-4', 'Herramientas de desarrollo'), item('overview-5', 'Metodología'), item('overview-6', 'Entregables'), item('overview-7', 'Aspectos normativos')],
    sections: [
      section('1', 'Eje temático claramente definido', [item('1.1', 'Factores humanos (Seguridad y ergonomía, talento humano)'), item('1.2', 'Logística y cadenas de Suministro'), item('1.3', 'Analítica de procesos y datos, control (Estadísticas, Diseño de Exp, Control de calidad)'), item('1.4', 'Producción (Diseño, planeación, Programación)'), item('1.5', 'Mejoramiento continuo (Productividad y estandarización, estrategia)'), item('1.6', 'Otros')]),
      section('2', 'Análisis cualitativo y cuantitativo del diagnóstico del problema', [item('2.1', 'Diagrama de Pareto'), item('2.2', 'Diagrama de Ishikawa'), item('2.3', 'Árbol de problemas'), item('2.4', 'Estadísticas asociadas (correlaciones, Test)')]),
      section('3', 'Justificación de las alternativas de solución', [item('3.1', 'Revisión de la literatura'), item('3.2', 'Análisis bibliométrico')]),
      section('4', 'Herramientas de desarrollo', [item('4.1', 'Prototipo mínimo viable de mejora'), item('4.2', 'Modelos matemáticos (optimización) y/o estadísticos'), item('4.3', 'Simulación (sistemas, Discreta, Game)'), item('4.4', 'Desarrollo (web, app, tableros digitales)')]),
      section('5', 'Metodología de desarrollo del proyecto', [item('5.1', 'Metodología definida y aplicada'), item('5.2', 'LEAN (PHVA – DEMAIC)'), item('5.3', 'ETL u otro de análisis de datos'), item('5.4', 'PMI-SCRUM (Ágiles)'), item('5.5', 'Optimización (MC)'), item('5.6', 'Otros')]),
      section('6', 'Entregables (4 documentos)', [item('6.1', 'Diagnóstico'), item('6.2', 'Diseño y desarrollo'), item('6.3', 'Validación'), item('6.4', 'Análisis de costos e ingeniería económica')]),
      section('7', 'Aspectos normativos', [item('7.1', 'Normas ISO'), item('7.2', 'Desarrollo de aplicaciones web'), item('7.3', 'Estándares para análisis de datos'), item('7.4', 'Normas técnicas asociadas al área del proyecto')]),
    ],
    notes: ['Se recomienda usar tecnologías como Industria 4.0, Machine Learning, Green Lean Manufacturing, Manufactura Aditiva, Economía Circular y visión artificial.', 'El entregable 1 hace parte de Proyecto de Ingeniería I. Los entregables 2, 3 y 4 hacen parte de Proyecto de Ingeniería II. El informe final se deposita en el repositorio de biblioteca.'],
  },
  'ingenieria-mecatronica': {
    programId: 'ingenieria-mecatronica', programName: 'Ingeniería Mecatrónica',
    introduction: 'Requisitos mínimos orientados al diseño, construcción e integración de un prototipo que responda a una necesidad o problema de ingeniería.',
    overviewItems: [item('overview-1', 'Eje temático definido'), item('overview-2', 'Diagnóstico del problema'), item('overview-3', 'Justificación de alternativas de solución'), item('overview-4', 'Diseño y construcción del prototipo'), item('overview-5', 'Metodología'), item('overview-6', 'Entregables'), item('overview-7', 'Aspectos normativos')],
    sections: [
      section('1', 'Eje temático claramente definido', [item('1.1', 'Automatización y control'), item('1.2', 'Robótica y sistemas autónomos'), item('1.3', 'Diseño de máquinas y sistemas mecatrónicos'), item('1.4', 'Instrumentación y sistemas de medición'), item('1.5', 'Sistemas embebidos y electrónica aplicada'), item('1.6', 'Manufactura avanzada'), item('1.7', 'Otros')]),
      section('2', 'Diagnóstico del problema', [item('2.1', 'Caracterización del problema y sus causas'), item('2.2', 'Mediciones y datos que sustenten la necesidad'), item('2.3', 'Requisitos de funcionamiento y desempeño'), item('2.4', 'Alcance y restricciones del proyecto')]),
      section('3', 'Justificación de las alternativas de solución', [item('3.1', 'Revisión de literatura y soluciones existentes'), item('3.2', 'Análisis bibliométrico'), item('3.3', 'Comparación técnica y económica de alternativas'), item('3.4', 'Selección justificada de la solución')]),
      section('4', 'Diseño y construcción del prototipo', [item('4.1', 'Diseño mecánico y selección de materiales'), item('4.2', 'Diseño eléctrico y electrónico'), item('4.3', 'Selección de sensores y actuadores'), item('4.4', 'Modelado y estrategia de control'), item('4.5', 'Programación del sistema (HMI)'), item('4.6', 'Construcción e integración del prototipo')]),
      section('5', 'Metodología de desarrollo del proyecto', [item('5.1', 'Metodología definida y aplicada'), item('5.2', 'Etapas de diseño, construcción e integración'), item('5.3', 'Plan de pruebas y criterios de aceptación'), item('5.4', 'Evaluación de resultados y ajustes del prototipo')]),
      section('6', 'Entregables (4 documentos)', [item('6.1', 'Diagnóstico y requisitos del sistema'), item('6.2', 'Diseño y construcción del prototipo'), item('6.3', 'Validación experimental del prototipo'), item('6.4', 'Análisis de costos e ingeniería económica')]),
      section('7', 'Aspectos normativos', [item('7.1', 'Normas técnicas aplicables al proyecto'), item('7.2', 'Seguridad mecánica y eléctrica'), item('7.3', 'Seguridad de operación del prototipo'), item('7.4', 'Aspectos ambientales y éticos aplicables')]),
    ],
    notes: ['Todo proyecto debe incluir la construcción, integración y validación de un prototipo físico. La simulación podrá apoyar el diseño y las pruebas. Los componentes específicos se evaluarán según el alcance, manteniendo la integración mecatrónica como requisito.', 'El prototipo debe evidenciar la integración de los componentes mecánicos, electrónicos, de control y programación pertinentes. Su validación debe demostrar el cumplimiento de los requisitos establecidos mediante pruebas y resultados medibles.', 'Se podrán incorporar tecnologías como visión artificial, Internet de las cosas, inteligencia artificial o manufactura aditiva cuando contribuyan a la solución del problema.'],
  },
};

export type MilestoneAssessmentAnswer = {
  status: 'yes' | 'no' | 'na' | null;
  observation: string;
};

export type MilestoneAssessmentAnswers = Record<
  string,
  MilestoneAssessmentAnswer
>;

export function findMilestoneAssessmentTemplate(
  programId: string,
): MilestoneAssessmentTemplate | undefined {
  return MILESTONE_ASSESSMENT_TEMPLATES[programId];
}

export function templateItems(
  template: MilestoneAssessmentTemplate,
): MilestoneAssessmentItem[] {
  return [
    ...template.overviewItems,
    ...template.sections.flatMap((section) => section.items),
  ];
}

export function templateItemIds(
  template: MilestoneAssessmentTemplate,
): Set<string> {
  return new Set(templateItems(template).map((item) => item.id));
}
