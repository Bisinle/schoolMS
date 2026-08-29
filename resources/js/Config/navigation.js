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
 * Drops any item whose `permission`/`permissions` requirement isn't met,
 * recursing into `submenu`. `role` still selects which of the curated
 * arrays below applies (that's a UI-routing choice, not a security
 * boundary — the routes themselves are gated by the real
 * permission/policy layer regardless of what the nav shows) — this filter
 * is what makes each *item within* that curated screen actually reflect
 * the user's real, current permissions instead of being shown just
 * because the role historically implied it.
 */
const filterByPermission = (items, can, canAny) =>
    items
        .filter((item) => {
            if (item.permission && !can(item.permission)) return false;
            if (item.permissions && !canAny(item.permissions)) return false;
            return true;
        })
        .map((item) =>
            item.submenu
                ? { ...item, submenu: filterByPermission(item.submenu, can, canAny) }
                : item
        )
        .filter((item) => !item.submenu || item.submenu.length > 0);

/**
 * Get navigation items based on user role and school type
 * @param {string} role - User role (super_admin, admin, teacher, guardian)
 * @param {boolean} isMadrasah - Whether the school is a madrasah type
 * @param {(permission: string) => boolean} can
 * @param {(permissions: string[]) => boolean} canAny
 * @returns {Array} Navigation items for the role
 */
export const getNavigation = (role, isMadrasah = false, can = () => true, canAny = () => true) => {
    const navigationConfig = {
        super_admin: [
            { name: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
            { name: "Schools", href: "/super-admin/schools", icon: School, permission: "super-admin.schools.manage" },
            { name: "Users", href: "/super-admin/users", icon: Users, permission: "super-admin.users.manage" },
            { name: "Settings", href: "/super-admin/settings", icon: Settings, permission: "super-admin.settings.manage" },
        ],
        admin: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Students", href: "/students", icon: Users, permission: "students.view" },
            { name: "Teachers", href: "/teachers", icon: GraduationCap, permission: "teachers.view" },
            { name: "Guardians", href: "/guardians", icon: UserCircle, permission: "guardians.view" },
            { name: "Users", href: "/users", icon: UserCog, permission: "users.view" },
            { name: "Attendance", href: "/attendance", icon: ClipboardCheck, permission: "attendance.view" },
            { name: "Grades", href: "/grades", icon: BookOpen, permission: "grades.view" },
            { name: "Subjects", href: "/subjects", icon: FileText, permission: "subjects.view" },
            { name: "Exams", href: "/exams", icon: Calendar, permission: "exams.view" },
            {
                name: "Timetables",
                icon: Clock,
                submenu: [
                    { name: "Dashboard", href: "/timetables/dashboard", icon: LayoutDashboard, permission: "timetable-dashboard.view" },
                    { name: "Blueprints", href: "/blueprints", icon: FileText, permission: "timetable-dashboard.view" },
                    { name: "Templates", href: "/timetables/templates", icon: Calendar, permission: "timetable-templates.manage" },
                    { name: "Periods", href: "/timetables/periods", icon: Clock, permission: "timetable-periods.view" },
                    { name: "Rooms", href: "/timetables/rooms", icon: School, permission: "timetable-rooms.view" },
                    { name: "Availability", href: "/timetables/availability", icon: UserCog, permission: "timetable-availability.manage" },
                ]
            },
            ...(isMadrasah ? [
                {
                    name: "Quran",
                    icon: Book,
                    submenu: [
                        { name: "Dashboard", href: "/quran", icon: LayoutDashboard, permission: "quran-dashboard.view" },
                        { name: "Homework", href: "/quran-homework", icon: BookOpen, permission: "quran-homework.view" },
                        { name: "Schedules", href: "/quran-schedule", icon: Calendar, permission: "quran-schedule.view-all" },
                    ]
                },
            ] : []),
            {
                name: "Fees",
                icon: DollarSign,
                submenu: [
                    { name: "Dashboard", href: "/fees", icon: LayoutDashboard, permission: "fees.manage" },
                    { name: "Invoices", href: "/invoices", icon: Receipt, permission: "fees.manage" },
                    { name: "Transport Routes", href: "/transport-routes", icon: Bus, permission: "fees.manage" },
                    { name: "Tuition Fees", href: "/tuition-fees", icon: GraduationCap, permission: "fees.manage" },
                    { name: "Universal Fees", href: "/universal-fees", icon: BookOpen, permission: "fees.manage" },
                    { name: "Fee Preferences", href: "/fee-preferences", icon: Settings, permission: "fees.manage" },
                ]
            },
            { name: "Reports", href: "/reports", icon: FileText, permission: "reports.view" },
            {
                name: "Documents",
                icon: FolderOpen,
                submenu: [
                    { name: "All Documents", href: "/documents", icon: FolderOpen, permission: "documents.view" },
                    { name: "Policies & Regulations", href: "/policies", icon: Shield, permission: "policies.view" },
                    { name: "Accident Reports", href: "/accident-reports", icon: AlertTriangle, permission: "accident-reports.view" },
                    { name: "Incident Reports", href: "/incident-reports", icon: AlertOctagon, permission: "incident-reports.view" },
                ]
            },
            {
                name: "Settings",
                icon: Settings,
                submenu: [
                    { name: "School Profile", href: "/admin/settings/profile", permission: "settings.manage" },
                    { name: "Academic Years", href: "/admin/settings/academic-years", permission: "settings.manage" },
                    { name: "Academic Terms", href: "/admin/settings/academic-terms", permission: "settings.manage" },
                    { name: "Preferences", href: "/admin/settings/preferences", permission: "settings.manage" },
                    { name: "Streams", href: "/streams", permission: "streams.view" },
                ]
            },
        ],
        teacher: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "My Grades", href: "/grades", icon: BookOpen, permission: "grades.view" },
            { name: "Students", href: "/students", icon: Users, permission: "students.view" },
            { name: "Guardians", href: "/guardians", icon: UserCircle, permission: "guardians.view" },
            { name: "Attendance", href: "/attendance", icon: ClipboardCheck, permission: "attendance.view" },
            { name: "Subjects", href: "/subjects", icon: FileText, permission: "subjects.view" },
            { name: "Exams", href: "/exams", icon: Calendar, permission: "exams.view" },
            {
                name: "Timetables",
                icon: Clock,
                submenu: [
                    { name: "My Timetable", href: "/timetables/my-timetable", icon: Calendar, permission: "timetable-schedule.view-own" },
                    { name: "My Availability", href: "/timetables/availability", icon: UserCog, permission: "timetable-availability.manage" },
                ]
            },
            ...(isMadrasah ? [
                {
                    name: "Quran",
                    icon: Book,
                    submenu: [
                        { name: "Dashboard", href: "/quran", icon: LayoutDashboard, permission: "quran-dashboard.view" },
                        { name: "Homework", href: "/quran-homework", icon: BookOpen, permission: "quran-homework.view" },
                        { name: "Schedules", href: "/quran-schedule", icon: Calendar, permission: "quran-schedule.view-all" },
                    ]
                },
            ] : []),
            { name: "Reports", href: "/reports", icon: FileText, permission: "reports.view" },
            {
                name: "Documents",
                icon: FolderOpen,
                submenu: [
                    { name: "My Documents", href: "/documents", icon: FolderOpen, permission: "documents.view" },
                    { name: "Policies & Regulations", href: "/policies", icon: Shield, permission: "policies.view" },
                    { name: "Accident Reports", href: "/accident-reports", icon: AlertTriangle, permission: "accident-reports.view" },
                    { name: "Incident Reports", href: "/incident-reports", icon: AlertOctagon, permission: "incident-reports.view" },
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
                        { name: "Dashboard", href: "/quran", icon: LayoutDashboard, permission: "quran-dashboard.view" },
                        { name: "Homework", href: "/guardian/quran-homework", icon: BookOpen, permission: "quran-homework.view-own" },
                    ]
                },
            ] : []),
            { name: "Invoices", href: "/guardian/invoices", icon: DollarSign, permission: "fees.view-own-invoices" },
            { name: "Reports", href: "/reports", icon: FileText, permission: "reports.view" },
            { name: "Documents", href: "/documents", icon: FolderOpen, permission: "documents.view" },
            { name: "Policies", href: "/policies", icon: Shield, permission: "policies.view" },
        ],
    };

    return filterByPermission(navigationConfig[role] || [], can, canAny);
};
