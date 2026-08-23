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
 * @param {Object} props.badges - Badge counts for menu items
 */
export default function GuardianMoreMenu({ isMadrasah = false, badges = {} }) {
    return (
        <div className="pb-6">
            {/* Quran Section (Madrasah Only) */}
            {isMadrasah && (
                <BottomSheetSection title="Quran">
                    <BottomSheetMenuItem
                        icon={LayoutDashboard}
                        label="Quran Dashboard"
                        href="/quran"
                    />
                    <BottomSheetMenuItem
                        icon={BookOpen}
                        label="Homework"
                        href="/guardian/quran-homework"
                        badge={badges.quranHomework}
                    />
                </BottomSheetSection>
            )}

            {/* Documents & Reports Section */}
            <BottomSheetSection title="Documents & Reports">
                {!isMadrasah && (
                    <BottomSheetMenuItem
                        icon={FileText}
                        label="Reports"
                        href="/reports"
                        badge={badges.reports}
                    />
                )}
                <BottomSheetMenuItem
                    icon={FolderOpen}
                    label="Documents"
                    href="/documents"
                    badge={badges.documents}
                />
                <BottomSheetMenuItem
                    icon={Shield}
                    label="Policies & Regulations"
                    href="/policies"
                />
            </BottomSheetSection>
        </div>
    );
}

