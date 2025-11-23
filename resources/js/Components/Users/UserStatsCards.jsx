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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-3 md:p-6 hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 truncate">
                                    {card.title}
                                </p>
                                <p className="text-xl md:text-3xl font-bold text-navy">
                                    {card.value}
                                </p>
                            </div>
                            <div className={`${card.bgLight} p-2 md:p-3 rounded-lg self-end md:self-auto`}>
                                <Icon className={`w-5 h-5 md:w-8 md:h-8 ${card.textColor}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}