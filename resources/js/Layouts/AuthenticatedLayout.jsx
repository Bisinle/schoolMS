import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import ImpersonationBanner from '@/Components/ImpersonationBanner';

import {
    LayoutDashboard,
    Users,
    UserCircle,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
    FileText,
    Calendar,
    Menu,
    X,
    LogOut,
    UserCog,
    FolderOpen,
    FileCog,
    School,
    Settings,
} from "lucide-react";
import PWAInstallPrompt from "@/Components/PWAInstallPrompt";

export default function AuthenticatedLayout({ header, children }) {
    const { auth, school, impersonation } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(true); // 🆕 Banner state

    // Determine branding based on user role
    const isSuperAdmin = auth.user.role === 'super_admin';
    const brandName = isSuperAdmin ? 'SchoolMS' : (school?.name || 'SchoolMS');
    const brandLogo = !isSuperAdmin && school?.logo_path ? school.logo_path : null;

    const navigationConfig = {
        super_admin: [
            { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
            { name: "Schools", href: "/super-admin/schools", icon: School },
            { name: "Users", href: "/super-admin/users", icon: Users },
            { name: "Settings", href: "/super-admin/settings", icon: Settings },
        ],
        admin: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Students", href: "/students", icon: Users },
            { name: "Teachers", href: "/teachers", icon: GraduationCap },
            { name: "Guardians", href: "/guardians", icon: UserCircle },
            { name: "Users", href: "/users", icon: UserCog },
            { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
            { name: "Grades", href: "/grades", icon: BookOpen },
            { name: "Subjects", href: "/subjects", icon: FileText },
            { name: "Exams", href: "/exams", icon: Calendar },
            { name: "Reports", href: "/reports", icon: FileText },
            { name: "Documents", href: "/documents", icon: FolderOpen },
        ],
        teacher: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "My Grades", href: "/grades", icon: BookOpen },
            { name: "Students", href: "/students", icon: Users },
            { name: "Guardians", href: "/guardians", icon: UserCircle },
            { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
            { name: "Subjects", href: "/subjects", icon: FileText },
            { name: "Exams", href: "/exams", icon: Calendar },
            { name: "Reports", href: "/reports", icon: FileText },
            { name: "My Documents", href: "/documents", icon: FolderOpen },
        ],
        guardian: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Reports", href: "/reports", icon: FileText },
            { name: "Documents", href: "/documents", icon: FolderOpen },
        ],
    };

    const navigation = navigationConfig[auth.user.role] || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 🆕 Impersonation Banner with toggle */}
            {impersonation?.isImpersonating && (
                <ImpersonationBanner 
                    user={impersonation.impersonatedUser}
                    originalAdmin={{ id: impersonation.impersonatorId }}
                    isVisible={bannerVisible}
                    onToggle={() => setBannerVisible(!bannerVisible)}
                />
            )}

            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar for mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy transform transition-transform duration-300 ease-in-out md:hidden ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile header */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-navy-light">
                        {brandLogo ? (
                            <img src={brandLogo} alt={brandName} className="h-10" />
                        ) : (
                            <h1 className="text-2xl font-bold text-white">
                                {isSuperAdmin ? (
                                    <>School<span className="text-orange">MS</span></>
                                ) : (
                                    brandName
                                )}
                            </h1>
                        )}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="text-white hover:text-orange transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Mobile navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = route().current(
                                item.href.substring(1) + "*"
                            );
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? "bg-orange text-white shadow-lg"
                                            : "text-gray-300 hover:bg-orange hover:text-white"
                                    }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Sidebar for desktop */}
            <div 
                className={`hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col ${
                    impersonation?.isImpersonating ? 'md:top-14 lg:top-[4.5rem]' : ''
                }`}
            >
                <div className="flex flex-col flex-grow bg-navy">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-navy-light">
                        {brandLogo ? (
                            <img src={brandLogo} alt={brandName} className="h-10" />
                        ) : (
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {isSuperAdmin ? (
                                    <>School<span className="text-orange">MS</span></>
                                ) : (
                                    brandName
                                )}
                            </h1>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = route().current(
                                item.href.substring(1) + "*"
                            );
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? "bg-orange text-white shadow-lg"
                                            : "text-gray-300 hover:bg-orange hover:text-white"
                                    }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User info at bottom */}
                    <div className="p-4 border-t border-navy-light">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-orange flex items-center justify-center text-white font-semibold">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-white truncate">
                                    {auth.user.name}
                                </p>
                                <p className="text-xs text-gray-400 capitalize">
                                    {auth.user.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={`md:pl-64 flex flex-col flex-1 ${
                impersonation?.isImpersonating ? 'md:pt-14 lg:pt-[4.5rem]' : ''
            }`}>
                {/* Top navbar */}
                <div className="sticky top-0 z-[5] flex-shrink-0 flex h-16 bg-white shadow-sm">
                    <button
                        type="button"
                        className="px-4 text-gray-500 focus:outline-none md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex-1 px-4 flex justify-between items-center">
                        <div className="flex-1">
                            {header && (
                                <div className="text-xl font-semibold text-navy">
                                    {header}
                                </div>
                            )}
                        </div>

                        <div className="ml-4 flex items-center md:ml-6 space-x-4">
                            {/* Desktop user menu */}
                            <div className="hidden md:flex items-center space-x-3">
                                <span className="text-sm font-medium text-navy">
                                    {auth.user.name}
                                </span>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange text-white">
                                    {auth.user.role.toUpperCase()}
                                </span>
                            </div>

                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
            <PWAInstallPrompt />
        </div>
    );
}