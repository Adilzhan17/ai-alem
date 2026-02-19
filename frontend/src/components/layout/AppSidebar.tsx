"use client"

import * as React from "react"
import {
    Command,
    LayoutDashboard,
    Briefcase,
    Users,
    Map,
    User,
    ShieldCheck,
    Frame
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

// Static organization data
const teams = [
    {
        name: "Qal.ai",
        logo: Command,
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
                url: "/",
                icon: LayoutDashboard,
                isActive: true,
                items: [
                    { title: t('commandCenter'), url: "/" },
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
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
