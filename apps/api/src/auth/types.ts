import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  email?: string | null;
  storeId?: string | null; // للتاجر: معرف المحل المرتبط بحسابه
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string | null;
  name: string;
  storeId?: string | null;
}
