<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\Traits\BelongsToSchool;

class Student extends Model
{
    use HasFactory, BelongsToSchool;

    protected $appends = ['profile_picture_url'];

    protected $fillable = [
        'school_id',
        'admission_number',
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'guardian_id',
        'grade_id',
        'class_name', // Deprecated, use grade relationship
        'enrollment_date',
        'status',
        'profile_picture',
        'deactivated_at',
        'deactivation_reason',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth'  => 'date',
            'enrollment_date' => 'date',
            'deactivated_at'  => 'datetime',
        ];
    }

    protected function profilePictureUrl(): Attribute
    {
        return Attribute::get(function () {
            if (!$this->profile_picture) {
                return null;
            }

            try {
                return Storage::disk('r2_private')->temporaryUrl($this->profile_picture, now()->addMinutes(30));
            } catch (\Throwable $e) {
                Log::warning('Failed to build student profile picture URL', [
                    'student_id' => $this->id,
                    'error' => $e->getMessage(),
                ]);

                return null;
            }
        });
    }

    // ── Deactivation helpers ──────────────────────────────────────────────────

    public function deactivate(?string $reason = null): void
    {
        $this->update([
            'status'              => 'inactive',
            'deactivated_at'      => now(),
            'deactivation_reason' => $reason,
        ]);
    }

    public function reactivate(): void
    {
        $this->update([
            'status'              => 'active',
            'deactivated_at'      => null,
            'deactivation_reason' => null,
        ]);
    }

    // Legacy relationship - kept for backward compatibility
    // Use guardians() for new code
    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    // Many-to-many relationship with guardians
    public function guardians()
    {
        return $this->belongsToMany(Guardian::class, 'guardian_student')
            ->withPivot(['relationship', 'is_primary', 'can_receive_invoices', 'can_pickup', 'emergency_contact'])
            ->withTimestamps();
    }

    // Get primary guardian
    public function primaryGuardian()
    {
        return $this->guardians()->wherePivot('is_primary', true)->first();
    }

    // Get guardians who can receive invoices
    public function invoiceGuardians()
    {
        return $this->guardians()->wherePivot('can_receive_invoices', true);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function examResults()
    {
        return $this->hasMany(ExamResult::class);
    }

    public function reportComments()
    {
        return $this->hasMany(ReportComment::class);
    }

    public function quranHomework()
    {
        return $this->hasMany(QuranHomework::class);
    }

    public function pendingQuranHomework()
    {
        return $this->hasMany(QuranHomework::class)
            ->where('status', 'pending');
    }

    public function quranSchedules()
    {
        return $this->hasMany(QuranSchedule::class);
    }

    public function activeQuranSchedule()
    {
        return $this->hasOne(QuranSchedule::class)
            ->where('is_active', true)
            ->latest('start_date');
    }

    // Fee preferences relationship
    public function feePreferences()
    {
        return $this->hasMany(GuardianFeePreference::class);
    }

    // 🆕 NEW: Documents relationship
    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // 🆕 NEW: Helper to get documents by category
    public function getDocumentsByCategory($categorySlug)
    {
        return $this->documents()
                    ->whereHas('category', function ($query) use ($categorySlug) {
                        $query->where('slug', $categorySlug);
                    })
                    ->get();
    }

    // 🆕 NEW: Check if student has uploaded required documents
    public function hasRequiredDocuments()
    {
        $requiredCategories = DocumentCategory::active()
            ->forEntity('Student')
            ->required()
            ->count();

        $uploadedVerifiedDocs = $this->documents()
            ->verified()
            ->whereHas('category', function ($query) {
                $query->where('is_required', true);
            })
            ->distinct('document_category_id')
            ->count('document_category_id');

        return $uploadedVerifiedDocs >= $requiredCategories;
    }

    // EXISTING HELPERS
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getGradeNameAttribute(): string
    {
        return $this->grade ? $this->grade->name : ($this->class_name ?? 'N/A');
    }

    public function getAttendanceStats($startDate = null, $endDate = null)
    {
        $query = $this->attendances();

        if ($startDate && $endDate) {
            $query->whereBetween('attendance_date', [$startDate, $endDate]);
        }

        $allRecords = $query->get();

        $total = $allRecords->count();
        $present = $allRecords->where('status', 'present')->count();
        $absent = $allRecords->where('status', 'absent')->count();
        $late = $allRecords->where('status', 'late')->count();
        $excused = $allRecords->where('status', 'excused')->count();

        return [
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
        ];
    }

    public function getTermResults($term, $academicYear)
    {
        return $this->examResults()
            ->whereHas('exam', function ($query) use ($term, $academicYear) {
                $query->where('term', $term)
                    ->where('academic_year', $academicYear);
            })
            ->with(['exam.subject'])
            ->get();
    }
}