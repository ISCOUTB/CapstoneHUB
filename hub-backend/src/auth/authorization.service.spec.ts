import { ForbiddenException } from '@nestjs/common';
import { ActorRole, UserRole } from '../generated/prisma/client';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  const user = (roles: UserRole[]) => ({
    id: 7,
    fullName: 'Test User',
    email: 'test@example.com',
    roles,
  });

  it.each([UserRole.admin, UserRole.evaluator])(
    'allows %s to manage projects without a project assignment',
    async (role) => {
    const findAssignment = jest.fn();
    const prisma = { projectActorAssignment: { findFirst: findAssignment } };
    const service = new AuthorizationService(prisma as never);

    await expect(
      service.assertCanManageProject(user([role]), 10),
    ).resolves.toBeUndefined();
    expect(findAssignment).not.toHaveBeenCalled();
    },
  );

  it.each([UserRole.coordinator, UserRole.advisor, UserRole.student])(
    'rejects %s from managing projects and changing status',
    async (role) => {
    const prisma = { projectActorAssignment: { findFirst: jest.fn() } };
    const service = new AuthorizationService(prisma as never);

    await expect(
      service.assertCanManageProject(user([role]), 10),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.assertCanTransitionProject(user([role]), 10, 'proposed', 'under_review'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it.each([UserRole.admin, UserRole.evaluator])(
    'allows %s to change project status',
    async (role) => {
      const service = new AuthorizationService({} as never);
      await expect(
        service.assertCanTransitionProject(user([role]), 10, 'proposed', 'under_review'),
      ).resolves.toBeUndefined();
    },
  );

  it.each([UserRole.admin, UserRole.evaluator, UserRole.coordinator])(
    'allows %s to assign students',
    async (role) => {
      const service = new AuthorizationService({} as never);
      await expect(
        service.assertCanAssignStudents(user([role]), 10),
      ).resolves.toBeUndefined();
    },
  );

  it.each([UserRole.advisor, UserRole.student])(
    'rejects %s from assigning students',
    async (role) => {
      const service = new AuthorizationService({} as never);
      await expect(
        service.assertCanAssignStudents(user([role]), 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it.each([UserRole.admin, UserRole.evaluator])(
    'allows %s to assign non-student actors',
    async (role) => {
      const service = new AuthorizationService({} as never);
      await expect(
        service.assertCanAssignActors(user([role]), 10),
      ).resolves.toBeUndefined();
    },
  );

  it('rejects coordinators from assigning non-student actors', async () => {
    const service = new AuthorizationService({} as never);
    await expect(
      service.assertCanAssignActors(user([UserRole.coordinator]), 10),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    UserRole.admin,
    UserRole.evaluator,
    UserRole.coordinator,
    UserRole.advisor,
  ])('allows assigned %s users to provide feedback', async (role) => {
    const findAssignment = jest.fn().mockResolvedValue({ id: 1 });
    const service = new AuthorizationService({
      projectActorAssignment: { findFirst: findAssignment },
    } as never);

    await expect(
      service.assertCanProvideFeedback(user([role]), 10),
    ).resolves.toBeUndefined();
  });

  it('rejects students from providing feedback', async () => {
    const service = new AuthorizationService({} as never);
    await expect(
      service.assertCanProvideFeedback(user([UserRole.student]), 10),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects inactive or globally incompatible assignees', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 8,
          isActive: false,
          roleAssignments: [{ role: UserRole.student }],
        }),
      },
    };
    const service = new AuthorizationService(prisma as never);

    await expect(
      service.assertAssignableUser(8, ActorRole.coordinator),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
