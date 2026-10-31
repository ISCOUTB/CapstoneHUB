import {
  findProjectProgram,
  PROJECT_PROGRAMS,
  PROJECT_PROGRAMS_FLAT,
} from './project-programs.constants';

describe('project programs catalog', () => {
  it('contains the three predefined schools', () => {
    expect(PROJECT_PROGRAMS).toHaveLength(3);
  });

  it('contains all 23 predefined programs', () => {
    expect(PROJECT_PROGRAMS_FLAT).toHaveLength(23);
  });

  it('uses unique identifiers for schools and programs', () => {
    const schoolIds = PROJECT_PROGRAMS.map((school) => school.id);
    const programIds = PROJECT_PROGRAMS_FLAT.map((program) => program.id);

    expect(new Set(schoolIds).size).toBe(schoolIds.length);
    expect(new Set(programIds).size).toBe(programIds.length);
  });

  it('resolves the school associated with a program', () => {
    expect(findProjectProgram('ingenieria-civil')).toMatchObject({
      name: 'Ingeniería Civil',
      schoolId: 'ingenieria-arquitectura-diseno',
      schoolName: 'Escuela de Ingeniería, Arquitectura & Diseño',
    });
  });

  it('returns undefined for an unknown program', () => {
    expect(findProjectProgram('programa-inexistente')).toBeUndefined();
  });
});
