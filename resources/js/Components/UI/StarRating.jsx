import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Uber-style Star Rating Component
 * - Clean, simple star rating (1-5)
 * - Tap/click a star to select rating
 * - All stars up to selected one are filled
 * - Hover preview on desktop
 * - No labels shown (Uber-style)
 */
export default function StarRating({
    value = 0,
    onChange,
    maxStars = 5,
    size = 'lg',
    readOnly = false,
}) {
    const [hoverValue, setHoverValue] = useState(0);

    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-10 h-10',
        xl: 'w-12 h-12',
    };

    const handleClick = (rating) => {
        if (!readOnly && onChange) {
            onChange(rating);
        }
    };

    const handleMouseEnter = (rating) => {
        if (!readOnly) {
            setHoverValue(rating);
        }
    };

    const handleMouseLeave = () => {
        if (!readOnly) {
            setHoverValue(0);
        }
    };

    const displayValue = hoverValue || value;

    return (
        <div className="flex items-center justify-center gap-2">
            {[...Array(maxStars)].map((_, index) => {
                const rating = index + 1;
                const isFilled = rating <= displayValue;

                return (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => handleClick(rating)}
                        onMouseEnter={() => handleMouseEnter(rating)}
                        onMouseLeave={handleMouseLeave}
                        disabled={readOnly}
                        className={`
                            transition-all duration-150 ease-out
                            ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-95 hover:scale-110'}
                            ${isFilled ? 'text-orange' : 'text-gray-300'}
                        `}
                    >
                        <Star
                            className={`${sizeClasses[size]} ${isFilled ? 'fill-current' : ''} transition-all`}
                            strokeWidth={1.5}
                        />
                    </button>
                );
            })}
        </div>
    );
}

