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

export const MILESTONE_ASSESSMENT_TEMPLATES: Readonly<
  Record<string, MilestoneAssessmentTemplate>
> = {
  'ingenieria-ambiental': {
    programId: 'ingenieria-ambiental',
    programName: 'Ingenier\u00eda Ambiental',
    introduction:
      'Mecanismos de requerimiento m\u00ednimos que cada proyecto de ingenier\u00eda ambiental debe contener.',
    overviewItems: [
      item('overview-1', 'Eje tem\u00e1tico definido'),
      item('overview-2', 'Diagn\u00f3stico del problema'),
      item('overview-3', 'Alternativas de soluci\u00f3n'),
      item('overview-4', 'Selecci\u00f3n de alternativas'),
      item('overview-5', 'Metodolog\u00eda'),
      item('overview-6', 'Dise\u00f1o de soluci\u00f3n'),
      item('overview-7', 'Entregables'),
    ],
    sections: [
      section('1', 'Eje tem\u00e1tico claramente definido', [
        item('1.1', 'Control de la contaminaci\u00f3n \u2013 matriz agua'),
        item('1.2', 'Control de la contaminaci\u00f3n \u2013 matriz suelo'),
        item('1.3', 'Control de la contaminaci\u00f3n \u2013 matriz aire'),
        item('1.4', 'Control de la contaminaci\u00f3n \u2013 matriz residuos'),
        item('1.5', 'Otro'),
      ]),
      section('2', 'Diagn\u00f3stico del problema', [
        item('2.1', 'Definici\u00f3n del problema'),
        item(
          '2.2',
          'Herramientas visuales de an\u00e1lisis (\u00e1rbol de problemas, diagrama de Ishikawa, etc.)',
        ),
        item('2.3', 'Objetivos generales y espec\u00edficos'),
        item('2.4', 'Descripci\u00f3n del ambiente operacional'),
        item(
          '2.5',
          'Listado de requisitos, usos, usuarios, asunciones y limitaciones',
        ),
      ]),
      section('3', 'Alternativas de soluci\u00f3n', [
        item('3.1', 'Revisi\u00f3n de antecedentes'),
        item('3.2', 'Marco normativo'),
        item('3.3', 'Descomposici\u00f3n del sistema'),
        item('3.4', 'Descripci\u00f3n de alternativas'),
      ]),
      section('4', 'Selecci\u00f3n de alternativas', [
        item('4.1', 'Matriz multicriterio'),
        item('4.2', 'Matriz de impactos'),
        item('4.3', 'Matriz de ciclo de vida'),
        item('4.4', 'Matriz de sostenibilidad'),
        item('4.5', 'Matriz de riesgos'),
        item('4.6', 'An\u00e1lisis de incertidumbre'),
        item('4.7', 'Otros criterios'),
      ]),
      section('5', 'Metodolog\u00eda de desarrollo del proyecto', [
        item('5.1', 'Metodolog\u00eda de validaci\u00f3n'),
        item('5.2', 'Trabajo de laboratorio'),
        item('5.3', 'Trabajo de campo'),
        item('5.4', 'Herramientas de simulaci\u00f3n'),
        item('5.5', 'Metodolog\u00eda de dise\u00f1o'),
      ]),
      section('6', 'Dise\u00f1o de soluci\u00f3n', [
        item('6.1', 'Descripci\u00f3n de la soluci\u00f3n'),
        item(
          '6.2',
          'C\u00e1lculo de dimensiones y condiciones de operaci\u00f3n',
        ),
        item('6.3', 'Diagrama de procesos y planos de la soluci\u00f3n'),
        item('6.4', 'Verificaci\u00f3n de cumplimiento normativo'),
      ]),
      section('7', 'Entregables', [
        item(
          '7.1',
          'Avance 1: Definici\u00f3n de problema, estado del arte y marco normativo',
        ),
        item(
          '7.2',
          'Avance 2: Descomposici\u00f3n del sistema, propuesta de alternativas, metodolog\u00eda de selecci\u00f3n de alternativas, validaci\u00f3n y dise\u00f1o',
        ),
        item(
          '7.3',
          'Avance 3: Selecci\u00f3n de alternativa, validaci\u00f3n (experimental, campo, simulaci\u00f3n)',
        ),
        item(
          '7.4',
          'Avance 4: Dise\u00f1o de soluci\u00f3n, memoria de c\u00e1lculo, planos',
        ),
        item('7.5', 'Informe final: integraci\u00f3n de avances 1 a 4'),
      ]),
    ],
    notes: [
      'Los entregables Avance 1 y Avance 2 hacen parte de Proyecto de Ingenier\u00eda I. Los entregables Avance 3 y Avance 4 hacen parte de Proyecto de Ingenier\u00eda II. El informe final se deposita en el repositorio de biblioteca.',
    ],
  },
  'ingenieria-industrial': {
    programId: 'ingenieria-industrial',
    programName: 'Ingenier\u00eda Industrial',
    introduction:
      'Mecanismos de requerimiento m\u00ednimos que cada proyecto de ingenier\u00eda industrial debe contener.',
    overviewItems: [
      item('overview-1', 'Eje tem\u00e1tico definido'),
      item('overview-2', 'Diagn\u00f3stico del problema'),
      item('overview-3', 'Justificaci\u00f3n de alternativas de soluci\u00f3n'),
      item('overview-4', 'Herramientas de desarrollo'),
      item('overview-5', 'Metodolog\u00eda'),
      item('overview-6', 'Entregables'),
      item('overview-7', 'Aspectos normativos'),
    ],
    sections: [
      section('1', 'Eje tem\u00e1tico claramente definido', [
        item(
          '1.1',
          'Factores humanos (Seguridad y ergonom\u00eda, talento humano)',
        ),
        item('1.2', 'Log\u00edstica y cadenas de Suministro'),
        item(
          '1.3',
          'Anal\u00edtica de procesos y datos, control (Estad\u00edsticas, Dise\u00f1o de Exp, Control de calidad)',
        ),
        item(
          '1.4',
          'Producci\u00f3n (Dise\u00f1o, planeaci\u00f3n, Programaci\u00f3n)',
        ),
        item(
          '1.5',
          'Mejoramiento continuo (Productividad y estandarizaci\u00f3n, estrategia)',
        ),
        item('1.6', 'Otros'),
      ]),
      section(
        '2',
        'An\u00e1lisis cualitativo y cuantitativo del diagn\u00f3stico del problema',
        [
          item('2.1', 'Diagrama de Pareto'),
          item('2.2', 'Diagrama de Ishikawa'),
          item('2.3', '\u00c1rbol de problemas'),
          item('2.4', 'Estad\u00edsticas asociadas (correlaciones, Test)'),
        ],
      ),
      section('3', 'Justificaci\u00f3n de las alternativas de soluci\u00f3n', [
        item('3.1', 'Revisi\u00f3n de la literatura'),
        item('3.2', 'An\u00e1lisis bibliom\u00e9trico'),
      ]),
      section('4', 'Herramientas de desarrollo', [
        item('4.1', 'Prototipo m\u00ednimo viable de mejora'),
        item(
          '4.2',
          'Modelos matem\u00e1ticos (optimizaci\u00f3n) y/o estad\u00edsticos',
        ),
        item('4.3', 'Simulaci\u00f3n (sistemas, Discreta, Game)'),
        item('4.4', 'Desarrollo (web, app, tableros digitales)'),
      ]),
      section('5', 'Metodolog\u00eda de desarrollo del proyecto', [
        item('5.1', 'Metodolog\u00eda definida y aplicada'),
        item('5.2', 'LEAN (PHVA \u2013 DEMAIC)'),
        item('5.3', 'ETL u otro de an\u00e1lisis de datos'),
        item('5.4', 'PMI-SCRUM (\u00c1giles)'),
        item('5.5', 'Optimizaci\u00f3n (MC)'),
        item('5.6', 'Otros'),
      ]),
      section('6', 'Entregables (4 documentos)', [
        item('6.1', 'Diagn\u00f3stico'),
        item('6.2', 'Dise\u00f1o y desarrollo'),
        item('6.3', 'Validaci\u00f3n'),
        item('6.4', 'An\u00e1lisis de costos e ingenier\u00eda econ\u00f3mica'),
      ]),
      section('7', 'Aspectos normativos', [
        item('7.1', 'Normas ISO'),
        item('7.2', 'Desarrollo de aplicaciones web'),
        item('7.3', 'Est\u00e1ndares para an\u00e1lisis de datos'),
        item('7.4', 'Normas t\u00e9cnicas asociadas al \u00e1rea del proyecto'),
      ]),
    ],
    notes: [
      'Se recomienda usar tecnolog\u00edas como Industria 4.0, Machine Learning, Green Lean Manufacturing, Manufactura Aditiva, Econom\u00eda Circular y visi\u00f3n artificial.',
      'El entregable 1 hace parte de Proyecto de Ingenier\u00eda I. Los entregables 2, 3 y 4 hacen parte de Proyecto de Ingenier\u00eda II. El informe final se deposita en el repositorio de biblioteca.',
    ],
  },
  'ingenieria-mecatronica': {
    programId: 'ingenieria-mecatronica',
    programName: 'Ingenier\u00eda Mecatr\u00f3nica',
    introduction:
      'Requisitos m\u00ednimos orientados al dise\u00f1o, construcci\u00f3n e integraci\u00f3n de un prototipo que responda a una necesidad o problema de ingenier\u00eda.',
    overviewItems: [
      item('overview-1', 'Eje tem\u00e1tico definido'),
      item('overview-2', 'Diagn\u00f3stico del problema'),
      item('overview-3', 'Justificaci\u00f3n de alternativas de soluci\u00f3n'),
      item('overview-4', 'Dise\u00f1o y construcci\u00f3n del prototipo'),
      item('overview-5', 'Metodolog\u00eda'),
      item('overview-6', 'Entregables'),
      item('overview-7', 'Aspectos normativos'),
    ],
    sections: [
      section('1', 'Eje tem\u00e1tico claramente definido', [
        item('1.1', 'Automatizaci\u00f3n y control'),
        item('1.2', 'Rob\u00f3tica y sistemas aut\u00f3nomos'),
        item(
          '1.3',
          'Dise\u00f1o de m\u00e1quinas y sistemas mecatr\u00f3nicos',
        ),
        item('1.4', 'Instrumentaci\u00f3n y sistemas de medici\u00f3n'),
        item('1.5', 'Sistemas embebidos y electr\u00f3nica aplicada'),
        item('1.6', 'Manufactura avanzada'),
        item('1.7', 'Otros'),
      ]),
      section('2', 'Diagn\u00f3stico del problema', [
        item('2.1', 'Caracterizaci\u00f3n del problema y sus causas'),
        item('2.2', 'Mediciones y datos que sustenten la necesidad'),
        item('2.3', 'Requisitos de funcionamiento y desempe\u00f1o'),
        item('2.4', 'Alcance y restricciones del proyecto'),
      ]),
      section('3', 'Justificaci\u00f3n de las alternativas de soluci\u00f3n', [
        item('3.1', 'Revisi\u00f3n de literatura y soluciones existentes'),
        item('3.2', 'An\u00e1lisis bibliom\u00e9trico'),
        item(
          '3.3',
          'Comparaci\u00f3n t\u00e9cnica y econ\u00f3mica de alternativas',
        ),
        item('3.4', 'Selecci\u00f3n justificada de la soluci\u00f3n'),
      ]),
      section('4', 'Dise\u00f1o y construcci\u00f3n del prototipo', [
        item('4.1', 'Dise\u00f1o mec\u00e1nico y selecci\u00f3n de materiales'),
        item('4.2', 'Dise\u00f1o el\u00e9ctrico y electr\u00f3nico'),
        item('4.3', 'Selecci\u00f3n de sensores y actuadores'),
        item('4.4', 'Modelado y estrategia de control'),
        item('4.5', 'Programaci\u00f3n del sistema (HMI)'),
        item('4.6', 'Construcci\u00f3n e integraci\u00f3n del prototipo'),
      ]),
      section('5', 'Metodolog\u00eda de desarrollo del proyecto', [
        item('5.1', 'Metodolog\u00eda definida y aplicada'),
        item(
          '5.2',
          'Etapas de dise\u00f1o, construcci\u00f3n e integraci\u00f3n',
        ),
        item('5.3', 'Plan de pruebas y criterios de aceptaci\u00f3n'),
        item('5.4', 'Evaluaci\u00f3n de resultados y ajustes del prototipo'),
      ]),
      section('6', 'Entregables (4 documentos)', [
        item('6.1', 'Diagn\u00f3stico y requisitos del sistema'),
        item('6.2', 'Dise\u00f1o y construcci\u00f3n del prototipo'),
        item('6.3', 'Validaci\u00f3n experimental del prototipo'),
        item('6.4', 'An\u00e1lisis de costos e ingenier\u00eda econ\u00f3mica'),
      ]),
      section('7', 'Aspectos normativos', [
        item('7.1', 'Normas t\u00e9cnicas aplicables al proyecto'),
        item('7.2', 'Seguridad mec\u00e1nica y el\u00e9ctrica'),
        item('7.3', 'Seguridad de operaci\u00f3n del prototipo'),
        item('7.4', 'Aspectos ambientales y \u00e9ticos aplicables'),
      ]),
    ],
    notes: [
      'Todo proyecto debe incluir la construcci\u00f3n, integraci\u00f3n y validaci\u00f3n de un prototipo f\u00edsico. La simulaci\u00f3n podr\u00e1 apoyar el dise\u00f1o y las pruebas. Los componentes espec\u00edficos se evaluar\u00e1n seg\u00fan el alcance, manteniendo la integraci\u00f3n mecatr\u00f3nica como requisito.',
      'El prototipo debe evidenciar la integraci\u00f3n de los componentes mec\u00e1nicos, electr\u00f3nicos, de control y programaci\u00f3n pertinentes. Su validaci\u00f3n debe demostrar el cumplimiento de los requisitos establecidos mediante pruebas y resultados medibles.',
      'Se podr\u00e1n incorporar tecnolog\u00edas como visi\u00f3n artificial, Internet de las cosas, inteligencia artificial o manufactura aditiva cuando contribuyan a la soluci\u00f3n del problema.',
    ],
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
