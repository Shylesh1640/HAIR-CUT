# Salon Management System

A comprehensive web-based billing and management system for beauty salons and spas.

## Features

- **Billing & POS**: Create GST/Non-GST invoices with product stock management. PDF generation included.
- **Inventory Management**: Track products, stock levels, and low-stock alerts.
- **Service Management**: Manage salon services and pricing.
- **Employee Management**: Manage staff profiles and roles (Admin/Employee).
- **Attendance**: Check-in/Check-out system with reporting.
- **Customer CRM**: efficient customer search and history tracking.
- **Financials**: Expense tracking and Profit/Loss reports.
- **Reports**: Export Attendance, Sales, and Financial reports to Excel.

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `src/utils/schema.sql` and run it to set up tables, triggers, and Row Level Security.
4. Go to **Authentication > Users** and create your first Admin user.
   - **Important**: When creating the user, you may need to manually add `role: 'admin'` and `full_name: 'Your Name'` to the "User Metadata" if using the dashboard, OR simply update the `users` table after signing up if testing via client.
   - *Tip*: The provided schema includes a trigger that automatically insterts a profile into `public.users` when you create an Auth user.

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Run the Application

```bash
npm install
npm run dev
```

## Usage

- **Login**: Use the credentials you created in Supabase.
- **Default Roles**: The system distinguishes between `admin` (full access) and `employee` (limited access).
- **Billing**: Navigate to Billing to create invoices.
- **Reports**: Go to Reports to download Excel summaries.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **State/Auth**: Supabase Auth, React Context
- **Database**: PostgreSQL (Supabase)
- **Libs**: Recharts, Lucide React, jsPDF, XLSX

