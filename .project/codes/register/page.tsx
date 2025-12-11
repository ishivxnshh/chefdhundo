'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { User } from '@/types/notion_database';

export default function RegisterPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User store hooks - use individual selectors to prevent infinite loops
  //const createUser = useUserStore(state => state.createUser);
  const isLoading = useUserStore(state => state.isLoading);
  const error = useUserStore(state => state.error);
  
  const [formData, setFormData] = useState({
    name: user?.firstName || user?.lastName || '',
    role: 'basic' as 'basic' | 'pro',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📊 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      console.log('❌ File too large:', file.size, 'bytes');
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      toast.error('Please select a valid image file');
      return;
    }

    console.log('✅ File validation passed');
    setSelectedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('🖼️ Image preview created:', result.substring(0, 50) + '...');
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    console.log('🗑️ Removing selected image');
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Registration form submitted');
    console.log('📋 Form data:', formData);
    console.log('🖼️ Selected image:', selectedImage);
    console.log('🖼️ Image preview URL:', imagePreview);
    console.log('👤 Clerk user:', user);

    try {
      // Prepare user data for Notion
      // const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      //   name: formData.name,
      //   role: formData.role,
      //   email: user?.emailAddresses[0]?.emailAddress || '',
      //   photo: imagePreview || undefined, // Use the image preview URL
      // };

              // console.log('📤 User data being sent to store:', userData);

      // Use the store to create user
      console.log('🔄 Calling createUser from store...');
      //await createUser(userData);
      
      console.log('✅ User created successfully in Notion');
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        formData,
        userData: {
          name: formData.name,
          role: formData.role,
          email: user?.emailAddresses[0]?.emailAddress,
          photo: imagePreview || undefined,
        }
      });
      toast.error('Registration failed. Please try again.');
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  // Handle store errors with useEffect to prevent infinite loops
  useEffect(() => {
    if (error) {
      console.log('🚨 Store error detected:', error);
      toast.error(error);
    }
  }, [error]);

  // Log loading state changes with useEffect
  useEffect(() => {
    console.log('⏳ Loading state changed:', isLoading);
  }, [isLoading]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>
              You need to sign in to register for Chef Dhundo
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Registration</CardTitle>
          <CardDescription>
            Welcome {user.firstName || user.emailAddresses[0]?.emailAddress}! 
            Please complete your profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={imagePreview || user.imageUrl} 
                    alt={formData.name || 'Profile'} 
                  />
                  <AvatarFallback className="text-lg">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                {selectedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <p className="text-xs text-gray-500 text-center">
                Maximum file size: 2MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                required
              />
            </div>
            
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="role">Role</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Switch to Pro
                </Button>
              </div>
              <Select
                value={formData.role}
                onValueChange={(value: 'basic' | 'pro') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro" disabled>
                    Pro ⭐
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Switch to Pro for more features, Exclusive to you!
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </Button>
              <Button type="button" variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}