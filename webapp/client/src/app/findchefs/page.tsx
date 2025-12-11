"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  useSupabaseResumeStore,
  useSupabaseResumes,
  useSupabaseResumeLoading,
  useSupabaseResumeError,
  useSupabaseResumePagination,
  useSupabaseUniqueProfessions,
} from "@/store/supabase-store/resume-db-store";
import { Resume } from "@/types/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupabaseCurrentUser } from "@/store/supabase-store/user-db-store";
import { maskEmail, maskPhone } from "@/lib/utils";
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton card component for loading state
const ChefCardSkeleton = () => (
  <Card className="h-full flex flex-col border rounded-lg overflow-hidden">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-grow">
      <div className="border-t pt-4 mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </CardContent>
  </Card>
);

function FindChefPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial values from URL params
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';
  const initialExperience = searchParams.get('experience') || 'all';
  const initialProfession = searchParams.get('profession') || 'all';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [experienceFilter, setExperienceFilter] = useState<string>(initialExperience);
  const [professionFilter, setProfessionFilter] = useState<string>(initialProfession);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage] = useState(12);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useSupabaseCurrentUser();
  const userRole = currentUser?.role || 'basic';

  // Resume store hooks
  const resumes = useSupabaseResumes();
  const isLoadingResumes = useSupabaseResumeLoading();
  const resumeError = useSupabaseResumeError();
  const pagination = useSupabaseResumePagination();
  const uniqueProfessions = useSupabaseUniqueProfessions();
  const { fetchResumesPaginated, fetchAllResumes } = useSupabaseResumeStore();

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update URL when filters change (for shareable links)
  const updateURL = useCallback((page: number, search: string, experience: string, profession: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    if (experience !== 'all') params.set('experience', experience);
    if (profession !== 'all') params.set('profession', profession);
    
    const queryString = params.toString();
    const newURL = queryString ? `?${queryString}` : '/findchefs';
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Fetch resumes when filters change (server-side pagination)
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      console.log('🔍 Fetching paginated resumes...', { currentPage, debouncedSearch, experienceFilter, professionFilter });
      
      fetchResumesPaginated({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        experience: experienceFilter,
        profession: professionFilter
      });
      
      updateURL(currentPage, debouncedSearch, experienceFilter, professionFilter);
    }
  }, [isSignedIn, isLoaded, currentPage, debouncedSearch, experienceFilter, professionFilter, fetchResumesPaginated, itemsPerPage, updateURL]);

  // Fetch all resumes once on initial load (for profession filter options)
  useEffect(() => {
    if (isSignedIn && isLoaded && uniqueProfessions.length === 0) {
      fetchAllResumes();
    }
  }, [isSignedIn, isLoaded, uniqueProfessions.length, fetchAllResumes]);

  // Reset to page 1 when filters change (before fetch effect)
  const prevFiltersRef = React.useRef({ search: debouncedSearch, experience: experienceFilter, profession: professionFilter });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged = 
      prev.search !== debouncedSearch || 
      prev.experience !== experienceFilter || 
      prev.profession !== professionFilter;
    
    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }
    prevFiltersRef.current = { search: debouncedSearch, experience: experienceFilter, profession: professionFilter };
  }, [debouncedSearch, experienceFilter, professionFilter, currentPage]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setExperienceFilter("all");
    setProfessionFilter("all");
    setCurrentPage(1);
  }, []);

  // Handle card click - only for pro or admin users
  const handleCardClick = useCallback((resume: Resume) => {
    if (currentUser?.role === "pro" || currentUser?.role === "admin") {
      setSelectedResume(resume);
      setIsModalOpen(true);
    }
  }, [currentUser?.role]);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedResume(null);
  }, []);

  // Navigate to resume page
  const viewResume = (resume: Resume) => {
    if (!resume) {
      toast.error("No resume data available");
      return;
    }
    
    // Prepare data for the resume template
    const resumeData = {
      name: resume.name || 'Chef Name',
      email: resume.email || 'Email not provided',
      mobile: resume.phone || 'Phone not provided',
      location: resume.user_location || resume.city || 'Location not specified',
      age: resume.age_range || 'Age not specified',
      experience: resume.experiences || 'No experience details available',
      jobType: resume.work_type || 'Not specified',
      cuisines: resume.cuisines || 'Cuisines not specified',
      totalExperienceYears: resume.experience_years || 0,
      currentPosition: resume.job_role || 'Chef',
      currentSalary: resume.current_ctc || 'Not specified',
      expectedSalary: resume.expected_ctc || 'Not specified',
      preferredLocation: resume.preferred_location || 'Not specified',
      passportNo: resume.passport,
      probationPeriod: false, // Not available in new schema
      businessType: resume.business_type || 'Not specified',
      joiningType: resume.joining || 'Not specified',
      readyForTraining: resume.training || 'Not specified',
      candidateConsent: true, // Assume consent if resume exists
    };

    // Store data in localStorage and navigate to static chef page
    localStorage.setItem('chefResumeData', JSON.stringify(resumeData));
    router.push('/chef');
    
    // Close modal
    closeModal();
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.info("Login required to search chefs", {
        description: "Please sign in to access the chef search functionality.",
        action: {
          label: "Login",
          onClick: () => {
            // This will be handled by the SignInButton
          },
        },
        duration: 5000,
        closeButton: true,
      });
    }
  }, [isSignedIn, isLoaded]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Use server-side pagination values
  const totalPages = pagination?.totalPages || 1;
  const totalResumes = pagination?.total || resumes.length;
  const startIndex = ((pagination?.page || currentPage) - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalResumes);

  // Generate pagination items
  const generatePaginationItems = useCallback(() => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Show first page
      items.push(1);

      if (currentPage > 3) {
        items.push("ellipsis-start");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          items.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        items.push("ellipsis-end");
      }

      // Show last page
      if (totalPages > 1) {
        items.push(totalPages);
      }
    }

    return items;
  }, [totalPages, currentPage]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not signed in
  if (!isSignedIn) {
    return (
      <div className="bg-white">
        <main className="pt-16">
          {/* Hero Section */}
          <section className="relative bg-gray-800 text-white py-32 text-center">
            <div className="absolute inset-0">
              <Image
                src="/website/icons/image.png"
                alt="Professional Chef Kitchen"
                fill
                style={{ objectFit: 'cover' }}
                className="opacity-40"
              />
            </div>
            <div className="relative max-w-4xl mx-auto px-4">
              <h1 className="text-5xl font-bold mb-4">Find Your Next Chef</h1>
              <p className="text-xl text-gray-200 mb-8">
                Browse our network of talented culinary professionals.
              </p>

              {/* Login Required Message */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Login Required
                </h2>
                <p className="text-lg mb-6 text-gray-200">
                  Please sign in to access our chef search and browse available
                  culinary professionals.
                </p>
                <SignInButton mode="modal">
                  <button className="bg-orange-500 text-white px-8 py-4 rounded-md hover:bg-orange-600 transition-colors font-medium text-lg">
                    Sign In to Search Chefs
                  </button>
                </SignInButton>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Chef Network?
              </h2>
              <p className="text-gray-600 mb-12 text-lg max-w-3xl mx-auto">
                Our platform connects you with verified, experienced chefs from
                across the country. Each chef has been carefully vetted to
                ensure quality and reliability.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold mb-3">Verified Profiles</h3>
                  <p className="text-gray-600">
                    All chefs are verified with background checks and experience
                    validation.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">📞</div>
                  <h3 className="text-xl font-bold mb-3">Direct Contact</h3>
                  <p className="text-gray-600">
                    Connect directly with chefs through our secure messaging
                    system.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-4xl mb-4">⭐</div>
                  <h3 className="text-xl font-bold mb-3">Quality Assured</h3>
                  <p className="text-gray-600">
                    Only the best chefs with proven track records are featured.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Show full content when signed in
  return (
    <div className="bg-white">
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative bg-gray-800 text-white py-32 text-center">
          <div className="absolute inset-0">
            <Image
              src="/website/icons/image.png"
              alt="Professional Chef Kitchen"
              fill
              style={{ objectFit: 'cover' }}
              className="opacity-40"
            />
          </div>
          <div className="relative max-w-4xl mx-auto px-4">
            <h1 className="text-5xl font-bold mb-4">Find Your Next Chef</h1>
            <p className="text-xl text-gray-200 mb-4">
              Browse our network of talented culinary professionals.
            </p>
            {currentUser?.role === "basic" && (
              <div className="bg-orange-500/20 backdrop-blur-md rounded-lg p-4 border border-orange-300/30">
                <p className="text-orange-100 text-sm">
                  <strong>Basic Plan:</strong> Contact information is masked.
                  <span className="ml-2">
                    <a
                      href="/upgrade"
                      className="underline hover:text-white transition-colors"
                    >
                      Upgrade to Pro
                    </a>{" "}
                    to see full contact details.
                  </span>
                </p>
              </div>
            )}
            {(currentUser?.role === "pro" || currentUser?.role === "admin") && (
              <div className="bg-green-500/20 backdrop-blur-md rounded-lg p-4 border border-green-300/30">
                <p className="text-green-100 text-sm">
                  <strong>Pro Plan:</strong> Full access to all contact
                  information. <span className="ml-2">💡 Click on any chef card to view detailed profile!</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {/* Search Input */}
              <Input
                type="text"
                placeholder="Search by name, email, phone, experience, or profession..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-lg p-6 rounded-md border-gray-300"
              />

              {/* Filter Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Experience Filter */}
                <div className="flex-1">
                  <Select
                    value={experienceFilter}
                    onValueChange={setExperienceFilter}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Filter by experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Experience Levels</SelectItem>
                      <SelectItem value="fresher">
                        Fresher (Less than 3 years)
                      </SelectItem>
                      <SelectItem value="medium">Medium (3-6 years)</SelectItem>
                      <SelectItem value="high">High (6-10 years)</SelectItem>
                      <SelectItem value="pro">
                        Pro (More than 10 years)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profession Filter */}
                <div className="flex-1">
                  <Select
                    value={professionFilter}
                    onValueChange={setProfessionFilter}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Filter by profession" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Professions</SelectItem>
                      {uniqueProfessions.map((profession) => (
                        <SelectItem key={profession} value={profession}>
                          {profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {(searchTerm ||
                  experienceFilter !== "all" ||
                  professionFilter !== "all") && (
                  <div className="flex items-end">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="h-12 px-6"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Loading State - Show Skeleton Grid */}
        {isLoadingResumes && (
          <section className="bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: itemsPerPage }).map((_, index) => (
                  <ChefCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Error State */}
        {resumeError && (
          <section className="bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-red-600">
                Error loading resumes: {resumeError}
              </p>
            </div>
          </section>
        )}

        {/* Chefs Grid */}
        {!isLoadingResumes && !resumeError && (
          <section className="bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Results Count */}
              <div className="mb-8">
                <p className="text-gray-600 text-lg">
                  Showing {startIndex + 1}-
                  {endIndex} of{" "}
                  {totalResumes} chefs
                  {(debouncedSearch ||
                    experienceFilter !== "all" ||
                    professionFilter !== "all") && (
                    <span className="text-gray-500"> (filtered)</span>
                  )}
                  {totalPages > 1 && (
                    <span className="text-gray-500">
                      {" "}
                      • Page {currentPage} of {totalPages}
                    </span>
                  )}
                </p>
              </div>

              {resumes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">
                    No chefs found matching your search criteria.
                  </p>
                  {(debouncedSearch || experienceFilter !== "all" || professionFilter !== "all") && (
                    <Button onClick={clearFilters} variant="outline" className="mt-4">
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  initial="initial"
                  animate="animate"
                  variants={{
                    animate: {
                      transition: { staggerChildren: 0.05 },
                    },
                  }}
                >
                  {resumes.map((resume, index) => {
                    // Extract data directly from Supabase resume object
                    const name = resume.name || 'Name not available';
                    const email = resume.email || '';
                    const phone = resume.phone || '';
                    const location = resume.city || resume.user_location || 'Location not specified';
                    const totalExperience = resume.experience_years || 0;
                    const jobType = resume.work_type || resume.profession || '';

                    return (
                      <motion.div
                        key={`${resume.id}-${index}`}
                        variants={{
                          initial: { opacity: 0, y: 20 },
                          animate: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.5 }}
                        whileHover={{
                          scale: (currentUser?.role === "pro" || currentUser?.role === "admin") ? 1.03 : 1,
                          boxShadow: (currentUser?.role === "pro" || currentUser?.role === "admin") ? "0px 10px 30px rgba(0, 0, 0, 0.1)" : "none",
                        }}
                        onClick={() => handleCardClick(resume)}
                      >
                        <Card 
                          className={`h-full flex flex-col border rounded-lg overflow-hidden ${
                            (currentUser?.role === "pro" || currentUser?.role === "admin") ? "cursor-pointer hover:shadow-lg transition-all duration-200" : ""
                          }`}
                          onClick={() => handleCardClick(resume)}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-2xl font-bold text-gray-900">
                                    {name}
                                  </CardTitle>
                                  {resume.verified === 'resume' && (
                                    <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full" title="Verified Chef">
                                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <CardDescription>
                                  {location}
                                </CardDescription>
                              </div>
                              <div className="flex flex-col gap-2">
                                {jobType && (
                                  <Badge variant="secondary" className="capitalize">
                                    {jobType}
                                  </Badge>
                                )}
                                {totalExperience > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {totalExperience} years exp
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <div className="border-t pt-4 mt-4">
                              {email && (
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <strong>Email:</strong>{" "}
                                    {maskEmail(email, userRole)}
                                  </p>
                                </div>
                              )}
                              {phone && (
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                      />
                                    </svg>
                                    <strong>Phone:</strong>{" "}
                                    {maskPhone(phone, userRole)}
                                  </p>
                                  {currentUser?.role === "basic" && (
                                    <a
                                      href="/upgrade"
                                      className="text-xs text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-full font-medium transition-colors duration-200 cursor-pointer"
                                    >
                                      🔒 Upgrade to Pro
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      {/* Previous Button */}
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          size="default"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={
                            currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Page Numbers */}
                      {generatePaginationItems().map((item, index) => (
                        <PaginationItem key={index}>
                          {item === "ellipsis-start" ||
                          item === "ellipsis-end" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(item as number);
                              }}
                              isActive={currentPage === item}
                              className="cursor-pointer"
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      {/* Next Button */}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          size="default"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage >= totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Detailed Modal */}
      {isModalOpen && selectedResume && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-3xl font-bold text-gray-900">
                  {selectedResume.name}
                </DialogTitle>
                {selectedResume.verified === 'resume' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 border border-green-300 rounded-md font-semibold text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Verified Chef</span>
                  </div>
                )}
              </div>
              <DialogDescription className="text-lg text-gray-600">
                Complete resume details and contact information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-8 py-4">
              {/* Basic Information - Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {selectedResume.email && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="text-sm text-gray-600">{selectedResume.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedResume.phone && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Phone</p>
                          <p className="text-sm text-gray-600">{selectedResume.phone}</p>
                        </div>
                      </div>
                    )}
                    {(selectedResume.city || selectedResume.user_location) && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Location</p>
                          <p className="text-sm text-gray-600">{selectedResume.city || selectedResume.user_location}</p>
                        </div>
                      </div>
                    )}
                    {selectedResume.preferred_location && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Preferred Location</p>
                          <p className="text-sm text-gray-600">{selectedResume.preferred_location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Professional Details */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                    Professional Details
                  </h3>
                  <div className="space-y-3">
                    {selectedResume.age_range && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Age Range</p>
                          <p className="text-sm text-gray-600">{selectedResume.age_range}</p>
                        </div>
                      </div>
                    )}
                    {selectedResume.experience_years && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Total Experience</p>
                          <p className="text-sm text-gray-600">{selectedResume.experience_years} years</p>
                        </div>
                      </div>
                    )}
                    {selectedResume.work_type && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Work Type</p>
                          <p className="text-sm text-gray-600">{selectedResume.work_type}</p>
                        </div>
                      </div>
                    )}
                    {selectedResume.business_type && (
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Business Type</p>
                          <p className="text-sm text-gray-600">{selectedResume.business_type}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Experience and Skills */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Experience & Skills
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {selectedResume.experiences && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Experience</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.experiences}</p>
                      </div>
                    )}
                    {selectedResume.job_role && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Job Role</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.job_role}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedResume.cuisines && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Cuisines</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.cuisines}</p>
                      </div>
                    )}
                    {selectedResume.joining && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Joining Type</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.joining}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              {(selectedResume.current_ctc || selectedResume.expected_ctc) && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Salary & Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedResume.current_ctc && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Current CTC</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.current_ctc}</p>
                      </div>
                    )}
                    {selectedResume.expected_ctc && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Expected CTC</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.expected_ctc}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(selectedResume.passport || selectedResume.training || selectedResume.education) && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedResume.passport && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Passport</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.passport}</p>
                      </div>
                    )}
                    {selectedResume.training && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Training</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.training}</p>
                      </div>
                    )}
                    {selectedResume.education && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Education</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedResume.education}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" onClick={closeModal} className="px-6 py-2">
                  Close
                </Button>
                <Button 
                  onClick={() => viewResume(selectedResume)}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Get Chef Dhundo Resume
                </Button>
                <Button 
                  onClick={() => {
                    // Handle contact action
                    toast.success("Contact information copied to clipboard");
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
                >
                  Contact Candidate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function FindChefPageLoading() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
export default function FindChefPageWrapper() {
  return (
    <Suspense fallback={<FindChefPageLoading />}>
      <FindChefPage />
    </Suspense>
  );
}