<?php

namespace App\Services;

use App\Models\User;
use App\Models\ActivityLog;
use App\Helpers\PasswordGenerator;
use App\Enums\ActivityType;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;

class UserManagementService
{
    /**
     * Create a new user
     */
    public function createUser(array $data, User $creator): array
    {
        DB::beginTransaction();

        try {
            $password = null;
            $sendPasswordSetupEmail = false;

            // Handle password based on setup method
            switch ($data['password_setup_method']) {
                case 'generate':
                    // Generate temporary password and show it to admin
                    $password = PasswordGenerator::generate(12);
                    break;
                
                case 'send_email':
                    // Generate a random password (user won't know it)
                    // Laravel will handle sending the reset link
                    $password = PasswordGenerator::generate(16);
                    $sendPasswordSetupEmail = true;
                    break;
                
                case 'custom':
                    // Admin sets the password
                    $password = $data['password'];
                    break;
            }

            // Create user
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'role' => $data['role'],
                'password' => Hash::make($password),
                'created_by' => $creator->id,
                'is_active' => true,
            ]);

            // Send password setup email if requested
            if ($sendPasswordSetupEmail) {
                try {
                    // Use Laravel's built-in password reset functionality
                    $status = Password::sendResetLink([
                        'email' => $user->email,
                    ]);

                    if ($status === Password::RESET_LINK_SENT) {
                        \Log::info('Password setup email sent successfully', [
                            'user_id' => $user->id,
                            'email' => $user->email,
                            'status' => $status,
                        ]);
                    } else {
                        \Log::warning('Password reset link not sent', [
                            'user_id' => $user->id,
                            'email' => $user->email,
                            'status' => $status,
                        ]);
                    }
                    
                } catch (\Exception $e) {
                    \Log::error('Failed to send password setup email', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage(),
                    ]);
                }
                
                // Don't return password for email method
                $password = null;
            }

            // Log activity
            ActivityLog::createLog(
                ActivityType::USER_CREATED->value,
                $user->id,
                $creator->id,
                "User account created by {$creator->name}",
                [
                    'role' => $data['role'],
                    'email' => $data['email'],
                    'password_setup_method' => $data['password_setup_method'],
                ]
            );

            DB::commit();

            // Determine success message based on method
            $message = match($data['password_setup_method']) {
                'generate' => 'User created successfully. Please share the generated password securely.',
                'send_email' => "User created successfully. A password setup email has been sent to {$user->email}.",
                'custom' => 'User created successfully with custom password.',
                default => 'User created successfully.',
            };

            return [
                'success' => true,
                'user' => $user,
                'password' => $password, // Only set for 'generate' method
                'message' => $message,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Failed to create user', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update user
     */
    public function updateUser(User $user, array $data, User $updater): array
    {
        DB::beginTransaction();

        try {
            $changes = [];
            $oldValues = [];

            // Track changes
            if (isset($data['name']) && $data['name'] !== $user->name) {
                $oldValues['name'] = $user->name;
                $changes['name'] = $data['name'];
            }

            if (isset($data['email']) && $data['email'] !== $user->email) {
                $oldValues['email'] = $user->email;
                $changes['email'] = $data['email'];
            }

            if (isset($data['phone']) && $data['phone'] !== $user->phone) {
                $oldValues['phone'] = $user->phone;
                $changes['phone'] = $data['phone'];
            }

            if (isset($data['role']) && $data['role'] !== $user->role) {
                $oldValues['role'] = $user->role;
                $changes['role'] = $data['role'];
                
                // Log role change separately
                ActivityLog::createLog(
                    ActivityType::ROLE_CHANGED->value,
                    $user->id,
                    $updater->id,
                    "Role changed from {$oldValues['role']} to {$changes['role']} by {$updater->name}",
                    ['old_role' => $oldValues['role'], 'new_role' => $changes['role']]
                );
            }

            if (isset($data['is_active']) && $data['is_active'] !== $user->is_active) {
                $oldValues['is_active'] = $user->is_active;
                $changes['is_active'] = $data['is_active'];
                
                // Log activation/deactivation
                $activityType = $data['is_active'] 
                    ? ActivityType::USER_ACTIVATED->value 
                    : ActivityType::USER_DEACTIVATED->value;
                
                ActivityLog::createLog(
                    $activityType,
                    $user->id,
                    $updater->id,
                    $data['is_active'] 
                        ? "User activated by {$updater->name}" 
                        : "User deactivated by {$updater->name}",
                    null
                );
            }

            // Update user
            $user->update($changes);

            // Log general update
            if (!empty($changes)) {
                ActivityLog::createLog(
                    ActivityType::USER_UPDATED->value,
                    $user->id,
                    $updater->id,
                    "User information updated by {$updater->name}",
                    [
                        'changes' => $changes,
                        'old_values' => $oldValues,
                    ]
                );
            }

            DB::commit();

            return [
                'success' => true,
                'user' => $user->fresh(),
                'message' => 'User updated successfully',
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Reset user password (Admin reset - generates temp password)
     */
    public function resetPassword(User $user, User $admin): array
    {
        DB::beginTransaction();

        try {
            $newPassword = PasswordGenerator::generate(12);

            $user->update([
                'password' => Hash::make($newPassword),
            ]);

            // Log password reset
            ActivityLog::createLog(
                ActivityType::PASSWORD_RESET->value,
                $user->id,
                $admin->id,
                "Password reset by {$admin->name}",
                null
            );

            DB::commit();

            return [
                'success' => true,
                'password' => $newPassword,
                'message' => 'Password reset successfully. Please share the new password with the user securely.',
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to reset password: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete user (soft delete)
     */
    public function deleteUser(User $user, User $admin): array
    {
        DB::beginTransaction();

        try {
            // Log deletion
            ActivityLog::createLog(
                ActivityType::USER_DELETED->value,
                $user->id,
                $admin->id,
                "User deleted by {$admin->name}",
                [
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'user_role' => $user->role,
                ]
            );

            // Soft delete
            $user->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'User deleted successfully',
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ];
        }
    }
}