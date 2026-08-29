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
        return $user->can('fees.manage') || $user->can('fees.view-own-invoices');
    }

    /**
     * Determine if the user can view the invoice.
     *
     * The old teacher-can-view-any-invoice branch was dropped here (2026-08-26,
     * Phase 5) — no route ever let a teacher reach an action that checks this
     * ability (neither the admin /invoices routes nor the guardian
     * /guardian/invoices routes include teacher), so it was a dead grant, same
     * pattern as the disagreements #2/#3/#9 precedent.
     */
    public function view(User $user, GuardianInvoice $invoice): bool
    {
        if ($user->can('fees.manage')) {
            return true;
        }

        if ($user->can('fees.view-own-invoices')) {
            return $user->guardian && $user->guardian->id === $invoice->guardian_id;
        }

        return false;
    }

    /**
     * Determine if the user can create invoices.
     */
    public function create(User $user): bool
    {
        return $user->can('fees.manage');
    }

    /**
     * Determine if the user can update the invoice.
     */
    public function update(User $user, GuardianInvoice $invoice): bool
    {
        return $user->can('fees.manage');
    }

    /**
     * Determine if the user can delete the invoice.
     */
    public function delete(User $user, GuardianInvoice $invoice): bool
    {
        return $user->can('fees.manage');
    }
}
