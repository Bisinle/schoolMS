import React from 'react';

/**
 * Avatar Component
 * 
 * A reusable avatar component that displays user profile images or initials.
 * Falls back to initials when no image is provided.
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.name - User's name (used for initials fallback)
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl', '2xl' (default: 'md')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.color - Background color for initials: 'orange', 'navy', 'blue', 'green', etc. (default: 'orange')
 * @param {string} props.shape - Shape variant: 'circle', 'rounded', 'square' (default: 'circle')
 * @param {string} props.alt - Alt text for image (defaults to name)
 * @param {boolean} props.border - Whether to show border (default: false)
 * 
 * @example
 * <Avatar src="/images/user.jpg" name="John Doe" size="lg" />
 * <Avatar name="Jane Smith" size="md" color="navy" />
 */
export default function Avatar({
    src,
    name = '',
    size = 'md',
    className = '',
    color = 'orange',
    shape = 'circle',
    alt,
    border = false,
}) {
    // Get initials from name
    const getInitials = () => {
        if (!name) return '?';
        
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Get size classes
    const getSizeClasses = () => {
        const sizes = {
            xs: {
                container: 'w-6 h-6',
                text: 'text-xs',
            },
            sm: {
                container: 'w-8 h-8',
                text: 'text-sm',
            },
            md: {
                container: 'w-10 h-10',
                text: 'text-base',
            },
            lg: {
                container: 'w-12 h-12',
                text: 'text-lg',
            },
            xl: {
                container: 'w-16 h-16',
                text: 'text-xl',
            },
            '2xl': {
                container: 'w-20 h-20 sm:w-24 sm:h-24',
                text: 'text-2xl sm:text-3xl',
            },
        };
        return sizes[size] || sizes.md;
    };

    // Get shape classes
    const getShapeClasses = () => {
        const shapes = {
            circle: 'rounded-full',
            rounded: 'rounded-lg',
            square: 'rounded-none',
        };
        return shapes[shape] || shapes.circle;
    };

    // Get color classes
    const getColorClasses = () => {
        const colors = {
            orange: 'bg-orange text-white',
            navy: 'bg-navy text-white',
            blue: 'bg-blue-500 text-white',
            green: 'bg-green-500 text-white',
            purple: 'bg-purple-500 text-white',
            red: 'bg-red-500 text-white',
            indigo: 'bg-indigo-500 text-white',
            pink: 'bg-pink-500 text-white',
            gray: 'bg-gray-500 text-white',
            gradient: 'bg-gradient-to-br from-orange-500 to-red-600 text-white',
        };
        return colors[color] || colors.orange;
    };

    const sizeClasses = getSizeClasses();
    const shapeClasses = getShapeClasses();
    const colorClasses = getColorClasses();
    const borderClasses = border ? 'ring-2 ring-white shadow-md' : '';

    return (
        <div 
            className={`${sizeClasses.container} ${shapeClasses} ${borderClasses} flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt || name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add(colorClasses);
                        e.target.parentElement.innerHTML = `<span class="font-bold ${sizeClasses.text}">${getInitials()}</span>`;
                    }}
                />
            ) : (
                <span className={`font-bold ${sizeClasses.text} ${colorClasses} w-full h-full flex items-center justify-center`}>
                    {getInitials()}
                </span>
            )}
        </div>
    );
}

