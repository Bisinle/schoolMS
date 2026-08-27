import { BottomSheetMenuItem, BottomSheetSection } from './BottomSheet';
import {
    BookOpen,
    FileText,
    FolderOpen,
    Shield,
    LayoutDashboard,
} from 'lucide-react';

/**
 * Guardian "More" Menu Content
 * Organized menu items for guardian role
 *
 * @param {Object} props
 * @param {boolean} props.isMadrasah - Whether school is madrasah type
 * @param {(permission: string) => boolean} [props.can]
 * @param {Object} props.badges - Badge counts for menu items
 */
export default function GuardianMoreMenu({ isMadrasah = false, can = () => true, badges = {} }) {
    return (
        <div className="pb-6">
            {/* Quran Section (Madrasah Only) */}
            {isMadrasah && (
                <BottomSheetSection title="Quran">
                    {can('quran-dashboard.view') && (
                        <BottomSheetMenuItem
                            icon={LayoutDashboard}
                            label="Quran Dashboard"
                            href="/quran"
                        />
                    )}
                    {can('quran-homework.view-own') && (
                        <BottomSheetMenuItem
                            icon={BookOpen}
                            label="Homework"
                            href="/guardian/quran-homework"
                            badge={badges.quranHomework}
                        />
                    )}
                </BottomSheetSection>
            )}

            {/* Documents & Reports Section */}
            <BottomSheetSection title="Documents & Reports">
                {!isMadrasah && can('reports.view') && (
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
                        label="Documents"
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
            </BottomSheetSection>
        </div>
    );
}

