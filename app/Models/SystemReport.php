<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use App\Models\Traits\BelongsToSchool;

class SystemReport extends Model
{
    use HasFactory, SoftDeletes, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'title',
        'report_number',
        'report_type',
        'period_start',
        'period_end',
        'period_label',
        'filters',
        'report_data',
        'summary_stats',
        'file_path',
        'file_type',
        'file_size',
        'generated_by',
        'generated_at',
        'generation_time_ms',
        'visibility',
        'download_count',
        'last_downloaded_at',
        'status',
        'error_message',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'filters' => 'array',
        'report_data' => 'array',
        'summary_stats' => 'array',
        'file_size' => 'integer',
        'generated_at' => 'datetime',
        'generation_time_ms' => 'integer',
        'download_count' => 'integer',
        'last_downloaded_at' => 'datetime',
    ];

    // Relationships
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('report_type', $type);
    }

    public function scopeForPeriod($query, $start, $end)
    {
        return $query->where('period_start', '>=', $start)
                     ->where('period_end', '<=', $end);
    }

    // Helpers
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function hasFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function hasFile(): bool
    {
        return !empty($this->file_path) && Storage::exists($this->file_path);
    }

    public function getFileSizeHuman(): string
    {
        if (!$this->file_size) {
            return 'N/A';
        }

        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function incrementDownloadCount(): void
    {
        $this->increment('download_count');
        $this->update(['last_downloaded_at' => now()]);
    }

    public function getDownloadUrl(): string
    {
        return route('reports.system.download', $this->id);
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
                $report->report_number = 'REP-' . $year . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            }

            if (empty($report->generated_at)) {
                $report->generated_at = now();
            }
        });

        // Delete file when report is deleted
        static::deleting(function ($report) {
            if ($report->file_path && Storage::exists($report->file_path)) {
                Storage::delete($report->file_path);
            }
        });
    }
}

