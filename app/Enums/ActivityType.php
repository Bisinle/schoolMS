<?php

namespace App\Enums;

enum ActivityType: string
{
    case USER_CREATED = 'user_created';
    case USER_UPDATED = 'user_updated';
    case USER_DELETED = 'user_deleted';
    case USER_ACTIVATED = 'user_activated';
    case USER_DEACTIVATED = 'user_deactivated';
    case PASSWORD_RESET = 'password_reset';
    case PASSWORD_CHANGED = 'password_changed';
    case ROLE_CHANGED = 'role_changed';
    case LOGIN = 'login';
    case LOGOUT = 'logout';
    case FAILED_LOGIN = 'failed_login';

    public function label(): string
    {
        return match($this) {
            self::USER_CREATED => 'User Created',
            self::USER_UPDATED => 'User Updated',
            self::USER_DELETED => 'User Deleted',
            self::USER_ACTIVATED => 'User Activated',
            self::USER_DEACTIVATED => 'User Deactivated',
            self::PASSWORD_RESET => 'Password Reset',
            self::PASSWORD_CHANGED => 'Password Changed',
            self::ROLE_CHANGED => 'Role Changed',
            self::LOGIN => 'Login',
            self::LOGOUT => 'Logout',
            self::FAILED_LOGIN => 'Failed Login Attempt',
        };
    }
}