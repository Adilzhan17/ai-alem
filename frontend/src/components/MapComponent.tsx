import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Estate {
    id: number;
    title: string;
    latitude: number;
    longitude: number;
    price: number;
}

interface MapComponentProps {
    items: Estate[];
    onItemClick?: (id: number) => void;
    center?: [number, number];
}

export default function MapComponent({ items, onItemClick, center }: MapComponentProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Premium dark style
            center: center || [71.4333, 51.1333], // Default Astana coordinates
            zoom: 11,
            attributionControl: false
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            if (!map.current) return;

            // Add 3D buildings layer
            // Note: accurate 3D buildings depend on the vector tile source having height data.
            // Carto/MapTiler usually have 'building' layer.
            // We'll try to add a generic fill-extrusion layer if the source allows, 
            // but for this specific style URL we might need to verify source names.
            // For now, let's just enable the pitch and button. 
            // If we want real 3D buildings, we'd need a source like MapTiler or Mapbox.
            // But let's try to add it assuming a standard schema or just use the pitch for "3D Mode".

            // Let's rely on pitch for now as specific source layers might vary with Carto CDN.
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    const toggle3D = () => {
        if (!map.current) return;
        const currentPitch = map.current.getPitch();
        const is3D = currentPitch > 50;

        map.current.easeTo({
            pitch: is3D ? 0 : 60,
            bearing: is3D ? 0 : -17.6,
            duration: 1500,
            essential: true
        });
    };

    useEffect(() => {
        if (!map.current) return;

        // Clear existing markers
        const markersElements = document.querySelectorAll('.map-marker-premium');
        markersElements.forEach(el => el.remove());

        items.forEach((item) => {
            if (!item.latitude || !item.longitude) return;

            const el = document.createElement('div');
            el.className = 'map-marker-premium';
            el.innerHTML = `
                <div class="group relative flex flex-col items-center cursor-pointer">
                    <div class="bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-white/20 transform transition-all duration-300 group-hover:scale-110 group-hover:bg-primary">
                        ₸${(item.price / 1000000).toFixed(1)}M
                    </div>
                    <div class="w-0.5 h-3 bg-white/50"></div>
                    <div class="size-3 bg-white rounded-full border-4 border-primary shadow-lg group-hover:border-white transition-colors"></div>
                </div>
            `;

            el.addEventListener('click', () => onItemClick?.(item.id));

            new maplibregl.Marker({ element: el })
                .setLngLat([item.longitude, item.latitude])
                .addTo(map.current!);
        });
    }, [items]);

    useEffect(() => {
        if (!map.current || !center) return;
        map.current.easeTo({
            center,
            duration: 900,
            essential: true
        });
    }, [center]);

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        if (!map.current) return;
        const styleUrl = theme === 'dark'
            ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
            : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
        map.current.setStyle(styleUrl);
    }, [theme]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-border-dark group">
            <div ref={mapContainer} className="w-full h-full" />

            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {/* Custom 3D Toggle */}
                <button
                    onClick={toggle3D}
                    className="bg-surface-dark/80 backdrop-blur border border-white/10 p-2 rounded-xl text-white hover:bg-primary hover:text-white transition-all shadow-lg group-hover:opacity-100"
                    title="Toggle 3D View"
                >
                    <span className="material-symbols-outlined text-xl">3d_rotation</span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="bg-surface-dark/80 backdrop-blur border border-white/10 p-2 rounded-xl text-white hover:bg-primary hover:text-white transition-all shadow-lg group-hover:opacity-100"
                    title="Toggle Theme"
                >
                    <span className="material-symbols-outlined text-xl">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
            </div>
        </div>
    );

}
