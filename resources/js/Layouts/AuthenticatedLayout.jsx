import { useState } from "react";
import { usePage } from "@inertiajs/react";
import ImpersonationBanner from "@/Components/ImpersonationBanner";
import PWAInstallPrompt from "@/Components/PWAInstallPrompt";
import Sidebar from "@/Layouts/Sidebar";
import TopBar from "@/Layouts/TopBar";
import { getNavigation } from "@/Config/navigation";
import { useImpersonationBanner } from "@/Hooks/useImpersonationBanner";

export default function AuthenticatedLayout({ header, children }) {
    const { auth, school, impersonation } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Impersonation banner state management
    const { visible: bannerVisible, toggle: toggleBanner } = useImpersonationBanner(
        impersonation?.isImpersonating
    );

    // Determine branding based on user role
    const isSuperAdmin = auth.user.role === "super_admin";
    const brandName = isSuperAdmin ? "SchoolMS" : school?.name || "SchoolMS";
    const brandLogo = !isSuperAdmin && school?.logo_path ? school.logo_path : null;

    // Get navigation items based on role and school type
    const isMadrasah = school?.school_type === "madrasah";
    const navigation = getNavigation(auth.user.role, isMadrasah);

    return (
        <div className="min-h-screen bg-gray-50">
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
                    impersonation?.isImpersonating ? "md:pt-14 lg:pt-[4.5rem]" : ""
                }`}
            >
                {/* Top navbar */}
                <TopBar header={header} auth={auth} setSidebarOpen={setSidebarOpen} />

                {/* Page content */}
                <main className="flex-1">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
        </div>
    );
}