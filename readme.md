# ChefDhundo 👨‍🍳🔥

Welcome to **ChefDhundo** – The ultimate platform bridging the gap between culinary talent and top-tier restaurants and outlets. ChefDhundo streamlines the process of hiring chefs for outlets and helps talented chefs find their dream culinary roles.

## 🚀 Key Features

- **Role-Based Workflows**: Separate, tailored experiences for Chefs and Outlet Owners.
- **Secure Authentication**: Mobile OTP authentication with TextBee, Supabase OTP storage, and a first-party HttpOnly session cookie.
- **Payment Processing**: Seamless, secure transactions integrated with RazorPay and Cashfree.
- **Resume Management**: Effortless resume generation, uploads, and downloads using jsPDF and html2canvas.
- **Dynamic Portfolios**: Showcase culinary skills and outlet requirements with beautiful, modern interfaces.
- **Interactive UI**: Responsive and highly interactive interfaces built with Tailwind CSS, Radix UI Primitives, and Framer Motion.
- **Admin Dashboard**: Comprehensive management interface for tracking users, payments, and matches.

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Primitives
- **Animations**: Framer Motion, tw-animate-css
- **Backend / Database**: Supabase (PostgreSQL)
- **Authentication**: Mobile OTP (TextBee + Supabase + custom session cookie)
- **Payments**: RazorPay
- **State Management**: Zustand
- **Deployment**: Vercel

## 📁 Project Structure

The repository is organized into a main web application directory containing both client and server side code:

```
chefdhundo/
├── webapp/
│   ├── client/          # Next.js 15 frontend & API routes
│   │   ├── src/app/     # Application routes (App Router)
│   │   ├── src/components/ # Reusable UI components
│   │   └── public/      # Static assets
│   └── server/          # Additional backend services / DB commands
├── DEPLOYMENT.md        # Comprehensive deployment guide
└── readme.md            # Project documentation
```

## ⚙️ Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- npm or yarn

## 💻 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ishivxnshh/chefdhundo.git
cd chefdhundo
```

### 2. Install Dependencies

Navigate to the client directory and install dependencies:

```bash
cd webapp/client
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the `webapp/client` directory based on the provided `.env.example`:

```bash
cp .env.example .env.local
```

You will need to populate the environment variables for the following services:
- **Mobile OTP**: TextBee device/API key plus `OTP_SECRET` and `AUTH_SECRET`
- **Supabase**: Database connection keys (`SUPABASE_PROJECT_URL`, `SUPABASE_PUBLIC_ANON_KEY`, etc.)
- **Payment Gateways**: Keys for RazorPay and Cashfree (`RAZORPAY_KEY_ID`, `CASHFREE_CLIENT_ID`, etc.)

### 4. Run the Development Server

Start the application locally using Turbopack for faster development:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🚀 Deployment

ChefDhundo is optimized for deployment on Vercel. For a detailed, step-by-step guide on how to deploy this application to production—including setting up Vercel, configuring production environment variables, and connecting custom domains—please refer to the [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---
*Built with ❤️ for the culinary community.*
