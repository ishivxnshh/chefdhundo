import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

function getRoleFromClaims(sessionClaims: unknown): string {
  const claims = sessionClaims as
    | {
        metadata?: { role?: string };
        publicMetadata?: { role?: string };
        role?: string;
      }
    | undefined;

  return (
    claims?.metadata?.role ||
    claims?.publicMetadata?.role ||
    claims?.role ||
    'user'
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const role = getRoleFromClaims(sessionClaims);

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
