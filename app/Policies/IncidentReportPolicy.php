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
        // All authenticated users can view incident reports from their school
        return true;
    }

    /**
     * Determine whether the user can view the incident report.
     */
    public function view(User $user, IncidentReport $incidentReport): bool
    {
        // Users can view reports from their school
        return $user->school_id === $incidentReport->school_id;
    }

    /**
     * Determine whether the user can create incident reports.
     */
    public function create(User $user): bool
    {
        // All staff members can create incident reports
        return in_array($user->role, ['admin', 'teacher', 'nurse', 'receptionist']);
    }

    /**
     * Determine whether the user can update the incident report.
     */
    public function update(User $user, IncidentReport $incidentReport): bool
    {
        // Must be from same school
        if ($user->school_id !== $incidentReport->school_id) {
            return false;
        }

        // Only the reporter or admin can update
        // And only if not yet closed
        return $incidentReport->status !== 'closed' && 
               ($user->id === $incidentReport->reported_by || $user->role === 'admin');
    }

    /**
     * Determine whether the user can update the status of the incident report.
     */
    public function updateStatus(User $user, IncidentReport $incidentReport): bool
    {
        // Must be from same school
        if ($user->school_id !== $incidentReport->school_id) {
            return false;
        }

        // Only admins and those who can handle incidents can update status
        return in_array($user->role, ['admin', 'teacher']);
    }

    /**
     * Determine whether the user can delete the incident report.
     */
    public function delete(User $user, IncidentReport $incidentReport): bool
    {
        // Must be from same school
        if ($user->school_id !== $incidentReport->school_id) {
            return false;
        }

        // Only admins can delete
        return $user->role === 'admin';
    }
}

