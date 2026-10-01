import { Prisma } from '../../generated/prisma/client';
import { isDatabaseUnavailable } from './database-exception.filter';

describe('isDatabaseUnavailable', () => {
  it('detects Prisma initialization errors', () => {
    expect(
      isDatabaseUnavailable(
        new Prisma.PrismaClientInitializationError('boom', 'test'),
      ),
    ).toBe(true);
  });

  it.each(['P1001', 'P1002', 'P1008', 'P1017'])(
    'detects the Prisma connectivity code %s',
    (code) => {
      expect(
        isDatabaseUnavailable(
          new Prisma.PrismaClientKnownRequestError('boom', {
            code,
            clientVersion: 'test',
          }),
        ),
      ).toBe(true);
    },
  );

  it('ignores Prisma errors with unrelated codes', () => {
    expect(
      isDatabaseUnavailable(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      ),
    ).toBe(false);
  });

  it('detects driver codes wrapped in Prisma request errors', () => {
    expect(
      isDatabaseUnavailable(
        new Prisma.PrismaClientKnownRequestError('connect ECONNREFUSED', {
          code: 'ECONNREFUSED',
          clientVersion: 'test',
        }),
      ),
    ).toBe(true);
  });

  it('ignores connection errors from other services (e.g. S3/MinIO)', () => {
    const error = Object.assign(
      new AggregateError([], 'connect ECONNREFUSED'),
      { code: 'ECONNREFUSED' },
    );

    expect(isDatabaseUnavailable(error)).toBe(false);
  });

  it('ignores unrelated errors and values', () => {
    expect(isDatabaseUnavailable(new Error('nope'))).toBe(false);
    expect(isDatabaseUnavailable('nope')).toBe(false);
    expect(isDatabaseUnavailable(null)).toBe(false);
  });
});
