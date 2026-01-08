import { useState } from 'react';

export default function Avatar({
    name,
    imagePath = null,
    size = 'md',
    className = ''
}) {
    const [imageError, setImageError] = useState(false);

    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-12 h-12 text-base',
        lg: 'w-16 h-16 text-lg',
        xl: 'w-24 h-24 text-2xl',
        '2xl': 'w-32 h-32 text-3xl',
    };

    // Generate initials from name
    const getInitials = (fullName) => {
        if (!fullName) return '?';

        const names = fullName.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }

        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    // Generate consistent color based on name
    const getColorClass = (fullName) => {
        if (!fullName) return 'bg-gray-500';

        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500',
        ];

        const charCode = fullName.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const initials = getInitials(name);
    const colorClass = getColorClass(name);
    const sizeClass = sizes[size] || sizes.md;

    // Show initials if no image path or if image failed to load
    if (!imagePath || imageError) {
        return (
            <div
                className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-bold ${className}`}
            >
                {initials}
            </div>
        );
    }

    // Show image with error handling
    return (
        <img
            src={`/storage/${imagePath}`}
            alt={name || 'User'}
            className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 ${className}`}
            onError={() => setImageError(true)}
        />
    );
}

