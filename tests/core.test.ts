import { describe, it, expect, beforeAll } from 'bun:test';

let createJWT: any, verifyJWT: any;
let t: any, detectLocale: any;

beforeAll(async () => {
  createJWT = (await import('../src/jwt')).createJWT;
  verifyJWT = (await import('../src/jwt')).verifyJWT;
  t = (await import('../src/frontend/i18n')).t;
  detectLocale = (await import('../src/frontend/i18n')).detectLocale;
});

describe('jwt', () => {
  it('should create and verify a JWT', async () => {
    const secret = 'test-secret-key-1234567890';
    const token = await createJWT(secret, { sub: 'test' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
    const payload = await verifyJWT(token, secret);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('test');
  });

  it('should reject invalid JWT', async () => {
    const payload = await verifyJWT('invalid.token.here', 'secret');
    expect(payload).toBeNull();
  });

  it('should reject JWT with wrong secret', async () => {
    const token = await createJWT('secret1', {});
    const payload = await verifyJWT(token, 'secret2');
    expect(payload).toBeNull();
  });

  it('should reject expired JWT', async () => {
    const token = await createJWT('secret', {}, 0);
    const payload = await verifyJWT(token, 'secret');
    expect(payload).toBeNull();
  });
});

describe('i18n', () => {
  it('should translate zh keys', () => {
    const result = t('zh', 'site.title');
    expect(result).toBe('CF ShortURL');
  });

  it('should translate en keys', () => {
    const result = t('en', 'site.title');
    expect(result).toBe('CF ShortURL');
  });

  it('should detect locale from cookie', () => {
    expect(detectLocale('en-US', 'zh')).toBe('zh');
  });

  it('should detect locale from accept-language', () => {
    expect(detectLocale('zh-CN', null)).toBe('zh');
    expect(detectLocale('en-US', null)).toBe('en');
  });
});
