import { LayoutDashboard, LogOut, Store } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/store/authStore";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-slate-700 text-white"
      : "text-slate-400 hover:bg-slate-800 hover:text-white"
  }`;

export const AdminLayout = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-slate-900">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-bold text-white">Pasadita SaaS</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLink to="/admin" end className={navLinkClass}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/admin/stores" className={navLinkClass}>
            <Store size={18} />
            Stores
          </NavLink>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end gap-4 border-b bg-white px-6">
          <span className="text-sm text-slate-500">{user?.role}</span>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>
        <main className="flex-1 bg-slate-50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
