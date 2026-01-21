<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolicyRevision extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'policy_id',
        'revised_by',
        'version',
        'content',
        'revision_notes',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // Relationships
    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }

    public function revisor()
    {
        return $this->belongsTo(User::class, 'revised_by');
    }
}

