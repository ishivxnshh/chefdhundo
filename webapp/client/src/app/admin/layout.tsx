import { auth, getCurrentDbUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getCurrentDbUser();
  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
