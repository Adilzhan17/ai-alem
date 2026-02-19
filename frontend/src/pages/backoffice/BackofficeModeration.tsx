import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import {
    ClipboardList,
    RefreshCw,
    X,
    Check,
    MessageSquare,
    AlertCircle,
    User,
    MapPin,
    DollarSign,
    BedDouble,
    Ruler,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface QueueItem {
    id: number;
    title: string;
    city: string;
    district: string;
    price_kzt: number;
    rooms: number;
    area_sqm: number;
    image_url: string;
    status: string;
    owner_id: number;
    owner_name: string;
    owner_email: string;
    created_at: string;
}

const API = '/api/v1';

export default function BackofficeModeration() {
    const { token } = useAuth();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [changesComment, setChangesComment] = useState('');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const loadQueue = () => {
        setLoading(true);
        fetch(`${API}/moderation/queue`, { headers })
            .then(r => r.json())
            .then(data => { setQueue(Array.isArray(data) ? data : (data.items || [])); setLoading(false); })
            .catch(() => { toast.error("Failed to load moderation queue"); setLoading(false); });
    };

    useEffect(() => { loadQueue(); }, []);

    const doAction = async (listingId: number, action: string, body?: object) => {
        setActionLoading(listingId);
        try {
            const res = await fetch(`${API}/moderation/listing/${listingId}/${action}`, {
                method: 'POST', headers, body: body ? JSON.stringify(body) : '{}',
            });
            if (!res.ok) throw new Error("Action failed");

            setQueue(prev => prev.filter(i => i.id !== listingId));
            toast.success(`Listing ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back for changes'}`);
            setRejectReason('');
            setChangesComment('');
        } catch (e) {
            toast.error("Operation failed");
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(p);
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
                    <p className="text-muted-foreground mt-1">Review and approve listings submitted by users.</p>
                </div>
                <Button onClick={loadQueue} variant="outline" disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse h-96 bg-muted/20" />
                    ))}
                </div>
            ) : queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/10 border border-dashed rounded-xl text-center">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold">All Caught Up!</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        There are no listings pending review at the moment. Good job!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {queue.map(item => (
                        <Card key={item.id} className="overflow-hidden border-border transition-all hover:border-primary/50 group flex flex-col md:flex-row h-auto md:h-72">
                            {/* Image Section */}
                            <div className="w-full md:w-72 h-48 md:h-full bg-muted relative shrink-0">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                                        <div className="text-center">
                                            <div className="mx-auto h-10 w-10 rounded-full bg-background flex items-center justify-center mb-2">
                                                <AlertCircle className="h-5 w-5 opacity-50" />
                                            </div>
                                            <span className="text-xs">No Image</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-sm">{item.status}</Badge>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex flex-col flex-1 p-5 md:p-6 overflow-hidden">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h3 className="font-bold text-lg leading-tight line-clamp-2" title={item.title}>
                                        {item.title}
                                    </h3>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                                        ID: {item.id}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="truncate max-w-[150px]">{item.city}, {item.district}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <BedDouble className="h-3.5 w-3.5" />
                                        <span>{item.rooms} rms</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Ruler className="h-3.5 w-3.5" />
                                        <span>{item.area_sqm} m²</span>
                                    </div>
                                </div>

                                <div className="text-2xl font-bold text-primary mb-4 flex items-center gap-1">
                                    {formatPrice(item.price_kzt)}
                                </div>

                                <Separator className="my-auto" />

                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {item.owner_name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{item.owner_name}</span>
                                            <span className="text-[10px]">{item.owner_email}</span>
                                        </div>
                                    </div>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-2 mt-auto pt-2">
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => doAction(item.id, 'approve')}
                                        disabled={actionLoading === item.id}
                                    >
                                        {actionLoading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Approve
                                    </Button>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                                                <MessageSquare className="mr-2 h-4 w-4" /> Changes
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Request Changes</DialogTitle>
                                                <DialogDescription>
                                                    Tell the user what needs to be corrected before approval.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Textarea
                                                placeholder="e.g. Please upload higher quality photos..."
                                                value={changesComment}
                                                onChange={e => setChangesComment(e.target.value)}
                                            />
                                            <DialogFooter>
                                                <Button
                                                    onClick={() => {
                                                        if (!changesComment.trim()) {
                                                            toast.error('Нужен комментарий');
                                                            return;
                                                        }
                                                        doAction(item.id, 'request-changes', { comment: changesComment });
                                                    }}
                                                >
                                                    Send Request
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="px-3">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Reject Listing</DialogTitle>
                                                <DialogDescription>
                                                    This action cannot be undone. Please provide a reason.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Input
                                                placeholder="Reason for rejection..."
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                            />
                                            <DialogFooter>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (!rejectReason.trim()) {
                                                            toast.error('Нужна причина отказа');
                                                            return;
                                                        }
                                                        doAction(item.id, 'reject', { reason: rejectReason });
                                                    }}
                                                >
                                                    Reject Permanently
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
