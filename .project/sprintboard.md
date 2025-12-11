# ChefDhundo Sprint Board

This document serves as a project management tracker. Copy this structure to Google Sheets or use it directly here.

## 📌 Sheet 1: Backlog (Master List)

| ID | Feature / Task | Category | Priority | Status | Est. Hours | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| BK-001 | Implement Server-Side Pagination for Admin Dashboard | Performance | High | To Do | 8 | Current client-side fetch will crash with 1000+ users |
| BK-002 | Secure Payment Webhooks with Signature Verification | Security | Critical | To Do | 4 | Prevent fake payment confirmations |
| BK-003 | Add "Forgot Password" Flow (Clerk) | Auth | Medium | To Do | 2 | Ensure Clerk UI handles this correctly |
| BK-004 | Create "Chef of the Month" Section on Homepage | Feature | Low | To Do | 6 | Needs new DB field `is_featured` |
| BK-005 | Optimize Resume PDF Generation | Performance | Medium | To Do | 5 | `html2canvas` is slow on mobile |
| BK-006 | Add Email Notifications for New Orders | Feature | Medium | To Do | 4 | Use Resend or SendGrid |
| BK-007 | Implement Rate Limiting on API Routes | Security | High | To Do | 3 | Use `@upstash/ratelimit` |

## 🚀 Sheet 2: Active Sprint (Sprint 1)

**Goal:** Security Hardening & Core Stability
**Duration:** Nov 20 - Nov 27

| ID | Task | Assignee | Status | Due Date | Blockers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| BK-002 | Secure Payment Webhooks | Dev | In Progress | Nov 21 | None |
| BK-007 | API Rate Limiting | Dev | To Do | Nov 22 | Need Redis creds |
| BUG-001 | Fix Resume Template LocalStorage Issue | Dev | To Do | Nov 23 | None |
| BUG-002 | Fix Mobile Layout on "Find Chefs" | Dev | Done | Nov 20 | - |

## 🐛 Sheet 3: Bug Tracker

| Bug ID | Description | Severity | Reported By | Status | Fix Version |
| :--- | :--- | :--- | :--- | :--- | :--- |
| BUG-001 | Resume data lost on page refresh (LocalStorage) | High | QA | Open | v1.0.1 |
| BUG-002 | "Find Chefs" filters overlap on mobile screens | Medium | User | Fixed | v1.0.0 |
| BUG-003 | Admin Dashboard: "Export CSV" fails for >500 rows | Low | Admin | Open | v1.1.0 |
| BUG-004 | Clerk Sign-in redirects to 404 page occasionally | High | User | Investigating | - |

## 📅 Sheet 4: Planning & Retrospective

### Sprint 1 Retrospective
*   **What went well:** UI components are reusable and clean.
*   **What didn't go well:** Database RLS policies were too strict, causing 403 errors initially.
*   **Action Items:** Write unit tests for RLS policies before deploying.

### Sprint 2 Planning (Draft)
*   **Focus:** Performance Optimization
*   **Key Tasks:** BK-001 (Admin Pagination), BK-005 (PDF Gen)
