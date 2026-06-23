import 'dotenv/config';

/** The three roles supported by the application under test. */
export type Role = 'admin' | 'companyAdmin' | 'individual';

/** Which login form a role authenticates through. */
export type LoginMethod = 'company' | 'individual';

export interface RoleCredentials {
  readonly role: Role;
  readonly method: LoginMethod;
  /** Email for company logins, national ID for individual logins. */
  readonly username: string;
  readonly password: string;
  readonly otp: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill it in (local), or set the GitHub Secret (CI).`,
    );
  }
  return value;
}

/** Framework-wide configuration derived from the environment. */
export const config = {
  baseURL: process.env.BASE_URL ?? 'https://uat.contracts.com.sa',
  defaultLanguage: (process.env.DEFAULT_LANGUAGE ?? 'en') as 'en' | 'ar',
  healing: {
    enabled: (process.env.HEAL_ENABLED ?? 'true').toLowerCase() === 'true',
    confidenceThreshold: Number(process.env.HEAL_CONFIDENCE_THRESHOLD ?? '0.7'),
  },
} as const;

/**
 * Resolve credentials for a role. Reads lazily so a test that only exercises
 * one role does not require the other roles' secrets to be present.
 */
export function credentials(role: Role): RoleCredentials {
  switch (role) {
    case 'admin':
      return {
        role,
        method: 'company',
        username: required('ADMIN_USERNAME'),
        password: required('ADMIN_PASSWORD'),
        otp: required('ADMIN_OTP'),
      };
    case 'companyAdmin':
      return {
        role,
        method: 'company',
        username: required('COMPANY_ADMIN_USERNAME'),
        password: required('COMPANY_ADMIN_PASSWORD'),
        otp: required('COMPANY_ADMIN_OTP'),
      };
    case 'individual':
      return {
        role,
        method: 'individual',
        username: required('INDIVIDUAL_USERNAME'),
        password: required('INDIVIDUAL_PASSWORD'),
        otp: required('INDIVIDUAL_OTP'),
      };
  }
}
