export type RubricItem = { readonly id: string; readonly label: string };
export type RubricSection = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly RubricItem[];
};
export type RubricTemplate = {
  readonly programId: string;
  readonly programName: string;
  readonly introduction: string;
  readonly overviewItems: readonly RubricItem[];
  readonly sections: readonly RubricSection[];
  readonly notes?: readonly string[];
};

export const RUBRIC_TEMPLATES: Readonly<Record<string, RubricTemplate>> = {
  "ingenieria-ambiental": {
    programId: "ingenieria-ambiental",
    programName: "Ingeniería Ambiental",
    introduction: "Mecanismos de requerimiento mínimos que cada proyecto de ingeniería ambiental debe contener.",
    overviewItems: [
      { id: "overview-1", label: "Eje temático definido" }, { id: "overview-2", label: "Diagnóstico del problema" }, { id: "overview-3", label: "Alternativas de solución" }, { id: "overview-4", label: "Selección de alternativas" }, { id: "overview-5", label: "Metodología" }, { id: "overview-6", label: "Diseño de solución" }, { id: "overview-7", label: "Entregables" },
    ],
    sections: [
      { id: "1", title: "Eje temático claramente definido", items: [
        { id: "1.1", label: "Control de la contaminación – matriz agua" }, { id: "1.2", label: "Control de la contaminación – matriz suelo" }, { id: "1.3", label: "Control de la contaminación – matriz aire" }, { id: "1.4", label: "Control de la contaminación – matriz residuos" }, { id: "1.5", label: "Otro" },
      ] },
      { id: "2", title: "Diagnóstico del problema", items: [
        { id: "2.1", label: "Definición del problema" }, { id: "2.2", label: "Herramientas visuales de análisis (árbol de problemas, diagrama de Ishikawa, etc.)" }, { id: "2.3", label: "Objetivos generales y específicos" }, { id: "2.4", label: "Descripción del ambiente operacional" }, { id: "2.5", label: "Listado de requisitos, usos, usuarios, asunciones y limitaciones" },
      ] },
      { id: "3", title: "Alternativas de solución", items: [
        { id: "3.1", label: "Revisión de antecedentes" }, { id: "3.2", label: "Marco normativo" }, { id: "3.3", label: "Descomposición del sistema" }, { id: "3.4", label: "Descripción de alternativas" },
      ] },
      { id: "4", title: "Selección de alternativas", items: [
        { id: "4.1", label: "Matriz multicriterio" }, { id: "4.2", label: "Matriz de impactos" }, { id: "4.3", label: "Matriz de ciclo de vida" }, { id: "4.4", label: "Matriz de sostenibilidad" }, { id: "4.5", label: "Matriz de riesgos" }, { id: "4.6", label: "Análisis de incertidumbre" }, { id: "4.7", label: "Otros criterios" },
      ] },
      { id: "5", title: "Metodología de desarrollo del proyecto", items: [
        { id: "5.1", label: "Metodología de validación" }, { id: "5.2", label: "Trabajo de laboratorio" }, { id: "5.3", label: "Trabajo de campo" }, { id: "5.4", label: "Herramientas de simulación" }, { id: "5.5", label: "Metodología de diseño" },
      ] },
      { id: "6", title: "Diseño de solución", items: [
        { id: "6.1", label: "Descripción de la solución" }, { id: "6.2", label: "Cálculo de dimensiones y condiciones de operación" }, { id: "6.3", label: "Diagrama de procesos y planos de la solución" }, { id: "6.4", label: "Verificación de cumplimiento normativo" },
      ] },
      { id: "7", title: "Entregables", items: [
        { id: "7.1", label: "Avance 1: Definición de problema, estado del arte y marco normativo" }, { id: "7.2", label: "Avance 2: Descomposición del sistema, propuesta de alternativas, metodología de selección de alternativas, validación y diseño" }, { id: "7.3", label: "Avance 3: Selección de alternativa, validación (experimental, campo, simulación)" }, { id: "7.4", label: "Avance 4: Diseño de solución, memoria de cálculo, planos" }, { id: "7.5", label: "Informe final: integración de avances 1 a 4" },
      ] },
    ],
    notes: ["Los entregables Avance 1 y Avance 2 hacen parte de Proyecto de Ingeniería I. Los entregables Avance 3 y Avance 4 hacen parte de Proyecto de Ingeniería II. El informe final se deposita en el repositorio de biblioteca."],
  },
  "ingenieria-industrial": {
    programId: "ingenieria-industrial",
    programName: "Ingeniería Industrial",
    introduction: "Mecanismos de requerimiento mínimos que cada proyecto de ingeniería industrial debe contener.",
    overviewItems: [
      { id: "overview-1", label: "Eje temático definido" }, { id: "overview-2", label: "Diagnóstico del problema" }, { id: "overview-3", label: "Justificación de alternativas de solución" }, { id: "overview-4", label: "Herramientas de desarrollo" }, { id: "overview-5", label: "Metodología" }, { id: "overview-6", label: "Entregables" }, { id: "overview-7", label: "Aspectos normativos" },
    ],
    sections: [
      { id: "1", title: "Eje temático claramente definido", items: [
        { id: "1.1", label: "Factores humanos (Seguridad y ergonomía, talento humano)" }, { id: "1.2", label: "Logística y cadenas de Suministro" }, { id: "1.3", label: "Analítica de procesos y datos, control (Estadísticas, Diseño de Exp, Control de calidad)" }, { id: "1.4", label: "Producción (Diseño, planeación, Programación)" }, { id: "1.5", label: "Mejoramiento continuo (Productividad y estandarización, estrategia)" }, { id: "1.6", label: "Otros" },
      ] },
      { id: "2", title: "Análisis cualitativo y cuantitativo del diagnóstico del problema", items: [
        { id: "2.1", label: "Diagrama de Pareto" }, { id: "2.2", label: "Diagrama de Ishikawa" }, { id: "2.3", label: "Árbol de problemas" }, { id: "2.4", label: "Estadísticas asociadas (correlaciones, Test)" },
      ] },
      { id: "3", title: "Justificación de las alternativas de solución", items: [ { id: "3.1", label: "Revisión de la literatura" }, { id: "3.2", label: "Análisis bibliométrico" } ] },
      { id: "4", title: "Herramientas de desarrollo", items: [
        { id: "4.1", label: "Prototipo mínimo viable de mejora" }, { id: "4.2", label: "Modelos matemáticos (optimización) y/o estadísticos" }, { id: "4.3", label: "Simulación (sistemas, Discreta, Game)" }, { id: "4.4", label: "Desarrollo (web, app, tableros digitales)" },
      ] },
      { id: "5", title: "Metodología de desarrollo del proyecto", items: [
        { id: "5.1", label: "Metodología definida y aplicada" }, { id: "5.2", label: "LEAN (PHVA – DEMAIC)" }, { id: "5.3", label: "ETL u otro de análisis de datos" }, { id: "5.4", label: "PMI-SCRUM (Ágiles)" }, { id: "5.5", label: "Optimización (MC)" }, { id: "5.6", label: "Otros" },
      ] },
      { id: "6", title: "Entregables (4 documentos)", items: [ { id: "6.1", label: "Diagnóstico" }, { id: "6.2", label: "Diseño y desarrollo" }, { id: "6.3", label: "Validación" }, { id: "6.4", label: "Análisis de costos e ingeniería económica" } ] },
      { id: "7", title: "Aspectos normativos", items: [ { id: "7.1", label: "Normas ISO" }, { id: "7.2", label: "Desarrollo de aplicaciones web" }, { id: "7.3", label: "Estándares para análisis de datos" }, { id: "7.4", label: "Normas técnicas asociadas al área del proyecto" } ] },
    ],
    notes: ["Se recomienda usar tecnologías como Industria 4.0, Machine Learning, Green Lean Manufacturing, Manufactura Aditiva, Economía Circular y visión artificial.", "El entregable 1 hace parte de Proyecto de Ingeniería I. Los entregables 2, 3 y 4 hacen parte de Proyecto de Ingeniería II. El informe final se deposita en el repositorio de biblioteca."],
  },
  "ingenieria-mecatronica": {
    programId: "ingenieria-mecatronica",
    programName: "Ingeniería Mecatrónica",
    introduction: "Requisitos mínimos orientados al diseño, construcción e integración de un prototipo que responda a una necesidad o problema de ingeniería.",
    overviewItems: [
      { id: "overview-1", label: "Eje temático definido" }, { id: "overview-2", label: "Diagnóstico del problema" }, { id: "overview-3", label: "Justificación de alternativas de solución" }, { id: "overview-4", label: "Diseño y construcción del prototipo" }, { id: "overview-5", label: "Metodología" }, { id: "overview-6", label: "Entregables" }, { id: "overview-7", label: "Aspectos normativos" },
    ],
    sections: [
      { id: "1", title: "Eje temático claramente definido", items: [ { id: "1.1", label: "Automatización y control" }, { id: "1.2", label: "Robótica y sistemas autónomos" }, { id: "1.3", label: "Diseño de máquinas y sistemas mecatrónicos" }, { id: "1.4", label: "Instrumentación y sistemas de medición" }, { id: "1.5", label: "Sistemas embebidos y electrónica aplicada" }, { id: "1.6", label: "Manufactura avanzada" }, { id: "1.7", label: "Otros" } ] },
      { id: "2", title: "Diagnóstico del problema", items: [ { id: "2.1", label: "Caracterización del problema y sus causas" }, { id: "2.2", label: "Mediciones y datos que sustenten la necesidad" }, { id: "2.3", label: "Requisitos de funcionamiento y desempeño" }, { id: "2.4", label: "Alcance y restricciones del proyecto" } ] },
      { id: "3", title: "Justificación de las alternativas de solución", items: [ { id: "3.1", label: "Revisión de literatura y soluciones existentes" }, { id: "3.2", label: "Análisis bibliométrico" }, { id: "3.3", label: "Comparación técnica y económica de alternativas" }, { id: "3.4", label: "Selección justificada de la solución" } ] },
      { id: "4", title: "Diseño y construcción del prototipo", items: [ { id: "4.1", label: "Diseño mecánico y selección de materiales" }, { id: "4.2", label: "Diseño eléctrico y electrónico" }, { id: "4.3", label: "Selección de sensores y actuadores" }, { id: "4.4", label: "Modelado y estrategia de control" }, { id: "4.5", label: "Programación del sistema (HMI)" }, { id: "4.6", label: "Construcción e integración del prototipo" } ] },
      { id: "5", title: "Metodología de desarrollo del proyecto", items: [ { id: "5.1", label: "Metodología definida y aplicada" }, { id: "5.2", label: "Etapas de diseño, construcción e integración" }, { id: "5.3", label: "Plan de pruebas y criterios de aceptación" }, { id: "5.4", label: "Evaluación de resultados y ajustes del prototipo" } ] },
      { id: "6", title: "Entregables (4 documentos)", items: [ { id: "6.1", label: "Diagnóstico y requisitos del sistema" }, { id: "6.2", label: "Diseño y construcción del prototipo" }, { id: "6.3", label: "Validación experimental del prototipo" }, { id: "6.4", label: "Análisis de costos e ingeniería económica" } ] },
      { id: "7", title: "Aspectos normativos", items: [ { id: "7.1", label: "Normas técnicas aplicables al proyecto" }, { id: "7.2", label: "Seguridad mecánica y eléctrica" }, { id: "7.3", label: "Seguridad de operación del prototipo" }, { id: "7.4", label: "Aspectos ambientales y éticos aplicables" } ] },
    ],
    notes: ["Todo proyecto debe incluir la construcción, integración y validación de un prototipo físico. La simulación podrá apoyar el diseño y las pruebas. Los componentes específicos se evaluarán según el alcance, manteniendo la integración mecatrónica como requisito.", "El prototipo debe evidenciar la integración de los componentes mecánicos, electrónicos, de control y programación pertinentes. Su validación debe demostrar el cumplimiento de los requisitos establecidos mediante pruebas y resultados medibles.", "Se podrán incorporar tecnologías como visión artificial, Internet de las cosas, inteligencia artificial o manufactura aditiva cuando contribuyan a la solución del problema."],
  },
};

export type RubricAnswer = { status: "yes" | "no" | "na" | null; observation: string };
export type RubricAnswers = Record<string, RubricAnswer>;
