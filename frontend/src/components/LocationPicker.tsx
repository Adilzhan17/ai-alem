
import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LocationPickerProps {
    onLocationSelect: (location: {
        lat: number,
        lon: number,
        display_name: string,
        address: any
    }) => void;
    defaultValue?: string;
}

export default function LocationPicker({ onLocationSelect, defaultValue }: LocationPickerProps) {
    const [query, setQuery] = useState(defaultValue || '')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2 && isOpen) {
                searchLocation(query)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [query, isOpen])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const searchLocation = async (q: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                q,
                format: 'json',
                addressdetails: '1',
                limit: '5',
                countrycodes: 'kz' // Limit to Kazakhstan
            })
            const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
                headers: {
                    'User-Agent': 'PerrichenoEstate/1.0'
                }
            })
            const data = await res.json()
            setResults(data)
        } catch (error) {
            console.error(error)
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (item: any) => {
        setQuery(item.display_name)
        setIsOpen(false)
        onLocationSelect({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            address: item.address
        })
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search address (e.g. Mangilik El 72)"
                    className="pl-9 pr-9"
                />
                {query && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => {
                            setQuery('')
                            setResults([])
                            setIsOpen(false)
                        }}
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </div>

            {isOpen && (results.length > 0 || loading) && (
                <div className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground rounded-md border shadow-md animate-in fade-in zoom-in-95 duration-200">
                    <ScrollArea className="max-h-[300px]">
                        <div className="p-1">
                            {loading && (
                                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </div>
                            )}
                            {!loading && results.length === 0 && (
                                <div className="p-4 text-sm text-muted-foreground text-center">
                                    No results found
                                </div>
                            )}
                            {results.map((item) => (
                                <button
                                    key={item.place_id}
                                    onClick={() => handleSelect(item)}
                                    className="w-full flex items-start gap-3 p-3 rounded-sm hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                                >
                                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                            {item.address.road || item.address.pedestrian || item.address.suburb || item.display_name.split(',')[0]} 
                                            {item.address.house_number ? `, ${item.address.house_number}` : ''}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {[
                                                item.address.city || item.address.town || item.address.village,
                                                item.address.state !== item.address.city ? item.address.state : null
                                            ].filter(Boolean).join(', ')}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    )
}
