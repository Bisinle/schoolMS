import { useState } from "react";
import { usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import ImpersonationBanner from "@/Components/ImpersonationBanner";
import PWAInstallPrompt from "@/Components/PWAInstallPrompt";
import OfflineIndicator from "@/Components/OfflineIndicator";
import Sidebar from "@/Layouts/Sidebar";
import TopBar from "@/Layouts/TopBar";
import { getNavigation } from "@/Config/navigation";
import { useImpersonationBanner } from "@/Hooks/useImpersonationBanner";
import { BottomNavigation, BottomSheet, TeacherMoreMenu, AdminMoreMenu } from "@/Components/Navigation";

export default function AuthenticatedLayout({ header, children }) {
    const { auth, school, impersonation } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Impersonation banner state management
    const { visible: bannerVisible, toggle: toggleBanner } =
        useImpersonationBanner(impersonation?.isImpersonating);

    // Determine branding based on user role
    const isSuperAdmin = auth.user.role === "super_admin";
    const brandName = isSuperAdmin ? "SchoolMS" : school?.name || "SchoolMS";
    const brandLogo =
        !isSuperAdmin && school?.logo_path
            ? `/storage/${school.logo_path}`
            : null;

    // Get navigation items based on role and school type
    const isMadrasah = school?.school_type === "madrasah";
    const navigation = getNavigation(auth.user.role, isMadrasah);

    // Determine if bottom nav should be shown (mobile only, for teachers and admins)
    const showBottomNav = auth.user.role === 'teacher' || auth.user.role === 'admin';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Impersonation Banner */}
            {impersonation?.isImpersonating && (
                <ImpersonationBanner
                    user={impersonation.impersonatedUser}
                    originalAdmin={{ id: impersonation.impersonatorId }}
                    isVisible={bannerVisible}
                    onToggle={toggleBanner}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                navigation={navigation}
                brandName={brandName}
                brandLogo={brandLogo}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                impersonating={impersonation?.isImpersonating}
                isSuperAdmin={isSuperAdmin}
                auth={auth}
            />

            {/* Main content */}
            <div
                className={`md:pl-64 flex flex-col flex-1 ${
                    impersonation?.isImpersonating
                        ? "md:pt-14 lg:pt-[4.5rem]"
                        : ""
                }`}
            >
                {/* Top navbar */}
                <TopBar
                    header={header}
                    auth={auth}
                    setSidebarOpen={setSidebarOpen}
                    showHamburger={!showBottomNav}
                />

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {/* Page content */}
                    <main className="flex-1">
                        <div
                            className={`py-6 ${
                                showBottomNav ? "pb-20 md:pb-6" : ""
                            }`}
                        >
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                {children}
                            </div>
                        </div>
                    </main>
                </motion.div>
            </div>

            {/* Bottom Navigation (Mobile Only) */}
            {showBottomNav && (
                <BottomNavigation
                    role={auth.user.role}
                    isMadrasah={isMadrasah}
                    onMoreClick={() => setShowMoreMenu(true)}
                    badges={
                        {
                            // TODO: Add badge counts from backend
                        }
                    }
                />
            )}

            {/* More Menu Bottom Sheet - Teacher */}
            {showBottomNav && auth.user.role === "teacher" && (
                <BottomSheet
                    show={showMoreMenu}
                    onClose={() => setShowMoreMenu(false)}
                    title="More"
                >
                    <TeacherMoreMenu
                        isMadrasah={isMadrasah}
                        badges={
                            {
                                // TODO: Add badge counts from backend
                            }
                        }
                    />
                </BottomSheet>
            )}

            {/* More Menu Bottom Sheet - Admin */}
            {showBottomNav && auth.user.role === "admin" && (
                <BottomSheet
                    show={showMoreMenu}
                    onClose={() => setShowMoreMenu(false)}
                    title="More"
                >
                    <AdminMoreMenu
                        isMadrasah={isMadrasah}
                        badges={
                            {
                                // TODO: Add badge counts from backend
                            }
                        }
                    />
                </BottomSheet>
            )}

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
        </div>
    );
}
