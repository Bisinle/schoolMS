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
        return $user->can('accident-reports.view');
    }

    /**
     * Determine whether the user can view the accident report.
     */
    public function view(User $user, AccidentReport $accidentReport): bool
    {
        return $user->can('accident-reports.view') && $user->school_id === $accidentReport->school_id;
    }

    /**
     * Determine whether the user can create accident reports.
     */
    public function create(User $user): bool
    {
        return $user->can('accident-reports.create');
    }

    /**
     * Determine whether the user can update the accident report.
     *
     * Only the reporter or admin can update, and only if not yet closed.
     */
    public function update(User $user, AccidentReport $accidentReport): bool
    {
        if (! $user->can('accident-reports.update') || $user->school_id !== $accidentReport->school_id) {
            return false;
        }

        return $accidentReport->status !== 'closed' &&
               ($user->id === $accidentReport->reported_by || $user->isAdmin());
    }

    /**
     * Determine whether the user can review the accident report.
     */
    public function review(User $user, AccidentReport $accidentReport): bool
    {
        return $user->can('accident-reports.review') && $user->school_id === $accidentReport->school_id;
    }

    /**
     * Determine whether the user can delete the accident report.
     */
    public function delete(User $user, AccidentReport $accidentReport): bool
    {
        return $user->can('accident-reports.delete') && $user->school_id === $accidentReport->school_id;
    }
}
