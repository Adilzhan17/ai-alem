"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Briefcase,
    User,
    ShieldCheck
} from "lucide-react"

import { NavMain } from "../nav-main"

import { NavUser } from "../nav-user"
import { TeamSwitcher } from "../team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "../ui/sidebar"
import { useAuth } from "../../AuthContext"
import { useLanguage } from "../../LanguageContext"

const teams = [
    {
        name: "Qal.ai",
        plan: "Enterprise",
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useAuth();

    // Construct user object for NavUser
    const userData = {
        name: user?.full_name || "Guest User",
        email: user?.email || "guest@qal.ai",
        avatar: user?.avatar_url || "",
    }

    const { t } = useLanguage();

    // Base navigation items by role
    const navMain: any[] = []

    if (user?.role === 'client' || !user?.role) {
        navMain.push(
            {
                title: t('platform'),
                url: "/dashboard",
                icon: LayoutDashboard,
                isActive: true,
                items: [
                    { title: t('commandCenter'), url: "/dashboard" },
                    { title: t('mapView'), url: "/results" },
                    { title: t('aiBroker'), url: "/broker" }
                ],
            },
            {
                title: t('management'),
                url: "#",
                icon: Briefcase,
                isActive: true,
                items: [
                    { title: t('projects'), url: "/projects" },
                    { title: t('estimates'), url: "/estimate" },
                    { title: t('contractors'), url: "/contractors" },
                    { title: t('myListings'), url: "/my-listings" }
                ],
            },
            {
                title: "Заявки",
                url: "/requests",
                icon: Briefcase,
                isActive: false,
                items: [
                    { title: "Управление", url: "/requests" },
                ],
            },
            {
                title: t('account'),
                url: "/profile",
                icon: User,
                items: [
                    { title: t('profile'), url: "/profile" },
                    { title: t('settings'), url: "/profile" }
                ]
            }
        )
    }

    if (user?.role === 'contractor') {
        navMain.push(
            {
                title: "Подрядчик",
                url: "/contractor",
                icon: Briefcase,
                isActive: true,
                items: [
                    { title: "Витрина", url: "/contractor" },
                    { title: "Заявки / КП", url: "/contractor" }
                ],
            },
            {
                title: t('account'),
                url: "/profile",
                icon: User,
                items: [
                    { title: t('profile'), url: "/profile" },
                    { title: t('settings'), url: "/profile" }
                ]
            }
        )
    }

    if (user?.role === 'supplier-materials') {
        navMain.push(
            {
                title: "Поставщик",
                url: "/supplier",
                icon: Briefcase,
                isActive: true,
                items: [
                    { title: "Каталог", url: "/supplier" },
                    { title: "Заявки", url: "/supplier" }
                ],
            },
            {
                title: t('account'),
                url: "/profile",
                icon: User,
                items: [
                    { title: t('profile'), url: "/profile" },
                    { title: t('settings'), url: "/profile" }
                ]
            }
        )
    }

    // Add Admin section if user is admin/moderator
    if (user?.system_role && ['admin', 'moderator'].includes(user.system_role)) {
        navMain.push({
            title: t('administration'),
            url: "/backoffice",
            icon: ShieldCheck,
            isActive: false,
            items: [
                {
                    title: t('dashboard'),
                    url: "/backoffice",
                },
                {
                    title: t('moderation'),
                    url: "/backoffice/moderation",
                },
                {
                    title: t('users'),
                    url: "/backoffice/users",
                },
                {
                    title: t('listings'),
                    url: "/backoffice/listings",
                }
            ]
        })
    }

    // Secondary nav items removed as per UX cleanup requirements
    // const navSecondary = []

    return (
        <Sidebar collapsible="icon" className="border-r border-qal-border/80 bg-qal-surface" {...props}>
            <SidebarHeader className="border-b border-qal-border/70 bg-qal-surface px-3 pb-3 pt-4">
                <TeamSwitcher teams={teams} />
            </SidebarHeader>
            <SidebarContent className="bg-qal-surface px-2 py-3">
                <NavMain items={navMain} />
            </SidebarContent>
            <SidebarFooter className="border-t border-qal-border/70 bg-qal-surface px-2 pb-3 pt-2">
                <NavUser user={userData} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
