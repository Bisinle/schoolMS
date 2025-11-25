import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    SwipeableListItem, 
    ExpandableCard, 
    ExpandableCardHeader,
    ExpandableCardContent,
    MobileListContainer,
    MobileListSection,
    MobileListDivider,
    MobileListHeader
} from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import { 
    Eye, 
    Edit, 
    Trash2, 
    FileText, 
    Phone, 
    Mail,
    Users,
    Calendar,
    GraduationCap,
    User
} from 'lucide-react';

/**
 * Mobile Components Test Page
 * 
 * Visual testing page for all mobile components.
 * This file can be deleted after verification.
 * 
 * To test: Add a route to this component and view in browser.
 */
export default function MobileComponentsTest({ auth }) {
    const [reportGenerated, setReportGenerated] = useState(false);

    // Sample data
    const sampleStudent = {
        id: 1,
        name: 'John Doe',
        admission_number: 'STU001',
        grade: { name: 'Grade 10' },
        gender: 'male',
        date_of_birth: '2008-05-15',
        guardian: {
            user: { name: 'Jane Doe' },
            phone_number: '+254712345678'
        }
    };

    const sampleTeacher = {
        id: 1,
        user: {
            name: 'Mr. Smith',
            email: 'smith@school.com',
            phone: '+254712345678'
        },
        subjects: [
            { name: 'Mathematics' },
            { name: 'Physics' }
        ]
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Mobile Components Test" />

            <div className="py-6 max-w-2xl mx-auto px-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Mobile Components Test
                    </h1>
                    <p className="text-sm text-gray-600">
                        Test all mobile components. View on mobile or resize browser to &lt;768px.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* SwipeableListItem Test */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            1. SwipeableListItem
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">
                            Swipe left for primary actions (blue), swipe right for secondary actions (green).
                        </p>

                        <MobileListContainer>
                            <SwipeableListItem
                                primaryAction={{
                                    color: 'blue',
                                    buttons: [
                                        { icon: Eye, onClick: () => alert('View clicked') },
                                        { icon: Edit, onClick: () => alert('Edit clicked') },
                                        { icon: Trash2, onClick: () => alert('Delete clicked') }
                                    ]
                                }}
                                secondaryAction={{
                                    color: 'green',
                                    buttons: [
                                        { icon: FileText, onClick: () => alert('Report clicked') }
                                    ]
                                }}
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                Student Item
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Swipe to reveal actions
                                            </p>
                                        </div>
                                        <Badge variant="status" value="active" />
                                    </div>
                                </div>
                            </SwipeableListItem>
                        </MobileListContainer>
                    </section>

                    {/* ExpandableCard Test */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            2. ExpandableCard
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">
                            Click to expand/collapse. Smooth animation with chevron rotation.
                        </p>

                        <MobileListContainer>
                            <ExpandableCard
                                headerClassName="p-4"
                                contentClassName="px-4 pb-4 pt-3"
                                header={
                                    <ExpandableCardHeader
                                        title="John Doe"
                                        subtitle="STU001 • Grade 10"
                                        badge={<Badge variant="status" value="active" size="sm" />}
                                        meta={
                                            <>
                                                <span className="text-xs text-gray-500">Male</span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs text-gray-500">15 years</span>
                                            </>
                                        }
                                    />
                                }
                            >
                                <ExpandableCardContent>
                                    <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs text-gray-600">May 15, 2008</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs text-gray-600">Jane Doe (Guardian)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs text-gray-600">+254712345678</span>
                                        </div>
                                    </div>
                                </ExpandableCardContent>
                            </ExpandableCard>
                        </MobileListContainer>
                    </section>

                    {/* Combined: SwipeableListItem + ExpandableCard */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            3. Combined: Swipeable + Expandable
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">
                            Real-world example: Swipe for actions, tap to expand details.
                        </p>

                        <MobileListContainer>
                            <SwipeableListItem
                                primaryAction={{
                                    color: 'blue',
                                    buttons: [
                                        { icon: Eye, onClick: () => alert('View') },
                                        { icon: Edit, onClick: () => alert('Edit') },
                                        { icon: Trash2, onClick: () => alert('Delete') }
                                    ]
                                }}
                                secondaryAction={{
                                    color: 'green',
                                    buttons: [
                                        { icon: FileText, onClick: () => setReportGenerated(true) }
                                    ]
                                }}
                            >
                                <ExpandableCard
                                    headerClassName="p-4"
                                    contentClassName="px-4 pb-4 pt-3"
                                    header={
                                        <ExpandableCardHeader
                                            title={sampleStudent.name}
                                            subtitle={`${sampleStudent.admission_number} • ${sampleStudent.grade.name}`}
                                            badge={<Badge variant="status" value="active" size="sm" />}
                                        />
                                    }
                                >
                                    <ExpandableCardContent>
                                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs text-gray-600">
                                                    {new Date(sampleStudent.date_of_birth).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {sampleStudent.guardian && (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span className="text-xs text-gray-600">
                                                            {sampleStudent.guardian.user.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span className="text-xs text-gray-600">
                                                            {sampleStudent.guardian.phone_number}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </ExpandableCardContent>
                                </ExpandableCard>
                            </SwipeableListItem>
                        </MobileListContainer>

                        {reportGenerated && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    ✓ Report generated successfully!
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Empty State Test */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            4. Empty State
                        </h2>

                        <MobileListContainer
                            isEmpty={true}
                            emptyState={{
                                icon: Users,
                                title: "No students found",
                                message: "Try adjusting your filters or add a new student",
                                action: {
                                    label: "Add Student",
                                    onClick: () => alert('Add student clicked')
                                }
                            }}
                        />
                    </section>

                    {/* MobileListSection Test */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            5. MobileListSection
                        </h2>

                        <MobileListSection
                            title="Recent Students"
                            subtitle="Last 5 students added"
                            action={
                                <button className="text-sm text-blue-600 font-medium">
                                    View All
                                </button>
                            }
                        >
                            <div className="p-4 border-b border-gray-200">
                                <p className="text-sm text-gray-900">Student 1</p>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-900">Student 2</p>
                            </div>
                        </MobileListSection>
                    </section>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                        Testing Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>View on mobile device or resize browser to &lt;768px</li>
                        <li>Swipe left/right on swipeable items</li>
                        <li>Tap to expand/collapse cards</li>
                        <li>Test all action buttons</li>
                        <li>Verify smooth animations</li>
                        <li>Delete this file after testing</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

