export type UserRole = 'customer' | 'admin';

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly childName: string | null;
  /** Fecha en formato YYYY-MM-DD. */
  readonly childBirthDate: string | null;
  readonly avatarUrl: string | null;
  readonly hasPassword: boolean;
  readonly googleLinked: boolean;
  readonly role: UserRole;
  readonly createdAt: string;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly user: PublicUser;
}

export interface AuthProviders {
  readonly google: { readonly clientId: string } | null;
}

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface RegisterRequest {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface ProfileUpdate {
  readonly fullName?: string;
  readonly phone?: string | null;
  readonly childName?: string | null;
  readonly childBirthDate?: string | null;
}

export interface PasswordChange {
  readonly currentPassword?: string;
  readonly newPassword: string;
}
