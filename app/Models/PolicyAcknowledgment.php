<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolicyAcknowledgment extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'policy_id',
        'user_id',
        'acknowledged_at',
        'ip_address',
        'notes',
    ];

    protected $casts = [
        'acknowledged_at' => 'datetime',
    ];

    // Relationships
    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

