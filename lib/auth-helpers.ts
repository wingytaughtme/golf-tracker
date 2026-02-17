import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

type AuthSession = {
  user: {
    id: string;
    role: 'admin' | 'user';
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

type AuthResult =
  | { session: AuthSession; error: null }
  | { session: null; error: NextResponse };

type OwnershipResult =
  | { authorized: true; error: null }
  | { authorized: false; error: NextResponse };

/**
 * Require an authenticated session. Returns the session or a 401 response.
 *
 * Usage:
 *   const { session, error } = await requireAuth();
 *   if (error) return error;
 *   // session.user.id is guaranteed
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return { session: session as AuthSession, error: null };
}

/**
 * Require that the authenticated user owns the resource.
 * Pass the resource's owner ID (e.g. created_by, user_id) and the session.
 * Admins bypass the ownership check.
 *
 * Usage:
 *   const { authorized, error } = requireOwnership(resource.created_by, session);
 *   if (error) return error;
 */
export function requireOwnership(
  resourceOwnerId: string | null | undefined,
  session: AuthSession
): OwnershipResult {
  if (session.user.role === 'admin') {
    return { authorized: true, error: null };
  }

  if (!resourceOwnerId || resourceOwnerId !== session.user.id) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, error: null };
}

/**
 * Require that the authenticated user has admin role.
 *
 * Usage:
 *   const { authorized, error } = requireAdmin(session);
 *   if (error) return error;
 */
export function requireAdmin(session: AuthSession): OwnershipResult {
  if (session.user.role !== 'admin') {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, error: null };
}
