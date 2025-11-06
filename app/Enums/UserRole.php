<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case TEACHER = 'teacher';
    case GUARDIAN = 'guardian';
    case ACCOUNTANT = 'accountant';
    case RECEPTIONIST = 'receptionist';
    case NURSE = 'nurse';
    case IT_STAFF = 'it_staff';
    case MAID = 'maid';
    case COOK = 'cook';

    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Administrator',
            self::TEACHER => 'Teacher',
            self::GUARDIAN => 'Parent/Guardian',
            self::ACCOUNTANT => 'Accountant',
            self::RECEPTIONIST => 'Receptionist',
            self::NURSE => 'School Nurse',
            self::IT_STAFF => 'IT Staff',
            self::MAID => 'Maid',
            self::COOK => 'Cook',
        };
    }

    public static function toArray(): array
    {
        return array_map(
            fn($case) => [
                'value' => $case->value,
                'label' => $case->label()
            ],
            self::cases()
        );
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}