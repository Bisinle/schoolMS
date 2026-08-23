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
 * @param {Object} props.badges - Badge counts for menu items
 */
export default function TeacherMoreMenu({ isMadrasah = false, badges = {} }) {
    return (
        <div className="pb-6">
            {/* Main Navigation */}
            <BottomSheetSection>
                <BottomSheetMenuItem
                    icon={BookOpen}
                    label="My Grades"
                    href="/grades"
                    badge={badges.grades}
                />
                <BottomSheetMenuItem
                    icon={Users}
                    label="Students"
                    href="/students"
                    badge={badges.students}
                />
                <BottomSheetMenuItem
                    icon={UserCircle}
                    label="Guardians"
                    href="/guardians"
                />
                <BottomSheetMenuItem
                    icon={FileText}
                    label="Subjects"
                    href="/subjects"
                />
                <BottomSheetMenuItem
                    icon={Calendar}
                    label="Exams"
                    href="/exams"
                    badge={badges.exams}
                />
            </BottomSheetSection>

            {/* Timetable Section */}
            <BottomSheetSection title="Timetable">
                <BottomSheetMenuItem
                    icon={UserCog}
                    label="My Availability"
                    href="/timetables/availability"
                />
            </BottomSheetSection>

            {/* Quran Section (Madrasah Only) */}
            {isMadrasah && (
                <BottomSheetSection title="Quran">
                    <BottomSheetMenuItem
                        icon={Book}
                        label="Quran Dashboard"
                        href="/quran"
                    />
                    <BottomSheetMenuItem
                        icon={BookOpen}
                        label="Homework"
                        href="/quran-homework"
                        badge={badges.quranHomework}
                    />
                    <BottomSheetMenuItem
                        icon={Calendar}
                        label="Schedules"
                        href="/quran-schedule"
                    />
                </BottomSheetSection>
            )}

            {/* Documents & Reports Section */}
            <BottomSheetSection title="Documents & Reports">
                <BottomSheetMenuItem
                    icon={BarChart3}
                    label="Reports"
                    href="/reports"
                />
                <BottomSheetMenuItem
                    icon={FolderOpen}
                    label="My Documents"
                    href="/documents"
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
        </div>
    );
}

