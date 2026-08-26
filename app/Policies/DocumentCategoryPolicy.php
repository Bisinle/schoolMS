<?php

namespace App\Policies;

use App\Models\DocumentCategory;
use App\Models\User;

class DocumentCategoryPolicy
{
    /**
     * Determine if the user can view any document categories.
     *
     * Teacher/guardian branch dropped here (2026-08-26, Phase 5) per the
     * decision on Phase 2 disagreement #9: dead grant, no route ever
     * reached it, same precedent as disagreements #2/#3.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('document-categories.view');
    }

    /**
     * Determine if the user can view the document category.
     */
    public function view(User $user, DocumentCategory $category): bool
    {
        return $user->can('document-categories.view');
    }

    /**
     * Determine if the user can create document categories.
     */
    public function create(User $user): bool
    {
        return $user->can('document-categories.manage');
    }

    /**
     * Determine if the user can update the document category.
     */
    public function update(User $user, DocumentCategory $category): bool
    {
        return $user->can('document-categories.manage');
    }

    /**
     * Determine if the user can delete the document category.
     */
    public function delete(User $user, DocumentCategory $category): bool
    {
        // Admin can delete if no documents are using this category
        return $user->can('document-categories.manage') && $category->documents()->count() === 0;
    }
}
