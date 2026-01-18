import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, TrendingUp, MapPin, ScanFace, Users, ChevronLeft, X, Briefcase, Shield } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '../Common/Tooltip';

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    isMobile?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse, isMobile = false, onClose }) => {
    const links = [
        { to: '/', label: 'Home', icon: <Home size={20} /> },

        { to: '/audit-log', label: 'Audit Logs', icon: <Shield size={20} /> },
        { to: '/overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { to: '/forecast', label: 'Forecast', icon: <TrendingUp size={20} /> },
        { to: '/district-hotspots', label: 'District Risks', icon: <MapPin size={20} /> },
        { to: '/biometric-hotspots', label: 'Biometric Risks', icon: <ScanFace size={20} /> },
        { to: '/demographic-risks', label: 'Demographic Risks', icon: <Users size={20} /> },
    ];


    const sidebarWidth = collapsed && !isMobile ? 'w-20' : 'w-64';

    return (
        <aside className={clsx(
            "min-h-screen bg-slate-50 dark:bg-dark-bg border-r border-slate-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 bottom-0 transition-all duration-300",
            sidebarWidth,
            isMobile ? 'z-40 lg:hidden' : 'hidden lg:flex z-20'
        )}>
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                <div
                    className={clsx(
                        "flex items-center gap-3",
                        collapsed && !isMobile ? "justify-center w-full cursor-pointer" : "overflow-hidden"
                    )}
                    onClick={collapsed && !isMobile ? onToggleCollapse : undefined}
                >
                    <div className="flex-shrink-0">
                        <img
                            src="/uidai-logo.png"
                            alt="UIDAI Logo"
                            className={clsx(
                                "object-contain",
                                collapsed && !isMobile ? "w-10 h-10" : "w-10 h-10"
                            )}
                        />
                    </div>
                    {(!collapsed || isMobile) && (
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 whitespace-nowrap">
                            UIDAI Insight
                        </h1>
                    )}
                </div>

                {/* Mobile close button */}
                {isMobile && onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Desktop toggle button */}
                {!isMobile && !collapsed && (
                    <Tooltip content="Collapse sidebar">
                        <button
                            onClick={onToggleCollapse}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </Tooltip>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
                {links.map((link) => (
                    <Tooltip key={link.to} content={collapsed && !isMobile ? link.label : ''} position="right">
                        <NavLink
                            to={link.to}
                            onClick={() => {
                                // Auto-close mobile sidebar when navigating
                                if (isMobile && onClose) {
                                    onClose();
                                }
                            }}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                                        : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                                )
                            }
                        >
                            {link.icon}
                            {(!collapsed || isMobile) && (
                                <span className="font-medium text-sm">{link.label}</span>
                            )}
                        </NavLink>
                    </Tooltip>
                ))}
            </nav>

            {/* Footer */}
            <div className={
                clsx(
                    "p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-500",
                    collapsed && !isMobile ? "text-center" : ""
                )}>
                {collapsed && !isMobile ? (
                    <Tooltip content="UIDAI Hackathon 2026">
                        <div className="text-center">©</div>
                    </Tooltip>
                ) : (
                    <div className="text-center">UIDAI Hackathon 2026</div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
