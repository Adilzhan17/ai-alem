import type { ReactNode } from 'react';
import AppLayout from './layout/AppLayout';

interface LayoutProps {
    children: ReactNode;
    activePage?: string;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="app-shell">
            <AppLayout>
                {children}
            </AppLayout>
        </div>
    );
}
