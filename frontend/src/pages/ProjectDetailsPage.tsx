import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    FileText,
    MoreVertical,
    Plus,
    Clock,
    CheckCircle2,
    DollarSign,
    Pencil
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const API = '/api/v1';

export default function ProjectDetailsPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [estimates, setEstimates] = useState<any[]>([]);
    const [estimatesLoading, setEstimatesLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        city: '',
        budget_total: '',
    });

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`${API}/projects/${id}`, { headers });
                if (!res.ok) throw new Error("Project not found");
                const data = await res.json();
                setProject(data);
                setEditData({
                    title: data.title || '',
                    description: data.description || '',
                    city: data.city || '',
                    budget_total: data.budget_total ? String(data.budget_total) : '',
                });
            } catch (error) {
                console.error(error);
                toast.error("Could not load project details");
                navigate('/projects');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (!id || !token) return;
        setEstimatesLoading(true);
        fetch(`${API}/estimates?project_id=${id}`, { headers })
            .then(r => r.json())
            .then(data => setEstimates(Array.isArray(data) ? data : []))
            .catch(() => setEstimates([]))
            .finally(() => setEstimatesLoading(false));
    }, [id, token]);

    if (loading) return (
        <Layout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        </Layout>
    );

    if (!project) return null;

    const handleUpdate = async () => {
        setEditLoading(true);
        try {
            const res = await fetch(`${API}/projects/${project.id}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editData.title,
                    description: editData.description,
                    city: editData.city,
                    budget_total: editData.budget_total ? parseFloat(editData.budget_total) : null,
                })
            });
            if (!res.ok) throw new Error('Update failed');
            const updated = await res.json();
            setProject(updated);
            toast.success('Project updated');
            setIsEditOpen(false);
        } catch (e) {
            toast.error('Failed to update project');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate('/projects')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                                <Badge variant="secondary" className="uppercase text-[10px] tracking-widest">
                                    {project.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {project.city || 'No Location'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Created {new Date(project.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                        </Button>
                        <Button onClick={() => navigate('/estimate', { state: { projectId: project.id } })}>
                            <Plus className="mr-2 h-4 w-4" /> New Estimate
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.budget_total || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Target allocation</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">On Track</div>
                            <p className="text-xs text-muted-foreground mt-1">Estimated completion: TBD</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completion</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0%</div>
                            <p className="text-xs text-muted-foreground mt-1">Based on task progress</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="estimates">Estimates</TabsTrigger>
                        <TabsTrigger value="files">Files & Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {project.description || "No description provided for this project."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                                <CardDescription>Key milestones and phases.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <Clock className="h-10 w-10 mb-2 opacity-20" />
                                    <p>Timeline visualization coming soon.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="estimates">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Estimates</CardTitle>
                                <CardDescription>manage BOQ and cost calculations for this project.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {estimatesLoading ? (
                                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                                        Loading estimates...
                                    </div>
                                ) : estimates.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                        <FileText className="h-10 w-10 mb-4 opacity-20" />
                                        <h3 className="text-lg font-medium text-foreground">No estimates found</h3>
                                        <p className="max-w-sm mt-1 mb-4">Create a detailed Bill of Quantities (BOQ) or rough estimate for this project.</p>
                                        <Button onClick={() => navigate('/estimate', { state: { projectId: project.id } })}>Create Estimate</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {estimates.map((e) => (
                                            <div key={e.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-semibold">Estimate #{e.id}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Tier: {e.tier} · Version: {e.version}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">
                                                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(e.total_cost || 0)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {e.created_at ? new Date(e.created_at).toLocaleDateString() : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="files">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Files</CardTitle>
                                <CardDescription>Blueprints, permits, and contracts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground italic">No files uploaded yet.</div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>Update project details.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={editData.title}
                                onChange={e => setEditData({ ...editData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={editData.city}
                                onChange={e => setEditData({ ...editData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget_total">Budget (KZT)</Label>
                            <Input
                                id="budget_total"
                                type="number"
                                value={editData.budget_total}
                                onChange={e => setEditData({ ...editData, budget_total: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={editData.description}
                                onChange={e => setEditData({ ...editData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={editLoading}>
                            {editLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
