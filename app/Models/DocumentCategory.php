<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DocumentCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'entity_type',
        'is_required',
        'description',
        'max_file_size',
        'allowed_extensions',
        'expires',
        'expiry_alert_days',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'allowed_extensions' => 'array',
        'is_required' => 'boolean',
        'expires' => 'boolean',
        'max_file_size' => 'integer',
        'expiry_alert_days' => 'integer',
        'sort_order' => 'integer',
    ];

    // Relationships
    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    // Auto-generate slug from name
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });

        static::updating(function ($category) {
            if ($category->isDirty('name') && empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForEntity($query, $entityType)
    {
        return $query->where(function ($q) use ($entityType) {
            $q->where('entity_type', $entityType)
              ->orWhereNull('entity_type');
        });
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    // Helpers
    public function getMaxFileSizeInMBAttribute()
    {
        return round($this->max_file_size / 1024, 2);
    }

    public function isValidFileExtension($extension)
    {
        if (empty($this->allowed_extensions)) {
            return true;
        }

        return in_array(strtolower($extension), array_map('strtolower', $this->allowed_extensions));
    }

    public function isValidFileSize($sizeInBytes)
    {
        return $sizeInBytes <= ($this->max_file_size * 1024);
    }

    public function getAllowedExtensionsString()
    {
        return $this->allowed_extensions ? implode(', ', $this->allowed_extensions) : 'All types';
    }
}