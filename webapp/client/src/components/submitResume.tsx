'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useSupabaseResumeStore } from '@/store/supabase-store/resume-db-store';
import { useSupabaseCurrentUser, useSupabaseUserStore } from '@/store/supabase-store/user-db-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Define types for essential fields only
type JobType = 'full' | 'part' | 'contract';
type JoiningType = 'immediate' | 'specific';
type TrainingReadiness = 'yes' | 'no' | 'try';

// Common Indian cities
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat',
  'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Pimpri & Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
  'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan & Dombivali', 'Vasai Virar',
  'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur', 'Amritsar', 'Raipur', 'Allahabad',
  'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Madurai', 'Guwahati', 'Chandigarh',
  'Hubli and Dharwad', 'Amroha', 'Moradabad', 'Gurgaon', 'Aligarh', 'Solapur', 'Ranchi'
];

// Profession options
const PROFESSION_OPTIONS = [
  'Executive Chef',
  'Executive Sous Chef',
  'Sous Chef',
  'Junior Sous Chef',
  'Commis Chef',
  'Demi Chef de Partie',
  'Apprentice / Trainee',
  'Kitchen Steward / Kitchen Helper / Porter',
  'Baker / Chef Boulanger',
  'Butcher / Chef Boucher',
  'Chef de Partie - Indian Curry',
  'Chef de Partie - Tandoor',
  'Chef de Partie - Chaat',
  'Chef de Partie - Indian Sweets',
  'Others'
];

// Minimal 3-step form with essential fields only
interface ResumeFormData {
  // Step 1 - Essential Contact Info
  name: string;
  email: string;
  mobile: string;
  city: string;
  
  // Step 2 - Core Professional Info
  profession: string;
  professionOther: string; // Used when profession is 'Others'
  experience_years: number | '';
  cuisines: string;
  current_ctc: number | ''; // Changed to number for type safety
  expected_ctc: number | ''; // Changed to number for type safety
  
  // Step 3 - Work Preferences & Consent
  work_type: JobType;
  joining: JoiningType;
  training: TrainingReadiness;
  candidateConsent: boolean;
}

export function SubmitResume() {
  const { createResume, isLoading } = useSupabaseResumeStore();
  const currentUser = useSupabaseCurrentUser();
  const updateUser = useSupabaseUserStore((state) => state.updateUser);
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [resumeForm, setResumeForm] = React.useState<ResumeFormData>({
    // Step 1 - Essential Contact Info
    name: '',
    email: '',
    mobile: '',
    city: '',
    
    // Step 2 - Core Professional Info
    profession: '',
    professionOther: '',
    experience_years: '',
    cuisines: '',
    current_ctc: '', // Start as empty string, convert to number on input
    expected_ctc: '', // Start as empty string, convert to number on input
    
    // Step 3 - Work Preferences & Consent
    work_type: 'full',
    joining: 'immediate',
    training: 'yes',
    candidateConsent: false,
  });

  // Auto-fill email from logged-in user
  React.useEffect(() => {
    if (currentUser?.email) {
      setResumeForm((prev) => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    
    // Special handling for mobile number - only allow 10 digits
    if (id === 'mobile') {
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digit characters
      if (numericValue.length <= 10) {
        setResumeForm((prev: ResumeFormData) => ({ ...prev, [id]: numericValue }));
      }
      return;
    }
    
    // Handle numeric fields with proper validation
    if (id === 'experience_years' || id === 'current_ctc' || id === 'expected_ctc') {
      if (value === '') {
        setResumeForm((prev: ResumeFormData) => ({ ...prev, [id]: '' }));
      } else {
        const numericValue = Number(value);
        // Validate reasonable ranges
        if (id === 'experience_years' && (numericValue < 0 || numericValue > 50)) return;
        if ((id === 'current_ctc' || id === 'expected_ctc') && (numericValue < 0 || numericValue > 10000000)) return;
        setResumeForm((prev: ResumeFormData) => ({ ...prev, [id]: numericValue }));
      }
      return;
    }
    
    setResumeForm((prev: ResumeFormData) => ({ 
      ...prev, 
      [id]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSelectChange = (field: keyof ResumeFormData, value: string) => {
    setResumeForm((prev: ResumeFormData) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!resumeForm.name || !resumeForm.email || !resumeForm.mobile || !resumeForm.city) {
        toast.error('Please fill in all required fields');
        return;
      }
      // Validate mobile number
      if (resumeForm.mobile.length !== 10) {
        toast.error('Mobile number must be exactly 10 digits');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2
      if (!resumeForm.profession || !resumeForm.cuisines || resumeForm.experience_years === '') {
        toast.error('Please fill in all required fields');
        return;
      }
      // Check if 'Others' is selected and professionOther is empty
      if (resumeForm.profession === 'Others' && !resumeForm.professionOther.trim()) {
        toast.error('Please specify your profession');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Validate step 3
    if (!resumeForm.candidateConsent) {
      toast.error('Please provide candidate consent');
      return;
    }
    
    // Check if user is authenticated
    if (!currentUser) {
      toast.error('Please log in to submit your resume');
      return;
    }
    
    try {
      // Prepare resume data for Supabase with essential fields
      const resumeData = {
        user_id: currentUser.id,
        name: resumeForm.name,
        email: currentUser.email, // Use email from logged-in user
        phone: resumeForm.mobile,
        user_location: resumeForm.city,
        age_range: null, // Removed from form UI
        gender: null,
        city: resumeForm.city,
        user_state: null,
        pin_code: null,
        experience_years: typeof resumeForm.experience_years === 'number' ? resumeForm.experience_years : 0,
        experiences: null,
        profession: resumeForm.profession === 'Others' ? resumeForm.professionOther : resumeForm.profession,
        job_role: resumeForm.profession === 'Others' ? resumeForm.professionOther : resumeForm.profession,
        education: null,
        cuisines: resumeForm.cuisines,
        languages: null,
        certifications: null,
        current_ctc: typeof resumeForm.current_ctc === 'number' ? resumeForm.current_ctc.toString() : (resumeForm.current_ctc || ''),
        expected_ctc: typeof resumeForm.expected_ctc === 'number' ? resumeForm.expected_ctc.toString() : (resumeForm.expected_ctc || ''),
        notice_period: null,
        training: resumeForm.training,
        preferred_location: null, // Removed from form UI
        joining: resumeForm.joining,
        work_type: resumeForm.work_type,
        business_type: 'any' as 'any' | 'new' | 'old' | null,
        linkedin_profile: null,
        portfolio_website: null,
        bio: null,
        passport: null,
        photo: null,
        resume_file: null,
        verified: 'no',
      };
      
      // Save to Supabase database
      await createResume(resumeData);

      if (currentUser.chef !== 'yes') {
        await updateUser(currentUser.clerk_user_id, { chef: 'yes' });
      }
      
      toast.success('Resume submitted successfully!', {
        description: 'We have received your details and will get back to you shortly.',
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error submitting resume:', error);
      toast.error('Failed to submit resume. Please try again.');
    }
  };

  // Animation variants for page transitions
  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const pageTransition = {
    x: { type: "spring" as const, stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      custom={1}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={pageTransition}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Full Name / पूरा नाम *</Label>
        <Input 
          id="name" 
          type="text" 
          required 
          placeholder="Enter your full name" 
          value={resumeForm.name} 
          onChange={handleInputChange} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email / ईमेल *</Label>
        <Input 
          id="email" 
          type="email" 
          required 
          placeholder="john@example.com" 
          value={resumeForm.email} 
          onChange={handleInputChange}
          disabled
          className="bg-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500">Using your account email</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile No. / मोबाइल नंबर *</Label>
        <Input 
          id="mobile" 
          type="tel" 
          required 
          placeholder="9876543210" 
          value={resumeForm.mobile} 
          onChange={handleInputChange}
          maxLength={10}
        />
        <p className="text-xs text-gray-500">Enter 10 digit mobile number</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="city">City / शहर *</Label>
        <Select value={resumeForm.city} onValueChange={(value) => handleSelectChange('city', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your city" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {INDIAN_CITIES.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button 
          type="button" 
          onClick={handleNext}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md text-lg transition-colors shadow-md"
        >
          Next Page →
        </Button>
      </motion.div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      custom={1}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={pageTransition}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="space-y-2">
          <Label htmlFor="profession">Profession / पेशा *</Label>
          <Select value={resumeForm.profession} onValueChange={(value) => handleSelectChange('profession', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your profession" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {PROFESSION_OPTIONS.map((profession) => (
                <SelectItem key={profession} value={profession}>{profession}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience_years">Total Experience (Years) / कुल अनुभव (वर्ष) *</Label>
          <Input 
            id="experience_years" 
            type="number" 
            required 
            placeholder="5" 
            value={resumeForm.experience_years} 
            onChange={handleInputChange}
            min="0"
            max="50"
          />
        </div>
      </div>

      {resumeForm.profession === 'Others' && (
        <div className="space-y-2">
          <Label htmlFor="professionOther">Please specify your profession *</Label>
          <Input 
            id="professionOther" 
            type="text" 
            required 
            placeholder="Enter your profession" 
            value={resumeForm.professionOther} 
            onChange={handleInputChange} 
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="cuisines">Cuisines You Know / आप जानते हैं कुजीन *</Label>
        <Input 
          id="cuisines" 
          type="text" 
          required 
          placeholder="Indian, Chinese, Continental, Italian" 
          value={resumeForm.cuisines} 
          onChange={handleInputChange} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="current_ctc">Current Salary / वर्तमान वेतन</Label>
          <Input 
            id="current_ctc" 
            type="number" 
            placeholder="25000" 
            value={resumeForm.current_ctc} 
            onChange={handleInputChange}
            min="0"
            max="10000000"
            step="1000"
          />
          <p className="text-xs text-gray-500">Enter amount in ₹ (e.g., 25000)</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expected_ctc">Expected Salary / अपेक्षित वेतन</Label>
          <Input 
            id="expected_ctc" 
            type="number" 
            placeholder="35000" 
            value={resumeForm.expected_ctc} 
            onChange={handleInputChange}
            min="0"
            max="10000000"
            step="1000"
          />
          <p className="text-xs text-gray-500">Enter amount in ₹ (e.g., 35000)</p>
        </div>
      </div>
      
      <div className="flex gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1"
        >
          <Button 
            type="button" 
            onClick={() => setCurrentStep(1)}
            variant="outline"
            className="w-full py-3 px-4 rounded-md text-lg transition-colors"
          >
            ← Previous
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1"
        >
          <Button 
            type="button" 
            onClick={handleNext}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md text-lg transition-colors shadow-md"
          >
            Next Page →
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      custom={2}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={pageTransition}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="work_type">Work Type Preference / काम का प्रकार *</Label>
        <Select value={resumeForm.work_type} onValueChange={(value) => handleSelectChange('work_type', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select work type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Time / फुल टाइम</SelectItem>
            <SelectItem value="part">Part Time / पार्ट टाइम</SelectItem>
            <SelectItem value="contract">Contract / कॉन्ट्रैक्ट</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="joining">How soon can you join? / आप कितनी जल्दी शामिल हो सकते हैं? *</Label>
        <Select value={resumeForm.joining} onValueChange={(value) => handleSelectChange('joining', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select joining timeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediately / तुरंत</SelectItem>
            <SelectItem value="specific">Specific Role / विशिष्ट भूमिका</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="training">Are you ready for training? / क्या आप प्रशिक्षण के लिए तैयार हैं? *</Label>
        <Select value={resumeForm.training} onValueChange={(value) => handleSelectChange('training', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select training readiness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes, I&apos;m ready / हाँ, मैं तैयार हूं</SelectItem>
            <SelectItem value="no">No, not interested / नहीं, रुचि नहीं है</SelectItem>
            <SelectItem value="try">Try / कोशिश करें</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 p-4 bg-orange-50 rounded-lg">
          <Checkbox 
            id="candidateConsent" 
            checked={resumeForm.candidateConsent}
            onCheckedChange={(checked) => setResumeForm(prev => ({ ...prev, candidateConsent: checked as boolean }))}
          />
          <Label htmlFor="candidateConsent" className="text-sm">
            I agree that ChefDhundo can share my profile with potential employers and contact me regarding job opportunities. / 
            मैं सहमत हूँ कि ChefDhundo मेरी प्रोफ़ाइल को संभावित नियोक्ताओं के साथ साझा कर सकता है।
          </Label>
        </div>
      </div>

      <div className="flex gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1"
        >
          <Button 
            type="button" 
            onClick={() => setCurrentStep(2)}
            variant="outline"
            className="w-full py-3 px-4 rounded-md text-lg transition-colors"
          >
            ← Previous
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1"
        >
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={!resumeForm.candidateConsent || isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md text-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Submit Resume'}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      id="get-a-job"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="flex-1"
    >
      {currentUser?.chef === 'yes' ? (
        // Show this when user has already submitted resume
        <Card className="p-8 rounded-2xl shadow-xl border-0 bg-gradient-to-br from-orange-50 to-white">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">We Already have your Resume!</h2>
              <p className="text-gray-600">
                You have already submitted your resume. You can view or modify it from your dashboard.
              </p>
              <p className="text-gray-600 mt-1">
                आपने पहले ही अपना रिज्यूमे जमा कर दिया है। आप इसे अपने डैशबोर्ड से देख या संशोधित कर सकते हैं।
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors shadow-md"
              >
                Go to Dashboard / डैशबोर्ड पर जाएं
              </Button>
            </motion.div>
          </div>
        </Card>
      ) : (
        // Show the resume submission form
        <Card className="p-8 rounded-2xl shadow-xl border-0 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit Resume: Get a Job 👩‍🍳</h2>
            <div className="flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </AnimatePresence>
        </Card>
      )}
    </motion.div>
  );
}
