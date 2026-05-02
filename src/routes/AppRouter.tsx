import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AdminLogin } from "../features/auth/components/AdminLogin";
import { StoreLogin } from "../features/auth/components/StoreLogin";

const router = createBrowserRouter([
  { path: "/login", element: <StoreLogin /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/",
    element: (
      <div className="min-h-screen flex items-center justify-center p-8 text-slate-700">
        Authenticated placeholder
      </div>
    ),
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
