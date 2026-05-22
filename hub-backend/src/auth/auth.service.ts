import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24;

const authUserSelect = {
  id: true,
  fullName: true,
  email: true,
  isActive: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

type AuthUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

type UserSummary = {
  id: number;
  fullName: string;
  email: string;
};

@Injectable()
export class AuthService {
  private readonly tokenSecret =
    process.env.AUTH_SECRET ?? 'capstonehub-dev-secret';

  constructor(private readonly prisma: PrismaService) {}

  async register(payload: RegisterUserDto): Promise<AuthResponse> {
    const fullName = payload.fullName.trim();
    const email = this.normalizeEmail(payload.email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await this.hashPassword(payload.password);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        isActive: true,
      },
      select: authUserSelect,
    });

    return {
      user,
      accessToken: this.createAccessToken(user),
    };
  }

  async login(payload: LoginUserDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(payload.email);

    const userRecord = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userRecord || !userRecord.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.verifyPassword(
      payload.password,
      userRecord.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.update({
      where: { id: userRecord.id },
      data: { lastLoginAt: new Date() },
      select: authUserSelect,
    });

    return {
      user,
      accessToken: this.createAccessToken(user),
    };
  }

  async users(): Promise<UserSummary[]> {
    return this.prisma.user.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const [scheme, salt, storedKey] = storedHash.split('$');

    if (scheme !== 'scrypt' || !salt || !storedKey) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedKeyBuffer = Buffer.from(storedKey, 'hex');

    if (storedKeyBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedKeyBuffer, derivedKey);
  }

  private createAccessToken(user: AuthUser): string {
    const header = this.base64UrlEncode(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = this.base64UrlEncode(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        iat: issuedAt,
        exp: issuedAt + AUTH_TOKEN_TTL_SECONDS,
      }),
    );

    const signature = createHmac('sha256', this.tokenSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }
}
