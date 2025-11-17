<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    public $incrementing = false;
    protected $keyType = 'string';

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'school_name',
            'school_slug',
            'trial_ends_at',
            'is_active',
        ];
    }

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Override the GeneratesIds trait's getIncrementing() method
     * to always return false since we're using custom string IDs.
     */
    public function getIncrementing()
    {
        return false;
    }

    /**
     * Override to ensure the key type is always string.
     */
    public function getKeyType()
    {
        return 'string';
    }

    public function getTenantKey()
    {
        return $this->id;
    }


}
