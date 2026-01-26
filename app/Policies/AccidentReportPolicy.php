<?php

namespace App\Policies;

use App\Models\AccidentReport;
use App\Models\User;

class AccidentReportPolicy
{
    /**
     * Determine whether the user can view any accident reports.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view accident reports from their school
        return true;
    }

    /**
     * Determine whether the user can view the accident report.
     */
    public function view(User $user, AccidentReport $accidentReport): bool
    {
        // Users can view reports from their school
        return $user->school_id === $accidentReport->school_id;
    }

    /**
     * Determine whether the user can create accident reports.
     */
    public function create(User $user): bool
    {
        // All staff members can create accident reports
        return in_array($user->role, ['admin', 'teacher', 'nurse', 'receptionist']);
    }

    /**
     * Determine whether the user can update the accident report.
     */
    public function update(User $user, AccidentReport $accidentReport): bool
    {
        // Must be from same school
        if ($user->school_id !== $accidentReport->school_id) {
            return false;
        }

        // Only the reporter or admin can update
        // And only if not yet closed
        return $accidentReport->status !== 'closed' &&
               ($user->id === $accidentReport->reported_by || $user->role === 'admin');
    }

    /**
     * Determine whether the user can review the accident report.
     */
    public function review(User $user, AccidentReport $accidentReport): bool
    {
        // Must be from same school
        if ($user->school_id !== $accidentReport->school_id) {
            return false;
        }

        // Only admins and nurses can review
        return in_array($user->role, ['admin', 'nurse']);
    }

    /**
     * Determine whether the user can delete the accident report.
     */
    public function delete(User $user, AccidentReport $accidentReport): bool
    {
        // Must be from same school
        if ($user->school_id !== $accidentReport->school_id) {
            return false;
        }

        // Only admins can delete
        return $user->role === 'admin';
    }
}

