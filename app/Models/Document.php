<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'document_category_id',
        'documentable_type',
        'documentable_id',
        'original_filename',
        'stored_filename',
        'file_path',
        'mime_type',
        'file_size',
        'status',
        'rejection_reason',
        'expiry_date',
        'uploaded_by',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'verified_at' => 'datetime',
        'file_size' => 'integer',
    ];

    protected $appends = ['file_size_human', 'is_expired', 'days_until_expiry'];

    // Relationships
    public function category()
    {
        return $this->belongsTo(DocumentCategory::class, 'document_category_id');
    }

    public function documentable()
    {
        return $this->morphTo();
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired')
                     ->orWhere(function ($q) {
                         $q->whereNotNull('expiry_date')
                           ->where('expiry_date', '<', now());
                     });
    }

    public function scopeExpiringWithin($query, $days)
    {
        return $query->whereNotNull('expiry_date')
                     ->where('expiry_date', '>', now())
                     ->where('expiry_date', '<=', now()->addDays($days));
    }

    public function scopeForEntity($query, $entityType, $entityId)
    {
        return $query->where('documentable_type', $entityType)
                     ->where('documentable_id', $entityId);
    }

    // Accessors
    public function getFileSizeHumanAttribute()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getIsExpiredAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        
        return $this->expiry_date->isPast();
    }

    public function getDaysUntilExpiryAttribute()
    {
        if (!$this->expiry_date) {
            return null;
        }
        
        return now()->diffInDays($this->expiry_date, false);
    }

    // Helpers
    public function markAsVerified(User $verifier)
    {
        $this->update([
            'status' => 'verified',
            'verified_by' => $verifier->id,
            'verified_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    public function markAsRejected(User $verifier, string $reason)
    {
        $this->update([
            'status' => 'rejected',
            'verified_by' => $verifier->id,
            'verified_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    public function checkAndUpdateExpiry()
    {
        if ($this->expiry_date && $this->expiry_date->isPast() && $this->status !== 'expired') {
            $this->update(['status' => 'expired']);
        }
    }

    public function getDownloadUrl()
    {
        return route('documents.download', $this->id);
    }

    public function getPreviewUrl()
    {
        return route('documents.preview', $this->id);
    }

    // Delete file from storage when model is deleted
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($document) {
            if (Storage::exists($document->file_path)) {
                Storage::delete($document->file_path);
            }
        });
    }
}