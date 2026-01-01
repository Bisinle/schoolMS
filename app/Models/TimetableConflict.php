<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class TimetableConflict extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'timetable_template_id',
        'slot_id_1',
        'slot_id_2',
        'conflict_type',
        'description',
        'severity',
        'status',
        'resolution_notes',
        'resolved_by',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    // Relationships
    public function timetableTemplate()
    {
        return $this->belongsTo(TimetableTemplate::class);
    }

    public function slot1()
    {
        return $this->belongsTo(TimetableSlot::class, 'slot_id_1');
    }

    public function slot2()
    {
        return $this->belongsTo(TimetableSlot::class, 'slot_id_2');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    // Scopes
    public function scopeDetected($query)
    {
        return $query->where('status', 'detected');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeUnresolved($query)
    {
        return $query->whereIn('status', ['detected', 'acknowledged']);
    }

    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical');
    }

    public function scopeHigh($query)
    {
        return $query->where('severity', 'high');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('conflict_type', $type);
    }

    public function scopeForTimetable($query, $timetableId)
    {
        return $query->where('timetable_template_id', $timetableId);
    }

    // Helper methods
    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }

    public function isDetected(): bool
    {
        return $this->status === 'detected';
    }

    public function isCritical(): bool
    {
        return $this->severity === 'critical';
    }

    public function isHigh(): bool
    {
        return $this->severity === 'high';
    }

    public function resolve(User $user, ?string $notes = null): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_by' => $user->id,
            'resolved_at' => now(),
            'resolution_notes' => $notes,
        ]);
    }

    public function ignore(?string $notes = null): void
    {
        $this->update([
            'status' => 'ignored',
            'resolution_notes' => $notes,
        ]);
    }

    public function acknowledge(): void
    {
        if ($this->status === 'detected') {
            $this->update(['status' => 'acknowledged']);
        }
    }
}

