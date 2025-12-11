import AdminDashboardClient from './AdminDashboardClient'

export default function AdminDashboardPage() {
  // Let the client component handle auth checks with Clerk's client-side state
  // This avoids server-side redirect issues when Clerk session is still initializing
  return <AdminDashboardClient />
}