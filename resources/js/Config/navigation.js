import {
    LayoutDashboard,
    Users,
    UserCircle,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
    FileText,
    Calendar,
    UserCog,
    FolderOpen,
    School,
    Settings,
    Book,
    DollarSign,
} from "lucide-react";

/**
 * Get navigation items based on user role and school type
 * @param {string} role - User role (super_admin, admin, teacher, guardian)
 * @param {boolean} isMadrasah - Whether the school is a madrasah type
 * @returns {Array} Navigation items for the role
 */
export const getNavigation = (role, isMadrasah = false) => {
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
            ...(isMadrasah ? [{ name: "Quran Tracking", href: "/quran-tracking", icon: Book }] : []),
            { name: "Fees", href: "/fees", icon: DollarSign },
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
            ...(isMadrasah ? [{ name: "Quran Tracking", href: "/quran-tracking", icon: Book }] : []),
            { name: "Reports", href: "/reports", icon: FileText },
            { name: "My Documents", href: "/documents", icon: FolderOpen },
        ],
        guardian: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            ...(isMadrasah ? [{ name: "Quran Tracking", href: "/guardian/quran-tracking", icon: Book }] : []),
            { name: "Invoices", href: "/guardian/invoices", icon: DollarSign },
            { name: "Reports", href: "/reports", icon: FileText },
            { name: "Documents", href: "/documents", icon: FolderOpen },
        ],
    };

    return navigationConfig[role] || [];
};

