import { Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    ClipboardCheck,
    Calendar,
    BookOpen,
    MoreHorizontal,
    Book,
    Users,
    Clock,
    DollarSign,
    FileText,
} from 'lucide-react';

/**
 * Bottom Navigation Component for Mobile
 * Industry-standard mobile navigation pattern
 * 
 * @param {Object} props
 * @param {string} props.role - User role (admin, teacher, guardian)
 * @param {boolean} props.isMadrasah - Whether school is madrasah type
 * @param {Function} props.onMoreClick - Callback when "More" is clicked
 * @param {Object} props.badges - Badge counts for navigation items
 */
export default function BottomNavigation({ role, isMadrasah = false, onMoreClick, badges = {} }) {
    // Navigation configuration for teachers
    const getTeacherNavItems = () => {
        const baseItems = [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                label: 'Home',
                badge: badges.dashboard,
            },
            {
                name: 'Attendance',
                href: '/attendance',
                icon: ClipboardCheck,
                label: 'Attendance',
                badge: badges.attendance,
            },
            {
                name: 'My Timetable',
                href: '/timetables/my-timetable',
                icon: Calendar,
                label: 'Timetable',
                badge: badges.timetable,
            },
        ];

        // Add Quran or My Grades based on school type
        if (isMadrasah) {
            baseItems.push({
                name: 'Quran',
                href: '/quran',
                icon: Book,
                label: 'Quran',
                badge: badges.quran,
            });
        } else {
            baseItems.push({
                name: 'My Grades',
                href: '/grades',
                icon: BookOpen,
                label: 'Grades',
                badge: badges.grades,
            });
        }

        // Always add "More" as the last item
        baseItems.push({
            name: 'More',
            href: null, // No href, triggers drawer
            icon: MoreHorizontal,
            label: 'More',
            isMore: true,
        });

        return baseItems;
    };

    // Navigation configuration for admins
    const getAdminNavItems = () => {
        const items = [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                label: 'Home',
                badge: badges.dashboard,
            },
            {
                name: 'Attendance',
                href: '/attendance',
                icon: ClipboardCheck,
                label: 'Attendance',
                badge: badges.attendance,
            },
            {
                name: 'Students',
                href: '/students',
                icon: Users,
                label: 'Students',
                badge: badges.students,
            },
            {
                name: 'Timetable',
                href: '/timetables/dashboard',
                icon: Clock,
                label: 'Timetable',
                badge: badges.timetable,
            },
            {
                name: 'More',
                href: null,
                icon: MoreHorizontal,
                label: 'More',
                isMore: true,
            },
        ];

        return items;
    };

    // Navigation configuration for guardians
    const getGuardianNavItems = () => {
        const baseItems = [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                label: 'Home',
                badge: badges.dashboard,
            },
            {
                name: 'Attendance',
                href: '/guardian/attendance',
                icon: ClipboardCheck,
                label: 'Attendance',
                badge: badges.attendance,
            },
            {
                name: 'Invoices',
                href: '/guardian/invoices',
                icon: DollarSign,
                label: 'Invoices',
                badge: badges.invoices,
            },
        ];

        // Add Quran or Reports based on school type
        if (isMadrasah) {
            baseItems.push({
                name: 'Quran',
                href: '/quran',
                icon: Book,
                label: 'Quran',
                badge: badges.quran,
            });
        } else {
            baseItems.push({
                name: 'Reports',
                href: '/reports',
                icon: FileText,
                label: 'Reports',
                badge: badges.reports,
            });
        }

        // Always add "More" as the last item
        baseItems.push({
            name: 'More',
            href: null,
            icon: MoreHorizontal,
            label: 'More',
            isMore: true,
        });

        return baseItems;
    };

    // Get navigation items based on role
    const getNavItems = () => {
        switch (role) {
            case 'teacher':
                return getTeacherNavItems();
            case 'admin':
                return getAdminNavItems();
            case 'guardian':
                return getGuardianNavItems();
            default:
                return getTeacherNavItems();
        }
    };

    const navItems = getNavItems();

    // Check if a nav item is active
    const isActive = (item) => {
        if (item.isMore) return false;

        // Check if current URL starts with the item's href
        return window.location.pathname.startsWith(item.href);
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);

                    // Handle "More" button differently
                    if (item.isMore) {
                        return (
                            <button
                                key={item.name}
                                onClick={onMoreClick}
                                className="flex flex-col items-center justify-center flex-1 h-full px-2 py-1 transition-all duration-200 active:scale-95"
                            >
                                <div className="relative">
                                    <Icon className="w-6 h-6 text-gray-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-600 mt-1">
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    // Regular navigation item
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full px-2 py-1 transition-all duration-200 active:scale-95 ${
                                active ? 'text-orange' : 'text-gray-600'
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-6 h-6 ${active ? 'text-orange' : 'text-gray-600'}`} />
                                
                                {/* Badge indicator */}
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>
                            
                            <span className={`text-xs font-medium mt-1 ${
                                active ? 'text-orange' : 'text-gray-600'
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

