import React, { type ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatWidget from '../Chatbot/ChatWidget';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    // Sidebar collapse state (desktop only)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            const saved = localStorage.getItem('uidai_sidebar_collapsed');
            return saved === 'true';
        }
        return false;
    });

    // Mobile drawer state (mobile only)
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Persist sidebar collapse state (desktop only)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            localStorage.setItem('uidai_sidebar_collapsed', sidebarCollapsed.toString());
        }
    }, [sidebarCollapsed]);

    // Close mobile drawer on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileDrawerOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (mobileDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileDrawerOpen]);

    return (
        <div className="h-screen w-full overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
            {/* Sidebar for desktop */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobile={false}
            />

            {/* Mobile drawer overlay - only show when open */}
            {mobileDrawerOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setMobileDrawerOpen(false)}
                    />
                    {/* Mobile drawer */}
                    <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
                        <Sidebar
                            collapsed={false}
                            onToggleCollapse={() => { }}
                            isMobile={true}
                            onClose={() => setMobileDrawerOpen(false)}
                        />
                    </div>
                </>
            )}

            {/* Navbar - Fixed at top */}
            <Navbar
                sidebarCollapsed={sidebarCollapsed}
                onMobileMenuClick={() => setMobileDrawerOpen(true)}
            />

            {/* Main content area with proper scroll container */}
            <main className={`
                h-screen overflow-y-auto overflow-x-hidden
                pt-16
                transition-all duration-300
                ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
            `}>
                <div className="p-4 md:p-6 lg:p-8 min-h-full flex flex-col">
                    <div className="max-w-7xl mx-auto flex-1 w-full">
                        {children}
                    </div>

                    {/* Global Footer */}
                    <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <span>© 2026 UIDAI Hackathon Team</span>
                            <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                            <a href="/methodology" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Methodology & Data Sources
                            </a>
                            <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                            <span>Version 1.0.0 (Hackathon Build)</span>
                        </div>
                    </footer>
                </div>
            </main>

            {/* Chat Widget */}
            <ChatWidget />
        </div>
    );
};

export default Layout;
