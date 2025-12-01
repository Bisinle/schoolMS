<?php

namespace App\Policies;

use App\Models\User;
use App\Models\GuardianInvoice;

class GuardianInvoicePolicy
{
    /**
     * Determine if the user can view any invoices.
     */
    public function viewAny(User $user): bool
    {
        // Admins, teachers, and guardians can view invoices
        return in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine if the user can view the invoice.
     */
    public function view(User $user, GuardianInvoice $invoice): bool
    {
        // Admins can view all invoices
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can view all invoices (for reference)
        if ($user->isTeacher()) {
            return true;
        }

        // Guardians can ONLY view their own invoices
        if ($user->isGuardian()) {
            return $user->guardian && $user->guardian->id === $invoice->guardian_id;
        }

        return false;
    }

    /**
     * Determine if the user can create invoices.
     */
    public function create(User $user): bool
    {
        // Only admins can create invoices
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the invoice.
     */
    public function update(User $user, GuardianInvoice $invoice): bool
    {
        // Only admins can update invoices
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the invoice.
     */
    public function delete(User $user, GuardianInvoice $invoice): bool
    {
        // Only admins can delete invoices
        return $user->isAdmin();
    }
}

