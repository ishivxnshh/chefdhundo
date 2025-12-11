'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Resume } from '@/types/supabase'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useSupabaseResumeStore } from '@/store/supabase-store/resume-db-store'
import { useSupabaseUserStore } from '@/store/supabase-store/user-db-store'

interface ResumeDetailsModalProps {
  resume: Resume | null
  open: boolean
  onClose: () => void
  onResumeDeleted?: () => void
}

export default function ResumeDetailsModal({ resume, open, onClose, onResumeDeleted }: ResumeDetailsModalProps) {
  const { updateResume, deleteResume } = useSupabaseResumeStore()
  const { updateChefStatus } = useSupabaseUserStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state for all editable fields
  const [editedData, setEditedData] = useState<Partial<Resume>>({})

  useEffect(() => {
    if (resume) {
      setEditedData(resume)
      setIsEditing(false)
      setShowDeleteConfirm(false)
    }
  }, [resume])

  if (!resume) return null

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateResume(resume.id, editedData)
      toast.success('Resume updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating resume:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update resume')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      // Delete the resume
      await deleteResume(resume.id)
      
      // Update user's chef status to 'no'
      await updateChefStatus(resume.user_id, 'no')
      
      toast.success(`Resume for ${resume.name} deleted successfully. User chef status updated to "no".`)
      setShowDeleteConfirm(false)
      onClose()
      if (onResumeDeleted) onResumeDeleted()
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete resume')
    } finally {
      setIsDeleting(false)
    }
  }

  const updateField = (field: keyof Resume, value: unknown) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <Dialog open={open && !showDeleteConfirm} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {resume.photo && (
                  <Image src={resume.photo} alt={resume.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                  <div>{resume.name}</div>
                  <div className="text-sm font-normal text-gray-500">{resume.profession || resume.job_role || 'Chef'}</div>
                </div>
              </div>
              {!isEditing && (
                <Button variant="destructive" size="sm" onClick={() => setIsEditing(true)}>
                  ✏️ Edit Resume
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Edit the resume details below and save changes' : 'View complete resume information'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={editedData.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editedData.phone || ''}
                        onChange={(e) => updateField('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="age_range">Age Range</Label>
                      <Input
                        id="age_range"
                        value={editedData.age_range || ''}
                        onChange={(e) => updateField('age_range', e.target.value)}
                        placeholder="e.g., 25-35"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={editedData.gender || 'Prefer not to say'} onValueChange={(v) => updateField('gender', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-600">Name:</span> <div className="font-medium">{resume.name}</div></div>
                    <div><span className="text-gray-600">Email:</span> <div className="font-medium">{resume.email}</div></div>
                    <div><span className="text-gray-600">Phone:</span> <div className="font-medium">{resume.phone || '—'}</div></div>
                    <div><span className="text-gray-600">Age Range:</span> <div className="font-medium">{resume.age_range || '—'}</div></div>
                    <div><span className="text-gray-600">Gender:</span> <div className="font-medium">{resume.gender || '—'}</div></div>
                  </>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editedData.city || ''}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_state">State</Label>
                      <Input
                        id="user_state"
                        value={editedData.user_state || ''}
                        onChange={(e) => updateField('user_state', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pin_code">Pin Code</Label>
                      <Input
                        id="pin_code"
                        value={editedData.pin_code || ''}
                        onChange={(e) => updateField('pin_code', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_location">Current Location</Label>
                      <Input
                        id="user_location"
                        value={editedData.user_location || ''}
                        onChange={(e) => updateField('user_location', e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-600">City:</span> <div className="font-medium">{resume.city || '—'}</div></div>
                    <div><span className="text-gray-600">State:</span> <div className="font-medium">{resume.user_state || '—'}</div></div>
                    <div><span className="text-gray-600">Pin Code:</span> <div className="font-medium">{resume.pin_code || '—'}</div></div>
                    <div><span className="text-gray-600">Current Location:</span> <div className="font-medium">{resume.user_location || '—'}</div></div>
                  </>
                )}
              </div>
            </div>

            {/* Professional Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Professional Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={editedData.profession || ''}
                        onChange={(e) => updateField('profession', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="job_role">Job Role</Label>
                      <Input
                        id="job_role"
                        value={editedData.job_role || ''}
                        onChange={(e) => updateField('job_role', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience_years">Years of Experience</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        value={editedData.experience_years || ''}
                        onChange={(e) => updateField('experience_years', parseFloat(e.target.value) || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="education">Education</Label>
                      <Input
                        id="education"
                        value={editedData.education || ''}
                        onChange={(e) => updateField('education', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="experiences">Work Experience</Label>
                      <Textarea
                        id="experiences"
                        value={editedData.experiences || ''}
                        onChange={(e) => updateField('experiences', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-600">Profession:</span> <div className="font-medium">{resume.profession || '—'}</div></div>
                    <div><span className="text-gray-600">Job Role:</span> <div className="font-medium">{resume.job_role || '—'}</div></div>
                    <div><span className="text-gray-600">Experience:</span> <div className="font-medium">{resume.experience_years ? `${resume.experience_years} years` : '—'}</div></div>
                    <div><span className="text-gray-600">Education:</span> <div className="font-medium">{resume.education || '—'}</div></div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Work Experience:</span>
                      <div className="font-medium whitespace-pre-wrap mt-1">{resume.experiences || '—'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Skills & Expertise */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Skills & Expertise</h3>
              <div className="grid grid-cols-1 gap-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="cuisines">Cuisines</Label>
                      <Textarea
                        id="cuisines"
                        value={editedData.cuisines || ''}
                        onChange={(e) => updateField('cuisines', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="languages">Languages</Label>
                      <Textarea
                        id="languages"
                        value={editedData.languages || ''}
                        onChange={(e) => updateField('languages', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="certifications">Certifications</Label>
                      <Textarea
                        id="certifications"
                        value={editedData.certifications || ''}
                        onChange={(e) => updateField('certifications', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-600">Cuisines:</span> <div className="font-medium whitespace-pre-wrap">{resume.cuisines || '—'}</div></div>
                    <div><span className="text-gray-600">Languages:</span> <div className="font-medium whitespace-pre-wrap">{resume.languages || '—'}</div></div>
                    <div><span className="text-gray-600">Certifications:</span> <div className="font-medium whitespace-pre-wrap">{resume.certifications || '—'}</div></div>
                  </>
                )}
              </div>
            </div>

            {/* Compensation & Work Preferences */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Compensation & Preferences</h3>
              <div className="grid grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="current_ctc">Current CTC</Label>
                      <Input
                        id="current_ctc"
                        value={editedData.current_ctc || ''}
                        onChange={(e) => updateField('current_ctc', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expected_ctc">Expected CTC</Label>
                      <Input
                        id="expected_ctc"
                        value={editedData.expected_ctc || ''}
                        onChange={(e) => updateField('expected_ctc', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notice_period">Notice Period</Label>
                      <Input
                        id="notice_period"
                        value={editedData.notice_period || ''}
                        onChange={(e) => updateField('notice_period', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferred_location">Preferred Location</Label>
                      <Input
                        id="preferred_location"
                        value={editedData.preferred_location || ''}
                        onChange={(e) => updateField('preferred_location', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="work_type">Work Type</Label>
                      <Select value={editedData.work_type || 'full'} onValueChange={(v) => updateField('work_type', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Time</SelectItem>
                          <SelectItem value="part">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="joining">Joining</Label>
                      <Select value={editedData.joining || 'immediate'} onValueChange={(v) => updateField('joining', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="specific">Specific Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="training">Training Interest</Label>
                      <Select value={editedData.training || 'no'} onValueChange={(v) => updateField('training', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="try">Willing to Try</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="business_type">Business Type</Label>
                      <Select value={editedData.business_type || 'any'} onValueChange={(v) => updateField('business_type', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="old">Established</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-600">Current CTC:</span> <div className="font-medium">{resume.current_ctc || '—'}</div></div>
                    <div><span className="text-gray-600">Expected CTC:</span> <div className="font-medium">{resume.expected_ctc || '—'}</div></div>
                    <div><span className="text-gray-600">Notice Period:</span> <div className="font-medium">{resume.notice_period || '—'}</div></div>
                    <div><span className="text-gray-600">Preferred Location:</span> <div className="font-medium">{resume.preferred_location || '—'}</div></div>
                    <div><span className="text-gray-600">Work Type:</span> <div className="font-medium">{resume.work_type === 'full' ? 'Full Time' : resume.work_type === 'part' ? 'Part Time' : resume.work_type === 'contract' ? 'Contract' : '—'}</div></div>
                    <div><span className="text-gray-600">Joining:</span> <div className="font-medium">{resume.joining === 'immediate' ? 'Immediate' : resume.joining === 'specific' ? 'Specific Date' : '—'}</div></div>
                    <div><span className="text-gray-600">Training:</span> <div className="font-medium">{resume.training || '—'}</div></div>
                    <div><span className="text-gray-600">Business Type:</span> <div className="font-medium">{resume.business_type || '—'}</div></div>
                  </>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
                      <Input
                        id="linkedin_profile"
                        value={editedData.linkedin_profile || ''}
                        onChange={(e) => updateField('linkedin_profile', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolio_website">Portfolio/Website</Label>
                      <Input
                        id="portfolio_website"
                        value={editedData.portfolio_website || ''}
                        onChange={(e) => updateField('portfolio_website', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="passport">Passport</Label>
                      <Input
                        id="passport"
                        value={editedData.passport || ''}
                        onChange={(e) => updateField('passport', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editedData.bio || ''}
                        onChange={(e) => updateField('bio', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-600">LinkedIn:</span> <div className="font-medium break-all">{resume.linkedin_profile ? <a href={resume.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{resume.linkedin_profile}</a> : '—'}</div></div>
                    <div><span className="text-gray-600">Portfolio:</span> <div className="font-medium break-all">{resume.portfolio_website ? <a href={resume.portfolio_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{resume.portfolio_website}</a> : '—'}</div></div>
                    <div><span className="text-gray-600">Passport:</span> <div className="font-medium">{resume.passport || '—'}</div></div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Bio:</span>
                      <div className="font-medium whitespace-pre-wrap mt-1">{resume.bio || '—'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Resume Files */}
            {!isEditing && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-lg font-semibold">Files</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Photo:</span>
                    <div className="font-medium">{resume.photo ? <a href={resume.photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Photo</a> : '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Resume File:</span>
                    <div className="font-medium">{resume.resume_file ? <a href={resume.resume_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download Resume</a> : '—'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">Verification Status</h3>
              <div className="flex items-center gap-4">
                {isEditing ? (
                  <div className="flex-1">
                    <Label htmlFor="verified">Verified Status</Label>
                    <Select value={editedData.verified || 'no'} onValueChange={(v) => updateField('verified', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Not Verified</SelectItem>
                        <SelectItem value="resume">Verified ✓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">Status:</span>
                    {resume.verified === 'resume' ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 border border-green-300 rounded-md font-semibold">
                        <span className="text-lg">✓</span>
                        <span>Verified Resume</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-md">
                        <span>Not Verified</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {!isEditing && (
              <div className="space-y-2 pt-4 border-t text-sm text-gray-600">
                <div>Created: {new Date(resume.created_at).toLocaleString()}</div>
                <div>Last Updated: {new Date(resume.updated_at).toLocaleString()}</div>
                <div className="font-mono text-xs">Resume ID: {resume.id}</div>
                <div className="font-mono text-xs">User ID: {resume.user_id}</div>
              </div>
            )}
          </div>

          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false)
                  setEditedData(resume)
                }} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ Delete Resume
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete the resume for <strong>{resume.name}</strong>?
              </p>
              <p className="text-orange-600 font-semibold">
                ⚠️ This will also update the user&apos;s chef status from &quot;yes&quot; to &quot;no&quot;
              </p>
              <p className="text-red-600 font-semibold">
                This action cannot be undone!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              No, Keep It
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Resume'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
