export type ProjectProgram = {
  readonly id: string;
  readonly name: string;
};

export type ProjectSchoolCatalogEntry = {
  readonly id: string;
  readonly name: string;
  readonly programs: readonly ProjectProgram[];
};

export type ProjectProgramWithSchool = ProjectProgram & {
  readonly schoolId: string;
  readonly schoolName: string;
};

export const PROJECT_PROGRAMS = [
  {
    id: 'ingenieria-arquitectura-diseno',
    name: 'Escuela de Ingeniería, Arquitectura & Diseño',
    programs: [
      { id: 'arquitectura', name: 'Arquitectura' },
      { id: 'diseno', name: 'Diseño' },
      { id: 'ingenieria-civil', name: 'Ingeniería Civil' },
      { id: 'ingenieria-industrial', name: 'Ingeniería Industrial' },
      { id: 'ingenieria-ambiental', name: 'Ingeniería Ambiental' },
      { id: 'ingenieria-quimica', name: 'Ingeniería Química' },
      { id: 'ingenieria-naval', name: 'Ingeniería Naval' },
      { id: 'ingenieria-mecanica', name: 'Ingeniería Mecánica' },
      { id: 'ingenieria-electrica', name: 'Ingeniería Eléctrica' },
      { id: 'ingenieria-electronica', name: 'Ingeniería Electrónica' },
      { id: 'ingenieria-mecatronica', name: 'Ingeniería Mecatrónica' },
      { id: 'ingenieria-biomedica', name: 'Ingeniería Biomédica' },
    ],
  },
  {
    id: 'negocios-leyes-sociedad',
    name: 'Escuela de Negocios, Leyes y Sociedad',
    programs: [
      { id: 'administracion-empresas', name: 'Administración de Empresas' },
      {
        id: 'finanzas-negocios-internacionales',
        name: 'Finanzas y Negocios Internacionales',
      },
      { id: 'contaduria-publica', name: 'Contaduría Pública' },
      { id: 'derecho', name: 'Derecho' },
      { id: 'psicologia', name: 'Psicología' },
      { id: 'economia', name: 'Economía' },
      {
        id: 'ciencia-politica-relaciones-internacionales',
        name: 'Ciencia Política y Relaciones Internacionales',
      },
    ],
  },
  {
    id: 'transformacion-digital',
    name: 'Escuela de Transformación Digital',
    programs: [
      {
        id: 'ingenieria-sistemas-computacion',
        name: 'Ingeniería de Sistemas y Computación',
      },
      { id: 'ciencia-datos', name: 'Ciencia de Datos' },
      {
        id: 'marketing-transformacion-digital',
        name: 'Marketing y Transformación Digital',
      },
      { id: 'comunicacion-social', name: 'Comunicación Social' },
    ],
  },
] as const satisfies readonly ProjectSchoolCatalogEntry[];

export const PROJECT_PROGRAMS_FLAT: readonly ProjectProgramWithSchool[] =
  (() => {
    const programs: ProjectProgramWithSchool[] = [];

    for (const school of PROJECT_PROGRAMS) {
      for (const program of school.programs) {
        programs.push({
          ...program,
          schoolId: school.id,
          schoolName: school.name,
        });
      }
    }

    return programs;
  })();

export function findProjectProgram(
  programId: string,
): ProjectProgramWithSchool | undefined {
  return PROJECT_PROGRAMS_FLAT.find((program) => program.id === programId);
}
