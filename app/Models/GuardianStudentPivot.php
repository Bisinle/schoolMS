<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Pivot model for the guardian_student table.
 *
 * Plain belongsToMany()->withPivot() does not cast pivot column types
 * (Eloquent only applies $casts through a Pivot model), so without this,
 * is_primary comes back as a raw DB integer (0/1) instead of a PHP boolean
 * when serialized to JSON/Inertia props. Consumers of the guardians.*.pivot
 * shape (e.g. DocumentController's documentable payload) rely on
 * is_primary being a real boolean.
 */
class GuardianStudentPivot extends Pivot
{
    protected $casts = [
        'is_primary' => 'boolean',
    ];
}
