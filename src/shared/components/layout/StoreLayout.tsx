import { useCallback, useEffect, useState } from "react";
import {
    LayoutDashboard,
    ListOrdered,
    LockKeyhole,
    LogOut,
    Menu,
    Package,
    Printer,
    ShoppingCart,
    UserRound,
    Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/store/authStore";
import { useCashShiftStore } from "../../../features/cash/store/cashShiftStore";
import { CloseShiftModal } from "../../../features/cash/components/CloseShiftModal";
import { OpenShiftModal } from "../../../features/cash/components/OpenShiftModal";
import { NotificationBell } from "../../../features/notifications/components/NotificationBell";
import { useNotificationStore } from "../../../features/notifications/store/notificationStore";
import { formatMoney } from "../../../features/sales/utils/format";
import { AgentSettingsModal } from "../../../features/settings/components/AgentSettingsModal";
import { useStoreProfileStore } from "../../../features/stores/store/storeProfileStore";
import { navLinkClass, useMobileMenu } from "../../hooks/useMobileMenu";

export const StoreLayout = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { isMobileMenuOpen, setIsMobileMenuOpen, closeMenu } = useMobileMenu();

    const fetchCurrentShift = useCashShiftStore((s) => s.fetchCurrentShift);
    const currentShift = useCashShiftStore((s) => s.currentShift);
    const hasFetched = useCashShiftStore((s) => s.hasFetched);

    const fetchUnread = useNotificationStore((s) => s.fetchUnread);
    const fetchProfile = useStoreProfileStore((s) => s.fetchProfile);
    const profile = useStoreProfileStore((s) => s.profile);

    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [agentSettingsOpen, setAgentSettingsOpen] = useState(false);

    const isOwner = user?.role === "OWNER";

    const loadShift = useCallback(() => {
        void fetchCurrentShift();
    }, [fetchCurrentShift]);
    useEffect(() => {
        loadShift();
    }, [loadShift]);

    const loadNotifications = useCallback(() => {
        if (isOwner) void fetchUnread();
    }, [fetchUnread, isOwner]);
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const loadProfile = useCallback(() => {
        void fetchProfile();
    }, [fetchProfile]);
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-slate-50">
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col overflow-y-auto bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 items-center px-6">
                    <span className="text-lg font-bold text-white">{profile?.name || "Cargando..."}</span>
                </div>
                <nav aria-label="Main Navigation" className="flex-1 space-y-1 px-3 py-4">
                    {isOwner && (
                        <NavLink to="/pos/dashboard" className={navLinkClass} onClick={closeMenu}>
                            <LayoutDashboard size={18} />
                            Dashboard
                        </NavLink>
                    )}
                    <NavLink to="/pos/sales" className={navLinkClass} onClick={closeMenu}>
                        <ShoppingCart size={18} />
                        POS
                    </NavLink>
                    <NavLink to="/pos/sales-history" className={navLinkClass} onClick={closeMenu}>
                        <ListOrdered size={18} />
                        Historial
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
                <div className="border-t border-slate-800 px-3 py-3">
                    <button
                        type="button"
                        onClick={() => {
                            closeMenu();
                            setAgentSettingsOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                        <Printer size={16} />
                        Agente de impresión
                    </button>
                </div>
                {currentShift && (
                    <div className="border-t border-slate-800 px-3 py-4">
                        <div className="mb-2 px-2 text-[11px] uppercase tracking-wide text-slate-500">
                            Turno abierto
                        </div>
                        <div className="mb-3 flex items-center justify-between px-2 text-xs text-slate-400">
                            <span>Fondo</span>
                            <span className="font-semibold tabular-nums text-slate-200">
                                {formatMoney(currentShift.opening_balance)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                closeMenu();
                                setCloseModalOpen(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                        >
                            <LockKeyhole size={16} />
                            Cerrar caja
                        </button>
                    </div>
                )}
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center justify-between md:justify-end gap-4 border-b bg-white px-6">
                    <button
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={isMobileMenuOpen}
                        className="flex items-center rounded-lg p-3 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:hidden"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        {isOwner && <NotificationBell />}
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
                <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
                    <Outlet />
                </main>
            </div>

            <OpenShiftModal open={hasFetched && !currentShift} />
            <CloseShiftModal
                open={closeModalOpen}
                onClose={() => setCloseModalOpen(false)}
            />
            <AgentSettingsModal
                open={agentSettingsOpen}
                onClose={() => setAgentSettingsOpen(false)}
            />
        </div>
    );
};
