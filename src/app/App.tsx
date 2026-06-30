import { RouterProvider } from "react-router";
import { AuthProvider } from "@/features/auth/store/authStore";
import { router } from "@/app/routes";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
