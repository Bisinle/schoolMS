import { Link } from "@inertiajs/react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

/**
 * Sidebar component for both mobile and desktop navigation
 * @param {Object} props
 * @param {Array} props.navigation - Navigation items array
 * @param {string} props.brandName - Brand/school name
 * @param {string|null} props.brandLogo - Brand/school logo path
 * @param {boolean} props.sidebarOpen - Mobile sidebar open state
 * @param {Function} props.setSidebarOpen - Function to toggle mobile sidebar
 * @param {boolean} props.impersonating - Whether user is impersonating
 * @param {boolean} props.isSuperAdmin - Whether user is super admin
 * @param {Object} props.auth - Authentication object with user data
 */
export default function Sidebar({
    navigation,
    brandName,
    brandLogo,
    sidebarOpen,
    setSidebarOpen,
    impersonating,
    isSuperAdmin,
    auth,
}) {
    const renderBrandHeader = () => {
        if (brandLogo) {
            return <img src={brandLogo} alt={brandName} className="h-10" />;
        }

        return (
            <h1 className="text-2xl font-bold text-white tracking-tight">
                {isSuperAdmin ? (
                    <>
                        School<span className="text-orange">MS</span>
                    </>
                ) : (
                    brandName
                )}
            </h1>
        );
    };

    const [openSubmenus, setOpenSubmenus] = useState({});

    const toggleSubmenu = (itemName) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const renderNavigationItems = (onClickHandler = null) => {
        return navigation.map((item) => {
            const Icon = item.icon;

            // Handle items with submenu
            if (item.submenu) {
                const isOpen = openSubmenus[item.name];
                const isAnySubmenuActive = item.submenu.some(subItem =>
                    route().current(subItem.href.substring(1) + "*")
                );

                return (
                    <div key={item.name}>
                        <button
                            onClick={() => toggleSubmenu(item.name)}
                            className={`group flex items-center justify-between w-full px-3 py-2.5 md:py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isAnySubmenuActive
                                    ? "bg-orange text-white shadow-lg"
                                    : "text-gray-300 hover:bg-orange hover:text-white"
                            }`}
                        >
                            <div className="flex items-center">
                                <Icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </div>
                            {isOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                        {isOpen && (
                            <div className="ml-8 mt-1 space-y-1">
                                {item.submenu.map((subItem) => {
                                    const isSubActive = route().current(subItem.href.substring(1) + "*");
                                    return (
                                        <Link
                                            key={subItem.name}
                                            href={subItem.href}
                                            className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                                isSubActive
                                                    ? "bg-orange/20 text-orange font-medium"
                                                    : "text-gray-400 hover:bg-orange/10 hover:text-gray-200"
                                            }`}
                                            onClick={onClickHandler}
                                        >
                                            {subItem.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            }

            // Handle regular menu items
            const isActive = route().current(item.href.substring(1) + "*");

            return (
                <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 md:py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                            ? "bg-orange text-white shadow-lg"
                            : "text-gray-300 hover:bg-orange hover:text-white"
                    }`}
                    onClick={onClickHandler}
                >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                </Link>
            );
        });
    };

    return (
        <>
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
                        {renderBrandHeader()}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="text-white hover:text-orange transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Mobile navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {renderNavigationItems(() => setSidebarOpen(false))}
                    </nav>
                </div>
            </div>

            {/* Sidebar for desktop */}
            <div
                className={`hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col ${
                    impersonating ? "md:top-14 lg:top-[4.5rem]" : ""
                }`}
            >
                <div className="flex flex-col flex-grow bg-navy">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-navy-light">
                        {renderBrandHeader()}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        {renderNavigationItems()}
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
        </>
    );
}

