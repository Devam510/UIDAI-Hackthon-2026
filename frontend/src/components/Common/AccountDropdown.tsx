import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, UserCircle } from 'lucide-react';

const AccountDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
        setIsOpen(false);
    };

    const handleProfile = () => {
        alert('Profile page - Coming soon!');
        setIsOpen(false);
    };

    const handleSettings = () => {
        alert('Settings page - Coming soon!');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Account menu"
            >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User size={18} className="text-white" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                                <User size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Admin User</p>
                                <p className="text-xs text-slate-400">admin@uidai.gov.in</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={handleProfile}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            <UserCircle size={16} />
                            Profile
                        </button>
                        <button
                            onClick={handleSettings}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            <Settings size={16} />
                            Settings
                        </button>
                    </div>

                    <div className="border-t border-slate-700 py-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountDropdown;
