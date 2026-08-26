<?php

namespace App\Policies;

use App\Models\IncidentReport;
use App\Models\User;

class IncidentReportPolicy
{
    /**
     * Determine whether the user can view any incident reports.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('incident-reports.view');
    }

    /**
     * Determine whether the user can view the incident report.
     */
    public function view(User $user, IncidentReport $incidentReport): bool
    {
        return $user->can('incident-reports.view') && $user->school_id === $incidentReport->school_id;
    }

    /**
     * Determine whether the user can create incident reports.
     */
    public function create(User $user): bool
    {
        return $user->can('incident-reports.create');
    }

    /**
     * Determine whether the user can update the incident report.
     *
     * Only the reporter or admin can update, and only if not yet closed.
     */
    public function update(User $user, IncidentReport $incidentReport): bool
    {
        if (! $user->can('incident-reports.update') || $user->school_id !== $incidentReport->school_id) {
            return false;
        }

        return $incidentReport->status !== 'closed' &&
               ($user->id === $incidentReport->reported_by || $user->isAdmin());
    }

    /**
     * Determine whether the user can update the status of the incident report.
     */
    public function updateStatus(User $user, IncidentReport $incidentReport): bool
    {
        return $user->can('incident-reports.review') && $user->school_id === $incidentReport->school_id;
    }

    /**
     * Determine whether the user can delete the incident report.
     */
    public function delete(User $user, IncidentReport $incidentReport): bool
    {
        return $user->can('incident-reports.delete') && $user->school_id === $incidentReport->school_id;
    }
}
