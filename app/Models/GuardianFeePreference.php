<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class GuardianFeePreference extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'student_id',
        'academic_term_id',
        'tuition_type',
        'transport_route_id',
        'transport_type',
        'include_food',
        'include_sports',
        'notes',
        'updated_by',
        'previous_values',
    ];

    protected function casts(): array
    {
        return [
            'include_food' => 'boolean',
            'include_sports' => 'boolean',
            'previous_values' => 'array',
        ];
    }

    // Tuition type constants
    public const TUITION_FULL_DAY = 'full_day';
    public const TUITION_HALF_DAY = 'half_day';

    // Transport type constants
    public const TRANSPORT_ONE_WAY = 'one_way';
    public const TRANSPORT_TWO_WAY = 'two_way';

    // Relationships
    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class);
    }

    public function transportRoute()
    {
        return $this->belongsTo(TransportRoute::class);
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Boot method for audit tracking
    protected static function boot()
    {
        parent::boot();

        // Track changes before updating
        static::updating(function ($preference) {
            // Store previous values before update
            $preference->previous_values = $preference->getOriginal();

            // Set updated_by to current user
            if (auth()->check()) {
                $preference->updated_by = auth()->id();
            }
        });
    }

    // Scopes
    public function scopeForGuardian($query, $guardianId)
    {
        return $query->where('guardian_id', $guardianId);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForTerm($query, $termId)
    {
        return $query->where('academic_term_id', $termId);
    }

    // Helper methods
    
    /**
     * Check if student uses transport
     */
    public function usesTransport(): bool
    {
        return $this->transport_route_id !== null && $this->transport_type !== null;
    }

    /**
     * Get the transport amount based on preference
     */
    public function getTransportAmount(): float
    {
        if (!$this->usesTransport() || !$this->transportRoute) {
            return 0;
        }

        return $this->transportRoute->getAmountForType($this->transport_type);
    }

    /**
     * Get or create preference for a student in a term
     */
    public static function getOrCreateForStudentTerm(int $studentId, int $termId): self
    {
        $student = Student::findOrFail($studentId);
        
        return self::firstOrCreate(
            [
                'student_id' => $studentId,
                'academic_term_id' => $termId,
            ],
            [
                'school_id' => $student->school_id,
                'guardian_id' => $student->guardian_id,
                'tuition_type' => self::TUITION_FULL_DAY,
                'include_food' => true,
                'include_sports' => true,
            ]
        );
    }

    /**
     * Get preference for a student in a term (or null if doesn't exist)
     */
    public static function getForStudentTerm(int $studentId, int $termId): ?self
    {
        return self::where('student_id', $studentId)
            ->where('academic_term_id', $termId)
            ->first();
    }
}

