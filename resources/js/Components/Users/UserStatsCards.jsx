import { Users, UserCheck, UserX, UserCog } from 'lucide-react';

export default function UserStatsCards({ stats }) {
    const cards = [
        {
            title: 'Total Users',
            value: stats.total,
            icon: Users,
            color: 'bg-blue-500',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600',
        },
        {
            title: 'Active Users',
            value: stats.active,
            icon: UserCheck,
            color: 'bg-green-500',
            bgLight: 'bg-green-50',
            textColor: 'text-green-600',
        },
        {
            title: 'Inactive Users',
            value: stats.inactive,
            icon: UserX,
            color: 'bg-red-500',
            bgLight: 'bg-red-50',
            textColor: 'text-red-600',
        },
        {
            title: 'Administrators',
            value: stats.by_role?.admin || 0,
            icon: UserCog,
            color: 'bg-orange',
            bgLight: 'bg-orange-50',
            textColor: 'text-orange',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    {card.title}
                                </p>
                                <p className="text-3xl font-bold text-navy">
                                    {card.value}
                                </p>
                            </div>
                            <div className={`${card.bgLight} p-3 rounded-lg`}>
                                <Icon className={`w-8 h-8 ${card.textColor}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}