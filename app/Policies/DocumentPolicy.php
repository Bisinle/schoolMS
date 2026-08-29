<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine if the user can view any documents.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('documents.view');
    }

    /**
     * Determine if the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        if (! $user->can('documents.view')) {
            return false;
        }

        // Admin can view all documents
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can only view their own documents
        if ($user->isTeacher()) {
            return $document->documentable_type === 'App\Models\Teacher'
                   && $document->documentable_id === $user->teacher->id;
        }

        // Guardians can view their own documents and their children's documents
        if ($user->isGuardian()) {
            // Own documents
            if ($document->documentable_type === 'App\Models\Guardian'
                && $document->documentable_id === $user->guardian->id) {
                return true;
            }

            // Children's documents
            if ($document->documentable_type === 'App\Models\Student') {
                $childIds = $user->guardian->students->pluck('id')->toArray();
                return in_array($document->documentable_id, $childIds);
            }
        }

        // Users (non-role-specific) can view their own documents
        if ($document->documentable_type === 'App\Models\User'
            && $document->documentable_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can create documents.
     */
    public function create(User $user): bool
    {
        return $user->can('documents.create');
    }

    /**
     * Determine if the user can update the document.
     */
    public function update(User $user, Document $document): bool
    {
        return $user->can('documents.update');
    }

    /**
     * Determine if the user can delete the document.
     */
    public function delete(User $user, Document $document): bool
    {
        if (! $user->can('documents.delete')) {
            return false;
        }

        // Admin can delete any document
        if ($user->isAdmin()) {
            return true;
        }

        // Users can delete their own pending/rejected documents
        if ($document->uploaded_by === $user->id
            && in_array($document->status, ['pending', 'rejected'])) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can verify/reject documents.
     *
     * One ability backs both DocumentController::verify() and reject() —
     * both call $this->authorize('verify', $document) — so this must accept
     * either permission, even though the two are separate route-level gates.
     */
    public function verify(User $user, Document $document): bool
    {
        return $user->can('documents.verify') || $user->can('documents.reject');
    }

    /**
     * Determine if the user can download the document.
     */
    public function download(User $user, Document $document): bool
    {
        return $this->view($user, $document);
    }
}
