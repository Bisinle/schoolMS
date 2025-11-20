<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SchoolScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Skip scope for the School model itself to avoid recursion
        if ($model instanceof \App\Models\School) {
            return;
        }

        // Only apply if user is authenticated
        if (Auth::check()) {
            $schoolId = $this->getSchoolId();

            if ($schoolId) {
                $builder->where($model->getTable() . '.school_id', $schoolId);
            }
        }
    }

    /**
     * Get the authenticated user's school_id without triggering the scope
     */
    protected function getSchoolId(): ?int
    {
        static $schoolId = null;

        // Cache the school_id to avoid multiple DB queries
        if ($schoolId === null) {
            $userId = Auth::id();

            if ($userId) {
                // Use raw query to avoid triggering scopes
                $schoolId = DB::table('users')
                    ->where('id', $userId)
                    ->value('school_id');
            }
        }

        return $schoolId;
    }
}

