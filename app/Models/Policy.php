<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\Traits\BelongsToSchool;

class Policy extends Model
{
    use HasFactory, SoftDeletes, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'title',
        'slug',
        'type',
        'policy_number',
        'content',
        'summary',
        'version',
        'supersedes_policy_id',
        'effective_date',
        'review_date',
        'requires_acknowledgment',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'published_at',
        'tags',
        'view_count',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'review_date' => 'date',
        'requires_acknowledgment' => 'boolean',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
        'tags' => 'array',
        'view_count' => 'integer',
    ];

    // Relationships
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function supersededPolicy()
    {
        return $this->belongsTo(Policy::class, 'supersedes_policy_id');
    }

    public function newerVersions()
    {
        return $this->hasMany(Policy::class, 'supersedes_policy_id');
    }

    public function acknowledgments()
    {
        return $this->hasMany(PolicyAcknowledgment::class);
    }

    public function revisions()
    {
        return $this->hasMany(PolicyRevision::class);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeEffective($query)
    {
        return $query->where('status', 'published')
                     ->where(function ($q) {
                         $q->whereNull('effective_date')
                           ->orWhere('effective_date', '<=', now());
                     });
    }

    public function scopeNeedsReview($query)
    {
        return $query->whereNotNull('review_date')
                     ->where('review_date', '<=', now())
                     ->where('status', 'published');
    }

    // Helpers
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function needsReview(): bool
    {
        return $this->review_date && $this->review_date->isPast();
    }

    public function hasBeenAcknowledgedBy(User $user): bool
    {
        return $this->acknowledgments()
                    ->where('user_id', $user->id)
                    ->exists();
    }

    public function getAcknowledgmentRate(): float
    {
        if (!$this->requires_acknowledgment) {
            return 0;
        }

        $totalUsers = User::where('school_id', $this->school_id)
                         ->where('is_active', true)
                         ->count();

        if ($totalUsers === 0) {
            return 0;
        }

        $acknowledgedCount = $this->acknowledgments()->count();

        return ($acknowledgedCount / $totalUsers) * 100;
    }

    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    // Auto-generate slug and policy number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($policy) {
            if (empty($policy->slug)) {
                $policy->slug = Str::slug($policy->title);
            }
        });
    }
}

