import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    GraduationCap,
    UserCircle,
    UserCog,
    BookOpen,
    FileText,
    Calendar,
    LayoutDashboard,
    Clock,
    School,
    Book,
    DollarSign,
    Receipt,
    Bus,
    Settings,
    FolderOpen,
    Shield,
    AlertTriangle,
    AlertOctagon,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { BottomSheetMenuItem, BottomSheetSection } from './BottomSheet';

/**
 * Admin-specific "More" menu content for bottom sheet
 * Organized into logical sections with collapsible submenus
 */
export default function AdminMoreMenu({ isMadrasah = false, badges = {} }) {
    const [expandedSections, setExpandedSections] = useState({
        timetables: false,
        fees: false,
        quran: false,
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="space-y-6">
            {/* People Management Section */}
            <BottomSheetSection title="People Management">
                <BottomSheetMenuItem
                    icon={GraduationCap}
                    label="Teachers"
                    href="/teachers"
                    badge={badges.teachers}
                />
                <BottomSheetMenuItem
                    icon={UserCircle}
                    label="Guardians"
                    href="/guardians"
                    badge={badges.guardians}
                />
                <BottomSheetMenuItem
                    icon={UserCog}
                    label="Users"
                    href="/users"
                    badge={badges.users}
                />
            </BottomSheetSection>

            {/* Academic Section */}
            <BottomSheetSection title="Academic">
                <BottomSheetMenuItem
                    icon={BookOpen}
                    label="Grades"
                    href="/grades"
                    badge={badges.grades}
                />
                <BottomSheetMenuItem
                    icon={FileText}
                    label="Subjects"
                    href="/subjects"
                    badge={badges.subjects}
                />
                <BottomSheetMenuItem
                    icon={Calendar}
                    label="Exams"
                    href="/exams"
                    badge={badges.exams}
                />
            </BottomSheetSection>

            {/* Timetable Section - Collapsible */}
            <BottomSheetSection title="Timetable">
                <button
                    onClick={() => toggleSection('timetables')}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-3 text-gray-500" />
                        <span className="font-medium">Timetable Management</span>
                    </div>
                    {expandedSections.timetables ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>
                
                {expandedSections.timetables && (
                    <div className="ml-4 mt-1 space-y-1">
                        <BottomSheetMenuItem
                            icon={LayoutDashboard}
                            label="Dashboard"
                            href="/timetables/dashboard"
                        />
                        <BottomSheetMenuItem
                            icon={FileText}
                            label="Blueprints"
                            href="/blueprints"
                        />
                        <BottomSheetMenuItem
                            icon={Calendar}
                            label="Templates"
                            href="/timetables/templates"
                        />
                        <BottomSheetMenuItem
                            icon={Clock}
                            label="Periods"
                            href="/timetables/periods"
                        />
                        <BottomSheetMenuItem
                            icon={School}
                            label="Rooms"
                            href="/timetables/rooms"
                        />
                        <BottomSheetMenuItem
                            icon={UserCog}
                            label="Availability"
                            href="/timetables/availability"
                        />
                    </div>
                )}
            </BottomSheetSection>

            {/* Fees Section - Collapsible */}
            <BottomSheetSection title="Financial">
                <button
                    onClick={() => toggleSection('fees')}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <div className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-3 text-gray-500" />
                        <span className="font-medium">Fees Management</span>
                    </div>
                    {expandedSections.fees ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {expandedSections.fees && (
                    <div className="ml-4 mt-1 space-y-1">
                        <BottomSheetMenuItem
                            icon={LayoutDashboard}
                            label="Dashboard"
                            href="/fees"
                        />
                        <BottomSheetMenuItem
                            icon={Receipt}
                            label="Invoices"
                            href="/invoices"
                            badge={badges.invoices}
                        />
                        <BottomSheetMenuItem
                            icon={Bus}
                            label="Transport Routes"
                            href="/transport-routes"
                        />
                        <BottomSheetMenuItem
                            icon={GraduationCap}
                            label="Tuition Fees"
                            href="/tuition-fees"
                        />
                        <BottomSheetMenuItem
                            icon={BookOpen}
                            label="Universal Fees"
                            href="/universal-fees"
                        />
                        <BottomSheetMenuItem
                            icon={Settings}
                            label="Fee Preferences"
                            href="/fee-preferences"
                        />
                    </div>
                )}
            </BottomSheetSection>

            {/* Quran Section - Collapsible (Madrasah Only) */}
            {isMadrasah && (
                <BottomSheetSection title="Quran">
                    <button
                        onClick={() => toggleSection('quran')}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <div className="flex items-center">
                            <Book className="w-5 h-5 mr-3 text-gray-500" />
                            <span className="font-medium">Quran Management</span>
                        </div>
                        {expandedSections.quran ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {expandedSections.quran && (
                        <div className="ml-4 mt-1 space-y-1">
                            <BottomSheetMenuItem
                                icon={LayoutDashboard}
                                label="Dashboard"
                                href="/quran"
                            />
                            <BottomSheetMenuItem
                                icon={Book}
                                label="Tracking"
                                href="/quran-tracking"
                            />
                            <BottomSheetMenuItem
                                icon={BookOpen}
                                label="Homework"
                                href="/quran-homework"
                            />
                            <BottomSheetMenuItem
                                icon={Calendar}
                                label="Schedules"
                                href="/quran-schedule"
                            />
                        </div>
                    )}
                </BottomSheetSection>
            )}

            {/* Documents & Reports Section */}
            <BottomSheetSection title="Documents & Reports">
                <BottomSheetMenuItem
                    icon={FileText}
                    label="Reports"
                    href="/reports"
                    badge={badges.reports}
                />
                <BottomSheetMenuItem
                    icon={FolderOpen}
                    label="All Documents"
                    href="/documents"
                    badge={badges.documents}
                />
                <BottomSheetMenuItem
                    icon={Shield}
                    label="Policies & Regulations"
                    href="/policies"
                />
                <BottomSheetMenuItem
                    icon={AlertTriangle}
                    label="Accident Reports"
                    href="/accident-reports"
                    badge={badges.accidentReports}
                />
                <BottomSheetMenuItem
                    icon={AlertOctagon}
                    label="Incident Reports"
                    href="/incident-reports"
                    badge={badges.incidentReports}
                />
            </BottomSheetSection>

            {/* Settings Section */}
            <BottomSheetSection title="Settings">
                <BottomSheetMenuItem
                    icon={School}
                    label="School Profile"
                    href="/admin/settings/profile"
                />
                <BottomSheetMenuItem
                    icon={Calendar}
                    label="Academic Years"
                    href="/admin/settings/academic-years"
                />
                <BottomSheetMenuItem
                    icon={Calendar}
                    label="Academic Terms"
                    href="/admin/settings/academic-terms"
                />
                <BottomSheetMenuItem
                    icon={Settings}
                    label="Preferences"
                    href="/admin/settings/preferences"
                />
                <BottomSheetMenuItem
                    icon={FileText}
                    label="Streams"
                    href="/streams"
                />
            </BottomSheetSection>
        </div>
    );
}

