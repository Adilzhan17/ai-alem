"use client";

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Globe } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../ui/breadcrumb";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLanguage } from "../../LanguageContext";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");

    const pathSegments = location.pathname.split("/").filter(Boolean);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink asChild>
                                        <Link to="/">Qal.ai</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {pathSegments.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                                {pathSegments.map((segment, index) => {
                                    const isLast = index === pathSegments.length - 1;
                                    const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                                    return (
                                        <React.Fragment key={href}>
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage className="capitalize">
                                                        {segment}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink asChild className="capitalize hidden md:block">
                                                        <Link to={href}>{segment}</Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                                        </React.Fragment>
                                    );
                                })}
                                {pathSegments.length === 0 && (
                                    <React.Fragment>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </React.Fragment>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative hidden md:block w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="pl-9 h-9 w-[200px] lg:w-[300px] bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>

                        {/* Language Switcher */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Globe className="h-4 w-4" />
                                    <span className="sr-only">Toggle language</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLanguage("en")}>
                                    English {language === "en" && "✓"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("ru")}>
                                    Русский {language === "ru" && "✓"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("kk")}>
                                    Қазақша {language === "kk" && "✓"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <main className="flex-1 w-full max-w-7xl mx-auto py-6">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
