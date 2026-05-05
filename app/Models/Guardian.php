<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class Guardian extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'user_id',
        'guardian_number',
        'phone_number',
        'address',
        'occupation',
        'relationship',
        'status',
        'deactivated_at',
        'deactivation_reason',
    ];

    protected function casts(): array
    {
        return [
            'deactivated_at' => 'datetime',
        ];
    }

    // ── Deactivation helpers ──────────────────────────────────────────────────

    /**
     * Deactivate this guardian and cascade to all linked students.
     */
    public function deactivate(?string $reason = null): void
    {
        $this->update([
            'status'               => 'inactive',
            'deactivated_at'       => now(),
            'deactivation_reason'  => $reason,
        ]);

        // Cascade: deactivate every linked student
        $this->studentsMany()->update([
            'status'              => 'inactive',
            'deactivated_at'      => now(),
            'deactivation_reason' => $reason ?? 'Guardian deactivated',
        ]);
    }

    /**
     * Reactivate this guardian (students remain inactive until manually reactivated).
     */
    public function reactivate(): void
    {
        $this->update([
            'status'              => 'active',
            'deactivated_at'      => null,
            'deactivation_reason' => null,
        ]);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Legacy relationship - kept for backward compatibility
    // Use studentsMany() for new code
    public function students()
    {
        return $this->hasMany(Student::class);
    }

    // Many-to-many relationship with students
    public function studentsMany()
    {
        return $this->belongsToMany(Student::class, 'guardian_student')
            ->withPivot(['relationship', 'is_primary', 'can_receive_invoices', 'can_pickup', 'emergency_contact'])
            ->withTimestamps();
    }

    // Get students where this guardian is primary
    public function primaryStudents()
    {
        return $this->studentsMany()->wherePivot('is_primary', true);
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

    // 🆕 NEW: Check if guardian has uploaded required documents
    public function hasRequiredDocuments()
    {
        $requiredCategories = DocumentCategory::active()
            ->forEntity('Guardian')
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

    // Fee Management relationships
    public function invoices()
    {
        return $this->hasMany(GuardianInvoice::class);
    }

    public function feeAdjustments()
    {
        return $this->hasMany(GuardianFeeAdjustment::class);
    }

    // Quran tracking relationships
    public function quranHomePractice()
    {
        return $this->hasMany(QuranHomePractice::class);
    }

    // Helper to get current term invoice
    public function getCurrentTermInvoice()
    {
        $currentTerm = AcademicTerm::where('school_id', $this->school_id)
            ->where('is_active', true)
            ->first();

        if (!$currentTerm) {
            return null;
        }

        return $this->invoices()
            ->where('academic_term_id', $currentTerm->id)
            ->first();
    }

    // Helper to get payment status for current term
    public function getPaymentStatus()
    {
        $invoice = $this->getCurrentTermInvoice();

        if (!$invoice) {
            return null;
        }

        return $invoice->status;
    }

    // Accessor methods to get user data
    public function getFullNameAttribute()
    {
        return $this->user?->name ?? 'N/A';
    }

    public function getEmailAttribute()
    {
        return $this->user?->email ?? 'N/A';
    }

    public function getPhoneAttribute()
    {
        return $this->user?->phone ?? $this->phone_number ?? 'N/A';
    }
}