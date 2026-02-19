export interface Notification {
    id: number;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    entityType?: 'listing' | 'contractor' | 'system';
    entityId?: number;
}

let notifications: Notification[] = [
    { id: 1, title: 'System Update', message: 'Qal.ai platform updated to v2.5', createdAt: new Date().toISOString(), read: false, entityType: 'system' },
    { id: 2, title: 'New Quote', message: 'Received a new quote from BuildFast Ltd.', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false, entityType: 'contractor', entityId: 101 }
];

export function getNotifications(): Notification[] {
    return [...notifications];
}

export function markNotificationRead(id: number) {
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
}

export function markAllNotificationsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
}
