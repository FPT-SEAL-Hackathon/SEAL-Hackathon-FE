# SEAL HACKATHON - Frontend

This is the Frontend application for the **SEAL HACKATHON** project, a comprehensive platform designed to manage and facilitate hackathons. Built with React, Vite, and Tailwind CSS, it offers a modern, responsive, and highly interactive user experience.

## 🚀 Tech Stack

- **Core:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI Primitives, Material UI (MUI), Shadcn UI
- **Routing:** React Router
- **State Management & Data Fetching:** Context API, Custom Hooks
- **Forms & Validation:** React Hook Form
- **Animations:** Motion (Framer Motion)
- **Charts & Data Visualization:** Recharts
- **Icons:** Lucide React & MUI Icons
- **Date Handling:** date-fns
- **Notifications:** Sonner (Toast notifications)

## ✨ Key Features

- **Event & Hackathon Administration:** Complete dashboard for administrators to manage events, categories, and rounds.
- **Advanced Judging System:** Specialized views for judges and admins, including score assignment, batch scoring, calibration rounds, and final approvals.
- **Leaderboards & Rankings:** Real-time generation and display of leaderboards based on judges' scores and round completion.
- **Submission Management:** Allows participants to submit projects and admins/judges to review, approve, or reject them.
- **Role-Based Access Control (RBAC):** Distinct workflows and interfaces for different user roles (Admins, Judges, Mentors, Experts, Participants).
- **Awards System:** Dedicated views for configuring and presenting awards to top hackathon teams.

## 📋 Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (Node Package Manager)

## ⚙️ Installation & Setup

1. **Install dependencies:**
   Navigate to the project root directory (`SEAL-Hackathon-FE`) and run:
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file (or use `.env.development` / `.env.production`) in the root of this project and configure the required environment variables:
   ```env
   VITE_API_URL=http://localhost:8080/api/v1
   
   # Cloudinary for Image Uploads
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```
   *(Update the variables to match your backend server address and Cloudinary account)*

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will typically be available at `http://localhost:5173`.

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode using Vite.
- `npm run build`: Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.
- `npm run preview`: Locally preview the production build.

## 📁 Project Architecture & Structure

- **Feature-based Architecture:** The project uses feature-based folder structures (e.g., `src/features/`) to organize APIs, components, and pages specific to a domain (like categories, events, judging, submissions).
- **Shared Components:** Common UI elements (like DataTables, Cards, Badges) are stored in `src/components/shared/` or `src/components/ui/` for maximum reusability.
- **Figma Asset Resolver:** The `vite.config.ts` includes a custom resolver (`figma:asset/`) to automatically link exported Figma assets from `src/assets`.

## 🎨 Design Reference
The original project UI/UX design and components are based on this [Figma Design](https://www.figma.com/design/8qpt32XGtpTrBtxw4reu2N/SEAL-HACKATHON---FE).