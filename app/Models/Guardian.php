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
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
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
}