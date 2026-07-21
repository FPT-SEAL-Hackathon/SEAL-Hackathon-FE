# SEAL HACKATHON - FE

This is the Frontend application for the **SEAL HACKATHON** project. It is a modern React application built with Vite and Tailwind CSS.

## 🚀 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI Primitives, Material UI (MUI)
- **Routing:** React Router
- **Forms & Validation:** React Hook Form
- **Animations:** Motion (Framer Motion)
- **Charts & Data Viz:** Recharts
- **Icons:** Lucide React & MUI Icons
- **Date Handling:** date-fns

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
   Create a `.env` file in the root of this project and configure the required environment variables. Based on the configuration, you **must** provide the API URL:
   ```env
   VITE_API_URL=http://localhost:8080/api/v1
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will typically be available at `http://localhost:5173`.

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode using Vite.
- `npm run build`: Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

## 🎨 Design Reference
The original project UI/UX design and components are based on this [Figma Design](https://www.figma.com/design/8qpt32XGtpTrBtxw4reu2N/SEAL-HACKATHON---FE).

## 📁 Key Features & Structure
- **Feature-based Architecture:** The project uses feature-based folder structures (e.g., `src/features/`) to organize APIs, components, and pages specific to a domain (like categories, events, judging).
- **Figma Asset Resolver:** The `vite.config.ts` includes a custom resolver (`figma:asset/`) to automatically link exported Figma assets from `src/assets`.
- **Role-Based Access Control:** The application includes complex routing and permission management for various user roles (e.g., Admins, Judges, Mentors, Experts).