<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'log_type',
        'user_id',
        'causer_id',
        'description',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function causer()
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    // Helper method to create log
    public static function createLog(
        string $logType,
        int $userId,
        ?int $causerId,
        string $description,
        ?array $properties = null
    ): self {
        return self::create([
            'log_type' => $logType,
            'user_id' => $userId,
            'causer_id' => $causerId,
            'description' => $description,
            'properties' => $properties,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}