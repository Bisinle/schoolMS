import { CheckCircle2, Circle, Clock, DoorOpen, Calendar, Grid3x3, Eye, Send } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function TimetableSetupGuide({ stats }) {
    const steps = [
        {
            number: 1,
            title: 'Create Time Blocks',
            description: 'Define your school day with atomic time blocks - lessons, breaks, prayers, and activities',
            icon: Clock,
            route: 'timetables.periods.index',
            createRoute: 'timetables.periods.create',
            completed: stats?.periods_count > 0,
            count: stats?.periods_count || 0,
            required: true,
            examples: [
                'Order 1: Period 1 (Lesson 1) - 08:00-08:40',
                'Order 2: Period 2 (Lesson 2) - 08:40-09:20',
                'Order 3: Morning Break - 09:20-09:40',
                'Order 4: Period 3 (Lesson 3) - 09:40-10:20',
            ]
        },
        {
            number: 2,
            title: 'Add Rooms',
            description: 'Register all classrooms, labs, and facilities available for scheduling',
            icon: DoorOpen,
            route: 'timetables.rooms.index',
            createRoute: 'timetables.rooms.create',
            completed: stats?.rooms_count > 0,
            count: stats?.rooms_count || 0,
            required: true,
            examples: [
                'Room 101 - Science Lab',
                'Room 102 - Computer Lab',
                'Room 201 - Classroom',
            ]
        },
        {
            number: 3,
            title: 'Create Timetable Template',
            description: 'Set up a timetable template for a specific grade and academic term',
            icon: Calendar,
            route: 'timetables.templates.index',
            createRoute: 'timetables.templates.create',
            completed: stats?.templates_count > 0,
            count: stats?.templates_count || 0,
            required: true,
            examples: [
                'Grade 1 - Term 1 2024/2025',
                'Grade 2 - Term 1 2024/2025',
            ]
        },
        {
            number: 4,
            title: 'Add Timetable Slots',
            description: 'Fill in the timetable by assigning subjects, teachers, and rooms to time slots',
            icon: Grid3x3,
            route: 'timetables.templates.index',
            createRoute: null,
            completed: stats?.slots_count > 0,
            count: stats?.slots_count || 0,
            required: true,
            note: 'Use Grid View for easier slot management',
            examples: [
                'Monday, Period 1: Math - Mr. Smith - Room 101',
                'Tuesday, Period 2: Science - Ms. Johnson - Lab 1',
            ]
        },
        {
            number: 5,
            title: 'Review & Verify',
            description: 'Check the timetable for conflicts and ensure all slots are properly assigned',
            icon: Eye,
            route: 'timetables.templates.index',
            createRoute: null,
            completed: stats?.published_count > 0,
            count: stats?.published_count || 0,
            required: true,
            examples: [
                'Check for teacher conflicts',
                'Verify room availability',
                'Ensure all periods are filled',
            ]
        },
        {
            number: 6,
            title: 'Publish Timetable',
            description: 'Make the timetable visible to teachers and students',
            icon: Send,
            route: 'timetables.templates.index',
            createRoute: null,
            completed: stats?.published_count > 0,
            count: stats?.published_count || 0,
            required: true,
            note: 'Only published timetables are visible to users',
        }
    ];

    const getStepStatus = (step, index) => {
        if (step.completed) return 'completed';
        if (index === 0) return 'current';
        if (steps[index - 1]?.completed) return 'current';
        return 'pending';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    Timetable Setup Guide
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                    Follow these steps to create and publish a complete timetable for your school
                </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {steps.map((step, index) => {
                    const status = getStepStatus(step, index);
                    const Icon = step.icon;

                    return (
                        <div
                            key={step.number}
                            className={`relative border rounded-lg p-3 sm:p-4 transition-all ${
                                status === 'completed'
                                    ? 'bg-green-50 border-green-200'
                                    : status === 'current'
                                    ? 'bg-orange-50 border-orange-300 shadow-sm'
                                    : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-start gap-3 sm:gap-4">
                                {/* Step Number/Status */}
                                <div className="flex-shrink-0">
                                    {status === 'completed' ? (
                                        <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                                    ) : (
                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${
                                            status === 'current'
                                                ? 'bg-orange text-white'
                                                : 'bg-gray-300 text-gray-600'
                                        }`}>
                                            {step.number}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-2">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                                                status === 'completed' ? 'text-green-600' :
                                                status === 'current' ? 'text-orange' :
                                                'text-gray-400'
                                            }`} />
                                            <h4 className="text-sm sm:text-base font-semibold text-gray-900">
                                                {step.title}
                                            </h4>
                                            {step.required && (
                                                <span className="text-xs text-red-600">*Required</span>
                                            )}
                                        </div>
                                        {step.count > 0 && (
                                            <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                                                {step.count} created
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                        {step.description}
                                    </p>

                                    {step.note && (
                                        <div className="mb-2 sm:mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                            💡 {step.note}
                                        </div>
                                    )}

                                    {step.examples && (
                                        <div className="mb-2 sm:mb-3">
                                            <p className="text-xs font-medium text-gray-700 mb-1">Examples:</p>
                                            <ul className="text-xs text-gray-600 space-y-0.5 sm:space-y-1">
                                                {step.examples.map((example, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <Circle className="w-2 h-2 fill-current flex-shrink-0 mt-1" />
                                                        <span className="flex-1">{example}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {step.createRoute && (
                                            <Link
                                                href={route(step.createRoute)}
                                                className={`inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all active:scale-95 ${
                                                    status === 'current'
                                                        ? 'bg-orange text-white hover:bg-orange-600'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {status === 'completed' ? 'Add More' : 'Create Now'}
                                            </Link>
                                        )}
                                        <Link
                                            href={route(step.route)}
                                            className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                                        >
                                            View All
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className={`absolute left-5 sm:left-8 top-full w-0.5 h-3 sm:h-4 -mb-3 sm:-mb-4 ${
                                    status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Progress Summary */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Overall Progress</p>
                        <p className="text-xs text-gray-500">
                            {steps.filter(s => s.completed).length} of {steps.length} steps completed
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-1 sm:flex-none sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange transition-all duration-500"
                                style={{
                                    width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%`
                                }}
                            />
                        </div>
                        <span className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">
                            {Math.round((steps.filter(s => s.completed).length / steps.length) * 100)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

