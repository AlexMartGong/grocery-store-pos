import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AdminLogin } from "../features/auth/components/AdminLogin";
import { AdminDashboard } from "../features/admin/components/AdminDashboard";
import { StoreLogin } from "../features/auth/components/StoreLogin";
import { StoreForm } from "../features/stores/components/StoreForm";
import { StoresList } from "../features/stores/components/StoresList";
import { ProvisionOwnerForm } from "../features/admin/components/ProvisionOwnerForm";
import { AdminLayout } from "../shared/components/layout/AdminLayout";
import { StoreLayout } from "../shared/components/layout/StoreLayout";
import { PosPlaceholder } from "../features/pos/components/PosPlaceholder";
import { UsersList } from "../features/users/components/UsersList";
import { UserForm } from "../features/users/components/UserForm";
import { AdminGuard } from "./guards/AdminGuard";
import { StoreGuard } from "./guards/StoreGuard";
import { OwnerGuard } from "./guards/OwnerGuard";

const router = createBrowserRouter([
  { path: "/login", element: <StoreLogin /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "stores", element: <StoresList /> },
      { path: "stores/new", element: <StoreForm /> },
      { path: "stores/:id/edit", element: <StoreForm /> },
      { path: "stores/:id/provision-owner", element: <ProvisionOwnerForm /> },
    ],
  },
  {
    path: "/pos",
    element: <StoreGuard><StoreLayout /></StoreGuard>,
    children: [
      { index: true, element: <PosPlaceholder /> },
      {
        element: <OwnerGuard />,
        children: [
          { path: "users", element: <UsersList /> },
          { path: "users/new", element: <UserForm /> },
          { path: "users/:id/edit", element: <UserForm /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
