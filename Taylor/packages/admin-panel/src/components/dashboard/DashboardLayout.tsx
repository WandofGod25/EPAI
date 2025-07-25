import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from "@/components/ui/toaster";
import { ApiKeyProvider } from '../ApiKeyProvider';
import { useEffect } from 'react';

const DashboardLayout = () => {
    const { user, loading, signOut } = useAuth();
    const navigate = useNavigate();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render dashboard if not authenticated
    if (!user) {
        return null;
    }

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''
        }`;
    
    const navLinks = [
        { to: "/overview", label: "Overview" },
        { to: "/models", label: "Models" },
        { to: "/logs", label: "Logs" },
        { to: "/insights", label: "Insights" },
        { to: "/predictions", label: "Predictions" },
        { to: "/integration", label: "Integration" },
        { to: "/settings", label: "Settings" },
        { to: "/test-import", label: "Test Import" },
    ];

    // Add a development-only link for the SDK showroom
    if (import.meta.env.DEV) {
        navLinks.push({ to: "/sdk-showroom", label: "SDK Showroom (Dev)" });
    }

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-[60px] items-center border-b px-6">
                        <a className="flex items-center gap-2 font-semibold" href="#">
                            <svg
                                className=" h-6 w-6"
                                fill="none"
                                height="24"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                width="24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                                <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                                <path d="M12 3v6" />
                            </svg>
                            <span className="">Partner Panel</span>
                        </a>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className="grid items-start px-4 text-sm font-medium">
                            {navLinks.map(link => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={navLinkClasses}
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
                    <div className="flex-1">
                        {/* Can add a search bar here if needed */}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {user.email}
                        </span>
                        <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-gray-900">
                            Sign Out
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <ApiKeyProvider>
                        <Outlet />
                    </ApiKeyProvider>
                </main>
                <Toaster />
            </div>
        </div>
    );
};

export default DashboardLayout; 