<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_number',
        'phone_number',
        'address',
        'qualification',
        'subject_specialization',
        'date_of_joining',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date_of_joining' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_teacher')
                    ->withPivot('is_class_teacher')
                    ->withTimestamps();
    }

    public function assignedGrades()
    {
        return $this->grades()->wherePivot('is_class_teacher', false);
    }

    public function classTeacherGrades()
    {
        return $this->grades()->wherePivot('is_class_teacher', true);
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

    // 🆕 NEW: Check if teacher has uploaded required documents
    public function hasRequiredDocuments()
    {
        $requiredCategories = DocumentCategory::active()
            ->forEntity('Teacher')
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
}