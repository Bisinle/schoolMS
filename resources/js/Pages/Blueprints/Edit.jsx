import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { TextInput, SelectInput, TextareaInput, FormSection, FormActions } from '@/Components/Forms';
import { PlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function BlueprintsEdit({ auth, blueprint, levels, periodTypes, priorityBands }) {
    const { data, setData, put, processing, errors } = useForm({
        level: blueprint.level,
        name: blueprint.name,
        start_time: blueprint.start_time.substring(0, 5), // HH:mm format
        end_time: blueprint.end_time.substring(0, 5),
        description: blueprint.description || '',
        is_active: blueprint.is_active,
        periods: blueprint.periods.map(p => ({
            period_type: p.period_type,
            duration_minutes: p.duration_minutes,
            priority_band: p.priority_band || 'neutral'
        })),
    });

    const [calculatedTimes, setCalculatedTimes] = useState([]);

    // Calculate period times whenever periods or start_time changes
    useEffect(() => {
        const times = [];
        let currentTime = data.start_time;
        
        data.periods.forEach((period) => {
            const [hours, minutes] = currentTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + parseInt(period.duration_minutes);
            
            const endHours = Math.floor(endMinutes / 60);
            const endMins = endMinutes % 60;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
            
            times.push({
                start: currentTime,
                end: endTime
            });
            
            currentTime = endTime;
        });
        
        setCalculatedTimes(times);
    }, [data.periods, data.start_time]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/blueprints/${blueprint.id}`);
    };

    const addPeriod = () => {
        setData('periods', [
            ...data.periods,
            { period_type: 'lesson', duration_minutes: 40, priority_band: 'neutral' }
        ]);
    };

    const removePeriod = (index) => {
        const newPeriods = data.periods.filter((_, i) => i !== index);
        setData('periods', newPeriods);
    };

    const updatePeriod = (index, field, value) => {
        const newPeriods = [...data.periods];
        newPeriods[index][field] = value;
        
        // Clear priority_band if not a lesson
        if (field === 'period_type' && value !== 'lesson') {
            newPeriods[index].priority_band = null;
        }
        
        setData('periods', newPeriods);
    };

    const getTotalDuration = () => {
        return data.periods.reduce((sum, period) => sum + parseInt(period.duration_minutes || 0), 0);
    };

    const getAvailableMinutes = () => {
        if (!data.start_time || !data.end_time) return 0;
        const [startHours, startMins] = data.start_time.split(':').map(Number);
        const [endHours, endMins] = data.end_time.split(':').map(Number);
        const startMinutes = startHours * 60 + startMins;
        const endMinutes = endHours * 60 + endMins;
        return endMinutes - startMinutes;
    };

    const isOverTime = () => {
        return getTotalDuration() > getAvailableMinutes();
    };

    const getLessonCount = () => {
        return data.periods.filter(p => p.period_type === 'lesson').length;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Edit ${blueprint.name}`} />

            <div className="py-6 sm:py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/blueprints"
                            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
                        >
                            ← Back to Blueprints
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-navy">Edit Blueprint</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Update the daily schedule structure for {levels[blueprint.level]}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Global Error Message */}
                        {isOverTime() && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-bold text-red-800">
                                            Cannot Save: Time Limit Exceeded
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>
                                                Total period duration is <strong>{getTotalDuration()} minutes</strong>, but only <strong>{getAvailableMinutes()} minutes</strong> are available between {data.start_time} and {data.end_time}.
                                            </p>
                                            <p className="mt-1 font-medium">
                                                Please reduce period durations by <strong>{getTotalDuration() - getAvailableMinutes()} minutes</strong> or extend the school end time.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-navy to-navy-light px-6 py-4">
                                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <SelectInput
                                    label="School Level"
                                    name="level"
                                    value={data.level}
                                    onChange={(e) => setData('level', e.target.value)}
                                    options={Object.entries(levels).map(([value, label]) => ({ value, label }))}
                                    error={errors.level}
                                    required
                                    showPlaceholder={false}
                                />

                                <TextInput
                                    label="Blueprint Name"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                    placeholder="e.g., Standard Day Schedule, Extended Day"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput
                                        label="School Start Time"
                                        name="start_time"
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        error={errors.start_time}
                                        required
                                    />

                                    <TextInput
                                        label="School End Time"
                                        name="end_time"
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        error={errors.end_time}
                                        required
                                    />
                                </div>

                                <TextareaInput
                                    label="Description"
                                    name="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    error={errors.description}
                                    placeholder="Optional description of this blueprint"
                                    rows={3}
                                />

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 text-orange focus:ring-orange border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                        Set as active blueprint for this level
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Period Builder */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-navy to-navy-light px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white">Period Structure</h2>
                                    <div className="text-sm text-white/90">
                                        {getLessonCount()} lessons • {data.periods.length} total periods • {getTotalDuration()} / {getAvailableMinutes()} minutes
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Time Validation Warning */}
                                {isOverTime() && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Total duration exceeds available time
                                                </h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <p>
                                                        Your periods total <strong>{getTotalDuration()} minutes</strong> but only <strong>{getAvailableMinutes()} minutes</strong> are available between {data.start_time} and {data.end_time}.
                                                        Please reduce period durations or extend the school day.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {errors.periods && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-700">{errors.periods}</p>
                                    </div>
                                )}
                                {data.periods.map((period, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-navy text-white text-sm font-semibold">
                                                    {index + 1}
                                                </span>
                                                {calculatedTimes[index] && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <ClockIcon className="w-4 h-4 mr-1" />
                                                        {calculatedTimes[index].start} - {calculatedTimes[index].end}
                                                    </div>
                                                )}
                                            </div>
                                            {data.periods.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePeriod(index)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Period Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={period.period_type}
                                                    onChange={(e) => updatePeriod(index, 'period_type', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                                >
                                                    {Object.entries(periodTypes).map(([value, label]) => (
                                                        <option key={value} value={value}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Duration (minutes) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="5"
                                                    max="120"
                                                    value={period.duration_minutes}
                                                    onChange={(e) => updatePeriod(index, 'duration_minutes', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                                />
                                            </div>

                                            {period.period_type === 'lesson' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Priority Band
                                                    </label>
                                                    <select
                                                        value={period.priority_band || 'neutral'}
                                                        onChange={(e) => updatePeriod(index, 'priority_band', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                                    >
                                                        {Object.entries(priorityBands).map(([value, label]) => (
                                                            <option key={value} value={value}>{label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {errors.periods && (
                                    <p className="text-sm text-red-600">{errors.periods}</p>
                                )}

                                <button
                                    type="button"
                                    onClick={addPeriod}
                                    className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange hover:text-orange transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                    Add Period
                                </button>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <FormActions
                            submitLabel="Update Blueprint"
                            cancelHref="/blueprints"
                            processing={processing}
                            canSubmit={!isOverTime()}
                        />
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
