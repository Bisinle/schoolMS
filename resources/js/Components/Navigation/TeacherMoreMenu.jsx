import { BottomSheetMenuItem, BottomSheetSection } from './BottomSheet';
import {
    Users,
    UserCircle,
    FileText,
    Calendar,
    UserCog,
    Book,
    BookOpen,
    FolderOpen,
    Shield,
    AlertTriangle,
    AlertOctagon,
    BarChart3,
} from 'lucide-react';

/**
 * Teacher "More" Menu Content
 * Organized menu items for teacher role
 *
 * @param {Object} props
 * @param {boolean} props.isMadrasah - Whether school is madrasah type
 * @param {(permission: string) => boolean} [props.can]
 * @param {Object} props.badges - Badge counts for menu items
 */
export default function TeacherMoreMenu({ isMadrasah = false, can = () => true, badges = {} }) {
    return (
        <div className="pb-6">
            {/* Main Navigation */}
            <BottomSheetSection>
                {can('grades.view') && (
                    <BottomSheetMenuItem
                        icon={BookOpen}
                        label="My Grades"
                        href="/grades"
                        badge={badges.grades}
                    />
                )}
                {can('students.view') && (
                    <BottomSheetMenuItem
                        icon={Users}
                        label="Students"
                        href="/students"
                        badge={badges.students}
                    />
                )}
                {can('guardians.view') && (
                    <BottomSheetMenuItem
                        icon={UserCircle}
                        label="Guardians"
                        href="/guardians"
                    />
                )}
                {can('subjects.view') && (
                    <BottomSheetMenuItem
                        icon={FileText}
                        label="Subjects"
                        href="/subjects"
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

            {/* Timetable Section */}
            {can('timetable-availability.manage') && (
                <BottomSheetSection title="Timetable">
                    <BottomSheetMenuItem
                        icon={UserCog}
                        label="My Availability"
                        href="/timetables/availability"
                    />
                </BottomSheetSection>
            )}

            {/* Quran Section (Madrasah Only) */}
            {isMadrasah && (
                <BottomSheetSection title="Quran">
                    {can('quran-dashboard.view') && (
                        <BottomSheetMenuItem
                            icon={Book}
                            label="Quran Dashboard"
                            href="/quran"
                        />
                    )}
                    {can('quran-homework.view') && (
                        <BottomSheetMenuItem
                            icon={BookOpen}
                            label="Homework"
                            href="/quran-homework"
                            badge={badges.quranHomework}
                        />
                    )}
                    {can('quran-schedule.view-all') && (
                        <BottomSheetMenuItem
                            icon={Calendar}
                            label="Schedules"
                            href="/quran-schedule"
                        />
                    )}
                </BottomSheetSection>
            )}

            {/* Documents & Reports Section */}
            <BottomSheetSection title="Documents & Reports">
                {can('reports.view') && (
                    <BottomSheetMenuItem
                        icon={BarChart3}
                        label="Reports"
                        href="/reports"
                    />
                )}
                {can('documents.view') && (
                    <BottomSheetMenuItem
                        icon={FolderOpen}
                        label="My Documents"
                        href="/documents"
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
        </div>
    );
}

