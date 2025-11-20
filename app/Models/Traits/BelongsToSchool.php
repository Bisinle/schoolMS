<?php

namespace App\Models\Traits;

use App\Models\School;
use App\Models\Scopes\SchoolScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait BelongsToSchool
{
    /**
     * Boot the trait.
     */
    protected static function bootBelongsToSchool(): void
    {
        // Add global scope to filter by school_id
        static::addGlobalScope(new SchoolScope);

        // Automatically set school_id when creating a new record
        static::creating(function ($model) {
            if (Auth::check() && !$model->school_id) {
                // Get school_id directly from database to avoid circular reference
                $userId = Auth::id();
                $schoolId = DB::table('users')
                    ->where('id', $userId)
                    ->value('school_id');

                if ($schoolId) {
                    $model->school_id = $schoolId;
                }
            }
        });
    }

    /**
     * Get the school that owns the model.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}

