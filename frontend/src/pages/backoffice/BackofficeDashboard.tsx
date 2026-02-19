import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import {
    Users,
    Home,
    ClipboardCheck,
    CheckCircle2,
    Folders,
    FileBarChart,
    Wrench,
    Package,
    AlertOctagon,
    RefreshCw,
    TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Stats {
    users_total: number;
    users_by_role: { client: number; contractor: number; supplier: number };
    listings_total: number;
    listings_pending: number;
    listings_approved: number;
    projects_total: number;
    estimates_total: number;
    contractors_total: number;
    suppliers_total: number;
    complaints_open: number;
}

interface AuditEntry {
    id: number;
    actor_email: string;
    action: string;
    entity_type: string;
    entity_id: number;
    created_at: string;
}

const API = '/api/v1';

export default function BackofficeDashboard() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        Promise.all([
            fetch(`${API}/backoffice/stats`, { headers }).then(r => r.json()),
            fetch(`${API}/audit-log?limit=10`, { headers }).then(r => r.json()),
        ]).then(([s, a]) => {
            setStats(s);
            setAuditLog(Array.isArray(a) ? a : (a.items || []));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const statCards = stats ? [
        { label: 'Total Users', value: stats.users_total, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Total Listings', value: stats.listings_total, icon: Home, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        { label: 'Pending Review', value: stats.listings_pending, icon: ClipboardCheck, color: 'text-amber-500', bg: 'bg-amber-500/10', action: () => navigate('/backoffice/moderation') },
        { label: 'Approved Listings', value: stats.listings_approved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Projects', value: stats.projects_total, icon: Folders, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        { label: 'Estimates', value: stats.estimates_total, icon: FileBarChart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { label: 'Contractors', value: stats.contractors_total, icon: Wrench, color: 'text-teal-500', bg: 'bg-teal-500/10' },
        { label: 'Suppliers', value: stats.suppliers_total, icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Open Complaints', value: stats.complaints_open, icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-500/10', action: () => navigate('/backoffice/complaints') },
    ] : [];

    const actionBadgeColor = (action: string) => {
        if (action.includes('approve')) return 'bg-emerald-500 text-white';
        if (action.includes('reject') || action.includes('ban')) return 'bg-destructive text-white';
        if (action.includes('create') || action.includes('register')) return 'bg-primary text-white';
        if (action.includes('update')) return 'bg-amber-500 text-white';
        return 'bg-secondary text-secondary-foreground';
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Platform overview and management controls.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button onClick={() => navigate('/backoffice/moderation')} className="bg-amber-500 hover:bg-amber-600 text-white">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Moderation ({stats?.listings_pending || 0})
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <Card
                        key={i}
                        className={`hover:shadow-md transition-all cursor-${card.action ? 'pointer' : 'default'}`}
                        onClick={card.action}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Audit Log Preview */}
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest system actions and audit logs.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/backoffice/audit')}>
                            View All <TrendingUp className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] w-full pr-4">
                        <div className="space-y-4">
                            {auditLog.length === 0 && !loading && (
                                <div className="text-center py-10 text-muted-foreground italic">No recent activity found.</div>
                            )}
                            {auditLog.map(entry => (
                                <div key={entry.id} className="flex items-start justify-between group p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50">
                                    <div className="grid gap-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`${actionBadgeColor(entry.action)} hover:${actionBadgeColor(entry.action)} uppercase text-[10px] px-1.5 h-5`}>
                                                {entry.action}
                                            </Badge>
                                            <p className="text-sm font-medium leading-none">{entry.actor_email}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-2 mt-1">
                                            <span>Target: {entry.entity_type} #{entry.entity_id}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(entry.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
