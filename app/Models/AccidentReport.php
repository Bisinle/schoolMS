<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\BelongsToSchool;

class AccidentReport extends Model
{
    use HasFactory, SoftDeletes, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'report_number',
        'incident_date',
        'incident_time',
        'location',
        'incident_type',
        'severity',
        'people_involved',
        'description',
        'immediate_action_taken',
        'witnesses',
        'medical_attention_required',
        'medical_facility',
        'medical_notes',
        'parent_notified',
        'parent_notified_at',
        'parent_notification_method',
        'follow_up_required',
        'follow_up_notes',
        'follow_up_date',
        'attachments',
        'status',
        'reported_by',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'people_involved' => 'array',
        'witnesses' => 'array',
        'attachments' => 'array',
        'medical_attention_required' => 'boolean',
        'parent_notified' => 'boolean',
        'parent_notified_at' => 'datetime',
        'follow_up_required' => 'boolean',
        'follow_up_date' => 'date',
        'reviewed_at' => 'datetime',
    ];

    // Relationships
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeUnderReview($query)
    {
        return $query->where('status', 'under_review');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeSevere($query)
    {
        return $query->whereIn('severity', ['severe', 'critical']);
    }

    public function scopeNeedsFollowUp($query)
    {
        return $query->where('follow_up_required', true)
                     ->whereNull('follow_up_date')
                     ->orWhere('follow_up_date', '>=', now());
    }

    // Helpers
    public function isSevere(): bool
    {
        return in_array($this->severity, ['severe', 'critical']);
    }

    public function needsFollowUp(): bool
    {
        return $this->follow_up_required && 
               (!$this->follow_up_date || $this->follow_up_date->isFuture());
    }

    // Auto-generate report number
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($report) {
            if (empty($report->report_number)) {
                $year = now()->year;
                $lastReport = static::where('school_id', $report->school_id)
                                   ->whereYear('created_at', $year)
                                   ->orderBy('id', 'desc')
                                   ->first();
                
                $nextNumber = $lastReport ? (int) substr($lastReport->report_number, -3) + 1 : 1;
                $report->report_number = 'ACC-' . $year . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            }
        });
    }
}

