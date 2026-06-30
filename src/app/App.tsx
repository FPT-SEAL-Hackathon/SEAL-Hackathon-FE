import { RouterProvider } from "react-router";
import { AuthProvider } from "@/features/auth/store/authStore";
import { router } from "@/app/routes";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
