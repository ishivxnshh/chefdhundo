'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useSupabaseUserStore } from '@/store/supabase-store/user-db-store';
import { useSupabaseResumeStore } from '@/store/supabase-store/resume-db-store';
import { Resume } from '@/types/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit2, X, Check, Upload, FileText, Loader2, Download, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
//import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Interface for editable resume data (complete Resume type for editing)
interface EditableResumeData {
  name: string;
  email: string;
  phone: string;
  user_location: string;
  age_range: string;
  gender: string;
  city: string;
  user_state: string;
  pin_code: string;
  experience_years: number;
  experiences: string;
  profession: string;
  job_role: string;
  education: string;
  cuisines: string;
  languages: string;
  certifications: string;
  current_ctc: string;
  expected_ctc: string;
  notice_period: string;
  training: string;
  preferred_location: string;
  joining: string;
  work_type: string;
  business_type: string;
  linkedin_profile: string;
  portfolio_website: string;
  bio: string;
  passport: string;
  photo: string;
  resume_file: string;
}

type ResumeEditableKey = keyof EditableResumeData & keyof Resume;

export default function DashboardPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { findAndSetCurrentUserByClerkId, currentUser, isLoading: userLoading, error: userError } = useSupabaseUserStore();
  const { fetchResumesByUserId, resumes, updateResume, isLoading: resumesLoading, error: resumesError } = useSupabaseResumeStore();
  const [userResume, setUserResume] = useState<Resume | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<EditableResumeData>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const hasFetchedResumes = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [deletingFile, setDeletingFile] = useState(false);

  // Derived Supabase user fields
  const userName = currentUser?.name ?? '';
  const userEmail = currentUser?.email ?? '';
  const userRole = currentUser?.role ?? '';
  const chefStatus = currentUser?.chef ?? '';
  const isChef = chefStatus === 'yes';

  useEffect(() => {
    hasFetchedResumes.current = false;
  }, [currentUser?.id, isChef]);

  // Fetch current user from Supabase when Clerk user is available
  useEffect(() => {
    if (clerkUser?.id) {
      console.log('🔍 Dashboard: Clerk user ID:', clerkUser.id);
      console.log('🔍 Dashboard: Fetching Supabase user with Clerk ID:', clerkUser.id);
      findAndSetCurrentUserByClerkId(clerkUser.id);
    }
  }, [clerkUser?.id, findAndSetCurrentUserByClerkId]);

  // Fetch user's resumes when current user is found and is a chef
  useEffect(() => {
    if (currentUser?.id && isChef && !hasFetchedResumes.current) {
      console.log('🔍 User is a chef, fetching resumes for Supabase user ID:', currentUser.id);
      console.log('🔍 Current user object:', currentUser);
      hasFetchedResumes.current = true;
      fetchResumesByUserId(currentUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, isChef]);

  // Set the first resume as user's resume (assuming one resume per user)
  useEffect(() => {
    if (resumes.length > 0) {
      console.log('✅ Dashboard: Resume found for user:', resumes[0]);
      setUserResume(resumes[0]);
    } else if (resumes.length === 0 && !resumesLoading) {
      console.log('📝 Dashboard: No resumes found for current user');
      setUserResume(null);
    }
  }, [resumes, resumesLoading]);


  const handleStartEditing = () => {
    if (userResume) {
      // Initialize edit values with current resume data
      const initialValues: Partial<EditableResumeData> = {
        name: userResume.name || '',
        email: userResume.email || '',
        phone: userResume.phone || '',
        user_location: userResume.user_location || '',
        age_range: userResume.age_range || '',
        gender: userResume.gender || '',
        city: userResume.city || '',
        user_state: userResume.user_state || '',
        pin_code: userResume.pin_code || '',
        experience_years: userResume.experience_years || 0,
        experiences: userResume.experiences || '',
        profession: userResume.profession || '',
        job_role: userResume.job_role || '',
        education: userResume.education || '',
        cuisines: userResume.cuisines || '',
        languages: userResume.languages || '',
        certifications: userResume.certifications || '',
        current_ctc: userResume.current_ctc || '',
        expected_ctc: userResume.expected_ctc || '',
        notice_period: userResume.notice_period || '',
        training: userResume.training || '',
        preferred_location: userResume.preferred_location || '',
        joining: userResume.joining || '',
        work_type: userResume.work_type || '',
        business_type: userResume.business_type || '',
        linkedin_profile: userResume.linkedin_profile || '',
        portfolio_website: userResume.portfolio_website || '',
        bio: userResume.bio || '',
        passport: userResume.passport || '',
        photo: userResume.photo || '',
        resume_file: userResume.resume_file || ''
      };
      setEditValues(initialValues);
      setIsEditing(true);
      setHasChanges(false);
    }
  };

  // View Chef Dhundo Resume (template)
  const handleViewChefDhundoResume = () => {
    if (!userResume) {
      toast.error('No resume data available');
      return;
    }

    const resumeData = {
      name: userResume.name || 'Chef Name',
      email: userResume.email || 'Email not provided',
      mobile: userResume.phone || 'Phone not provided',
      location: userResume.user_location || userResume.city || 'Location not specified',
      age: userResume.age_range || 'Age not specified',
      experience: userResume.experiences || 'No experience details available',
      jobType: userResume.work_type || 'Not specified',
      cuisines: userResume.cuisines || 'Cuisines not specified',
      totalExperienceYears: userResume.experience_years || 0,
      currentPosition: userResume.job_role || 'Chef',
      currentSalary: userResume.current_ctc || 'Not specified',
      expectedSalary: userResume.expected_ctc || 'Not specified',
      preferredLocation: userResume.preferred_location || 'Not specified',
      passportNo: userResume.passport,
      probationPeriod: false,
      businessType: userResume.business_type || 'Not specified',
      joiningType: userResume.joining || 'Not specified',
      readyForTraining: userResume.training || 'Not specified',
      candidateConsent: true,
    };

    try {
      localStorage.setItem('chefResumeData', JSON.stringify(resumeData));
      router.push('/chef');
    } catch (error) {
      console.error('Error opening template:', error);
      toast.error('Failed to open template');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({});
    setHasChanges(false);
    setSuccessMessage('');
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setEditValues(prev => ({ ...prev, [fieldName]: value }));
    setHasChanges(true);
  };

  const handleSaveAllChanges = async () => {
    if (!userResume?.id || !hasChanges) {
      console.log('❌ Cannot save - missing resume ID or no changes');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Process the edit values to ensure proper data types
      const processedUpdates: Partial<Resume> = {};

      const typedEntries = Object.entries(editValues) as Array<[
        ResumeEditableKey,
        EditableResumeData[ResumeEditableKey]
      ]>;

      typedEntries.forEach(([key, value]) => {
        if (value === undefined) {
          return;
        }

        if (key === 'experience_years') {
          const numericValue =
            typeof value === 'string'
              ? Number(value)
              : typeof value === 'number'
              ? value
              : null;

          const sanitizedValue: number | null =
            typeof numericValue === 'number' && !Number.isNaN(numericValue)
              ? numericValue
              : null;

          (processedUpdates as Record<string, number | string | null>)[key] = sanitizedValue;
          return;
        }

        (processedUpdates as Record<string, number | string | null>)[key] = value as string | null;
      });

      console.log('🔄 Saving all changes for resume:', userResume.id);
      console.log('🔄 Updates:', processedUpdates);
      
      await updateResume(userResume.id, processedUpdates);
      
      console.log('✅ All changes saved successfully');
      
      // Update local state
      setUserResume({
        ...userResume,
        ...processedUpdates
      } as Resume);
      
      // Show success message
      setSuccessMessage('All changes saved successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
      
      setIsEditing(false);
      setEditValues({});
      setHasChanges(false);
    } catch (error) {
      console.error('❌ Error saving changes:', error);
      setSuccessMessage('');
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userResume?.id) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      toast.error('Only PDF files are allowed');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploadingFile(true);
      setUploadError('');
      setUploadProgress(0);

      console.log('📤 Uploading file:', file.name);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resumeId', userResume.id);

      // Simulate progress (since fetch doesn't support upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload file
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ File uploaded successfully:', result.url);

      // Update local resume state
      setUserResume({
        ...userResume,
        resume_file: result.url,
      });

      // Show success message
      toast.success('Resume uploaded successfully!');
      setSuccessMessage('Resume uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  // Handle resume download
  const handleDownloadResume = async () => {
    if (!userResume?.id) return;

    try {
      setDownloadingFile(true);
      console.log('📥 Requesting download URL for resume:', userResume.id);

      const response = await fetch(`/api/resumes/download?resumeId=${userResume.id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to get download URL');
      }

      console.log('✅ Opening resume in new tab');
      
      // Open in new tab
      window.open(result.url, '_blank');
    } catch (error) {
      console.error('❌ Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download resume';
      toast.error(errorMessage);
    } finally {
      setDownloadingFile(false);
    }
  };

  // Handle resume delete
  const handleDeleteResume = async () => {
    if (!userResume?.id || !userResume.resume_file) return;
    if (!window.confirm('Delete your uploaded resume file? This cannot be undone.')) return;
    try {
      setDeletingFile(true);
      const res = await fetch('/api/resumes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: userResume.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');
      setUserResume({ ...userResume, resume_file: '' });
      toast.success('Resume file deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingFile(false);
    }
  };

  const renderField = (fieldName: string, label: string, value: unknown, type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' = 'text', options?: string[]) => {
    const editValue = editValues[fieldName as keyof EditableResumeData];
    const displayValue = isEditing ? editValue : value;

    return (
      <div className="flex items-center gap-4 mb-4">
        <Label className="font-medium text-gray-700 w-32">{label}:</Label>
        
        <div className="flex-1">
          {isEditing ? (
            fieldName === 'email' ? (
              <Input
                value={String(displayValue || '')}
                className="flex-1 bg-gray-100"
                readOnly
                disabled
              />
            ) : type === 'textarea' ? (
              <Textarea
                value={typeof displayValue === 'string' ? displayValue : ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                className="flex-1"
                rows={3}
              />
            ) : type === 'select' && options ? (
              <Select
                value={typeof displayValue === 'string' ? displayValue : ''}
                onValueChange={(value) => handleFieldChange(fieldName, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === 'checkbox' ? (
              <Checkbox
                checked={typeof displayValue === 'boolean' ? displayValue : false}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    handleFieldChange(fieldName, checked);
                  }
                }}
              />
            ) : (
              <Input
                type={type}
                value={type === 'number' ? (typeof displayValue === 'number' ? displayValue.toString() : '') : (typeof displayValue === 'string' ? displayValue : '')}
                onChange={(e) => {
                  const newValue = type === 'number' ? e.target.value : e.target.value;
                  handleFieldChange(fieldName, newValue);
                }}
                className="flex-1"
              />
            )
          ) : (
            <Input
              value={type === 'checkbox' ? (value ? 'Yes' : 'No') : String(value || '')}
              className="flex-1 bg-gray-50"
              readOnly
            />
          )}
        </div>
      </div>
    );
  };

  if (userLoading || (isChef && resumesLoading && !userResume)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (userError || (isChef && resumesError)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {userError || resumesError}</div>
      </div>
    );
  }

  // If user is a chef and has resume data, show editable form
  if (isChef && userResume) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                My Resume Dashboard
              </CardTitle>
              <p className="text-gray-600 text-center">
                {isEditing ? 'Edit your resume information below' : 'View and update your resume information'}
              </p>
              
              {!isEditing && (
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={handleStartEditing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isUpdating}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Resume
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h3>
                
                {renderField('name', 'Full Name', userResume.name)}
                {renderField('email', 'Email', userResume.email)} {/* Email is disabled */}
                {renderField('phone', 'Phone', userResume.phone)}
                {renderField('age_range', 'Age Range', userResume.age_range, 'select', ['18-25', '26-35', '36-45', '46-55', '55+'])}
                {renderField('gender', 'Gender', userResume.gender, 'select', ['Male', 'Female', 'Other', 'Prefer not to say'])}
                {renderField('city', 'City', userResume.city)}
                {renderField('user_state', 'State', userResume.user_state)}
                {renderField('pin_code', 'PIN Code', userResume.pin_code)}
                {renderField('user_location', 'Current Location/Position', userResume.user_location)}
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Professional Information
                </h3>
                
                {renderField('profession', 'Profession', userResume.profession)}
                {renderField('job_role', 'Job Role/Title', userResume.job_role)}
                {renderField('experience_years', 'Experience (Years)', userResume.experience_years, 'number')}
                {renderField('experiences', 'Work Experience Details', userResume.experiences, 'textarea')}
                {renderField('education', 'Education', userResume.education, 'textarea')}
                {renderField('cuisines', 'Cuisines Known', userResume.cuisines, 'textarea')}
                {renderField('languages', 'Languages', userResume.languages)}
                {renderField('certifications', 'Certifications', userResume.certifications, 'textarea')}
              </div>

              {/* Salary & Work Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Salary & Work Preferences
                </h3>
                
                {renderField('current_ctc', 'Current Salary', userResume.current_ctc)}
                {renderField('expected_ctc', 'Expected Salary', userResume.expected_ctc)}
                {renderField('notice_period', 'Notice Period', userResume.notice_period)}
                {renderField('preferred_location', 'Preferred Job Location', userResume.preferred_location)}
                {renderField('work_type', 'Work Type Preference', userResume.work_type, 'select', ['full', 'part', 'contract'])}
                {renderField('business_type', 'Business Type Preference', userResume.business_type, 'select', ['any', 'new', 'old'])}
                {renderField('joining', 'Joining Preference', userResume.joining, 'select', ['immediate', 'specific'])}
                {renderField('training', 'Ready for Training', userResume.training, 'select', ['yes', 'no', 'try'])}
              </div>

              {/* Professional Profile */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Professional Profile
                </h3>
                
                {renderField('bio', 'Bio/About Yourself', userResume.bio, 'textarea')}
                {renderField('linkedin_profile', 'LinkedIn Profile', userResume.linkedin_profile)}
                {renderField('portfolio_website', 'Portfolio/Website', userResume.portfolio_website)}
              </div>

              {/* Documents & Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Documents & Additional Information
                </h3>
                
                {renderField('passport', 'Passport Number', userResume.passport)}
                
                <div className="space-y-2">
                  <Label className="font-medium text-gray-700">Profile Photo:</Label>
                  <div className="text-sm text-gray-600">
                    {userResume.photo ? (
                      <a href={userResume.photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Current Photo
                      </a>
                    ) : (
                      'No photo uploaded'
                    )}
                  </div>
                </div>
                
                {/* Resume File Upload Section */}
                <div className="space-y-3 pt-2">
                  <Label className="font-medium text-gray-700">Resume File (PDF):</Label>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {/* Upload and download buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile || !userResume?.id}
                      className="flex items-center gap-2"
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Resume
                        </>
                      )}
                    </Button>
                    
                    {userResume?.resume_file && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleDownloadResume}
                        disabled={downloadingFile}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        {downloadingFile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            View Current Resume
                          </>
                        )}
                      </Button>
                    )}

                    {userResume?.resume_file && !uploadingFile && !downloadingFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Delete Resume"
                        onClick={handleDeleteResume}
                        disabled={deletingFile}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingFile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Upload progress */}
                  {uploadingFile && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                  
                  {/* Upload error */}
                  {uploadError && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {uploadError}
                    </p>
                  )}
                  
                  {/* Current file status */}
                  {userResume?.resume_file && !uploadingFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-md border border-green-200">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span>Resume file uploaded successfully</span>
                    </div>
                  )}
                  
                  {/* View Chef Dhundo Resume template */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={handleViewChefDhundoResume}
                      className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      View Chef Dhundo Resume
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    Upload a PDF file (max 10MB). This will be visible to employers viewing your profile.
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Resume Created:</strong> {userResume.created_at ? new Date(userResume.created_at).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Last Updated:</strong> {userResume.updated_at ? new Date(userResume.updated_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {isUpdating && (
                <div className="text-center text-blue-600">
                  Saving changes...
                </div>
              )}

              {successMessage && (
                <div className="text-center text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  {successMessage}
                </div>
              )}

              {isEditing && (
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    onClick={handleSaveAllChanges}
                    disabled={isUpdating || !hasChanges}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save All Changes {hasChanges ? `(${Object.keys(editValues).length} fields)` : ''}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex-1 py-3"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is not a chef or doesn't have resume data, show regular dashboard
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        
        {currentUser ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700 w-16">Name:</span>
              <Input 
                value={userName}
                className="w-64"
                readOnly
                disabled
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700 w-16">Email:</span>
              <Input 
                value={userEmail}
                className="w-64"
                readOnly
                disabled
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700 w-16">Role:</span>
              <Input 
                value={userRole}
                className="w-64"
                readOnly
                disabled
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700 w-16">Chef:</span>
              <Input 
                value={chefStatus}
                className="w-64"
                readOnly
                disabled
              />
            </div>
            {isChef && !userResume && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">No resume data found for your account.</p>
              </div>
            )}
            {/* <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700 w-16">Image:</span>
              <Avatar className="w-12 h-12">
                <AvatarImage src={userPhoto} alt="User avatar" />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {userName.charAt(0).toUpperCase() || '👤'}
                </AvatarFallback>
              </Avatar>
            </div> */}
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-orange-600">User not found in database</p>
            <p className="text-sm text-gray-500">Clerk ID: {clerkUser?.id}</p>
          </div>
        )}
        
      </div>
      <Toaster />
    </div>
  );
}
