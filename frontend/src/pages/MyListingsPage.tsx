import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Plus,
    Search,
    Filter,
    Home,
    MapPin,
    BedDouble,
    Ruler,
    MoreHorizontal,
    Edit,
    Trash2,
    Send,
    Archive,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    FileText
} from 'lucide-react'

import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ListingItem {
    id: number;
    title: string;
    city: string;
    district: string;
    price_kzt: number;
    rooms: number;
    area_sqm: number;
    status: string;
    image_url: string;
    moderation_comment: string | null;
    created_at: string;
    floor: number | null;
}

const API = '/api/v1';

const statusConfig: Record<string, { label: string; color: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: 'Draft', color: 'bg-slate-500', icon: FileText, variant: "secondary" },
    pending_review: { label: 'Pening Review', color: 'bg-amber-500', icon: Clock, variant: "secondary" },
    approved: { label: 'Published', color: 'bg-emerald-500', icon: CheckCircle2, variant: "default" },
    rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle, variant: "destructive" },
    needs_changes: { label: 'Needs Changes', color: 'bg-orange-500', icon: AlertCircle, variant: "destructive" },
    archived: { label: 'Archived', color: 'bg-slate-500', icon: Archive, variant: "outline" },
    removed: { label: 'Removed', color: 'bg-red-700', icon: Trash2, variant: "destructive" },
};

export default function MyListingsPage() {
    const { token, user } = useAuth()
    const navigate = useNavigate()
    const [listings, setListings] = useState<ListingItem[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [actionLoading, setActionLoading] = useState<number | null>(null)

    const headers: HeadersInit = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    const load = () => {
        setLoading(true)
        fetch(`${API}/listings/mine`, { headers })
            .then(r => r.json())
            .then(data => { setListings(data.items || data || []); setLoading(false); })
            .catch(() => {
                toast.error("Failed to load listings");
                setLoading(false);
            });
    }

    useEffect(() => { load(); }, [])

    const handleAction = async (id: number, action: 'submit' | 'delete' | 'archive') => {
        setActionLoading(id);
        const method = action === 'delete' || action === 'archive' ? 'DELETE' : 'POST';
        const url = action === 'submit' ? `${API}/listings/${id}/submit` : `${API}/listings/${id}`;

        try {
            const res = await fetch(url, { method, headers });
            if (!res.ok) throw new Error("Action failed");

            toast.success(
                action === 'submit' ? "Submitted for review" :
                    action === 'archive' ? "Listing archived" : "Listing removed"
            );
            load();
        } catch (e) {
            toast.error("Operation failed");
        } finally {
            setActionLoading(null);
        }
    }

    const filtered = listings.filter(l => {
        if (statusFilter !== 'all' && l.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (l.title || '').toLowerCase().includes(q)
            || (l.city || '').toLowerCase().includes(q)
            || (l.district || '').toLowerCase().includes(q);
    });

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(p);
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6 md:gap-8 w-full max-w-6xl mx-auto px-4 md:px-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your real estate portfolio, check status, and edit listings.
                        </p>
                    </div>
                    <Button onClick={() => navigate('/listings/create')} className="bg-qal-primary hover:bg-qal-primary-dark">
                        <Plus className="mr-2 h-4 w-4" /> Create Listing
                    </Button>
                </div>

                {/* Filters and Stats */}
                <div className="flex flex-col gap-6">
                    <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                            <TabsList className="bg-muted/50 p-1">
                                <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
                                <TabsTrigger value="approved">Published</TabsTrigger>
                                <TabsTrigger value="pending_review">Pending</TabsTrigger>
                                <TabsTrigger value="draft">Drafts</TabsTrigger>
                                <TabsTrigger value="archived">Archived</TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search listings..."
                                        className="pl-8 bg-background"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <TabsContent value={statusFilter} className="mt-0">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <Card key={i} className="overflow-hidden border-border/50">
                                            <Skeleton className="h-48 w-full" />
                                            <CardHeader className="gap-2">
                                                <Skeleton className="h-6 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </CardHeader>
                                            <CardContent>
                                                <Skeleton className="h-10 w-full" />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-muted/10 border border-dashed rounded-3xl text-center">
                                    <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                                        <Home className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-xl font-bold">No listings found</h3>
                                    <p className="text-muted-foreground max-w-sm mt-2 mb-8">
                                        {statusFilter === 'all'
                                            ? "You haven't created any listings yet. Start by adding your first property."
                                            : `You don't have any listings with "${statusFilter}" status.`}
                                    </p>
                                    <Button onClick={() => navigate('/listings/create')} variant="outline">
                                        Create New Listing
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filtered.map(listing => {
                                        const cfg = statusConfig[listing.status] || statusConfig.draft;
                                        const StatusIcon = cfg.icon;
                                        return (
                                            <Card key={listing.id} className="overflow-hidden border-border/60 hover:border-qal-primary/30 transition-all group shadow-sm hover:shadow-md h-full flex flex-col">
                                                <div className="relative h-52 bg-muted overflow-hidden">
                                                    {listing.image_url ? (
                                                        <img
                                                            src={listing.image_url}
                                                            alt={listing.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                                            <Home className="h-12 w-12 text-muted-foreground/20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 right-3">
                                                        <Badge variant={cfg.variant as any} className="backdrop-blur-md bg-white/90 text-foreground border-0 shadow-sm gap-1.5 pl-1.5 pr-2.5">
                                                            <StatusIcon className={`h-3.5 w-3.5 ${listing.status === 'approved' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                            <span className="font-semibold">{cfg.label}</span>
                                                        </Badge>
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                                        <div className="text-white font-bold text-lg drop-shadow-md">
                                                            {formatPrice(listing.price_kzt)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <CardHeader className="p-5 pb-3">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <h3 className="font-bold text-lg leading-tight line-clamp-2 min-h-[3.25rem]">
                                                            {listing.title}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span className="truncate">{listing.city}, {listing.district}</span>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="p-5 pt-0 pb-4 flex-grow">
                                                    <div className="flex items-center gap-4 py-4 px-1 border-t border-b border-dashed my-3">
                                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                                            <BedDouble className="h-4 w-4 text-qal-primary" />
                                                            <span>{listing.rooms || '-'} rms</span>
                                                        </div>
                                                        <Separator orientation="vertical" className="h-4" />
                                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                                            <Ruler className="h-4 w-4 text-qal-primary" />
                                                            <span>{listing.area_sqm} m²</span>
                                                        </div>
                                                        <Separator orientation="vertical" className="h-4" />
                                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                                            <Home className="h-4 w-4 text-qal-primary" />
                                                            <span>Fl {listing.floor || '-'}</span>
                                                        </div>
                                                    </div>

                                                    {(listing.moderation_comment && (listing.status === 'rejected' || listing.status === 'needs_changes')) && (
                                                        <div className="bg-red-50 text-red-900 border border-red-200 rounded-lg p-3 text-xs mt-2">
                                                            <div className="font-bold flex items-center gap-1 mb-1">
                                                                <AlertCircle className="h-3.5 w-3.5" /> Moderator Comment:
                                                            </div>
                                                            {listing.moderation_comment}
                                                        </div>
                                                    )}
                                                </CardContent>

                                                <CardFooter className="p-4 bg-muted/20 border-t flex justify-between items-center">
                                                    <div className="text-xs text-muted-foreground font-medium">
                                                        Added {new Date(listing.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex gap-2">

                                                        {listing.status === 'draft' || listing.status === 'needs_changes' || listing.status === 'rejected' ? (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-qal-primary" title="Edit">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 px-3 text-xs gap-1.5 bg-qal-primary/90 hover:bg-qal-primary shadow-sm"
                                                                    onClick={() => handleAction(listing.id, 'submit')}
                                                                    disabled={actionLoading === listing.id}
                                                                >
                                                                    {actionLoading === listing.id ? <Clock className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                                                    Submit
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 px-2">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem>View details</DropdownMenuItem>
                                                                    {listing.status === 'approved' && (
                                                                        <DropdownMenuItem onClick={() => handleAction(listing.id, 'archive')}>
                                                                            <Archive className="mr-2 h-4 w-4" /> Archive
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {user?.system_role === 'admin' && (
                                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleAction(listing.id, 'delete')}>
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </Layout>
    )
}
