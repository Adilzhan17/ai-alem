import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import {
    LayoutDashboard,
    ClipboardCheck,
    Home,
    Users,
    AlertTriangle,
    FileText,
    LogOut,
    ArrowLeft,
    Shield
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/backoffice', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/backoffice/moderation', label: 'Moderation', icon: ClipboardCheck },
    { path: '/backoffice/listings', label: 'Listings', icon: Home },
    { path: '/backoffice/users', label: 'Users', icon: Users },
    { path: '/backoffice/complaints', label: 'Complaints', icon: AlertTriangle },
    { path: '/backoffice/audit', label: 'Audit Log', icon: FileText },
];

export default function BackofficeLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = user?.full_name
        ?.split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'AD';

    return (
        <div className="app-shell">
            <div className="app-shell-frame flex min-h-screen w-full">
                <div className="app-shell-grid" />
                <div className="app-shell-glow teal" />
                <div className="app-shell-glow sky" />

                <aside className="relative z-20 hidden w-[304px] shrink-0 border-r border-qal-border/80 bg-qal-surface/90 p-4 backdrop-blur-xl lg:flex lg:flex-col">
                    <div className="rounded-2xl border border-qal-border/70 bg-white/85 p-4 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.7)]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-qal-primary text-white">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-qal-text-primary">
                                    Qal<span className="text-cyan-600">.ai</span>
                                </div>
                                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-qal-text-secondary">
                                    Backoffice
                                </div>
                            </div>
                        </div>
                    </div>

                    <nav className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 app-scroll">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'border-qal-primary/30 bg-white text-qal-primary shadow-[0_14px_30px_-24px_rgba(15,118,110,0.8)]'
                                            : 'border-transparent bg-transparent text-qal-text-secondary hover:border-qal-border/70 hover:bg-white/80 hover:text-qal-text-primary'
                                    }`
                                }
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-qal-primary/10 text-qal-primary">
                                    <item.icon className="h-4 w-4" />
                                </span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-4 rounded-2xl border border-qal-border/70 bg-white/90 p-3">
                        <div className="mb-3 flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-lg border border-qal-border/60">
                                <AvatarFallback className="rounded-lg bg-qal-primary/10 text-qal-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-qal-text-primary">{user?.full_name}</div>
                                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-qal-text-secondary">
                                    {user?.system_role === 'admin' ? 'Administrator' : 'Moderator'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="h-8 text-xs">
                                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> App
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className="h-8 text-xs"
                            >
                                <LogOut className="mr-1 h-3.5 w-3.5" /> Exit
                            </Button>
                        </div>
                    </div>
                </aside>

                <div className="relative z-10 flex flex-1 flex-col px-3 pb-4 pt-3 md:px-6 md:pt-5">
                    <div className="app-header-shell mb-3 flex items-center justify-between rounded-2xl px-4 py-3 md:mb-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-qal-text-secondary">Admin Console</p>
                            <h1 className="text-xl font-bold text-qal-text-primary md:text-2xl">Backoffice Control Center</h1>
                        </div>
                    </div>

                    <main className="app-content-shell app-page-shell flex-1 overflow-auto p-4 md:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
