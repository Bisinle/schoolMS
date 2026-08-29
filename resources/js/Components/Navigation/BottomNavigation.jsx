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
 * @param {string} props.role - User role (admin, teacher, guardian) — still
 *   selects which curated fixed-slot layout to build, same reasoning as
 *   navigation.js's filterByPermission: this is a UI-routing choice, not a
 *   security boundary. Each item's actual visibility is now gated by
 *   `can`/`canAny` against the user's real permissions.
 * @param {boolean} props.isMadrasah - Whether school is madrasah type
 * @param {(permission: string) => boolean} props.can
 * @param {(permissions: string[]) => boolean} [props.canAny]
 * @param {Function} props.onMoreClick - Callback when "More" is clicked
 * @param {Object} props.badges - Badge counts for navigation items
 */
export default function BottomNavigation({ role, isMadrasah = false, can = () => true, canAny = () => true, onMoreClick, badges = {} }) {
    const filterItems = (items) => items.filter((item) => {
        if (item.isMore) return true;
        if (item.permission && !can(item.permission)) return false;
        if (item.permissions && !canAny(item.permissions)) return false;
        return true;
    });

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
                permission: 'attendance.view',
            },
            {
                name: 'My Timetable',
                href: '/timetables/my-timetable',
                icon: Calendar,
                label: 'Timetable',
                badge: badges.timetable,
                permission: 'timetable-schedule.view-own',
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
                permission: 'quran-dashboard.view',
            });
        } else {
            baseItems.push({
                name: 'My Grades',
                href: '/grades',
                icon: BookOpen,
                label: 'Grades',
                badge: badges.grades,
                permission: 'grades.view',
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
                permission: 'attendance.view',
            },
            {
                name: 'Students',
                href: '/students',
                icon: Users,
                label: 'Students',
                badge: badges.students,
                permission: 'students.view',
            },
            {
                name: 'Timetable',
                href: '/timetables/dashboard',
                icon: Clock,
                label: 'Timetable',
                badge: badges.timetable,
                permission: 'timetable-dashboard.view',
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
                permission: 'attendance.view-own-children',
            },
            {
                name: 'Invoices',
                href: '/guardian/invoices',
                icon: DollarSign,
                label: 'Invoices',
                badge: badges.invoices,
                permission: 'fees.view-own-invoices',
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
                permission: 'quran-dashboard.view',
            });
        } else {
            baseItems.push({
                name: 'Reports',
                href: '/reports',
                icon: FileText,
                label: 'Reports',
                badge: badges.reports,
                permission: 'reports.view',
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

    const navItems = filterItems(getNavItems());

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

