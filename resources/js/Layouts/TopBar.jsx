import { Link } from "@inertiajs/react";
import { Menu, LogOut } from "lucide-react";

/**
 * Top navigation bar component
 * @param {Object} props
 * @param {string} props.header - Page header title
 * @param {Object} props.auth - Authentication object with user data
 * @param {Function} props.setSidebarOpen - Function to toggle mobile sidebar
 */
export default function TopBar({ header, auth, setSidebarOpen }) {
    return (
        <div className="sticky top-0 z-[40] flex-shrink-0 flex h-16 bg-white shadow-sm">
            <button
                type="button"
                className="px-4 text-gray-500 focus:outline-none md:hidden"
                onClick={() => setSidebarOpen(true)}
            >
                <Menu className="h-6 w-6 " />
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
    );
}

