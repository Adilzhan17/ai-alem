declare module 'pannellum' {
    export interface PannellumHotSpot {
        pitch: number;
        yaw: number;
        type: string;
        text: string;
        sceneId?: string;
        URL?: string;
    }

    export interface PannellumScene {
        title?: string;
        type?: string;
        panorama: string;
        hotSpots?: PannellumHotSpot[];
        autoLoad?: boolean;
    }

    export interface PannellumConfig {
        default: {
            firstScene: string;
            sceneFadeDuration?: number;
        };
        scenes: Record<string, PannellumScene>;
        autoLoad?: boolean;
    }

    export const viewer: (container: HTMLElement | string, config: PannellumConfig) => any;
}
