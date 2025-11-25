import { useState, useEffect } from "react";

/**
 * Custom hook to manage impersonation banner visibility with localStorage persistence
 * @param {boolean} isImpersonating - Whether the user is currently impersonating
 * @returns {Object} { visible: boolean, toggle: function }
 */
export const useImpersonationBanner = (isImpersonating) => {
    // Initialize banner visibility from localStorage
    const [visible, setVisible] = useState(() => {
        // Default to true if not in localStorage
        const stored = localStorage.getItem('impersonation_banner_hidden');
        return stored !== 'true';
    });

    // Handle localStorage cleanup when impersonation ends
    useEffect(() => {
        if (!isImpersonating) {
            // When not impersonating, clear the localStorage flag
            localStorage.removeItem('impersonation_banner_hidden');
        }
    }, [isImpersonating]);

    // Handle banner toggle with localStorage persistence
    const toggle = () => {
        const newVisibility = !visible;
        setVisible(newVisibility);

        // Save to localStorage
        if (!newVisibility) {
            localStorage.setItem('impersonation_banner_hidden', 'true');
        } else {
            localStorage.removeItem('impersonation_banner_hidden');
        }
    };

    return { visible, toggle };
};

