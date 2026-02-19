import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Folder,
    MapPin,
    Calendar,
    MoreHorizontal,
    Trash2,
    Archive,
    Loader2
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Project {
    id: number;
    title: string;
    description: string;
    city: string;
    status: string;
    budget_total: number;
    created_at: string;
    estimates_count: number;
    files_count: number;
}

const API = '/api/v1';

export default function ProjectsPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    // Form Stats
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        city: '',
        budget_total: ''
    });

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API}/projects`, { headers });
            if (!res.ok) throw new Error('Failed to fetch projects');
            const data = await res.json();
            setProjects(data);
        } catch (error) {
            console.error(error);
            toast.error("Could not load projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async () => {
        if (!newProject.title) return toast.error("Title is required");

        setCreateLoading(true);
        try {
            const res = await fetch(`${API}/projects`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...newProject,
                    budget_total: newProject.budget_total ? parseFloat(newProject.budget_total) : 0
                })
            });

            if (!res.ok) throw new Error("Failed to create project");

            toast.success("Project created successfully");
            setIsCreateOpen(false);
            setNewProject({ title: '', description: '', city: '', budget_total: '' });
            fetchProjects();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create project");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleArchive = async (id: number) => {
        if (!confirm("Are you sure you want to archive this project?")) return;

        try {
            const res = await fetch(`${API}/projects/${id}`, {
                method: 'DELETE',
                headers
            });

            if (!res.ok) throw new Error("Failed to archive");

            toast.success("Project archived");
            setProjects(prev => prev.filter(p => p.id !== id)); // Remove from list for now
        } catch (error) {
            console.error(error);
            toast.error("Failed to archive project");
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'archived': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
            default: return 'bg-amber-500/10 text-amber-600 border-amber-500/20'; // draft
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
                        <p className="text-muted-foreground mt-1">Manage your renovation and construction projects.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Start a new project to track estimates, timelines, and contractors.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Project Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Apartment Turnkey Renovation"
                                        value={newProject.title}
                                        onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            placeholder="e.g. Almaty"
                                            value={newProject.city}
                                            onChange={e => setNewProject({ ...newProject, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="budget">Budget (Target)</Label>
                                        <Input
                                            id="budget"
                                            type="number"
                                            placeholder="0"
                                            value={newProject.budget_total}
                                            onChange={e => setNewProject({ ...newProject, budget_total: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc">Description</Label>
                                    <Textarea
                                        id="desc"
                                        placeholder="Brief description of the work scope..."
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={createLoading}>
                                    {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Project
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="h-64 animate-pulse bg-muted/20" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-muted/10 border border-dashed rounded-xl text-center">
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Folder className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">No projects yet</h3>
                        <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                            Create your first project to start tracking your construction or renovation works.
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <Card key={project.id} className="group hover:border-primary/50 transition-all cursor-pointer flex flex-col" onClick={() => navigate(`/projects/${project.id}`)}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className={`${statusColor(project.status)} uppercase text-[10px]`}>
                                            {project.status}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2" onClick={e => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`) }}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); handleArchive(project.id) }}>
                                                    <Archive className="mr-2 h-4 w-4" /> Archive
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="text-lg leading-tight mt-2">{project.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {project.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3 flex-1">
                                    <div className="grid gap-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span>{project.city || 'Unspecified Location'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-3 border-t bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
                                    <div className="flex gap-4">
                                        <span>{project.estimates_count} Estimates</span>
                                        <span>{project.files_count} Files</span>
                                    </div>
                                    {project.budget_total > 0 && (
                                        <span className="font-bold text-foreground">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(project.budget_total)}
                                        </span>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
