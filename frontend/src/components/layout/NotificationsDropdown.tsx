"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";
import { useAuth } from "../../AuthContext";

interface Notification {
    id: number;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    entityType?: string;
    entityId?: number;
}

const API = "/api/v1";

export function NotificationsDropdown() {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const reload = useCallback(() => {
        if (!token) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetch(`${API}/users/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                const list = (Array.isArray(data) ? data : []).map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    message: n.content,
                    createdAt: n.created_at,
                    read: n.is_read,
                    entityType: n.entity_type,
                    entityId: n.entity_id,
                }));
                setNotifications(list);
                setUnreadCount(list.filter((n) => !n.read).length);
            })
            .catch(() => {
                setNotifications([]);
                setUnreadCount(0);
            });
    }, [token]);

    useEffect(() => {
        reload();
        // Poll every 30s
        const interval = setInterval(reload, 30000);
        return () => clearInterval(interval);
    }, [reload]);

    const handleMarkAllRead = () => {
        if (!token) return;
        const unread = notifications.filter((n) => !n.read);
        if (unread.length === 0) return;

        Promise.all(
            unread.map((n) =>
                fetch(`${API}/users/notifications/${n.id}/read`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                })
            )
        ).finally(reload);
    };

    const handleMarkRead = (id: number) => {
        if (!token) return;
        fetch(`${API}/users/notifications/${id}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
        }).finally(reload);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-qal-secondary hover:text-qal-primary hover:bg-qal-primary/10 transition-colors"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Notifications</TooltipContent>
            </Tooltip>

            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 p-4 transition-colors hover:bg-muted/50",
                                        !notification.read && "bg-muted/20"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-1 h-2 w-2 rounded-full shrink-0",
                                        !notification.read ? "bg-qal-primary" : "bg-transparent"
                                    )} />
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read && "text-foreground")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkRead(notification.id);
                                            }}
                                        >
                                            <Check className="h-3 w-3" />
                                            <span className="sr-only">Mark read</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
