'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { User } from '@/types/supabase'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSupabaseUserStore } from '@/store/supabase-store/user-db-store'

interface UserDetailsModalProps {
  user: User | null
  open: boolean
  onClose: () => void
  onUserDeleted?: () => void
}

export default function UserDetailsModal({ user, open, onClose, onUserDeleted }: UserDetailsModalProps) {
  const { updateUserById, deleteUser, updateChefStatus } = useSupabaseUserStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [editedName, setEditedName] = useState('')
  const [editedEmail, setEditedEmail] = useState('')
  const [editedPhoto, setEditedPhoto] = useState('')

  useEffect(() => {
    if (user) {
      setEditedName(user.name || '')
      setEditedEmail(user.email || '')
      setEditedPhoto(user.photo || '')
      setIsEditing(false)
      setShowDeleteConfirm(false)
    }
  }, [user])

  if (!user) return null

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateUserById(user.id, {
        name: editedName,
        email: editedEmail,
        photo: editedPhoto || null
      })
      toast.success('User updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRoleChange = async (newRole: 'pro' | 'admin' | 'basic') => {
    try {
      await updateUserById(user.id, { role: newRole })
      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const handleToggleChefStatus = async () => {
    const newStatus = user.chef === 'yes' ? 'no' : 'yes'
    try {
      await updateChefStatus(user.id, newStatus)
      toast.success(`Chef status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating chef status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update chef status')
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteUser(user.id)
      toast.success(`User ${user.name} deleted successfully`)
      setShowDeleteConfirm(false)
      onClose()
      if (onUserDeleted) onUserDeleted()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePasswordChange = () => {
    // Redirect to Clerk user management
    window.open('https://accounts.clerk.dev/user', '_blank')
    toast.info('Redirected to Clerk for password management')
  }

  return (
    <>
      <Dialog open={open && !showDeleteConfirm} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {user.photo && (
                <Image src={user.photo} alt={user.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
              )}
              <div>
                <div>{user.name || 'Unnamed User'}</div>
                <div className="text-sm font-normal text-gray-500">{user.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription>
              View and manage user details and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Profile Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setIsEditing(false)
                      setEditedName(user.name || '')
                      setEditedEmail(user.email || '')
                      setEditedPhoto(user.photo || '')
                    }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="photo">Photo URL</Label>
                    <Input
                      id="photo"
                      value={editedPhoto}
                      onChange={(e) => setEditedPhoto(e.target.value)}
                      placeholder="Enter photo URL"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <div className="font-medium">{user.name || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <div className="font-medium">{user.email || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">User ID:</span>
                    <div className="font-mono text-xs">{user.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Clerk ID:</span>
                    <div className="font-mono text-xs">{user.clerk_user_id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div className="font-medium">{new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Updated:</span>
                    <div className="font-medium">{new Date(user.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">Status & Role</h3>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-600">Current Role:</span>
                  <div className="mt-1">
                    {user.role === 'admin' ? (
                      <Badge className="bg-black text-white">Admin</Badge>
                    ) : user.role === 'pro' ? (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pro</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">Basic</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Chef Status:</span>
                  <div className="mt-1">
                    <Badge className={user.chef === 'yes' 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-purple-100 text-purple-800 border-purple-300'}>
                      {user.chef === 'yes' ? 'Chef' : 'Owner'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">Admin Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Role Management */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Change Role</Label>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRoleChange('basic')}
                      disabled={user.role === 'basic'}
                      className="justify-start"
                    >
                      Set as Basic
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRoleChange('pro')}
                      disabled={user.role === 'pro'}
                      className="justify-start"
                    >
                      Set as Pro
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRoleChange('admin')}
                      disabled={user.role === 'admin'}
                      className="justify-start"
                    >
                      Set as Admin
                    </Button>
                  </div>
                </div>

                {/* Other Actions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Other Actions</Label>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleToggleChefStatus}
                      className="justify-start"
                    >
                      Toggle Chef Status
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePasswordChange}
                      className="justify-start"
                    >
                      Change Password
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="justify-start"
                    >
                      🗑️ Delete User
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{user.name}</strong>?
              </p>
              <p className="text-red-600 font-semibold">
                ⚠️ WARNING: This action cannot be undone!
              </p>
              <p>
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User account and profile</li>
                <li>All associated resumes</li>
                <li>All payment records</li>
                <li>All subscription data</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
