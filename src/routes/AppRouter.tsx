import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AdminLogin } from "../features/auth/components/AdminLogin";
import { StoreLogin } from "../features/auth/components/StoreLogin";
import { StoreForm } from "../features/stores/components/StoreForm";
import { StoresList } from "../features/stores/components/StoresList";
import { AdminGuard } from "./guards/AdminGuard";

const router = createBrowserRouter([
  { path: "/login", element: <StoreLogin /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <AdminGuard />,
    children: [
      { index: true, element: <Navigate to="stores" replace /> },
      { path: "stores", element: <StoresList /> },
      { path: "stores/new", element: <StoreForm /> },
      { path: "stores/:id/edit", element: <StoreForm /> },
    ],
  },
  {
    path: "/pos",
    element: (
      <div className="flex h-screen items-center justify-center text-2xl font-semibold text-slate-500">
        Módulo POS - Próximamente
      </div>
    ),
  },
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
