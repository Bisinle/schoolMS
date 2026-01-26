<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\BelongsToSchool;

class IncidentReport extends Model
{
    use HasFactory, SoftDeletes, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'report_number',
        'title',
        'incident_date',
        'incident_time',
        'location',
        'incident_type',
        'severity',
        'students_involved',
        'staff_involved',
        'description',
        'action_taken',
        'disciplinary_action',
        'parent_contacted',
        'parent_contacted_at',
        'police_involved',
        'police_report_number',
        'status',
        'resolution',
        'resolved_date',
        'reported_by',
        'handled_by',
        'attachments',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'students_involved' => 'array',
        'staff_involved' => 'array',
        'parent_contacted' => 'boolean',
        'parent_contacted_at' => 'datetime',
        'police_involved' => 'boolean',
        'resolved_date' => 'date',
        'attachments' => 'array',
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

    public function handler()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function students()
    {
        // Get students by IDs from students_involved array
        if (empty($this->students_involved)) {
            return collect();
        }
        
        return Student::whereIn('id', $this->students_involved)->get();
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeInvestigating($query)
    {
        return $query->where('status', 'investigating');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeSevere($query)
    {
        return $query->whereIn('severity', ['severe', 'critical']);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('incident_type', $type);
    }

    // Helpers
    public function isSevere(): bool
    {
        return in_array($this->severity, ['severe', 'critical']);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'investigating']);
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
                $report->report_number = 'INC-' . $year . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            }
        });
    }
}

