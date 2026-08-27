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
 *
 * @param {Object} props
 * @param {boolean} [props.isMadrasah]
 * @param {(permission: string) => boolean} [props.can]
 * @param {Object} [props.badges]
 */
export default function AdminMoreMenu({ isMadrasah = false, can = () => true, badges = {} }) {
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
                {can('teachers.view') && (
                    <BottomSheetMenuItem
                        icon={GraduationCap}
                        label="Teachers"
                        href="/teachers"
                        badge={badges.teachers}
                    />
                )}
                {can('guardians.view') && (
                    <BottomSheetMenuItem
                        icon={UserCircle}
                        label="Guardians"
                        href="/guardians"
                        badge={badges.guardians}
                    />
                )}
                {can('users.view') && (
                    <BottomSheetMenuItem
                        icon={UserCog}
                        label="Users"
                        href="/users"
                        badge={badges.users}
                    />
                )}
            </BottomSheetSection>

            {/* Academic Section */}
            <BottomSheetSection title="Academic">
                {can('grades.view') && (
                    <BottomSheetMenuItem
                        icon={BookOpen}
                        label="Grades"
                        href="/grades"
                        badge={badges.grades}
                    />
                )}
                {can('subjects.view') && (
                    <BottomSheetMenuItem
                        icon={FileText}
                        label="Subjects"
                        href="/subjects"
                        badge={badges.subjects}
                    />
                )}
                {can('exams.view') && (
                    <BottomSheetMenuItem
                        icon={Calendar}
                        label="Exams"
                        href="/exams"
                        badge={badges.exams}
                    />
                )}
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
                        {can('timetable-dashboard.view') && (
                            <BottomSheetMenuItem
                                icon={LayoutDashboard}
                                label="Dashboard"
                                href="/timetables/dashboard"
                            />
                        )}
                        {can('timetable-dashboard.view') && (
                            <BottomSheetMenuItem
                                icon={FileText}
                                label="Blueprints"
                                href="/blueprints"
                            />
                        )}
                        {can('timetable-templates.manage') && (
                            <BottomSheetMenuItem
                                icon={Calendar}
                                label="Templates"
                                href="/timetables/templates"
                            />
                        )}
                        {can('timetable-periods.view') && (
                            <BottomSheetMenuItem
                                icon={Clock}
                                label="Periods"
                                href="/timetables/periods"
                            />
                        )}
                        {can('timetable-rooms.view') && (
                            <BottomSheetMenuItem
                                icon={School}
                                label="Rooms"
                                href="/timetables/rooms"
                            />
                        )}
                        {can('timetable-availability.manage') && (
                            <BottomSheetMenuItem
                                icon={UserCog}
                                label="Availability"
                                href="/timetables/availability"
                            />
                        )}
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

                {expandedSections.fees && can('fees.manage') && (
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
                            {can('quran-dashboard.view') && (
                                <BottomSheetMenuItem
                                    icon={LayoutDashboard}
                                    label="Dashboard"
                                    href="/quran"
                                />
                            )}
                            {can('quran-homework.view') && (
                                <BottomSheetMenuItem
                                    icon={BookOpen}
                                    label="Homework"
                                    href="/quran-homework"
                                />
                            )}
                            {can('quran-schedule.view-all') && (
                                <BottomSheetMenuItem
                                    icon={Calendar}
                                    label="Schedules"
                                    href="/quran-schedule"
                                />
                            )}
                        </div>
                    )}
                </BottomSheetSection>
            )}

            {/* Documents & Reports Section */}
            <BottomSheetSection title="Documents & Reports">
                {can('reports.view') && (
                    <BottomSheetMenuItem
                        icon={FileText}
                        label="Reports"
                        href="/reports"
                        badge={badges.reports}
                    />
                )}
                {can('documents.view') && (
                    <BottomSheetMenuItem
                        icon={FolderOpen}
                        label="All Documents"
                        href="/documents"
                        badge={badges.documents}
                    />
                )}
                {can('policies.view') && (
                    <BottomSheetMenuItem
                        icon={Shield}
                        label="Policies & Regulations"
                        href="/policies"
                    />
                )}
                {can('accident-reports.view') && (
                    <BottomSheetMenuItem
                        icon={AlertTriangle}
                        label="Accident Reports"
                        href="/accident-reports"
                        badge={badges.accidentReports}
                    />
                )}
                {can('incident-reports.view') && (
                    <BottomSheetMenuItem
                        icon={AlertOctagon}
                        label="Incident Reports"
                        href="/incident-reports"
                        badge={badges.incidentReports}
                    />
                )}
            </BottomSheetSection>

            {/* Settings Section */}
            {can('settings.manage') && (
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
                    {can('streams.view') && (
                        <BottomSheetMenuItem
                            icon={FileText}
                            label="Streams"
                            href="/streams"
                        />
                    )}
                </BottomSheetSection>
            )}
        </div>
    );
}

