import { AuthResponse, PublicUser } from './auth.models';

export const TEST_USER: PublicUser = {
  id: 'user-1',
  email: 'ana@example.com',
  fullName: 'Ana Pérez',
  phone: null,
  childName: null,
  childBirthDate: null,
  avatarUrl: null,
  hasPassword: true,
  googleLinked: false,
  role: 'customer',
  createdAt: '2026-10-14T10:00:00.000Z',
};

export function authResponse(accessToken = 'access-1'): AuthResponse {
  return { accessToken, user: TEST_USER };
}
