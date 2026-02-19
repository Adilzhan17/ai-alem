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
    ArrowLeft
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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

    return (
        <div className="flex h-screen bg-background font-sans">
            {/* Sidebar */}
            <div className="w-[280px] border-r bg-card flex flex-col shadow-sm z-20">
                {/* Logo */}
                <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                            <span className="font-bold text-xl">QA</span>
                        </div>
                        <div>
                            <div className="text-xl font-bold tracking-tight">
                                Qal.<span className="text-primary">ai</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Admin Console</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                            `}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/20">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-background shadow-sm">
                        <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {user?.full_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 pr-1">
                            <div className="text-sm font-semibold truncate">{user?.full_name}</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                {user?.system_role === 'admin' ? 'Administrator' : 'Moderator'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="w-full text-xs">
                            <ArrowLeft className="mr-2 h-3 w-3" /> App
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full text-xs"
                        >
                            <LogOut className="mr-2 h-3 w-3" /> Exit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-muted/10 relative">
                <div className="relative z-10 min-h-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
