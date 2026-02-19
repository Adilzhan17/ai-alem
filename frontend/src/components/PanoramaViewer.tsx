import { useRef, useEffect } from 'react';
// @ts-ignore
import pannellum from 'pannellum';
import 'pannellum/build/pannellum.css';

export interface PanoramaScene {
    id: string;
    title: string;
    image_url: string;
    hotspots?: Array<{
        pitch: number;
        yaw: number;
        type: 'scene' | 'info';
        text: string;
        sceneId?: string;
    }>;
}

interface PanoramaViewerProps {
    scenes: PanoramaScene[];
    initialSceneId?: string;
    height?: string;
    autoLoad?: boolean;
}

export default function PanoramaViewer({ scenes, initialSceneId, height = "500px", autoLoad = true }: PanoramaViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || scenes.length === 0) return;

        const scenesConfig: Record<string, any> = {};
        
        scenes.forEach(scene => {
            scenesConfig[scene.id] = {
                title: scene.title,
                type: 'equirectangular',
                panorama: scene.image_url,
                hotSpots: scene.hotspots?.map(hs => ({
                    pitch: hs.pitch,
                    yaw: hs.yaw,
                    type: hs.type,
                    text: hs.text,
                    sceneId: hs.sceneId
                })) || []
            };
        });

        const config = {
            default: {
                firstScene: initialSceneId || scenes[0].id,
                sceneFadeDuration: 1000,
            },
            scenes: scenesConfig,
            autoLoad: autoLoad
        };

        if (viewerRef.current) {
            viewerRef.current.destroy();
        }

        try {
            // @ts-ignore
            viewerRef.current = pannellum.viewer(containerRef.current, config);
        } catch (err) {
            console.error("Failed to init pannellum", err);
        }

        return () => {
            if (viewerRef.current && viewerRef.current.destroy) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, []); // Only init once

    const switchScene = (sceneId: string) => {
        if (viewerRef.current) {
            viewerRef.current.loadScene(sceneId);
        }
    };

    return (
        <div className="relative w-full h-full group">
            <div 
                ref={containerRef} 
                style={{ width: '100%', height: height }} 
                className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
            />
            
            {/* Scene Selector UI */}
            {scenes.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto max-w-[90%] no-scrollbar z-10 transition-opacity opacity-100">
                    {scenes.map(scene => (
                        <button
                            key={scene.id}
                            onClick={() => switchScene(scene.id)}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/20 transition-all whitespace-nowrap border border-transparent hover:border-white/30"
                        >
                            {scene.title}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
