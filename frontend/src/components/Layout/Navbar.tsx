import React from 'react';
import { useStateContext } from '../../context/StateContext';
import { ChevronDown, Menu } from 'lucide-react';
import AccountDropdown from '../Common/AccountDropdown';
import ThemeToggle from '../Common/ThemeToggle';

interface NavbarProps {
    sidebarCollapsed: boolean;
    onMobileMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarCollapsed, onMobileMenuClick }) => {
    const { selectedState, setSelectedState, availableStates, loadingStates } = useStateContext();

    return (
        <header className={clsx(
            "h-16 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 fixed top-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 transition-all duration-300",
            sidebarCollapsed ? 'lg:left-20' : 'lg:left-64',
            'left-0'
        )}>
            <div className="flex items-center gap-4 md:w-1/3">
                {/* Mobile hamburger menu */}
                <button
                    onClick={onMobileMenuClick}
                    className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* State/Region selector */}
                <div className="relative">
                    <label className="text-xs text-slate-500 dark:text-slate-500 mr-2 uppercase tracking-wider font-semibold hidden md:inline">Region</label>
                    <div className="relative inline-block">
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            disabled={loadingStates}
                            className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-3 md:pl-4 pr-8 md:pr-10 py-1.5 rounded-lg text-xs md:text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingStates ? (
                                <option>Loading states...</option>
                            ) : (
                                availableStates.map((s: string) => <option key={s} value={s}>{s}</option>)
                            )}
                        </select>
                        <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>

                {/* Account dropdown */}
                <AccountDropdown />
            </div>
        </header>
    );
};

// Import clsx for className concatenation
import clsx from 'clsx';

export default Navbar;
