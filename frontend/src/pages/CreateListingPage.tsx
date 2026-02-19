import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Save,
    Send,
    Home,
    MapPin,
    DollarSign,
    LayoutTemplate,
    Image as ImageIcon,
    Loader2,
    Plus,
    Trash2
} from 'lucide-react'

import Layout from '../components/Layout'
import { useAuth } from '../AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import ImageUpload from '../components/ImageUpload'

const API = '/api/v1'

const CITIES = ['Astana', 'Almaty', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Kostanay', 'Kyzylorda', 'Uralsk', 'Aktau', 'Petropavlovsk', 'Temirtau', 'Taldykorgan', 'Ekibastuz', 'Rudny', 'Zhezkazgan']

export default function CreateListingPage() {
    const { token } = useAuth()
    const navigate = useNavigate()
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        title: '',
        description: '',
        city: 'Almaty',
        district: '',
        residential_complex: '',
        address: '',
        price_kzt: '',
        rooms: '',
        area_sqm: '',
        floor: '',
        total_floors: '',
        image_url: '',
    })

    const [panoramas, setPanoramas] = useState<{ url: string, title: string }[]>([])
    const [newPanoUrl, setNewPanoUrl] = useState('')
    const [newPanoTitle, setNewPanoTitle] = useState('')

    const addPanorama = () => {
        if (!newPanoUrl || !newPanoTitle) return
        setPanoramas([...panoramas, { url: newPanoUrl, title: newPanoTitle }])
        setNewPanoUrl('')
        setNewPanoTitle('')
    }

    const removePanorama = (idx: number) => {
        setPanoramas(panoramas.filter((_, i) => i !== idx))
    }

    const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

    const handleSubmit = async (isDraft: boolean) => {
        if (!form.title || !form.price_kzt || !form.area_sqm) {
            toast.error("Please fill in all required fields marked with *");
            return;
        }

        setSaving(true)

        try {
            // Create listing
            const res = await fetch(`${API}/listings`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    price_kzt: parseFloat(form.price_kzt) || 0,
                    rooms: parseInt(form.rooms) || 0,
                    area_sqm: parseFloat(form.area_sqm) || 0,
                    floor: parseInt(form.floor) || null,
                    total_floors: parseInt(form.total_floors) || null,
                    metadata_json: { panoramas }
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.detail || 'Failed to create listing')
            }

            const listing = await res.json()

            // Auto-submit if not draft
            if (!isDraft) {
                await fetch(`${API}/listings/${listing.id}/submit`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                })
                toast.success("Listing created and submitted for review!");
            } else {
                toast.success("Draft saved successfully!");
            }

            navigate('/my-listings')
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setSaving(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-10 px-4 md:px-0">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent hover:text-qal-primary mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
                    </Button>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New Listing</h1>
                            <p className="text-muted-foreground mt-1">Fill in the details below to add your property to the marketplace.</p>
                        </div>
                        <Badge variant="outline" className="hidden sm:flex px-3 py-1 border-qal-primary/20 text-qal-primary bg-qal-primary/5">
                            step 1 of 1
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Home className="h-5 w-5 text-qal-primary" /> Property Details
                                </CardTitle>
                                <CardDescription>Basic information about your property listing.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Listing Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Spacious 3-bedroom apartment in city center"
                                        value={form.title}
                                        onChange={e => set('title', e.target.value)}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the key features, amenities, and advantages of your property..."
                                        value={form.description}
                                        onChange={e => set('description', e.target.value)}
                                        rows={5}
                                        className="resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-qal-primary" /> Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City <span className="text-red-500">*</span></Label>
                                        <Select value={form.city} onValueChange={v => set('city', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select city" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="district">District</Label>
                                        <Input
                                            id="district"
                                            placeholder="e.g. Medeu"
                                            value={form.district}
                                            onChange={e => set('district', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="res_complex">Residential Complex</Label>
                                        <Input
                                            id="res_complex"
                                            placeholder="e.g. Highvill Astana"
                                            value={form.residential_complex}
                                            onChange={e => set('residential_complex', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            placeholder="e.g. Dostyk Ave, 12"
                                            value={form.address}
                                            onChange={e => set('address', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutTemplate className="h-5 w-5 text-qal-primary" /> Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="price">Price (KZT) <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="price"
                                                type="number"
                                                placeholder="0"
                                                className="pl-9"
                                                value={form.price_kzt}
                                                onChange={e => set('price_kzt', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rooms">Rooms <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="rooms"
                                            type="number"
                                            placeholder="1"
                                            value={form.rooms}
                                            onChange={e => set('rooms', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="area">Area (m²) <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="area"
                                            type="number"
                                            placeholder="0"
                                            value={form.area_sqm}
                                            onChange={e => set('area_sqm', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="floor">Floor</Label>
                                        <Input
                                            id="floor"
                                            type="number"
                                            placeholder="5"
                                            value={form.floor}
                                            onChange={e => set('floor', e.target.value)}
                                        />
                                    </div>
                                    <span className="mb-3 text-muted-foreground">/</span>
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="total_floors">Total Floors</Label>
                                        <Input
                                            id="total_floors"
                                            type="number"
                                            placeholder="12"
                                            value={form.total_floors}
                                            onChange={e => set('total_floors', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 360 Panoramas */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="bg-qal-primary/10 p-1.5 rounded-lg">
                                        <svg className="h-5 w-5 text-qal-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    360° Virtual Tour
                                </CardTitle>
                                <CardDescription>Upload panoramic photos to create an immersive tour.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end bg-muted/30 p-4 rounded-xl border border-dashed">
                                    <div className="space-y-2">
                                        <Label>Panorama Image</Label>
                                        <div className="bg-background rounded-md">
                                             <ImageUpload 
                                                value={newPanoUrl} 
                                                onChange={(url) => setNewPanoUrl(url as string)} 
                                             />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Room Name</Label>
                                        <Select value={newPanoTitle} onValueChange={setNewPanoTitle}>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue placeholder="Select room" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Living Room">Living Room</SelectItem>
                                                <SelectItem value="Kitchen">Kitchen</SelectItem>
                                                <SelectItem value="Bedroom">Bedroom</SelectItem>
                                                <SelectItem value="Bathroom">Bathroom</SelectItem>
                                                <SelectItem value="Hallway">Hallway</SelectItem>
                                                <SelectItem value="Balcony">Balcony</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Button
                                            type="button"
                                            onClick={addPanorama}
                                            variant="secondary"
                                            disabled={!newPanoUrl || !newPanoTitle}
                                            className="w-full"
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Add Scene
                                        </Button>
                                    </div>
                                </div>

                                {panoramas.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Added Scenes ({panoramas.length})</Label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {panoramas.map((pano, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-card border rounded-lg group hover:border-qal-primary/30 transition-all">
                                                    <div className="h-10 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                                        <img src={pano.url} className="h-full w-full object-cover" alt="" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{pano.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{pano.url}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                        onClick={() => removePanorama(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar / Media */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-qal-primary" /> Media
                                </CardTitle>
                                <CardDescription>Add a main photo for your listing.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Main Image</Label>
                                    <ImageUpload 
                                        value={form.image_url} 
                                        onChange={(url) => set('image_url', url as string)} 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/30 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-base">Publishing Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant="secondary">Draft</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Visibility:</span>
                                    <span className="font-medium">Private</span>
                                </div>
                                <Separator />
                                <div className="flex flex-col gap-3 pt-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => handleSubmit(false)}
                                        disabled={saving}
                                    >
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        Submit for Review
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleSubmit(true)}
                                        disabled={saving}
                                    >
                                        <Save className="mr-2 h-4 w-4" /> Save Draft
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
