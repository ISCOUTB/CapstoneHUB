import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const bundledFixturesDir = resolve(__dirname, '..', 'fixtures');

export const FIXTURES_DIR =
  process.env.SEED_FIXTURES_DIR?.trim() ||
  (existsSync(bundledFixturesDir)
    ? bundledFixturesDir
    : resolve(process.cwd(), 'prisma', 'fixtures'));

export type SeedSection =
  | 'users'
  | 'projects'
  | 'actors'
  | 'milestones'
  | 'observations'
  | 'status'
  | 'attachments'
  | 'reports'
  | 'guides';

export const ALL_SECTIONS: SeedSection[] = [
  'users',
  'projects',
  'actors',
  'milestones',
  'observations',
  'status',
  'attachments',
  'reports',
  'guides',
];

const SECTION_DEPENDENCIES: Record<SeedSection, SeedSection[]> = {
  users: [],
  projects: [],
  actors: ['users', 'projects'],
  milestones: ['projects'],
  observations: ['users', 'projects'],
  status: ['projects', 'actors'],
  attachments: ['projects', 'users'],
  reports: ['projects'],
  guides: [],
};

export interface SeedOptions {
  only: Set<SeedSection> | null;
  reset: boolean;
  strict: boolean;
  dryRun: boolean;
  help: boolean;
  force: boolean;
}

export interface SeedContext {
  prisma: PrismaClient;
  options: SeedOptions;
}

export function parseArgs(argv: string[]): SeedOptions {
  const options: SeedOptions = {
    only: null,
    reset: false,
    strict: false,
    dryRun: false,
    help: false,
    force: false,
  };
  const only = new Set<SeedSection>();

  for (const arg of argv) {
    if (arg === '--reset') {
      options.reset = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--only=')) {
      const value = arg.slice('--only='.length);
      for (const rawSection of value.split(',')) {
        const section = rawSection.trim() as SeedSection;
        if (!ALL_SECTIONS.includes(section)) {
          throw new Error(
            `Unknown section "${rawSection}". Valid sections: ${ALL_SECTIONS.join(', ')}`,
          );
        }
        only.add(section);
      }
    } else {
      throw new Error(`Unknown argument "${arg}". Use --help for usage.`);
    }
  }

  options.only = only.size > 0 ? only : null;
  return options;
}

export function resolveSections(only: Set<SeedSection> | null): SeedSection[] {
  if (!only) {
    return [...ALL_SECTIONS];
  }

  const result = new Set<SeedSection>();
  const visit = (section: SeedSection): void => {
    if (result.has(section)) {
      return;
    }
    for (const dependency of SECTION_DEPENDENCIES[section]) {
      visit(dependency);
    }
    result.add(section);
  };

  for (const section of ALL_SECTIONS) {
    if (only.has(section)) {
      visit(section);
    }
  }

  return ALL_SECTIONS.filter((section) => result.has(section));
}

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Set it in hub-backend/.env or the environment before seeding.',
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export function loadFixture<T>(fileName: string): T {
  const filePath = resolve(FIXTURES_DIR, fileName);
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function requireUserId(
  prisma: PrismaClient,
  email: string,
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });

  if (!user) {
    throw new Error(
      `User "${email}" was not found. Run the users section first or check the fixtures.`,
    );
  }

  return user.id;
}

export async function requireProjectId(
  prisma: PrismaClient,
  name: string,
): Promise<number> {
  const project = await prisma.project.findFirst({
    where: { name },
    select: { id: true },
  });

  if (!project) {
    throw new Error(
      `Project "${name}" was not found. Run the projects section first or check the fixtures.`,
    );
  }

  return project.id;
}

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

export const log = {
  info: (message: string): void =>
    console.log(`${colors.cyan}[seed]${colors.reset} ${message}`),
  ok: (message: string): void =>
    console.log(`${colors.green}[seed]${colors.reset} ${message}`),
  warn: (message: string): void =>
    console.warn(`${colors.yellow}[seed]${colors.reset} ${message}`),
  error: (message: string): void =>
    console.error(`${colors.red}[seed]${colors.reset} ${message}`),
  step: (message: string): void =>
    console.log(
      `\n${colors.bold}${colors.cyan}== ${message} ==${colors.reset}`,
    ),
};

export function printHelp(): void {
  console.log(`
CapstoneHUB mock data seeder

Usage:
  npm run seed [-- <options>]

Options:
  --only=<sections>  Comma-separated sections to seed. Dependencies are added
                     automatically. Default: all sections.
                     Sections: ${ALL_SECTIONS.join(', ')}
  --reset            Remove seeded data (scoped to the selected sections)
                     before creating it again.
  --dry-run          Log what would happen without writing to the database.
  --force            Allow seeding when NODE_ENV=production (use with care).
  --strict           Fail instead of warning when attachments cannot be
                     uploaded (S3/RustFS unavailable).
  -h, --help         Show this help.

Examples:
  npm run seed
  npm run seed -- --only=users
  npm run seed -- --only=projects,actors,status
  npm run seed -- --reset
  npm run seed:users
`);
}
