'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// stores
import { 
  useSupabaseUserStore, 
  useSupabaseUsers, 
  useSupabaseUserLoading, 
  useSupabaseUsersError,
  useSupabaseUserLoaded,
  useSupabaseIsAdmin,
  //useSupabaseCurrentUser
} from '@/store/supabase-store/user-db-store'
import { 
  useSupabaseResumeStore, 
  useSupabaseResumes, 
  useSupabaseResumeLoading, 
  useSupabaseResumeError 
} from '@/store/supabase-store/resume-db-store'

import { toast } from 'sonner'
import UserDetailsModal from './UserDetailsModal'
import ResumeDetailsModal from './ResumeDetailsModal'
import AnnouncementManagement from '@/components/AnnouncementManagement'
import type { User } from '@/types/supabase'
import type { Resume } from '@/types/supabase'

export default function AdminDashboardClient() {
  const router = useRouter()
  const users = useSupabaseUsers()
  const isUsersLoading = useSupabaseUserLoading()
  const usersError = useSupabaseUsersError()
  const isUserLoaded = useSupabaseUserLoaded()
  const isAdminUser = useSupabaseIsAdmin()
  //const currentUser = useSupabaseCurrentUser()
  const { fetchAllUsers } = useSupabaseUserStore()

  const resumes = useSupabaseResumes()
  const isResumesLoading = useSupabaseResumeLoading()
  const resumesError = useSupabaseResumeError()
  const { fetchAllResumes, deleteResume, updateResume } = useSupabaseResumeStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'resumes' | 'activity'>('overview')
  const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [verifyingResumeId, setVerifyingResumeId] = useState<string | null>(null)
  
  // Modal state for detailed views
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)

  // Client-side guard: only admins - redirect if not admin after user is loaded
  useEffect(() => {
    if (isUserLoaded && !isAdminUser) {
      toast.error('Access denied - Admin only')
      router.replace('/')
    }
  }, [isUserLoaded, isAdminUser, router])

  // Fetch data for admin
  useEffect(() => {
    if (isUserLoaded && isAdminUser) {
      fetchAllUsers()
      fetchAllResumes()
    }
  }, [isUserLoaded, isAdminUser, fetchAllUsers, fetchAllResumes])

  // Derived metrics
  const kpis = useMemo(() => {
    const totalUsers = users.length
    const proUsers = users.filter(u => u.role === 'pro').length
    const basicUsers = users.filter(u => u.role === 'basic').length
    const totalResumes = resumes.length

    return { totalUsers, proUsers, basicUsers, totalResumes }
  }, [users, resumes])

  // Filters and pagination for Users
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'pro' | 'basic'>('all')
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !userSearch 
        || u.name?.toLowerCase().includes(userSearch.toLowerCase()) 
        || u.email?.toLowerCase().includes(userSearch.toLowerCase())
      const matchesRole =
        userRoleFilter === 'all'
          ? true
          : userRoleFilter === 'admin'
              ? u.role === 'admin'
              : u.role === userRoleFilter
      return matchesSearch && matchesRole
    })
  }, [users, userSearch, userRoleFilter])

  const [userPage, setUserPage] = useState(1)
  const usersPerPage = 10
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage))
  const usersStartIdx = (userPage - 1) * usersPerPage
  const usersSlice = filteredUsers.slice(usersStartIdx, usersStartIdx + usersPerPage)

  useEffect(() => {
    setUserPage(1)
  }, [userSearch, userRoleFilter])

  // Filters and pagination for Resumes
  const [resumeSearch, setResumeSearch] = useState('')
  const [professionFilter, setProfessionFilter] = useState<string>('all')
  const uniqueProfessions = useMemo(() => {
    const setP = new Set<string>()
    resumes.forEach(r => {
      if (r.profession) setP.add(r.profession)
      if (r.work_type) setP.add(r.work_type)
      if (r.job_role) setP.add(r.job_role)
    })
    return Array.from(setP).sort()
  }, [resumes])

  const filteredResumes = useMemo(() => {
    return resumes.filter(r => {
      const matchesSearch = !resumeSearch 
        || r.name?.toLowerCase().includes(resumeSearch.toLowerCase())
        || r.city?.toLowerCase().includes(resumeSearch.toLowerCase())
        || r.user_location?.toLowerCase().includes(resumeSearch.toLowerCase())
        || r.email?.toLowerCase().includes(resumeSearch.toLowerCase())
      const roleLike = r.profession || r.work_type || r.job_role || ''
      const matchesProfession = professionFilter === 'all' || roleLike === professionFilter
      return matchesSearch && matchesProfession
    })
  }, [resumes, resumeSearch, professionFilter])

  const [resumePage, setResumePage] = useState(1)
  const resumesPerPage = 10
  const resumesTotalPages = Math.max(1, Math.ceil(filteredResumes.length / resumesPerPage))
  const resumesStartIdx = (resumePage - 1) * resumesPerPage
  const resumesSlice = filteredResumes.slice(resumesStartIdx, resumesStartIdx + resumesPerPage)
  const [showExtraResumeCols, setShowExtraResumeCols] = useState(false)

  useEffect(() => {
    setResumePage(1)
  }, [resumeSearch, professionFilter])

  // Handle resume verification toggle
  const handleToggleVerification = async (resumeId: string, currentStatus: string | null) => {
    try {
      setVerifyingResumeId(resumeId)
      
      // Toggle between 'no' and 'resume'
      const newStatus = currentStatus === 'resume' ? 'no' : 'resume'
      
      await updateResume(resumeId, { verified: newStatus })
      
      toast.success(`Resume ${newStatus === 'resume' ? 'verified' : 'unverified'} successfully`)
      
      // Refresh resumes list
      await fetchAllResumes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update verification status')
    } finally {
      setVerifyingResumeId(null)
    }
  }

  // Resume deletion handlers
  const handleDeleteResume = async () => {
    if (!deleteResumeId) return
    
    const resume = resumes.find(r => r.id === deleteResumeId)
    if (!resume) return
    
    try {
      setIsDeleting(true)
      
      // Delete the resume
      await deleteResume(deleteResumeId)
      
      // Update user's chef status to 'no'
      const { updateChefStatus } = useSupabaseUserStore.getState()
      await updateChefStatus(resume.user_id, 'no')
      
      toast.success(`Resume for ${resume.name} deleted successfully. User chef status updated.`)
      setDeleteResumeId(null)
      
      // Refresh both lists
      await fetchAllUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete resume')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (resumeId: string) => {
    setDeleteResumeId(resumeId)
  }

  const closeDeleteDialog = () => {
    setDeleteResumeId(null)
  }

  // CSV export helpers
  const exportUsersCsv = () => {
    const header = ['name','email','role','chef','created_at']
    const rows = users.map(u => [u.name, u.email, u.role, u.chef, u.created_at])
    const csv = [header, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportResumesCsv = () => {
    const header = ['name','email','phone','city','profession','experience_years']
    const rows = resumes.map(r => [r.name, r.email, r.phone, (r.city || r.user_location), (r.profession || r.work_type || r.job_role), r.experience_years])
    const csv = [header, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resumes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Show loading skeleton while checking auth
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-16 z-30 backdrop-blur-md bg-white/50 border-b border-white/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-16">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="bg-white/60 backdrop-blur-xl border-white/40 shadow-md">
                <CardHeader>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
          <Skeleton className="h-10 w-96 mb-6" />
          <Card className="bg-white/60 backdrop-blur-xl border-white/40">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Don't render if not admin - will redirect in useEffect
  if (!isAdminUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Glassy header */}
      <div className="sticky top-16 z-30 backdrop-blur-md bg-white/50 border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Organization overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => { fetchAllUsers(); fetchAllResumes(); }}>
              Refresh Data
            </Button>
            <div className="hidden sm:flex gap-2">
              <Button variant="outline" onClick={exportUsersCsv}>Export Users</Button>
              <Button variant="outline" onClick={exportResumesCsv}>Export Resumes</Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-16">
          {[
            { label: 'Total Users', value: kpis.totalUsers },
            { label: 'Pro Users', value: kpis.proUsers },
            { label: 'Basic Users', value: kpis.basicUsers },
            { label: 'Total Resumes', value: kpis.totalResumes },
          ].map((kpi, idx) => (
            <Card key={idx} className="bg-white/60 backdrop-blur-xl border-white/40 shadow-md ring-1 ring-white/40">
              <CardHeader>
                <CardDescription className="text-gray-600">{kpi.label}</CardDescription>
                <CardTitle className="text-3xl">
                  {isUsersLoading || isResumesLoading ? <Skeleton className="h-8 w-16" /> : kpi.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Simple Tabs */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-lg p-1 inline-flex gap-1">
          {(['overview','users','resumes','activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

          {/* Overview */}
          {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">
            {/* Announcements Management Section */}
            <AnnouncementManagement />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>High-level platform health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Users</span>
                    <Badge variant="secondary">{kpis.totalUsers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Pro Users</span>
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">{kpis.proUsers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Resumes</span>
                    <Badge variant="outline">{kpis.totalResumes}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest signups and resume updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isUsersLoading || isResumesLoading ? (
                    <>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-5 w-3/5" />
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700">New users (last 5): {users.slice(0,5).map(u => u.name || u.email).join(', ') || '—'}</div>
                      <div className="text-sm text-gray-700">New resumes (last 5): {resumes.slice(0,5).map(r => r.name).join(', ') || '—'}</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
          <div className="mt-6">
            <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
              <CardHeader className="space-y-2">
                <CardTitle>Users</CardTitle>
                <CardDescription>Search, filter and manage users</CardDescription>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Search by name or email..." 
                    value={userSearch} 
                    onChange={(e) => setUserSearch(e.target.value)} 
                  />
                  <Select value={userRoleFilter} onValueChange={(v: string) => setUserRoleFilter(v as 'all' | 'admin' | 'pro' | 'basic')}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Role filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportUsersCsv}>Export CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersError && <div className="text-red-600 mb-3">Error: {usersError}</div>}
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="text-left text-gray-600">
                      <tr className="sticky top-0 bg-white/80 backdrop-blur z-10">
                        <th className="py-2 pr-4 sticky left-0 bg-white/80 backdrop-blur">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Chef Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isUsersLoading ? Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="border-t border-gray-200/60">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </td>
                          <td className="py-3 pr-4"><Skeleton className="h-4 w-56" /></td>
                          <td className="py-3 pr-4"><Skeleton className="h-5 w-16" /></td>
                          <td className="py-3 pr-4"><Skeleton className="h-5 w-16" /></td>
                        </tr>
                      )) : usersSlice.map((u, idx) => (
                        <tr 
                          key={u.id || idx} 
                          className="border-t border-gray-200/60 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedUser(u)
                            setShowUserModal(true)
                          }}
                        >
                          <td className="py-3 pr-4 sticky left-0 bg-white group-hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.photo || ''} alt={u.name || 'User'} loading="lazy" />
                                <AvatarFallback>{(u.name || u.email || '?').charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-gray-900">{u.name || '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">{u.email || '—'}</td>
                          <td className="py-3 pr-4">
                            {u.role === 'admin' ? (
                              <Badge className="bg-black text-white border border-black">Admin</Badge>
                            ) : (
                              <Badge className={u.role === 'pro' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-blue-100 text-blue-800'}>
                                {u.role === 'pro' ? 'Pro' : 'Basic'}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className={u.chef === 'yes'
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-purple-100 text-purple-800 border border-purple-300'}>
                              {u.chef === 'yes' ? 'Chef' : 'Owner'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setUserPage(p => Math.max(1, p - 1)) }} />
                        </PaginationItem>
                        {Array.from({ length: usersTotalPages }).map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink href="#" isActive={userPage === (i + 1)} onClick={(e) => { e.preventDefault(); setUserPage(i + 1) }}>{i + 1}</PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setUserPage(p => Math.min(usersTotalPages, p + 1)) }} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Resumes */}
          {activeTab === 'resumes' && (
          <div className="mt-6">
            <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
              <CardHeader className="space-y-2">
                <CardTitle>Resumes</CardTitle>
                <CardDescription>Browse and export chef resumes</CardDescription>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Search by name, city, or email..." 
                    value={resumeSearch} 
                    onChange={(e) => setResumeSearch(e.target.value)} 
                  />
                  <Select value={professionFilter} onValueChange={(v: string) => setProfessionFilter(v)}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Profession filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueProfessions.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportResumesCsv}>Export CSV</Button>
                  <Button variant="outline" onClick={() => setShowExtraResumeCols(v => !v)}>
                    {showExtraResumeCols ? 'Hide Columns' : 'Show More Columns'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resumesError && <div className="text-red-600 mb-3">Error: {resumesError}</div>}
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full text-sm">
                    <thead className="text-left text-gray-600">
                      <tr className="sticky top-0 bg-white/80 backdrop-blur z-10">
                        <th className="py-2 pr-4 sticky left-0 bg-white/80 backdrop-blur">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Phone</th>
                        <th className="py-2 pr-4">Location</th>
                        <th className="py-2 pr-4">Profession</th>
                        <th className="py-2 pr-4">Experience</th>
                        <th className="py-2 pr-4">Verified</th>
                        {showExtraResumeCols && (
                          <>
                            <th className="py-2 pr-4">Work Type</th>
                            <th className="py-2 pr-4">Preferred Location</th>
                          </>
                        )}
                        <th className="py-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isResumesLoading ? Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="border-t border-gray-200/60">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </td>
                          <td className="py-3 pr-4"><Skeleton className="h-4 w-56" /></td>
                          <td className="py-3 pr-4"><Skeleton className="h-4 w-36" /></td>
                          <td className="py-3 pr-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="py-3 pr-4"><Skeleton className="h-4 w-28" /></td>
                          <td className="py-3 pr-4"><Skeleton className="h-4 w-12" /></td>
                          <td className="py-3 pr-4"><Skeleton className="h-8 w-20" /></td>
                          {showExtraResumeCols && (
                            <>
                              <td className="py-3 pr-4"><Skeleton className="h-4 w-20" /></td>
                              <td className="py-3 pr-4"><Skeleton className="h-4 w-24" /></td>
                            </>
                          )}
                          <td className="py-3 pr-4"><Skeleton className="h-8 w-20" /></td>
                        </tr>
                      )) : resumesSlice.map((r, idx) => (
                        <tr 
                          key={r.id || idx} 
                          className="border-t border-gray-200/60 group hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedResume(r)
                            setShowResumeModal(true)
                          }}
                        >
                          <td className="py-3 pr-4 sticky left-0 bg-white group-hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={r.photo || ''} alt={r.name || 'Chef'} loading="lazy" />
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm">{(r.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-gray-900">{r.name || '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">{r.email || '—'}</td>
                          <td className="py-3 pr-4">{r.phone || '—'}</td>
                          <td className="py-3 pr-4">{r.city || r.user_location || '—'}</td>
                          <td className="py-3 pr-4">{r.profession || r.work_type || r.job_role || '—'}</td>
                          <td className="py-3 pr-4">{r.experience_years ?? '—'}</td>
                          <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant={r.verified === 'resume' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleVerification(r.id, r.verified)}
                              disabled={verifyingResumeId === r.id}
                              className={r.verified === 'resume' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                            >
                              {verifyingResumeId === r.id ? '⏳' : r.verified === 'resume' ? '✓ Verified' : 'Verify'}
                            </Button>
                          </td>
                          {showExtraResumeCols && (
                            <>
                              <td className="py-3 pr-4">{r.work_type || '—'}</td>
                              <td className="py-3 pr-4">{r.preferred_location || '—'}</td>
                            </>
                          )}
                          <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(r.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              🗑️ Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {resumesTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setResumePage(p => Math.max(1, p - 1)) }} />
                        </PaginationItem>
                        {Array.from({ length: resumesTotalPages }).map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink href="#" isActive={resumePage === (i + 1)} onClick={(e) => { e.preventDefault(); setResumePage(i + 1) }}>{i + 1}</PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setResumePage(p => Math.min(resumesTotalPages, p + 1)) }} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Activity (enhanced insights) */}
          {activeTab === 'activity' && (
          <div className="mt-6 space-y-6">
            {/* Recent Signups Card */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Recent Signups
                </CardTitle>
                <CardDescription>Latest 10 user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {isUsersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.slice(0, 10).map((u, idx) => (
                      <div 
                        key={u.id || idx} 
                        className="flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={u.photo || ''} alt={u.name || 'User'} loading="lazy" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">{(u.name || u.email || '?').charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{u.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            u.role === 'admin' 
                              ? 'bg-black text-white border-black' 
                              : u.role === 'pro' 
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                          }>
                            {u.role}
                          </Badge>
                          <Badge className={
                            u.chef === 'yes' 
                              ? 'bg-green-100 text-green-800 border-green-300' 
                              : 'bg-purple-100 text-purple-800 border-purple-300'
                          }>
                            {u.chef === 'yes' ? 'Chef' : 'Owner'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(u.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Resumes Card */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  Recent Resume Submissions
                </CardTitle>
                <CardDescription>Latest 10 chef profiles created</CardDescription>
              </CardHeader>
              <CardContent>
                {isResumesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {resumes.slice(0, 10).map((r, idx) => (
                      <div 
                        key={r.id || idx} 
                        className="p-4 rounded-lg bg-gradient-to-br from-white/50 to-white/30 hover:from-white/70 hover:to-white/50 transition-all border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={r.photo || ''} alt={r.name || 'Chef'} loading="lazy" />
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-semibold">{(r.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-gray-900">{r.name}</div>
                              <div className="text-xs text-gray-500">{r.email}</div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">📍</span>
                            <span className="text-gray-700">{r.city || r.user_location || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">👨‍🍳</span>
                            <span className="text-gray-700">{r.profession || r.job_role || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">⏱️</span>
                            <span className="text-gray-700">{r.experience_years ? `${r.experience_years} years` : '—'}</span>
                          </div>
                          {r.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600">📞</span>
                              <span className="text-gray-700">{r.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Professions */}
              <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
                <CardHeader>
                  <CardTitle>Top Professions</CardTitle>
                  <CardDescription>Most common chef roles</CardDescription>
                </CardHeader>
                <CardContent>
                  {isResumesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(resumes.reduce((acc: Record<string, number>, r) => {
                        const key = (r.profession || r.job_role || r.work_type || 'Other')
                        acc[key] = (acc[key] || 0) + 1
                        return acc
                      }, {})).sort((a,b) => b[1]-a[1]).slice(0,8).map(([profession, count]) => {
                        const total = resumes.length
                        const percentage = ((count / total) * 100).toFixed(1)
                        return (
                          <div key={profession} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">{profession}</span>
                              <span className="text-gray-500">{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Cities */}
              <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
                <CardHeader>
                  <CardTitle>Top Cities</CardTitle>
                  <CardDescription>Geographic distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {isResumesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(resumes.reduce((acc: Record<string, number>, r) => {
                        const key = (r.city || r.user_location || 'Other')
                        acc[key] = (acc[key] || 0) + 1
                        return acc
                      }, {})).sort((a,b) => b[1]-a[1]).slice(0,8).map(([city, count]) => {
                        const total = resumes.length
                        const percentage = ((count / total) * 100).toFixed(1)
                        return (
                          <div key={city} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">{city}</span>
                              <span className="text-gray-500">{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 7-day Activity Chart */}
            <Card className="bg-white/60 backdrop-blur-xl border-white/40 ring-1 ring-white/40">
              <CardHeader>
                <CardTitle>7-Day Activity Trends</CardTitle>
                <CardDescription>User signups and resume submissions over the last week</CardDescription>
              </CardHeader>
              <CardContent>
                {(isUsersLoading || isResumesLoading) ? (
                  <Skeleton className="h-64 w-full" />
                ) : (() => {
                  const days = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (6 - i))
                    d.setHours(0,0,0,0)
                    return d
                  })
                  
                  const resumeCounts = days.map((d) => {
                    const next = new Date(d); next.setDate(d.getDate()+1)
                    return resumes.filter(r => {
                      const t = new Date(r.created_at)
                      return t >= d && t < next
                    }).length
                  })
                  
                  const userCounts = days.map((d) => {
                    const next = new Date(d); next.setDate(d.getDate()+1)
                    return users.filter(u => {
                      const t = new Date(u.created_at)
                      return t >= d && t < next
                    }).length
                  })
                  
                  const maxCount = Math.max(1, ...resumeCounts, ...userCounts)
                  const chartHeight = 200
                  const chartWidth = 600
                  const padding = 40
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <svg width={chartWidth + padding * 2} height={chartHeight + padding * 2} className="rounded-lg bg-white/50 ring-1 ring-white/40">
                          {/* Grid lines */}
                          {Array.from({ length: 5 }).map((_, i) => {
                            const y = padding + (i * chartHeight / 4)
                            return (
                              <line 
                                key={i} 
                                x1={padding} 
                                y1={y} 
                                x2={chartWidth + padding} 
                                y2={y} 
                                stroke="#e5e7eb" 
                                strokeWidth="1"
                              />
                            )
                          })}
                          
                          {/* Resume line */}
                          <polyline 
                            fill="none" 
                            stroke="#f97316" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={resumeCounts.map((c, i) => {
                              const x = padding + (i / 6) * chartWidth
                              const y = padding + chartHeight - (c / maxCount) * chartHeight
                              return `${x},${y}`
                            }).join(' ')} 
                          />
                          
                          {/* User line */}
                          <polyline 
                            fill="none" 
                            stroke="#3b82f6" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={userCounts.map((c, i) => {
                              const x = padding + (i / 6) * chartWidth
                              const y = padding + chartHeight - (c / maxCount) * chartHeight
                              return `${x},${y}`
                            }).join(' ')} 
                          />
                          
                          {/* Data points */}
                          {resumeCounts.map((c, i) => {
                            const x = padding + (i / 6) * chartWidth
                            const y = padding + chartHeight - (c / maxCount) * chartHeight
                            return (
                              <circle key={`r${i}`} cx={x} cy={y} r="4" fill="#f97316" />
                            )
                          })}
                          
                          {userCounts.map((c, i) => {
                            const x = padding + (i / 6) * chartWidth
                            const y = padding + chartHeight - (c / maxCount) * chartHeight
                            return (
                              <circle key={`u${i}`} cx={x} cy={y} r="4" fill="#3b82f6" />
                            )
                          })}
                          
                          {/* X-axis labels */}
                          {days.map((d, i) => {
                            const x = padding + (i / 6) * chartWidth
                            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            return (
                              <text 
                                key={i} 
                                x={x} 
                                y={chartHeight + padding + 20} 
                                textAnchor="middle" 
                                className="text-xs fill-gray-600"
                              >
                                {label}
                              </text>
                            )
                          })}
                        </svg>
                      </div>
                      
                      <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-orange-500 rounded"></div>
                          <span className="text-sm text-gray-700">Resumes ({resumeCounts.reduce((a, b) => a + b, 0)} this week)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-sm text-gray-700">Users ({userCounts.reduce((a, b) => a + b, 0)} this week)</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const snapshot = `KPI Snapshot (${new Date().toLocaleDateString()}):
Total Users: ${users.length}
Pro Users: ${users.filter(u=>u.role==='pro').length}
Admin Users: ${users.filter(u=>u.role==='admin').length}
Total Resumes: ${resumes.length}
Resumes This Week: ${resumeCounts.reduce((a, b) => a + b, 0)}
Users This Week: ${userCounts.reduce((a, b) => a + b, 0)}`
                            navigator.clipboard.writeText(snapshot)
                            toast.success('Snapshot copied to clipboard')
                          }}
                        >
                          📋 Copy KPI Snapshot
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
          )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteResumeId} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Do you want to delete <strong>{resumes.find(r => r.id === deleteResumeId)?.name}</strong>&apos;s resume?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              No
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteResume}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        open={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setSelectedUser(null)
        }}
        onUserDeleted={() => {
          fetchAllUsers()
        }}
      />

      {/* Resume Details Modal */}
      <ResumeDetailsModal
        resume={selectedResume}
        open={showResumeModal}
        onClose={() => {
          setShowResumeModal(false)
          setSelectedResume(null)
        }}
        onResumeDeleted={() => {
          fetchAllResumes()
          fetchAllUsers() // Refresh users to show updated chef status
        }}
      />
    </div>
  )
}
