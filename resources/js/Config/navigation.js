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
    Bus,
    Tag,
    Receipt,
    Clock,
    Shield,
    AlertTriangle,
    AlertOctagon,
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
            {
                name: "Timetables",
                icon: Clock,
                submenu: [
                    { name: "Dashboard", href: "/timetables/dashboard", icon: LayoutDashboard },
                    { name: "Blueprints", href: "/blueprints", icon: FileText },
                    { name: "Templates", href: "/timetables/templates", icon: Calendar },
                    { name: "Periods", href: "/timetables/periods", icon: Clock },
                    { name: "Rooms", href: "/timetables/rooms", icon: School },
                    { name: "Availability", href: "/timetables/availability", icon: UserCog },
                ]
            },
            ...(isMadrasah ? [
                {
                    name: "Quran",
                    icon: Book,
                    submenu: [
                        { name: "Dashboard", href: "/quran", icon: LayoutDashboard },
                        { name: "Homework", href: "/quran-homework", icon: BookOpen },
                        { name: "Schedules", href: "/quran-schedule", icon: Calendar },
                    ]
                },
            ] : []),
            {
                name: "Fees",
                icon: DollarSign,
                submenu: [
                    { name: "Dashboard", href: "/fees", icon: LayoutDashboard },
                    { name: "Invoices", href: "/invoices", icon: Receipt },
                    { name: "Transport Routes", href: "/transport-routes", icon: Bus },
                    { name: "Tuition Fees", href: "/tuition-fees", icon: GraduationCap },
                    { name: "Universal Fees", href: "/universal-fees", icon: BookOpen },
                    { name: "Fee Preferences", href: "/fee-preferences", icon: Settings },
                ]
            },
            { name: "Reports", href: "/reports", icon: FileText },
            {
                name: "Documents",
                icon: FolderOpen,
                submenu: [
                    { name: "All Documents", href: "/documents", icon: FolderOpen },
                    { name: "Policies & Regulations", href: "/policies", icon: Shield },
                    { name: "Accident Reports", href: "/accident-reports", icon: AlertTriangle },
                    { name: "Incident Reports", href: "/incident-reports", icon: AlertOctagon },
                ]
            },
            {
                name: "Settings",
                icon: Settings,
                submenu: [
                    { name: "School Profile", href: "/admin/settings/profile" },
                    { name: "Academic Years", href: "/admin/settings/academic-years" },
                    { name: "Academic Terms", href: "/admin/settings/academic-terms" },
                    { name: "Preferences", href: "/admin/settings/preferences" },
                    { name: "Streams", href: "/streams" },
                ]
            },
        ],
        teacher: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "My Grades", href: "/grades", icon: BookOpen },
            { name: "Students", href: "/students", icon: Users },
            { name: "Guardians", href: "/guardians", icon: UserCircle },
            { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
            { name: "Subjects", href: "/subjects", icon: FileText },
            { name: "Exams", href: "/exams", icon: Calendar },
            {
                name: "Timetables",
                icon: Clock,
                submenu: [
                    { name: "My Timetable", href: "/timetables/my-timetable", icon: Calendar },
                    { name: "My Availability", href: "/timetables/availability", icon: UserCog },
                ]
            },
            ...(isMadrasah ? [
                {
                    name: "Quran",
                    icon: Book,
                    submenu: [
                        { name: "Dashboard", href: "/quran", icon: LayoutDashboard },
                        { name: "Homework", href: "/quran-homework", icon: BookOpen },
                        { name: "Schedules", href: "/quran-schedule", icon: Calendar },
                    ]
                },
            ] : []),
            { name: "Reports", href: "/reports", icon: FileText },
            {
                name: "Documents",
                icon: FolderOpen,
                submenu: [
                    { name: "My Documents", href: "/documents", icon: FolderOpen },
                    { name: "Policies & Regulations", href: "/policies", icon: Shield },
                    { name: "Accident Reports", href: "/accident-reports", icon: AlertTriangle },
                    { name: "Incident Reports", href: "/incident-reports", icon: AlertOctagon },
                ]
            },
        ],
        guardian: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            ...(isMadrasah ? [
                {
                    name: "Quran",
                    icon: Book,
                    submenu: [
                        { name: "Dashboard", href: "/quran", icon: LayoutDashboard },
                        { name: "Homework", href: "/guardian/quran-homework", icon: BookOpen },
                    ]
                },
            ] : []),
            { name: "Invoices", href: "/guardian/invoices", icon: DollarSign },
            { name: "Reports", href: "/reports", icon: FileText },
            { name: "Documents", href: "/documents", icon: FolderOpen },
            { name: "Policies", href: "/policies", icon: Shield },
        ],
        accountant: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Policies", href: "/policies", icon: Shield },
        ],
        receptionist: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Policies", href: "/policies", icon: Shield },
            { name: "Accident Reports", href: "/accident-reports", icon: AlertTriangle },
            { name: "Incident Reports", href: "/incident-reports", icon: AlertOctagon },
        ],
        nurse: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Policies", href: "/policies", icon: Shield },
            { name: "Accident Reports", href: "/accident-reports", icon: AlertTriangle },
            { name: "Incident Reports", href: "/incident-reports", icon: AlertOctagon },
        ],
        it_staff: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Policies", href: "/policies", icon: Shield },
        ],
        maid: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Policies", href: "/policies", icon: Shield },
        ],
        cook: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Policies", href: "/policies", icon: Shield },
        ],
    };

    return navigationConfig[role] || [];
};

