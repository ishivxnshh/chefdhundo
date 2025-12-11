# ChefDhundo Project Overview

## 1. Executive Summary
**ChefDhundo** is a specialized recruitment platform connecting hospitality professionals (Chefs) with employers (Hotel/Restaurant Owners). It features a modern, high-performance web application built with Next.js 15, offering advanced resume building, chef discovery, and a comprehensive admin dashboard for platform management.

## 2. Technical Architecture

### **Frontend**
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Shadcn UI, Magic UI, Framer Motion
*   **State Management:** Zustand
*   **Forms:** React Hook Form + Zod (inferred)
*   **PDF Generation:** `jspdf`, `html2canvas`

### **Backend & Database**
*   **BaaS:** Supabase (PostgreSQL)
*   **Authentication:** Clerk (Webhooks sync with Supabase `users` table)
*   **Database Features:** Row Level Security (RLS), Triggers, Edge Functions
*   **API:** Next.js Route Handlers (`/api/...`)

### **Infrastructure & Integrations**
*   **Hosting:** Vercel
*   **Payments:** Cashfree (Indian Payment Gateway)
*   **Analytics:** Vercel Analytics
*   **Notifications:** Sonner (Toast notifications)

## 3. Core Features

### **User (Chef/Candidate)**
*   **Resume Builder:** Multi-step wizard to create professional resumes.
*   **Profile Management:** Dashboard to manage personal details and resume visibility.
*   **PDF Download:** Generate and download resumes in PDF format.
*   **Subscription:** Upgrade to "Pro" status for better visibility.

### **User (Employer/Owner)**
*   **Find Chefs:** Advanced search engine with filters for City, Cuisine, and Experience.
*   **Chef Profiles:** View detailed chef profiles and contact information.

### **Admin (Platform Owner)**
*   **Dashboard:** Real-time KPIs (Total Users, Pro Users, Resumes).
*   **User Management:** View, search, filter, and edit user roles (Basic/Pro/Admin).
*   **Resume Management:** Browse all resumes, filter by profession/location.
*   **Data Export:** Export User and Resume data to CSV.
*   **Role Control:** Promote users to Pro or Admin directly from the dashboard.

## 4. Data Flow

1.  **Authentication:** User signs in via Clerk -> Clerk Webhook fires -> Supabase `users` table updated.
2.  **Resume Creation:** User fills form -> Data stored in Zustand -> POST to `/api/resumes` -> Saved to Supabase `resumes` table.
3.  **Payments:** User clicks "Upgrade" -> `/api/payment/create-order` (Cashfree) -> User pays -> Cashfree Webhook -> `/api/payment/webhook` updates Supabase `subscriptions` table.
4.  **Search:** Client requests `/api/resumes/search` -> Supabase Query (with filters) -> Results returned to UI.

## 5. Directory Structure Highlights

*   `client/src/app`: Next.js App Router pages.
*   `client/src/components`: Reusable UI components (Shadcn/MagicUI).
*   `client/src/store`: Global state (Zustand) for Chatbot, Chef, and Resumes.
*   `client/src/lib`: Utilities, Supabase client, Cashfree config.
*   `server/models`: SQL schemas for Database replication/backup.