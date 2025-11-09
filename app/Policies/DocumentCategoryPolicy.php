<?php

namespace App\Policies;

use App\Models\DocumentCategory;
use App\Models\User;

class DocumentCategoryPolicy
{
    /**
     * Determine if the user can view any document categories.
     */
    public function viewAny(User $user): bool
    {
        // Admin can view categories, teachers/guardians can view active categories
        return $user->isAdmin() || $user->isTeacher() || $user->isGuardian();
    }

    /**
     * Determine if the user can view the document category.
     */
    public function view(User $user, DocumentCategory $category): bool
    {
        return $user->isAdmin() || $user->isTeacher() || $user->isGuardian();
    }

    /**
     * Determine if the user can create document categories.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the document category.
     */
    public function update(User $user, DocumentCategory $category): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the document category.
     */
    public function delete(User $user, DocumentCategory $category): bool
    {
        // Admin can delete if no documents are using this category
        return $user->isAdmin() && $category->documents()->count() === 0;
    }
}