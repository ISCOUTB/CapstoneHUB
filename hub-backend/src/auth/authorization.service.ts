import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorRole, UserRole, ProjectStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  assertRole(user: AuthenticatedUser, role: UserRole): void {
    if (!user.roles.includes(role)) {
      throw new ForbiddenException(`The ${role} role is required`);
    }
  }

  async assertProjectMember(
    user: AuthenticatedUser,
    projectId: number,
  ): Promise<void> {
    if (user.roles.includes(UserRole.admin)) {
      return;
    }

    const assignment = await this.prisma.projectActorAssignment.findFirst({
      where: { projectId, userId: user.id },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException('Project assignment is required');
    }
  }

  async assertCanCreateProject(user: AuthenticatedUser): Promise<void> {
    if (user.roles.length === 0) {
      throw new ForbiddenException('A role is required to create projects');
    }
  }

  async assertCanManageProject(
    user: AuthenticatedUser,
    _projectId: number,
  ): Promise<void> {
    if (
      user.roles.includes(UserRole.admin) ||
      user.roles.includes(UserRole.evaluator)
    ) {
      return;
    }

    throw new ForbiddenException('The admin or evaluator role is required');
  }

  async assertCanAssignActors(
    user: AuthenticatedUser,
    _projectId: number,
  ): Promise<void> {
    if (
      user.roles.includes(UserRole.admin) ||
      user.roles.includes(UserRole.evaluator)
    ) {
      return;
    }

    throw new ForbiddenException('The admin or evaluator role is required');
  }

  async assertCanAssignStudents(
    user: AuthenticatedUser,
    _projectId: number,
  ): Promise<void> {
    if (
      user.roles.includes(UserRole.admin) ||
      user.roles.includes(UserRole.evaluator) ||
      user.roles.includes(UserRole.coordinator)
    ) {
      return;
    }

    throw new ForbiddenException(
      'The admin, evaluator, or coordinator role is required',
    );
  }

  async assertCanTransitionProject(
    user: AuthenticatedUser,
    _projectId: number,
    _previousStatus: ProjectStatus,
    _nextStatus: ProjectStatus,
  ): Promise<void> {
    if (
      user.roles.includes(UserRole.admin) ||
      user.roles.includes(UserRole.evaluator)
    ) {
      return;
    }

    throw new ForbiddenException('The admin or evaluator role is required');
  }

  async assertCanProvideFeedback(
    user: AuthenticatedUser,
    projectId: number,
  ): Promise<void> {
    const canProvideFeedback =
      user.roles.includes(UserRole.admin) ||
      user.roles.includes(UserRole.evaluator) ||
      user.roles.includes(UserRole.coordinator) ||
      user.roles.includes(UserRole.advisor);

    if (!canProvideFeedback) {
      throw new ForbiddenException(
        'The admin, evaluator, coordinator, or advisor role is required',
      );
    }

    await this.assertProjectMember(user, projectId);
  }

  async assertAssignableUser(userId: number, role: ActorRole): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        roleAssignments: { select: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (!user.isActive) {
      throw new ForbiddenException('Inactive users cannot be assigned');
    }

    if (!user.roleAssignments.some((assignment) => assignment.role === role)) {
      throw new ForbiddenException(
        `User ${userId} does not have the global ${role} role`,
      );
    }
  }

  private async assertProjectAssignment(
    user: AuthenticatedUser,
    projectId: number,
    role: ActorRole,
  ): Promise<void> {
    const assignment = await this.prisma.projectActorAssignment.findFirst({
      where: { projectId, userId: user.id, role },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException(
        `A project ${role} assignment is required for this action`,
      );
    }
  }
}
