import { LogOut, Menu, Package, ShoppingCart, UserRound, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/store/authStore";
import { navLinkClass, useMobileMenu } from "../../hooks/useMobileMenu";

export const StoreLayout = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { isMobileMenuOpen, setIsMobileMenuOpen, closeMenu } = useMobileMenu();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const isOwner = user?.role === "OWNER";

    return (
        <div className="flex min-h-screen">
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 items-center px-6">
                    <span className="text-lg font-bold text-white">Pasadita POS</span>
                </div>
                <nav aria-label="Main Navigation" className="flex-1 space-y-1 px-3 py-4">
                    <NavLink to="/pos" end className={navLinkClass} onClick={closeMenu}>
                        <ShoppingCart size={18} />
                        POS
                    </NavLink>
                    <NavLink to="/pos/products" className={navLinkClass} onClick={closeMenu}>
                        <Package size={18} />
                        Productos
                    </NavLink>
                    <NavLink to="/pos/customers" className={navLinkClass} onClick={closeMenu}>
                        <UserRound size={18} />
                        Clientes
                    </NavLink>
                    {isOwner && (
                        <NavLink to="/pos/users" className={navLinkClass} onClick={closeMenu}>
                            <Users size={18} />
                            Usuarios
                        </NavLink>
                    )}
                </nav>
            </aside>

            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between md:justify-end gap-4 border-b bg-white px-6">
                    <button
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={isMobileMenuOpen}
                        className="flex items-center rounded-lg p-3 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:hidden"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end leading-tight">
                            <span className="text-sm font-medium text-slate-700">{user?.username}</span>
                            <span className="text-xs text-slate-500">{user?.role}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </header>
                <main className="flex-1 bg-slate-50 p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
