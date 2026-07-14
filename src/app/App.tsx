import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/store/authStore";
import { router } from "@/app/routes";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
    </AuthProvider>
  );
}
