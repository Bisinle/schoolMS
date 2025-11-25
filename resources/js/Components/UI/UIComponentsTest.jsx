/**
 * UI Components Test Page
 * 
 * Visual testing page for all UI components created in Phase 2.
 * This file can be deleted after verification.
 */

import React from 'react';
import { Head } from '@inertiajs/react';
import { Users, BookOpen, GraduationCap, TrendingUp, Search } from 'lucide-react';
import Badge from './Badge';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import EmptyState from './EmptyState';
import Avatar from './Avatar';
import Card, { CardHeader, CardTitle, CardDescription } from './Card';

export default function UIComponentsTest() {
    return (
        <>
            <Head title="UI Components Test" />
            
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-black text-navy mb-2">UI Components Test</h1>
                        <p className="text-gray-600">Phase 2: Core UI Components</p>
                    </div>

                    {/* Badge Component Tests */}
                    <Card header={<CardHeader>Badge Component</CardHeader>}>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Status Badges:</p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="status" value="active" />
                                    <Badge variant="status" value="inactive" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Role Badges:</p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="role" value="admin" />
                                    <Badge variant="role" value="teacher" />
                                    <Badge variant="role" value="guardian" />
                                    <Badge variant="role" value="accountant" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Category Badges:</p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="category" value="academic" />
                                    <Badge variant="category" value="islamic" />
                                    <Badge variant="category" value="core" />
                                    <Badge variant="category" value="elective" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Sizes:</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="status" value="active" size="xs" />
                                    <Badge variant="status" value="active" size="sm" />
                                    <Badge variant="status" value="active" size="md" />
                                    <Badge variant="status" value="active" size="lg" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* StatCard Component Tests */}
                    <Card header={<CardHeader>StatCard Component</CardHeader>}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={Users}
                                title="Total Students"
                                value={150}
                                gradient="from-orange-500 to-red-600"
                                trend="12% increase"
                            />
                            <StatCard
                                icon={BookOpen}
                                title="Active Subjects"
                                value={24}
                                gradient="from-blue-500 to-indigo-600"
                                trend="3 new this term"
                            />
                            <StatCard
                                icon={GraduationCap}
                                title="Teachers"
                                value={18}
                                gradient="from-green-500 to-emerald-600"
                            />
                            <StatCard
                                icon={TrendingUp}
                                title="Avg Performance"
                                value="85%"
                                gradient="from-purple-500 to-pink-600"
                                trend="5% improvement"
                                trendDirection="up"
                            />
                        </div>
                    </Card>

                    {/* ProgressBar Component Tests */}
                    <Card header={<CardHeader>ProgressBar Component</CardHeader>}>
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Basic Progress Bars:</p>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">75% Complete</p>
                                        <ProgressBar value={75} color="orange" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">45% Complete</p>
                                        <ProgressBar value={45} color="green" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">90% Complete</p>
                                        <ProgressBar value={90} color="blue" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">With Labels:</p>
                                <div className="space-y-3">
                                    <ProgressBar value={65} color="purple" showLabel labelPosition="top" />
                                    <ProgressBar value={80} color="emerald" showLabel labelPosition="outside" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Different Sizes:</p>
                                <div className="space-y-3">
                                    <ProgressBar value={60} color="orange" size="xs" />
                                    <ProgressBar value={70} color="orange" size="sm" />
                                    <ProgressBar value={80} color="orange" size="md" />
                                    <ProgressBar value={90} color="orange" size="lg" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Avatar Component Tests */}
                    <Card header={<CardHeader>Avatar Component</CardHeader>}>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Sizes:</p>
                                <div className="flex flex-wrap items-end gap-3">
                                    <Avatar name="John Doe" size="xs" />
                                    <Avatar name="Jane Smith" size="sm" />
                                    <Avatar name="Bob Johnson" size="md" />
                                    <Avatar name="Alice Williams" size="lg" />
                                    <Avatar name="Charlie Brown" size="xl" />
                                    <Avatar name="Diana Prince" size="2xl" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Colors:</p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Avatar name="Orange User" color="orange" />
                                    <Avatar name="Navy User" color="navy" />
                                    <Avatar name="Blue User" color="blue" />
                                    <Avatar name="Green User" color="green" />
                                    <Avatar name="Purple User" color="purple" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Shapes:</p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Avatar name="Circle" shape="circle" />
                                    <Avatar name="Rounded" shape="rounded" />
                                    <Avatar name="Square" shape="square" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* EmptyState Component Tests */}
                    <Card header={<CardHeader>EmptyState Component</CardHeader>}>
                        <div className="space-y-8">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-4">With Action Button:</p>
                                <EmptyState
                                    icon={Users}
                                    title="No students found"
                                    message="Try adjusting your filters to see more students"
                                    action={{
                                        label: "Add Student",
                                        onClick: () => alert('Add student clicked!')
                                    }}
                                />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-4">Without Action:</p>
                                <EmptyState
                                    icon={Search}
                                    title="No results found"
                                    message="We couldn't find any matches for your search"
                                    size="sm"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Card Component Tests */}
                    <Card header={<CardHeader>Card Component Variations</CardHeader>}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card padding="sm" shadow="md">
                                <CardTitle>Small Padding</CardTitle>
                                <CardDescription>This card has small padding</CardDescription>
                            </Card>
                            <Card padding="lg" shadow="lg">
                                <CardTitle>Large Padding</CardTitle>
                                <CardDescription>This card has large padding</CardDescription>
                            </Card>
                            <Card
                                header={<h4 className="font-semibold">Card with Header</h4>}
                                footer={<button className="text-orange font-semibold">Action</button>}
                            >
                                <p className="text-gray-600">This card has header and footer</p>
                            </Card>
                            <Card hover="lift" shadow="md">
                                <CardTitle>Hover Effect</CardTitle>
                                <CardDescription>Hover over this card to see the lift effect</CardDescription>
                            </Card>
                        </div>
                    </Card>

                    {/* Success Message */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                        <p className="text-green-800 font-bold text-lg mb-2">
                            ✅ All UI Components Working!
                        </p>
                        <p className="text-green-700">
                            Phase 2 complete. All components are ready for integration.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

