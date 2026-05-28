import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AdminLogin } from "../features/auth/components/AdminLogin";
import { StoreLogin } from "../features/auth/components/StoreLogin";
import { AdminLayout } from "../shared/components/layout/AdminLayout";
import { StoreLayout } from "../shared/components/layout/StoreLayout";
import { PosScreen } from "../features/sales/components/PosScreen";
import { AdminGuard } from "./guards/AdminGuard";
import { StoreGuard } from "./guards/StoreGuard";
import { OwnerGuard } from "./guards/OwnerGuard";

// Lazy route pages — keep logins, guards, layouts and PosScreen (the cashier's
// landing) eager for first paint; everything else loads on demand so store
// users never download admin code and vice versa.
const AdminDashboard = lazy(() =>
  import("../features/admin/components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const StoresList = lazy(() =>
  import("../features/stores/components/StoresList").then((m) => ({
    default: m.StoresList,
  })),
);
const StoreForm = lazy(() =>
  import("../features/stores/components/StoreForm").then((m) => ({
    default: m.StoreForm,
  })),
);
const ProvisionOwnerForm = lazy(() =>
  import("../features/admin/components/ProvisionOwnerForm").then((m) => ({
    default: m.ProvisionOwnerForm,
  })),
);
const SalesList = lazy(() =>
  import("../features/sales/components/SalesList").then((m) => ({
    default: m.SalesList,
  })),
);
const ProductsList = lazy(() =>
  import("../features/products/components/ProductsList").then((m) => ({
    default: m.ProductsList,
  })),
);
const ProductForm = lazy(() =>
  import("../features/products/components/ProductForm").then((m) => ({
    default: m.ProductForm,
  })),
);
const CustomersList = lazy(() =>
  import("../features/customers/components/CustomersList").then((m) => ({
    default: m.CustomersList,
  })),
);
const CustomerForm = lazy(() =>
  import("../features/customers/components/CustomerForm").then((m) => ({
    default: m.CustomerForm,
  })),
);
const UsersList = lazy(() =>
  import("../features/users/components/UsersList").then((m) => ({
    default: m.UsersList,
  })),
);
const UserForm = lazy(() =>
  import("../features/users/components/UserForm").then((m) => ({
    default: m.UserForm,
  })),
);

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Loader2 aria-label="Cargando" className="h-8 w-8 animate-spin text-indigo-600" />
  </div>
);

const suspense = (node: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{node}</Suspense>
);

const router = createBrowserRouter([
  { path: "/login", element: <StoreLogin /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { index: true, element: suspense(<AdminDashboard />) },
      { path: "stores", element: suspense(<StoresList />) },
      { path: "stores/new", element: suspense(<StoreForm />) },
      { path: "stores/:id/edit", element: suspense(<StoreForm />) },
      { path: "stores/:id/provision-owner", element: suspense(<ProvisionOwnerForm />) },
    ],
  },
  {
    path: "/pos",
    element: <StoreGuard><StoreLayout /></StoreGuard>,
    children: [
      { index: true, element: <Navigate to="sales" replace /> },
      { path: "sales", element: <PosScreen /> },
      { path: "sales-history", element: suspense(<SalesList />) },
      { path: "products", element: suspense(<ProductsList />) },
      { path: "customers", element: suspense(<CustomersList />) },
      { path: "customers/new", element: suspense(<CustomerForm />) },
      { path: "customers/:id/edit", element: suspense(<CustomerForm />) },
      {
        element: <OwnerGuard />,
        children: [
          { path: "users", element: suspense(<UsersList />) },
          { path: "users/new", element: suspense(<UserForm />) },
          { path: "users/:id/edit", element: suspense(<UserForm />) },
          { path: "products/new", element: suspense(<ProductForm />) },
          { path: "products/:id/edit", element: suspense(<ProductForm />) },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
